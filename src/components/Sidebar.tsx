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
  Settings,
  Database,
  AlertTriangle
} from 'lucide-react';
import { dbService } from '../services/db';

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
  const [unitsList, setUnitsList] = useState<{ id: number; name: string }[]>([]);

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncQueueCount, setSyncQueueCount] = useState<number>(0);

  React.useEffect(() => {
    async function loadUnits() {
      const u = await dbService.getUnits();
      setUnitsList(u);
    }
    loadUnits();

    // Check offline status & queue length
    setIsOnline(dbService.isOnline());
    setSyncQueueCount(dbService.getSyncQueueLength());

    const updateConnectionState = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        // Trigger auto background sync when returning online
        dbService.syncPendingEntries();
      }
    };

    const updateQueueCount = () => {
      setSyncQueueCount(dbService.getSyncQueueLength());
    };

    window.addEventListener('online', updateConnectionState);
    window.addEventListener('offline', updateConnectionState);
    window.addEventListener('sync-queue-updated', updateQueueCount);
    window.addEventListener('storage-role-change', loadUnits);

    return () => {
      window.removeEventListener('online', updateConnectionState);
      window.removeEventListener('offline', updateConnectionState);
      window.removeEventListener('sync-queue-updated', updateQueueCount);
      window.removeEventListener('storage-role-change', loadUnits);
    };
  }, []);

  // ─── Database Control Block ──────────────────────────────────────
  const DatabaseControlBlock = () => {
    return (
      <div className="bg-slate-900/65 dark:bg-slate-950/40 rounded-2xl p-3.5 border border-white/5 text-xs space-y-3 shadow-inner">
        <div className="flex items-center justify-between text-slate-300 font-bold uppercase tracking-wider text-[9px]">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-secondary animate-pulse" />
            <span>Telemetry</span>
          </span>
          {syncQueueCount > 0 && (
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse shadow-sm shadow-amber-500/20">
              {syncQueueCount} Syncing
            </span>
          )}
        </div>
        {isOnline ? (
          <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-2.5">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wide leading-none">Supabase Live</p>
              <p className="text-[9px] text-emerald-305/70 font-semibold mt-0.5">Database Connected</p>
            </div>
          </div>
        ) : (
          <div className="p-2 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center gap-2.5">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-550"></span>
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-wide leading-none">Offline Mode</p>
              <p className="text-[9px] text-amber-305/70 font-semibold mt-0.5">Caching Logs Locally</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', shortName: 'Home', icon: LayoutDashboard, roles: ['Owner'] },
    { id: 'unit-dashboard', name: 'Unit & Sheds', shortName: 'Units', icon: Grid3X3, roles: ['Owner', 'Supervisor'] },
    { id: 'daily-entry', name: 'Daily Entry Portal', shortName: 'Entry', icon: ClipboardPen, roles: ['Owner', 'Supervisor'] },
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
      <div className="w-10 h-10 md:w-11 md:h-11 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-md shrink-0 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/30 to-white/10 opacity-80" />
        <svg viewBox="0 0 100 100" className="w-full h-full z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="45" r="22" fill="#F9A825" className="opacity-80" />
          <path d="M75 35 C60 45 40 40 40 60 C55 60 70 50 75 35 Z" fill="#1B5E20" className="opacity-90" />
          <path d="M48 70 C48 75 58 75 58 70 C58 65 48 65 48 70 Z" fill="#F9A825" />
          <path d="M28 72 C32 60 42 50 48 52 C52 53 52 48 50 45 C48 42 45 44 43 40 C41 36 43 32 46 30 C49 32 50 35 48 38 C54 36 60 44 65 52 C70 58 72 65 72 72 Z" fill="#1B5E20" />
        </svg>
      </div>
      <div>
        <h1 className="font-extrabold text-xs md:text-sm tracking-wide leading-none text-white uppercase">
          Sri Mahalakshmi
        </h1>
        <p className="text-[8px] md:text-[9px] text-secondary font-black uppercase tracking-widest mt-1 block">
          Poultry AI ERP
        </p>
      </div>
    </div>
  );

  // ─── Role Control Block ──────────────────────────────────────────
  const RoleControlBlock = () => (
    <div className="bg-slate-900/65 dark:bg-slate-950/40 rounded-2xl p-3.5 border border-white/5 text-xs space-y-3 shadow-inner">
      <div className="flex items-center justify-between">
        <span className="text-slate-350 dark:text-slate-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1.5">
          {userRole === 'Owner' ? <UserSquare2 className="w-3.5 h-3.5 text-secondary" /> : <UserCheck className="w-3.5 h-3.5 text-secondary" />}
          <span>Security Role</span>
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
          className="px-2.5 py-1 bg-secondary/15 hover:bg-secondary/25 text-secondary border border-secondary/35 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95"
        >
          Toggle
        </button>
      </div>

      <div className="flex items-center justify-between bg-primary-dark/25 px-2.5 py-2 rounded-xl border border-primary-light/5">
        <span className="text-[10px] text-emerald-200/60 font-semibold uppercase">Current:</span>
        <span className="text-xs font-black text-white uppercase tracking-wider">{userRole}</span>
      </div>

      {userRole === 'Supervisor' ? (
        <div className="pt-2 border-t border-white/5 space-y-2">
          <label className="text-[9px] text-emerald-200/50 block font-bold uppercase tracking-wider">
            Assigned Unit Lock
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {unitsList.map(u => (
              <button
                key={u.id}
                onClick={() => setAssignedUnit(u.id)}
                className={`py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${assignedUnit === u.id
                    ? 'bg-secondary text-primary-dark shadow-sm font-black'
                    : 'bg-white/5 text-emerald-100 hover:bg-white/10'
                  }`}
                title={u.name}
              >
                U{u.id}
              </button>
            ))}
          </div>
          <p className="text-[8.5px] text-yellow-350/80 italic leading-tight font-semibold">
            *Restricted access locked to Unit {assignedUnit}.
          </p>
        </div>
      ) : (
        <div className="pt-1 text-[9px] text-emerald-200/40 flex items-center gap-1.5 font-semibold">
          <Home className="w-3.5 h-3.5 text-secondary" />
          <span>Full Enterprise Access Enabled</span>
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
          <nav className="p-4 space-y-1.5">
            {visibleTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 group cursor-pointer ${isActive
                      ? 'bg-gradient-to-r from-secondary to-yellow-500 text-primary-dark shadow-md shadow-secondary/20 font-black'
                      : 'text-emerald-100 hover:bg-white/10 hover:text-white hover:translate-x-1'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span>{tab.name}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 opacity-55 transition-transform duration-300 ${isActive ? 'rotate-90 text-primary-dark' : 'group-hover:translate-x-0.5'}`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Controls */}
        <div className="p-4 border-t border-white/5 space-y-4">
          <RoleControlBlock />
          <DatabaseControlBlock />
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-250/50 px-1">
            <span className="tracking-wide">v1.2.0 (AI Enabled)</span>
            <div className="flex gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-200 hover:text-white transition-all cursor-pointer active:scale-95 border border-white/5"
                title="Toggle Dark Mode"
              >
                <SunMoon className="w-4 h-4" />
              </button>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-150 transition-all cursor-pointer active:scale-95 border border-red-500/10"
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-primary text-white shadow-lg border-b border-primary-dark/30"
           style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <LogoBlock />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-primary-light/20 hover:bg-primary-light/40 transition active:scale-95"
              title="Toggle Dark Mode"
            >
              <SunMoon className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/30 text-red-300 transition active:scale-95"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-2 rounded-xl bg-primary-light/20 hover:bg-primary-light/40 transition active:scale-95"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
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
      <div className={`md:hidden fixed top-0 left-0 h-full w-72 bg-primary text-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Drawer Header */}
        <div className="p-5 border-b border-primary-light/10 flex items-center justify-between shrink-0">
          <LogoBlock />
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="p-2 rounded-xl bg-primary-light/20 hover:bg-primary-light/40 transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Nav Items */}
          <nav className="space-y-1.5">
            {visibleTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 group cursor-pointer ${isActive
                      ? 'bg-gradient-to-r from-secondary to-yellow-500 text-primary-dark shadow-md font-black'
                      : 'text-emerald-100 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4.5 h-4.5" />
                    <span>{tab.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-55 rotate-90 text-primary-dark" />}
                </button>
              );
            })}
          </nav>

          {/* Drawer Controls */}
          <div className="pt-4 border-t border-white/5 space-y-4">
            <RoleControlBlock />
            <DatabaseControlBlock />
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-emerald-250/50">v1.2.0 · AI Enabled</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-200 hover:text-white transition-all cursor-pointer active:scale-95"
                  title="Toggle Dark Mode"
                >
                  <SunMoon className="w-4 h-4" />
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-150 transition-all cursor-pointer active:scale-95"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MOBILE BOTTOM NAVIGATION BAR ─── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800/80 shadow-[0_-2px_20px_rgba(0,0,0,0.06)] flex items-stretch"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {bottomNavTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center pt-2.5 pb-2 gap-0.5 transition-all cursor-pointer active:scale-90 relative ${
                isActive
                  ? 'text-primary dark:text-secondary'
                  : 'text-slate-400 dark:text-slate-550'
              }`}
            >
              {/* Active indicator pill at top */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-primary dark:bg-secondary rounded-b-full shadow-sm" />
              )}
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive ? 'bg-primary/5 dark:bg-secondary/10' : ''
              }`}>
                <Icon className={`w-4.5 h-4.5 transition-all ${isActive ? 'scale-110' : ''}`} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-wider`}>
                {tab.shortName}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
