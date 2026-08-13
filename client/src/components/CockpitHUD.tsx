import React from 'react';
import { Navigation2, Gauge, Compass, ShieldAlert, Clock, MapPin } from 'lucide-react';
import { RouteData, TrackingMode, POI } from '../types';

interface CockpitHUDProps {
  route: RouteData;
  speedKmh: number;
  trackingMode: TrackingMode;
  triggeredCount: number;
  upcomingPoi?: { poi: POI; etaSeconds: number; distMeters: number } | null;
}

export const CockpitHUD: React.FC<CockpitHUDProps> = ({
  route,
  speedKmh,
  trackingMode,
  triggeredCount,
  upcomingPoi,
}) => {
  const formatEta = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const formatDist = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
      {/* Primary Speed & Route Card */}
      <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5 shadow-2xl flex items-center gap-4 text-slate-100 min-w-[240px]">
        {/* Speedometer */}
        <div className="flex flex-col items-center justify-center px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-2xl font-black font-display text-cyan-400 leading-none">
            {Math.round(speedKmh)}
          </span>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-0.5">
            KM/H
          </span>
        </div>

        {/* Route Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
            <Navigation2 className="w-3.5 h-3.5" />
            <span className="truncate max-w-[160px] sm:max-w-[220px]">{route.name}</span>
          </div>
          <span className="text-xs text-slate-400 mt-0.5">
            {route.origin} → {route.destination}
          </span>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[11px] font-bold text-slate-300 flex items-center gap-1.5 shadow-lg">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>{trackingMode === 'gps' ? 'Live GPS' : trackingMode === 'simulating' ? 'Simulating' : 'Idle'}</span>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[11px] font-bold text-slate-300 flex items-center gap-1.5 shadow-lg">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>{triggeredCount} Alerts Discovered</span>
        </div>
      </div>

      {/* Upcoming POI Lookahead Banner */}
      {upcomingPoi && (trackingMode === 'simulating' || trackingMode === 'gps') && (
        <div className="bg-gradient-to-r from-cyan-950/90 to-slate-950/90 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-3 shadow-2xl max-w-[340px] animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-base leading-none shrink-0">
              {upcomingPoi.poi.icon || '📍'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-cyan-300 truncate">{upcomingPoi.poi.name}</div>
              {upcomingPoi.poi.sourceProvider && (
                <span className="text-[9px] font-mono text-slate-400">{upcomingPoi.poi.sourceProvider}</span>
              )}
            </div>
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-cyan-400">
                <Clock className="w-3 h-3" />
                <span>{formatEta(upcomingPoi.etaSeconds)}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                <MapPin className="w-2.5 h-2.5" />
                <span>{formatDist(upcomingPoi.distMeters)}</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-300 leading-snug line-clamp-1 mt-1">
            {upcomingPoi.poi.summary}
          </div>
        </div>
      )}
    </div>
  );
};
