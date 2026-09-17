-- ============================================================
-- Modular sensor ingestion and device credentials
-- ============================================================

ALTER TABLE public.devices
    ADD COLUMN IF NOT EXISTS sensor_count SMALLINT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS device_key_hash TEXT,
    ADD COLUMN IF NOT EXISTS device_key_created_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS device_key_revoked_at TIMESTAMPTZ;

ALTER TABLE public.devices
    ADD CONSTRAINT chk_devices_sensor_count
    CHECK (sensor_count > 0 AND sensor_count <= 32);

ALTER TABLE public.soil_readings
    ADD COLUMN IF NOT EXISTS sensor_index SMALLINT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS batch_id UUID NOT NULL DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS sampled_at TIMESTAMPTZ;

ALTER TABLE public.soil_readings
    ADD CONSTRAINT chk_soil_readings_sensor_index
    CHECK (sensor_index > 0);

ALTER TABLE public.soil_readings
    ADD CONSTRAINT uq_soil_readings_batch_sensor
    UNIQUE (device_id, batch_id, sensor_index);

CREATE INDEX IF NOT EXISTS idx_soil_readings_device_sensor_created
ON public.soil_readings(device_id, sensor_index, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_devices_device_key_hash
ON public.devices(device_key_hash)
WHERE device_key_hash IS NOT NULL;
