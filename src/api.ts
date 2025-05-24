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
  // FIXED: Update to use PUT instead of POST since we're updating a user
  uploadFile: (formData: FormData, userId: string) => {
    // Debug log the file being uploaded
    const file = formData.get("file") as File;
    if (file) {
      console.log(`Uploading file: ${file.name}, type: ${file.type}, size: ${file.size}bytes`);
    }

    // We need to use PUT since we're updating the user record
    // According to usersRoute.js, PUT route is /users/:id
    return api.put(`/users/${userId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const examApi = {
  /**
   * Generate exam content.
   * Sends a POST request with a FormData object containing the prompt and file.
   *
   * @param formData A FormData object containing the prompt and file.
   * @returns A promise that resolves with the exam HTML.
   */
  creatExam: async (formData: FormData): Promise<string> => {
    try {
      const response = await api.post("/gpt/upload-and-generate-exam", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error in creatExam:", error);
      throw error;
    }
  },
};

export const summaryApi = {
  /**
   * Generate summary content.
   * Sends a POST request with a FormData object containing the prompt and file.
   *
   * @param formData A FormData object containing the prompt and file.
   * @returns A promise that resolves with the summary HTML.
   */
  creatSummary: async (formData: FormData): Promise<string> => {
    try {
      const response = await api.post("/gpt/upload-and-generate-summary", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error in creatSummary:", error);
      throw error;
    }
  },
};

export const contentApi = {
  createContent: async (formData: any) => {
    try {
      const response = await api.post("/content", formData);
      return response.data;
    } catch (error) {
      console.error("Error in createContent:", error);
      throw error;
    }
  },
  fetchContent: async (userId: string, subjectId?: string) => {
    try {
      const params = subjectId ? { subjectId } : {};
      const response = await api.get(`/content/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      console.error("Error in fetchContent:", error);
      throw error;
    }
  },
  updateContent: async (contentId: string, data: { title?: string; subject?: string }) => {
    try {
      const response = await api.put(`/content/${contentId}`, data);
      return response.data;
    } catch (error) {
      console.error("Error in updateContent:", error);
      throw error;
    }
  },
};

export const subjectsApi = {
  fetchSubjects: async (userId: any) => {
    const response = await api.get(`/subjects/user/${userId}`);
    return response.data;
  },
  createSubject: async (data: { title: string; description?: string }) => {
    const response = await api.post("/subjects", data);
    return response.data;
  },
  deleteSubject: async (subjectId: string) => {
    const response = await api.delete(`/subjects/${subjectId}`);
    return response.data;
  },
  updateSubject: async (subjectId: string, data: { title: string; description?: string }) => {
    const response = await api.put(`/subjects/${subjectId}`, data);
    return response.data;
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
  subjectsApi,
};
