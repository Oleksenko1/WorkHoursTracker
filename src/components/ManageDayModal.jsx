import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Save, Clock, DollarSign, Plus, Minus, Settings2 } from 'lucide-react';
import { adjustDailyStats, clearDailyStats } from '../firebase/dbService';

export const ManageDayModal = ({ uid, dateKey, currentStats, onUpdate, hourlyRate = 15.00 }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Form State
  const initialSeconds = currentStats?.totalSecondsWorked || 0;
  const initialHours = Math.floor(initialSeconds / 3600);
  const initialMins = Math.floor((initialSeconds % 3600) / 60);
  const initialEarnings = (currentStats?.collectedEarnings || 0) + (currentStats?.pendingPiggyBank || 0);

  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMins);
  const [earnings, setEarnings] = useState(initialEarnings.toFixed(2));
  const [saving, setSaving] = useState(false);

  const handleOpen = () => {
    const secs = currentStats?.totalSecondsWorked || 0;
    setHours(Math.floor(secs / 3600));
    setMinutes(Math.floor((secs % 3600) / 60));
    const earn = (currentStats?.collectedEarnings || 0) + (currentStats?.pendingPiggyBank || 0);
    setEarnings(earn.toFixed(2));
    setIsOpen(true);
  };

  const handleQuickAdjustTime = (deltaMinutes) => {
    const currentTotalSecs = hours * 3600 + minutes * 60;
    const newTotalSecs = Math.max(0, currentTotalSecs + deltaMinutes * 60);
    const newH = Math.floor(newTotalSecs / 3600);
    const newM = Math.floor((newTotalSecs % 3600) / 60);
    setHours(newH);
    setMinutes(newM);
    // Auto recompute earnings based on hourly rate
    const recomputedEarnings = (newTotalSecs / 3600) * hourlyRate;
    setEarnings(recomputedEarnings.toFixed(2));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const totalSecs = hours * 3600 + minutes * 60;
      await adjustDailyStats(uid, dateKey, totalSecs, parseFloat(earnings) || 0);
      onUpdate();
      setIsOpen(false);
    } catch (err) {
      console.error('Error saving adjusted day stats:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm(`Clear all tracked work time and earnings for ${dateKey}?`)) return;
    setSaving(true);
    try {
      await clearDailyStats(uid, dateKey);
      onUpdate();
      setIsOpen(false);
    } catch (err) {
      console.error('Error clearing day stats:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="glass-pill px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-all border border-slate-700/60 active:scale-95"
        title="Adjust or clear day data"
      >
        <Settings2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Manage Data</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-lg font-bold text-white mb-1">Adjust Day Data</h3>
              <p className="text-xs text-slate-400 mb-4">Edit or clear records for {dateKey}</p>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Time Worked Inputs */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Time Worked
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="number"
                        min="0"
                        max="24"
                        value={hours}
                        onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-semibold">hrs</span>
                    </div>

                    <div className="relative">
                      <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={minutes}
                        onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-semibold">min</span>
                    </div>
                  </div>

                  {/* Quick Adjust Buttons */}
                  <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => handleQuickAdjustTime(-60)}
                      className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-semibold text-rose-400 flex items-center gap-0.5"
                    >
                      <Minus className="w-3 h-3" />1h
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjustTime(-30)}
                      className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-semibold text-rose-400 flex items-center gap-0.5"
                    >
                      <Minus className="w-3 h-3" />30m
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjustTime(30)}
                      className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-semibold text-emerald-400 flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />30m
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjustTime(60)}
                      className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] font-semibold text-emerald-400 flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />1h
                    </button>
                  </div>
                </div>

                {/* Earnings Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Total Earned ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={earnings}
                      onChange={(e) => setEarnings(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-base font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={saving}
                    className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                    title="Clear today's data"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear</span>
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg glow-green flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
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
