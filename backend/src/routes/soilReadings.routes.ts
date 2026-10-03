import { Router } from 'express';
import { supabaseAdmin } from '../database/supabase.js';
import { requireAuth, type AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { requireDeviceAuth, type DeviceAuthenticatedRequest } from '../middlewares/deviceAuthMiddleware.js';
import type { CreateSoilReadingBatchInput, CreateSoilReadingInput, SoilReading, UpdateSoilReadingInput } from '../types/soilReading.js';
import { sendError } from '../utils/http.js';
import { getAuthenticatedUserId } from '../utils/index.ts';

const router = Router();

router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = getAuthenticatedUserId(req, res);

  if (!userId) {
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('devices')
    .select('id')
    .eq('user_id', userId);

  if (error) {
    return sendError(res, 500, error.message || 'Unable to fetch devices.');
  }

  const deviceIds = (data ?? []).map((device: { id: string }) => device.id);

  if (deviceIds.length === 0) {
    return res.json({ readings: [] as SoilReading[] });
  }

  const { data: readings, error: readingsError } = await supabaseAdmin
    .from('soil_readings')
    .select('*')
    .in('device_id', deviceIds)
    .order('created_at', { ascending: false });

  if (readingsError) {
    return sendError(res, 500, readingsError.message || 'Unable to fetch readings.');
  }

  return res.json({ readings: (readings ?? []) as SoilReading[] });
});

router.post('/batch', requireDeviceAuth, async (req: DeviceAuthenticatedRequest, res) => {
  const device = req.device;
  const input = req.body as CreateSoilReadingBatchInput;

  console.log({
    device,
    input,
  })

  if (!device) {
    return sendError(res, 401, 'Device authentication is required.');
  }

  if (!input?.batch_id || !Array.isArray(input.readings)) {
    return sendError(res, 400, 'Batch id and readings are required.');
  }

  if (input.readings.length !== device.sensor_count) {
    return sendError(res, 400, `Expected ${device.sensor_count} sensor readings.`);
  }

  const sensorIndexes = input.readings.map((reading) => Number(reading.sensor_index));
  const expectedIndexes = Array.from({ length: device.sensor_count }, (_, index) => index + 1);

  if (
    new Set(sensorIndexes).size !== sensorIndexes.length ||
    sensorIndexes.some((sensorIndex) => !expectedIndexes.includes(sensorIndex))
  ) {
    return sendError(res, 400, 'Sensor indexes must be unique and sequential from 1.');
  }

  const readings = input.readings.map((reading) => {
    const humidity = Number(reading.humidity_pct);
    const rawValue = reading.raw_value === undefined || reading.raw_value === null
      ? null
      : Number(reading.raw_value);

    return {
      sensor_index: Number(reading.sensor_index),
      humidity,
      rawValue,
    };
  });

  if (readings.some(({ humidity, rawValue }) =>
    !Number.isFinite(humidity) || humidity < 0 || humidity > 100 ||
    (rawValue !== null && (!Number.isInteger(rawValue) || rawValue < 0 || rawValue > 4095)))) {
    return sendError(res, 400, 'Sensor readings contain invalid humidity or ADC values.');
  }

  const payload = readings.map(({ sensor_index, humidity, rawValue }) => ({
    device_id: device.id,
    sensor_index,
    batch_id: input.batch_id,
    humidity_pct: humidity,
    raw_value: rawValue,
    sampled_at: input.sampled_at ?? null,
  }));

  const { data, error } = await supabaseAdmin
    .from('soil_readings')
    .insert(payload)
    .select();

  if (error) {
    if (error.code === '23505') {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('soil_readings')
        .select('*')
        .eq('device_id', device.id)
        .eq('batch_id', input.batch_id)
        .order('sensor_index', { ascending: true });

      if (!existingError && existing?.length === device.sensor_count) {
        return res.status(200).json({
          message: 'Reading batch was already accepted.',
          readings: existing as SoilReading[],
          duplicate: true,
        });
      }
    }

    return sendError(res, 500, error.message || 'Unable to create reading batch.');
  }

  await supabaseAdmin
    .from('devices')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', device.id);

  return res.status(201).json({
    message: 'Reading batch created successfully.',
    readings: (data ?? []) as SoilReading[],
  });
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = getAuthenticatedUserId(req, res);
  const { device_id, humidity_pct, raw_value } = req.body as CreateSoilReadingInput;

  if (!userId) {
    return;
  }

  if (!device_id || humidity_pct === undefined || humidity_pct === null) {
    return sendError(res, 400, 'Device id and humidity percentage are required.');
  }

  const { data: device, error: deviceError } = await supabaseAdmin
    .from('devices')
    .select('id')
    .eq('id', device_id)
    .eq('user_id', userId)
    .single();

  if (deviceError || !device) {
    return sendError(res, 404, 'Device not found or you do not have access.');
  }

  const humidity = Number(humidity_pct);

  if (Number.isNaN(humidity) || humidity < 0 || humidity > 100) {
    return sendError(res, 400, 'Humidity percentage must be between 0 and 100.');
  }

  const { data, error } = await supabaseAdmin
    .from('soil_readings')
    .insert([
      {
        device_id,
        humidity_pct: humidity,
        raw_value: raw_value ?? null,
      },
    ])
    .select()
    .single();

  if (error) {
    return sendError(res, 500, error.message || 'Unable to create reading.');
  }

  return res.status(201).json({
    message: 'Reading created successfully.',
    reading: data as SoilReading,
  });
});

