import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db, isDemoConfig } from './config';

const LOCAL_STORAGE_PREFIX = 'tracker_db_';

// Helper for local storage demo database
const getLocalData = (key, defaultVal) => {
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const setLocalData = (key, val) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
};

// 1. User Profile & Hourly Rate
export const getUserProfile = async (uid) => {
  if (isDemoConfig) {
    return getLocalData(`profile_${uid}`, {
      hourlyRate: 15.00,
      displayName: 'Demo User',
      email: 'demo@example.com'
    });
  }

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
  if (isDemoConfig) {
    const profile = getLocalData(`profile_${uid}`, { hourlyRate: 15.00 });
    profile.hourlyRate = rate;
    setLocalData(`profile_${uid}`, profile);
    return profile;
  }

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
  if (isDemoConfig) {
    return getLocalData(`stats_${uid}_${dateKey}`, {
      totalSecondsWorked: 0,
      totalEarnings: 0,
      collectedEarnings: 0,
      pendingPiggyBank: 0,
      activeClockInAt: null,
      currentSessionId: null
    });
  }

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
  if (isDemoConfig) {
    setLocalData(`stats_${uid}_${dateKey}`, statsData);
    return;
  }

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

  if (isDemoConfig) {
    const sessionId = 'session_' + clockInAt;
    const session = {
      id: sessionId,
      clockInAt,
      clockOutAt: null,
      durationSeconds: 0,
      earnings: 0,
      rateAtTimeOfSession: hourlyRate
    };
    
    // Save session
    const sessions = getLocalData(`sessions_${uid}`, []);
    sessions.push(session);
    setLocalData(`sessions_${uid}`, sessions);

    // Update stats
    const stats = await getDailyStats(uid, dateKey);
    stats.activeClockInAt = clockInAt;
    stats.currentSessionId = sessionId;
    await saveDailyStats(uid, dateKey, stats);

    return { sessionId, clockInAt };
  }

  // Firestore Session Document
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
    currentSessionId: newSessionRef.id,
    lastUpdatedAt: serverTimestamp()
  }, { merge: true });

  return { sessionId: newSessionRef.id, clockInAt };
};

export const stopSession = async (uid, activeSessionId, clockInAt, hourlyRate, pendingPiggy) => {
  const clockOutAt = Date.now();
  const durationSeconds = Math.max(0, Math.floor((clockOutAt - clockInAt) / 1000));
  const sessionEarnings = parseFloat(((durationSeconds / 3600) * hourlyRate).toFixed(4));
  const dateKey = getTodayKey();

  if (isDemoConfig) {
    // Update local session
    const sessions = getLocalData(`sessions_${uid}`, []);
    const sessionIdx = sessions.findIndex(s => s.id === activeSessionId || s.clockInAt === clockInAt);
    if (sessionIdx !== -1) {
      sessions[sessionIdx].clockOutAt = clockOutAt;
      sessions[sessionIdx].durationSeconds = durationSeconds;
      sessions[sessionIdx].earnings = sessionEarnings;
      setLocalData(`sessions_${uid}`, sessions);
    }

    // Update local stats (accumulate pending piggy bank from session)
    const stats = await getDailyStats(uid, dateKey);
    stats.totalSecondsWorked = (stats.totalSecondsWorked || 0) + durationSeconds;
    stats.pendingPiggyBank = parseFloat(((stats.pendingPiggyBank || 0) + sessionEarnings).toFixed(2));
    stats.activeClockInAt = null;
    stats.currentSessionId = null;
    await saveDailyStats(uid, dateKey, stats);

    return { durationSeconds, sessionEarnings, updatedPendingPiggy: stats.pendingPiggyBank };
  }

  // Firestore update
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
  const newPendingPiggy = parseFloat(((stats.pendingPiggyBank || 0) + sessionEarnings).toFixed(2));

  const statsRef = doc(db, `users/${uid}/dailyStats`, dateKey);
  await setDoc(statsRef, {
    totalSecondsWorked: newTotalSeconds,
    pendingPiggyBank: newPendingPiggy,
    activeClockInAt: null,
    currentSessionId: null,
    lastUpdatedAt: serverTimestamp()
  }, { merge: true });

  return { durationSeconds, sessionEarnings, updatedPendingPiggy: newPendingPiggy };
};

