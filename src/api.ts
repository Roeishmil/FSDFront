import axios from "axios";
import { IUser, ISubject, INotification } from "./Interfaces";

const BASE_URL = import.meta.env.VITE_BASE_URL;
//console.log('url', BASE_URL);

// Cache for promises to prevent duplicate requests
let examPromise: Promise<string> | null = null;
let summaryPromise: Promise<string> | null = null;

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

// Process queued requests after refresh
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Utility function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    // Add 30 second buffer to account for clock skew
    return payload.exp < (currentTime + 30);
  } catch (error) {
    console.error('Error parsing token:', error);
    return true;
  }
};

// Force logout function
const forceLogout = () => {
  // Clear all stored tokens and user data
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  
  // Reset refresh state
  isRefreshing = false;
  failedQueue = [];
  
  // Redirect to login page
  window.location.href = '/';
};

// Check if we should attempt token refresh
const shouldAttemptRefresh = (): boolean => {
  const refreshToken = localStorage.getItem("refreshToken");
  return refreshToken && !isTokenExpired(refreshToken);
};

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Set a reasonable timeout (5 minutes)
  timeout: 300000,
});

// Request interceptor - add token to requests
api.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem("accessToken");
    
    if (accessToken) {
      // Check if access token is expired before making request
      if (isTokenExpired(accessToken)) {
        // Don't add expired token, let response interceptor handle refresh
        console.log('Access token expired, will refresh on response');
      } else {
        config.headers.Authorization = `JWT ${accessToken}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If the request was aborted or timed out, don't retry
    if (error.code === "ECONNABORTED" || axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    
    // Handle 401 Unauthorized responses
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if we should attempt refresh
      if (!shouldAttemptRefresh()) {
        console.log('Refresh token expired or missing, forcing logout');
        forceLogout();
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `JWT ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        console.log('Attempting token refresh...');
        
        const response = await api.post("/refresh", { token: refreshToken });
        const newAccessToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshToken;
        
        // Update stored tokens
        localStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }
        
        // Update default authorization header
        api.defaults.headers.common["Authorization"] = `JWT ${newAccessToken}`;
        
        // Process queued requests
        processQueue(null, newAccessToken);
        
        console.log('Token refresh successful');
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `JWT ${newAccessToken}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Process queued requests with error
        processQueue(refreshError, null);
        
        // Force logout on refresh failure
        forceLogout();
        
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// Add periodic token validation (runs every 5 minutes)
const startTokenValidation = () => {
  setInterval(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    
    // If no tokens, user is not logged in
    if (!accessToken && !refreshToken) {
      return;
    }
    
    // If both tokens are expired, force logout
    if ((!accessToken || isTokenExpired(accessToken)) && 
        (!refreshToken || isTokenExpired(refreshToken))) {
      console.log('Both tokens expired, forcing logout');
      forceLogout();
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
};

// Start token validation when module loads
startTokenValidation();

export const userService = {
  updateUser: (userData: IUser) => {
    return api.put<IUser>(`/users/${userData._id}`, userData);
  },
  getUser: (userId: string) => {
    return api.get<IUser>(`/users/${userId}`);
  },
};

export const fileApi = {
  // Convert file to base64 and send as JSON
  uploadFile: async (formData: FormData, userId: string) => {
    const file = formData.get("file") as File;
    if (!file) {
      throw new Error('No file selected');
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}bytes`);

    // Convert file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Send as regular JSON instead of FormData
    return api.put(`/users/${userId}`, {
      imgUrl: base64
    }, {
      headers: {
        "Content-Type": "application/json",
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
  fetchSharedContent: async () => {
    try {
      const response = await api.get(`/content/shared`);
      return response.data;
    } catch (error) {
      console.error("Error in createContent:", error);
      throw error;
    }
  },
  updateContent: async (contentId: string, data: { title?: string; subject?: string; shared?: boolean }) => {
    try {
      const response = await api.put(`/content/${contentId}`, data);
      return response.data;
    } catch (error) {
      console.error("Error in updateContent:", error);
      throw error;
    }
  },
  // New method for soft deleting content
  deleteContent: async (contentId: string) => {
    try {
      const response = await api.delete(`/content/${contentId}`);
      return response.data;
    } catch (error) {
      console.error("Error in deleteContent:", error);
      throw error;
    }
  },
  // New method for restoring deleted content
  restoreContent: async (contentId: string) => {
    try {
      const response = await api.put(`/content/${contentId}/restore`);
      return response.data;
    } catch (error) {
      console.error("Error in restoreContent:", error);
      throw error;
    }
  },
  // New method for fetching deleted content
  fetchDeletedContent: async (userId: any) => {
    try {
      const response = await api.get(`/content/user/${userId}/deleted`);
      return response.data;
    } catch (error) {
      console.error("Error in fetchDeletedContent:", error);
      throw error;
    }
  },
  // New method for permanent deletion (admin use)
  permanentlyDeleteContent: async (contentId: string) => {
    try {
      const response = await api.delete(`/content/${contentId}/permanent`);
      return response.data;
    } catch (error) {
      console.error("Error in permanentlyDeleteContent:", error);
      throw error;
    }
  },
}

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

export const notificationApi = {
  getNotificationsByUserId: async (userId: string): Promise<INotification[]> => {
    const response = await api.get(`/notifications/user/${userId}`);
    return response.data;
  },

  createNotification: async (data: Omit<INotification, "_id">): Promise<INotification> => {
    const response = await api.post(`/notifications`, data);
    return response.data;
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },

  getSubjectsByUserId: async (userId: string): Promise<ISubject[]> => {
    const response = await api.get(`/subjects/user/${userId}`);
    return response.data;
  },

  getSubjectById: async (subjectId: string): Promise<ISubject> => {
    const response = await api.get(`/subjects/${subjectId}`);
    return response.data;
  },
};

// Export utility functions for external use
export const tokenUtils = {
  isTokenExpired,
  forceLogout,
  shouldAttemptRefresh,
};

export default {
  api,
  examApi,
  summaryApi,
  userApi,
  userService,
  fileApi,
  subjectsApi,
  notificationApi,
  tokenUtils
};