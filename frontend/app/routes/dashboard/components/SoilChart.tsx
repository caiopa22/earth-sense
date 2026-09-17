import { cn } from "cn";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
      {payload.map((item: any) => (
        <p key={item.dataKey} className="font-semibold text-foreground">
          Sensor {String(item.dataKey).replace("sensor_", "")} : {Number(item.value).toFixed(1)}
          <span className="text-muted-foreground font-normal">%</span>
        </p>
      ))}
    </div>
  );
}

export function SoilChart({ readings, className }: SoilChartProps) {
  const sensorIndexes = [...new Set(readings.map((reading) => reading.sensor_index ?? 1))].sort(
    (a, b) => a - b,
  );
  const dataByTimestamp = new Map<string, Record<string, string | number>>();

  readings
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-Math.max(48, sensorIndexes.length * 48))
    .forEach((reading) => {
      const timestamp = reading.created_at;
      const point = dataByTimestamp.get(timestamp) ?? { time: formatTime(timestamp) };
      point[`sensor_${reading.sensor_index ?? 1}`] = reading.humidity_pct;
      dataByTimestamp.set(timestamp, point);
    });

  const data = [...dataByTimestamp.values()];
  const colors = ["var(--primary)", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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
          {sensorIndexes.length > 1 && (
            <Legend formatter={(value) => `Sensor ${value.replace("sensor_", "")}`} />
          )}
          {sensorIndexes.map((sensorIndex, index) => (
            <Area
              key={sensorIndex}
              type="monotone"
              dataKey={`sensor_${sensorIndex}`}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              fill="none"
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
