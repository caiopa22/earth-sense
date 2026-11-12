import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";
import { format } from "date-fns";
import { TrendingUp } from "lucide-react";
import { useForecast } from "../hooks/useForecast";
import { SOIL_STATUS_BG, SOIL_STATUS_COLOR, SOIL_STATUS_LABEL } from "../types";

interface ForecastCardProps {
  deviceId: string;
  isMock: boolean;
}

function formatPoints(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function ForecastCard({ deviceId, isMock }: ForecastCardProps) {
  const { forecast, error, isLoading } = useForecast(deviceId, !isMock);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Previsão a 30 min</h2>
        <span className="p-2 rounded-xl bg-primary/10">
          <TrendingUp className="w-4 h-4 text-primary" />
        </span>
      </div>

      {isMock ? (
        <p className="text-xs text-muted-foreground">Previsão disponível apenas com dados reais.</p>
      ) : isLoading && !forecast ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : error || !forecast ? (
        <p className="text-xs text-muted-foreground">{error ?? "Selecione um sensor."}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {forecast.sensors.map((sensor) => (
              <li
                key={sensor.sensor_index}
                className={cn(
                  "rounded-xl border px-3 py-2.5 flex flex-col gap-1",
                  sensor.status === "ok"
                    ? SOIL_STATUS_BG[sensor.predicted_soil_status]
                    : "border-border/60",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Sensor {sensor.sensor_index}
                  </span>
                  {sensor.status === "ok" ? (
                    <span
                      className={cn(
                        "text-xs font-medium",
                        SOIL_STATUS_COLOR[sensor.predicted_soil_status],
                      )}
                    >
                      {SOIL_STATUS_LABEL[sensor.predicted_soil_status]}
                    </span>
                  ) : null}
                </div>

                {sensor.status === "ok" ? (
                  <>
                    <div className="flex items-end justify-between gap-2">
                      <span className="text-xl font-bold tracking-tight text-foreground">
                        {formatPoints(sensor.predicted_humidity_pct)}
                        <span className="text-xs text-muted-foreground ml-0.5">%</span>
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        às {format(new Date(sensor.forecast_for), "HH:mm")}
                      </span>
                    </div>
                    {sensor.model_metrics ? (
                      <p className="text-[11px] text-muted-foreground">
                        erro médio (MAE) de {formatPoints(sensor.model_metrics.mae)} pontos
                        percentuais
                      </p>
                    ) : null}
                  </>
                ) : sensor.status === "stale_data" ? (
                  <p className="text-[11px] text-muted-foreground">
                    Sem dados recentes. Última leitura às{" "}
                    {format(new Date(sensor.last_reading_at), "dd/MM HH:mm")}.
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Leituras insuficientes para prever.
                  </p>
                )}
              </li>
            ))}
          </ul>

          <p className="text-[11px] text-muted-foreground">
            Ridge, treinado com {forecast.model.train_samples} amostras em{" "}
            {format(new Date(forecast.model.trained_at), "dd/MM/yyyy")}
          </p>
        </>
      )}
    </div>
  );
}
