import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { IUser } from "../Interfaces";
import { useUser as useUserContext } from "../context/UserContext";

export interface UserContextType {
  user: IUser | null;
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL, // Fixed: should be VITE_BASE_URL
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
    
    // Better error handling - check if response exists
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        
        const response = await api.post("/refresh", { token: refreshToken });
        const newAccessToken = response.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);
        api.defaults.headers.common["Authorization"] = `JWT ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear tokens if refresh fails
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        localStorage.clear();
        // Optionally redirect to login
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

const userService = {
  login: (data: FormData) => {
    const controller = new AbortController();
    const request = api.post<IUser>("/auth/login", data, {
      signal: controller.signal,
    });
    return { request, abort: () => controller.abort() };
  },
  updateUser: (userData: IUser) => {
    return api.put<IUser>(`/users/${userData._id}`, userData);
  },
  getUser: (userId: string) => {
    return api.get<IUser>(`/users/${userId}`);
  },
};

const useUser = (data?: any) => {
  const { user, setUser } = useUserContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Get current user ID from multiple sources
  const getCurrentUserId = useCallback(() => {
    // Priority: passed data, current user context, localStorage user object, localStorage userId
    if (data?._id) return data._id;
    if (user?._id) return user._id;
    
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        return parsed._id;
      } catch (e) {
        console.warn("Failed to parse stored user data");
      }
    }
    
    return localStorage.getItem("userId");
  }, [data?._id, user?._id]);

  // Fetch user data from server
  const fetchUser = useCallback(async (userId?: string) => {
    const targetUserId = userId || getCurrentUserId();
    
    if (!targetUserId) {
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.getUser(targetUserId);
      const userData = response.data;
      
      // Update context and localStorage
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("userId", userData._id);
      
      console.log("User data fetched successfully:", {
        userId: userData._id,
        hasImage: !!userData.imgUrl,
        imagePreview: userData.imgUrl ? userData.imgUrl.substring(0, 50) + '...' : 'none'
      });
      
      return userData;
    } catch (error) {
      const errorMessage = axios.isAxiosError(error) 
        ? error.response?.data?.message || error.message 
        : String(error);
      
      console.error("Failed to fetch user:", error);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentUserId, setUser]);

  // Force refetch user data (useful after image upload)
  const refetchUser = useCallback(async () => {
    console.log("Refetching user data...");
    return await fetchUser();
  }, [fetchUser]);

  // Initialize user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && !user) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        console.log("User loaded from localStorage:", {
          userId: parsed._id,
          hasImage: !!parsed.imgUrl
        });
      } catch (e) {
        console.warn("Failed to parse stored user data, will fetch from server");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, [setUser, user]);

  // Fetch fresh user data when data._id is provided or changes
  useEffect(() => {
    if (data?._id) {
      fetchUser(data._id);
    }
  }, [data?._id, fetchUser]);

  // Update user data
  const updateUser = useCallback(async (userData: IUser) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Updating user:", {
        userId: userData._id,
        hasImage: !!userData.imgUrl,
        fields: Object.keys(userData)
      });
      
      const response = await userService.updateUser(userData);
      const updatedUser = response.data;
      
      // Update context and localStorage
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      localStorage.setItem("userId", updatedUser._id);
      
      console.log("User updated successfully:", {
        userId: updatedUser._id,
        hasImage: !!updatedUser.imgUrl,
        imagePreview: updatedUser.imgUrl ? updatedUser.imgUrl.substring(0, 50) + '...' : 'none'
      });
      
      return updatedUser;
    } catch (error) {
      const errorMessage = axios.isAxiosError(error) 
        ? error.response?.data?.message || error.message 
        : String(error);
      
      console.error("Failed to update user:", error);
      setError(errorMessage);
      throw error; // Re-throw so calling code can handle it
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  // Clear user data (for logout)
  const clearUser = useCallback(() => {
    setUser(null);
    setError(null);
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }, [setUser]);

  return { 
    user, 
    setUser, 
    error, 
    setError, 
    isLoading, 
    setIsLoading, 
    updateUser,
    fetchUser,
    refetchUser,
    clearUser,
    getCurrentUserId
  };
};

export default useUser;