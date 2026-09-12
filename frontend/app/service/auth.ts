import { api } from "~/lib/api";
import { clearAuthSession, persistAuthSession } from "~/lib/session";
import type { AuthResponse, LoginPayload, RegisterPayload } from "~/types";

export const authService = {
  login: async (payload: LoginPayload) => {
    const { data } = await api.post<AuthResponse>("/users/login", payload);
    persistAuthSession(data.session);
    return data;
  },

  register: async (payload: RegisterPayload) => {
    const { data } = await api.post<AuthResponse>("/users/signup", payload);
    persistAuthSession(data.session);
    return data;
  },

  logout: async () => {
    const { data } = await api.post<{ message: string }>("/users/logout");
    clearAuthSession();
    return data;
  },
};
