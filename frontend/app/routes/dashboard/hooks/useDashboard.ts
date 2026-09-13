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

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/contexts/auth-context";
import { api } from "~/lib/api";
import { mockAlerts, mockDevices, mockReadings } from "../data/mock";
import type { DashboardData } from "../types";

export function useDashboard(): DashboardData & {
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  activePage: DashboardPage;
  setActivePage: (page: DashboardPage) => void;
  isAuthenticated: boolean;
} {
  const navigate = useNavigate();

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(mockDevices[0]?.id ?? "");
  const [activePage, setActivePage] = useState<DashboardPage>("overview");
  const [devices, setDevices] = useState(mockDevices);
  const [readings, setReadings] = useState(mockReadings);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [isLoading, setIsLoading] = useState(true);

  const { profile, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !profile) {
      navigate("/auth");
      return;
    }

    const loadDashboard = async () => {
      setIsLoading(true);

      try {
        const [devicesRes, readingsRes, alertsRes] = await Promise.all([
          api.get("/devices"),
          api.get("/soil-readings"),
          api.get("/users/me"),
        ]);

        setDevices(devicesRes.data.devices ?? mockDevices);
        setReadings(readingsRes.data.readings ?? mockReadings);
        setAlerts(alertsRes.data.alerts ?? mockAlerts);
      } catch {
        setDevices(mockDevices);
        setReadings(mockReadings);
        setAlerts(mockAlerts);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [profile?.id, isAuthenticated, navigate]);

  const handleSetPage = useCallback((page: DashboardPage) => {
    setActivePage(page);
  }, []);

  return {
    profile,
    devices,
    readings,
    alerts,
    isLoading,
    selectedDeviceId,
    setSelectedDeviceId,
    activePage,
    setActivePage: handleSetPage,
    isAuthenticated,
  };
}

export type DashboardPage = "overview" | "devices" | "history" | "agent";
