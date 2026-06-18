import { ENV } from "./env";

const { CLIENT_URL } = ENV;

//cors policy, used by both socketIO and for standard http requests

export const CORS = {
  origin: CLIENT_URL,
  credentials: true,
} as const;
