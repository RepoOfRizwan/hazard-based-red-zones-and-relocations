import { FactorBreakdown, Habitation, RiskZone, TerrainData } from '../types';

export class HazardRiskEngine {
  public static readonly WEIGHT_RAINFALL = 0.30;
  public static readonly WEIGHT_SLOPE = 0.25;
  public static readonly WEIGHT_GEOLOGICAL = 0.20;
  public static readonly WEIGHT_DRAINAGE = 0.15;
  public static readonly WEIGHT_FLOOD = 0.10;

  /**
   * Computes an explainable, auditable hazard risk score (0 - 100)
   * based on terrain, soil thickness, stream drainage proximity,
   * landslide susceptibility index, and live/simulated rainfall.
   */
  public static computeRisk(
    terrain: TerrainData,
    rainfallMm: number
  ): { risk_score: number; risk_zone: RiskZone; factor_breakdown: FactorBreakdown } {
    // Ensure valid non-NaN input
    const safeRainfall = typeof rainfallMm === 'number' && !isNaN(rainfallMm) ? Math.max(0, rainfallMm) : 65.0;
    const slopeDeg = typeof terrain.slope_deg === 'number' && !isNaN(terrain.slope_deg) ? terrain.slope_deg : 20.0;
    const drainageM = typeof terrain.distance_to_drainage_m === 'number' && !isNaN(terrain.distance_to_drainage_m) ? terrain.distance_to_drainage_m : 100.0;
    const soilM = typeof terrain.soil_thickness_m === 'number' && !isNaN(terrain.soil_thickness_m) ? terrain.soil_thickness_m : 2.0;
    const lsi = typeof terrain.landslide_susceptibility_idx === 'number' && !isNaN(terrain.landslide_susceptibility_idx) ? terrain.landslide_susceptibility_idx : 0.5;
    const floodFactor = typeof terrain.flood_inundation_factor === 'number' && !isNaN(terrain.flood_inundation_factor) ? terrain.flood_inundation_factor : 0.5;

    // 1. Slope Score (0 - 100): Critical above 35° in Western Ghats / Himalayas
    const slope_score = Math.min(100.0, Math.max(0.0, (slopeDeg / 38.0) * 100.0));

    // 2. Rainfall Score (0 - 100): NDMA/IMD thresholds (>64.5mm Heavy, >115.5mm Very Heavy, >160mm Cloudburst scale)
    const rainfall_score = Math.min(100.0, Math.max(0.0, (safeRainfall / 160.0) * 100.0));

    // 3. Distance to Drainage / Mountain Torrent Stream (0 - 100): Under 50m faces immediate debris torrent
    const drainage_score = Math.max(0.0, Math.min(100.0, 100.0 - (drainageM / 250.0) * 100.0));

    // 4. Geological & Soil Susceptibility (0 - 100): ISRO Bhuvan LSI + regolith thickness
    const soil_factor = Math.min(1.0, soilM / 3.5);
    const geological_score = Math.min(
      100.0,
      Math.max(0.0, (lsi * 0.70 + soil_factor * 0.30) * 100.0)
    );

    // 5. Flood Inundation Score (0 - 100)
    const flood_score = Math.min(100.0, Math.max(0.0, floodFactor * 100.0));

    // Composite Weighted Score
    const raw_risk =
      this.WEIGHT_RAINFALL * rainfall_score +
      this.WEIGHT_SLOPE * slope_score +
      this.WEIGHT_GEOLOGICAL * geological_score +
      this.WEIGHT_DRAINAGE * drainage_score +
      this.WEIGHT_FLOOD * flood_score;

    const risk_score = Number(Math.min(100.0, Math.max(0.0, raw_risk)).toFixed(1));

    // Classification per NDMA guidelines
    let risk_zone: RiskZone = 'GREEN';
    if (risk_score >= 70.0) {
      risk_zone = 'RED';
    } else if (risk_score >= 40.0) {
      risk_zone = 'AMBER';
    } else {
      risk_zone = 'GREEN';
    }

    const formula = `Risk = 0.30·S_rain (${rainfall_score.toFixed(1)}) + 0.25·S_slope (${slope_score.toFixed(1)}) + 0.20·S_geo (${geological_score.toFixed(1)}) + 0.15·S_drain (${drainage_score.toFixed(1)}) + 0.10·S_flood (${flood_score.toFixed(1)})`;

    return {
      risk_score,
      risk_zone,
      factor_breakdown: {
        rainfall_score: Number(rainfall_score.toFixed(1)),
        slope_score: Number(slope_score.toFixed(1)),
        geological_score: Number(geological_score.toFixed(1)),
        drainage_score: Number(drainage_score.toFixed(1)),
        flood_score: Number(flood_score.toFixed(1)),
        formula,
      },
    };
  }
}
