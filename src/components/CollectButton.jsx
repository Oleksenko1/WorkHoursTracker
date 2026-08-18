import React from 'react';
import { Coins, Loader2 } from 'lucide-react';

export const CollectButton = ({ onCollect, disabled = false, pendingAmount = 0, loading = false }) => {
  const isAvailable = pendingAmount > 0 && !disabled && !loading;

  const handleClick = () => {
    if (!isAvailable) return;
    onCollect();
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isAvailable || loading}
      className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg transition-all relative overflow-hidden active:scale-98 ${
        loading
          ? 'bg-slate-800 border border-slate-700 text-amber-400 cursor-not-allowed'
          : isAvailable
          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
          : 'bg-slate-800/60 border border-slate-700/50 text-slate-500 cursor-not-allowed'
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          <Coins className={`w-5 h-5 ${isAvailable ? 'text-slate-950' : 'text-slate-500'}`} />
          <span>{isAvailable ? `Collect $${pendingAmount.toFixed(2)}` : 'Nothing to Collect Yet'}</span>
        </>
      )}
    </button>
  );
};
