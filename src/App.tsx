import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Habitation,
  ShelterSite,
  AlertNotification,
  SummaryStats,
} from './types';
import {
  REGIONS,
  WAYANAD_HABITATIONS,
  WAYANAD_SHELTERS,
  BIHAR_HABITATIONS,
  BIHAR_SHELTERS,
  ASSAM_HABITATIONS,
  ASSAM_SHELTERS,
  UP_HABITATIONS,
  UP_SHELTERS,
} from './data/seedData';
import { HazardRiskEngine } from './engines/hazardEngine';
import { CarryingCapacityEngine } from './engines/capacityEngine';
import { PriorityRankingEngine } from './engines/priorityEngine';
import { RelocationEngine } from './engines/relocationEngine';
import { AlertEngine } from './engines/alertEngine';
import { WeatherService, LiveWeatherData } from './engines/weatherService';

import { TacticalHeader } from './components/TacticalHeader';
import { KPISummaryBanner } from './components/KPISummaryBanner';
import { EvacuationPriorityQueue } from './components/EvacuationPriorityQueue';
import { TacticalMap } from './components/TacticalMap';
import { ExplainableRiskInspector } from './components/ExplainableRiskInspector';
import { AlertDispatcherModal } from './components/AlertDispatcherModal';
import { ShelterAuditDrawer } from './components/ShelterAuditDrawer';

