export type SoilStatus = 'dry' | 'low' | 'optimal' | 'high' | 'saturated';

// Moisture bands (%): dry <20, low 20–<40, optimal 40–<70, high 70–<85, saturated ≥85.
// ml/train.py uses the same thresholds for the band hit rate.
export const SOIL_THRESHOLDS = {
  dry: 20,
  low: 40,
  optimal: 70,
  high: 85,
} as const;

export function classifySoil(humidity: number): SoilStatus {
  if (humidity < SOIL_THRESHOLDS.dry) return 'dry';
  if (humidity < SOIL_THRESHOLDS.low) return 'low';
  if (humidity < SOIL_THRESHOLDS.optimal) return 'optimal';
  if (humidity < SOIL_THRESHOLDS.high) return 'high';
  return 'saturated';
}
