// ─── Hook principal do Dashboard ──────────────────────────────────────────────
// Atualmente retorna dados mockados.
// Para integrar com a API real, substitua os imports de mock abaixo por chamadas
// fetch/axios:
//
//   const [devices, setDevices] = useState<Device[]>([]);
//   useEffect(() => {
//     fetch("/api/devices", { headers: { Authorization: `Bearer ${token}` } })
//       .then(r => r.json()).then(d => setDevices(d.devices));
//   }, []);
//
// A interface de retorno DashboardData permanece igual — apenas os dados mudam.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import type { DashboardData } from "../types";
import { mockProfile, mockDevices, mockReadings, mockAlerts } from "../data/mock";

export function useDashboard(): DashboardData & {
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  activePage: DashboardPage;
  setActivePage: (page: DashboardPage) => void;
} {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    mockDevices[0]?.id ?? ""
  );
  const [activePage, setActivePage] = useState<DashboardPage>("overview");

  const handleSetPage = useCallback((page: DashboardPage) => {
    setActivePage(page);
  }, []);

  return {
    // ── Dados (trocar por estado + fetch na integração real) ──
    profile: mockProfile,
    devices: mockDevices,
    readings: mockReadings,
    alerts: mockAlerts,
    isLoading: false,

    // ── Estado de navegação ──
    selectedDeviceId,
    setSelectedDeviceId,
    activePage,
    setActivePage: handleSetPage,
  };
}

export type DashboardPage = "overview" | "devices" | "history" | "agent";
