import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Device, SoilReading } from "~/routes/dashboard/types";

type DashboardContextValue = {
  devices: Device[];
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  readings: SoilReading[];
  setReadings: React.Dispatch<React.SetStateAction<SoilReading[]>>;
  selectedDeviceId: string;
  setSelectedDeviceId: React.Dispatch<React.SetStateAction<string>>;
  activePage: "overview" | "devices" | "history";
  setActivePage: React.Dispatch<React.SetStateAction<"overview" | "devices" | "history">>;
};

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [readings, setReadings] = useState<SoilReading[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [activePage, setActivePage] = useState<"overview" | "devices" | "history">(
    "overview",
  );

  const value = useMemo<DashboardContextValue>(
    () => ({
      devices,
      setDevices,
      readings,
      setReadings,
      selectedDeviceId,
      setSelectedDeviceId,
      activePage,
      setActivePage,
    }),
    [devices, readings, selectedDeviceId, activePage],
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
