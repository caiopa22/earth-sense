import type { Profile, ProfileRole } from "~/routes/dashboard/types";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type { Profile, ProfileRole };

export type AuthResponse = {
  message: string;
  user?: Profile;
  session?: {
    access_token?: string;
    refresh_token?: string;
  };
};
