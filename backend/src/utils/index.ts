import type { User } from "@supabase/supabase-js";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.ts";
import type { Profile } from "../types/profile.ts";
import { sendError } from "../utils/http.ts";

export const getAuthenticatedUserId = (req: AuthenticatedRequest, res: Response): string | null => {
  const userId = req.user?.id;

  if (!userId) {
    sendError(res, 401, 'Authentication required.');
    return null;
  }

  return userId;
};

export const convertSupabaseUserToProfile = (user: User): Profile => {
  return {
      ...user,
      email: user.email ?? '',
      name: user.user_metadata?.name ?? 'User',
      role: (user.user_metadata?.role as Profile['role']) ?? 'user',
  };
} 