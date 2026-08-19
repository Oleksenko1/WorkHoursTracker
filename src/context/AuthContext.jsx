import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  subscribeToAuthChanges,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  logOut
} from '../firebase/authService';
import { getUserProfile, updateHourlyRate } from '../firebase/dbService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setUserProfile({ hourlyRate: 15.00 });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    }
  };

  const setHourlyRate = async (newRate) => {
    if (!user) return;
    await updateHourlyRate(user.uid, newRate);
    setUserProfile(prev => ({ ...prev, hourlyRate: parseFloat(newRate) }));
  };

  const handleEmailSignIn = async (email, password) => {
    const u = await signInWithEmail(email, password);
    setUser(u);
    const profile = await getUserProfile(u.uid);
    setUserProfile(profile);
    return u;
  };

  const handleEmailSignUp = async (email, password, displayName) => {
    const u = await signUpWithEmail(email, password, displayName);
    setUser(u);
    const profile = await getUserProfile(u.uid);
    setUserProfile(profile);
    return u;
  };

  const handleGoogleSignIn = async () => {
    const u = await signInWithGoogle();
    setUser(u);
    const profile = await getUserProfile(u.uid);
    setUserProfile(profile);
    return u;
  };

  const handleLogOut = async () => {
    await logOut();
    setUser(null);
    setUserProfile(null);
  };

  const value = {
    user,
    userProfile,
    loading,
    setHourlyRate,
    refreshProfile,
    signInWithEmail: handleEmailSignIn,
    signUpWithEmail: handleEmailSignUp,
    signInWithGoogle: handleGoogleSignIn,
    logOut: handleLogOut
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-slate-100">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse">
            <span className="text-3xl">🐖</span>
          </div>
          <div className="w-8 h-8 rounded-full border-3 border-emerald-500/20 border-t-emerald-500 animate-spin my-1"></div>
          <h2 className="text-base font-extrabold text-white tracking-tight">JobTracker</h2>
          <p className="text-xs text-slate-400 font-medium">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
