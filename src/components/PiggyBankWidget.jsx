import React from 'react';
import { PiggyBank, Coins } from 'lucide-react';

export const PiggyBankWidget = ({ pendingAmount = 0, isClockedIn = false, hourlyRate = 15.00 }) => {
  const incomePerSecond = (hourlyRate / 3600).toFixed(4);

  return (
    <div className="relative my-4">
      <div className="glass-card relative border border-pink-500/30 rounded-3xl p-6 text-center shadow-xl overflow-hidden">
        {/* Piggy Bank Icon */}
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-lg relative">
            <PiggyBank className="w-9 h-9" />
            
            {/* Live Indicator Badge */}
            {isClockedIn && (
              <div className="absolute -top-1 -right-1 bg-amber-400 border-2 border-slate-900 rounded-full p-0.5 shadow">
                <Coins className="w-3 h-3 text-slate-950" />
              </div>
            )}
          </div>
        </div>

        {/* Piggy Bank Header Label */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-pink-300 uppercase tracking-wider">
          <span>Piggy Bank</span>
          {isClockedIn ? (
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          ) : (
            <span className="text-[10px] text-slate-500 font-normal">(Paused)</span>
          )}
        </div>

        {/* Income Per Second Label */}
        <div className="text-xs font-mono font-bold mt-0.5 mb-2">
          {isClockedIn ? (
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              +${incomePerSecond}/sec
            </span>
          ) : (
            <span className="text-slate-500 bg-slate-800/40 px-2 py-0.5 rounded-full border border-slate-800">
              $0.0000/sec
            </span>
          )}
        </div>

        {/* Live Running Counter */}
        <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
          ${pendingAmount.toFixed(2)}
        </div>

        <p className="text-[11px] text-slate-400 mt-1">Accumulating money ready to be collected</p>
      </div>
    </div>
  );
};
