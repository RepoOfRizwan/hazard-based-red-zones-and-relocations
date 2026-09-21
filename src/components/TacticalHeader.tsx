import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  CloudRain,
  RotateCcw,
  Zap,
  Building2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { LiveWeatherData } from '../engines/weatherService';

interface TacticalHeaderProps {
  rainfallMm: number;
  onRainfallChange: (val: number) => void;
  onPresetSelect: (val: number) => void;
  onSyncLiveWeather: () => void;
  onReset: () => void;
  onOpenShelterAudit: () => void;
  liveWeather: LiveWeatherData | null;
  isSyncingWeather: boolean;
  redZoneCount: number;
}

export const TacticalHeader: React.FC<TacticalHeaderProps> = ({
  rainfallMm,
  onRainfallChange,
  onPresetSelect,
  onSyncLiveWeather,
  onReset,
  onOpenShelterAudit,
  liveWeather,
  isSyncingWeather,
  redZoneCount,
}) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-[#111827] border-b border-gray-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div
          id="ndrf-logo-badge"
          className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-600 flex items-center justify-center text-red-400 font-black text-xl shadow-lg shadow-red-900/30"
        >
          <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white font-bold text-[11px] px-2 py-0.5 rounded tracking-wider uppercase">
              NDRF / MHA
            </span>
            <span className="text-xs font-semibold text-gray-400">
              SIH 2026 Problem ID: 26191
            </span>
            {redZoneCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                {redZoneCount} RED ZONES ACTIVE
              </span>
            )}
          </div>
          <h1 className="text-sm md:text-base font-bold text-white tracking-tight flex items-center gap-2">
            Hazard Red-Zone & Relocation Decision Support System
            <span className="text-xs font-normal text-cyan-400 hidden sm:inline">
              | Wayanad Pilot (Meppadi - Chooralmala Corridor)
            </span>
          </h1>
        </div>
      </div>

      {/* Simulation Controls Center */}
      <div className="flex flex-wrap items-center gap-2.5 bg-[#1f2937]/90 px-3 py-1.5 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center justify-between text-[11px] text-gray-300 font-medium">
              <span>Precipitation:</span>
              <span className="text-cyan-300 font-bold ml-1">{rainfallMm.toFixed(1)} mm</span>
            </div>
            <input
              id="rainfall-slider"
              type="range"
              min="10"
              max="220"
              step="5"
              value={isNaN(rainfallMm) ? 65 : rainfallMm}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onRainfallChange(isNaN(val) ? 65 : val);
              }}
              className="w-24 sm:w-32 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              title="Adjust live/simulated rainfall in mm"
            />
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="flex items-center gap-1 border-l border-gray-700 pl-2">
          <button
            id="btn-preset-cloudburst"
            onClick={() => onPresetSelect(180)}
            className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
              rainfallMm >= 160
                ? 'bg-red-600 text-white shadow-md shadow-red-700/40'
                : 'bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800'
            }`}
            title="Simulate sudden cloudburst (180mm)"
          >
            Cloudburst 180mm
          </button>
          <button
            id="btn-preset-heavy"
            onClick={() => onPresetSelect(115)}
            className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
              rainfallMm >= 100 && rainfallMm < 160
                ? 'bg-amber-600 text-white'
                : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800'
            }`}
            title="Simulate very heavy monsoon rainfall (115mm)"
          >
            Heavy 115mm
          </button>
          <button
            id="btn-preset-moderate"
            onClick={() => onPresetSelect(65)}
            className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
              rainfallMm < 100
                ? 'bg-cyan-700 text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
            }`}
            title="Baseline moderate rain (65mm)"
          >
            Moderate 65mm
          </button>
        </div>

        {/* Live Weather Sync & Reset */}
        <div className="flex items-center gap-1 border-l border-gray-700 pl-2">
          <button
            id="btn-sync-weather"
            onClick={onSyncLiveWeather}
            disabled={isSyncingWeather}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 transition-colors disabled:opacity-50"
            title="Fetch real-time precipitation telemetry from Open-Meteo"
          >
            <Zap className={`w-3 h-3 ${isSyncingWeather ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Live Weather</span>
          </button>
          <button
            id="btn-reset-baseline"
            onClick={onReset}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 transition-colors"
            title="Reset system to initial state"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Right Telemetry Info */}
      <div className="flex items-center gap-3">
        <button
          id="btn-open-shelter-audit"
          onClick={onOpenShelterAudit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800/80 border border-blue-600/70 text-blue-200 text-xs font-semibold transition-all shadow"
        >
          <Building2 className="w-4 h-4 text-blue-400" />
          <span>Shelter Capacity Audit</span>
        </button>

        <div className="hidden lg:flex flex-col items-end text-right">
          <div className="flex items-center gap-1 text-xs text-gray-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span id="live-clock">{currentTime}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>TACTICAL OPS: LIVE</span>
          </div>
        </div>
      </div>
    </header>
  );
};
