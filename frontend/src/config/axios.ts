import axios from "axios";

export const BASE_URL = import.meta.env.MODE !== "production" ? "http://localhost:3000" : "";

//baseURL: process.env.NODE_ENV !== "production" ? "http://localhost:3000/api" : "/api",

//Socket.IO runs on its own Bun-native server (see backend/src/config/socket.ts), a different port
//from the Express API in dev; in production a reverse proxy path-routes /socket.io/ to it under
//the same origin, so BASE_URL itself is correct there
export const SOCKET_URL = import.meta.env.MODE !== "production" ? "http://localhost:3001" : BASE_URL;

export const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
});
