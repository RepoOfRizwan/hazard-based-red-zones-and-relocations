import { Habitation, ShelterSite } from '../types';

export class RelocationEngine {
  /**
   * Calculates geodesic (Haversine) distance between two [lat, lng] coordinates in kilometers.
   */
  public static haversineDistanceKm(coord1: [number, number], coord2: [number, number]): number {
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;
    const R = 6371.0; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
    const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
    const a =
      Math.sin(dLat / 2.0) ** 2 +
      Math.cos((lat1 * Math.PI) / 180.0) *
        Math.cos((lat2 * Math.PI) / 180.0) *
        Math.sin(dLon / 2.0) ** 2;
    const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
    return Number((R * c).toFixed(2));
  }

  /**
   * Assigns each habitation to the optimal nearby shelter with remaining headroom.
   * Prioritizes highest-vulnerability / highest-hazard habitations first.
   */
  public static assignShelters(
    habitations: Habitation[],
    shelters: ShelterSite[]
  ): { habitations: Habitation[]; updatedShelters: ShelterSite[] } {
    // Clone shelters to track remaining allocation headroom
    const shelterMap: { [id: string]: ShelterSite & { tempAllocated: number } } = {};
    shelters.forEach((s) => {
      const maxSafe = s.max_safe_capacity || Math.floor((s.usable_living_area_sqm * 0.95) / 3.5);
      const available = Math.max(0, maxSafe - s.current_occupancy);
      shelterMap[s.id] = {
        ...s,
        available_capacity: available,
        tempAllocated: 0,
      };
    });

    // Sort habitations by priority score descending
    const sortedHabs = [...habitations].sort((a, b) => b.priority_score - a.priority_score);

    const updatedHabs = sortedHabs.map((hab, index) => {
      let bestShelter: (typeof shelterMap)[string] | null = null;
      let minDistance = Infinity;

      // Find nearest shelter that has headroom or least over-capacity
      for (const sId in shelterMap) {
        const shelter = shelterMap[sId];
        const dist = this.haversineDistanceKm(hab.coordinates, shelter.coordinates);
        const remainingSpace = (shelter.available_capacity || 0) - shelter.tempAllocated;

        // Prefer shelters with remaining space, otherwise choose closest
        if (remainingSpace >= hab.population.total && dist < minDistance) {
          minDistance = dist;
          bestShelter = shelter;
        }
      }

      // Fallback: If no single shelter has full room, pick closest shelter
      if (!bestShelter) {
        for (const sId in shelterMap) {
          const shelter = shelterMap[sId];
          const dist = this.haversineDistanceKm(hab.coordinates, shelter.coordinates);
          if (dist < minDistance) {
            minDistance = dist;
            bestShelter = shelter;
          }
        }
      }

      if (bestShelter) {
        bestShelter.tempAllocated += hab.population.total;
        // Mountain road transit time (average speed 25-35 km/h depending on bridge risk)
        const avgSpeedKmh = hab.infrastructure.bridge_washout_risk ? 20.0 : 32.0;
        const transitMins = Math.max(8, Math.round((minDistance / avgSpeedKmh) * 60));

        return {
          ...hab,
          priority_rank: index + 1,
          assigned_shelter_id: bestShelter.id,
          assigned_shelter_name: bestShelter.name,
          distance_to_shelter_km: minDistance,
          estimated_transit_mins: transitMins,
        };
      }

      return {
        ...hab,
        priority_rank: index + 1,
      };
    });

    // Return habitations mapped back to original order, and updated shelters
    const finalShelters = shelters.map((s) => {
      const match = shelterMap[s.id];
      return match ? { ...match } : s;
    });

    return {
      habitations: updatedHabs,
      updatedShelters: finalShelters,
    };
  }
}
