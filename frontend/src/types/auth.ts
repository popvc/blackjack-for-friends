export interface SignupData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthUser {
  userId: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
}
