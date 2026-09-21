export type RiskZone = 'RED' | 'AMBER' | 'GREEN';
export type ShelterStatus = 'AVAILABLE' | 'WARNING' | 'CRITICAL' | 'FULL';
export type EvacuationStatus = 'PENDING' | 'ORDERED' | 'IN_TRANSIT' | 'EVACUATED';

export interface PopulationData {
  total: number;
  elderly_65: number;
  infants_5: number;
  pwd: number; // Persons with Disabilities
  medically_dependent: number;
  households: number;
}

export interface InfrastructureData {
  housing_fragility_pct: number;
  single_road_access: boolean;
  access_route_name: string;
  bridge_washout_risk: boolean;
}

export interface TerrainData {
  slope_deg: number;
  soil_thickness_m: number;
  distance_to_drainage_m: number;
  landslide_susceptibility_idx: number;
  flood_inundation_factor: number;
}

export interface FactorBreakdown {
  rainfall_score: number;
  slope_score: number;
  geological_score: number;
  drainage_score: number;
  flood_score: number;
  formula: string;
}

export interface ShelterSupplies {
  drinking_water_liters: number;
  food_packets: number;
  medical_kits: number;
  toilets: number;
  power_backup: boolean;
}

export interface ShelterSite {
  id: string;
  name: string;
  taluk: string;
  coordinates: [number, number]; // [lat, lng]
  usable_living_area_sqm: number;
  structural_safety_rating: number; // 1 - 5
  current_occupancy: number;
  supplies: ShelterSupplies;
  // Computed fields
  max_safe_capacity?: number;
  available_capacity?: number;
  occupancy_pct?: number;
  status?: ShelterStatus;
  water_duration_days?: number;
  food_duration_days?: number;
  sanitation_ratio?: number; // persons per toilet
}

export interface Habitation {
  id: string;
  name: string;
  taluk: string;
  district: string;
  coordinates: [number, number]; // [lat, lng]
  elevation_m: number;
  population: PopulationData;
  infrastructure: InfrastructureData;
  terrain: TerrainData;
  rainfall_mm: number;
  // Computed risk & priority fields
  risk_score: number;
  risk_zone: RiskZone;
  factor_breakdown: FactorBreakdown;
  priority_rank: number;
  priority_score: number; // Evacuation Priority Index (EPI)
  evacuation_status: EvacuationStatus;
  assigned_shelter_id?: string;
  assigned_shelter_name?: string;
  distance_to_shelter_km?: number;
  estimated_transit_mins?: number;
}

export interface AlertNotification {
  id: string;
  habitation_id: string;
  habitation_name: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY';
  headline: string;
  description: string;
  recommended_action: string;
  sms_preview: string;
  whatsapp_preview: string;
  cap_xml_preview: string;
}

export interface SummaryStats {
  total_habitations: number;
  red_zone_count: number;
  amber_zone_count: number;
  green_zone_count: number;
  at_risk_population: number;
  evacuated_population: number;
  pending_evacuations: number;
  total_shelters: number;
  total_safe_capacity: number;
  current_shelter_occupancy: number;
  available_shelter_headroom: number;
  active_rainfall_mm: number;
  weather_condition: string;
}
