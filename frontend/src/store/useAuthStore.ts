import axios from "axios";
import { create } from "zustand";
import { axiosInstance } from "../config/axios";
import type { LoginData, SignupData } from "../types/auth";

const UNAUTHENTICATED = null;

type AuthState = {
  authUserId: string | null;
  isCheckingAuth: boolean,
  isSigningUp: boolean,
  isLoggingIn: boolean,
  isLoggingOut: boolean,
}

const initialState = {
  authUserId: UNAUTHENTICATED,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isLoggingOut: false,
};

//these should have DTOs, or at least types that correspond with the backend
type AuthActions = {
  resetState: () => void;
  checkAuth: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
};

//is this appropriate?
function handleAxiosError(error: unknown) {
  if (axios.isAxiosError(error)) {
    console.log(error.response?.data.message);
  } else {
    console.error(error);
  }
}

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  ...initialState,

  resetState: () => set(initialState),
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUserId: res.data });
    } catch (e: unknown) {
      handleAxiosError(e);

      set({ authUserId: UNAUTHENTICATED });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  signup: async (data: SignupData) => {
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
  login: async (data: LoginData) => {
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
      set({ authUserId: UNAUTHENTICATED });
    } catch (e: unknown) {
      handleAxiosError(e);
    } finally {
      set({ isLoggingOut: false });
    }
  },
}));
