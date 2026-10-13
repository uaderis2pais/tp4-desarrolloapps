-- ==============================================================================
-- AGROPULSE - POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE valves ENABLE ROW LEVEL SECURITY;
ALTER TABLE irrigation_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Helper function: Verifica si el usuario actual es miembro de una organización
CREATE OR REPLACE FUNCTION is_member_of(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM memberships
        WHERE user_id = auth.uid()
        AND organization_id = org_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Obtiene el rol del usuario en una organización
CREATE OR REPLACE FUNCTION get_user_role(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM memberships
    WHERE user_id = auth.uid()
    AND organization_id = org_id;
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 1. ORGANIZATIONS
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view organizations they belong to"
ON organizations FOR SELECT
USING (is_member_of(id));

-- ------------------------------------------------------------------------------
-- 2. MEMBERSHIPS
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view memberships of their organizations"
ON memberships FOR SELECT
USING (user_id = auth.uid() OR is_member_of(organization_id));

-- ------------------------------------------------------------------------------
-- 3. PLOTS
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view plots in their organizations"
ON plots FOR SELECT
USING (is_member_of(organization_id));

CREATE POLICY "Producers and operators can update plot thresholds"
ON plots FOR UPDATE
USING (
    is_member_of(organization_id) 
    AND get_user_role(organization_id) IN ('producer', 'operator')
)
WITH CHECK (
    is_member_of(organization_id) 
    AND get_user_role(organization_id) IN ('producer', 'operator')
);

CREATE POLICY "Producers can insert plots"
ON plots FOR INSERT
WITH CHECK (
    is_member_of(organization_id) 
    AND get_user_role(organization_id) = 'producer'
);

-- ------------------------------------------------------------------------------
-- 4. STATIONS
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view stations"
ON stations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM plots p
        WHERE p.id = stations.plot_id
        AND is_member_of(p.organization_id)
    )
);

-- ------------------------------------------------------------------------------
-- 5. READINGS
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view readings"
ON readings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stations s
        JOIN plots p ON p.id = s.plot_id
        WHERE s.id = readings.station_id
        AND is_member_of(p.organization_id)
    )
);

-- Lecturas manuales (RF-21): Productores y operadores pueden cargar lecturas manuales
CREATE POLICY "Producers and operators can insert manual readings"
ON readings FOR INSERT
WITH CHECK (
    source = 'manual'
    AND EXISTS (
        SELECT 1 FROM stations s
        JOIN plots p ON p.id = s.plot_id
        WHERE s.id = readings.station_id
        AND is_member_of(p.organization_id)
        AND get_user_role(p.organization_id) IN ('producer', 'operator')
    )
);

-- Lecturas de sensor: Solo el service_role (worker) puede insertar lecturas automáticas
CREATE POLICY "Service role can insert sensor readings"
ON readings FOR INSERT
TO service_role
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6. VALVES
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view valves"
ON valves FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM plots p
        WHERE p.id = valves.plot_id
        AND is_member_of(p.organization_id)
    )
);

-- Válvulas actualizadas por el worker (service_role) al aplicar comandos
CREATE POLICY "Service role can update valves"
ON valves FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 7. IRRIGATION COMMANDS
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view commands"
ON irrigation_commands FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM valves v
        JOIN plots p ON p.id = v.plot_id
        WHERE v.id = irrigation_commands.valve_id
        AND is_member_of(p.organization_id)
    )
);

-- RF-14 / H2: Solo producer y operator pueden emitir comandos (Asesor es RECHAZADO)
CREATE POLICY "Producers and operators can insert irrigation commands"
ON irrigation_commands FOR INSERT
WITH CHECK (
    requested_by = auth.uid()
    AND status = 'pending'
    AND EXISTS (
        SELECT 1 FROM valves v
        JOIN plots p ON p.id = v.plot_id
        WHERE v.id = irrigation_commands.valve_id
        AND is_member_of(p.organization_id)
        AND get_user_role(p.organization_id) IN ('producer', 'operator')
    )
);

-- RF-17: Cancelar comando pendiente
CREATE POLICY "Producers and operators can cancel pending commands"
ON irrigation_commands FOR UPDATE
USING (
    status = 'pending'
    AND EXISTS (
        SELECT 1 FROM valves v
        JOIN plots p ON p.id = v.plot_id
        WHERE v.id = irrigation_commands.valve_id
        AND is_member_of(p.organization_id)
        AND get_user_role(p.organization_id) IN ('producer', 'operator')
    )
)
WITH CHECK (
    status = 'cancelled'
);

-- Service role puede actualizar comandos (transición a applied o failed)
CREATE POLICY "Service role can update commands"
ON irrigation_commands FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 8. ALERTS
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view alerts"
ON alerts FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM plots p
        WHERE p.id = alerts.plot_id
        AND is_member_of(p.organization_id)
    )
);

CREATE POLICY "Members can mark alerts as read"
ON alerts FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM plots p
        WHERE p.id = alerts.plot_id
        AND is_member_of(p.organization_id)
    )
)
WITH CHECK (true);

CREATE POLICY "Service role can insert alerts"
ON alerts FOR INSERT
TO service_role
WITH CHECK (true);
