import React, { useState } from 'react';
import { Home, BarChart2, LogOut, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { logOut, user } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirmLogOut = async () => {
    setShowConfirm(false);
    await logOut();
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 max-w-md mx-auto pointer-events-none">
        <div className="glass-card bg-slate-900/90 border border-slate-800 rounded-3xl p-1.5 shadow-2xl flex items-center justify-around pointer-events-auto backdrop-blur-xl">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-2.5 px-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${
              activeTab === 'home'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px]">Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2.5 px-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-5 h-5" />
            <span className="text-[11px]">Statistics</span>
          </button>

          <button
            onClick={() => setShowConfirm(true)}
            title={`Sign out (${user?.email || 'User'})`}
            className="py-2.5 px-4 rounded-2xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex flex-col items-center gap-1"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[11px]">Exit</span>
          </button>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 15 }}
              className="w-full max-w-xs bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden"
            >
              <button
                onClick={() => setShowConfirm(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-white mb-1">Sign Out?</h3>
              <p className="text-xs text-slate-400 mb-5">Are you sure you want to exit your account?</p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmLogOut}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg glow-pink flex items-center justify-center gap-1 transition-all active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
