
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { PromotionPage } from './components/PromotionPage';
import { Affiliate, AuthState } from './types';
import { db } from './services/dbService';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('boss_auth');
    return saved ? JSON.parse(saved) : { user: null, isAuthenticated: false };
  });

  useEffect(() => {
    localStorage.setItem('boss_auth', JSON.stringify(auth));
  }, [auth]);

  useEffect(() => {
    db.syncAuthLog();
    const interval = setInterval(() => {
      db.syncAuthLog();
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (user: Affiliate) => {
    setAuth({ user, isAuthenticated: true });
  };

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false });
    localStorage.removeItem('boss_auth');
  };

  return (
    <HashRouter>
      <Routes>
        {/* Static Routes First */}
        <Route path="/affiliate" element={<PromotionPage />} />
        
        <Route 
          path="/login" 
          element={
            auth.isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={handleLogin} />
          } 
        />

        <Route 
          path="/dashboard" 
          element={
            auth.isAuthenticated && auth.user ? (
              <Dashboard user={auth.user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        {/* Dynamic Partner Landing Pages - Checked after static routes */}
        <Route path="/inner-circle/:slug" element={<LandingPage />} />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/affiliate" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
