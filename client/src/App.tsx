import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_EMPTY_ROUTE } from './data/emptyRoute';
import { RouteData, POI, TriggeredAlert, TrackingMode, SavedRouteSummary } from './types';
import { useSettingsState } from './hooks/useSettings';
import { getHaversineDistanceMeters, getHeadingAngle } from './utils/distance';
import { speakText } from './services/ttsService';
import { enableBackgroundPersistence, disableBackgroundPersistence } from './services/backgroundAudioService';
import { startGPSTracking, stopGPSTracking } from './services/geoService';
import { fetchSavedRoutes, fetchRouteById } from './services/apiClient';
import { checkSession, clearAuthToken } from './services/authService';

import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { CockpitHUD } from './components/CockpitHUD';
import { PassedPlacesFeed } from './components/PassedPlacesFeed';
import { RouteSimulator } from './components/RouteSimulator';
import { SettingsPanel } from './components/SettingsPanel';
import { RouteImportModal } from './components/RouteImportModal';
import { SavedRoutesPanel } from './components/SavedRoutesPanel';
import { LoginModal } from './components/LoginModal';
import { RouteOverviewModal } from './components/RouteOverviewModal';

export function App() {
  const { settings, updateSettings } = useSettingsState();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

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
  // Lookahead: track POIs that have already been pre-announced (2-min warning)
  const preAnnouncedPoiIdsRef = useRef<Set<string>>(new Set());

  // Saved Routes Library
  const [savedRoutes, setSavedRoutes] = useState<SavedRouteSummary[]>([]);

  // Modals / Panels
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isSavedPanelOpen, setIsSavedPanelOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isItineraryOpen, setIsItineraryOpen] = useState<boolean>(false);

  // Upcoming POI state (for the CockpitHUD "next POI" indicator)
  const [upcomingPoi, setUpcomingPoi] = useState<{ poi: POI; etaSeconds: number; distMeters: number } | null>(null);

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

  // Check auth session on initial load
  useEffect(() => {
    async function verifyAuth() {
      setIsCheckingAuth(true);
      const isOk = await checkSession();
      setIsAuthenticated(isOk);
      setIsCheckingAuth(false);
      if (isOk) {
        loadSavedRoutesList();
      }
    }
    verifyAuth();
  }, [loadSavedRoutesList]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    loadSavedRoutesList();
  };

  const handleLogout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
    setActiveRoute(DEFAULT_EMPTY_ROUTE);
    setSavedRoutes([]);
  };

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
      preAnnouncedPoiIdsRef.current.clear();
      setUpcomingPoi(null);
    }
  }, [activeRoute]);

  /**
   * Calculate the distance in meters along the polyline from a given polyline index to a POI.
   * Returns the sum of segment distances from currentIdx to the polyline point nearest to the POI.
   */
  const getDistanceAlongPolylineToPoi = useCallback(
    (currentIdx: number, poi: POI): number | null => {
      const poly = activeRoute.polyline;
      if (!poly || poly.length < 2) return null;

      // Find the polyline index closest to this POI
      let closestIdx = currentIdx;
      let closestDist = Infinity;
      for (let i = currentIdx; i < poly.length; i++) {
        const d = getHaversineDistanceMeters(poly[i], poi.latLng);
        if (d < closestDist) {
          closestDist = d;
          closestIdx = i;
        }
      }

      // POI is behind us
      if (closestIdx <= currentIdx) return null;

      // Sum segment distances from current position to the closest point
      let totalDist = 0;
      for (let i = currentIdx; i < closestIdx; i++) {
        totalDist += getHaversineDistanceMeters(poly[i], poly[i + 1]);
      }
      return totalDist;
    },
    [activeRoute]
  );

  // GEOFENCING + LOOKAHEAD LOGIC: Check proximity and 2-minute ETA to POIs on position update
  const checkGeofence = useCallback(
    (currentPos: [number, number], currentSpeedKmh: number, currentPolyIdx: number) => {
      if (!activeRoute.pois || activeRoute.pois.length === 0) return;

      let nearestUpcoming: { poi: POI; etaSeconds: number; distMeters: number } | null = null;

      activeRoute.pois.forEach((poi) => {
        // 1. Check if category is enabled in settings
        const categoryEnabled = settings.notifications[poi.category];
        if (!categoryEnabled) return;

        // Direct distance check for immediate triggering
        const directDist = getHaversineDistanceMeters(currentPos, poi.latLng);

        // 2. Immediate geofence trigger (already at the POI)
        if (directDist <= settings.triggerRadiusM && !seenPoiIdsRef.current.has(poi.id)) {
          seenPoiIdsRef.current.add(poi.id);
          preAnnouncedPoiIdsRef.current.add(poi.id); // also mark as pre-announced

          const alertObj: TriggeredAlert = {
            poi,
            triggeredAtTimestamp: Date.now(),
            distMeters: directDist,
          };

          setTriggeredAlerts((prev) => [alertObj, ...prev]);

          // Trigger Text-to-Speech voice alert if enabled
          if (settings.voice.enabled) {
            speakText(`Arriving now. ${poi.title}. ${poi.summary}`, settings.voice.speed);
          }
          return;
        }

        // 3. Lookahead: 2-minute pre-announcement for live tracking modes
        if (
          (trackingMode === 'simulating' || trackingMode === 'gps') &&
          !seenPoiIdsRef.current.has(poi.id) &&
          !preAnnouncedPoiIdsRef.current.has(poi.id) &&
          currentSpeedKmh > 5
        ) {
          const alongDist = getDistanceAlongPolylineToPoi(currentPolyIdx, poi);
          if (alongDist !== null && alongDist > 0) {
            const speedMs = (currentSpeedKmh * 1000) / 3600;
            const etaSeconds = alongDist / speedMs;

            // Track nearest upcoming for HUD
            if (!nearestUpcoming || etaSeconds < nearestUpcoming.etaSeconds) {
              nearestUpcoming = { poi, etaSeconds, distMeters: alongDist };
            }

            // Trigger pre-announcement when ETA is ~2 minutes (120s) or less
            if (etaSeconds <= 120 && etaSeconds > 0) {
              preAnnouncedPoiIdsRef.current.add(poi.id);

              const alertObj: TriggeredAlert = {
                poi,
                triggeredAtTimestamp: Date.now(),
                distMeters: alongDist,
              };

              setTriggeredAlerts((prev) => [alertObj, ...prev]);

              // Voice pre-announcement
              if (settings.voice.enabled) {
                const minutesAway = Math.max(1, Math.round(etaSeconds / 60));
                const kmAway = (alongDist / 1000).toFixed(1);
                speakText(
                  `Heads up. In about ${minutesAway} minute${minutesAway > 1 ? 's' : ''}, ${kmAway} kilometers ahead: ${poi.title}. ${poi.summary}`,
                  settings.voice.speed
                );
              }
            }
          }
        }

        // Also track nearest upcoming for HUD even if already pre-announced
        if (!seenPoiIdsRef.current.has(poi.id) && currentSpeedKmh > 5) {
          const alongDist = getDistanceAlongPolylineToPoi(currentPolyIdx, poi);
          if (alongDist !== null && alongDist > 0) {
            const speedMs = (currentSpeedKmh * 1000) / 3600;
            const etaSeconds = alongDist / speedMs;
            if (!nearestUpcoming || etaSeconds < nearestUpcoming.etaSeconds) {
              nearestUpcoming = { poi, etaSeconds, distMeters: alongDist };
            }
          }
        }
      });

      setUpcomingPoi(nearestUpcoming);
    },
    [activeRoute, settings, trackingMode, getDistanceAlongPolylineToPoi]
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
        const effectiveSpeed = Math.min(130, Math.max(30, calcSpeedKmh * simSpeed));
        setCarSpeedKmh(effectiveSpeed);

        const newHeading = getHeadingAngle(currentPos, nextPos);
        setCarHeading(newHeading);
        setCarPosition(nextPos);

        // Geofence + lookahead check with speed and index
        checkGeofence(nextPos, effectiveSpeed, nextIdx);

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
          let speedKmh = 60; // default estimate
          if (location.speed !== null && location.speed !== undefined) {
            speedKmh = Math.round(location.speed * 3.6);
            setCarSpeedKmh(speedKmh);
          }

          // For GPS mode, find closest polyline index for lookahead calculations
          let closestIdx = 0;
          let closestDist = Infinity;
          if (activeRoute.polyline) {
            for (let i = 0; i < activeRoute.polyline.length; i++) {
              const d = getHaversineDistanceMeters(activeRoute.polyline[i], newPos);
              if (d < closestDist) {
                closestDist = d;
                closestIdx = i;
              }
            }
          }

          checkGeofence(newPos, speedKmh, closestIdx);
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
    preAnnouncedPoiIdsRef.current.clear();
    setUpcomingPoi(null);
  };

  const handleSeek = (percent: number) => {
    if (!activeRoute.polyline || activeRoute.polyline.length === 0) return;
    const total = activeRoute.polyline.length;
    const targetIdx = Math.min(total - 1, Math.floor((percent / 100) * total));
    setSimIndex(targetIdx);
    const newPos = activeRoute.polyline[targetIdx];
    setCarPosition(newPos);
    checkGeofence(newPos, carSpeedKmh, targetIdx);
  };

  const progressPercent =
    activeRoute.polyline && activeRoute.polyline.length > 1
      ? (simIndex / (activeRoute.polyline.length - 1)) * 100
      : 0;

  if (isCheckingAuth) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-950 text-slate-100 font-sans">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin mb-4" />
        <div className="text-sm font-semibold tracking-wider uppercase text-slate-400 animate-pulse">
          Authenticating Security Gateway...
        </div>
      </div>
    );
  }

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
        onOpenItinerary={() => setIsItineraryOpen(true)}
        onLogout={handleLogout}
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
            upcomingPoi={upcomingPoi}
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
      <LoginModal
        isOpen={!isAuthenticated}
        onLoginSuccess={handleLoginSuccess}
      />

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

      <RouteOverviewModal
        isOpen={isItineraryOpen}
        onClose={() => setIsItineraryOpen(false)}
        route={activeRoute}
      />
    </div>
  );
}
