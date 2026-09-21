import { ShelterSite, ShelterStatus } from '../types';

export class CarryingCapacityEngine {
  public static readonly SPHERE_SPACE_PER_PERSON_SQM = 3.5;
  public static readonly MIN_WATER_PER_PERSON_DAY_LITERS = 15.0;
  public static readonly MEALS_PER_PERSON_DAY = 3;

  /**
   * Evaluates carrying capacity and logistical readiness of candidate relocation shelters
   * adhering strictly to Sphere Humanitarian Standards.
   */
  public static evaluateShelter(shelter: ShelterSite): ShelterSite {
    // 1. Compute theoretical maximum safe capacity based on usable living area
    // Structural safety rating (1-5) acts as a safety multiplier:
    // 5 stars = 100% usable, 4 stars = 94%, 3 stars = 88%
    const safetyMultiplier = 0.70 + shelter.structural_safety_rating * 0.06;
    const effectiveArea = shelter.usable_living_area_sqm * Math.min(1.0, safetyMultiplier);
    const max_safe_capacity = Math.floor(effectiveArea / this.SPHERE_SPACE_PER_PERSON_SQM);

    // 2. Available capacity
    const occupied = shelter.current_occupancy;
    const available_capacity = Math.max(0, max_safe_capacity - occupied);

    // 3. Occupancy percentage
    const occ_pct = max_safe_capacity > 0 ? Number(((occupied / max_safe_capacity) * 100.0).toFixed(1)) : 100.0;

    // 4. Status determination
    let status: ShelterStatus = 'AVAILABLE';
    if (occ_pct >= 100.0) {
      status = 'FULL';
    } else if (occ_pct >= 90.0) {
      status = 'CRITICAL';
    } else if (occ_pct >= 70.0) {
      status = 'WARNING';
    } else {
      status = 'AVAILABLE';
    }

    // 5. Resource / Bottleneck Analysis
    const effectivePeople = Math.max(occupied, 1);
    const dailyWaterNeed = effectivePeople * this.MIN_WATER_PER_PERSON_DAY_LITERS;
    const water_duration_days = Number((shelter.supplies.drinking_water_liters / dailyWaterNeed).toFixed(1));

    const dailyFoodNeed = effectivePeople * this.MEALS_PER_PERSON_DAY;
    const food_duration_days = Number((shelter.supplies.food_packets / dailyFoodNeed).toFixed(1));

    const sanitation_ratio = Math.round(effectivePeople / Math.max(shelter.supplies.toilets, 1));

    return {
      ...shelter,
      max_safe_capacity,
      available_capacity,
      occupancy_pct: occ_pct,
      status,
      water_duration_days,
      food_duration_days,
      sanitation_ratio,
    };
  }
}
