import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Habitation, ShelterSite, RegionConfig } from '../types';
import { Layers, Compass, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Waves, Mountain } from 'lucide-react';

interface TacticalMapProps {
  currentRegion: RegionConfig;
  habitations: Habitation[];
  shelters: ShelterSite[];
  selectedHabitationId: string | null;
  onSelectHabitation: (hab: Habitation) => void;
  onEvacuateHabitation: (habId: string) => void;
  onTriggerAlert: (hab: Habitation) => void;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  currentRegion,
  habitations,
  shelters,
  selectedHabitationId,
  onSelectHabitation,
  onEvacuateHabitation,
  onTriggerAlert,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups refs
  const habitationsLayerRef = useRef<L.LayerGroup | null>(null);
  const sheltersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const contoursLayerRef = useRef<L.LayerGroup | null>(null);

  // Layer visibility state
  const [showHabitations, setShowHabitations] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showContours, setShowContours] = useState(true);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Helper to strictly validate LatLng coordinates and avoid (NaN, NaN) Leaflet errors
  const isValidLatLng = (c: any): c is [number, number] => {
    return (
      Array.isArray(c) &&
      c.length >= 2 &&
      typeof c[0] === 'number' &&
      !isNaN(c[0]) &&
      isFinite(c[0]) &&
      typeof c[1] === 'number' &&
      !isNaN(c[1]) &&
      isFinite(c[1])
    );
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: currentRegion.default_center,
        zoom: currentRegion.default_zoom,
        zoomControl: false,
      });

      // OpenStreetMap standard tile layer (100% free, public, no API key or token required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
      }).addTo(map);

      // Create Layer Groups
      habitationsLayerRef.current = L.layerGroup().addTo(map);
      sheltersLayerRef.current = L.layerGroup().addTo(map);
      routesLayerRef.current = L.layerGroup().addTo(map);
      contoursLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;

      // Handle ResizeObserver so canvas adjusts properly
      const resizeObserver = new ResizeObserver(() => {
        try {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        } catch {
          // Ignore transient resize errors
        }
      });
      resizeObserver.observe(mapContainerRef.current);

      return () => {
        resizeObserver.disconnect();
        try {
          map.remove();
        } catch {
          // Ignore teardown errors
        }
        mapInstanceRef.current = null;
      };
    } catch (e) {
      console.error('Failed to initialize tactical map:', e);
    }
  }, []);

  // Center change when switching regions
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    try {
      map.setView(currentRegion.default_center, currentRegion.default_zoom, {
        animate: true,
      });
    } catch {
      // Ignore navigation error
    }
  }, [currentRegion]);

  // Update Layers whenever habitations or shelters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old layers
    habitationsLayerRef.current?.clearLayers();
    sheltersLayerRef.current?.clearLayers();
    routesLayerRef.current?.clearLayers();
    contoursLayerRef.current?.clearLayers();

    // 1. Plot Relocation Routes (Polylines from Habitations to Assigned Shelters)
    if (showRoutes && routesLayerRef.current) {
      habitations.forEach((hab) => {
        if (!hab.assigned_shelter_id) return;
        const shelter = shelters.find((s) => s.id === hab.assigned_shelter_id);
        if (!shelter) return;
        if (!isValidLatLng(hab.coordinates) || !isValidLatLng(shelter.coordinates)) return;

        const isRed = hab.risk_zone === 'RED';
        const isSelected = hab.id === selectedHabitationId;

        const polyline = L.polyline([hab.coordinates, shelter.coordinates], {
          color: isRed ? '#ef4444' : isSelected ? '#06b6d4' : '#64748b',
          weight: isSelected ? 3.5 : isRed ? 2.5 : 1.5,
          opacity: isSelected ? 0.95 : isRed ? 0.8 : 0.45,
          dashArray: isRed ? '6, 6' : '4, 8',
        });

        polyline.bindTooltip(
          `<div class="text-[11px] font-mono"><strong>${hab.name} &rarr; ${shelter.name}</strong><br/>Route: ${hab.infrastructure.access_route_name} (${hab.distance_to_shelter_km} km)</div>`,
          { sticky: true, className: 'leaflet-tooltip-dark' }
        );

        routesLayerRef.current?.addLayer(polyline);
      });
    }

    // 2. Plot Hazard Risk Buffer Circles
    if (showContours && contoursLayerRef.current) {
      habitations.forEach((hab) => {
        const isRed = hab.risk_zone === 'RED';
        const isAmber = hab.risk_zone === 'AMBER';
        if (!isRed && !isAmber) return;
        if (!isValidLatLng(hab.coordinates)) return;

        // Radius proportional to slope & risk score (strictly guarded against NaN)
        const safeRiskScore = typeof hab.risk_score === 'number' && !isNaN(hab.risk_score) ? hab.risk_score : 50;
        const radiusMeters = Math.max(120, Math.min(2400, 400 + safeRiskScore * 8.0));
        const circle = L.circle(hab.coordinates, {
          radius: radiusMeters,
          color: isRed ? '#ef4444' : '#f59e0b',
          fillColor: isRed ? '#ef4444' : '#f59e0b',
          fillOpacity: isRed ? 0.18 : 0.1,
          weight: 1,
          dashArray: '3, 6',
        });

        contoursLayerRef.current?.addLayer(circle);
      });
    }

    // 3. Plot Shelters
    if (showShelters && sheltersLayerRef.current) {
      shelters.forEach((shelter) => {
        if (!isValidLatLng(shelter.coordinates)) return;
        const occPct = shelter.occupancy_pct || 0;
        const isFull = shelter.status === 'FULL';
        const isCritical = shelter.status === 'CRITICAL';
        const isWarning = shelter.status === 'WARNING';

        const statusColor = isFull
          ? '#ef4444'
          : isCritical
          ? '#f97316'
          : isWarning
          ? '#f59e0b'
          : '#10b981';

        const shelterIconHtml = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; background: #0f172a; border: 2px solid ${statusColor}; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.8); cursor: pointer;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${statusColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <div style="position: absolute; bottom: -8px; right: -6px; background: ${statusColor}; color: #000; font-size: 9px; font-weight: 900; padding: 0 4px; border-radius: 4px; line-height: 14px;">
              ${Math.round(occPct)}%
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: shelterIconHtml,
          className: 'custom-shelter-icon',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const marker = L.marker(shelter.coordinates, { icon });

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; width: 240px; line-height: 1.4;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <strong style="color: #38bdf8;">${shelter.name}</strong>
            </div>
            <div style="color: #94a3b8; font-size: 11px; margin-bottom: 6px;">${shelter.taluk} Block • ${shelter.usable_living_area_sqm} m² usable area</div>
            <div style="background: #1e293b; padding: 6px 8px; border-radius: 6px; margin-bottom: 6px;">
              <div>Sphere Safe Capacity: <strong style="color: #f1f5f9;">${shelter.max_safe_capacity} persons</strong></div>
              <div>Current Occupancy: <strong style="color: ${statusColor};">${shelter.current_occupancy} (${occPct}%)</strong></div>
              <div>Available Headroom: <strong style="color: #34d399;">${shelter.available_capacity}</strong></div>
            </div>
            <div style="font-size: 11px; color: #cbd5e1;">
              <div>💧 Drinking Water: <strong>${shelter.water_duration_days} days</strong> (${shelter.supplies.drinking_water_liters}L)</div>
              <div>🍲 Food Packets: <strong>${shelter.food_duration_days} days</strong> (${shelter.supplies.food_packets})</div>
              <div>🚻 Sanitation: <strong>1 toilet / ${shelter.sanitation_ratio} people</strong></div>
            </div>
          </div>
        `);

        sheltersLayerRef.current?.addLayer(marker);
      });
    }

    // 4. Plot Habitations
    if (showHabitations && habitationsLayerRef.current) {
      habitations.forEach((hab) => {
        if (!isValidLatLng(hab.coordinates)) return;
        const isSelected = hab.id === selectedHabitationId;
        const isRed = hab.risk_zone === 'RED';
        const isAmber = hab.risk_zone === 'AMBER';
        const isEvacuated = hab.evacuation_status === 'EVACUATED';
        const isFlood = hab.dominant_hazard === 'FLOOD';

        let badgeBg = '#10b981';
        let pulseClass = '';
        if (isEvacuated) {
          badgeBg = '#059669';
        } else if (isRed) {
          badgeBg = '#ef4444';
          pulseClass = 'pulse-red-badge';
        } else if (isAmber) {
          badgeBg = '#f59e0b';
          pulseClass = 'pulse-amber-badge';
        }

        const size = isSelected ? 40 : 32;
        const hazardBadge = isFlood ? '🌊' : '⛰️';

        const habIconHtml = `
          <div class="${pulseClass}" style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: ${size}px; height: ${size}px; background: #0f172a; border: ${
          isSelected ? '3px solid #38bdf8' : `2px solid ${badgeBg}`
        }; border-radius: 50%; box-shadow: 0 4px 15px rgba(0,0,0,0.85); cursor: pointer;">
            <div style="font-size: 10px; font-weight: 900; color: ${badgeBg};">
              ${isEvacuated ? '✓' : Math.round(hab.risk_score)}
            </div>
            <div style="position: absolute; top: -16px; background: #090d16; color: #f8fafc; font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 4px; border: 1px solid #334155; white-space: nowrap;">
              ${hazardBadge} ${hab.name}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: habIconHtml,
          className: 'custom-hab-icon',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker(hab.coordinates, { icon });

        // Click to select
        marker.on('click', () => {
          onSelectHabitation(hab);
        });

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; width: 240px; line-height: 1.4;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
              <strong style="font-size: 13px; color: #f8fafc;">${hab.name}</strong>
              <span style="background: ${badgeBg}; color: white; padding: 1px 6px; border-radius: 4px; font-weight: 800; font-size: 10px;">
                ${hab.risk_zone} (${hab.risk_score})
              </span>
            </div>
            <div style="color: #38bdf8; font-size: 10.5px; font-weight: 700; margin-bottom: 4px;">
              ${hab.hazard_alert_type || (isFlood ? 'FLASH FLOOD THREAT' : 'LANDSLIDE THREAT')}
            </div>
            <div style="color: #94a3b8; font-size: 11px; margin-bottom: 6px;">
              ${hab.taluk} Taluk • ${hab.district} • ${hab.elevation_m}m elevation • ${hab.terrain.slope_deg}° slope
            </div>
            <div style="background: #1e293b; padding: 6px; border-radius: 6px; margin-bottom: 6px; font-size: 11px;">
              <div>Population: <strong>${hab.population.total}</strong> (${hab.population.households} HH)</div>
              <div>Priority Vulnerable: <strong style="color: #fca5a5;">${
                hab.population.elderly_65 + hab.population.pwd + hab.population.medically_dependent
              }</strong></div>
              <div>Evacuation Priority: <strong style="color: #38bdf8;">Rank #${hab.priority_rank} (EPI: ${hab.priority_score})</strong></div>
              ${
                hab.infrastructure.bridge_washout_risk
                  ? '<div style="color: #f87171; font-weight: bold; margin-top: 2px;">⚠️ Single access washout threat!</div>'
                  : ''
              }
            </div>
            <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 8px;">
              Destination: <strong>${hab.assigned_shelter_name}</strong> (${hab.distance_to_shelter_km} km)
            </div>
          </div>
        `);

        habitationsLayerRef.current?.addLayer(marker);
      });
    }
  }, [
    habitations,
    shelters,
    selectedHabitationId,
    showHabitations,
    showShelters,
    showRoutes,
    showContours,
  ]);

  // Focus on selected habitation
  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (!selectedHabitationId || !mapInstanceRef.current) return;
    
    // Skip flyTo on immediate initial mount before map container has dimensions
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    const hab = habitations.find((h) => h.id === selectedHabitationId);
    if (hab && isValidLatLng(hab.coordinates)) {
      const map = mapInstanceRef.current;
      try {
        const size = map.getSize();
        if (size && size.x > 0 && size.y > 0) {
          map.flyTo(hab.coordinates, 13.5, {
            duration: 1.0,
          });
        } else {
          map.setView(hab.coordinates, 13.5);
        }
      } catch {
        try {
          map.setView(hab.coordinates, 13.5);
        } catch {
          // Ignore navigation fallback
        }
      }
    }
  }, [selectedHabitationId, habitations]);

  // Reset to current region bounds
  const handleResetSectorView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    try {
      map.flyTo(currentRegion.default_center, currentRegion.default_zoom, { duration: 1.0 });
    } catch {
      map.setView(currentRegion.default_center, currentRegion.default_zoom);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0b0f19] overflow-hidden">
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left Sector Indicator */}
      <div className="absolute top-3 left-3 z-[1000] bg-[#111827]/90 backdrop-blur border border-gray-700/80 px-3 py-1.5 rounded-lg shadow-xl text-xs text-gray-200 pointer-events-auto flex items-center gap-2">
        {currentRegion.is_flood_basin ? (
          <Waves className="w-4 h-4 text-cyan-400" />
        ) : (
          <Mountain className="w-4 h-4 text-orange-400" />
        )}
        <div>
          <div className="font-bold text-white text-[12px]">{currentRegion.name}</div>
          <div className="text-[10px] text-gray-400">{currentRegion.hazard_focus}</div>
        </div>
      </div>

      {/* Top Right Quick Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-1.5 pointer-events-auto">
        <button
          onClick={handleResetSectorView}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1f2937]/90 hover:bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-xs font-semibold shadow-md transition-colors"
          title={`Reset map to ${currentRegion.name} sector`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Reset Sector View</span>
        </button>

        {/* Layer Visibility Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1f2937]/90 hover:bg-gray-700 text-gray-200 border border-gray-600 rounded-md text-xs font-semibold shadow-md transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Map Layers</span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-[#111827] border border-gray-700 rounded-lg p-2.5 shadow-2xl z-50 text-xs text-gray-300 flex flex-col gap-2">
              <div className="font-bold text-gray-200 border-b border-gray-800 pb-1 text-[11px] uppercase tracking-wider">
                Active Tactical Overlays
              </div>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showHabitations}
                  onChange={(e) => setShowHabitations(e.target.checked)}
                  className="accent-cyan-500 rounded"
                />
                <span>Habitations ({habitations.length})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showShelters}
                  onChange={(e) => setShowShelters(e.target.checked)}
                  className="accent-cyan-500 rounded"
                />
                <span>Candidate Shelters ({shelters.length})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showRoutes}
                  onChange={(e) => setShowRoutes(e.target.checked)}
                  className="accent-cyan-500 rounded"
                />
                <span>Evacuation Corridors</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={showContours}
                  onChange={(e) => setShowContours(e.target.checked)}
                  className="accent-cyan-500 rounded"
                />
                <span>Hazard Risk Buffers</span>
              </label>
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex flex-col gap-1 mt-2">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 flex items-center justify-center bg-[#1f2937]/90 hover:bg-gray-700 text-gray-200 border border-gray-600 rounded shadow"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 flex items-center justify-center bg-[#1f2937]/90 hover:bg-gray-700 text-gray-200 border border-gray-600 rounded shadow"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#111827]/90 backdrop-blur border border-gray-700/80 px-3 py-2 rounded-lg shadow-xl text-[11px] text-gray-300 pointer-events-auto flex flex-wrap items-center gap-3">
        <div className="font-bold text-gray-400 text-[10px] uppercase">LEGEND:</div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>Red Zone (&gt;70)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Amber (40-70)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Green (&lt;40)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-900 border border-cyan-400 inline-block"></span>
          <span>Sphere Relief Shelter</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-red-500 border-b border-dashed border-red-400 inline-block"></span>
          <span>Critical Evac Route</span>
        </div>
      </div>
    </div>
  );
};
