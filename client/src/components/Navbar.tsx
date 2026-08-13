import React from 'react';
import { RouteData, TrackingMode } from '../types';
import { Navigation, Plus, Library, Sliders, Radio, MapPin, LogOut, ListOrdered } from 'lucide-react';

interface NavbarProps {
  activeRoute: RouteData;
  trackingMode: TrackingMode;
  savedRoutesCount: number;
  onOpenImportModal: () => void;
  onOpenSavedPanel: () => void;
  onOpenSettings: () => void;
  onToggleGPS: () => void;
  onOpenItinerary: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRoute,
  trackingMode,
  savedRoutesCount,
  onOpenImportModal,
  onOpenSavedPanel,
  onOpenSettings,
  onToggleGPS,
  onOpenItinerary,
  onLogout,
}) => {
  const isRouteLoaded = activeRoute.id !== 'no-active-route';

  return (
    <header className="h-16 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between text-slate-100 shrink-0 z-30 shadow-lg select-none">
      {/* Brand & Active Route Badge */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
            <Navigation className="w-5 h-5 fill-slate-950" />
          </div>
          <span className="font-extrabold text-lg tracking-tight font-display hidden sm:inline">
            Road<span className="text-cyan-400">Pulse</span>
          </span>
        </div>

        {/* Active Route Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs max-w-[200px] sm:max-w-[280px]">
          <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="truncate">
            <span className="font-bold text-slate-200 block truncate">{activeRoute.name}</span>
            {isRouteLoaded && (
              <span className="text-[10px] text-slate-400 block truncate">
                {activeRoute.origin} → {activeRoute.destination}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions & Controls */}
      <div className="flex items-center gap-2">
        {/* Import Route button */}
        <button
          onClick={onOpenImportModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 active:scale-95 min-h-[44px]"
          title="Import Google Maps URL"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">Import Route</span>
        </button>

        {/* View Itinerary button */}
        {isRouteLoaded && (
          <button
            onClick={onOpenItinerary}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors active:scale-95 min-h-[44px]"
            title="View route POI itinerary"
          >
            <ListOrdered className="w-4 h-4 text-cyan-400" />
            <span className="hidden lg:inline">Itinerary</span>
          </button>
        )}

        {/* Saved Routes Library button */}
        <button
          onClick={onOpenSavedPanel}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors active:scale-95 min-h-[44px] relative"
          title="Saved Routes Library"
        >
          <Library className="w-4 h-4 text-cyan-400" />
          <span className="hidden lg:inline">Saved Library</span>
          {savedRoutesCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30 rounded-full">
              {savedRoutesCount}
            </span>
          )}
        </button>

        {/* Real GPS Toggle */}
        <button
          onClick={onToggleGPS}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 min-h-[44px] ${
            trackingMode === 'gps'
              ? 'bg-rose-500 text-slate-950 shadow-lg shadow-rose-500/20 animate-pulse'
              : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300'
          }`}
          title={trackingMode === 'gps' ? 'Stop Real GPS Mode' : 'Start Real GPS Mode'}
        >
          <Radio className={`w-4 h-4 ${trackingMode === 'gps' ? 'text-slate-950' : 'text-rose-400'}`} />
          <span>{trackingMode === 'gps' ? 'Live GPS Active' : 'Live GPS'}</span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Open Settings"
        >
          <Sliders className="w-4 h-4 text-slate-300" />
        </button>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/80 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Log out of session"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
