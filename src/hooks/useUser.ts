import { useState, useEffect } from "react";
import axios from "axios";
import { IUser } from "../Interfaces";
import { useUser as useUserContext } from "../context/UserContext";

export interface UserContextType {
  user: IUser | null;
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
}

const api = axios.create({
  baseURL: "http://localhost:3000",
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

const useUser = (data?: IUser) => {
  const { user, setUser } = useUserContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, [setUser]);

  useEffect(() => {
    if (data?._id) {
      setIsLoading(true);
      const request = userService.getUser(data._id);
      const abort = () => {};
      request
        .then((res) => {
          setUser(res.data);
          setIsLoading(false);
        })
        .catch((error) => {
          if (!axios.isCancel(error)) {
            if (axios.isAxiosError(error)) {
              if (error instanceof Error) {
                setError(error.message);
              } else {
                setError(String(error));
              }
            } else {
              setError(String(error));
            }
            setIsLoading(false);
          }
        });
      return abort;
    }
  }, [data?._id]);

  const updateUser = async (userData: IUser) => {
    try {
      setIsLoading(true);
      const response = await userService.updateUser(userData);
      setUser(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
      setIsLoading(false);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(String(error));
      }
      setIsLoading(false);
      return null;
    }
  };

  return { user, setUser, error, setError, isLoading, setIsLoading, updateUser };
};

export default useUser;
