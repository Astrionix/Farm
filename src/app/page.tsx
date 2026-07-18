'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import LoginPage from '../components/LoginPage';
import OwnerDashboard from '../components/OwnerDashboard';
import UnitDashboard from '../components/UnitDashboard';
import DailyEntry from '../components/DailyEntry';
import AIChatPanel from '../components/AIChatPanel';
import ReportsPanel from '../components/ReportsPanel';
import { SkeletonDashboard } from '../components/SkeletonLoader';
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

  // Initialize DB & Local state on first mount
  useEffect(() => {
    dbService.init();
    setUserRole(dbService.getUserRole());
    setAssignedUnit(dbService.getAssignedUnit());
    
    // Check if user session is active from localStorage
    const authActive = localStorage.getItem('smp_auth_active') === 'true';
    setIsAuthenticated(authActive);

    // Sync tab when mounting/role updates
    const initialRole = dbService.getUserRole();
    if (initialRole === 'Supervisor') {
      setCurrentTab('unit-dashboard');
    } else {
      setCurrentTab('dashboard');
    }
    setDbReady(true);
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

  const handleNavigateToUnit = (unitId: number) => {
    if (userRole === 'Supervisor' && assignedUnit !== unitId) return; // Prevent supervisor routing leak
    handleUnitSelect(unitId);
    setCurrentTab('unit-dashboard');
  };

  const handleLoginSuccess = (role: 'Owner' | 'Supervisor', unit: number) => {
    localStorage.setItem('smp_auth_active', 'true');
    dbService.setUserRole(role);
    dbService.setAssignedUnit(unit);
    
    setUserRole(role);
    setAssignedUnit(unit);
    setIsAuthenticated(true);
    
    if (role === 'Supervisor') {
      setCurrentTab('unit-dashboard');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('smp_auth_active');
    setIsAuthenticated(false);
  };

  if (!dbReady) {
    return (
      <div className="flex w-full min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="w-60 bg-primary shrink-0" />
        <SkeletonDashboard />
      </div>
    );
  }

  // Render Login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex w-full min-h-screen bg-neutral-bg text-slate-800 dark:bg-slate-900 dark:text-slate-200 font-sans transition-colors duration-200">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
        setUserRole={handleRoleToggle}
        assignedUnit={assignedUnit}
        setAssignedUnit={handleUnitSelect}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
      />
      
      {/* Main content: on mobile add top padding for header + bottom padding for bottom nav */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-900 pt-[88px] pb-[68px] md:pt-0 md:pb-0">
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
      </main>
    </div>
  );
}

