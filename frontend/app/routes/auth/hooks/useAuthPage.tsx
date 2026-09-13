import { useNavigate } from "react-router";
import { toast } from "~/components/ui/toast";
import { useAuth } from "~/contexts/auth-context";
import { authService } from "~/service/auth";
import type { LoginPayload, RegisterPayload } from "~/types";

export const useAuthPage = () => {
  const navigate = useNavigate();
  const { setProfile, profile, clearAuth, setToken, setRefreshToken } = useAuth();

  const login = async (payload: LoginPayload) => {
    const { message, user, session } = await authService.login(payload);

    toast.add({
      title: "Login realizado",
      description: message || "Autenticado com sucesso! Redirecionando...",
      type: "success",
    });

    if (profile) clearAuth();

    setProfile({
      id: user?.id ?? "",
      name: user?.name ?? payload.email,
      email: user?.email ?? payload.email,
      role: (user?.role as "user" | "admin") ?? "user",
      created_at: new Date().toISOString(),
    });

    if (session) {
      setToken(session.access_token ?? null);
      setRefreshToken(session.refresh_token ?? null);
    }

    setTimeout(() => navigate("/dashboard"), 800);
  };

  const register = async (payload: RegisterPayload) => {
    const { message, user, session } = await authService.register(payload);

    toast.add({
      title: "Conta criada",
      description: message || "Conta foi criada com sucesso!",
      type: "success",
    });

    if (profile) clearAuth();

    setProfile({
      id: user?.id ?? "",
      name: user?.name ?? payload.email,
      email: user?.email ?? payload.email,
      role: (user?.role as "user" | "admin") ?? "user",
      created_at: new Date().toISOString(),
    });

    if (session) {
      setToken(session.access_token ?? null);
      setRefreshToken(session.refresh_token ?? null);
    }

    setTimeout(() => navigate("/dashboard"), 800);
  };

  return {
    login,
    register,
  };
};
