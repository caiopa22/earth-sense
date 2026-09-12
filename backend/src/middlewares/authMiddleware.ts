import type { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../database/supabase.js';
import type { ProfileRole } from '../types/profile.js';
import { sendError } from '../utils/http.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string | null;
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
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  req.user = {
    id: data.user.id,
    email: data.user.email,
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
