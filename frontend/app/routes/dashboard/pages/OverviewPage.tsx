import { Droplets, Cpu, Activity, AlertTriangle } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { HumidityGauge } from "../components/HumidityGauge";
import { SoilChart } from "../components/SoilChart";
import { DeviceList } from "../components/DeviceList";
import { AlertsList } from "../components/AlertsList";
import { EarthAgentPreview } from "../components/EarthAgentPreview";
import type { DashboardData, Device } from "../types";

interface OverviewPageProps extends DashboardData {
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
}

export function OverviewPage({
  devices,
  readings,
  alerts,
  selectedDeviceId,
  setSelectedDeviceId,
}: OverviewPageProps) {
  const onlineDevices = devices.filter((d) => d.is_online).length;

  const allLatestHumidity = devices
    .filter((d) => d.last_reading)
    .map((d) => d.last_reading!.humidity_pct);
  const avgHumidity =
    allLatestHumidity.length > 0
      ? allLatestHumidity.reduce((a, b) => a + b, 0) / allLatestHumidity.length
      : 0;

  const criticalAlerts = alerts.filter((a) => a.severity === "critical").length;

  const selectedDevice: Device | undefined = devices.find((d) => d.id === selectedDeviceId);
  const selectedReadings = readings.filter((r) => r.device_id === selectedDeviceId);
  const currentHumidity = selectedDevice?.last_reading?.humidity_pct ?? 0;

  return (
    <div className="flex flex-col gap-6 p-6 min-h-0 overflow-y-auto">
      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          title="Umidade Média"
          value={avgHumidity.toFixed(0)}
          unit="%"
          icon={Droplets}
          trend="Média de todos os sensores"
        />
        <StatCard
          title="Dispositivos Online"
          value={`${onlineDevices}/${devices.length}`}
          icon={Cpu}
          trend={onlineDevices === devices.length ? "Todos operando" : "Verifique os offline"}
          trendUp={onlineDevices === devices.length}
        />
        <StatCard
          title="Leituras (24h)"
          value={selectedReadings.length}
          icon={Activity}
          trend="Sensor selecionado"
          trendUp
        />
        <StatCard
          title="Alertas Críticos"
          value={criticalAlerts}
          icon={AlertTriangle}
          trend={criticalAlerts === 0 ? "Nenhum alerta" : "Requer atenção"}
          trendUp={criticalAlerts === 0}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — Gauge + Chart */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Gauge + Chart card */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-sm font-semibold text-foreground">Umidade Atual</h2>
                <p className="text-xs text-muted-foreground">
                  {selectedDevice?.name ?? "—"} · {selectedDevice?.location ?? ""}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <HumidityGauge humidity={currentHumidity} className="shrink-0" />
              <div className="flex-1 w-full">
                <p className="text-xs text-muted-foreground mb-2">Histórico — últimas 24h</p>
                <SoilChart readings={selectedReadings} />
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-foreground">Alertas</h2>
            <AlertsList alerts={alerts} />
          </div>
        </div>

        {/* Right — Devices + Earth Agent */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-foreground">Sensores</h2>
            <DeviceList
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onSelect={setSelectedDeviceId}
            />
          </div>

          <EarthAgentPreview />
        </div>
      </div>
    </div>
  );
}
