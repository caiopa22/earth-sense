import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { useState } from "react";
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

type ChartRangeHours = 6 | 24 | 48;

const chartRanges: { label: string; hours: ChartRangeHours }[] = [
  { label: "6h", hours: 6 },
  { label: "24h", hours: 24 },
  { label: "48h", hours: 48 },
];

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
  const [rangeHours, setRangeHours] = useState<ChartRangeHours>(24);
  const rangeStart = Date.now() - rangeHours * 60 * 60 * 1000;
  const sensorIndexes = [...new Set(readings.map((reading) => reading.sensor_index ?? 1))].sort(
    (a, b) => a - b,
  );
  const dataByTimestamp = new Map<string, Record<string, string | number>>();

  readings
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .filter((reading) => new Date(reading.created_at).getTime() >= rangeStart)
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
      <div className="mb-2 flex items-center justify-end gap-1">
        {chartRanges.map((range) => (
          <Button
            key={range.hours}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRangeHours(range.hours)}
            className={cn(
              "h-7 rounded-md px-2 text-[11px]",
              rangeHours === range.hours && "bg-primary/10 text-primary hover:bg-primary/15",
            )}
          >
            {range.label}
          </Button>
        ))}
      </div>
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
