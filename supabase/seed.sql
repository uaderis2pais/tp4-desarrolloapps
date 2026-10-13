-- ==============================================================================
-- AGROPULSE - SEMILLA DE DATOS DIDÁCTICA (§14 del PRD)
-- Zona Concordia, Entre Ríos (Coordenadas ficticias de práctica)
-- ==============================================================================

-- 1. ORGANIZACIÓN DIDÁCTICA
INSERT INTO organizations (id, name, region)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Estancia Didáctica Concordia',
    'Concordia, Entre Ríos'
) ON CONFLICT (id) DO NOTHING;

-- 2. SEGUNDA ORGANIZACIÓN (Para demostrar aislamiento RF-02 y selector RF-03)
INSERT INTO organizations (id, name, region)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'Agropecuaria El Palmar',
    'Colón, Entre Ríos'
) ON CONFLICT (id) DO NOTHING;

-- 3. LOTES AGRÍCOLAS (Coordenadas en Concordia: -31.39, -58.02)
-- Costa 1: Cítricos, estado verde (óptimo ~35%)
INSERT INTO plots (id, organization_id, name, crop, geom, threshold_min, threshold_max)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Costa 1',
    'Citrus (Naranjas Valencia)',
    '[
        {"latitude": -31.3910, "longitude": -58.0250},
        {"latitude": -31.3910, "longitude": -58.0180},
        {"latitude": -31.3960, "longitude": -58.0180},
        {"latitude": -31.3960, "longitude": -58.0250}
    ]'::jsonb,
    25.0,
    45.0
) ON CONFLICT (id) DO NOTHING;

-- Costa 2: Cítricos, estado rojo (seco ~18% para H1)
INSERT INTO plots (id, organization_id, name, crop, geom, threshold_min, threshold_max)
VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Costa 2',
    'Citrus (Mandarinas Murcott)',
    '[
        {"latitude": -31.3970, "longitude": -58.0250},
        {"latitude": -31.3970, "longitude": -58.0180},
        {"latitude": -31.4020, "longitude": -58.0180},
        {"latitude": -31.4020, "longitude": -58.0250}
    ]'::jsonb,
    25.0,
    45.0
) ON CONFLICT (id) DO NOTHING;

-- Monte A: Soja, estado stale (gris por falta de ticks recientes para H4)
INSERT INTO plots (id, organization_id, name, crop, geom, threshold_min, threshold_max)
VALUES (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Monte A',
    'Soja de 1ra',
    '[
        {"latitude": -31.3910, "longitude": -58.0330},
        {"latitude": -31.3910, "longitude": -58.0260},
        {"latitude": -31.3990, "longitude": -58.0260},
        {"latitude": -31.3990, "longitude": -58.0330}
    ]'::jsonb,
    25.0,
    45.0
) ON CONFLICT (id) DO NOTHING;

-- Lote en la segunda organización para verificar RF-02
INSERT INTO plots (id, organization_id, name, crop, geom, threshold_min, threshold_max)
VALUES (
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000002',
    'Lote Palmar Sur',
    'Maíz Tardío',
    '[
        {"latitude": -31.8500, "longitude": -58.2000},
        {"latitude": -31.8500, "longitude": -58.1900},
        {"latitude": -31.8600, "longitude": -58.1900},
        {"latitude": -31.8600, "longitude": -58.2000}
    ]'::jsonb,
    25.0,
    45.0
) ON CONFLICT (id) DO NOTHING;

-- 4. ESTACIONES DE MEDICIÓN
INSERT INTO stations (id, plot_id, name, lat, lng)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Estación S-01 (Costa 1)', -31.3935, -58.0215),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Estación S-02 (Costa 2)', -31.3995, -58.0215),
    ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Estación S-03 (Monte A)', -31.3950, -58.0295)
ON CONFLICT (id) DO NOTHING;

-- 5. VÁLVULAS DE RIEGO
INSERT INTO valves (id, plot_id, name, status)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Válvula 1A - Goteo Norte', 'closed'),
    ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Válvula 2A - Goteo Sector Murcott', 'closed'),
    ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Válvula 3A - Pivot Aspersión', 'closed')
ON CONFLICT (id) DO NOTHING;

-- 6. SERIES TEMPORALES DE LECTURAS (Últimas 6 horas para el gráfico RF-10)
-- Costa 1: Óptimo (~35%)
INSERT INTO readings (station_id, measured_at, moisture_pct, temp_c, rain_mm, source)
SELECT 
    'c0000000-0000-0000-0000-000000000001',
    NOW() - (n || ' minutes')::INTERVAL,
    34.5 + ROUND((RANDOM() * 3 - 1.5)::NUMERIC, 2),
    22.0 + ROUND((RANDOM() * 2)::NUMERIC, 1),
    0.0,
    'sensor'
FROM generate_series(0, 360, 25) AS n;

-- Costa 2: Seco (~18%, bajo el umbral de 25% para H1)
INSERT INTO readings (station_id, measured_at, moisture_pct, temp_c, rain_mm, source)
SELECT 
    'c0000000-0000-0000-0000-000000000002',
    NOW() - (n || ' minutes')::INTERVAL,
    17.8 + ROUND((RANDOM() * 1.5 - 0.75)::NUMERIC, 2),
    24.5 + ROUND((RANDOM() * 2)::NUMERIC, 1),
    0.0,
    'sensor'
FROM generate_series(0, 360, 25) AS n;

-- Monte A: Stale (última lectura generada hace 45 minutos > 15 min para H4)
INSERT INTO readings (station_id, measured_at, moisture_pct, temp_c, rain_mm, source)
SELECT 
    'c0000000-0000-0000-0000-000000000003',
    NOW() - ((45 + n) || ' minutes')::INTERVAL,
    28.0 + ROUND((RANDOM() * 2)::NUMERIC, 2),
    21.0,
    0.0,
    'sensor'
FROM generate_series(0, 300, 25) AS n;

-- 7. ALERTA INICIAL DE LOTE SECO (RF-19)
INSERT INTO alerts (plot_id, type, payload, created_at)
VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'dry',
    '{"message": "Lote Costa 2 por debajo del umbral mínimo de 25%", "moisture_pct": 17.8, "threshold_min": 25.0}'::jsonb,
    NOW() - INTERVAL '5 minutes'
);
