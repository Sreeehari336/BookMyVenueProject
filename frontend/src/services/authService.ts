import api from "./api";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserResponse,
} from "../types/auth.types";

export const login = async (
  credentials: LoginRequest
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>(
    "/users/login",
    null,
    {
      params: {
        email: credentials.email,
        password: credentials.password,
      },
    }
  );

  return response.data;
};

export const register = async (
  userData: RegisterRequest
): Promise<UserResponse> => {
  const response = await api.post<UserResponse>(
    "/users/signup",
    userData
  );

  return response.data;
};

export const getCurrentUser = async (): Promise<UserResponse> => {
  const response = await api.get<UserResponse>("/users/me");
  return response.data;
};