export interface PlantationProperties {
  id: string;
  name: string;
  division: string;
  district: string;
  species: string;
  plantation_year: number;
  area_ha: number;
  target_stems_per_ha: number;
  terrain: string;
  base_ndvi: number;
  survival_rate: number;
  mean_dbh_cm: number;
  mean_height_m: number;
  status: string;
  agb_t_ha: number;
  bgb_t_ha: number;
  total_biomass_t_ha: number;
  carbon_t_ha: number;
  co2e_t_ha: number;
  total_co2e_tonnes: number;
  ci_95_margin_pct: number;
  canopy_cover_pct: number;
  field_calibrated: boolean;
}

export interface PlantationFeature {
  type: "Feature";
  properties: PlantationProperties;
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export interface TimeSeriesPoint {
  month: string;
  optical_ndvi: number | null;
  sar_fused_ndvi: number;
  evi: number;
  ndwi: number;
  sar_vh_db: number;
  agb_t_ha: number;
  co2e_t_ha: number;
  cloud_cover_pct: number;
}

export interface AlertItem {
  id: string;
  plantation_id: string;
  plantation_name: string;
  division: string;
  severity: "High" | "Medium";
  reason: string;
  survival_rate: number;
  ndvi: number;
  recommended_action: string;
}

export interface FieldLogItem {
  log_id: string;
  plantation_id: string;
  officer_name: string;
  observed_dbh_cm: number;
  observed_height_m: number;
  observed_survival_pct: number;
  notes: string;
  photo_name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  dfo_approved: boolean;
}

export interface MrvSummary {
  generated_at: string;
  total_polygons: number;
  total_area_ha: number;
  total_co2e_tonnes: number;
  mean_survival_pct: number;
  mean_agb_t_ha: number;
  verified_logs_count: number;
  total_logs_count: number;
  methodology: string;
  plantations: PlantationProperties[];
}

export type MapLayerMode = "ndvi" | "agb" | "chm" | "alerts";

export type UserRole = "State Admin" | "DFO" | "RFO" | "Beat Officer" | "External Auditor";

export interface AdminUser {
  user_id: string;
  name: string;
  role: UserRole;
  scope: string;
  active: boolean;
}

export interface SpeciesEntry {
  key: string;
  label: string;
  wood_density: number;
  root_to_shoot: number;
}

export interface AdminSettings {
  min_survival_pct: number;
  ndvi_alert_threshold: number;
  sensitive_zone_masking: boolean;
  last_eo_refresh: string;
  model_version: string;
}

export interface AuditLogEntry {
  audit_id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  target: string;
}
