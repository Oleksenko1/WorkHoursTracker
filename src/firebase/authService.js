import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider, isDemoConfig } from './config';

// Mock state for demo mode (stored in localStorage)
const DEMO_USER_KEY = 'tracker_demo_user';

export const signUpWithEmail = async (email, password, displayName = '') => {
  if (isDemoConfig) {
    const mockUser = {
      uid: 'demo-uid-' + Date.now(),
      email,
      displayName: displayName || email.split('@')[0],
      isDemo: true
    };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(mockUser));
    return mockUser;
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const signInWithEmail = async (email, password) => {
  if (isDemoConfig) {
    const existing = localStorage.getItem(DEMO_USER_KEY);
    let mockUser;
    if (existing) {
      mockUser = JSON.parse(existing);
    } else {
      mockUser = {
        uid: 'demo-uid-12345',
        email,
        displayName: email.split('@')[0],
        isDemo: true
      };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(mockUser));
    }
    return mockUser;
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const signInWithGoogle = async () => {
  if (isDemoConfig) {
    const mockUser = {
      uid: 'demo-google-user',
      email: 'demo.user@gmail.com',
      displayName: 'Demo User (Google)',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoUser',
      isDemo: true
    };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(mockUser));
    return mockUser;
  }
  const userCredential = await signInWithPopup(auth, googleProvider);
  return userCredential.user;
};

export const logOut = async () => {
  if (isDemoConfig) {
    localStorage.removeItem(DEMO_USER_KEY);
    return;
  }
  await signOut(auth);
};

export const subscribeToAuthChanges = (callback) => {
  if (isDemoConfig) {
    const checkLocal = () => {
      const stored = localStorage.getItem(DEMO_USER_KEY);
      callback(stored ? JSON.parse(stored) : null);
    };
    checkLocal();
    window.addEventListener('storage', checkLocal);
    return () => window.removeEventListener('storage', checkLocal);
  }

  return onAuthStateChanged(auth, callback);
};
