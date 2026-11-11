export type UserRole = "user" | "owner" | "admin";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  "access token": string;
  token_type: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UserResponse {
  user_id: number;
  username: string;
  email: string;
  role: UserRole;
}