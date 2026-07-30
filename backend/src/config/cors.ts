import { ENV } from "./env";

const { CLIENT_URL } = ENV;

export const CORS_POLICY = {
  origin: CLIENT_URL,
  credentials: true,
} as const;
