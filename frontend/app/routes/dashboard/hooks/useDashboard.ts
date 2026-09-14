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

export const ENABLE_DEV_DATA_SOURCE_SWITCH = import.meta.env.DEV;

export type DashboardDataSource = "api" | "mock";

export function useDashboard(): DashboardData & {
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  activePage: DashboardPage;
  setActivePage: (page: DashboardPage) => void;
  isAuthenticated: boolean;
  dataSource: DashboardDataSource;
  setDataSource: (source: DashboardDataSource) => void;
} {
  const navigate = useNavigate();

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(mockDevices[0]?.id ?? "");
  const [activePage, setActivePage] = useState<DashboardPage>("overview");
  const [devices, setDevices] = useState(mockDevices);
  const [readings, setReadings] = useState(mockReadings);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSourceState] = useState<DashboardDataSource>("api");

  const { profile, isAuthenticated } = useAuth();

  const setDataSource = useCallback((source: DashboardDataSource) => {
    setDataSourceState(source);

    if (source === "mock") {
      setDevices(mockDevices);
      setReadings(mockReadings);
      setAlerts(mockAlerts);
      setSelectedDeviceId(mockDevices[0]?.id ?? "");
      return;
    }

    setSelectedDeviceId(mockDevices[0]?.id ?? "");
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !profile) {
      navigate("/auth");
      return;
    }

    if (dataSource === "mock") {
      setDevices(mockDevices);
      setReadings(mockReadings);
      setAlerts(mockAlerts);
      setIsLoading(false);
      return;
    }

    const loadDashboard = async () => {
      setIsLoading(true);

      try {
        const [devicesRes, readingsRes] = await Promise.all([
          api.get("/devices"),
          api.get("/soil-readings"),
        ]);

        const nextDevices = devicesRes.data.devices ?? mockDevices;
        const nextReadings = readingsRes.data.readings ?? mockReadings;

        setDevices(nextDevices);
        setReadings(nextReadings);
        setAlerts(mockAlerts);
      } catch {
        setDevices(mockDevices);
        setReadings(mockReadings);
        setAlerts(mockAlerts);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [profile?.id, isAuthenticated, dataSource, navigate]);

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
    dataSource,
    setDataSource,
  };
}

export type DashboardPage = "overview" | "devices" | "history" | "agent";
