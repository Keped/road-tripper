import React from 'react';
import { TriggeredAlert, AppSettings } from '../types';
import { AlertCard } from './AlertCard';
import { Compass, Sparkles, Trash2 } from 'lucide-react';

interface PassedPlacesFeedProps {
  alerts: TriggeredAlert[];
  settings: AppSettings;
  onClearAlerts: () => void;
}

export const PassedPlacesFeed: React.FC<PassedPlacesFeedProps> = ({
  alerts,
  settings,
  onClearAlerts,
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-900/90 backdrop-blur-md border-l border-slate-800/80 text-slate-100 overflow-hidden">
      {/* Feed Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950/60 shrink-0">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h2 className="text-base font-bold tracking-wide">Live Route Intelligence</h2>
          {alerts.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {alerts.length}
            </span>
          )}
        </div>

        {alerts.length > 0 && (
          <button
            onClick={onClearAlerts}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Clear feed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-cyan-400 border border-slate-700/50">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">Listening for Nearby Intelligence</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                Start GPS tracking or driving simulation. As you pass historic sites, hazards, or pop-up events within {settings.triggerRadiusM}m, stories will appear here.
              </p>
            </div>
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertCard key={`${alert.poi.id}-${alert.triggeredAtTimestamp}`} alert={alert} voiceSpeed={settings.voice.speed} />
          ))
        )}
      </div>
    </div>
  );
};
