import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendUp,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-5 flex flex-col gap-3 transition-all hover:border-border",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <span className="p-2 rounded-xl bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </span>
      </div>

      <div className="flex items-end gap-1.5">
        <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground mb-0.5">{unit}</span>}
      </div>

      {trend && (
        <p className={cn("text-xs font-medium", trendUp ? "text-emerald-500" : "text-orange-500")}>
          {trend}
        </p>
      )}
    </div>
  );
}
