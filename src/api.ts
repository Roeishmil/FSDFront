import axios from "axios";
import { IUser } from "./Interfaces";

const BASE_URL = "http://localhost:3000";

// Cache for promises to prevent duplicate requests
let examPromise: Promise<string> | null = null;
let summaryPromise: Promise<string> | null = null;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Set a reasonable timeout (5 minutes)
  timeout: 300000,
});

api.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `JWT ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If the request was aborted or timed out, don't retry
    if (error.code === "ECONNABORTED" || axios.isCancel(error)) {
      return Promise.reject(error);
    }
    
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await api.post("/refresh", { token: refreshToken });
        const newAccessToken = response.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);
        api.defaults.headers.common["Authorization"] = `JWT ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, reject with the original error
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export const userService = {
  updateUser: (userData: IUser) => {
    return api.put<IUser>(`/users/${userData._id}`, userData);
  },
  getUser: (userId: string) => {
    return api.get<IUser>(`/users/${userId}`);
  },
};

export const fileApi = {
  uploadFile: (formData: any) => {
    return api.post(`/users/${formData.username}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const examApi = {
  /**
   * Generate exam content.
   * If a custom prompt is provided (nonempty string), a GET request is sent with the prompt query parameter.
   * Otherwise, a cached GET request is used.
   *
   * @param customPrompt Optional custom prompt for exam generation.
   * @returns A promise that resolves with the exam HTML.
   */
  creatExam: async (customPrompt: string = ""): Promise<string> => {
    // Cancel any previous request if a new one is made
    if (examPromise !== null) {
      // We can't directly cancel the promise, but we can set it to null
      // so subsequent calls will create a new request
      examPromise = null;
    }

    try {
      if (customPrompt && customPrompt.trim().length > 0) {
        // Append the prompt as a query parameter
        const response = await api.get("/gpt/generate-exam", {
          params: { prompt: customPrompt },
          responseType: "text",
        });
        return response.data;
      } else {
        // Create a new promise for the request
        examPromise = api
          .get("/gpt/generate-exam", { responseType: "text" })
          .then((response) => {
            examPromise = null;
            return response.data;
          })
          .catch((error) => {
            examPromise = null;
            throw error;
          });
        return examPromise;
      }
    } catch (error) {
      console.error("Error in creatExam:", error);
      throw error;
    }
  },
};

export const summaryApi = {
  /**
   * Generate summary content.
   * If a custom prompt is provided (nonempty string), a GET request is sent with the prompt query parameter.
   * Otherwise, a cached GET request is used.
   *
   * @param customPrompt Optional custom prompt for summary generation.
   * @returns A promise that resolves with the summary HTML.
   */
  creatSummary: async (customPrompt: string = ""): Promise<string> => {
    // Cancel any previous request if a new one is made
    if (summaryPromise !== null) {
      summaryPromise = null;
    }

    try {
      if (customPrompt && customPrompt.trim().length > 0) {
        const response = await api.get("/gpt/generate-summary", {
          params: { prompt: customPrompt },
          responseType: "text",
        });
        return response.data;
      } else {
        summaryPromise = api
          .get("/gpt/generate-summary", { responseType: "text" })
          .then((response) => {
            summaryPromise = null;
            return response.data;
          })
          .catch((error) => {
            summaryPromise = null;
            throw error;
          });
        return summaryPromise;
      }
    } catch (error) {
      console.error("Error in creatSummary:", error);
      throw error;
    }
  },
};

export const userApi = {
  register: async (data: any) => {
    const response = await api.post(`/auth/register`, data);
    return response.data;
  },
};

export default {
  api,
  examApi,
  summaryApi,
  userApi,
  userService,
  fileApi,
};