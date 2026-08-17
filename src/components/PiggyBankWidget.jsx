import React from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, Coins } from 'lucide-react';

export const PiggyBankWidget = ({ pendingAmount = 0, isClockedIn = false }) => {
  return (
    <div className="relative group my-4">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-rose-500/20 rounded-3xl blur-xl transition-all group-hover:blur-2xl"></div>

      <div className="glass-card relative border border-pink-500/30 rounded-3xl p-6 text-center shadow-xl overflow-hidden">
        {/* Decorative sparkles */}
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-pink-500/10 rounded-full blur-lg"></div>

        {/* Piggy Bank Animated Icon */}
        <div className="flex justify-center mb-3">
          <motion.div
            animate={isClockedIn ? {
              scale: [1, 1.08, 1],
              rotate: [0, -3, 3, 0],
            } : { scale: 1 }}
            transition={{
              duration: 1.5,
              repeat: isClockedIn ? Infinity : 0,
              ease: "easeInOut"
            }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-lg glow-pink relative"
          >
            <PiggyBank className="w-11 h-11" />
            
            {/* Live Ticking Coin Dot Indicator */}
            {isClockedIn && (
              <motion.div 
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-1 -right-1 bg-amber-400 border-2 border-slate-900 rounded-full p-1 shadow-md"
              >
                <Coins className="w-3.5 h-3.5 text-slate-950" />
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Piggy Bank Label */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-pink-300 uppercase tracking-wider mb-1">
          <span>Piggy Bank</span>
          {isClockedIn ? (
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          ) : (
            <span className="text-[10px] text-slate-500 font-normal">(Paused)</span>
          )}
        </div>

        {/* Live Running Counter */}
        <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
          <motion.span
            key={pendingAmount.toFixed(2)}
            initial={isClockedIn ? { scale: 1.05 } : false}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className="inline-block"
          >
            ${pendingAmount.toFixed(2)}
          </motion.span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Accumulating money ready to be collected</p>
      </div>
    </div>
  );
};
