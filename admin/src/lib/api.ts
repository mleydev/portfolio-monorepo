import axios from "axios";

const BASE_URL = "http://localhost:4000/api/v1";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
