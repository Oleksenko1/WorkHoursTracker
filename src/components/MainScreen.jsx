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
import { PiggyBank, Clock, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export const MainScreen = () => {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  // Daily & Session State
  const [dailyStats, setDailyStats] = useState({
    totalSecondsWorked: 0,
    collectedEarnings: 0,
    pendingPiggyBank: 0,
    activeClockInAt: null,
    lastCollectedAt: null,
    currentSessionId: null
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Coin Animation State
  const [flyingCoins, setFlyingCoins] = useState([]);
  const [earnedBounce, setEarnedBounce] = useState(false);

  // Target Refs for Animation
  const earnedCardRef = useRef(null);
  const piggyRef = useRef(null);

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

  // Tab switch & browser focus sync listener
  useEffect(() => {
    const handleSync = async () => {
      if (!user) return;
      setActionLoading('sync');
      try {
        await loadStats();
      } catch (err) {
        console.error('Error syncing server stats:', err);
      } finally {
        setActionLoading(null);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleSync();
      }
    };

    const onFocus = () => {
      handleSync();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
  }, [user]);

  // Live ticker effect while clocked in
  useEffect(() => {
    if (isClockedIn && dailyStats.activeClockInAt) {
      const updateTick = () => {
        const now = Date.now();
        const elapsedSec = Math.max(0, Math.floor((now - dailyStats.activeClockInAt) / 1000));
        setSessionSeconds(elapsedSec);
        
        // Calculate live piggy bank earnings from last collection timestamp
        const startForPiggy = dailyStats.lastCollectedAt || dailyStats.activeClockInAt;
        const piggySec = Math.max(0, Math.floor((now - startForPiggy) / 1000));
        const liveEarned = (piggySec / 3600) * hourlyRate;
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
  }, [isClockedIn, dailyStats.activeClockInAt, dailyStats.lastCollectedAt, hourlyRate]);

  // Trigger Juicy & Dynamic Flying Coins Animation (Scales count & duration by hours worked/saved)
  const triggerCoinAnimation = (amountCollected = 0) => {
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight * 0.6;
    let endX = window.innerWidth / 2;
    let endY = window.innerHeight * 0.25;

    if (piggyRef.current) {
      const rect = piggyRef.current.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    }

    if (earnedCardRef.current) {
      const rect = earnedCardRef.current.getBoundingClientRect();
      endX = rect.left + rect.width / 2;
      endY = rect.top + rect.height / 2;
    }

    // Dynamic coin count based on saved money / worked hours (Min 10, Max 45 coins)
    const hoursSaved = amountCollected > 0 ? amountCollected / hourlyRate : 0.5;
    const coinCount = Math.min(45, Math.max(10, Math.floor(hoursSaved * 12) + 8));

    // Generate flying coins with randomized arc offsets, rotation & staggered timing
    const newCoins = Array.from({ length: coinCount }).map((_, idx) => {
      const spreadX = (Math.random() - 0.5) * 140;
      const burstY = -(35 + Math.random() * 65);
      const rotateDeg = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720);
      return {
        id: Date.now() + idx + Math.random(),
        delay: idx * 0.045,
        duration: 0.85 + Math.random() * 0.35,
        startX: startX + (Math.random() - 0.5) * 20,
        startY: startY,
        midX: startX + spreadX * 1.5,
        midY: startY + burstY,
        endX: endX + (Math.random() - 0.5) * 20,
        endY: endY,
        rotateDeg: rotateDeg
      };
    });

    setFlyingCoins(newCoins);

    // Initial coin pickup confetti burst at Piggy Bank location
    confetti({
      particleCount: Math.min(50, coinCount * 1.5),
      spread: 60,
      origin: { x: startX / window.innerWidth, y: startY / window.innerHeight },
      colors: ['#fbbf24', '#f59e0b', '#d97706', '#22c55e', '#16a34a'],
      shapes: ['circle', 'square'],
      scalar: 1.1
    });

    // Multi-stage pulse bounce & landing confetti burst on Earned Today display as coins cascade in
    const totalAnimTimeMs = Math.floor((coinCount * 0.045 + 1.1) * 1000);

    setTimeout(() => {
      setEarnedBounce(true);
      confetti({
        particleCount: Math.min(45, coinCount * 1.2),
        spread: 70,
        origin: { x: endX / window.innerWidth, y: endY / window.innerHeight },
        colors: ['#fbbf24', '#f59e0b', '#34d399', '#10b981'],
        shapes: ['circle'],
        scalar: 1.0
      });
      setTimeout(() => setEarnedBounce(false), 250);
    }, 600);

    setTimeout(() => {
      setEarnedBounce(true);
      setTimeout(() => setEarnedBounce(false), 300);
    }, Math.floor(totalAnimTimeMs * 0.6));

    // Clean up coins after full animation sequence completes
    setTimeout(() => {
      setFlyingCoins([]);
    }, totalAnimTimeMs);
  };

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
    if (!user || actionLoading) return;

    if (!isClockedIn) {
      setActionLoading('clock');
      try {
        const { sessionId, clockInAt } = await startSession(user.uid, hourlyRate);
        setDailyStats(prev => ({
          ...prev,
          activeClockInAt: clockInAt,
          lastCollectedAt: clockInAt,
          currentSessionId: sessionId
        }));
      } catch (err) {
        console.error('Error clocking in:', err);
      } finally {
        setActionLoading(null);
      }
    } else {
      setActionLoading('clock');
      try {
        const uncollectedSessionEarnings = sessionPendingPiggy;
        const { updatedPendingPiggy } = await stopSession(
          user.uid,
          dailyStats.currentSessionId,
          dailyStats.activeClockInAt,
          hourlyRate,
          uncollectedSessionEarnings
        );

        setDailyStats(prev => ({
          ...prev,
          totalSecondsWorked: prev.totalSecondsWorked + sessionSeconds,
          pendingPiggyBank: updatedPendingPiggy,
          activeClockInAt: null,
          lastCollectedAt: null,
          currentSessionId: null
        }));
        setSessionSeconds(0);
        setSessionPendingPiggy(0);
      } catch (err) {
        console.error('Error clocking out:', err);
      } finally {
        setActionLoading(null);
      }
    }
  };

  // Collect Piggy Bank Money
  const handleCollect = async () => {
    if (!user || totalPendingPiggy <= 0 || actionLoading) return;

    const amountToCollect = totalPendingPiggy;
    setActionLoading('collect');

    try {
      const { newCollected, newPending, lastCollectedAt } = await collectPiggyBank(user.uid, amountToCollect, isClockedIn);
      setDailyStats(prev => ({
        ...prev,
        collectedEarnings: newCollected,
        pendingPiggyBank: newPending,
        ...(isClockedIn && lastCollectedAt ? { lastCollectedAt } : {})
      }));
      setSessionPendingPiggy(0);

      // Trigger juicy flying coins animation (scaled to amount collected) after sync completes
      triggerCoinAnimation(amountToCollect);
    } catch (err) {
      console.error('Error collecting piggy bank:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getActionText = () => {
    if (actionLoading === 'clock') {
      return isClockedIn ? 'Clocking out...' : 'Clocking in...';
    }
    if (actionLoading === 'collect') {
      return 'Collecting earnings...';
    }
    if (actionLoading === 'sync') {
      return 'Syncing with server...';
    }
    return actionLoading || 'Loading...';
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
      {/* Dynamic Flying Coins Overlay */}
      <AnimatePresence>
        {flyingCoins.map(coin => (
          <motion.div
            key={coin.id}
            initial={{
              x: coin.startX,
              y: coin.startY,
              scale: 0.5,
              rotate: 0,
              opacity: 1
            }}
            animate={{
              x: [coin.startX, coin.midX, coin.endX],
              y: [coin.startY, coin.midY, coin.endY],
              scale: [0.5, 1.35, 1.0, 0.25],
              rotate: [0, coin.rotateDeg, coin.rotateDeg * 1.5],
              opacity: [1, 1, 0.1, 0]
            }}
            transition={{
              duration: coin.duration,
              delay: coin.delay,
              times: [0, 0.67, 0.96, 1],
              ease: [0.15, 0.85, 0.35, 1]
            }}
            className="fixed top-0 left-0 z-50 pointer-events-none w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 border border-amber-200 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg"
          >
            $
          </motion.div>
        ))}
      </AnimatePresence>

      {/* App Mobile Container */}
      <div className={`w-full max-w-md mx-auto flex-1 flex flex-col p-4 sm:p-6 pb-24 relative z-10 transition-opacity ${actionLoading ? 'pointer-events-none opacity-80 select-none' : ''}`}>
        
        {/* Top Header Bar */}
        <header className="flex items-center justify-between py-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-md">
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

        {/* Tab Router Content */}
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
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2">
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
              <div ref={earnedCardRef} className="glass-card rounded-3xl p-6 text-center border border-emerald-500/30 shadow-2xl relative overflow-hidden">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Earned Today</span>
                </div>
                
                <motion.div
                  animate={earnedBounce ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tight my-1"
                >
                  ${dailyStats.collectedEarnings.toFixed(2)}
                </motion.div>

                {/* Worked Time Today */}
                <div className="inline-flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-full border border-slate-800 text-xs font-mono text-slate-300 mt-2 shadow-inner">
                  <Clock className={`w-3.5 h-3.5 ${isClockedIn ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>Time Today: <strong className="text-white font-bold">{formatTime(totalWorkedSeconds)}</strong></span>
                </div>
              </div>

              {/* Piggy Bank Running Counter */}
              <div ref={piggyRef}>
                <PiggyBankWidget
                  pendingAmount={totalPendingPiggy}
                  isClockedIn={isClockedIn}
                  hourlyRate={hourlyRate}
                />
              </div>

              {/* Collect Button */}
              <CollectButton
                onCollect={handleCollect}
                disabled={Boolean(actionLoading)}
                loading={actionLoading === 'collect'}
                pendingAmount={totalPendingPiggy}
              />

              {/* Main Thumb Clock In/Out Button */}
              <div>
                <ClockButton
                  isClockedIn={isClockedIn}
                  onToggle={handleToggleClock}
                  disabled={Boolean(actionLoading)}
                  loading={actionLoading === 'clock'}
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
      <div className={actionLoading ? 'pointer-events-none opacity-80 select-none' : ''}>
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};
