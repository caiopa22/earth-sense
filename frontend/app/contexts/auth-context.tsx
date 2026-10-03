import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, API_URL } from "~/lib/api";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  refreshAccessToken,
} from "~/lib/session";
import type { Profile } from "~/routes/dashboard/types";

export type AuthSession = {
  accessToken: string | null;
  refreshToken: string | null;
};

type AuthContextValue = {
  profile: Profile | null;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  token: string | null;
  setToken: (token: string | null) => void;
  refreshToken: string | null;
  setRefreshToken: (token: string | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      if (typeof window === "undefined") return;

      setIsLoading(true);

      try {
        let accessToken = getAccessToken();

        if (!accessToken && getRefreshToken()) {
          accessToken = await refreshAccessToken(API_URL);
        }

        if (!accessToken) {
          if (!cancelled) clearAuth();
          return;
        }

        setTokenState(accessToken);
        setRefreshTokenState(getRefreshToken());
        const { data } = await api.get<{ user: Profile }>("/users/me");

        if (!cancelled && data.user) {
          setProfile(data.user);
        }
      } catch {
        clearAuthSession();
        if (!cancelled) clearAuth();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const setToken = (nextToken: string | null) => {
    setTokenState(nextToken);
  };

  const setRefreshToken = (nextToken: string | null) => {
    setRefreshTokenState(nextToken);
  };

  const clearAuth = () => {
    setProfile(null);
    setTokenState(null);
    setRefreshTokenState(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      setProfile,
      token,
      setToken,
      refreshToken,
      setRefreshToken,
      isAuthenticated: Boolean(token && profile),
      isLoading,
      setIsLoading,
      clearAuth,
    }),
    [profile, token, refreshToken, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export default useAuth;
