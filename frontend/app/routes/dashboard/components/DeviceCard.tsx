import { cn } from "cn";
import { MapPin, Wifi, WifiOff } from "lucide-react";
import type { Device } from "../types";
import { getSoilStatus, SOIL_STATUS_LABEL, SOIL_STATUS_COLOR, SOIL_STATUS_BG } from "../types";

interface DeviceCardProps {
  device: Device;
  isSelected?: boolean;
  onClick?: () => void;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  return `${Math.floor(diff / 3600)}h atrás`;
}

export function DeviceCard({ device, isSelected, onClick }: DeviceCardProps) {
  const humidity = device.last_reading?.humidity_pct ?? null;
  const status = humidity !== null ? getSoilStatus(humidity) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border p-4 flex flex-col gap-3 transition-all cursor-pointer",
        "hover:border-primary/40 hover:bg-card/80",
        isSelected
          ? "border-primary/60 bg-primary/5 shadow-sm shadow-primary/10"
          : "border-border/60 bg-card"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground leading-tight">
            {device.name}
          </span>
          {device.location && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {device.location}
            </span>
          )}
        </div>

        <span
          className={cn(
            "flex items-center gap-1 text-xs font-medium shrink-0 px-2 py-0.5 rounded-full",
            device.is_online
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-muted text-muted-foreground"
          )}
        >
          {device.is_online ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          {device.is_online ? "Online" : "Offline"}
        </span>
      </div>

      {/* Humidity */}
      {humidity !== null && status ? (
        <div className={cn("rounded-xl border px-3 py-2 flex items-center justify-between", SOIL_STATUS_BG[status])}>
          <span className={cn("text-2xl font-bold tabular-nums", SOIL_STATUS_COLOR[status])}>
            {humidity.toFixed(0)}
            <span className="text-sm font-normal opacity-70">%</span>
          </span>
          <span className={cn("text-xs font-medium", SOIL_STATUS_COLOR[status])}>
            {SOIL_STATUS_LABEL[status]}
          </span>
        </div>
      ) : (
        <div className="rounded-xl border border-border/40 bg-muted/20 px-3 py-2">
          <span className="text-xs text-muted-foreground">Sem leituras recentes</span>
        </div>
      )}

      {/* Last seen */}
      {device.last_seen && (
        <span className="text-xs text-muted-foreground">
          Última atualização: {timeAgo(device.last_seen)}
        </span>
      )}
    </button>
  );
}
