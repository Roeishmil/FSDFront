import axios from "axios";

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
  creatExam: async () => {
    const response = await api.get("/gpt/generate-exam");
    return response.data;
  },
};

export const userApi = {
  register: async (data: any) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },
};

export default api;
