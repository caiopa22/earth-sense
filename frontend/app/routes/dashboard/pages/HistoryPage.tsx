import { useState } from "react";
import { SoilChart } from "../components/SoilChart";
import { Button } from "@/components/ui/button";
import type { Device, SoilReading } from "../types";
import { getSoilStatus, SOIL_STATUS_LABEL, SOIL_STATUS_COLOR } from "../types";
import { cn } from "cn";

interface HistoryPageProps {
  devices: Device[];
  readings: SoilReading[];
}

export function HistoryPage({ devices, readings }: HistoryPageProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(devices[0]?.id ?? "");

  const deviceReadings = readings
    .filter((r) => r.device_id === selectedDeviceId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);

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

      {/* Chart */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-foreground">{selectedDevice?.name ?? "—"}</h2>
          <p className="text-xs text-muted-foreground">{selectedDevice?.location}</p>
        </div>
        <SoilChart readings={deviceReadings} />
      </div>

      {/* Readings Table */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Registros recentes</span>
          <span className="text-xs text-muted-foreground">{deviceReadings.length} leituras</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left px-5 py-2.5 text-muted-foreground font-medium">
                  Data / Hora
                </th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Umidade</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Status</th>
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
    </div>
  );
}
