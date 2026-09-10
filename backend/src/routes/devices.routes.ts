import { Router } from 'express';
import type { Response } from 'express';
import { supabaseAdmin } from '../database/supabase.js';
import { requireAuth, type AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import type { CreateDeviceInput, Device, UpdateDeviceInput } from '../types/device.js';
import { sendError } from '../utils/http.js';

const router = Router();

const getAuthenticatedUserId = (req: AuthenticatedRequest, res: Response): string | null => {
  const userId = req.user?.id;

  if (!userId) {
    sendError(res, 401, 'Authentication required.');
    return null;
  }

  return userId;
};

router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = getAuthenticatedUserId(req, res);

  if (!userId) {
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('devices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return sendError(res, 500, error.message || 'Unable to fetch devices.');
  }

  return res.json({ devices: (data ?? []) as Device[] });
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = getAuthenticatedUserId(req, res);
  const { name, mac_address, location } = req.body as CreateDeviceInput;

  if (!userId) {
    return;
  }

  if (!name || !mac_address) {
    return sendError(res, 400, 'Name and MAC address are required.');
  }

  const { data, error } = await supabaseAdmin
    .from('devices')
    .insert([
      {
        user_id: userId,
        name,
        mac_address: String(mac_address).toUpperCase(),
        location: location || null,
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return sendError(res, 400, 'This MAC address is already registered.');
    }

    return sendError(res, 500, error.message || 'Unable to register device.');
  }

  return res.status(201).json({
    message: 'Device registered successfully.',
    device: data as Device,
  });
});

router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = getAuthenticatedUserId(req, res);
  const { id } = req.params;

  if (!userId) {
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('devices')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    return sendError(res, 404, 'Device not found.');
  }

  return res.json({ device: data as Device });
});

router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = getAuthenticatedUserId(req, res);
  const { id } = req.params;
  const { name, location, mac_address } = req.body as UpdateDeviceInput;

  if (!userId) {
    return;
  }

  if (!name && !location && !mac_address) {
    return sendError(res, 400, 'At least one field is required for the update.');
  }

  const payload: Partial<Device> = {};

  if (name) payload.name = name;
  if (location !== undefined) payload.location = location || null;
  if (mac_address) payload.mac_address = String(mac_address).toUpperCase();

  const { data, error } = await supabaseAdmin
    .from('devices')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return sendError(res, 400, 'This MAC address is already registered.');
    }

    return sendError(res, 404, 'Device not found or you do not have access.');
  }

  return res.json({
    message: 'Device updated successfully.',
    device: data as Device,
  });
});

router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = getAuthenticatedUserId(req, res);
  const { id } = req.params;

  if (!userId) {
    return;
  }

  const { error } = await supabaseAdmin
    .from('devices')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    return sendError(res, 500, error.message || 'Unable to delete device.');
  }

  return res.json({ message: 'Device deleted successfully.' });
});

export default router;