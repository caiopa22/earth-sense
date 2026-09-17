import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "~/contexts/auth-context";
import { api } from "~/lib/api";
import { mockAlerts, mockDevices, mockReadings } from "../data/mock";
import type { DashboardData, Device, SoilReading } from "../types";

export const ENABLE_DEV_DATA_SOURCE_SWITCH = import.meta.env.DEV;

export type DashboardDataSource = "api" | "mock";

function enrichDevices(devices: Device[], readings: SoilReading[]): Device[] {
  return devices.map((device) => {
    const latest = readings
      .filter((reading) => reading.device_id === device.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    return {
      ...device,
      sensor_count: device.sensor_count ?? 1,
      last_reading: latest ?? null,
      is_online: device.last_seen
        ? Date.now() - new Date(device.last_seen).getTime() < 15 * 60 * 1000
        : Boolean(latest),
    };
  });
}

export function useDashboard(): DashboardData & {
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  activePage: DashboardPage;
  setActivePage: (page: DashboardPage) => void;
  isAuthenticated: boolean;
  dataSource: DashboardDataSource;
  setDataSource: (source: DashboardDataSource) => void;
  createDevice: (payload: {
    name: string;
    mac_address: string;
    location?: string;
    sensor_count: number;
  }) => Promise<void>;
  updateDevice: (
    id: string,
    payload: {
      name: string;
      mac_address: string;
      location?: string;
      sensor_count: number;
    },
  ) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
} {
  const navigate = useNavigate();

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(mockDevices[0]?.id ?? "");
  const [activePage, setActivePage] = useState<DashboardPage>("overview");
  const [devices, setDevices] = useState(enrichDevices(mockDevices, mockReadings));
  const [readings, setReadings] = useState(mockReadings);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSourceState] = useState<DashboardDataSource>("api");

  const { profile, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const setDataSource = useCallback((source: DashboardDataSource) => {
    setDataSourceState(source);

    if (source === "mock") {
      setDevices(enrichDevices(mockDevices, mockReadings));
      setReadings(mockReadings);
      setAlerts(mockAlerts);
      setSelectedDeviceId(mockDevices[0]?.id ?? "");
      return;
    }

    setSelectedDeviceId("");
  }, []);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);

    try {
      const [devicesRes, readingsRes] = await Promise.all([
        api.get("/devices"),
        api.get("/soil-readings"),
      ]);

      const nextDevices = devicesRes.data.devices ?? [];
      const nextReadings = readingsRes.data.readings ?? [];
      const enrichedDevices = enrichDevices(nextDevices, nextReadings);

      setDevices(enrichedDevices);
      setReadings(nextReadings);
      setAlerts(mockAlerts);
      setSelectedDeviceId((current) =>
        enrichedDevices.some((device) => device.id === current)
          ? current
          : (enrichedDevices[0]?.id ?? ""),
      );
    } catch {
      setDevices([]);
      setReadings([]);
      setAlerts([]);
      setSelectedDeviceId("");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDevice = useCallback(
    async (payload: {
      name: string;
      mac_address: string;
      location?: string;
      sensor_count: number;
    }) => {
      await api.post("/devices", payload);
      await loadDashboard();
    },
    [loadDashboard],
  );

  const updateDevice = useCallback(
    async (
      id: string,
      payload: {
        name: string;
        mac_address: string;
        location?: string;
        sensor_count: number;
      },
    ) => {
      await api.patch(`/devices/${id}`, payload);
      await loadDashboard();
    },
    [loadDashboard],
  );

  const deleteDevice = useCallback(
    async (id: string) => {
      await api.delete(`/devices/${id}`);
      await loadDashboard();
    },
    [loadDashboard],
  );

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated || !profile) {
      navigate("/auth");
      return;
    }

    if (dataSource === "mock") {
      setDevices(enrichDevices(mockDevices, mockReadings));
      setReadings(mockReadings);
      setAlerts(mockAlerts);
      setIsLoading(false);
      return;
    }

    loadDashboard();
  }, [profile?.id, isAuthenticated, isAuthLoading, dataSource, navigate, loadDashboard]);

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
    createDevice,
    updateDevice,
    deleteDevice,
  };
}

export type DashboardPage = "overview" | "devices" | "history" | "agent";
