import { Router } from 'express';
import { supabaseAdmin } from '../database/supabase.js';
import { requireAdmin, requireAuth, type AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import type { LoginRequestBody, RefreshTokenRequestBody, SignupRequestBody } from '../types/auth.js';
import type { UpdateUserRoleRequestBody } from '../types/profile.js';
import { sendError } from '../utils/http.js';
import { convertSupabaseUserToProfile } from '../utils/index.ts';

const router = Router();

router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body as SignupRequestBody;

  if (!email || !password || !name) {
    return sendError(res, 400, 'Email, password, and name are required.');
  }

  const { data, error } = await supabaseAdmin.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    return sendError(res, 400, error.message || 'Unable to create user.');
  }

  if (data.user) {
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      {
        id: data.user.id,
        email: data.user.email ?? email,
        role: 'user',
      },
      { onConflict: 'id' },
    );

    if (profileError) {
      return sendError(res, 500, profileError.message || 'Unable to create user profile.');
    }
  }

  if (!data.user) {
    return sendError(res, 400, 'User data was not returned after signup.');
  }

  return res.status(201).json({
    message: 'User created successfully.',
    user: convertSupabaseUserToProfile(data.user),
    session: data.session,
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body as LoginRequestBody;

  if (!email || !password) {
    return sendError(res, 400, 'Email and password are required.');
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return sendError(res, 401, error.message || 'Invalid credentials.');
  }

  if (!data.user) {
    return sendError(res, 401, 'User data was not returned after login.');
  }

  return res.json({
    message: 'Login successful.',
    user: convertSupabaseUserToProfile(data.user),
    session: data.session,
  });
});

router.get('/', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res) => {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    return sendError(res, 500, error.message || 'Unable to fetch users.');
  }

  return res.json({ users: data.users ?? [] });
});

router.patch('/:id/role', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { role } = req.body as UpdateUserRoleRequestBody;

  if (!id) {
    return sendError(res, 400, 'User id is required.');
  }

  if (!role || (role !== 'user' && role !== 'admin')) {
    return sendError(res, 400, 'Role must be either user or admin.');
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return sendError(res, 500, error.message || 'Unable to update user role.');
  }

  return res.json({
    message: 'User role updated successfully.',
    user: data,
  });
});

router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '').trim();

  if (!token) {
    return sendError(res, 400, 'Authentication token is missing.');
  }

  const { error } = await supabaseAdmin.auth.signOut();

  if (error) {
    return sendError(res, 500, error.message || 'Unable to log out.');
  }

  return res.json({ message: 'Logout successful.' });
});

router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body as RefreshTokenRequestBody;

  if (!refreshToken) {
    return sendError(res, 400, 'Refresh token is required.');
  }

  const { data, error } = await supabaseAdmin.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error) {
    return sendError(res, 401, error.message || 'Invalid refresh token.');
  }

  return res.json({
    message: 'Token refreshed successfully.',
    session: data.session,
  });
});

export default router;