router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = getAuthenticatedUserId(req, res);
  const { id } = req.params;

  if (!userId) {
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('soil_readings')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return sendError(res, 404, 'Reading not found.');
  }

  const { data: device, error: deviceError } = await supabaseAdmin
    .from('devices')
    .select('id')
    .eq('id', data.device_id)
    .eq('user_id', userId)
    .single();

  if (deviceError || !device) {
    return sendError(res, 403, 'You do not have access to this reading.');
  }

  return res.json({ reading: data as SoilReading });
});

router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = getAuthenticatedUserId(req, res);
  const { id } = req.params;
  const { humidity_pct, raw_value } = req.body as UpdateSoilReadingInput;

  if (!userId) {
    return;
  }

  if (humidity_pct === undefined && raw_value === undefined) {
    return sendError(res, 400, 'At least one field is required for the update.');
  }

  const { data: reading, error: readingError } = await supabaseAdmin
    .from('soil_readings')
    .select('device_id')
    .eq('id', id)
    .single();

  if (readingError || !reading) {
    return sendError(res, 404, 'Reading not found.');
  }

  const { data: deviceOwner, error: ownerError } = await supabaseAdmin
    .from('devices')
    .select('id')
    .eq('id', reading.device_id)
    .eq('user_id', userId)
    .single();

  if (ownerError || !deviceOwner) {
    return sendError(res, 403, 'You do not have access to this reading.');
  }

  const payload: Partial<SoilReading> = {};

  if (humidity_pct !== undefined) {
    const humidity = Number(humidity_pct);

    if (Number.isNaN(humidity) || humidity < 0 || humidity > 100) {
      return sendError(res, 400, 'Humidity percentage must be between 0 and 100.');
    }

    payload.humidity_pct = humidity;
  }

  if (raw_value !== undefined) {
    payload.raw_value = raw_value ?? null;
  }

  const { data, error } = await supabaseAdmin
    .from('soil_readings')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return sendError(res, 500, error.message || 'Unable to update reading.');
  }

  return res.json({
    message: 'Reading updated successfully.',
    reading: data as SoilReading,
  });
});

router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = getAuthenticatedUserId(req, res);
  const { id } = req.params;

  if (!userId) {
    return;
  }

  const { data: reading, error: readingError } = await supabaseAdmin
    .from('soil_readings')
    .select('device_id')
    .eq('id', id)
    .single();

  if (readingError || !reading) {
    return sendError(res, 404, 'Reading not found.');
  }

  const { data: device, error: deviceError } = await supabaseAdmin
    .from('devices')
    .select('id')
    .eq('id', reading.device_id)
    .eq('user_id', userId)
    .single();

  if (deviceError || !device) {
    return sendError(res, 403, 'You do not have access to this reading.');
  }

  const { error } = await supabaseAdmin.from('soil_readings').delete().eq('id', id);

  if (error) {
    return sendError(res, 500, error.message || 'Unable to delete reading.');
  }

  return res.json({ message: 'Reading deleted successfully.' });
});

export default router;
