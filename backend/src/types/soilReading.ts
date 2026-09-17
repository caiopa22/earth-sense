export interface SoilReading {
  id: string;
  device_id: string;
  sensor_index: number;
  batch_id: string;
  humidity_pct: number;
  raw_value: number | null;
  sampled_at: string | null;
  created_at: string;
}

export interface CreateSoilReadingInput {
  device_id: string;
  sensor_index?: number;
  batch_id?: string;
  humidity_pct: number;
  raw_value?: number | null;
  sampled_at?: string | null;
}

export interface CreateSoilReadingBatchInput {
  device_id: string;
  batch_id: string;
  sampled_at?: string | null;
  readings: Array<{
    sensor_index: number;
    humidity_pct: number;
    raw_value?: number | null;
  }>;
}

export interface UpdateSoilReadingInput {
  humidity_pct?: number;
  raw_value?: number | null;
}
