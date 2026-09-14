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

export const convertSupabaseUserToProfile = (
  user: User,
  profile?: Partial<Profile> | null,
): Profile => {
  return {
    id: user.id,
    email: profile?.email ?? user.email ?? '',
    name: profile?.name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'User',
    role: (profile?.role ?? user.user_metadata?.role ?? 'user') as Profile['role'],
    avatar: profile?.avatar ?? user.user_metadata?.avatar ?? null,
    created_at: profile?.created_at ?? user.created_at ?? new Date().toISOString(),
  };
};