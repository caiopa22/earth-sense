import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Activity, Cpu, Droplets } from "lucide-react";
import { DeviceSelect } from "../components/DeviceSelect";
import { ForecastCard } from "../components/ForecastCard";
import { HumidityGauge } from "../components/HumidityGauge";
import { SoilChart } from "../components/SoilChart";
import { StatCard } from "../components/StatCard";
import type { DashboardData, Device } from "../types";

interface OverviewPageProps extends DashboardData {
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  isMock: boolean;
}

export function OverviewPage({
  devices,
  readings,
  selectedDeviceId,
  setSelectedDeviceId,
  isMock,
}: OverviewPageProps) {
  const onlineDevices = devices.filter((d) => d.is_online).length;

  const allLatestHumidity = devices
    .map((d) => d.current_humidity_pct)
    .filter((h): h is number => h != null);
  const avgHumidity =
    allLatestHumidity.length > 0
      ? allLatestHumidity.reduce((a, b) => a + b, 0) / allLatestHumidity.length
      : 0;

  const selectedDevice: Device | undefined = devices.find((d) => d.id === selectedDeviceId);
  const selectedReadings = readings.filter((r) => r.device_id === selectedDeviceId);
  const last24hStart = Date.now() - 24 * 60 * 60 * 1000;
  const readingsLast24h = selectedReadings.filter(
    (r) => new Date(r.created_at).getTime() >= last24hStart,
  ).length;
  const currentHumidity = selectedDevice?.current_humidity_pct ?? 0;

  if (devices.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-6 min-h-0 overflow-y-auto">
        <Empty className="min-h-90 border-border/60 bg-card/30">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Droplets className="w-5 h-5" />
            </EmptyMedia>
            <EmptyTitle>Seu painel ainda está vazio</EmptyTitle>
          </EmptyHeader>
          <EmptyDescription>
            Registre o primeiro sensor para começar a acompanhar a umidade e o histórico.
          </EmptyDescription>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 min-h-0 overflow-y-auto">
      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
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
          value={readingsLast24h}
          icon={Activity}
          trend="Sensor selecionado"
          trendUp
        />
      </div>

      {/* Current humidity + chart — full width, device picked in the header */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Umidade Atual</h2>
          <DeviceSelect
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            onSelect={setSelectedDeviceId}
          />
        </div>

        {selectedDevice ? (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <HumidityGauge humidity={currentHumidity} className="shrink-0" />
            <div className="flex-1 w-full">
              <p className="text-xs text-muted-foreground mb-2">Histórico — últimas 24h</p>
              {selectedReadings.length === 0 ? (
                <Empty className="min-h-45 border-border/60 bg-transparent">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Droplets className="w-5 h-5" />
                    </EmptyMedia>
                    <EmptyTitle>Sem leitura recente</EmptyTitle>
                  </EmptyHeader>
                  <EmptyDescription>
                    O sensor ainda não enviou dados de umidade nas últimas 24 horas.
                  </EmptyDescription>
                </Empty>
              ) : (
                <SoilChart readings={selectedReadings} height={260} />
              )}
            </div>
          </div>
        ) : (
          <Empty className="min-h-60 border-border/60 bg-transparent">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Droplets className="w-5 h-5" />
              </EmptyMedia>
              <EmptyTitle>Selecione um dispositivo</EmptyTitle>
            </EmptyHeader>
            <EmptyDescription>
              Escolha um dispositivo no seletor acima para visualizar a umidade atual.
            </EmptyDescription>
          </Empty>
        )}
      </div>

      {/* Forecast — one card per sensor, side by side */}
      {selectedDevice ? <ForecastCard deviceId={selectedDevice.id} isMock={isMock} /> : null}
    </div>
  );
}
