-- ==============================================================================
-- AGROPULSE - VINCULACIÓN AUTOMÁTICA DE USUARIOS DE PRUEBA A MEMBRESÍAS
-- Este trigger asegura que cuando un usuario de prueba se registre o inicie sesión,
-- se le asigne automáticamente su organización y rol correspondiente.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_agropulse_user()
RETURNS TRIGGER AS $$
DECLARE
    v_org_concordia UUID := 'a0000000-0000-0000-0000-000000000001';
    v_org_palmar UUID := 'a0000000-0000-0000-0000-000000000002';
BEGIN
    IF NEW.email = 'productor@agropulse.test' THEN
        -- El productor tiene acceso a Concordia y El Palmar (para demostrar RF-03 selector)
        INSERT INTO public.memberships (user_id, organization_id, role)
        VALUES (NEW.id, v_org_concordia, 'producer')
        ON CONFLICT (user_id, organization_id) DO UPDATE SET role = 'producer';

        INSERT INTO public.memberships (user_id, organization_id, role)
        VALUES (NEW.id, v_org_palmar, 'producer')
        ON CONFLICT (user_id, organization_id) DO UPDATE SET role = 'producer';

    ELSIF NEW.email = 'operador@agropulse.test' THEN
        -- El operador gestiona válvulas en Concordia
        INSERT INTO public.memberships (user_id, organization_id, role)
        VALUES (NEW.id, v_org_concordia, 'operator')
        ON CONFLICT (user_id, organization_id) DO UPDATE SET role = 'operator';

    ELSIF NEW.email = 'asesor@agropulse.test' THEN
        -- El asesor agrónomo sólo tiene rol de lectura (H2)
        INSERT INTO public.memberships (user_id, organization_id, role)
        VALUES (NEW.id, v_org_concordia, 'advisor')
        ON CONFLICT (user_id, organization_id) DO UPDATE SET role = 'advisor';

    ELSE
        -- Cualquier otro email registrado por defecto ingresa como productor a Concordia
        INSERT INTO public.memberships (user_id, organization_id, role)
        VALUES (NEW.id, v_org_concordia, 'producer')
        ON CONFLICT (user_id, organization_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sobre auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_agropulse ON auth.users;
CREATE TRIGGER on_auth_user_created_agropulse
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_agropulse_user();
