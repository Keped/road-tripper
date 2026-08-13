import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Gauge } from 'lucide-react';
import { TrackingMode } from '../types';

interface RouteSimulatorProps {
  trackingMode: TrackingMode;
  isSimulating: boolean;
  progressPercent: number;
  simSpeed: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onChangeSpeed: (speed: number) => void;
  onSeek: (percent: number) => void;
}

export const RouteSimulator: React.FC<RouteSimulatorProps> = ({
  trackingMode,
  isSimulating,
  progressPercent,
  simSpeed,
  onTogglePlay,
  onReset,
  onChangeSpeed,
  onSeek,
}) => {
  const isGpsActive = trackingMode === 'gps';

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 text-slate-100 shadow-xl space-y-3">
      <div className="flex items-center justify-between gap-4">
        {/* Play/Pause & Reset Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            disabled={isGpsActive}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 min-h-[52px] ${
              isSimulating
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
            } ${isGpsActive ? 'opacity-40 cursor-not-allowed' : 'shadow-lg'}`}
          >
            {isSimulating ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            <span>{isSimulating ? 'Pause Drive' : 'Simulate Drive'}</span>
          </button>

          <button
            onClick={onReset}
            disabled={isGpsActive}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors active:scale-95 min-h-[52px] min-w-[52px] flex items-center justify-center disabled:opacity-40"
            title="Reset simulation to origin"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-400">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Speed</span>
          </div>
          {[1, 5, 20].map((speed) => (
            <button
              key={speed}
              onClick={() => onChangeSpeed(speed)}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all min-h-[44px] min-w-[44px] ${
                simSpeed === speed
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {speed}×
            </button>
          ))}
        </div>
      </div>

      {/* Progress Timeline Scrubber */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
          <span>Route Progress</span>
          <span className="font-mono text-cyan-400 font-bold">{Math.round(progressPercent)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progressPercent}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          disabled={isGpsActive}
          className="w-full h-3 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40 min-h-[24px]"
        />
      </div>
    </div>
  );
};
