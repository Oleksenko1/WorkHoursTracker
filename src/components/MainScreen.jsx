import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getDailyStats,
  startSession,
  stopSession,
  collectPiggyBank,
  getTodayKey
} from '../firebase/dbService';
import { HourlyRateModal } from './HourlyRateModal';
import { PiggyBankWidget } from './PiggyBankWidget';
import { CollectButton } from './CollectButton';
import { ClockButton } from './ClockButton';
import { LuckyBlockModal } from './LuckyBlockModal';
import { ManageDayModal } from './ManageDayModal';
import { StatisticsScreen } from './StatisticsScreen';
import { Navbar } from './Navbar';
import { PiggyBank, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MainScreen = () => {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  // Daily & Session State
  const [dailyStats, setDailyStats] = useState({
    totalSecondsWorked: 0,
    collectedEarnings: 0,
    pendingPiggyBank: 0,
    activeClockInAt: null,
    currentSessionId: null
  });
  const [loading, setLoading] = useState(true);

  // Live Timer Counters
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [sessionPendingPiggy, setSessionPendingPiggy] = useState(0);
  const timerRef = useRef(null);

  const hourlyRate = userProfile?.hourlyRate || 15.00;
  const isClockedIn = Boolean(dailyStats.activeClockInAt);
  const todayKey = getTodayKey();

  // Fetch stats on load or update
  const loadStats = async () => {
    if (!user) return;
    try {
      const stats = await getDailyStats(user.uid, todayKey);
      setDailyStats(stats);
    } catch (err) {
      console.error('Error loading daily stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user]);

  // Live ticker effect while clocked in
  useEffect(() => {
    if (isClockedIn && dailyStats.activeClockInAt) {
      const updateTick = () => {
        const now = Date.now();
        const elapsedSec = Math.max(0, Math.floor((now - dailyStats.activeClockInAt) / 1000));
        setSessionSeconds(elapsedSec);
        
        // Calculate live piggy bank earnings for this active session
        const liveEarned = (elapsedSec / 3600) * hourlyRate;
        setSessionPendingPiggy(liveEarned);
      };

      updateTick();
      timerRef.current = setInterval(updateTick, 1000);
    } else {
      setSessionSeconds(0);
      setSessionPendingPiggy(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isClockedIn, dailyStats.activeClockInAt, hourlyRate]);

  // Total Piggy Bank pending = base saved pending + current session live uncollected
  const totalPendingPiggy = (dailyStats.pendingPiggyBank || 0) + sessionPendingPiggy;

  // Total Worked Time Today = saved total seconds + active session seconds
  const totalWorkedSeconds = (dailyStats.totalSecondsWorked || 0) + sessionSeconds;

  // Format HH:MM:SS
  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Clock In / Clock Out Handler
  const handleToggleClock = async () => {
    if (!user) return;

    if (!isClockedIn) {
      // Clock In
      const { sessionId, clockInAt } = await startSession(user.uid, hourlyRate);
      setDailyStats(prev => ({
        ...prev,
        activeClockInAt: clockInAt,
        currentSessionId: sessionId
      }));
    } else {
      // Clock Out
      const { updatedPendingPiggy } = await stopSession(
        user.uid,
        dailyStats.currentSessionId,
        dailyStats.activeClockInAt,
        hourlyRate,
        dailyStats.pendingPiggyBank
      );

      setDailyStats(prev => ({
        ...prev,
        totalSecondsWorked: prev.totalSecondsWorked + sessionSeconds,
        pendingPiggyBank: updatedPendingPiggy,
        activeClockInAt: null,
        currentSessionId: null
      }));
      setSessionSeconds(0);
      setSessionPendingPiggy(0);
    }
  };

  // Collect Piggy Bank Money
  const handleCollect = async () => {
    if (!user || totalPendingPiggy <= 0) return;

    const amountToCollect = totalPendingPiggy;

    if (isClockedIn) {
      const now = Date.now();
      setDailyStats(prev => ({
        ...prev,
        activeClockInAt: now,
        collectedEarnings: prev.collectedEarnings + amountToCollect,
        pendingPiggyBank: 0
      }));
      setSessionPendingPiggy(0);
    } else {
      const { newCollected } = await collectPiggyBank(user.uid, amountToCollect);
      setDailyStats(prev => ({
        ...prev,
        collectedEarnings: newCollected,
        pendingPiggyBank: 0
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-3"></div>
        <p className="text-sm font-semibold text-slate-400">Loading your data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-pink-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[450px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* App Mobile Container - pb-24 for clean mobile spacing */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col p-4 sm:p-6 pb-24 relative z-10">
        
        {/* Top Header Bar */}
        <header className="flex items-center justify-between py-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-md glow-green">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white leading-tight">JobTracker</h1>
              <div className="text-[10px] text-emerald-400 font-semibold tracking-wide uppercase">Work & Earn</div>
            </div>
          </div>

          {/* Question? Modal Trigger */}
          <LuckyBlockModal />
        </header>

        {/* Tab Router Content - Silky smooth lightweight opacity transition */}
        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.main
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col space-y-4"
            >
              {/* Hourly Rate & Manage Data Bar */}
              <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-2xl px-3.5 py-2">
                <HourlyRateModal />
                <ManageDayModal
                  uid={user?.uid}
                  dateKey={todayKey}
                  currentStats={dailyStats}
                  onUpdate={loadStats}
                  hourlyRate={hourlyRate}
                />
              </div>

              {/* Big Earnings Display Card */}
              <div className="glass-card rounded-3xl p-6 text-center border border-emerald-500/30 shadow-2xl relative overflow-hidden">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Earned Today</span>
                </div>
                
                <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-emerald-300 font-mono tracking-tight my-1">
                  ${dailyStats.collectedEarnings.toFixed(2)}
                </div>

                {/* Worked Time Today */}
                <div className="inline-flex items-center gap-2 bg-slate-950/80 px-3.5 py-1.5 rounded-full border border-slate-800 text-xs font-mono text-slate-300 mt-2 shadow-inner">
                  <Clock className={`w-3.5 h-3.5 ${isClockedIn ? 'text-emerald-400 animate-spin-slow' : 'text-slate-500'}`} />
                  <span>Time Today: <strong className="text-white font-bold">{formatTime(totalWorkedSeconds)}</strong></span>
                </div>
              </div>

              {/* Piggy Bank Running Counter */}
              <PiggyBankWidget
                pendingAmount={totalPendingPiggy}
                isClockedIn={isClockedIn}
                hourlyRate={hourlyRate}
              />

              {/* Collect Button */}
              <CollectButton
                onCollect={handleCollect}
                pendingAmount={totalPendingPiggy}
              />

              {/* Main Thumb Clock In/Out Button */}
              <div>
                <ClockButton
                  isClockedIn={isClockedIn}
                  onToggle={handleToggleClock}
                />
              </div>
            </motion.main>
          ) : (
            <motion.main
              key="stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              <StatisticsScreen />
            </motion.main>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Mobile Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};
