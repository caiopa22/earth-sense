import { classifySoil, type SoilStatus } from '../utils/soil.ts';
import model from './model.json' with { type: 'json' };

// Inference for the Ridge model trained by ml/train.py. Feature engineering
// must match the Python side exactly (see build_features in ml/train.py).

export interface ModelMetrics {
  n: number;
  mae: number;
  rmse: number;
  band_hit_rate: number;
}

export interface TimedReading {
  humidity_pct: number;
  timestamp: string;
}

export const forecastModel = model;

// A forecast is only shown when the newest reading is at most this old;
// otherwise the card would present a prediction built from stale data.
export const MAX_READING_AGE_MIN = 15;

export function buildFeatures(window: number[], sensorIndex: number): number[] {
  const diffs = window.slice(1).map((value, i) => value - window[i]!);
  const mean = window.reduce((sum, value) => sum + value, 0) / window.length;
  // population standard deviation (ddof=0), same as np.std
  const std = Math.sqrt(window.reduce((sum, value) => sum + (value - mean) ** 2, 0) / window.length);
  const oneHot = model.sensors.map((sensor) => (sensor === sensorIndex ? 1 : 0));
  return [...window, ...diffs, mean, std, ...oneHot];
}

export function predictHumidity(window: number[], sensorIndex: number): number {
  if (window.length !== model.window) {
    throw new Error(`Expected ${model.window} readings, got ${window.length}.`);
  }
  if (!model.sensors.includes(sensorIndex)) {
    throw new Error(`Sensor ${sensorIndex} was not part of the training data.`);
  }

  const features = buildFeatures(window, sensorIndex);
  const raw = features.reduce(
    (sum, value, i) => sum + ((value - model.scaler_mean[i]!) / model.scaler_scale[i]!) * model.coef[i]!,
    model.intercept,
  );
  return Math.min(100, Math.max(0, raw));
}

export type SensorForecast =
  | {
      sensor_index: number;
      status: 'ok';
      predicted_humidity_pct: number;
      predicted_soil_status: SoilStatus;
      last_humidity_pct: number;
      based_on: string;
      forecast_for: string;
      model_metrics: ModelMetrics | null;
    }
  | {
      sensor_index: number;
      status: 'insufficient_data';
      message: string;
    }
  | {
      sensor_index: number;
      status: 'stale_data';
      message: string;
      last_reading_at: string;
    };

/**
 * Takes a sensor's recent readings (any order) and returns the 30 min forecast
 * from the most recent reading. Requires `model.window` consecutive readings,
 * with no gap larger than `model.max_gap_min`, and the newest one must be at most
 * `MAX_READING_AGE_MIN` old relative to `now`.
 */
export function forecastSensor(
  sensorIndex: number,
  readings: TimedReading[],
  now: number = Date.now(),
): SensorForecast {
  const sorted = [...readings]
    .filter((reading) => Number.isFinite(reading.humidity_pct) && !Number.isNaN(Date.parse(reading.timestamp)))
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const latest = sorted.slice(0, model.window).reverse(); // oldest -> newest

  const newest = sorted[0];
  if (newest && now - Date.parse(newest.timestamp) > MAX_READING_AGE_MIN * 60_000) {
    return {
      sensor_index: sensorIndex,
      status: 'stale_data',
      message: `The latest reading of sensor ${sensorIndex} is older than ${MAX_READING_AGE_MIN} min.`,
      last_reading_at: newest.timestamp,
    };
  }

  if (latest.length < model.window) {
    return {
      sensor_index: sensorIndex,
      status: 'insufficient_data',
      message: `Sensor ${sensorIndex} has ${latest.length} reading(s); ${model.window} are required to forecast.`,
    };
  }

  const maxGapMs = model.max_gap_min * 60_000;
  const hasGap = latest.some(
    (reading, i) => i > 0 && Date.parse(reading.timestamp) - Date.parse(latest[i - 1]!.timestamp) > maxGapMs,
  );
  if (hasGap) {
    return {
      sensor_index: sensorIndex,
      status: 'insufficient_data',
      message: `The ${model.window} most recent readings of sensor ${sensorIndex} have a gap larger than ${model.max_gap_min} min.`,
    };
  }

  if (!model.sensors.includes(sensorIndex)) {
    return {
      sensor_index: sensorIndex,
      status: 'insufficient_data',
      message: `Sensor ${sensorIndex} was not part of the model training data.`,
    };
  }

  const window = latest.map((reading) => reading.humidity_pct);
  const predicted = predictHumidity(window, sensorIndex);
  const last = latest[latest.length - 1]!;
  const perSensor = model.metrics.ridge.per_sensor as Record<string, ModelMetrics | undefined>;

  return {
    sensor_index: sensorIndex,
    status: 'ok',
    predicted_humidity_pct: Math.round(predicted * 100) / 100,
    predicted_soil_status: classifySoil(predicted),
    last_humidity_pct: last.humidity_pct,
    based_on: last.timestamp,
    forecast_for: new Date(Date.parse(last.timestamp) + model.horizon_min * 60_000).toISOString(),
    model_metrics: perSensor[String(sensorIndex)] ?? null,
  };
}
