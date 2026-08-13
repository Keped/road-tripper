import React, { useState } from 'react';
import { X, Link2, Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { importRouteFromUrl } from '../services/apiClient';
import { RouteData } from '../types';

interface RouteImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRouteImported: (route: RouteData) => void;
}

export const RouteImportModal: React.FC<RouteImportModalProps> = ({
  isOpen,
  onClose,
  onRouteImported,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const importedRoute = await importRouteFromUrl(urlInput.trim(), nameInput.trim() || undefined);
      setStatus('success');
      setTimeout(() => {
        onRouteImported(importedRoute);
        onClose();
        // Reset modal state
        setUrlInput('');
        setNameInput('');
        setStatus('idle');
      }, 1000);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to import route. Check URL and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2 text-cyan-400">
            <Link2 className="w-5 h-5" />
            <h2 className="text-lg font-bold text-slate-100">Import Google Maps Route</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Google Maps Share Link or Directions URL
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://www.google.com/maps/dir/?api=1&origin=... or maps.app.goo.gl/..."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors min-h-[48px]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Route Name (Optional)
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Summer California Road Trip"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors min-h-[48px]"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              How to get a Google Maps link:
            </div>
            <p>1. Open Google Maps & plan your directions.</p>
            <p>2. Tap <strong>Share → Copy Link</strong>.</p>
            <p>3. Paste the URL above. It will be fetched and stored permanently in your route library.</p>
          </div>

          {/* Status Alerts */}
          {status === 'error' && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Route imported & saved successfully!
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 text-xs font-bold rounded-xl text-slate-300 hover:bg-slate-800 transition-colors min-h-[48px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === 'loading' || !urlInput.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 min-h-[48px]"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing Route...</span>
                </>
              ) : (
                <span>Import & Save Route</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
