import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { DashboardAlert, Device, SoilReading } from "~/routes/dashboard/types";

type DashboardContextValue = {
  devices: Device[];
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  readings: SoilReading[];
  setReadings: React.Dispatch<React.SetStateAction<SoilReading[]>>;
  alerts: DashboardAlert[];
  setAlerts: React.Dispatch<React.SetStateAction<DashboardAlert[]>>;
  selectedDeviceId: string;
  setSelectedDeviceId: React.Dispatch<React.SetStateAction<string>>;
  activePage: "overview" | "devices" | "history" | "agent";
  setActivePage: React.Dispatch<React.SetStateAction<"overview" | "devices" | "history" | "agent">>;
};

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [readings, setReadings] = useState<SoilReading[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [activePage, setActivePage] = useState<"overview" | "devices" | "history" | "agent">(
    "overview",
  );

  const value = useMemo<DashboardContextValue>(
    () => ({
      devices,
      setDevices,
      readings,
      setReadings,
      alerts,
      setAlerts,
      selectedDeviceId,
      setSelectedDeviceId,
      activePage,
      setActivePage,
    }),
    [devices, readings, alerts, selectedDeviceId, activePage],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }

  return context;
}

export default useDashboardContext;
