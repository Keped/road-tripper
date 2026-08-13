import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, User, AlertCircle, Loader2 } from 'lucide-react';
import { login } from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLoginSuccess }) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      await login(usernameInput.trim(), passwordInput.trim(), rememberMe);
      setStatus('idle');
      onLoginSuccess();
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Invalid username or password');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-xl shadow-cyan-500/20">
            <Lock className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">RoadPulse Gateway</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter your security credentials to access contextual route intelligence & co-pilot tracking.
          </p>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors min-h-[48px]"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors min-h-[48px]"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-800 text-cyan-500 focus:ring-0 bg-slate-950 cursor-pointer w-4 h-4"
              />
              <span>Remember this session</span>
            </label>
            <div className="flex items-center gap-1 text-slate-500 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>AES-256 Auth</span>
            </div>
          </div>

          {/* Error Alert */}
          {status === 'error' && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={status === 'loading' || !usernameInput.trim() || !passwordInput.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 min-h-[50px] mt-2 active:scale-[0.98]"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Security Token...</span>
              </>
            ) : (
              <span>Unlock Co-Pilot Access</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
