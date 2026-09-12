import { cn } from "cn";
import { AlertTriangle, Info, XCircle } from "lucide-react";
import type { DashboardAlert } from "../types";

interface AlertsListProps {
  alerts: DashboardAlert[];
  className?: string;
}

const SEVERITY_CONFIG = {
  critical: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/8 border-red-500/20",
    dot: "bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-orange-500",
    bg: "bg-orange-500/8 border-orange-500/20",
    dot: "bg-orange-500",
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-500/8 border-blue-500/20",
    dot: "bg-blue-500",
  },
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  return `${Math.floor(diff / 3600)}h`;
}

export function AlertsList({ alerts, className }: AlertsListProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
        Nenhum alerta no momento.
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {alerts.map((alert) => {
        const cfg = SEVERITY_CONFIG[alert.severity];
        const Icon = cfg.icon;

        return (
          <div
            key={alert.id}
            className={cn("flex items-start gap-3 rounded-xl border px-3.5 py-3", cfg.bg)}
          >
            <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", cfg.color)} />
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground leading-snug">{alert.message}</p>
              <span className="text-xs text-muted-foreground">
                {alert.device_name} · {timeAgo(alert.created_at)} atrás
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
