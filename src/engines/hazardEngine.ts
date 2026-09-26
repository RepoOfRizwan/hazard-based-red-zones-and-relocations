import { DominantHazard, FactorBreakdown, RiskZone, TerrainData } from '../types';

export class HazardRiskEngine {
  // Mountain Landslide Weights (e.g. Wayanad, Western Ghats / Himalayas)
  public static readonly WEIGHTS_LANDSLIDE = {
    rainfall: 0.30,
    slope: 0.25,
    geological: 0.20,
    drainage: 0.15,
    flood: 0.10,
  };

  // Lowland River Basin Flood & Breach Weights (e.g. Bihar Kosi Basin / Gangetic Plains)
  public static readonly WEIGHTS_FLOOD_BASIN = {
    flood: 0.35,
    rainfall: 0.30,
    drainage: 0.20,
    geological: 0.10,
    slope: 0.05,
  };

  // Backward compatibility constants
  public static readonly WEIGHT_RAINFALL = 0.30;
  public static readonly WEIGHT_SLOPE = 0.25;
  public static readonly WEIGHT_GEOLOGICAL = 0.20;
  public static readonly WEIGHT_DRAINAGE = 0.15;
  public static readonly WEIGHT_FLOOD = 0.10;

  /**
   * Computes an explainable, auditable hazard risk score (0 - 100)
   * dynamically adapted for:
   * - Mountain Landslide Sector (Wayanad, Kerala)
   * - River Flood & Embankment Breach Basin (Kosi Basin, Bihar)
   */
  public static computeRisk(
    terrain: TerrainData,
    rainfallMm: number,
    isFloodBasin: boolean = false
  ): {
    risk_score: number;
    risk_zone: RiskZone;
    factor_breakdown: FactorBreakdown;
    dominant_hazard: DominantHazard;
    hazard_alert_type: string;
  } {
    // Ensure valid non-NaN input
    const safeRainfall = typeof rainfallMm === 'number' && !isNaN(rainfallMm) ? Math.max(0, rainfallMm) : 65.0;
    const slopeDeg = typeof terrain.slope_deg === 'number' && !isNaN(terrain.slope_deg) ? terrain.slope_deg : 20.0;
    const drainageM = typeof terrain.distance_to_drainage_m === 'number' && !isNaN(terrain.distance_to_drainage_m) ? terrain.distance_to_drainage_m : 100.0;
    const soilM = typeof terrain.soil_thickness_m === 'number' && !isNaN(terrain.soil_thickness_m) ? terrain.soil_thickness_m : 2.0;
    const lsi = typeof terrain.landslide_susceptibility_idx === 'number' && !isNaN(terrain.landslide_susceptibility_idx) ? terrain.landslide_susceptibility_idx : 0.5;
    const floodFactor = typeof terrain.flood_inundation_factor === 'number' && !isNaN(terrain.flood_inundation_factor) ? terrain.flood_inundation_factor : 0.5;

    const weights = isFloodBasin ? this.WEIGHTS_FLOOD_BASIN : this.WEIGHTS_LANDSLIDE;

    // 1. Slope Score (0 - 100)
    let slope_score = 0;
    if (isFloodBasin) {
      // In flat floodplains, low slope (<5 deg) causes flat water stagnation and slow drainage
      slope_score = Math.max(0.0, Math.min(100.0, 100.0 - (slopeDeg / 10.0) * 100.0));
    } else {
      // In steep mountains, slope above 35° is critical
      slope_score = Math.min(100.0, Math.max(0.0, (slopeDeg / 38.0) * 100.0));
    }

    // 2. Rainfall Score (0 - 100): NDMA/IMD thresholds (>64.5mm Heavy, >115.5mm Very Heavy, >160mm Cloudburst scale)
    const rainfall_score = Math.min(100.0, Math.max(0.0, (safeRainfall / 160.0) * 100.0));

    // 3. Distance to Drainage / River Embankment (0 - 100): Closer to watercourse = higher inundation/breach
    const drainage_score = Math.max(0.0, Math.min(100.0, 100.0 - (drainageM / 250.0) * 100.0));

    // 4. Geological & Soil Susceptibility (0 - 100)
    let geological_score = 0;
    if (isFloodBasin) {
      // Alluvial silt thickness enhances seepage and piping breach beneath embankments
      const alluvialThickness = Math.min(1.0, soilM / 5.0);
      geological_score = Math.min(100.0, Math.max(0.0, (alluvialThickness * 0.70 + lsi * 0.30) * 100.0));
    } else {
      const soil_factor = Math.min(1.0, soilM / 3.5);
      geological_score = Math.min(100.0, Math.max(0.0, (lsi * 0.70 + soil_factor * 0.30) * 100.0));
    }

    // 5. Flood Inundation Factor (0 - 100)
    const flood_score = Math.min(100.0, Math.max(0.0, floodFactor * 100.0));

    // Composite Weighted Score
    const raw_risk =
      weights.rainfall * rainfall_score +
      weights.slope * slope_score +
      weights.geological * geological_score +
      weights.drainage * drainage_score +
      weights.flood * flood_score;

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

    // Determine Dominant Hazard and Warning Type
    const floodThreatScore = (flood_score * 0.55 + drainage_score * 0.25 + rainfall_score * 0.20);
    const landslideThreatScore = (slope_score * 0.40 + geological_score * 0.35 + rainfall_score * 0.25);

    let dominant_hazard: DominantHazard = 'LANDSLIDE';
    let hazard_alert_type = 'LANDSLIDE WARNING';

    if (isFloodBasin) {
      if (floodThreatScore > 60 && landslideThreatScore > 60) {
        dominant_hazard = 'COMPOUND';
        hazard_alert_type = 'COMPOUND RIVER FLOOD & SLIP WARNING';
      } else {
        dominant_hazard = 'FLOOD';
        hazard_alert_type = 'FLASH FLOOD & EMBANKMENT BREACH WARNING';
      }
    } else {
      if (landslideThreatScore >= floodThreatScore) {
        dominant_hazard = 'LANDSLIDE';
        hazard_alert_type = 'DEBRIS FLOW & LANDSLIDE WARNING';
      } else {
        dominant_hazard = 'FLOOD';
        hazard_alert_type = 'VALLEY FLASH FLOOD WARNING';
      }
    }

    const formula = isFloodBasin
      ? `Risk (Flood Basin) = 0.35·S_flood (${flood_score.toFixed(1)}) + 0.30·S_rain (${rainfall_score.toFixed(1)}) + 0.20·S_drain (${drainage_score.toFixed(1)}) + 0.10·S_geo (${geological_score.toFixed(1)}) + 0.05·S_slope (${slope_score.toFixed(1)})`
      : `Risk (Mountain) = 0.30·S_rain (${rainfall_score.toFixed(1)}) + 0.25·S_slope (${slope_score.toFixed(1)}) + 0.20·S_geo (${geological_score.toFixed(1)}) + 0.15·S_drain (${drainage_score.toFixed(1)}) + 0.10·S_flood (${flood_score.toFixed(1)})`;

    return {
      risk_score,
      risk_zone,
      dominant_hazard,
      hazard_alert_type,
      factor_breakdown: {
        rainfall_score: Number(rainfall_score.toFixed(1)),
        slope_score: Number(slope_score.toFixed(1)),
        geological_score: Number(geological_score.toFixed(1)),
        drainage_score: Number(drainage_score.toFixed(1)),
        flood_score: Number(flood_score.toFixed(1)),
        formula,
        dominant_hazard,
        hazard_alert_type,
        flood_threat_score: Number(floodThreatScore.toFixed(1)),
        landslide_threat_score: Number(landslideThreatScore.toFixed(1)),
      },
    };
  }
}
