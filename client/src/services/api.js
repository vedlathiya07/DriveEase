import axios from "axios";

const configuredBaseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const API_BASE_URL = configuredBaseUrl;

const API = axios.create({
  baseURL: configuredBaseUrl ? `${configuredBaseUrl}/api` : "/api",
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("driveease:auth-expired"));
      }
    }

    return Promise.reject(error);
  },
);

export default API;
