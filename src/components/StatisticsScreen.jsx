import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllDailyStats, getTodayKey } from '../firebase/dbService';
import { ManageDayModal } from './ManageDayModal';
import { Calendar as CalendarIcon, TrendingUp, Clock, DollarSign, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export const StatisticsScreen = () => {
  const { user, userProfile } = useAuth();
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateKey, setSelectedDateKey] = useState(getTodayKey());
  const [avgPeriod, setAvgPeriod] = useState('7');
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const hourlyRate = userProfile?.hourlyRate || 15.00;

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getAllDailyStats(user.uid);
      setStatsData(data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  // Create a map for quick lookup by dateKey
  const statsMap = statsData.reduce((acc, item) => {
    acc[item.dateKey] = item;
    return acc;
  }, {});

  // Selected Day Details
  const selectedDayStats = statsMap[selectedDateKey] || {
    totalSecondsWorked: 0,
    collectedEarnings: 0,
    totalEarnings: 0
  };

  // Compute Weekly Breakdown (Current Week Mon-Sun)
  const getWeekDays = () => {
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const distanceToMon = (currentDayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMon);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = getTodayKey(d);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      const stats = statsMap[key] || {};
      const earnings = (stats.collectedEarnings || 0) + (stats.pendingPiggyBank || 0);
      weekDays.push({
        dateKey: key,
        dayLabel,
        earnings,
        isToday: key === getTodayKey()
      });
    }
    return weekDays;
  };

  const weekDays = getWeekDays();
  const totalWeeklyEarnings = weekDays.reduce((sum, d) => sum + d.earnings, 0);
  const maxWeeklyEarnings = Math.max(...weekDays.map(d => d.earnings), 1);

  // Compute Averages
  const getAverageMetrics = () => {
    let daysToInclude = statsData;
    const now = new Date();

    if (avgPeriod === '7') {
      const cutOff = new Date();
      cutOff.setDate(now.getDate() - 7);
      const cutOffKey = getTodayKey(cutOff);
      daysToInclude = statsData.filter(d => d.dateKey >= cutOffKey);
    } else if (avgPeriod === '30') {
      const cutOff = new Date();
      cutOff.setDate(now.getDate() - 30);
      const cutOffKey = getTodayKey(cutOff);
      daysToInclude = statsData.filter(d => d.dateKey >= cutOffKey);
    }

    const totalDays = Math.max(daysToInclude.length, 1);
    const sumEarnings = daysToInclude.reduce((acc, d) => acc + (d.collectedEarnings || 0) + (d.pendingPiggyBank || 0), 0);
    const sumSeconds = daysToInclude.reduce((acc, d) => acc + (d.totalSecondsWorked || 0), 0);

    const avgDailyEarnings = sumEarnings / totalDays;
    const avgDailyHours = (sumSeconds / 3600) / totalDays;

    return { avgDailyEarnings, avgDailyHours, totalDays };
  };

  const { avgDailyEarnings, avgDailyHours } = getAverageMetrics();

  // Calendar Helper Functions
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));

  const formatHours = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-6 pb-24 max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white">Earnings & Stats</h2>
          <p className="text-xs text-slate-400">Track your work trends and history</p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <BarChart3 className="w-5 h-5" />
        </div>
      </div>

      {/* 1. Weekly Earnings Chart */}
      <div className="glass-card rounded-3xl p-5 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">This Week</span>
            <div className="text-2xl font-extrabold text-white font-mono">${totalWeeklyEarnings.toFixed(2)}</div>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Weekly</span>
          </div>
        </div>

        {/* Bar Chart 7 Days */}
        <div className="h-32 flex items-end justify-between gap-2 pt-4 px-1">
          {weekDays.map((day) => {
            const heightPercent = Math.max((day.earnings / maxWeeklyEarnings) * 100, 8);
            const isSelected = day.dateKey === selectedDateKey;

            return (
              <div
                key={day.dateKey}
                onClick={() => setSelectedDateKey(day.dateKey)}
                className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  ${day.earnings.toFixed(0)}
                </div>
                <div className="w-full bg-slate-800/80 rounded-t-xl h-24 flex items-end overflow-hidden">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ duration: 0.4 }}
                    className={`w-full rounded-t-xl transition-colors ${
                      isSelected
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-lg glow-green'
                        : day.earnings > 0
                        ? 'bg-gradient-to-t from-teal-600/80 to-emerald-500/80'
                        : 'bg-slate-700/40'
                    }`}
                  />
                </div>
                <span className={`text-xs font-bold ${day.isToday ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {day.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Average Daily Metrics */}
      <div className="glass-card rounded-3xl p-5 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Averages</span>
          
          {/* Period Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
            {['7', '30', 'all'].map((p) => (
              <button
                key={p}
                onClick={() => setAvgPeriod(p)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  avgPeriod === p
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'all' ? 'All' : `${p}d`}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Avg Daily Pay</span>
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              ${avgDailyEarnings.toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-pink-400" />
              <span>Avg Daily Time</span>
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              {avgDailyHours.toFixed(1)}h
            </div>
          </div>
        </div>
      </div>

      {/* 3. Calendar View */}
      <div className="glass-card rounded-3xl p-5 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-extrabold text-white">{monthName}</h3>
          </div>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day Header Names */}
        <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-500 uppercase mb-2">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Empty padding slots */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9"></div>
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateObj = new Date(year, month, dayNum);
            const dateKey = getTodayKey(dateObj);
            const dayStats = statsMap[dateKey];
            const hasWorked = dayStats && (dayStats.totalSecondsWorked > 0 || dayStats.collectedEarnings > 0);
            const isSelected = dateKey === selectedDateKey;

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDateKey(dateKey)}
                className={`h-9 rounded-xl text-xs font-semibold relative flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md glow-green ring-2 ring-emerald-300'
                    : hasWorked
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                <span>{dayNum}</span>
                {hasWorked && !isSelected && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Details Panel & Edit Controls */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <span>Date: <strong>{selectedDateKey}</strong></span>
            </div>
            <div className="text-sm font-extrabold text-white font-mono">
              ${((selectedDayStats.collectedEarnings || 0) + (selectedDayStats.pendingPiggyBank || 0)).toFixed(2)}
              <span className="text-xs text-emerald-400 font-normal ml-2">
                ({formatHours(selectedDayStats.totalSecondsWorked || 0)})
              </span>
            </div>
          </div>

          {/* Manage Selected Day Modal */}
          <ManageDayModal
            uid={user?.uid}
            dateKey={selectedDateKey}
            currentStats={selectedDayStats}
            onUpdate={fetchStats}
            hourlyRate={hourlyRate}
          />
        </div>
      </div>
    </div>
  );
};
