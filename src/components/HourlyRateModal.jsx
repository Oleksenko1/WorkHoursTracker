import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Edit2, DollarSign, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HourlyRateModal = () => {
  const { userProfile, setHourlyRate } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [rateInput, setRateInput] = useState(userProfile?.hourlyRate?.toFixed(2) || '15.00');
  const [saving, setSaving] = useState(false);

  const currentRate = userProfile?.hourlyRate || 15.00;

  const handleOpen = () => {
    setRateInput(currentRate.toFixed(2));
    setIsOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(rateInput);
    if (isNaN(parsed) || parsed <= 0) return;

    setSaving(true);
    try {
      await setHourlyRate(parsed);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Rate Pill Trigger */}
      <button
        onClick={handleOpen}
        className="glass-pill px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-slate-800/80 transition-all border border-slate-700/50 active:scale-95"
      >
        <span className="text-xs text-slate-400 font-medium">Rate:</span>
        <span className="text-sm font-bold text-emerald-400 font-mono">${currentRate.toFixed(2)}/hr</span>
        <Edit2 className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
      </button>

      {/* Edit Rate Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-lg font-bold text-white mb-1">Set Hourly Rate</h3>
              <p className="text-xs text-slate-400 mb-4">Enter your hourly pay rate in USD.</p>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="relative">
                  <DollarSign className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                  <input
                    type="number"
                    step="0.25"
                    min="0.01"
                    required
                    autoFocus
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
                    placeholder="15.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white text-lg font-mono font-bold focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
