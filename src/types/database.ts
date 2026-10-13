// ==============================================================================
// AGROPULSE - DEFINICIONES DE TIPOS TYPESCRIPT (TP 4)
// ==============================================================================

export type UserRole = 'producer' | 'operator' | 'advisor';

export type PlotStatus = 'stale' | 'dry' | 'optimal' | 'wet';

export type ValveStatus = 'open' | 'closed';

export type CommandAction = 'open' | 'close' | 'irrigate_duration';

export type CommandStatus = 'pending' | 'applied' | 'failed' | 'cancelled';

export type ReadingSource = 'sensor' | 'manual';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Organization {
  id: string;
  name: string;
  region: string;
  created_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  organization_id: string;
  role: UserRole;
  created_at: string;
  organizations?: Organization;
}

export interface Plot {
  id: string;
  organization_id: string;
  name: string;
  crop: string;
  geom: GeoPoint[];
  threshold_min: number;
  threshold_max: number;
  created_at: string;
  // Campos calculados en el cliente / vista
  latestReading?: Reading | null;
  status?: PlotStatus;
}

export interface Station {
  id: string;
  plot_id: string;
  name: string;
  lat: number;
  lng: number;
  created_at: string;
}

export interface Reading {
  id: string;
  station_id: string;
  measured_at: string;
  moisture_pct: number;
  temp_c: number;
  rain_mm: number;
  source: ReadingSource;
  notes?: string | null;
  created_at?: string;
}

export interface Valve {
  id: string;
  plot_id: string;
  name: string;
  status: ValveStatus;
  updated_at: string;
}

export interface IrrigationCommand {
  id: string;
  valve_id: string;
  requested_by: string;
  action: CommandAction;
  duration_min?: number | null;
  status: CommandStatus;
  client_request_id: string;
  error_reason?: string | null;
  created_at: string;
  applied_at?: string | null;
}

export interface Alert {
  id: string;
  plot_id: string;
  type: 'dry' | 'stale' | 'failed_command';
  payload: {
    message?: string;
    moisture_pct?: number;
    threshold_min?: number;
    station_name?: string;
    [key: string]: any;
  };
  created_at: string;
  read_at?: string | null;
}

export interface ManualReadingDraft {
  client_request_id: string;
  station_id: string;
  plot_id: string;
  moisture_pct: number;
  temp_c: number;
  notes?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface OfflineCommandDraft {
  client_request_id: string;
  valve_id: string;
  action: CommandAction;
  duration_min?: number;
  requested_by: string;
  created_at: string;
}
