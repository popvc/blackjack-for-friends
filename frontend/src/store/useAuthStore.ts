import axios from "axios";
import { create } from "zustand";
import { axiosInstance } from "../config/axios";
import type { AuthResponse, AuthUser, LoginData, SignupData } from "../types/auth";

const UNAUTHENTICATED = null;

type AuthState = {
  authUser: AuthUser | null;
  isCheckingAuth: boolean,
  isSigningUp: boolean,
  isSigningIn: boolean,
  isSigningOut: boolean,
}

const initialState = {
  authUser: UNAUTHENTICATED,
  isCheckingAuth: false,
  isSigningUp: false,
  isSigningIn: false,
  isSigningOut: false,
};

//these should have DTOs, or at least types that correspond with the backend
type AuthActions = {
  checkAuth: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  signin: (data: LoginData) => Promise<void>;
  signout: () => Promise<void>;
};

//could also use React's HotToast, that way I don't have to worry about how I'll communicate errors
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

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get<AuthResponse>("/auth/check");
      set({ authUser: res.data.user });
    } catch (e: unknown) {
      handleAxiosError(e);

      set({ authUser: UNAUTHENTICATED });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  signup: async (data: SignupData) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post<AuthResponse>("/auth/signup", data);
      set({ authUser: res.data.user });
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
      set({ authUser: res.data.user });
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
      set({ authUser: UNAUTHENTICATED });
    } catch (e: unknown) {
      handleAxiosError(e);
    } finally {
      set({ isSigningOut: false });
    }
  },
}));
