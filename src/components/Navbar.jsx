import React from 'react';
import { Home, BarChart2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { logOut, user } = useAuth();

  return (
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
          onClick={logOut}
          title={`Sign out (${user?.email || 'User'})`}
          className="py-2.5 px-4 rounded-2xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex flex-col items-center gap-1"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[11px]">Exit</span>
        </button>
      </div>
    </div>
  );
};
