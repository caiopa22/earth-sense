import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
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
  const [isLoading, setIsLoading] = useState(false);

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
