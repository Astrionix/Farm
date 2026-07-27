import React, { useState, useEffect } from 'react';
import { Menu, SunMoon, LogOut, Bell, TrendingUp } from 'lucide-react';
import { dbService } from '../services/db';

interface HeaderProps {
  userRole: string;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onLogout: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
}

export default function Header({ userRole, darkMode, setDarkMode, onLogout, setMobileDrawerOpen }: HeaderProps) {
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const [eggPrice, setEggPrice] = useState<{ region: string; price: number; trayPrice: number; petiPrice: number; source: string } | null>(null);

  useEffect(() => {
    async function loadPrice() {
      const p = await dbService.getEggPrice('Kakinada');
      setEggPrice(p);
    }
    loadPrice();
  }, []);

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

        {/* Live Kakinada Egg Price Badge */}
        {eggPrice && (
          <div
            title={`Tray (30 eggs): ₹${eggPrice.trayPrice} | Peti: ₹${eggPrice.petiPrice} (Source: ${eggPrice.source})`}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-300 shadow-sm cursor-help transition hover:border-amber-500"
          >
            <span className="text-sm">🥚</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">Kakinada</span>
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">₹{eggPrice.price.toFixed(2)}</span>
              <span className="text-[9px] font-bold text-slate-400">/ egg</span>
              <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 ml-0.5" />
            </div>
          </div>
        )}
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
