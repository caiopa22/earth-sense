// ─── Tipos que espelham o contrato da API do backend EarthSense ───────────────
// Baseados em: backend/src/types/device.ts, soilReading.ts, user.ts
// Quando a integração real for feita, apenas substitua os dados mockados —
// estes tipos já são compatíveis com o retorno da API.

export type SoilStatus = "dry" | "low" | "optimal" | "high" | "saturated";

export interface Device {
  id: string;
  user_id: string;
  name: string;
  mac_address: string;
  location: string | null;
  sensor_count?: number;
  created_at: string;
  // Campos derivados/calculados no frontend
  is_online?: boolean;
  last_seen?: string;
  last_reading?: SoilReading | null;
  // Média da última leitura de cada sensor do dispositivo
  current_humidity_pct?: number | null;
}

export interface SoilReading {
  id: string;
  device_id: string;
  humidity_pct: number; // 0–100
  raw_value: number | null; // valor ADC bruto do ESP32
  sensor_index: number;
  batch_id?: string;
  sampled_at?: string | null;
  created_at: string;
}

export type ProfileRole = "user" | "admin";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: ProfileRole;
  avatar?: string | null;
  created_at: string;
}

// Retorno do hook useDashboard
export interface DashboardData {
  profile: Profile | null;
  devices: Device[];
  readings: SoilReading[];
  isLoading: boolean;
}

// Helpers
export function getSoilStatus(humidity: number): SoilStatus {
  if (humidity < 20) return "dry";
  if (humidity < 40) return "low";
  if (humidity < 70) return "optimal";
  if (humidity < 85) return "high";
  return "saturated";
}

export const SOIL_STATUS_LABEL: Record<SoilStatus, string> = {
  dry: "Seco",
  low: "Baixa Umidade",
  optimal: "Umidade Ótima",
  high: "Alta Umidade",
  saturated: "Saturado",
};

export const SOIL_STATUS_COLOR: Record<SoilStatus, string> = {
  dry: "text-orange-500",
  low: "text-yellow-500",
  optimal: "text-emerald-500",
  high: "text-blue-500",
  saturated: "text-violet-500",
};

export const SOIL_STATUS_BG: Record<SoilStatus, string> = {
  dry: "bg-orange-500/10 border-orange-500/20",
  low: "bg-yellow-500/10 border-yellow-500/20",
  optimal: "bg-emerald-500/10 border-emerald-500/20",
  high: "bg-blue-500/10 border-blue-500/20",
  saturated: "bg-violet-500/10 border-violet-500/20",
};

// ─── 30 min forecast (GET /api/ml/forecast/:deviceId) ─────────────────────────

export interface ForecastModelMetrics {
  n: number;
  mae: number;
  rmse: number;
  band_hit_rate: number;
}

export type SensorForecast =
  | {
      sensor_index: number;
      status: "ok";
      predicted_humidity_pct: number;
      predicted_soil_status: SoilStatus;
      last_humidity_pct: number;
      based_on: string;
      forecast_for: string;
      model_metrics: ForecastModelMetrics | null;
    }
  | {
      sensor_index: number;
      status: "insufficient_data";
      message: string;
    }
  | {
      sensor_index: number;
      status: "stale_data";
      message: string;
      last_reading_at: string;
    };

export interface ForecastResponse {
  device_id: string;
  horizon_min: number;
  sensors: SensorForecast[];
  model: {
    type: string;
    trained_at: string;
    train_samples: number;
  };
}
