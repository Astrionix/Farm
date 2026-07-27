import React from 'react';
import { Menu, SunMoon, LogOut, Bell } from 'lucide-react';

interface HeaderProps {
  userRole: string;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onLogout: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
}

export default function Header({ userRole, darkMode, setDarkMode, onLogout, setMobileDrawerOpen }: HeaderProps) {
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="md:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Date & Weather Placeholder */}
        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{todayStr}</span>
          <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
            ☀️ Sunny 31°C
          </span>
        </div>

        {/* Global Actions */}
        <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
        </button>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
          title="Toggle Dark Mode"
        >
          <SunMoon className="w-4 h-4" />
        </button>

      </div>
    </header>
  );
}
