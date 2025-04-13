import axios from "axios";
import { time } from "console";
import { register } from "module";
import { IUser } from "./Interfaces";

const BASE_URL = "http://localhost:3000";


let examPromise: Promise<string> | null = null;
let summaryPromise: Promise<string> | null = null;


export const api = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `JWT ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      const response = await api.post("/refresh", { token: refreshToken });
      const newAccessToken = response.data.accessToken;
      localStorage.setItem("accessToken", newAccessToken);
      api.defaults.headers.common["Authorization"] = `JWT ${newAccessToken}`;
      return api(originalRequest);
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
  creatExam: (formData: FormData): Promise<string> => {
    // If there is already a pending request, return its promise
    if (examPromise) return examPromise;
    examPromise = axios
      .post(`${BASE_URL}/gpt/upload-and-generate-exam`, formData, {
        responseType: "text",
        timeout: 300000,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then((response) => {
        examPromise = null; // reset after completion
        return response.data;
      })
      .catch((error) => {
        examPromise = null; // reset on error
        throw error;
      });
    return examPromise;
  },
};

export const summaryApi = {
  creatSummary: (): Promise<string> => {
    if (summaryPromise) return summaryPromise;
    summaryPromise = axios
      .get(`${BASE_URL}/gpt/generate-summary`, { responseType: "text",
        timeout: 300000})
      .then((response) => {
        summaryPromise = null;
        return response.data;
      })
      .catch((error) => {
        summaryPromise = null;
        throw error;
      });
    return summaryPromise;
  },
};

export const userApi = {
  register: async (data: any) => {
    const response = await api.post(`${BASE_URL}/auth/register`, data);
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
