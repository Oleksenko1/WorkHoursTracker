import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

// 1. User Profile & Hourly Rate
export const getUserProfile = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data();
  } else {
    const defaultProfile = {
      hourlyRate: 15.00,
      createdAt: serverTimestamp()
    };
    await setDoc(userRef, defaultProfile, { merge: true });
    return defaultProfile;
  }
};

export const updateHourlyRate = async (uid, newRate) => {
  const rate = parseFloat(newRate) || 15.00;
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { hourlyRate: rate }, { merge: true });
};

// 2. Daily Stats Helper (YYYY-MM-DD)
export const getTodayKey = (dateObj = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDailyStats = async (uid, dateKey = getTodayKey()) => {
  const statsRef = doc(db, `users/${uid}/dailyStats`, dateKey);
  const snap = await getDoc(statsRef);
  if (snap.exists()) {
    return snap.data();
  } else {
    const initialStats = {
      totalSecondsWorked: 0,
      totalEarnings: 0,
      collectedEarnings: 0,
      pendingPiggyBank: 0,
      activeClockInAt: null,
      currentSessionId: null,
      lastUpdatedAt: serverTimestamp()
    };
    await setDoc(statsRef, initialStats);
    return initialStats;
  }
};

export const saveDailyStats = async (uid, dateKey, statsData) => {
  const statsRef = doc(db, `users/${uid}/dailyStats`, dateKey);
  await setDoc(statsRef, {
    ...statsData,
    lastUpdatedAt: serverTimestamp()
  }, { merge: true });
};

// 3. Clock In & Clock Out Sessions
export const startSession = async (uid, hourlyRate) => {
  const clockInAt = Date.now();
  const dateKey = getTodayKey();

  const sessionsCol = collection(db, `users/${uid}/sessions`);
  const newSessionRef = await addDoc(sessionsCol, {
    clockInAt,
    clockOutAt: null,
    durationSeconds: 0,
    earnings: 0,
    rateAtTimeOfSession: hourlyRate
  });

  const statsRef = doc(db, `users/${uid}/dailyStats`, dateKey);
  await setDoc(statsRef, {
    activeClockInAt: clockInAt,
    lastCollectedAt: clockInAt,
    currentSessionId: newSessionRef.id,
    lastUpdatedAt: serverTimestamp()
  }, { merge: true });

  return { sessionId: newSessionRef.id, clockInAt };
};

export const stopSession = async (uid, activeSessionId, clockInAt, hourlyRate, uncollectedSessionEarnings = 0) => {
  const clockOutAt = Date.now();
  const durationSeconds = Math.max(0, Math.floor((clockOutAt - clockInAt) / 1000));
  const sessionEarnings = parseFloat(((durationSeconds / 3600) * hourlyRate).toFixed(4));
  const dateKey = getTodayKey();

  if (activeSessionId) {
    const sessionRef = doc(db, `users/${uid}/sessions`, activeSessionId);
    await updateDoc(sessionRef, {
      clockOutAt,
      durationSeconds,
      earnings: sessionEarnings
    });
  }

  const stats = await getDailyStats(uid, dateKey);
  const newTotalSeconds = (stats.totalSecondsWorked || 0) + durationSeconds;
  const newPendingPiggy = parseFloat(((stats.pendingPiggyBank || 0) + uncollectedSessionEarnings).toFixed(2));

  const statsRef = doc(db, `users/${uid}/dailyStats`, dateKey);
  await setDoc(statsRef, {
    totalSecondsWorked: newTotalSeconds,
    pendingPiggyBank: newPendingPiggy,
    activeClockInAt: null,
    lastCollectedAt: null,
    currentSessionId: null,
    lastUpdatedAt: serverTimestamp()
  }, { merge: true });

  return { durationSeconds, sessionEarnings, updatedPendingPiggy: newPendingPiggy };
};

export const collectPiggyBank = async (uid, amountToCollect, isClockedIn = false) => {
  const dateKey = getTodayKey();
  const stats = await getDailyStats(uid, dateKey);

  const newCollected = parseFloat(((stats.collectedEarnings || 0) + amountToCollect).toFixed(2));
  const newPending = 0;
  const newTotalEarnings = parseFloat(((stats.totalEarnings || 0) + amountToCollect).toFixed(2));

  const updateData = {
    collectedEarnings: newCollected,
    pendingPiggyBank: newPending,
    totalEarnings: newTotalEarnings,
    lastUpdatedAt: serverTimestamp()
  };

  if (isClockedIn) {
    updateData.lastCollectedAt = Date.now();
  }

  const statsRef = doc(db, `users/${uid}/dailyStats`, dateKey);
  await setDoc(statsRef, updateData, { merge: true });

  return { newCollected, newPending, newTotalEarnings, lastCollectedAt: updateData.lastCollectedAt };
};

// Manual Adjust Data (Add/Remove Worked Time & Earnings)
export const adjustDailyStats = async (uid, dateKey, totalSeconds, collectedEarnings) => {
  const seconds = Math.max(0, parseInt(totalSeconds, 10) || 0);
  const earnings = Math.max(0, parseFloat(collectedEarnings) || 0);

  const statsRef = doc(db, `users/${uid}/dailyStats`, dateKey);
  await setDoc(statsRef, {
    totalSecondsWorked: seconds,
    collectedEarnings: earnings,
    totalEarnings: earnings,
    lastUpdatedAt: serverTimestamp()
  }, { merge: true });
};

// Clear All Data for a Specific Day
export const clearDailyStats = async (uid, dateKey) => {
  const statsRef = doc(db, `users/${uid}/dailyStats`, dateKey);
  await setDoc(statsRef, {
    totalSecondsWorked: 0,
    collectedEarnings: 0,
    pendingPiggyBank: 0,
    totalEarnings: 0,
    activeClockInAt: null,
    currentSessionId: null,
    lastUpdatedAt: serverTimestamp()
  }, { merge: true });
};

// 4. Fetch All Daily Stats for Statistics Screen
export const getAllDailyStats = async (uid) => {
  const statsCol = collection(db, `users/${uid}/dailyStats`);
  const snap = await getDocs(statsCol);
  const results = [];
  snap.forEach(docSnap => {
    results.push({ dateKey: docSnap.id, ...docSnap.data() });
  });
  return results.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
};

// 5. Fetch Random Question directly from Firestore `luckyQuestions` collection
export const DEFAULT_QUESTIONS = [
  { id: 'q1', text: "If you could master any skill instantly, what would it be and why?" },
  { id: 'q2', text: "What is one small decision you made that changed your life trajectory?" },
  { id: 'q3', text: "If your day was a chapter in a book, what title would you give it?" },
  { id: 'q4', text: "What is something you believed 5 years ago that you no longer believe today?" },
  { id: 'q5', text: "If you had an extra hour in every day, what would you create?" }
];

export const getRandomLuckyQuestion = async () => {
  try {
    const qCol = collection(db, 'luckyQuestions');
    const snap = await getDocs(qCol);
    if (!snap.empty) {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const randomIndex = Math.floor(Math.random() * docs.length);
      return docs[randomIndex];
    }
  } catch (err) {
    console.warn('Firestore luckyQuestions query warning:', err);
  }

  const randomIndex = Math.floor(Math.random() * DEFAULT_QUESTIONS.length);
  return DEFAULT_QUESTIONS[randomIndex];
};
