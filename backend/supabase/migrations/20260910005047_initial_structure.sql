-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. DEVICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    mac_address VARCHAR(17) UNIQUE NOT NULL,
    location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE
);

-- Index for searching user devices
CREATE INDEX IF NOT EXISTS idx_devices_user_id 
ON public.devices(user_id);

-- ============================================================
-- 3. SOIL READINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.soil_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    humidity_pct NUMERIC(5,2) NOT NULL CONSTRAINT chk_humidity_range CHECK (humidity_pct >= 0 AND humidity_pct <= 100),
    raw_value INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for time-series charts and LLM context queries
CREATE INDEX IF NOT EXISTS idx_soil_readings_device_created 
ON public.soil_readings(device_id, created_at DESC);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS) CONFIGURATION
-- ============================================================
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_readings ENABLE ROW LEVEL SECURITY;

-- Devices Policies
CREATE POLICY "Users can view their own devices"
ON public.devices FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
ON public.devices FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
ON public.devices FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
ON public.devices FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Soil Readings Policies
CREATE POLICY "Users can view readings of their own devices"
ON public.soil_readings FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.devices
        WHERE public.devices.id = public.soil_readings.device_id
          AND public.devices.user_id = auth.uid()
    )
);

CREATE POLICY "Allow reading insertion for authenticated or service role"
ON public.soil_readings FOR INSERT
TO authenticated, service_role
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.devices
        WHERE public.devices.id = public.soil_readings.device_id
    )
);