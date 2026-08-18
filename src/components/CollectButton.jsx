import React from 'react';
import { Coins } from 'lucide-react';

export const CollectButton = ({ onCollect, disabled = false, pendingAmount = 0 }) => {
  const isAvailable = pendingAmount > 0 && !disabled;

  const handleClick = () => {
    if (!isAvailable) return;
    onCollect();
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isAvailable}
      className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg transition-all relative overflow-hidden active:scale-98 ${
        isAvailable
          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
          : 'bg-slate-800/60 border border-slate-700/50 text-slate-500 cursor-not-allowed'
      }`}
    >
      <Coins className={`w-5 h-5 ${isAvailable ? 'text-slate-950' : 'text-slate-500'}`} />
      <span>{isAvailable ? `Collect $${pendingAmount.toFixed(2)}` : 'Nothing to Collect Yet'}</span>
    </button>
  );
};
