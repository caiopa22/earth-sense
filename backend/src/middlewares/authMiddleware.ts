import type { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../database/supabase.js';
import type { ProfileRole } from '../types/profile.js';
import { sendError } from '../utils/http.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string | null;
    name?: string | null;
    avatar?: string | null;
    role?: ProfileRole;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'Authorization header is missing or malformed.');
  }

  const token = authHeader.replace('Bearer ', '').trim();

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return sendError(res, 401, 'Authentication token is invalid or expired.');
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('name, email, role, avatar, created_at')
    .eq('id', data.user.id)
    .maybeSingle();

  req.user = {
    id: data.user.id,
    email: profile?.email ?? data.user.email,
    name: profile?.name ?? data.user.user_metadata?.name ?? null,
    avatar: profile?.avatar ?? data.user.user_metadata?.avatar ?? null,
    role: profileError || !profile ? 'user' : (profile.role as ProfileRole),
  };

  return next();
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    return sendError(res, 401, 'Authentication required.');
  }

  if (req.user.role !== 'admin') {
    return sendError(res, 403, 'Access denied. Admin role required.');
  }

  return next();
}