export const collectPiggyBank = async (uid, amountToCollect) => {
  const dateKey = getTodayKey();
  const stats = await getDailyStats(uid, dateKey);

  const newCollected = parseFloat(((stats.collectedEarnings || 0) + amountToCollect).toFixed(2));
  const newPending = 0;
  const newTotalEarnings = parseFloat(((stats.totalEarnings || 0) + amountToCollect).toFixed(2));

  stats.collectedEarnings = newCollected;
  stats.pendingPiggyBank = newPending;
  stats.totalEarnings = newTotalEarnings;

  await saveDailyStats(uid, dateKey, stats);
  return { newCollected, newPending, newTotalEarnings };
};

// 4. Fetch All Daily Stats for Statistics Screen
export const getAllDailyStats = async (uid) => {
  if (isDemoConfig) {
    const results = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(LOCAL_STORAGE_PREFIX + `stats_${uid}_`)) {
        const dateKey = key.replace(LOCAL_STORAGE_PREFIX + `stats_${uid}_`, '');
        const val = JSON.parse(localStorage.getItem(key));
        results.push({ dateKey, ...val });
      }
    }
    return results.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }

  const statsCol = collection(db, `users/${uid}/dailyStats`);
  const snap = await getDocs(statsCol);
  const results = [];
  snap.forEach(docSnap => {
    results.push({ dateKey: docSnap.id, ...docSnap.data() });
  });
  return results.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
};

// 5. Default Fallback Questions & Lucky Block Firestore query
export const DEFAULT_QUESTIONS = [
  { id: 'q1', text: "If you could master any skill instantly, what would it be and why?" },
  { id: 'q2', text: "What is one small decision you made that changed your life trajectory?" },
  { id: 'q3', text: "If your day was a chapter in a book, what title would you give it?" },
  { id: 'q4', text: "What is something you believed 5 years ago that you no longer believe today?" },
  { id: 'q5', text: "If you had an extra hour in every day that could only be spent on creative projects, what would you make?" },
  { id: 'q6', text: "What is the best piece of advice you've ever received from a coworker or mentor?" },
  { id: 'q7', text: "If money wasn't a factor, what project would you start working on tomorrow?" },
  { id: 'q8', text: "What song or playlist gives you an instant boost of energy?" },
  { id: 'q9', text: "What is a simple pleasure that never fails to brighten your mood?" },
  { id: 'q10', text: "If you could travel anywhere right after your shift ends, where would you go?" },
  { id: 'q11', text: "What is one habit you'd like to cultivate in the next 30 days?" },
  { id: 'q12', text: "What would your ideal workstation setup look like?" },
  { id: 'q13', text: "If you could teach a 10-minute masterclass on any subject, what topic would you pick?" },
  { id: 'q14', text: "What is a funny or weird talent you possess?" },
  { id: 'q15', text: "What problem in your daily life could be solved with a simple invention?" }
];

export const getRandomLuckyQuestion = async () => {
  if (isDemoConfig) {
    const randomIndex = Math.floor(Math.random() * DEFAULT_QUESTIONS.length);
    return DEFAULT_QUESTIONS[randomIndex];
  }

  try {
    const qCol = collection(db, 'luckyQuestions');
    const snap = await getDocs(qCol);
    if (!snap.empty) {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const randomIndex = Math.floor(Math.random() * docs.length);
      return docs[randomIndex];
    }
  } catch (err) {
    console.warn('Could not fetch luckyQuestions from Firestore, using default set:', err);
  }

  const randomIndex = Math.floor(Math.random() * DEFAULT_QUESTIONS.length);
  return DEFAULT_QUESTIONS[randomIndex];
};
