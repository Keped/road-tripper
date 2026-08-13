import React from 'react';
import { Navigation2, Gauge, Compass, ShieldAlert } from 'lucide-react';
import { RouteData, TrackingMode } from '../types';

interface CockpitHUDProps {
  route: RouteData;
  speedKmh: number;
  trackingMode: TrackingMode;
  triggeredCount: number;
}

export const CockpitHUD: React.FC<CockpitHUDProps> = ({
  route,
  speedKmh,
  trackingMode,
  triggeredCount,
}) => {
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
    </div>
  );
};
