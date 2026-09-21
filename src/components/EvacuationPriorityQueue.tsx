import React, { useState } from 'react';
import {
  AlertTriangle,
  Users,
  Shield,
  Truck,
  CheckCircle,
  Clock,
  ArrowRight,
  Filter,
  Navigation,
  AlertOctagon,
} from 'lucide-react';
import { Habitation, RiskZone } from '../types';

interface EvacuationPriorityQueueProps {
  habitations: Habitation[];
  selectedHabitationId: string | null;
  onSelectHabitation: (hab: Habitation) => void;
  onEvacuateHabitation: (habId: string) => void;
  activeFilter: 'ALL' | 'RED' | 'AMBER' | 'EVACUATED';
  onFilterChange: (filter: 'ALL' | 'RED' | 'AMBER' | 'EVACUATED') => void;
  onTriggerAlert: (hab: Habitation) => void;
}

export const EvacuationPriorityQueue: React.FC<EvacuationPriorityQueueProps> = ({
  habitations,
  selectedHabitationId,
  onSelectHabitation,
  onEvacuateHabitation,
  activeFilter,
  onFilterChange,
  onTriggerAlert,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter habitations based on active tab and search
  const filtered = habitations
    .filter((h) => {
      if (activeFilter === 'RED') return h.risk_zone === 'RED' && h.evacuation_status !== 'EVACUATED';
      if (activeFilter === 'AMBER') return h.risk_zone === 'AMBER' && h.evacuation_status !== 'EVACUATED';
      if (activeFilter === 'EVACUATED') return h.evacuation_status === 'EVACUATED';
      return true; // ALL
    })
    .filter(
      (h) =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.taluk.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.priority_score - a.priority_score);

  return (
    <div className="flex flex-col h-full bg-[#111827] border-r border-gray-800 text-xs overflow-hidden">
      {/* Panel Header */}
      <div className="p-3 border-b border-gray-800 bg-[#0e1626]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-gray-200">
            <Truck className="w-4 h-4 text-amber-400" />
            <span>Evacuation Priority Queue</span>
          </div>
          <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded font-mono">
            {filtered.length} Habitations
          </span>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">
          Ranked by multi-dimensional Evacuation Priority Index (EPI)
        </p>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 mt-2.5">
          <button
            id="filter-all"
            onClick={() => onFilterChange('ALL')}
            className={`px-2 py-1 text-[10px] font-semibold rounded transition-colors ${
              activeFilter === 'ALL'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-800/80 text-gray-400 hover:text-gray-200'
            }`}
          >
            All ({habitations.length})
          </button>
          <button
            id="filter-red"
            onClick={() => onFilterChange('RED')}
            className={`px-2 py-1 text-[10px] font-semibold rounded transition-colors ${
              activeFilter === 'RED'
                ? 'bg-red-700 text-white shadow'
                : 'bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-900/50'
            }`}
          >
            Red Zones ({habitations.filter((h) => h.risk_zone === 'RED').length})
          </button>
          <button
            id="filter-amber"
            onClick={() => onFilterChange('AMBER')}
            className={`px-2 py-1 text-[10px] font-semibold rounded transition-colors ${
              activeFilter === 'AMBER'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-950/40 text-amber-400 hover:bg-amber-900/60 border border-amber-900/50'
            }`}
          >
            Amber ({habitations.filter((h) => h.risk_zone === 'AMBER').length})
          </button>
          <button
            id="filter-evacuated"
            onClick={() => onFilterChange('EVACUATED')}
            className={`px-2 py-1 text-[10px] font-semibold rounded transition-colors ${
              activeFilter === 'EVACUATED'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-900/50'
            }`}
          >
            Evacuated ({habitations.filter((h) => h.evacuation_status === 'EVACUATED').length})
          </button>
        </div>

        {/* Quick Search */}
        <input
          id="search-habitations"
          type="text"
          placeholder="Search habitation (e.g. Mundakkai)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full mt-2 px-2.5 py-1 bg-gray-900 border border-gray-700 rounded text-gray-200 placeholder-gray-500 text-[11px] focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Habitations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 divide-y divide-gray-800/60">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-xs">
            No habitations match the selected filter.
          </div>
        ) : (
          filtered.map((hab, index) => {
            const isSelected = hab.id === selectedHabitationId;
            const isRed = hab.risk_zone === 'RED';
            const isAmber = hab.risk_zone === 'AMBER';
            const isEvacuated = hab.evacuation_status === 'EVACUATED';
            const vulnTotal =
              hab.population.elderly_65 +
              hab.population.infants_5 +
              hab.population.pwd +
              hab.population.medically_dependent;

            return (
              <div
                key={hab.id}
                id={`queue-card-${hab.id}`}
                onClick={() => onSelectHabitation(hab)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1e283d] border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                    : isEvacuated
                    ? 'bg-emerald-950/20 border-emerald-900/60 hover:border-emerald-700'
                    : isRed
                    ? 'bg-red-950/25 border-red-900/70 hover:border-red-600'
                    : isAmber
                    ? 'bg-amber-950/20 border-amber-900/60 hover:border-amber-600'
                    : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Top Row: Rank, Name, Risk Score */}
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        isRed
                          ? 'bg-red-600 text-white'
                          : isAmber
                          ? 'bg-amber-600 text-white'
                          : isEvacuated
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-gray-100 flex items-center gap-1.5">
                        {hab.name}
                        {hab.infrastructure.bridge_washout_risk && (
                          <span
                            title="Single bridge washout risk: immediate bottleneck"
                            className="text-red-400"
                          >
                            <AlertOctagon className="w-3.5 h-3.5 inline animate-pulse" />
                          </span>
                        )}
                      </h4>
                      <div className="text-[10px] text-gray-400">
                        {hab.taluk} Taluk • {hab.elevation_m}m elev • {hab.population.total} residents
                      </div>
                    </div>
                  </div>

                  {/* Risk Badge */}
                  <div className="flex flex-col items-end">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isRed
                          ? 'bg-red-600 text-white pulse-red-badge'
                          : isAmber
                          ? 'bg-amber-600 text-white'
                          : isEvacuated
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {isEvacuated ? 'EVACUATED' : `${hab.risk_score} ${hab.risk_zone}`}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono mt-0.5">
                      EPI: <strong>{hab.priority_score}</strong>
                    </span>
                  </div>
                </div>

                {/* Demographics Summary */}
                <div className="grid grid-cols-4 gap-1 bg-gray-900/80 p-1.5 rounded mt-2 text-[10px] text-center border border-gray-800">
                  <div>
                    <span className="text-gray-400">Elderly:</span>{' '}
                    <strong className="text-gray-200">{hab.population.elderly_65}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Infants:</span>{' '}
                    <strong className="text-gray-200">{hab.population.infants_5}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">PwD:</span>{' '}
                    <strong className="text-amber-300">{hab.population.pwd}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Medical:</span>{' '}
                    <strong className="text-red-300">{hab.population.medically_dependent}</strong>
                  </div>
                </div>

                {/* Route & Shelter Match */}
                <div className="flex items-center justify-between text-[11px] text-gray-300 mt-2 bg-gray-950/60 p-1.5 rounded border border-gray-800/80">
                  <div className="flex items-center gap-1 truncate max-w-[190px]">
                    <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate" title={hab.assigned_shelter_name}>
                      {hab.assigned_shelter_name}
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-300 font-mono shrink-0">
                    {hab.distance_to_shelter_km} km ({hab.estimated_transit_mins}m)
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-1.5 mt-2 pt-1 border-t border-gray-800">
                  <button
                    id={`btn-alert-${hab.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTriggerAlert(hab);
                    }}
                    className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>CAP Alert</span>
                  </button>

                  {isEvacuated ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                      <CheckCircle className="w-3 h-3" /> Relocated Safe
                    </span>
                  ) : (
                    <button
                      id={`btn-evacuate-${hab.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEvacuateHabitation(hab.id);
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all shadow ${
                        isRed
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950'
                          : 'bg-amber-600 hover:bg-amber-500 text-white'
                      }`}
                    >
                      <Truck className="w-3 h-3" />
                      <span>{hab.evacuation_status === 'ORDERED' ? 'Complete Evacuation' : 'Order Evacuation'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
