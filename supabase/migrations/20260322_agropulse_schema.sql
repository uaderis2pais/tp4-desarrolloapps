-- ==============================================================================
-- AGROPULSE - ESQUEMA DE BASE DE DATOS POSTGRESQL (TP 4)
-- ==============================================================================

-- 1. ORGANIZACIONES / ESTABLECIMIENTOS
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MEMBRESÍAS Y ROLES DE USUARIO
-- Roles: producer (dueño/encargado), operator (válvulas), advisor (agrónomo sólo lectura)
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('producer', 'operator', 'advisor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_organization UNIQUE (user_id, organization_id)
);

-- 3. LOTES AGRÍCOLAS (PLOTS)
CREATE TABLE IF NOT EXISTS plots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    crop TEXT NOT NULL,
    geom JSONB NOT NULL, -- Coordenadas del polígono: [[lat, lng], [lat, lng], ...]
    threshold_min NUMERIC NOT NULL DEFAULT 25.0 CHECK (threshold_min >= 0 AND threshold_min <= 100),
    threshold_max NUMERIC NOT NULL DEFAULT 45.0 CHECK (threshold_max >= threshold_min AND threshold_max <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ESTACIONES DE MEDICIÓN (STATIONS)
CREATE TABLE IF NOT EXISTS stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. LECTURAS DE SENSORES Y MANUALES (READINGS)
CREATE TABLE IF NOT EXISTS readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    moisture_pct NUMERIC(5, 2) NOT NULL CHECK (moisture_pct >= 0 AND moisture_pct <= 100),
    temp_c NUMERIC(4, 1) NOT NULL,
    rain_mm NUMERIC(5, 1) NOT NULL DEFAULT 0.0,
    source TEXT NOT NULL CHECK (source IN ('sensor', 'manual')) DEFAULT 'sensor',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice de alto rendimiento para series temporales y última lectura
CREATE INDEX IF NOT EXISTS idx_readings_station_measured 
ON readings (station_id, measured_at DESC);

-- 6. VÁLVULAS DE RIEGO (VALVES)
CREATE TABLE IF NOT EXISTS valves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'closed')) DEFAULT 'closed',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. COMANDOS DE IRRIGACIÓN (IRRIGATION_COMMANDS)
CREATE TABLE IF NOT EXISTS irrigation_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valve_id UUID NOT NULL REFERENCES valves(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL CHECK (action IN ('open', 'close', 'irrigate_duration')),
    duration_min INTEGER CHECK (duration_min >= 1 AND duration_min <= 120),
    status TEXT NOT NULL CHECK (status IN ('pending', 'applied', 'failed', 'cancelled')) DEFAULT 'pending',
    client_request_id UUID NOT NULL UNIQUE, -- Idempotencia garantizada por el cliente
    error_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_at TIMESTAMPTZ
);

-- RF-16: Índice parcial único para garantizar que NO se permita un segundo comando pending sobre la misma válvula
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_command_per_valve 
ON irrigation_commands (valve_id) 
WHERE (status = 'pending');

-- 8. ALERTAS DEL SISTEMA (ALERTS)
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('dry', 'stale', 'failed_command')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- 9. HABILITACIÓN DE SUPABASE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE readings;
ALTER PUBLICATION supabase_realtime ADD TABLE valves;
ALTER PUBLICATION supabase_realtime ADD TABLE irrigation_commands;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
