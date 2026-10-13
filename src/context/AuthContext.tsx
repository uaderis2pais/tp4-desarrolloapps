// ==============================================================================
// AGROPULSE - CONTEXTO DE AUTENTICACIÓN Y MEMBRESÍAS (RF-01, RF-02, RF-03)
// ==============================================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Membership, Organization, UserRole } from '../types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  memberships: Membership[];
  activeOrganization: Organization | null;
  currentRole: UserRole | null;
  setActiveOrganizationId: (orgId: string) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  memberships: [],
  activeOrganization: null,
  currentRole: null,
  setActiveOrganizationId: () => {},
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  refreshMemberships: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  // Carga inicial y escucha de cambios de sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMemberships(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMemberships(session.user.id);
      } else {
        setMemberships([]);
        setActiveOrgId(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchMemberships = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('memberships')
        .select(`
          id,
          user_id,
          organization_id,
          role,
          created_at,
          organizations (
            id,
            name,
            region,
            created_at
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.warn('[AuthContext] Error al cargar membresías:', error.message);
        // Si no existen filas todavía para este usuario en la base, creamos una membresía provisional según email
        setFallbackMembershipForDemo(userId);
      } else if (data && data.length > 0) {
        setMemberships(data as unknown as Membership[]);
        // Seleccionar la primera organización por defecto si no hay ninguna activa
        if (!activeOrgId || !data.some((m) => m.organization_id === activeOrgId)) {
          setActiveOrgId(data[0].organization_id);
        }
      } else {
        setFallbackMembershipForDemo(userId);
      }
    } catch (err) {
      console.error('[AuthContext] Excepción buscando membresías:', err);
    } finally {
      setLoading(false);
    }
  };

  const setFallbackMembershipForDemo = (userId: string) => {
    // Si la DB remota no tiene aún el trigger ejecutado para este user, asignamos rol según el correo de login
    const email = user?.email || '';
    let role: UserRole = 'producer';
    if (email.includes('operador')) role = 'operator';
    if (email.includes('asesor')) role = 'advisor';

    const defaultConcordia: Organization = {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Estancia Didáctica Concordia',
      region: 'Concordia, Entre Ríos',
      created_at: new Date().toISOString(),
    };

    const mockMembership: Membership = {
      id: 'mock-mem-1',
      user_id: userId,
      organization_id: defaultConcordia.id,
      role,
      created_at: new Date().toISOString(),
      organizations: defaultConcordia,
    };

    setMemberships([mockMembership]);
    setActiveOrgId(defaultConcordia.id);
  };

  const activeMembership = memberships.find((m) => m.organization_id === activeOrgId);
  const activeOrganization = activeMembership?.organizations || null;
  const currentRole = activeMembership?.role || null;

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { error };
      }
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        await fetchMemberships(data.user.id);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AuthContext] Error cerrando sesión en Supabase:', err);
    } finally {
      setSession(null);
      setUser(null);
      setMemberships([]);
      setActiveOrgId(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        memberships,
        activeOrganization,
        currentRole,
        setActiveOrganizationId: (orgId: string) => setActiveOrgId(orgId),
        signIn,
        signOut,
        refreshMemberships: async () => {
          if (user) await fetchMemberships(user.id);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
