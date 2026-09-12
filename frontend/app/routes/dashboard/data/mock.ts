// ─── Dados Mockados EarthSense Dashboard ─────────────────────────────────────
// Estrutura idêntica ao contrato da API real.
// Para integrar com o backend real, substitua as exportações abaixo
// por chamadas fetch/axios nos respectivos endpoints:
//   GET /api/devices        → mockDevices
//   GET /api/soil-readings  → mockReadings
//   GET /api/users/me       → mockProfile
//
// Os tipos estão em: app/dashboard/types/index.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { Device, DashboardAlert, SoilReading, UserProfile } from "../types";

// ── Perfil do usuário ─────────────────────────────────────────────────────────
export const mockProfile: UserProfile = {
  id: "usr_mock_001",
  email: "pesquisador@earthsense.app",
  full_name: "Erick Carvalho",
  avatar_url: null,
  created_at: "2026-01-15T10:00:00Z",
};

// ── Dispositivos (ESP32 + Sensor Capacitivo v1.2) ─────────────────────────────
export const mockDevices: Device[] = [
  {
    id: "dev_mock_001",
    user_id: "usr_mock_001",
    name: "Sensor Talhão A",
    mac_address: "AA:BB:CC:DD:EE:01",
    location: "Talhão A — Soja",
    is_online: true,
    last_seen: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    created_at: "2026-03-01T08:00:00Z",
  },
  {
    id: "dev_mock_002",
    user_id: "usr_mock_001",
    name: "Sensor Talhão B",
    mac_address: "AA:BB:CC:DD:EE:02",
    location: "Talhão B — Milho",
    is_online: true,
    last_seen: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    created_at: "2026-03-05T09:00:00Z",
  },
  {
    id: "dev_mock_003",
    user_id: "usr_mock_001",
    name: "Sensor Estufa",
    mac_address: "AA:BB:CC:DD:EE:03",
    location: "Estufa 1 — Hortaliças",
    is_online: false,
    last_seen: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    created_at: "2026-04-10T11:00:00Z",
  },
];

// ── Leituras de solo — últimas 24h (a cada 30min por dispositivo) ─────────────
function generateReadings(deviceId: string, baseHumidity: number, variance: number): SoilReading[] {
  const readings: SoilReading[] = [];
  const now = Date.now();
  const ADC_MAX = 3500;
  const ADC_MIN = 1500;

  for (let i = 47; i >= 0; i--) {
    const drift = Math.sin(i * 0.2) * variance;
    const noise = (Math.random() - 0.5) * 4;
    const humidity = Math.min(100, Math.max(0, baseHumidity + drift + noise));
    const raw = Math.round(ADC_MAX - (humidity / 100) * (ADC_MAX - ADC_MIN));

    readings.push({
      id: `read_${deviceId}_${i}`,
      device_id: deviceId,
      humidity_pct: parseFloat(humidity.toFixed(1)),
      raw_value: raw,
      created_at: new Date(now - i * 30 * 60 * 1000).toISOString(),
    });
  }

  return readings;
}

export const mockReadings: SoilReading[] = [
  ...generateReadings("dev_mock_001", 62, 12),
  ...generateReadings("dev_mock_002", 34, 8),
  ...generateReadings("dev_mock_003", 78, 5),
];

// Adiciona a última leitura de cada dispositivo ao objeto device
mockDevices.forEach((device) => {
  const deviceReadings = mockReadings
    .filter((r) => r.device_id === device.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  device.last_reading = deviceReadings[0] ?? null;
});

// ── Alertas ───────────────────────────────────────────────────────────────────
export const mockAlerts: DashboardAlert[] = [
  {
    id: "alert_001",
    device_id: "dev_mock_002",
    device_name: "Sensor Talhão B",
    severity: "critical",
    message: "Umidade abaixo de 35% — risco de déficit hídrico no Talhão B.",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "alert_002",
    device_id: "dev_mock_003",
    device_name: "Sensor Estufa",
    severity: "warning",
    message: "Dispositivo offline há mais de 3 horas.",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "alert_003",
    device_id: "dev_mock_001",
    device_name: "Sensor Talhão A",
    severity: "info",
    message: "Umidade ótima mantida nas últimas 6 horas.",
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];
