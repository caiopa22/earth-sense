import axios from "axios";
import { useEffect, useState } from "react";
import { api } from "~/lib/api";
import type { ForecastResponse } from "../types";

const FORECAST_POLL_INTERVAL_MS = 3 * 60 * 1000;

export function useForecast(deviceId: string, enabled: boolean) {
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !deviceId) {
      setForecast(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async (showLoading: boolean) => {
      if (showLoading) setIsLoading(true);
      try {
        const { data } = await api.get<ForecastResponse>(`/ml/forecast/${deviceId}`);
        if (cancelled) return;
        setForecast(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setForecast(null);
        // API messages are in English; the UI shows its own Portuguese text.
        setError(
          axios.isAxiosError(err) && err.response?.status === 422
            ? "Leituras insuficientes para prever. Cada sensor precisa de 4 leituras consecutivas."
            : "Não foi possível calcular a previsão agora.",
        );
      } finally {
        if (!cancelled && showLoading) setIsLoading(false);
      }
    };

    void load(true);
    const poller = window.setInterval(() => void load(false), FORECAST_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(poller);
    };
  }, [deviceId, enabled]);

  return { forecast, error, isLoading };
}
