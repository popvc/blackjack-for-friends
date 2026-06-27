import { axiosInstance } from "@/config/axios";
import type { AxiosError } from "axios";
import axios from "axios";
import { create } from "zustand";

const NO_USER = 0;

const initialState = {
  authUserId: NO_USER,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isLoggingOut: false,
};

//these should have DTOs, or at least types that correspond with the backend
type AuthState = typeof initialState & {
  resetState: () => void;
  checkAuth: () => Promise<void>;
  signup: (data: any) => Promise<void>;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
};

//is this appropriate?
function handleAxiosError(error: unknown) {
  if (axios.isAxiosError(error)) {
    console.log(error.response?.data.message);
  } else {
    console.error(error);
  }
  console.error(error);
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  ...initialState,

  resetState: () => set(initialState),

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUserId: res.data });
    } catch (e: unknown) {
      handleAxiosError(e);

      set({ authUserId: NO_USER });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  signup: async (data: any) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUserId: res.data });
    } catch (e: unknown) {
      handleAxiosError(e);
    } finally {
      set({ isSigningUp: false });
    }
  },
  login: async (data: any) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUserId: res.data });
    } catch (e) {
      handleAxiosError(e);
    } finally {
      set({ isLoggingIn: false });
    }
  },
  logout: async () => {
    set({ isLoggingOut: true });
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUserId: NO_USER });
    } catch (e: unknown) {
      handleAxiosError(e);
    } finally {
      set({ isLoggingOut: false });
    }
  },
}));
