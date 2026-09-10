export interface SoilReading {
  id: string;
  device_id: string;
  humidity_pct: number;
  raw_value: number | null;
  created_at: string;
}

export interface CreateSoilReadingInput {
  device_id: string;
  humidity_pct: number;
  raw_value?: number | null;
}

export interface UpdateSoilReadingInput {
  humidity_pct?: number;
  raw_value?: number | null;
}
