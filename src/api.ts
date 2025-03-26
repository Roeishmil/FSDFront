import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

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
