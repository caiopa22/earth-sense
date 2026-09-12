// ─── Tipos que espelham o contrato da API do backend EarthSense ───────────────
// Baseados em: backend/src/types/device.ts, soilReading.ts, user.ts
// Quando a integração real for feita, apenas substitua os dados mockados —
// estes tipos já são compatíveis com o retorno da API.

export type SoilStatus =
  | "dry"
  | "low"
  | "optimal"
  | "high"
  | "saturated";

export interface Device {
  id: string;
  user_id: string;
  name: string;
  mac_address: string;
  location: string | null;
  created_at: string;
  // Campos derivados/calculados no frontend
  is_online?: boolean;
  last_seen?: string;
  last_reading?: SoilReading | null;
}

export interface SoilReading {
  id: string;
  device_id: string;
  humidity_pct: number;   // 0–100
  raw_value: number | null; // valor ADC bruto do ESP32
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface DashboardAlert {
  id: string;
  device_id: string;
  device_name: string;
  severity: "critical" | "warning" | "info";
  message: string;
  created_at: string;
}

// Retorno do hook useDashboard
export interface DashboardData {
  profile: UserProfile;
  devices: Device[];
  readings: SoilReading[];
  alerts: DashboardAlert[];
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
