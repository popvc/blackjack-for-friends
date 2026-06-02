import { ENV } from "./env";

export const CORS = {
  origin: ENV.CLIENT_URL,
  credentials: true,
} as const;
