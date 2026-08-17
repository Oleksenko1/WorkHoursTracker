import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { MainScreen } from './components/MainScreen';

const MainContent = () => {
  const { user } = useAuth();
  return user ? <MainScreen /> : <AuthScreen />;
};

export function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

export default App;
