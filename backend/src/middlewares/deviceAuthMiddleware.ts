import type { NextFunction, Response } from 'express';
import { createHash } from 'node:crypto';
import { supabaseAdmin } from '../database/supabase.js';
import { sendError } from '../utils/http.js';
import type { AuthenticatedRequest } from './authMiddleware.js';

export interface DeviceAuthenticatedRequest extends AuthenticatedRequest {
  device?: {
    id: string;
    sensor_count: number;
  };
}

function hashDeviceKey(deviceKey: string): string {
  return createHash('sha256').update(deviceKey, 'utf8').digest('hex');
}

export async function requireDeviceAuth(
  req: DeviceAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const deviceKey = req.header('x-device-key')?.trim();

  if (!deviceKey) {
    return sendError(res, 401, 'Device key is missing.');
  }

  const { data: device, error } = await supabaseAdmin
    .from('devices')
    .select('id, sensor_count')
    .eq('device_key_hash', hashDeviceKey(deviceKey))
    .is('device_key_revoked_at', null)
    .maybeSingle();

  if (error || !device) {
    return sendError(res, 401, 'Device key is invalid or revoked.');
  }

  req.device = {
    id: device.id as string,
    sensor_count: Number(device.sensor_count),
  };

  return next();
}
