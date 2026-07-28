'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import LoginPage from '../components/LoginPage';
import OwnerDashboard from '../components/OwnerDashboard';
import UnitDashboard from '../components/UnitDashboard';
import DailyEntry from '../components/DailyEntry';
import AIChatPanel from '../components/AIChatPanel';
import ReportsPanel from '../components/ReportsPanel';
import HenLoadingScreen from '../components/HenLoadingScreen';
import { dbService } from '../services/db';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [userRole, setUserRole] = useState<'Owner' | 'Supervisor'>('Owner');
  const [assignedUnit, setAssignedUnit] = useState<number>(1);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('smp_dark_mode') === 'true';
    }
    return false;
  });

  // Seamless Loader State
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [showLoaderOverlay, setShowLoaderOverlay] = useState<boolean>(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger ultra-smooth glass dissolve loader dismissal (600ms fade out)
  const dismissLoader = useCallback(() => {
    setIsFadingOut(true);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = setTimeout(() => {
      setShowLoaderOverlay(false);
      setIsFadingOut(false);
    }, 600);
  }, []);

  // Callback when dashboard receives data and finishes rendering
  const handleDataLoaded = useCallback(() => {
    setDataLoaded(true);
  }, []);

  // Initialize App
  useEffect(() => {
    setLoadingProgress(0);
    setDataLoaded(false);
    setShowLoaderOverlay(true);
    setIsFadingOut(false);

    // Animate progress up to 90% while DB initializes
    progressRef.current = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + (Math.random() * 5 + 3);
      });
    }, 150);

    dbService.init();
    setUserRole(dbService.getUserRole());
    setAssignedUnit(dbService.getAssignedUnit());

    const initialRole = dbService.getUserRole();
    if (initialRole === 'Supervisor') {
      setCurrentTab('unit-dashboard');
    } else {
      setCurrentTab('dashboard');
    }

    // Safety timer for initial splash screen
    const fallbackTimer = setTimeout(() => {
      setDataLoaded(true);
    }, 2000);

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // When data is loaded, fast forward Hen animation to 100% and fade loader out
  useEffect(() => {
    if (dataLoaded) {
      if (progressRef.current) clearInterval(progressRef.current);

      const speedInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(speedInterval);
            dismissLoader();
            return 100;
          }
          return prev + 12;
        });
      }, 30);
      return () => clearInterval(speedInterval);
    }
  }, [dataLoaded, dismissLoader]);

  // Handle Login Event: Mount Dashboard immediately underneath, fetch all APIs, then fade loader
  const handleLoginSuccess = (role: 'Owner' | 'Supervisor', unit: number) => {
    localStorage.setItem('smp_auth_active', 'true');
    dbService.setUserRole(role);
    dbService.setAssignedUnit(unit);

    // 1. Show Hen Loader on top
    setIsFadingOut(false);
    setShowLoaderOverlay(true);
    setLoadingProgress(0);
    setDataLoaded(false);

    // 2. Mount Dashboard underneath immediately so it starts fetching API data
    setUserRole(role);
    setAssignedUnit(unit);
    setIsAuthenticated(true);

    if (role === 'Supervisor') {
      setCurrentTab('unit-dashboard');
      setTimeout(() => setDataLoaded(true), 350);
    } else {
      setCurrentTab('dashboard');
    }

    // Animate progress up to 90% while Dashboard fetches
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + (Math.random() * 8 + 4);
      });
    }, 120);
  };

  // Tab transitions
  const handleTabChange = (tab: string) => {
    if (tab === currentTab) return;
    
    setIsFadingOut(false);
    setShowLoaderOverlay(true);
    setLoadingProgress(30);
    setDataLoaded(false);

    setCurrentTab(tab);

    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 15;
      });
    }, 70);

    setTimeout(() => setDataLoaded(true), 300);
  };

  const handleNavigateToUnit = (unitId: number) => {
    if (userRole === 'Supervisor' && assignedUnit !== unitId) return;
    
    setIsFadingOut(false);
    setShowLoaderOverlay(true);
    setLoadingProgress(30);
    setDataLoaded(false);

    dbService.setAssignedUnit(unitId);
    setAssignedUnit(unitId);
    setCurrentTab('unit-dashboard');

    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 15;
      });
    }, 70);

    setTimeout(() => setDataLoaded(true), 300);
  };

  const handleLogout = () => {
    localStorage.removeItem('smp_auth_active');
    setIsAuthenticated(false);
  };

  // Toggle Dark Mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('smp_dark_mode', 'true');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('smp_dark_mode', 'false');
    }
  }, [darkMode]);

  return (
    <>
      {/* Hen Loader Overlay - Fixed on top (z-index: 9999) */}
      {showLoaderOverlay && (
        <HenLoadingScreen progress={loadingProgress} fadeOut={isFadingOut} />
      )}

      {/* Main Application Interface - MOUNTED UNDERNEATH AT ALL TIMES */}
      {!isAuthenticated ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="flex h-screen overflow-hidden bg-neutral-bg text-slate-800 dark:bg-slate-900 dark:text-slate-200 font-sans transition-colors duration-200">
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={handleTabChange}
            userRole={userRole}
            setUserRole={(r) => { dbService.setUserRole(r); setUserRole(r); }}
            assignedUnit={assignedUnit}
            setAssignedUnit={(u) => { dbService.setAssignedUnit(u); setAssignedUnit(u); }}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onLogout={handleLogout}
            mobileDrawerOpen={mobileDrawerOpen}
            setMobileDrawerOpen={setMobileDrawerOpen}
          />
          
          <div className="flex flex-col flex-1 min-w-0">
            <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-slate-50 dark:bg-slate-900 relative">
              <div key={currentTab} className="animate-fade-in flex-1 flex flex-col min-h-0">
                {currentTab === 'dashboard' && userRole === 'Owner' && (
                  <OwnerDashboard 
                    darkMode={darkMode} 
                    onNavigateToUnit={handleNavigateToUnit}
                    onDataLoaded={handleDataLoaded}
                  />
                )}
                
                {currentTab === 'unit-dashboard' && (
                  <UnitDashboard
                    userRole={userRole}
                    assignedUnit={assignedUnit}
                  />
                )}
                
                {currentTab === 'daily-entry' && (
                  <DailyEntry
                    userRole={userRole}
                    assignedUnit={assignedUnit}
                  />
                )}
                
                {currentTab === 'ai-chat' && userRole === 'Owner' && (
                  <AIChatPanel />
                )}
                
                {currentTab === 'reports' && (
                  <ReportsPanel
                    userRole={userRole}
                    assignedUnit={assignedUnit}
                  />
                )}
              </div>
            </main>
          </div>
        </div>
      )}
    </>
  );
}
