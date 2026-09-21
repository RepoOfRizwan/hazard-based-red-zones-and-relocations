import React from 'react';
import { ShelterSite } from '../types';
import {
  X,
  Building2,
  Droplets,
  Users,
  ShieldCheck,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Package,
} from 'lucide-react';

interface ShelterAuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shelters: ShelterSite[];
}

export const ShelterAuditDrawer: React.FC<ShelterAuditDrawerProps> = ({
  isOpen,
  onClose,
  shelters,
}) => {
  if (!isOpen) return null;

  const totalArea = shelters.reduce((acc, s) => acc + s.usable_living_area_sqm, 0);
  const totalSafeCapacity = shelters.reduce((acc, s) => acc + (s.max_safe_capacity || 0), 0);
  const totalOccupancy = shelters.reduce((acc, s) => acc + s.current_occupancy, 0);
  const totalHeadroom = Math.max(0, totalSafeCapacity - totalOccupancy);
  const overallOccupancyPct = totalSafeCapacity > 0 ? Math.round((totalOccupancy / totalSafeCapacity) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        id="shelter-audit-modal"
        className="bg-[#111827] border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 bg-[#0e1626] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Candidate Shelter Carrying Capacity Audit
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  Sphere Standards Compliant
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Logistical readiness, space allocation (3.5 m²/person), water security & sanitation audit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-[#0d1322] border-b border-gray-800 text-xs">
          <div className="bg-gray-900/80 p-2.5 rounded-lg border border-gray-800">
            <div className="text-gray-400">Total Usable Covered Space</div>
            <div className="text-lg font-bold text-white mt-0.5">{totalArea.toLocaleString()} m²</div>
            <div className="text-[10px] text-gray-500">Across 5 designated centers</div>
          </div>

          <div className="bg-gray-900/80 p-2.5 rounded-lg border border-gray-800">
            <div className="text-gray-400">Total Sphere Safe Capacity</div>
            <div className="text-lg font-bold text-cyan-300 mt-0.5">{totalSafeCapacity.toLocaleString()} Persons</div>
            <div className="text-[10px] text-gray-500">Strict 3.5 m² per person minimum</div>
          </div>

          <div className="bg-gray-900/80 p-2.5 rounded-lg border border-gray-800">
            <div className="text-gray-400">Current District Occupancy</div>
            <div className="text-lg font-bold text-amber-300 mt-0.5">
              {totalOccupancy.toLocaleString()} ({overallOccupancyPct}%)
            </div>
            <div className="text-[10px] text-gray-500">Currently sheltered evacuees</div>
          </div>

          <div className="bg-gray-900/80 p-2.5 rounded-lg border border-gray-800">
            <div className="text-gray-400">Available Headroom</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{totalHeadroom.toLocaleString()} Beds</div>
            <div className="text-[10px] text-emerald-500 font-semibold">Immediate surge capacity</div>
          </div>
        </div>

        {/* Shelter List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-[#090d16]">
          {shelters.map((shelter) => {
            const occPct = shelter.occupancy_pct || 0;
            const isFull = shelter.status === 'FULL';
            const isCritical = shelter.status === 'CRITICAL';
            const isWarning = shelter.status === 'WARNING';

            const statusBg = isFull
              ? 'bg-red-600'
              : isCritical
              ? 'bg-orange-600'
              : isWarning
              ? 'bg-amber-600'
              : 'bg-emerald-600';

            return (
              <div
                key={shelter.id}
                className="bg-[#111827] border border-gray-700/80 rounded-lg p-3.5 shadow-md flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
              >
                {/* Left info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-gray-100">{shelter.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${statusBg}`}>
                      {shelter.status}
                    </span>
                    <span className="text-amber-400 text-xs">
                      {'★'.repeat(shelter.structural_safety_rating)}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400 mt-1">
                    {shelter.taluk} Taluk • {shelter.usable_living_area_sqm} m² usable area • Coordinates: [{shelter.coordinates[0]}, {shelter.coordinates[1]}]
                  </div>

                  {/* Occupancy bar */}
                  <div className="mt-2 w-full max-w-md">
                    <div className="flex justify-between text-[11px] text-gray-300 mb-1">
                      <span>
                        Occupancy: <strong>{shelter.current_occupancy}</strong> / {shelter.max_safe_capacity}
                      </span>
                      <span className="font-bold text-cyan-400">{occPct}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          occPct >= 90 ? 'bg-red-500' : occPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, occPct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right logistical stats */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs shrink-0 w-full md:w-auto">
                  <div className="bg-gray-900/90 p-2 rounded border border-gray-800 min-w-[95px]">
                    <div className="flex items-center justify-center gap-1 text-cyan-400 text-[11px] font-semibold">
                      <Droplets className="w-3 h-3" />
                      <span>Water</span>
                    </div>
                    <div className="font-bold text-white text-sm mt-0.5">
                      {shelter.water_duration_days} Days
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {shelter.supplies.drinking_water_liters.toLocaleString()} L
                    </div>
                  </div>

                  <div className="bg-gray-900/90 p-2 rounded border border-gray-800 min-w-[95px]">
                    <div className="flex items-center justify-center gap-1 text-amber-400 text-[11px] font-semibold">
                      <Package className="w-3 h-3" />
                      <span>Food</span>
                    </div>
                    <div className="font-bold text-white text-sm mt-0.5">
                      {shelter.food_duration_days} Days
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {shelter.supplies.food_packets.toLocaleString()} pkts
                    </div>
                  </div>

                  <div className="bg-gray-900/90 p-2 rounded border border-gray-800 min-w-[95px]">
                    <div className="flex items-center justify-center gap-1 text-emerald-400 text-[11px] font-semibold">
                      <Users className="w-3 h-3" />
                      <span>Sanitation</span>
                    </div>
                    <div className="font-bold text-white text-sm mt-0.5">
                      1 : {shelter.sanitation_ratio}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {shelter.supplies.toilets} toilets
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0e1626] border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <div>
            Adheres to <strong>Sphere Humanitarian Charter</strong>: 3.5 m² living space, 15L water/person/day, sanitation $\le$ 30 persons/toilet.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold border border-gray-600 transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
