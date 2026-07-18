'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Grid3X3, 
  ClipboardPen, 
  Package, 
  MessageSquareText, 
  FilePieChart, 
  UserSquare2, 
  UserCheck, 
  ChevronRight,
  SunMoon,
  Home,
  LogOut,
  Menu,
  X,
  Settings
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: 'Owner' | 'Supervisor';
  setUserRole: (role: 'Owner' | 'Supervisor') => void;
  assignedUnit: number;
  setAssignedUnit: (unit: number) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onLogout: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole,
  assignedUnit,
  setAssignedUnit,
  darkMode,
  setDarkMode,
  onLogout
}: SidebarProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', shortName: 'Home', icon: LayoutDashboard, roles: ['Owner'] },
    { id: 'unit-dashboard', name: 'Unit & Sheds', shortName: 'Units', icon: Grid3X3, roles: ['Owner', 'Supervisor'] },
    { id: 'daily-entry', name: 'Daily Entry Portal', shortName: 'Entry', icon: ClipboardPen, roles: ['Owner', 'Supervisor'] },
    { id: 'inventory', name: 'Inventory Ledger', shortName: 'Stock', icon: Package, roles: ['Owner'] },
    { id: 'ai-chat', name: 'AI Insights & Chat', shortName: 'AI', icon: MessageSquareText, roles: ['Owner'] },
    { id: 'reports', name: 'Reports Generator', shortName: 'Reports', icon: FilePieChart, roles: ['Owner', 'Supervisor'] },
  ];

  const visibleTabs = tabs.filter(tab => tab.roles.includes(userRole));
  // Bottom nav: max 5 tabs + settings icon
  const bottomNavTabs = visibleTabs.slice(0, 5);

  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileDrawerOpen(false);
  };

  // ─── Logo Block ─────────────────────────────────────────────────
  const LogoBlock = () => (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-md shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 to-white opacity-80" />
        <svg viewBox="0 0 100 100" className="w-full h-full z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="45" r="22" fill="#F9A825" className="opacity-80" />
          <path d="M75 35 C60 45 40 40 40 60 C55 60 70 50 75 35 Z" fill="#1B5E20" className="opacity-90" />
          <path d="M48 70 C48 75 58 75 58 70 C58 65 48 65 48 70 Z" fill="#F9A825" />
          <path d="M28 72 C32 60 42 50 48 52 C52 53 52 48 50 45 C48 42 45 44 43 40 C41 36 43 32 46 30 C49 32 50 35 48 38 C54 36 60 44 65 52 C70 58 72 65 72 72 Z" fill="#1B5E20" />
        </svg>
      </div>
      <div>
        <h1 className="font-extrabold text-xs md:text-sm tracking-wide leading-tight text-white uppercase">
          Sri Mahalakshmi
        </h1>
        <p className="text-[9px] md:text-[10px] text-secondary font-semibold uppercase tracking-widest">
          Poultry AI ERP
        </p>
      </div>
    </div>
  );

  // ─── Role Control Block ──────────────────────────────────────────
  const RoleControlBlock = () => (
    <div className="bg-primary-dark/40 rounded-xl p-3 border border-primary-light/5 text-xs space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-emerald-200/80 font-medium flex items-center gap-1.5">
          {userRole === 'Owner' ? <UserSquare2 className="w-3.5 h-3.5 text-secondary" /> : <UserCheck className="w-3.5 h-3.5 text-secondary" />}
          Active Role:
        </span>
        <button
          onClick={() => {
            const targetRole = userRole === 'Owner' ? 'Supervisor' : 'Owner';
            setUserRole(targetRole);
            if (targetRole === 'Supervisor') {
              setCurrentTab('unit-dashboard');
            } else {
              setCurrentTab('dashboard');
            }
          }}
          className="px-2 py-0.5 bg-secondary/20 hover:bg-secondary/35 text-secondary border border-secondary/30 rounded text-[10px] font-bold uppercase transition"
        >
          Toggle
        </button>
      </div>
      
      <div className="text-[11px] font-semibold text-white flex items-center gap-1">
        <span>Role:</span>
        <span className="text-secondary">{userRole}</span>
      </div>

      {userRole === 'Supervisor' ? (
        <div className="pt-2 border-t border-primary-light/5 space-y-1.5">
          <label className="text-[10px] text-emerald-200/60 block font-semibold uppercase tracking-wider">
            Assigned Unit Lock
          </label>
          <div className="grid grid-cols-4 gap-1">
            {[1, 2, 3, 4].map(uNum => (
              <button
                key={uNum}
                onClick={() => setAssignedUnit(uNum)}
                className={`py-1 rounded text-[10px] font-bold transition ${
                  assignedUnit === uNum 
                    ? 'bg-secondary text-primary-dark' 
                    : 'bg-primary/20 text-emerald-100 hover:bg-primary-light/20'
                }`}
              >
                U{uNum}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-yellow-300/80 italic leading-tight">
            *Supervisor access is strictly restricted to Unit {assignedUnit}.
          </p>
        </div>
      ) : (
        <div className="pt-1.5 border-t border-primary-light/5 text-[10px] text-emerald-200/50 flex items-center gap-1">
          <Home className="w-3 h-3 text-secondary" />
          <span>Full ERP access enabled.</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ═══════════════════════════════════════════
          DESKTOP SIDEBAR (hidden on mobile)
      ═══════════════════════════════════════════ */}
      <aside className="hidden md:flex w-64 min-h-screen bg-primary text-white flex-col justify-between border-r border-primary-dark/30 shadow-premium shrink-0">
        <div className="flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-primary-light/10">
            <LogoBlock />
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            {visibleTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive 
                      ? 'bg-secondary text-primary-dark shadow-md font-semibold' 
                      : 'text-emerald-100 hover:bg-primary-light/30 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} />
                    <span>{tab.name}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 opacity-50 transition-transform ${isActive ? 'rotate-90 text-primary-dark' : 'group-hover:translate-x-1'}`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Controls */}
        <div className="p-4 border-t border-primary-light/10 space-y-4">
          <RoleControlBlock />
          <div className="flex items-center justify-between text-xs text-emerald-200/50 px-1">
            <span>v1.2.0 (AI Enabled)</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 rounded-lg hover:bg-primary-light/30 text-emerald-200 hover:text-white transition"
                title="Toggle Dark Mode"
              >
                <SunMoon className="w-4 h-4" />
              </button>
              <button 
                onClick={onLogout}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-300 hover:text-red-100 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════
          MOBILE TOP HEADER BAR
      ═══════════════════════════════════════════ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-primary text-white flex items-center justify-between px-4 py-3 shadow-lg border-b border-primary-dark/30">
        <LogoBlock />
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="p-2 rounded-xl bg-primary-light/20 hover:bg-primary-light/40 transition active:scale-95"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════
          MOBILE SLIDE-OUT DRAWER
      ═══════════════════════════════════════════ */}
      {/* Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}
      {/* Drawer Panel */}
      <div className={`md:hidden fixed top-0 left-0 h-full w-72 bg-primary text-white z-50 flex flex-col justify-between shadow-2xl transition-transform duration-300 ${
        mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Drawer Header */}
        <div>
          <div className="p-5 border-b border-primary-light/10 flex items-center justify-between">
            <LogoBlock />
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="p-2 rounded-xl bg-primary-light/20 hover:bg-primary-light/40 transition"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            {visibleTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all group ${
                    isActive 
                      ? 'bg-secondary text-primary-dark shadow-md font-bold' 
                      : 'text-emerald-100 hover:bg-primary-light/30 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 opacity-50 rotate-90" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-primary-light/10 space-y-4">
          <RoleControlBlock />
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-emerald-200/50">v1.2.0 · AI Enabled</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-primary-light/20 hover:bg-primary-light/40 text-emerald-200 transition active:scale-95"
                title="Toggle Dark Mode"
              >
                <SunMoon className="w-4 h-4" />
              </button>
              <button 
                onClick={onLogout}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-300 transition active:scale-95"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION BAR
      ═══════════════════════════════════════════ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center safe-area-inset-bottom">
        {bottomNavTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-all active:scale-95 ${
                isActive
                  ? 'text-primary dark:text-secondary'
                  : 'text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-white'
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all ${
                isActive ? 'bg-primary/10 dark:bg-secondary/20' : ''
              }`}>
                <Icon className={`w-5 h-5 transition-all ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-secondary rounded-full" />
                )}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wide ${
                isActive ? 'text-primary dark:text-secondary' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {tab.shortName}
              </span>
            </button>
          );
        })}
        {/* Settings icon opens drawer */}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-slate-400 dark:text-slate-500 hover:text-primary transition active:scale-95"
        >
          <div className="p-1.5 rounded-xl">
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wide">More</span>
        </button>
      </div>
    </>
  );
}
