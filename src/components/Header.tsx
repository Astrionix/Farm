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
  const [eggPrice, setEggPrice] = useState<{ region: string; price: number; trayPrice: number; petiPrice: number; source: string }>({
    region: 'East Godavari',
    price: 6.05,
    trayPrice: 181.5,
    petiPrice: 1270.5,
    source: 'NECC Official (E.Godavari)'
  });

  const [liveWeather, setLiveWeather] = useState<{ temp: string; condition: string; icon: string }>({ temp: '31', condition: 'Sunny', icon: '☀️' });

  const [syncingRate, setSyncingRate] = useState(false);

  const fetchEggPrice = async () => {
    try {
      const p = await dbService.getEggPrice('East Godavari');
      setEggPrice(p);
    } catch (e) {
      console.warn('Egg price fetch error:', e);
    }
  };

  const handleSyncRate = async () => {
    setSyncingRate(true);
    await dbService.syncEggPriceFromNECC();
    await fetchEggPrice();
    setSyncingRate(false);
  };

  useEffect(() => {
    async function loadData() {
      try {
        await fetchEggPrice();

        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=17.1706&longitude=82.0163&current=temperature_2m,relative_humidity_2m,weather_code');
        if (res.ok) {
          const data = await res.json();
          const current = data.current || {};
          if (current.temperature_2m !== undefined) {
            const temp = current.temperature_2m.toFixed(1);
            const code = current.weather_code;
            let condition = 'Sunny';
            let icon = '☀️';
            if (code === 2 || code === 3) { condition = 'Cloudy'; icon = '⛅'; }
            else if (code >= 51 && code <= 82) { condition = 'Rainy'; icon = '🌧️'; }
            else if (current.relative_humidity_2m > 75) { condition = 'Humid'; icon = '🌫️'; }
            setLiveWeather({ temp, condition, icon });
          }
        }
      } catch (e) {
        console.warn('Header data load error:', e);
      }
    }
    loadData();
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

        {/* Live East Godavari NECC Egg Price Badge */}
        {eggPrice && (
          <div
            title={`Tray (30 eggs): ₹${eggPrice.trayPrice} | Peti (210 eggs): ₹${eggPrice.petiPrice} (Updated daily at 6:00 AM IST)`}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-300 shadow-sm transition hover:border-amber-500"
          >
            <span className="text-sm">🥚</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">E. Godavari NECC</span>
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">₹{eggPrice.price.toFixed(2)}</span>
              <span className="text-[9px] font-bold text-slate-400">/ egg</span>
              <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 ml-0.5" />
            </div>
            <button
              onClick={handleSyncRate}
              disabled={syncingRate}
              title="Sync latest NECC rate from e2necc.com"
              className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-200 rounded hover:bg-amber-500/30 transition flex items-center gap-1 disabled:opacity-50"
            >
              {syncingRate ? 'Syncing...' : 'Sync Rate'}
            </button>
          </div>
        )}
      </div>


      <div className="flex items-center gap-3 sm:gap-4">
        {/* Date & Weather Indicator */}
        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{todayStr}</span>
          <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
            <span>{liveWeather.icon}</span>
            <span>{liveWeather.condition} {liveWeather.temp}°C</span>
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
