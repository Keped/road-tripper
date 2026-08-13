import React from 'react';
import { RouteData, POI } from '../types';
import { X, MapPin, Volume2, ExternalLink, Star, ListOrdered, Clock } from 'lucide-react';
import { speakText } from '../services/ttsService';

interface RouteOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: RouteData;
  onSelectPoiOnMap?: (latLng: [number, number]) => void;
}

export const RouteOverviewModal: React.FC<RouteOverviewModalProps> = ({
  isOpen,
  onClose,
  route,
  onSelectPoiOnMap,
}) => {
  if (!isOpen) return null;

  const pois = route.pois || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 leading-tight">Route POI Itinerary</h2>
              <p className="text-xs text-slate-400">
                {route.name} • {pois.length} Discovered Intelligence Checkpoints ({route.distanceKm} km total)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Timeline List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {pois.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No POIs discovered for this route yet. Import or refresh a route to discover landmarks.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {pois.map((poi, idx) => (
                <div key={poi.id || idx} className="relative group">
                  {/* Timeline Marker Node */}
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center text-[10px] font-mono text-cyan-300 font-bold z-10 shadow-md shadow-cyan-500/20">
                    {idx + 1}
                  </div>

                  {/* Card Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/40 transition-all shadow-md">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg leading-none">{poi.icon || '📍'}</span>
                        <h3 className="text-base font-bold text-slate-100">{poi.name}</h3>
                        {poi.sourceProvider && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/50 text-[10px] font-mono text-slate-300">
                            {poi.sourceProvider}
                          </span>
                        )}
                      </div>
                      {poi.distanceFromStartKm !== undefined && (
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 font-mono text-xs font-bold text-cyan-300 shrink-0">
                          {poi.distanceFromStartKm} km mark
                        </span>
                      )}
                    </div>

                    {poi.rating && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-xs font-bold font-mono">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span>{poi.rating.toFixed(1)}</span>
                        </div>
                        {poi.reviewCount && (
                          <span className="text-xs text-slate-400">({poi.reviewCount} reviews)</span>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-slate-300 leading-relaxed mb-3">{poi.summary}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => speakText(`${poi.title}. ${poi.summary}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors min-h-[38px]"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Preview Voice</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {onSelectPoiOnMap && (
                          <button
                            onClick={() => {
                              onSelectPoiOnMap(poi.latLng);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors min-h-[38px]"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Show on Map</span>
                          </button>
                        )}

                        {poi.externalUrl && (
                          <a
                            href={poi.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors min-h-[38px] flex items-center justify-center"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
