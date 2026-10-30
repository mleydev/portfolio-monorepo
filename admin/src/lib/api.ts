import axios from "axios";

const BASE_URL = "http://localhost:4000/api/v1";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  } else if (config.data && !config.headers.get("Content-Type")) {
    config.headers.set("Content-Type", "application/json");
  }

  return config;
});

export default api;
