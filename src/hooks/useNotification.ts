import axios, { AxiosInstance } from "axios";
import { log } from "console";

// טיפוס להתראה
export type Notification = {
  _id: string;
  subjectId: string;
  day: string;
  time: {
    hour: number;
    minute: number;
  };
  userId: string;
};
export type Subject = {
  _id: string;
  title: string;
  description?: string;
  userId: string;
  resultsId: string[];
};


// יצירת Axios instance
const api: AxiosInstance = axios.create({
  baseURL: "http://localhost:3000",
});

// הוספת טוקן לבקשות יוצאות
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `JWT ${token}`;
  }
  return config;
});

// שירותי התראות
export const notificationService = {
  getNotificationsByUserId: (userId: string) => {
    return api.get<Notification[]>(`/notifications/user/${userId}`);
  },

  createNotification: (data: Omit<Notification, "_id">) => {
    console.log(data);
    
    return api.post<Notification>("/notifications", data);
  },

  deleteNotification: (notificationId: string) => {
    return api.delete(`/notifications/${notificationId}`);
  },

  getSubjectsByUserId: (userId: string) => {
    return api.get<Subject[]>(`/subjects/user/${userId}`);
  },

  getSubjectById: (subjectId: string) => {
    return api.get<Subject>(`/subjects/${subjectId}`);
  }
};