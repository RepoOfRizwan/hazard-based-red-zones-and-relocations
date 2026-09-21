import React from 'react';
import {
  AlertTriangle,
  Users,
  ShieldCheck,
  Building,
  CloudRain,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { SummaryStats } from '../types';

interface KPISummaryBannerProps {
  stats: SummaryStats;
  onFilterRedZones: () => void;
  onOpenShelterAudit: () => void;
}

export const KPISummaryBanner: React.FC<KPISummaryBannerProps> = ({
  stats,
  onFilterRedZones,
  onOpenShelterAudit,
}) => {
  const evacPercentage =
    stats.at_risk_population > 0
      ? Math.min(
          100,
          Math.round(
            (stats.evacuated_population /
              (stats.evacuated_population + stats.at_risk_population)) *
              100
          )
        )
      : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 px-4 py-2 bg-[#0d1322] border-b border-gray-800 text-xs shrink-0">
      {/* 1. Red Zone Alert KPI */}
      <div
        id="kpi-red-zones"
        onClick={onFilterRedZones}
        className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
          stats.red_zone_count > 0
            ? 'bg-red-950/40 border-red-700/60 hover:border-red-500 shadow-md shadow-red-950/50'
            : 'bg-gray-900/60 border-gray-800'
        }`}
      >
        <div>
          <div className="flex items-center gap-1.5 text-gray-400 font-medium">
            <AlertTriangle
              className={`w-3.5 h-3.5 ${
                stats.red_zone_count > 0 ? 'text-red-400 animate-bounce' : 'text-gray-500'
              }`}
            />
            <span>Critical Red Zones</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-black text-red-400">
              {stats.red_zone_count}
            </span>
            <span className="text-[10px] text-gray-400">
              of {stats.total_habitations} Habitations
            </span>
          </div>
        </div>
        {stats.red_zone_count > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-600/30 text-red-300 border border-red-600/50 pulse-red-badge">
            CRITICAL
          </span>
        )}
      </div>

      {/* 2. At-Risk Population KPI */}
      <div
        id="kpi-at-risk-population"
        className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-1.5 text-gray-400 font-medium">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>At-Risk Population</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-amber-300">
              {stats.at_risk_population.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400">in Red/Amber Zones</span>
          </div>
        </div>
        <div className="text-right text-[10px] text-gray-400">
          <div>Pending: <strong className="text-white">{stats.pending_evacuations}</strong></div>
          <div>Amber: <strong className="text-amber-400">{stats.amber_zone_count}</strong></div>
        </div>
      </div>

      {/* 3. Evacuation Progress KPI */}
      <div
        id="kpi-evacuation-progress"
        className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-gray-400 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Evacuation Status</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-400">
            {evacPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${evacPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
          <span>Relocated: <strong className="text-emerald-400">{stats.evacuated_population}</strong></span>
          <span>Target: <strong className="text-gray-300">{stats.at_risk_population + stats.evacuated_population}</strong></span>
        </div>
      </div>

      {/* 4. Shelter Carrying Capacity Headroom */}
      <div
        id="kpi-shelter-capacity"
        onClick={onOpenShelterAudit}
        className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 hover:border-cyan-700/60 cursor-pointer transition-all flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-1.5 text-gray-400 font-medium">
            <Building className="w-3.5 h-3.5 text-cyan-400" />
            <span>Shelter Headroom</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-black text-cyan-300">
              {stats.available_shelter_headroom.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400">
              / {stats.total_safe_capacity.toLocaleString()} Safe
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            Sphere 3.5m²
          </span>
          <div className="text-[10px] text-gray-400 mt-1">
            {stats.total_shelters} Active Shelters
          </div>
        </div>
      </div>

      {/* 5. Live Rainfall & Soil Saturation */}
      <div
        id="kpi-rainfall-telemetry"
        className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 flex items-center justify-between col-span-2 md:col-span-1"
      >
        <div>
          <div className="flex items-center gap-1.5 text-gray-400 font-medium">
            <CloudRain className="w-3.5 h-3.5 text-sky-400" />
            <span>Rainfall Rate</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-sky-300">
              {stats.active_rainfall_mm.toFixed(1)}
            </span>
            <span className="text-[10px] text-gray-400">mm / hr</span>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
              stats.active_rainfall_mm >= 160
                ? 'bg-red-500/20 text-red-400 border border-red-600'
                : stats.active_rainfall_mm >= 100
                ? 'bg-amber-500/20 text-amber-400 border border-amber-600'
                : 'bg-sky-500/20 text-sky-300 border border-sky-600'
            }`}
          >
            {stats.active_rainfall_mm >= 160
              ? 'CLOUDBURST'
              : stats.active_rainfall_mm >= 100
              ? 'VERY HEAVY'
              : 'MODERATE'}
          </span>
          <div className="text-[10px] text-gray-400 mt-1 truncate max-w-[90px]">
            {stats.weather_condition}
          </div>
        </div>
      </div>
    </div>
  );
};
