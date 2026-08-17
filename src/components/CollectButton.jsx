import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Coins } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CollectButton = ({ onCollect, disabled = false, pendingAmount = 0 }) => {
  const [animating, setAnimating] = useState(false);

  const handleClick = (e) => {
    if (disabled || pendingAmount <= 0) return;
    setAnimating(true);

    // Trigger coin confetti burst
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 45,
      spread: 70,
      origin: { x, y },
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#22c55e', '#16a34a'],
      shapes: ['circle', 'square'],
      scalar: 1.2
    });

    onCollect();

    setTimeout(() => {
      setAnimating(false);
    }, 600);
  };

  const isAvailable = pendingAmount > 0;

  return (
    <motion.button
      whileTap={isAvailable ? { scale: 0.94 } : {}}
      onClick={handleClick}
      disabled={disabled || !isAvailable}
      className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl transition-all relative overflow-hidden ${
        isAvailable
          ? 'bg-gradient-to-r from-amber-500 via-gold-500 to-amber-600 hover:from-amber-400 hover:to-gold-400 text-slate-950 glow-gold cursor-pointer'
          : 'bg-slate-800/60 border border-slate-700/50 text-slate-500 cursor-not-allowed'
      }`}
    >
      {/* Shine animation overlay */}
      {isAvailable && (
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 bottom-0 left-0 w-12 bg-white/30 skew-x-12 pointer-events-none"
        />
      )}

      <Coins className={`w-5 h-5 ${isAvailable ? 'text-slate-950 animate-bounce' : 'text-slate-500'}`} />
      <span>{animating ? 'Collecting Coins... 🎉' : isAvailable ? `Collect $${pendingAmount.toFixed(2)}` : 'Nothing to Collect Yet'}</span>
      {isAvailable && <Sparkles className="w-5 h-5 text-slate-950" />}
    </motion.button>
  );
};
