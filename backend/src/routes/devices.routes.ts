import { Router } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { supabaseAdmin } from '../database/supabase.js';
import { requireAuth, type AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import type { CreateDeviceInput, Device, UpdateDeviceInput } from '../types/device.js';
import { sendError } from '../utils/http.js';
import { getAuthenticatedUserId } from '../utils/index.ts';

const router = Router();

function hashDeviceKey(deviceKey: string): string {
  return createHash('sha256').update(deviceKey, 'utf8').digest('hex');
}

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
  const { name, mac_address, location, sensor_count } = req.body as CreateDeviceInput;

  if (!userId) return;

  if (!name || !mac_address || !location) {
    return sendError(res, 400, 'Name, MAC address, and location are required.');
  }

  const sensorCount = sensor_count === undefined ? 1 : Number(sensor_count);

  if (!Number.isInteger(sensorCount) || sensorCount < 1 || sensorCount > 32) {
    return sendError(res, 400, 'Sensor count must be an integer between 1 and 32.');
  }

  const { data, error } = await supabaseAdmin
    .from('devices')
    .insert([
      {
        user_id: userId,
        name,
        mac_address: String(mac_address).toUpperCase(),
        location: location || null,
        sensor_count: sensorCount,
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

router.post('/:id/device-key', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = getAuthenticatedUserId(req, res);
  const { id } = req.params;

  if (!userId) {
    return;
  }

  const { data: device, error: deviceError } = await supabaseAdmin
    .from('devices')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (deviceError || !device) {
    return sendError(res, 404, 'Device not found or you do not have access.');
  }

  const deviceKey = randomBytes(32).toString('hex');
  const { error } = await supabaseAdmin
    .from('devices')
    .update({
      device_key_hash: hashDeviceKey(deviceKey),
      device_key_created_at: new Date().toISOString(),
      device_key_revoked_at: null,
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    return sendError(res, 500, error.message || 'Unable to provision device key.');
  }

  return res.status(201).json({
    message: 'Device key generated. Store it securely; it will not be shown again.',
    device_id: id,
    device_key: deviceKey,
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
  const { name, location, mac_address, sensor_count } = req.body as UpdateDeviceInput;

  if (!userId) {
    return;
  }

  if (!name && !location && !mac_address && sensor_count === undefined) {
    return sendError(res, 400, 'At least one field is required for the update.');
  }

  const payload: Partial<Device> = {};

  if (name) payload.name = name;
  if (location !== undefined) payload.location = location || null;
  if (mac_address) payload.mac_address = String(mac_address).toUpperCase();

  if (sensor_count !== undefined) {
    const sensorCount = Number(sensor_count);

    if (!Number.isInteger(sensorCount) || sensorCount < 1 || sensorCount > 32) {
      return sendError(res, 400, 'Sensor count must be an integer between 1 and 32.');
    }

    payload.sensor_count = sensorCount;
  }

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