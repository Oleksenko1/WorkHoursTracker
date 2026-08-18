import React from 'react';
import { Play, Square, Loader2 } from 'lucide-react';

export const ClockButton = ({ isClockedIn, onToggle, disabled = false, loading = false }) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled || loading}
      className={`w-full py-5 px-6 rounded-3xl font-extrabold text-lg sm:text-xl flex items-center justify-center gap-3 shadow-xl transition-all relative overflow-hidden active:scale-95 ${
        disabled || loading
          ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
          : isClockedIn
          ? 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white border border-rose-400/30 cursor-pointer'
          : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 border border-emerald-400/40 cursor-pointer'
      }`}
    >
      {loading ? (
        <>
          <div className="w-9 h-9 rounded-full bg-slate-950/20 flex items-center justify-center shrink-0">
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
          </div>
          <div className="text-left">
            <div className="leading-tight text-white">Loading...</div>
            <div className="text-[11px] font-normal text-slate-400 opacity-90">Synchronizing with server</div>
          </div>
        </>
      ) : isClockedIn ? (
        <>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Square className="w-5 h-5 text-white fill-white" />
          </div>
          <div className="text-left">
            <div className="leading-tight">Clock Out</div>
            <div className="text-[11px] font-normal text-rose-100 opacity-90">End session & pause accumulation</div>
          </div>
        </>
      ) : (
        <>
          <div className="w-9 h-9 rounded-full bg-slate-950/20 flex items-center justify-center shrink-0">
            <Play className="w-5 h-5 text-slate-950 fill-slate-950 ml-0.5" />
          </div>
          <div className="text-left">
            <div className="leading-tight">Clock In</div>
            <div className="text-[11px] font-normal text-slate-900 opacity-90">Start work session & earn live</div>
          </div>
        </>
      )}
    </button>
  );
};
