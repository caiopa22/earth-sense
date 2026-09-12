import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { cn } from "cn";
import type { SoilReading } from "../types";

interface SoilChartProps {
  readings: SoilReading[];
  className?: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-foreground">
        {payload[0]?.value?.toFixed(1)}
        <span className="text-muted-foreground font-normal">% umidade</span>
      </p>
    </div>
  );
}

export function SoilChart({ readings, className }: SoilChartProps) {
  // Mostra apenas cada 4ª leitura no eixo X para não poluir
  const data = readings
    .slice(-48)
    .map((r, i) => ({
      time: formatTime(r.created_at),
      humidity: r.humidity_pct,
      index: i,
    }));

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="humidityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            className="text-border/40"
            vertical={false}
          />

          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            interval={7}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="humidity"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#humidityGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--primary)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
