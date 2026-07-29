import axios from "axios";
import { io, Socket } from "socket.io-client";
import { create } from "zustand";
import { axiosInstance, BASE_URL } from "../config/axios";
import type { AuthResponse, AuthUser, LoginData, SignupData } from "../types/auth";
import type { PresenceData, UserPresence } from "../types/contacts";

const UNAUTHENTICATED = null;

type AuthState = {
  authUser: AuthUser | null;
  socket: Socket | null;
  isCheckingAuth: boolean;
  isSigningUp: boolean;
  isSigningIn: boolean;
  isSigningOut: boolean;
  contactsPresence: UserPresence[];
};

const initialState = {
  authUser: UNAUTHENTICATED,
  socket: null,
  isCheckingAuth: false,
  isSigningUp: false,
  isSigningIn: false,
  isSigningOut: false,
  contactsPresence: [],
};

//these should have DTOs, or at least types that correspond with the backend
type AuthActions = {
  checkAuth: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  signin: (data: LoginData) => Promise<void>;
  signout: () => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
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
export const useAuthStore = create<AuthState & AuthActions>()((set, get) => ({
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
  connectSocket: async () => {
    const { authUser } = get();

    //not authed, not connected already
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      withCredentials: true,
    });

    socket.connect();

    set({ socket: socket });

    const res = await axiosInstance.get<PresenceData>("/contact/presence");

    set({ contactsPresence: res.data.contactsPresence });
    //listening for events
    //socket.on()
  },
  disconnectSocket: async () => {
    if (get().socket?.connect) get().socket?.disconnect();
  },
}));
