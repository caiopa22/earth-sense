export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  message: string;
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
    created_at: string;
  };
  session?: {
    access_token?: string;
    refresh_token?: string;
  };
};
