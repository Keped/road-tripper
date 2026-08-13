import React from 'react';
import { TriggeredAlert } from '../types';
import { Volume2, ExternalLink, MapPin, AlertTriangle, Calendar, BookOpen, Clock } from 'lucide-react';
import { speakText } from '../services/ttsService';
import { formatDistance } from '../utils/distance';

interface AlertCardProps {
  alert: TriggeredAlert;
  voiceSpeed?: 'slow' | 'normal' | 'fast';
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, voiceSpeed = 'normal' }) => {
  const { poi, triggeredAtTimestamp, distMeters } = alert;

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'historic':
        return {
          label: 'Historic Landmark',
          bg: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
          icon: <BookOpen className="w-4 h-4 text-amber-400" />,
        };
      case 'markets':
        return {
          label: 'Pop-Up Market & Event',
          bg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
          icon: <Calendar className="w-4 h-4 text-emerald-400" />,
        };
      case 'hazards':
        return {
          label: 'Live Hazard Warning',
          bg: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
        };
      case 'podcasts':
        return {
          label: 'Podcast & Audio Guide',
          bg: 'bg-purple-950/70 border-purple-500/40 text-purple-300',
          icon: <Volume2 className="w-4 h-4 text-purple-400" />,
        };
      case 'hiddenGems':
      default:
        return {
          label: 'Hidden Gem',
          bg: 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300',
          icon: <MapPin className="w-4 h-4 text-cyan-400" />,
        };
    }
  };

  const config = getCategoryConfig(poi.category);

  const timeStr = new Date(triggeredAtTimestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`p-4 rounded-xl border backdrop-blur-md transition-all duration-300 shadow-lg ${config.bg} hover:border-slate-400/50`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="text-xs font-semibold uppercase tracking-wider">{config.label}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3" /> {timeStr}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800/80 font-mono text-[10px] text-slate-300">
            {formatDistance(distMeters)} away
          </span>
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-50 leading-tight mb-1">{poi.title}</h3>

      <p className="text-sm text-slate-200 leading-snug mb-3">{poi.summary}</p>

      <p className="text-xs text-slate-400 leading-normal mb-3 line-clamp-2">{poi.detail}</p>

      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
        <button
          onClick={() => speakText(`${poi.title}. ${poi.summary}`, voiceSpeed)}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 transition-colors active:scale-95 min-h-[44px]"
          title="Play voice audio announcement"
        >
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <span>Read Aloud</span>
        </button>

        {poi.externalUrl && (
          <a
            href={poi.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 transition-colors active:scale-95 min-h-[44px]"
          >
            <span>Open Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
