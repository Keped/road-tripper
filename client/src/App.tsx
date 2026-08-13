import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_EMPTY_ROUTE } from './data/emptyRoute';
import { RouteData, POI, TriggeredAlert, TrackingMode, SavedRouteSummary } from './types';
import { useSettingsState } from './hooks/useSettings';
import { getHaversineDistanceMeters, getHeadingAngle } from './utils/distance';
import { speakText } from './services/ttsService';
import { enableBackgroundPersistence, disableBackgroundPersistence } from './services/backgroundAudioService';
import { startGPSTracking, stopGPSTracking } from './services/geoService';
import { fetchSavedRoutes, fetchRouteById } from './services/apiClient';

import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { CockpitHUD } from './components/CockpitHUD';
import { PassedPlacesFeed } from './components/PassedPlacesFeed';
import { RouteSimulator } from './components/RouteSimulator';
import { SettingsPanel } from './components/SettingsPanel';
import { RouteImportModal } from './components/RouteImportModal';
import { SavedRoutesPanel } from './components/SavedRoutesPanel';

export function App() {
  const { settings, updateSettings } = useSettingsState();

  // Active Route
  const [activeRoute, setActiveRoute] = useState<RouteData>(DEFAULT_EMPTY_ROUTE);

  // Car Position & Heading State
  const [carPosition, setCarPosition] = useState<[number, number]>(DEFAULT_EMPTY_ROUTE.polyline[0]);
  const [carHeading, setCarHeading] = useState<number>(0);
  const [carSpeedKmh, setCarSpeedKmh] = useState<number>(0);

  // Tracking Mode State
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('idle');
  const [simIndex, setSimIndex] = useState<number>(0);
  const [simSpeed, setSimSpeed] = useState<number>(settings.simulationSpeed || 5);

  // Alerts State
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredAlert[]>([]);
  const seenPoiIdsRef = useRef<Set<string>>(new Set());

  // Saved Routes Library
  const [savedRoutes, setSavedRoutes] = useState<SavedRouteSummary[]>([]);

  // Modals / Panels
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isSavedPanelOpen, setIsSavedPanelOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Fetch saved routes from backend on mount and set active route
  const loadSavedRoutesList = useCallback(async () => {
    const list = await fetchSavedRoutes();
    setSavedRoutes(list);
    if (list.length > 0) {
      const latest = await fetchRouteById(list[0].id);
      if (latest) {
        setActiveRoute(latest);
      }
    }
  }, []);

  useEffect(() => {
    loadSavedRoutesList();
  }, [loadSavedRoutesList]);

  // Reset car position whenever active route changes
  useEffect(() => {
    if (activeRoute.polyline && activeRoute.polyline.length > 0) {
      const startPos = activeRoute.polyline[0];
      setCarPosition(startPos);
      setSimIndex(0);
      if (activeRoute.polyline.length > 1) {
        setCarHeading(getHeadingAngle(startPos, activeRoute.polyline[1]));
      }
      setTriggeredAlerts([]);
      seenPoiIdsRef.current.clear();
    }
  }, [activeRoute]);

  // GEOFENCING LOGIC: Check proximity to POIs on position update
  const checkGeofence = useCallback(
    (currentPos: [number, number]) => {
      if (!activeRoute.pois || activeRoute.pois.length === 0) return;

      activeRoute.pois.forEach((poi) => {
        // 1. Check if category is enabled in settings
        const categoryEnabled = settings.notifications[poi.category];
        if (!categoryEnabled) return;

        // 2. Check if already triggered in this session
        if (seenPoiIdsRef.current.has(poi.id)) return;

        // 3. Check distance
        const dist = getHaversineDistanceMeters(currentPos, poi.latLng);
        if (dist <= settings.triggerRadiusM) {
          seenPoiIdsRef.current.add(poi.id);

          const alertObj: TriggeredAlert = {
            poi,
            triggeredAtTimestamp: Date.now(),
            distMeters: dist,
          };

          setTriggeredAlerts((prev) => [alertObj, ...prev]);

          // Trigger Text-to-Speech voice alert if enabled
          if (settings.voice.enabled) {
            speakText(`${poi.title}. ${poi.summary}`, settings.voice.speed);
          }
        }
      });
    },
    [activeRoute, settings]
  );

  // SIMULATION ENGINE: Move car along polyline step-by-step
  useEffect(() => {
    if (trackingMode !== 'simulating') return;
    if (!activeRoute.polyline || activeRoute.polyline.length <= 1) return;

    const intervalMs = Math.max(100, Math.floor(1000 / simSpeed));

    const simInterval = setInterval(() => {
      setSimIndex((prevIdx) => {
        const nextIdx = prevIdx + 1;
        if (nextIdx >= activeRoute.polyline.length) {
          // Reached end of simulation
          setTrackingMode('idle');
          setCarSpeedKmh(0);
          disableBackgroundPersistence();
          return prevIdx;
        }

        const currentPos = activeRoute.polyline[prevIdx];
        const nextPos = activeRoute.polyline[nextIdx];

        // Compute heading & speed
        const distM = getHaversineDistanceMeters(currentPos, nextPos);
        const calcSpeedKmh = Math.round((distM / (intervalMs / 1000)) * 3.6);
        setCarSpeedKmh(Math.min(130, Math.max(30, calcSpeedKmh * simSpeed)));

        const newHeading = getHeadingAngle(currentPos, nextPos);
        setCarHeading(newHeading);
        setCarPosition(nextPos);

        // Geofence check
        checkGeofence(nextPos);

        return nextIdx;
      });
    }, intervalMs);

    return () => clearInterval(simInterval);
  }, [trackingMode, simSpeed, activeRoute, checkGeofence]);

  // REAL GPS ENGINE: Track device location
  const toggleGPSMode = () => {
    if (trackingMode === 'gps') {
      stopGPSTracking();
      disableBackgroundPersistence();
      setTrackingMode('idle');
      setCarSpeedKmh(0);
    } else {
      setTrackingMode('gps');
      enableBackgroundPersistence();
      startGPSTracking(
        (location) => {
          const newPos: [number, number] = [location.lat, location.lng];
          setCarPosition(newPos);
          if (location.heading !== null && location.heading !== undefined) {
            setCarHeading(location.heading);
          }
          if (location.speed !== null && location.speed !== undefined) {
            setCarSpeedKmh(Math.round(location.speed * 3.6));
          }
          checkGeofence(newPos);
        },
        (err) => {
          console.error('GPS error:', err);
          alert(`GPS Error: ${err.message}`);
          setTrackingMode('idle');
          disableBackgroundPersistence();
        }
      );
    }
  };

  const toggleSimulate = () => {
    if (trackingMode === 'simulating') {
      setTrackingMode('idle');
      setCarSpeedKmh(0);
    } else {
      setTrackingMode('simulating');
      enableBackgroundPersistence();
    }
  };

  const handleResetSim = () => {
    setTrackingMode('idle');
    setSimIndex(0);
    setCarSpeedKmh(0);
    if (activeRoute.polyline && activeRoute.polyline.length > 0) {
      setCarPosition(activeRoute.polyline[0]);
    }
    setTriggeredAlerts([]);
    seenPoiIdsRef.current.clear();
  };

  const handleSeek = (percent: number) => {
    if (!activeRoute.polyline || activeRoute.polyline.length === 0) return;
    const total = activeRoute.polyline.length;
    const targetIdx = Math.min(total - 1, Math.floor((percent / 100) * total));
    setSimIndex(targetIdx);
    const newPos = activeRoute.polyline[targetIdx];
    setCarPosition(newPos);
    checkGeofence(newPos);
  };

  const progressPercent =
    activeRoute.polyline && activeRoute.polyline.length > 1
      ? (simIndex / (activeRoute.polyline.length - 1)) * 100
      : 0;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Top Navbar */}
      <Navbar
        activeRoute={activeRoute}
        trackingMode={trackingMode}
        savedRoutesCount={savedRoutes.length}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenSavedPanel={() => setIsSavedPanelOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleGPS={toggleGPSMode}
      />

      {/* Main Cockpit Split Layout */}
      <main className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Left / Top: Interactive Map View */}
        <div className="flex-1 relative h-[55vh] md:h-full w-full">
          <MapView
            route={activeRoute}
            carPosition={carPosition}
            carHeading={carHeading}
            triggerRadiusM={settings.triggerRadiusM}
            triggeredPoiIds={seenPoiIdsRef.current}
          />

          {/* Cockpit HUD Overlay */}
          <CockpitHUD
            route={activeRoute}
            speedKmh={carSpeedKmh}
            trackingMode={trackingMode}
            triggeredCount={triggeredAlerts.length}
          />

          {/* Simulator Floating Controls Bar */}
          <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto z-20 max-w-md pointer-events-auto">
            <RouteSimulator
              trackingMode={trackingMode}
              isSimulating={trackingMode === 'simulating'}
              progressPercent={progressPercent}
              simSpeed={simSpeed}
              onTogglePlay={toggleSimulate}
              onReset={handleResetSim}
              onChangeSpeed={(s) => setSimSpeed(s)}
              onSeek={handleSeek}
            />
          </div>
        </div>

        {/* Right / Bottom: Passed Places & Historical Intelligence Feed */}
        <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex flex-col h-[45vh] md:h-full shrink-0 z-20">
          <PassedPlacesFeed
            alerts={triggeredAlerts}
            settings={settings}
            onClearAlerts={() => setTriggeredAlerts([])}
          />
        </div>
      </main>

      {/* Modals & Panels */}
      <RouteImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onRouteImported={(newRoute) => {
          setActiveRoute(newRoute);
          loadSavedRoutesList();
        }}
      />

      <SavedRoutesPanel
        isOpen={isSavedPanelOpen}
        onClose={() => setIsSavedPanelOpen(false)}
        savedRoutes={savedRoutes}
        activeRouteId={activeRoute.id}
        onSelectRoute={(route) => setActiveRoute(route)}
        onRefreshList={loadSavedRoutesList}
      />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />
    </div>
  );
}
