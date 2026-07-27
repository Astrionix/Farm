'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [userRole, setUserRole] = useState<'Owner' | 'Supervisor'>('Owner');
  const [assignedUnit, setAssignedUnit] = useState<number>(1);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('smp_dark_mode') === 'true';
    }
    return false;
  });
  const [dbReady, setDbReady] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize DB & Local state on first mount
  useEffect(() => {
    // Animate progress bar while DB inits
    setLoadingProgress(0);
    progressRef.current = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 88) { clearInterval(progressRef.current!); return prev; }
        return prev + (Math.random() * 6 + 3);
      });
    }, 220);

    dbService.init();
    setUserRole(dbService.getUserRole());
    setAssignedUnit(dbService.getAssignedUnit());
    
    // Always require fresh login on application startup
    localStorage.removeItem('smp_auth_active');
    setIsAuthenticated(false);

    // Sync tab when mounting/role updates
    const initialRole = dbService.getUserRole();
    if (initialRole === 'Supervisor') {
      setCurrentTab('unit-dashboard');
    } else {
      setCurrentTab('dashboard');
    }

    // Finish progress and reveal app
    setTimeout(() => {
      clearInterval(progressRef.current!);
      setLoadingProgress(100);
      setTimeout(() => setDbReady(true), 500);
    }, 2800);
  }, []);

  // Listen for storage updates
  useEffect(() => {
    const handleRoleChange = () => {
      setUserRole(dbService.getUserRole());
      setAssignedUnit(dbService.getAssignedUnit());
    };
    window.addEventListener('storage-role-change', handleRoleChange);
    return () => window.removeEventListener('storage-role-change', handleRoleChange);
  }, []);

  const handleRoleToggle = (role: 'Owner' | 'Supervisor') => {
    dbService.setUserRole(role);
    setUserRole(role);
  };

  const handleUnitSelect = (unitId: number) => {
    dbService.setAssignedUnit(unitId);
    setAssignedUnit(unitId);
  };

  // Toggle Dark Mode & persist preference
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

  const handleTabChange = (tab: string) => {
    if (tab === currentTab) return;
    
    // Trigger quick transition loading animation
    setDbReady(false);
    setLoadingProgress(0);
    
    let prog = 0;
    const quickInterval = setInterval(() => {
      prog += 20;
      setLoadingProgress(prog > 100 ? 100 : prog);
      if (prog >= 100) clearInterval(quickInterval);
    }, 60);

    setCurrentTab(tab);
    
    // Hide loading screen after 400ms
    setTimeout(() => {
      setDbReady(true);
    }, 400);
  };

  const handleNavigateToUnit = (unitId: number) => {
    if (userRole === 'Supervisor' && assignedUnit !== unitId) return; // Prevent supervisor routing leak
    
    // Trigger quick transition loading animation
    setDbReady(false);
    setLoadingProgress(0);
    
    let prog = 0;
    const quickInterval = setInterval(() => {
      prog += 20;
      setLoadingProgress(prog > 100 ? 100 : prog);
      if (prog >= 100) clearInterval(quickInterval);
    }, 60);

    handleUnitSelect(unitId);
    setCurrentTab('unit-dashboard');
    
    // Hide loading screen after 400ms
    setTimeout(() => {
      setDbReady(true);
    }, 400);
  };

  const handleLoginSuccess = (role: 'Owner' | 'Supervisor', unit: number) => {
    localStorage.setItem('smp_auth_active', 'true');
    dbService.setUserRole(role);
    dbService.setAssignedUnit(unit);
    
    // Trigger quick transition loading animation
    setDbReady(false);
    setLoadingProgress(0);
    
    let prog = 0;
    const quickInterval = setInterval(() => {
      prog += 20;
      setLoadingProgress(prog > 100 ? 100 : prog);
      if (prog >= 100) clearInterval(quickInterval);
    }, 60);

    setUserRole(role);
    setAssignedUnit(unit);
    setIsAuthenticated(true);
    
    if (role === 'Supervisor') {
      setCurrentTab('unit-dashboard');
    } else {
      setCurrentTab('dashboard');
    }
    
    // Hide loading screen after 400ms
    setTimeout(() => {
      setDbReady(true);
    }, 400);
  };

  const handleLogout = () => {
    localStorage.removeItem('smp_auth_active');
    setIsAuthenticated(false);
  };

  return (
    <>
      {/* Loading Overlay */}
      {!dbReady && (
        <div className="fixed inset-0 z-[9999]">
          <HenLoadingScreen progress={loadingProgress} />
        </div>
      )}

      {/* Render Login screen if not authenticated */}
      {!isAuthenticated ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="flex h-screen overflow-hidden bg-neutral-bg text-slate-800 dark:bg-slate-900 dark:text-slate-200 font-sans transition-colors duration-200">
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={handleTabChange}
            userRole={userRole}
            setUserRole={handleRoleToggle}
            assignedUnit={assignedUnit}
            setAssignedUnit={handleUnitSelect}
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

