import React, { useState } from 'react';
import { SavedRouteSummary, RouteData } from '../types';
import { fetchRouteById, deleteSavedRoute, updateRouteName } from '../services/apiClient';
import { Map, Trash2, Edit2, Check, X, Navigation2, Clock } from 'lucide-react';

interface SavedRoutesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  savedRoutes: SavedRouteSummary[];
  activeRouteId?: string;
  onSelectRoute: (route: RouteData) => void;
  onRefreshList: () => void;
}

export const SavedRoutesPanel: React.FC<SavedRoutesPanelProps> = ({
  isOpen,
  onClose,
  savedRoutes,
  activeRouteId,
  onSelectRoute,
  onRefreshList,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = async (id: string) => {
    setLoadingId(id);
    const fullRoute = await fetchRouteById(id);
    setLoadingId(null);
    if (fullRoute) {
      onSelectRoute(fullRoute);
      onClose();
    }
  };

  const handleStartRename = (route: SavedRouteSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(route.id);
    setEditingName(route.name);
  };

  const handleSaveRename = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingName.trim()) return;
    await updateRouteName(id, editingName.trim());
    setEditingId(null);
    onRefreshList();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this saved route?')) {
      await deleteSavedRoute(id);
      onRefreshList();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-r border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2 text-cyan-400">
            <Map className="w-5 h-5" />
            <h2 className="text-lg font-bold text-slate-100">Saved Route Library</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-slate-200">
          {(!savedRoutes || savedRoutes.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 space-y-2">
              <Navigation2 className="w-10 h-10 text-slate-600 mb-1" />
              <div className="font-semibold text-slate-300">No Saved Routes Yet</div>
              <p className="text-xs text-slate-500 max-w-[240px]">
                Import a custom Google Maps link to save routes permanently in your library.
              </p>
            </div>
          ) : (
            (Array.isArray(savedRoutes) ? savedRoutes : []).map((route) => {
              const isActive = activeRouteId === route.id;
              const isEditing = editingId === route.id;
              const isLoading = loadingId === route.id;

              return (
                <div
                  key={route.id}
                  onClick={() => handleSelect(route.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-100 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
                          autoFocus
                        />
                        <button
                          onClick={(e) => handleSaveRename(route.id, e)}
                          className="p-1.5 rounded bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-bold text-sm text-slate-100 leading-tight">{route.name}</h3>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      {!isEditing && (
                        <button
                          onClick={(e) => handleStartRename(route, e)}
                          className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                          title="Rename route"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(route.id, e)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        title="Delete route"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 mb-2">
                    {route.origin} → {route.destination}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                    <span className="font-mono">{route.distanceKm} km</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(route.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {isLoading && (
                    <div className="text-xs text-cyan-400 font-semibold mt-2 animate-pulse">
                      Loading polyline...
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
