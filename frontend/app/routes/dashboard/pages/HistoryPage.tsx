import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "cn";
import { Droplets } from "lucide-react";
import { useState } from "react";
import { SoilChart } from "../components/SoilChart";
import type { Device, SoilReading } from "../types";
import { getSoilStatus, SOIL_STATUS_COLOR, SOIL_STATUS_LABEL } from "../types";

interface HistoryPageProps {
  devices: Device[];
  readings: SoilReading[];
}

export function HistoryPage({ devices, readings }: HistoryPageProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.id ?? "");
  const [selectedSensorIndex, setSelectedSensorIndex] = useState<number | "all">("all");

  const deviceReadings = readings
    .filter((r) => r.device_id === selectedDeviceId)
    .filter((r) => selectedSensorIndex === "all" || r.sensor_index === selectedSensorIndex)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);
  const sensorIndexes = Array.from(
    new Set(
      readings.filter((r) => r.device_id === selectedDeviceId).map((r) => r.sensor_index ?? 1),
    ),
  ).sort((a, b) => a - b);

  if (devices.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-6 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-semibold text-foreground">Histórico de Leituras</h1>
          <p className="text-xs text-muted-foreground">Últimas 24 horas por sensor</p>
        </div>

        <Empty className="min-h-90 border-border/60 bg-card/30">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Droplets className="w-5 h-5" />
            </EmptyMedia>
            <EmptyTitle>Ainda não há leituras para mostrar</EmptyTitle>
          </EmptyHeader>
          <EmptyDescription>
            Cadastre um sensor e as leituras aparecerão aqui automaticamente.
          </EmptyDescription>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-lg font-semibold text-foreground">Histórico de Leituras</h1>
        <p className="text-xs text-muted-foreground">Últimas 24 horas por sensor</p>
      </div>

      {/* Device Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {devices.map((d) => (
          <Button
            key={d.id}
            variant="outline"
            size="sm"
            onClick={() => setSelectedDeviceId(d.id)}
            className={cn(
              "rounded-full h-8 text-xs",
              d.id === selectedDeviceId && "bg-primary/10 border-primary/40 text-primary",
            )}
          >
            {d.name}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedSensorIndex("all")}
          className={cn(
            "rounded-full h-8 text-xs",
            selectedSensorIndex === "all" && "bg-primary/10 border-primary/40 text-primary",
          )}
        >
          Todos os sensores
        </Button>
        {sensorIndexes.map((sensorIndex) => (
          <Button
            key={sensorIndex}
            variant="outline"
            size="sm"
            onClick={() => setSelectedSensorIndex(sensorIndex)}
            className={cn(
              "rounded-full h-8 text-xs",
              selectedSensorIndex === sensorIndex && "bg-primary/10 border-primary/40 text-primary",
            )}
          >
            Sensor {sensorIndex}
          </Button>
        ))}
      </div>

      {/* Chart */}
      {deviceReadings.length === 0 ? (
        <Empty className="min-h-55 border-border/60 bg-card/30">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Droplets className="w-5 h-5" />
            </EmptyMedia>
            <EmptyTitle>Sem leituras recentes</EmptyTitle>
          </EmptyHeader>
          <EmptyDescription>O sensor ainda não enviou dados nas últimas 24 horas.</EmptyDescription>
        </Empty>
      ) : (
        <>
          <div className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm font-semibold text-foreground">
                {selectedDevice?.name ?? "—"}
              </h2>
              <p className="text-xs text-muted-foreground">{selectedDevice?.location}</p>
            </div>
            <SoilChart readings={deviceReadings} />
          </div>

          {/* Readings Table */}
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Registros recentes</span>
              <span className="text-xs text-muted-foreground">
                {deviceReadings.length} leituras
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left px-5 py-2.5 text-muted-foreground font-medium">
                      Data / Hora
                    </th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">
                      Sensor
                    </th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">
                      Umidade
                    </th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">
                      Status
                    </th>
                    <th className="text-left px-4 py-2.5 text-muted-foreground font-medium hidden sm:table-cell">
                      Valor ADC
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deviceReadings.slice(0, 20).map((r) => {
                    const status = getSoilStatus(r.humidity_pct);
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-5 py-2.5 text-foreground tabular-nums">
                          {new Date(r.created_at).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          Sensor {r.sensor_index ?? 1}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-2.5 font-bold tabular-nums",
                            SOIL_STATUS_COLOR[status],
                          )}
                        >
                          {r.humidity_pct.toFixed(1)}%
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={cn("text-xs", SOIL_STATUS_COLOR[status])}>
                            {SOIL_STATUS_LABEL[status]}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground tabular-nums hidden sm:table-cell">
                          {r.raw_value ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
