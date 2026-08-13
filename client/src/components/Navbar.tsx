import React from 'react';
import { RouteData, TrackingMode } from '../types';
import { Navigation, Plus, Library, Sliders, Navigation2, Play, Radio } from 'lucide-react';

interface NavbarProps {
  presetRoutes: RouteData[];
  activeRoute: RouteData;
  trackingMode: TrackingMode;
  onSelectPresetRoute: (route: RouteData) => void;
  onOpenImportModal: () => void;
  onOpenSavedPanel: () => void;
  onOpenSettings: () => void;
  onToggleGPS: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  presetRoutes,
  activeRoute,
  trackingMode,
  onSelectPresetRoute,
  onOpenImportModal,
  onOpenSavedPanel,
  onOpenSettings,
  onToggleGPS,
}) => {
  return (
    <header className="h-16 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between text-slate-100 shrink-0 z-30 shadow-lg">
      {/* Brand & Route Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
            <Navigation className="w-5 h-5 fill-slate-950" />
          </div>
          <span className="font-extrabold text-lg tracking-tight font-display hidden sm:inline">
            Road<span className="text-cyan-400">Pulse</span>
          </span>
        </div>

        {/* Route Dropdown */}
        <div className="relative">
          <select
            value={activeRoute.id}
            onChange={(e) => {
              const selected = presetRoutes.find((r) => r.id === e.target.value);
              if (selected) onSelectPresetRoute(selected);
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-100 focus:outline-none focus:border-cyan-500 appearance-none pr-8 cursor-pointer max-w-[180px] sm:max-w-[240px] truncate min-h-[44px]"
          >
            <optgroup label="Preset Routes">
              {presetRoutes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </optgroup>
            {!activeRoute.isPreset && (
              <optgroup label="Active Custom Route">
                <option value={activeRoute.id}>{activeRoute.name}</option>
              </optgroup>
            )}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
            ▼
          </div>
        </div>
      </div>

      {/* Actions & Controls */}
      <div className="flex items-center gap-2">
        {/* Import Route button */}
        <button
          onClick={onOpenImportModal}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors active:scale-95 min-h-[44px]"
          title="Import Google Maps URL"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span className="hidden md:inline">Import Link</span>
        </button>

        {/* Saved Routes Library button */}
        <button
          onClick={onOpenSavedPanel}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors active:scale-95 min-h-[44px]"
          title="Saved Routes Library"
        >
          <Library className="w-4 h-4 text-cyan-400" />
          <span className="hidden lg:inline">Saved Library</span>
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
      </div>
    </header>
  );
};