export default function App() {
  // Region / Sector State
  const availableRegions = useMemo(() => Object.values(REGIONS), []);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('bihar');
  const currentRegion = REGIONS[selectedRegionId] || REGIONS.wayanad;

  // Simulation State
  const [rainfallMm, setRainfallMm] = useState<number>(currentRegion.is_flood_basin ? 95.0 : 65.0);
  const [evacuatedHabitationIds, setEvacuatedHabitationIds] = useState<Set<string>>(new Set());
  const [selectedHabitationId, setSelectedHabitationId] = useState<string | null>(
    currentRegion.id === 'bihar' ? 'BIH-001' : 'HAB-001'
  );
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'RED' | 'AMBER' | 'EVACUATED'>('ALL');
  const [currentAlert, setCurrentAlert] = useState<AlertNotification | null>(null);
  const [isShelterAuditOpen, setIsShelterAuditOpen] = useState<boolean>(false);
  const [liveWeather, setLiveWeather] = useState<LiveWeatherData | null>(null);
  const [isSyncingWeather, setIsSyncingWeather] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show tactical toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Handle Sector / Region Change
  const handleRegionChange = (newRegionId: string) => {
    if (!REGIONS[newRegionId]) return;
    setSelectedRegionId(newRegionId);
    const targetRegion = REGIONS[newRegionId];
    
    // Set appropriate initial rainfall and clear previous evacuations
    const initialRain = targetRegion.is_flood_basin ? 95.0 : 65.0;
    setRainfallMm(initialRain);
    setEvacuatedHabitationIds(new Set());
    const defaultHabId =
      newRegionId === 'bihar'
        ? 'BIH-001'
        : newRegionId === 'assam'
        ? 'ASM-001'
        : newRegionId === 'uttar_pradesh'
        ? 'UP-001'
        : 'HAB-001';
    setSelectedHabitationId(defaultHabId);
    setActiveFilter('ALL');
    showToast(`Operational Sector switched to: ${targetRegion.name}`);
  };

  // Raw Habitations and Shelters based on Region
  const rawHabitations =
    currentRegion.id === 'bihar'
      ? BIHAR_HABITATIONS
      : currentRegion.id === 'assam'
      ? ASSAM_HABITATIONS
      : currentRegion.id === 'uttar_pradesh'
      ? UP_HABITATIONS
      : WAYANAD_HABITATIONS;

  const rawShelters =
    currentRegion.id === 'bihar'
      ? BIHAR_SHELTERS
      : currentRegion.id === 'assam'
      ? ASSAM_SHELTERS
      : currentRegion.id === 'uttar_pradesh'
      ? UP_SHELTERS
      : WAYANAD_SHELTERS;

  // Compute Habitations and Shelters dynamically
  const { habitations, evaluatedShelters } = useMemo(() => {
    // 1. Compute Hazard Risk & Priority Index for each habitation
    const baseHabs: Habitation[] = rawHabitations.map((raw) => {
      const {
        risk_score,
        risk_zone,
        factor_breakdown,
        dominant_hazard,
        hazard_alert_type,
      } = HazardRiskEngine.computeRisk(
        raw.terrain,
        rainfallMm,
        currentRegion.is_flood_basin
      );

      const priority_score = PriorityRankingEngine.computePriorityScore({
        population: raw.population,
        infrastructure: raw.infrastructure,
        risk_score,
      });

      const isEvacuated = evacuatedHabitationIds.has(raw.id);

      return {
        ...raw,
        rainfall_mm: rainfallMm,
        risk_score,
        risk_zone,
        factor_breakdown,
        dominant_hazard,
        hazard_alert_type,
        priority_rank: 0,
        priority_score,
        evacuation_status: isEvacuated ? 'EVACUATED' : 'PENDING',
      };
    });

    // 2. Evaluate candidate shelters with base occupancy
    const initialEvaluatedShelters: ShelterSite[] = rawShelters.map((s) => {
      return CarryingCapacityEngine.evaluateShelter(s);
    });

    // 3. Match habitations to shelters via RelocationEngine
    const { habitations: assignedHabs, updatedShelters } = RelocationEngine.assignShelters(
      baseHabs,
      initialEvaluatedShelters
    );

    // 4. Update shelter occupancy based on actual evacuated habitations
    const sheltersWithEvacuees = updatedShelters.map((shelter) => {
      let extraEvacuees = 0;
      assignedHabs.forEach((h) => {
        if (h.assigned_shelter_id === shelter.id && evacuatedHabitationIds.has(h.id)) {
          extraEvacuees += h.population.total;
        }
      });

      const adjustedShelter: ShelterSite = {
        ...shelter,
        current_occupancy: shelter.current_occupancy + extraEvacuees,
      };

      return CarryingCapacityEngine.evaluateShelter(adjustedShelter);
    });

    return {
      habitations: assignedHabs,
      evaluatedShelters: sheltersWithEvacuees,
    };
  }, [rawHabitations, rawShelters, rainfallMm, currentRegion.is_flood_basin, evacuatedHabitationIds]);

  // Compute Aggregated Summary Stats for the KPI Banner
  const summaryStats: SummaryStats = useMemo(() => {
    const redHabs = habitations.filter((h) => h.risk_zone === 'RED');
    const amberHabs = habitations.filter((h) => h.risk_zone === 'AMBER');
    const greenHabs = habitations.filter((h) => h.risk_zone === 'GREEN');

    const floodWarnings = habitations.filter((h) => h.dominant_hazard === 'FLOOD' && h.risk_zone !== 'GREEN').length;
    const landslideWarnings = habitations.filter((h) => h.dominant_hazard === 'LANDSLIDE' && h.risk_zone !== 'GREEN').length;

    const atRiskPop = habitations
      .filter((h) => (h.risk_zone === 'RED' || h.risk_zone === 'AMBER') && h.evacuation_status !== 'EVACUATED')
      .reduce((sum, h) => sum + h.population.total, 0);

    const evacuatedPop = habitations
      .filter((h) => h.evacuation_status === 'EVACUATED')
      .reduce((sum, h) => sum + h.population.total, 0);

    const pendingEvac = habitations.filter(
      (h) => h.risk_zone === 'RED' && h.evacuation_status !== 'EVACUATED'
    ).length;

    const totalSafeCapacity = evaluatedShelters.reduce(
      (sum, s) => sum + (s.max_safe_capacity || 0),
      0
    );
    const currentOccupancy = evaluatedShelters.reduce(
      (sum, s) => sum + s.current_occupancy,
      0
    );
    const availableHeadroom = Math.max(0, totalSafeCapacity - currentOccupancy);

    return {
      total_habitations: habitations.length,
      red_zone_count: redHabs.length,
      amber_zone_count: amberHabs.length,
      green_zone_count: greenHabs.length,
      flood_warnings_count: floodWarnings,
      landslide_warnings_count: landslideWarnings,
      at_risk_population: atRiskPop,
      evacuated_population: evacuatedPop,
      pending_evacuations: pendingEvac,
      total_shelters: evaluatedShelters.length,
      total_safe_capacity: totalSafeCapacity,
      current_shelter_occupancy: currentOccupancy,
      available_shelter_headroom: availableHeadroom,
      active_rainfall_mm: rainfallMm,
      weather_condition:
        rainfallMm >= 160
          ? 'Cloudburst Inundation'
          : rainfallMm >= 100
          ? 'Heavy Monsoon Surge'
          : 'Moderate Monsoon Rain',
    };
  }, [habitations, evaluatedShelters, rainfallMm]);

  // Fetch Live Weather when switching region
  useEffect(() => {
    handleSyncLiveWeather();
  }, [currentRegion.id]);

  const handleSyncLiveWeather = async () => {
    setIsSyncingWeather(true);
    try {
      const data = await WeatherService.fetchLiveRainfall(
        currentRegion.weather_lat,
        currentRegion.weather_lon,
        currentRegion.name
      );
      setLiveWeather(data);
      if (data.current_rain_mm > 0) {
        setRainfallMm(data.current_rain_mm);
        showToast(`Synchronized with ${data.source}: ${data.current_rain_mm} mm/h`);
      }
    } catch {
      showToast('Using local monsoon telemetry cache');
    } finally {
      setIsSyncingWeather(false);
    }
  };

  // Handlers
  const handleEvacuateHabitation = (habId: string) => {
    setEvacuatedHabitationIds((prev) => {
      const next = new Set(prev);
      const hab = habitations.find((h) => h.id === habId);
      if (next.has(habId)) {
        next.delete(habId);
        showToast(`Evacuation status reset for ${hab?.name || habId}`);
      } else {
        next.add(habId);
        showToast(`Convoy dispatched! ${hab?.name} (${hab?.population.total} residents) evacuated to safe shelter.`);
      }
      return next;
    });
  };

  const handleTriggerAlert = (hab: Habitation) => {
    const alert = AlertEngine.generateAlert(hab);
    setCurrentAlert(alert);
  };

  const handleReset = () => {
    const baseline = currentRegion.is_flood_basin ? 95.0 : 65.0;
    setRainfallMm(baseline);
    setEvacuatedHabitationIds(new Set());
    const defaultId =
      currentRegion.id === 'bihar'
        ? 'BIH-001'
        : currentRegion.id === 'assam'
        ? 'ASM-001'
        : currentRegion.id === 'uttar_pradesh'
        ? 'UP-001'
        : 'HAB-001';
    setSelectedHabitationId(defaultId);
    setActiveFilter('ALL');
    showToast('System reset to baseline telemetry.');
  };

  const selectedHabitation = habitations.find((h) => h.id === selectedHabitationId) || habitations[0] || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0f19] text-gray-100 overflow-hidden select-none">
      {/* 1. Tactical Mission Control Header with Location / Sector Changer */}
      <TacticalHeader
        currentRegion={currentRegion}
        availableRegions={availableRegions}
        onRegionChange={handleRegionChange}
        rainfallMm={rainfallMm}
        onRainfallChange={setRainfallMm}
        onPresetSelect={(val) => {
          setRainfallMm(val);
          showToast(`Simulation preset activated: ${val} mm precipitation`);
        }}
        onSyncLiveWeather={handleSyncLiveWeather}
        onReset={handleReset}
        onOpenShelterAudit={() => setIsShelterAuditOpen(true)}
        liveWeather={liveWeather}
        isSyncingWeather={isSyncingWeather}
        redZoneCount={summaryStats.red_zone_count}
        floodWarningCount={summaryStats.flood_warnings_count}
        landslideWarningCount={summaryStats.landslide_warnings_count}
      />

      {/* 2. Top KPI Summary Banner */}
      <KPISummaryBanner
        stats={summaryStats}
        onFilterRedZones={() => setActiveFilter('RED')}
        onOpenShelterAudit={() => setIsShelterAuditOpen(true)}
      />

      {/* 3. Main Tactical Workspace (3 Columns) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left Column: Evacuation Priority Queue (Ranked list) */}
        <div className="hidden md:block md:col-span-3 lg:col-span-3 h-full overflow-hidden">
          <EvacuationPriorityQueue
            habitations={habitations}
            selectedHabitationId={selectedHabitationId}
            onSelectHabitation={(hab) => setSelectedHabitationId(hab.id)}
            onEvacuateHabitation={handleEvacuateHabitation}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onTriggerAlert={handleTriggerAlert}
          />
        </div>

        {/* Center Column: GIS Tactical Leaflet Map */}
        <div className="col-span-1 md:col-span-5 lg:col-span-5 h-full relative overflow-hidden">
          <TacticalMap
            currentRegion={currentRegion}
            habitations={habitations}
            shelters={evaluatedShelters}
            selectedHabitationId={selectedHabitationId}
            onSelectHabitation={(hab) => setSelectedHabitationId(hab.id)}
            onEvacuateHabitation={handleEvacuateHabitation}
            onTriggerAlert={handleTriggerAlert}
          />
        </div>

        {/* Right Column: Explainable Hazard & Shelter Logistics Inspector */}
        <div className="col-span-1 md:col-span-4 lg:col-span-4 h-full overflow-hidden">
          <ExplainableRiskInspector
            habitation={selectedHabitation}
            shelters={evaluatedShelters}
            onEvacuate={handleEvacuateHabitation}
            onTriggerAlert={handleTriggerAlert}
          />
        </div>
      </div>

      {/* Mobile Priority Queue Tab Drawer if on small viewport */}
      <div className="md:hidden flex items-center justify-around bg-[#111827] border-t border-gray-800 p-2 text-xs">
        <button
          onClick={() => setActiveFilter('ALL')}
          className="px-2 py-1 rounded bg-gray-800 text-gray-200 text-[11px]"
        >
          Queue ({habitations.length})
        </button>
        <button
          onClick={() => setActiveFilter('RED')}
          className="px-2 py-1 rounded bg-red-950 text-red-300 border border-red-800 text-[11px]"
        >
          Red ({summaryStats.red_zone_count})
        </button>
        <button
          onClick={() => setIsShelterAuditOpen(true)}
          className="px-2 py-1 rounded bg-blue-900 text-blue-200 text-[11px]"
        >
          Shelters ({evaluatedShelters.length})
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="tactical-toast"
          className="fixed bottom-6 right-6 z-[3000] bg-[#111827] border border-cyan-500/80 shadow-2xl px-4 py-2.5 rounded-lg text-xs font-semibold text-cyan-200 flex items-center gap-2 animate-fade-in"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Multi-Channel Alert Dispatch Modal */}
      <AlertDispatcherModal
        alert={currentAlert}
        onClose={() => setCurrentAlert(null)}
      />

      {/* Shelter Carrying Capacity Audit Modal */}
      <ShelterAuditDrawer
        isOpen={isShelterAuditOpen}
        onClose={() => setIsShelterAuditOpen(false)}
        shelters={evaluatedShelters}
      />
    </div>
  );
}
