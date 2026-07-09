import axios from "axios";

//this is used for SocketIO connections as well
export const BASE_URL = import.meta.env.MODE !== "production" ? "http://localhost:3000" : "";

//baseURL: process.env.NODE_ENV !== "production" ? "http://localhost:3000/api" : "/api",

export const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
});
