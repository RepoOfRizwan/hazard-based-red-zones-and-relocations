import React, { useState } from 'react';
import {
  Habitation,
  ShelterSite,
} from '../types';
import {
  Activity,
  Shield,
  AlertTriangle,
  Users,
  Compass,
  Building,
  Droplets,
  Radio,
  FileText,
  Truck,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';

interface ExplainableRiskInspectorProps {
  habitation: Habitation | null;
  shelters: ShelterSite[];
  onEvacuate: (habId: string) => void;
  onTriggerAlert: (hab: Habitation) => void;
}

export const ExplainableRiskInspector: React.FC<ExplainableRiskInspectorProps> = ({
  habitation,
  shelters,
  onEvacuate,
  onTriggerAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'HAZARD' | 'SHELTER'>('HAZARD');

  if (!habitation) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-500 bg-[#111827] border-l border-gray-800">
        <Compass className="w-8 h-8 text-gray-600 mb-2 animate-pulse" />
        <p className="font-bold text-gray-300 text-sm">No Habitation Selected</p>
        <p className="text-xs text-gray-500 mt-1 max-w-xs">
          Select any habitation from the priority queue or interactive map to inspect its explainable hazard score, demographics, and shelter logistics.
        </p>
      </div>
    );
  }

  const assignedShelter = shelters.find((s) => s.id === habitation.assigned_shelter_id);
  const isRed = habitation.risk_zone === 'RED';
  const isAmber = habitation.risk_zone === 'AMBER';
  const isEvacuated = habitation.evacuation_status === 'EVACUATED';

  const factor = habitation.factor_breakdown;
  const pop = habitation.population;
  const infra = habitation.infrastructure;

  return (
    <div className="flex flex-col h-full bg-[#111827] border-l border-gray-800 text-xs overflow-hidden">
      {/* Header Info */}
      <div className="p-3 border-b border-gray-800 bg-[#0e1626]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-white">{habitation.name}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isRed
                    ? 'bg-red-600 text-white pulse-red-badge'
                    : isAmber
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {habitation.risk_zone} ZONE ({habitation.risk_score}/100)
              </span>
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              {habitation.taluk} Taluk, Wayanad • Elevation: {habitation.elevation_m}m • Slope: {habitation.terrain.slope_deg}°
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-gray-400">Evacuation Priority</div>
            <div className="text-sm font-black text-cyan-400 font-mono">
              Rank #{habitation.priority_rank} (EPI: {habitation.priority_score})
            </div>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-gray-700 mt-3">
          <button
            onClick={() => setActiveTab('HAZARD')}
            className={`flex-1 py-1.5 text-center font-bold text-[11px] border-b-2 transition-all ${
              activeTab === 'HAZARD'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Explainable Risk Factors
          </button>
          <button
            onClick={() => setActiveTab('SHELTER')}
            className={`flex-1 py-1.5 text-center font-bold text-[11px] border-b-2 transition-all ${
              activeTab === 'SHELTER'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Shelter Logistics & Sphere Audit
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {activeTab === 'HAZARD' ? (
          <>
            {/* 1. Factor Breakdown */}
            <div className="bg-[#1f2937]/70 p-3 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-200 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Multivariate Hazard Weights
                </span>
                <span className="text-[10px] text-gray-400">Non-Black Box Formula</span>
              </div>

              <div className="space-y-2">
                {/* Rainfall */}
                <div>
                  <div className="flex justify-between text-[11px] text-gray-300 mb-0.5">
                    <span>
                      Rainfall Saturation <span className="text-gray-400">(30% wt)</span>
                    </span>
                    <strong className="text-cyan-300">{factor.rainfall_score} / 100</strong>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-1.5 rounded-full"
                      style={{ width: `${factor.rainfall_score}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Live rainfall: {habitation.rainfall_mm} mm (Threshold scale 160mm)
                  </div>
                </div>

                {/* Slope */}
                <div>
                  <div className="flex justify-between text-[11px] text-gray-300 mb-0.5">
                    <span>
                      Slope Gradient <span className="text-gray-400">(25% wt)</span>
                    </span>
                    <strong className="text-amber-300">{factor.slope_score} / 100</strong>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full"
                      style={{ width: `${factor.slope_score}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Terrain angle: {habitation.terrain.slope_deg}° (Critical slope &gt; 35°)
                  </div>
                </div>

                {/* Geological */}
                <div>
                  <div className="flex justify-between text-[11px] text-gray-300 mb-0.5">
                    <span>
                      Geological & Soil Susceptibility <span className="text-gray-400">(20% wt)</span>
                    </span>
                    <strong className="text-rose-300">{factor.geological_score} / 100</strong>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-rose-500 h-1.5 rounded-full"
                      style={{ width: `${factor.geological_score}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    ISRO LSI: {habitation.terrain.landslide_susceptibility_idx} • Regolith: {habitation.terrain.soil_thickness_m}m
                  </div>
                </div>

                {/* Drainage Stream Proximity */}
                <div>
                  <div className="flex justify-between text-[11px] text-gray-300 mb-0.5">
                    <span>
                      Drainage Torrent Proximity <span className="text-gray-400">(15% wt)</span>
                    </span>
                    <strong className="text-indigo-300">{factor.drainage_score} / 100</strong>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${factor.drainage_score}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Distance to mountain stream: {habitation.terrain.distance_to_drainage_m}m
                  </div>
                </div>

                {/* Flood Inundation */}
                <div>
                  <div className="flex justify-between text-[11px] text-gray-300 mb-0.5">
                    <span>
                      Flood Inundation Factor <span className="text-gray-400">(10% wt)</span>
                    </span>
                    <strong className="text-blue-300">{factor.flood_score} / 100</strong>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${factor.flood_score}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Inundation factor: {habitation.terrain.flood_inundation_factor}
                  </div>
                </div>
              </div>

              {/* Mathematical Formula Audit String */}
              <div className="mt-3 p-2 bg-[#111827] rounded border border-gray-800 text-[10px] font-mono text-cyan-300 break-words">
                <span className="text-gray-400 font-bold block mb-0.5">FORMULA AUDIT LOG:</span>
                {factor.formula}
              </div>
            </div>

            {/* 2. Demographic Vulnerabilities */}
            <div className="bg-[#1f2937]/70 p-3 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  Demographic Vulnerability Audit
                </span>
                <span className="text-[10px] text-gray-400">
                  Total: {pop.total} ({pop.households} Households)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-900/90 p-2 rounded border border-gray-800">
                  <div className="text-gray-400 text-[10px]">Elderly (Age 65+)</div>
                  <div className="text-base font-bold text-amber-300">{pop.elderly_65}</div>
                  <div className="text-[9px] text-gray-500">Need walking assistance</div>
                </div>
                <div className="bg-gray-900/90 p-2 rounded border border-gray-800">
                  <div className="text-gray-400 text-[10px]">Infants & Under 5</div>
                  <div className="text-base font-bold text-amber-300">{pop.infants_5}</div>
                  <div className="text-[9px] text-gray-500">Require nutritional/maternal kits</div>
                </div>
                <div className="bg-gray-900/90 p-2 rounded border border-gray-800">
                  <div className="text-gray-400 text-[10px]">Persons with Disabilities</div>
                  <div className="text-base font-bold text-rose-400">{pop.pwd}</div>
                  <div className="text-[9px] text-gray-500">Wheelchair / stretcher support</div>
                </div>
                <div className="bg-gray-900/90 p-2 rounded border border-gray-800">
                  <div className="text-gray-400 text-[10px]">Medically Dependent</div>
                  <div className="text-base font-bold text-rose-400">{pop.medically_dependent}</div>
                  <div className="text-[9px] text-gray-500">Dialysis / oxygen / cardiac care</div>
                </div>
              </div>
            </div>

            {/* 3. Evacuation Route & Bridge Hazard */}
            <div className="bg-[#1f2937]/70 p-3 rounded-lg border border-gray-700">
              <div className="font-bold text-gray-200 flex items-center gap-1.5 mb-1.5">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                Transit Route & Isolation Bottleneck
              </div>
              <div className="text-gray-300 text-[11px]">
                Primary Route: <strong className="text-white">{infra.access_route_name}</strong>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {infra.single_road_access && (
                  <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 text-[10px] font-semibold">
                    Single Road Access (High Cut-off Risk)
                  </span>
                )}
                {infra.bridge_washout_risk && (
                  <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800 text-[10px] font-semibold flex items-center gap-1">
                    <AlertOctagon className="w-3 h-3 text-red-400" />
                    Bridge Washout Threat (Bailey Bridge)
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700 text-[10px]">
                  Fragility: {infra.housing_fragility_pct}%
                </span>
              </div>
            </div>
          </>
        ) : (
          /* SHELTER AUDIT TAB */
          <>
            {assignedShelter ? (
              <div className="bg-[#1f2937]/70 p-3 rounded-lg border border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-cyan-400" />
                    {assignedShelter.name}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      assignedShelter.status === 'FULL'
                        ? 'bg-red-600 text-white'
                        : assignedShelter.status === 'CRITICAL'
                        ? 'bg-orange-600 text-white'
                        : assignedShelter.status === 'WARNING'
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {assignedShelter.status}
                  </span>
                </div>

                <div className="text-[11px] text-gray-400">
                  {assignedShelter.taluk} Taluk • Geodesic Distance: {habitation.distance_to_shelter_km} km (Est. Transit: {habitation.estimated_transit_mins} mins)
                </div>

                {/* Sphere Standards Compliance Box */}
                <div className="bg-[#111827] p-2.5 rounded border border-gray-800 space-y-2">
                  <div className="text-[11px] font-bold text-gray-300 border-b border-gray-800 pb-1 flex items-center justify-between">
                    <span>Sphere Humanitarian Audit (3.5 m²/person)</span>
                    <span className="text-cyan-400 font-mono">
                      Rating: {'★'.repeat(assignedShelter.structural_safety_rating)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-gray-400">Usable Covered Area:</span>
                      <div className="font-bold text-gray-200">{assignedShelter.usable_living_area_sqm} m²</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Max Safe Capacity:</span>
                      <div className="font-bold text-cyan-300">{assignedShelter.max_safe_capacity} persons</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Current Occupancy:</span>
                      <div className="font-bold text-gray-200">
                        {assignedShelter.current_occupancy} ({assignedShelter.occupancy_pct}%)
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Available Headroom:</span>
                      <div className="font-bold text-emerald-400">
                        {assignedShelter.available_capacity} beds
                      </div>
                    </div>
                  </div>

                  {/* Capacity Meter */}
                  <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden mt-1">
                    <div
                      className={`h-2 rounded-full ${
                        (assignedShelter.occupancy_pct || 0) >= 90
                          ? 'bg-red-500'
                          : (assignedShelter.occupancy_pct || 0) >= 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, assignedShelter.occupancy_pct || 0)}%` }}
                    />
                  </div>
                </div>

                {/* Supply Logistics Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="bg-gray-900 p-2 rounded border border-gray-800">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-1" />
                    <div className="text-gray-400">Drinking Water</div>
                    <div className="font-bold text-white text-xs mt-0.5">
                      {assignedShelter.water_duration_days} Days
                    </div>
                    <div className="text-gray-500 text-[9px]">
                      {assignedShelter.supplies.drinking_water_liters} L (15L/day)
                    </div>
                  </div>

                  <div className="bg-gray-900 p-2 rounded border border-gray-800">
                    <Building className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                    <div className="text-gray-400">Food Ration</div>
                    <div className="font-bold text-white text-xs mt-0.5">
                      {assignedShelter.food_duration_days} Days
                    </div>
                    <div className="text-gray-500 text-[9px]">
                      {assignedShelter.supplies.food_packets} pkts
                    </div>
                  </div>

                  <div className="bg-gray-900 p-2 rounded border border-gray-800">
                    <Users className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                    <div className="text-gray-400">Sanitation</div>
                    <div className="font-bold text-white text-xs mt-0.5">
                      1 : {assignedShelter.sanitation_ratio}
                    </div>
                    <div className="text-gray-500 text-[9px]">
                      {assignedShelter.supplies.toilets} toilets
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 flex items-center justify-between bg-gray-900/60 p-2 rounded">
                  <span>
                    Generator Power Backup: <strong className="text-emerald-400">Operational</strong>
                  </span>
                  <span>
                    Medical First Aid Kits: <strong className="text-white">{assignedShelter.supplies.medical_kits}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-6">
                No shelter currently mapped to this habitation.
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-3 border-t border-gray-800 bg-[#0e1626] flex items-center gap-2">
        <button
          id="btn-trigger-alert-modal"
          onClick={() => onTriggerAlert(habitation)}
          className="flex-1 py-2 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-gray-600"
        >
          <Radio className="w-4 h-4 text-cyan-400" />
          <span>CAP / SMS Alert Preview</span>
        </button>

        {isEvacuated ? (
          <div className="flex-1 py-2 px-3 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-bold text-xs text-center flex items-center justify-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Evacuated to Shelter
          </div>
        ) : (
          <button
            id="btn-order-evacuation-primary"
            onClick={() => onEvacuate(habitation.id)}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all ${
              isRed
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/50'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/50'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Order Tactical Evacuation</span>
          </button>
        )}
      </div>
    </div>
  );
};
