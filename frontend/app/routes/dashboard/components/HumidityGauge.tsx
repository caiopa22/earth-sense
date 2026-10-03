import { cn } from "cn";
import { getSoilStatus, SOIL_STATUS_LABEL, SOIL_STATUS_COLOR } from "../types";

interface HumidityGaugeProps {
  humidity: number; // 0–100
  deviceName?: string;
  className?: string;
}

export function HumidityGauge({ humidity, deviceName, className }: HumidityGaugeProps) {
  const status = getSoilStatus(humidity);
  const label = SOIL_STATUS_LABEL[status];
  const colorClass = SOIL_STATUS_COLOR[status];

  // SVG arc parameters
  const radius = 70;
  const stroke = 10;
  const circumference = Math.PI * radius; // half-circle = π * r
  const offset = circumference * (1 - humidity / 100);

  // Color map for arc stroke
  const arcColorMap: Record<typeof status, string> = {
    dry: "#f97316",
    low: "#eab308",
    optimal: "#10b981",
    high: "#3b82f6",
    saturated: "#8b5cf6",
  };
  const arcColor = arcColorMap[status];

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative flex items-end justify-center">
        {/* SVG gauge — half-circle */}
        <svg width="200" height="110" viewBox="0 0 200 110" className="overflow-visible">
          {/* Track */}
          <path
            d="M 15 100 A 85 85 0 0 1 185 100"
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            className="text-muted/30"
          />
          {/* Filled arc */}
          <path
            d="M 15 100 A 85 85 0 0 1 185 100"
            fill="none"
            stroke={arcColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${offset}`}
            style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.5s ease" }}
            transform="scale(-1, 1) translate(-200, 0)"
          />
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = Math.PI * (1 - tick / 100);
            const x = 100 + 85 * Math.cos(angle);
            const y = 100 - 85 * Math.sin(angle);
            return <circle key={tick} cx={x} cy={y} r={2} fill={arcColor} opacity={0.4} />;
          })}
        </svg>

        {/* Center value */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center pb-1">
          <span className={cn("text-4xl font-bold tabular-nums tracking-tight", colorClass)}>
            {humidity.toFixed(0)}
            <span className="text-xl font-medium text-muted-foreground">%</span>
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="flex flex-col items-center gap-0.5">
        <span className={cn("text-sm font-semibold", colorClass)}>{label}</span>
        {deviceName && <span className="text-xs text-muted-foreground">{deviceName}</span>}
      </div>
    </div>
  );
}
