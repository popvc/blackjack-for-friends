import axios from "axios";
import { create } from "zustand";
import { axiosInstance } from "../config/axios";
import type { AuthResponse, LoginData, SignupData } from "../types/auth";

const UNAUTHENTICATED = null;

type AuthState = {
  authUserId: string | null;
  isCheckingAuth: boolean,
  isSigningUp: boolean,
  isSigningIn: boolean,
  isSigningOut: boolean,
}

const initialState = {
  authUserId: UNAUTHENTICATED,
  isCheckingAuth: false,
  isSigningUp: false,
  isSigningIn: false,
  isSigningOut: false,
};

//these should have DTOs, or at least types that correspond with the backend
type AuthActions = {
  resetState: () => void;
  checkAuth: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  signin: (data: LoginData) => Promise<void>;
  signout: () => Promise<void>;
};

//is this appropriate?
function handleAxiosError(error: unknown) {
  if (axios.isAxiosError(error)) {
    console.log(error.response?.data.message);
  } else {
    console.error(error);
  }
}

//seems like Tanstack Query does most of this, but better. I have a deadline, so I'll consider it another time
export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  ...initialState,

  resetState: () => set(initialState),
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get<AuthResponse>("/auth/check");
      set({ authUserId: res.data.profile.userId });
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
      const res = await axiosInstance.post<AuthResponse>("/auth/signup", data);
      set({ authUserId: res.data.profile.userId });
    } catch (e: unknown) {
      handleAxiosError(e);
    } finally {
      set({ isSigningUp: false });
    }
  },
  signin: async (data: LoginData) => {
    set({ isSigningIn: true });
    try {
      const res = await axiosInstance.post<AuthResponse>("/auth/signin", data);
      set({ authUserId: res.data.profile.userId });
    } catch (e) {
      handleAxiosError(e);
    } finally {
      set({ isSigningIn: false });
    }
  },
  signout: async () => {
    set({ isSigningOut: true });
    try {
      await axiosInstance.post("/auth/signout");
      set({ authUserId: UNAUTHENTICATED });
    } catch (e: unknown) {
      handleAxiosError(e);
    } finally {
      set({ isSigningOut: false });
    }
  },
}));
