const ACCESS_TOKEN_KEY = "earthsense_token";
const REFRESH_TOKEN_KEY = "earthsense_refresh_token";

export type SessionPayload = {
  access_token?: string;
  refresh_token?: string;
};

export const getAccessToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const persistAuthSession = (session?: SessionPayload) => {
  if (typeof window === "undefined") return;

  if (session?.access_token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (session?.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const refreshAccessToken = async (apiBaseUrl: string) => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuthSession();
    return null;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/users/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearAuthSession();
      return null;
    }

    const data = (await response.json()) as { session?: SessionPayload };
    const nextAccessToken = data.session?.access_token;
    const nextRefreshToken = data.session?.refresh_token ?? refreshToken;

    if (!nextAccessToken) {
      clearAuthSession();
      return null;
    }

    persistAuthSession({
      access_token: nextAccessToken,
      refresh_token: nextRefreshToken,
    });

    return nextAccessToken;
  } catch {
    clearAuthSession();
    return null;
  }
};
