import { Habitation } from '../types';

export class PriorityRankingEngine {
  public static readonly WEIGHT_HAZARD = 0.40;
  public static readonly WEIGHT_DEMOGRAPHIC = 0.25;
  public static readonly WEIGHT_ISOLATION = 0.20;
  public static readonly WEIGHT_FRAGILITY = 0.15;

  /**
   * Computes Evacuation Priority Index (EPI) based on multi-dimensional vulnerability:
   * 1. Hazard Risk Score (40%)
   * 2. Demographic Vulnerability (25%): Elderly (65+), Infants (<5), PwD, Medically Dependent
   * 3. Road & Bridge Isolation Risk (20%): Single-road access cut-off vulnerability
   * 4. Structural Housing Fragility (15%): % of unreinforced / kutcha constructions
   */
  public static computePriorityScore(hab: Pick<Habitation, 'population' | 'infrastructure' | 'risk_score'>): number {
    const pop = hab.population;
    const infra = hab.infrastructure;

    // 1. Demographic Vulnerability Score (0 - 100)
    // Weighted higher for medically dependent and PwD who need vehicle/stretcher support
    const weighted_vuln_count =
      pop.elderly_65 * 1.0 +
      pop.infants_5 * 1.2 +
      pop.pwd * 1.6 +
      pop.medically_dependent * 2.0;

    const vuln_ratio = weighted_vuln_count / Math.max(pop.total, 1);
    const demographic_score = Math.min(100.0, Math.max(0.0, (vuln_ratio / 0.35) * 100.0));

    // 2. Road & Bridge Isolation Risk Score (0 - 100)
    let isolation_score = 25.0;
    if (infra.single_road_access) {
      isolation_score = infra.bridge_washout_risk ? 100.0 : 75.0;
    }

    // 3. Structural Fragility (0 - 100)
    const fragility_score = Math.min(100.0, Math.max(0.0, infra.housing_fragility_pct));

    // 4. Hazard Risk (0 - 100)
    const hazard_score = hab.risk_score;

    const composite_epi =
      this.WEIGHT_HAZARD * hazard_score +
      this.WEIGHT_DEMOGRAPHIC * demographic_score +
      this.WEIGHT_ISOLATION * isolation_score +
      this.WEIGHT_FRAGILITY * fragility_score;

    return Number(Math.min(100.0, Math.max(0.0, composite_epi)).toFixed(1));
  }
}
