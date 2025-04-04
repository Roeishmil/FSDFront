import axios from "axios";
import { time } from "console";
import { register } from "module";

const BASE_URL = "http://localhost:3000";


let examPromise: Promise<string> | null = null;
let summaryPromise: Promise<string> | null = null;


export const api = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

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
  creatExam: (): Promise<string> => {
    // If there is already a pending request, return its promise
    if (examPromise) return examPromise;
    examPromise = axios
      .get(`${BASE_URL}/gpt/generate-exam`, { responseType: "text",
        timeout: 300000})
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
  fileApi,
};
