import { Router } from 'express';
import { supabaseAdmin } from '../database/supabase.js';
import { forecastModel, forecastSensor } from '../ml/forecast.ts';
import { requireAuth, type AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { sendError } from '../utils/http.js';
import { getAuthenticatedUserId } from '../utils/index.ts';

const router = Router();

// Readings fetched per sensor before re-sorting by collection time.
// Leaves room for resent batches, whose created_at is recent but sampled_at is old.
const READINGS_PER_SENSOR = 50;

router.get('/forecast/:deviceId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  const deviceId = String(req.params.deviceId);

  const { data: device, error: deviceError } = await supabaseAdmin
    .from('devices')
    .select('id, sensor_count')
    .eq('id', deviceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (deviceError) return sendError(res, 500, deviceError.message || 'Unable to fetch device.');
  if (!device) return sendError(res, 404, 'Device not found.');

  const sensorCount = Number(device.sensor_count ?? 1);
  const sensorIndexes = Array.from({ length: sensorCount }, (_, i) => i + 1);

  try {
    const sensors = await Promise.all(
      sensorIndexes.map(async (sensorIndex) => {
        const { data, error } = await supabaseAdmin
          .from('soil_readings')
          .select('humidity_pct, sampled_at, created_at')
          .eq('device_id', deviceId)
          .eq('sensor_index', sensorIndex)
          .order('sampled_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(READINGS_PER_SENSOR);

        if (error) throw new Error(error.message);

        // Collection time: sampled_at; created_at only when the firmware does not send sampled_at.
        const readings = (data ?? []).map((reading) => ({
          humidity_pct: Number(reading.humidity_pct),
          timestamp: reading.sampled_at ?? reading.created_at,
        }));

        return forecastSensor(sensorIndex, readings);
      }),
    );

    // Stale sensors are still returned (200) so the UI can say "no recent data".
    if (sensors.every((sensor) => sensor.status === 'insufficient_data')) {
      const details = sensors.map((sensor) => ('message' in sensor ? sensor.message : '')).join(' ');
      return sendError(
        res,
        422,
        `Not enough readings to forecast: each sensor needs ${forecastModel.window} consecutive readings. ${details}`,
      );
    }

    return res.json({
      device_id: deviceId,
      horizon_min: forecastModel.horizon_min,
      sensors,
      model: {
        type: forecastModel.type,
        trained_at: forecastModel.trained_at,
        train_samples: forecastModel.train_samples,
        metrics: forecastModel.metrics,
      },
    });
  } catch (error) {
    console.error('Forecast error:', error);
    return sendError(res, 500, 'Unable to compute forecast.');
  }
});

export default router;
