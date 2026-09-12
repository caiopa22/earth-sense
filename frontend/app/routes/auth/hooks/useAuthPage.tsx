import { useNavigate } from "react-router";
import { toast } from "~/components/ui/toast";
import useProfile from "~/contexts/useProfile";
import { authService } from "~/service/auth";
import type { LoginPayload, RegisterPayload } from "~/types";

export const useAuthPage = () => {
  const navigate = useNavigate();
  const { setProfile } = useProfile();

  const login = async (payload: LoginPayload) => {
    const { message, user } = await authService.login(payload);

    toast.add({
      title: "Login realizado",
      description: message || "Autenticado com sucesso! Redirecionando...",
      type: "success",
    });

    setProfile({
      id: user?.id,
      name: user?.name,
      email: user?.email,
      role: user?.role,
    });

    setTimeout(() => navigate("/dashboard"), 800);
  };

  const register = async (payload: RegisterPayload) => {
    const { message, user } = await authService.register(payload);

    toast.add({
      title: "Conta criada",
      description: message || "Conta foi criada com sucesso!",
      type: "success",
    });

    setProfile({
      id: user?.id,
      name: user?.name,
      email: user?.email,
      role: user?.role,
    });

    setTimeout(() => navigate("/dashboard"), 800);
  };

  return {
    login,
    register,
  };
};
