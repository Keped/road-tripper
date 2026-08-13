import React from 'react';
import { X, Bell, Volume2, Navigation, Sun, Moon, Monitor, Sliders } from 'lucide-react';
import { AppSettings, POICategory } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const toggleCategory = (category: POICategory) => {
    onUpdateSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [category]: !prev.notifications[category],
      },
    }));
  };

  const categories: { key: POICategory; label: string; icon: string; desc: string }[] = [
    { key: 'historic', label: 'Historic Landmarks', icon: '🏰', desc: 'Battlefields, heritage sites & historical monuments' },
    { key: 'markets', label: 'Pop-Up Markets & Events', icon: '🎪', desc: 'Farmers markets, local fairs & pop-up events' },
    { key: 'hazards', label: 'Road Hazards', icon: '⚠️', desc: 'Known hazard zones, fog areas & traffic advisories' },
    { key: 'podcasts', label: 'Podcasts & Deep Reads', icon: '🎙️', desc: 'Curated audio stories and deep-dive links' },
    { key: 'hiddenGems', label: 'Hidden Gems', icon: '📍', desc: 'Scenic viewpoints, photo spots & local secrets' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sliders className="w-5 h-5" />
            <h2 className="text-lg font-bold text-slate-100">Co-Pilot Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-slate-200">
          {/* Notification Categories */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span>Location Intelligence Filters</span>
            </div>
            <div className="space-y-2">
              {categories.map((cat) => {
                const isEnabled = settings.notifications[cat.key];
                return (
                  <label
                    key={cat.key}
                    onClick={() => toggleCategory(cat.key)}
                    className={`flex items-start justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isEnabled
                        ? 'bg-slate-800/90 border-cyan-500/40 text-slate-100'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3 pr-2">
                      <span className="text-xl leading-none mt-0.5">{cat.icon}</span>
                      <div>
                        <div className="text-sm font-semibold">{cat.label}</div>
                        <div className="text-xs text-slate-400 leading-tight mt-0.5">{cat.desc}</div>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => {}} // handled by parent label onClick
                      className="mt-1 w-5 h-5 accent-cyan-500 rounded cursor-pointer min-h-[20px]"
                    />
                  </label>
                );
              })}
            </div>
          </section>

          {/* Voice Announcements */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Voice Announcement Co-Pilot</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-100">Spoken Voice Callouts</div>
                  <div className="text-xs text-slate-400">Read POI stories over car speakers</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.voice.enabled}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      voice: { ...prev.voice, enabled: e.target.checked },
                    }))
                  }
                  className="w-5 h-5 accent-cyan-500 rounded cursor-pointer min-h-[24px]"
                />
              </div>

              {settings.voice.enabled && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-300">Voice Speed</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['slow', 'normal', 'fast'] as const).map((spd) => (
                      <button
                        key={spd}
                        onClick={() =>
                          onUpdateSettings((prev) => ({
                            ...prev,
                            voice: { ...prev.voice, speed: spd },
                          }))
                        }
                        className={`py-2 text-xs font-bold rounded-lg capitalize transition-all min-h-[44px] ${
                          settings.voice.speed === spd
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {spd}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Trigger Distance Radius */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Navigation className="w-4 h-4 text-cyan-400" />
              <span>Alert Proximity Radius</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[250, 500, 1000, 2000].map((radius) => (
                <button
                  key={radius}
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      triggerRadiusM: radius,
                    }))
                  }
                  className={`py-2.5 px-2 text-xs font-bold rounded-xl transition-all min-h-[44px] ${
                    settings.triggerRadiusM === radius
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-950/60 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
