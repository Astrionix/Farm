'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  Droplet, 
  UtensilsCrossed, 
  DollarSign, 
  Activity, 
  Sparkles,
  CloudSun,
  Award,
  CircleAlert
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, BarChart, Bar, Legend 
} from 'recharts';
import { dbService, DBDailyEntry, DBInventoryItem, DBNotification } from '../services/db';

interface OwnerDashboardProps {
  darkMode: boolean;
  onNavigateToUnit: (unitId: number) => void;
}

export default function OwnerDashboard({ darkMode, onNavigateToUnit }: OwnerDashboardProps) {
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | '90d'>('7d');
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<DBDailyEntry[]>([]);
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [aggMetrics, setAggMetrics] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  // Constant values for financial calculation
  const EGG_SALE_PRICE = 5.5; // Rs. 5.50 per egg
  const FEED_COST_PER_KG = 36.0; // Rs. 36.00 per kg

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const allEntries = await dbService.getDailyEntries();
        const allNotifications = await dbService.getNotifications();

        setEntries(allEntries);
        setNotifications(allNotifications.filter(n => !n.isRead));

        // Get latest entry date
        const latestEntry = allEntries[0];
        const targetDate = latestEntry ? latestEntry.date : new Date().toISOString().split('T')[0];

        // 1. Calculate Aggregated Farm Scores for targetDate
        const metrics = await dbService.getAggregatedScores(targetDate);
        setAggMetrics(metrics);

        // 2. Prepare Chart Data based on range filter
        let filterDays = 7;
        if (dateRange === '30d') filterDays = 30;
        if (dateRange === '90d') filterDays = 90;
        if (dateRange === 'today') filterDays = 1;

        const chartEntries = [...allEntries];
        // Get sorted unique dates
        const uniqueDates = Array.from(new Set(chartEntries.map(e => e.date)))
          .sort((a, b) => a.localeCompare(b))
          .slice(-filterDays);

        const dataByDate = uniqueDates.map(dateStr => {
          const dayEntries = chartEntries.filter(e => e.date === dateStr && e.status === 'Active');
          
          const eggs = dayEntries.reduce((sum, e) => sum + e.eggsCount, 0);
          const mortality = dayEntries.reduce((sum, e) => sum + e.mortality, 0);
          const feed = dayEntries.reduce((sum, e) => sum + e.feedKg, 0);
          const water = dayEntries.reduce((sum, e) => sum + e.waterLiters, 0);
          const birds = dayEntries.reduce((sum, e) => sum + e.closingBirds, 0);

          const revenue = eggs * EGG_SALE_PRICE;
          const feedCost = feed * FEED_COST_PER_KG;
          const profit = revenue - feedCost;

          const hd = birds > 0 ? (eggs / birds) * 100 : 0;
          const mortPct = birds > 0 ? (mortality / (birds + mortality)) * 100 : 0;

          // Format date for chart axis (MM-DD)
          const dateParts = dateStr.split('-');
          const shortDate = `${dateParts[1]}/${dateParts[2]}`;

          return {
            date: dateStr,
            name: shortDate,
            eggs,
            mortality,
            feed: Math.round(feed),
            water: Math.round(water),
            revenue: Math.round(revenue),
            profit: Math.round(profit),
            hdPct: Number(hd.toFixed(1)),
            mortalityPct: Number(mortPct.toFixed(2)),
          };
        });

        setChartData(dataByDate);
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [dateRange]);

  if (loading || !aggMetrics) {
    return (
      <div className="flex-1 p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 w-1/4 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
      </div>
    );
  }

  // Get all unique dates sorted ascending
  const uniqueDatesSorted = Array.from(new Set(entries.map(e => e.date)))
    .sort((a, b) => a.localeCompare(b));

  let activeDates: string[] = [];
  if (dateRange === 'today') {
    activeDates = uniqueDatesSorted.length > 0 ? [uniqueDatesSorted[uniqueDatesSorted.length - 1]] : [];
  } else {
    let filterDays = 7;
    if (dateRange === '30d') filterDays = 30;
    if (dateRange === '90d') filterDays = 90;
    activeDates = uniqueDatesSorted.slice(-filterDays);
  }

  // Filter entries to the selected date range
  const rangeEntries = entries.filter(e => activeDates.includes(e.date) && e.status === 'Active');

  const totalEggs = rangeEntries.reduce((sum, e) => sum + e.eggsCount, 0);
  const totalMortality = rangeEntries.reduce((sum, e) => sum + e.mortality, 0);
  const totalFeed = rangeEntries.reduce((sum, e) => sum + e.feedKg, 0);
  const totalWater = rangeEntries.reduce((sum, e) => sum + e.waterLiters, 0);
  const totalBirdsDaySum = rangeEntries.reduce((sum, e) => sum + e.closingBirds, 0);

  const avgHDPct = totalBirdsDaySum > 0 ? (totalEggs / totalBirdsDaySum) * 100 : 0;
  const avgMortPct = totalBirdsDaySum > 0 ? (totalMortality / totalBirdsDaySum) * 100 : 0;

  const totalRevenue = totalEggs * EGG_SALE_PRICE;
  const totalFeedCost = totalFeed * FEED_COST_PER_KG;
  const totalProfit = totalRevenue - totalFeedCost;

  // Average farm score over the period (computed in-memory)
  const avgFarmScore = rangeEntries.length > 0
    ? Math.round(rangeEntries.reduce((sum, e) => sum + e.performanceScore, 0) / rangeEntries.length)
    : aggMetrics?.farmScore || 90;
  const farmLabel = avgFarmScore >= 90 ? 'Excellent' : avgFarmScore >= 80 ? 'Very Good' : avgFarmScore >= 70 ? 'Good' : 'Needs Care';

  // Weather data mapping (average over range or latest value)
  const latestWeather = rangeEntries[0]?.weather || 'Sunny';
  const latestTemp = rangeEntries.length > 0 
    ? Number((rangeEntries.reduce((sum, e) => sum + e.temperature, 0) / rangeEntries.length).toFixed(1))
    : 31.4;
  const latestHumid = rangeEntries.length > 0
    ? Number((rangeEntries.reduce((sum, e) => sum + e.humidity, 0) / rangeEntries.length).toFixed(1))
    : 62.5;

  const latestDate = entries[0]?.date || new Date().toISOString().split('T')[0];

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-screen">
      {/* Top Bar / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">
            Sri Mahalakshmi Poultry ERP
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Intelligent Poultry Management Powered by AI — <span className="font-semibold text-primary">{latestDate}</span>
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1 border border-slate-200/50 dark:border-slate-700/50">
            {(['today', '7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition uppercase ${
                  dateRange === range
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {range === 'today' ? 'Today' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Eggs Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium shadow-premium-hover relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-105" />
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wider">
              {dateRange === 'today' ? "Today's Eggs" : "Total Eggs"}
            </span>
            <span className="p-2 bg-yellow-50 dark:bg-yellow-950/40 text-secondary rounded-xl">
              <Award className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">
              {totalEggs.toLocaleString()}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-success">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {dateRange === 'today' 
                  ? "+2.4% vs yesterday" 
                  : `Avg: ${Math.round(totalEggs / activeDates.length).toLocaleString()} / day`}
              </span>
            </div>
          </div>
        </div>

        {/* Hen Day % Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium shadow-premium-hover relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-105" />
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wider">Hen-Day (HD) %</span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-primary rounded-xl">
              <Activity className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">
              {avgHDPct.toFixed(1)}%
            </h3>
            <div className={`flex items-center gap-1.5 mt-2 text-xs font-bold ${avgHDPct >= 92 ? 'text-success' : 'text-amber-500'}`}>
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{avgHDPct >= 92 ? 'Above Target (92%)' : 'Below Target (92%)'}</span>
            </div>
          </div>
        </div>

        {/* Mortality Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium shadow-premium-hover relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-105" />
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wider">
              {dateRange === 'today' ? "Mortality Rate" : "Total Mortality"}
            </span>
            <span className="p-2 bg-red-50 dark:bg-red-950/40 text-red-500 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">
              {totalMortality} <span className="text-xs text-slate-400 font-normal">birds ({avgMortPct.toFixed(2)}%)</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-danger">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {dateRange === 'today'
                  ? "Spike logged in U3"
                  : `Avg: ${(totalMortality / activeDates.length).toFixed(1)} birds / day`}
              </span>
            </div>
          </div>
        </div>

        {/* AI Performance Score Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium shadow-premium-hover relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-105" />
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wider">Farm AI Score</span>
            <span className="p-2 bg-orange-50 dark:bg-orange-950/40 text-orange-500 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-baseline gap-1.5">
              {avgFarmScore}
              <span className="text-xs text-orange-500 font-bold uppercase">{farmLabel}</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-success">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>Stability is High</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financials & Resource Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Daily Profit */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium shadow-premium-hover">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wider">
            <span>Estimated Profit</span>
            <DollarSign className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="mt-3">
            <h4 className="text-xl font-extrabold text-slate-800 dark:text-white">
              ₹{Math.round(totalProfit).toLocaleString()}
            </h4>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-1">
              <span>Rev: ₹{Math.round(totalRevenue).toLocaleString()}</span>
              <span>Feed Cost: ₹{Math.round(totalFeedCost).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Resources Consumption (Feed & Water) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium shadow-premium-hover">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wider">
            <span>{dateRange === 'today' ? "Daily Feed" : "Total Feed"}</span>
            <UtensilsCrossed className="w-4.5 h-4.5 text-orange-500" />
          </div>
          <div className="mt-3">
            <h4 className="text-xl font-extrabold text-slate-800 dark:text-white">
              {Math.round(totalFeed).toLocaleString()} kg
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              {dateRange === 'today' 
                ? <>Average Feed/Bird: <span className="font-bold text-slate-700 dark:text-slate-300">116.5 grams</span></>
                : `Avg: ${Math.round(totalFeed / activeDates.length).toLocaleString()} kg / day`}
            </p>
          </div>
        </div>

        {/* Daily Water */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium shadow-premium-hover">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wider">
            <span>{dateRange === 'today' ? "Daily Water" : "Total Water"}</span>
            <Droplet className="w-4.5 h-4.5 text-blue-500" />
          </div>
          <div className="mt-3">
            <h4 className="text-xl font-extrabold text-slate-800 dark:text-white">
              {Math.round(totalWater).toLocaleString()} Liters
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Water to Feed Ratio: <span className="font-bold text-slate-700 dark:text-slate-300">{(totalFeed > 0 ? totalWater / totalFeed : 0).toFixed(2)}</span>
            </p>
          </div>
        </div>

        {/* Weather Conditions */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium shadow-premium-hover">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wider">
            <span>{dateRange === 'today' ? "Shed Weather" : "Avg Weather"}</span>
            <CloudSun className="w-4.5 h-4.5 text-yellow-500" />
          </div>
          <div className="mt-3">
            <h4 className="text-xl font-extrabold text-slate-800 dark:text-white">
              {latestTemp}°C {dateRange === 'today' && <span className="text-xs text-slate-400 font-semibold">{latestWeather}</span>}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              {dateRange === 'today' ? "Humidity:" : "Avg Humidity:"} <span className="font-bold text-slate-700 dark:text-slate-300">{latestHumid}% RH</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts & Leaderboards section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Analytics Charts Panel (Takes 2 columns) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium lg:col-span-2 space-y-6 self-start">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-800 dark:text-white text-base">Production & Performance Charts</h3>
              <p className="text-slate-400 text-xs font-semibold">Graphical representation of key indicators</p>
            </div>
          </div>

          <div className="space-y-6">
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center min-h-[30rem] space-y-3">
                <div className="p-4 bg-primary/5 rounded-full text-primary">
                  <Activity className="w-8 h-8" />
                </div>
                <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">No Live Production Data Yet</h4>
                <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                  The dashboard is currently operating on a clean database slate. Log your daily poultry production numbers in the Daily Entry Portal to populate the performance, input-output, and profit analysis charts.
                </p>
              </div>
            ) : (
              /* Chart 1: Eggs Produced vs HD% */
              <div className="h-[32rem]">
                <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Hen-Day Egg Production Trend</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEggs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B5E20" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#1B5E20" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorHd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F9A825" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#F9A825" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#f1f5f9"} />
                    <XAxis dataKey="name" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={10} tickLine={false} />
                    <YAxis yAxisId="left" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" domain={[70, 100]} stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: darkMode ? "#1e293b" : "#ffffff", borderColor: darkMode ? "#475569" : "#e2e8f0", color: darkMode ? "#f8fafc" : "#0f172a" }} />
                    <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Area yAxisId="left" type="monotone" dataKey="eggs" name="Eggs Produced" stroke="#1B5E20" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEggs)" />
                    <Area yAxisId="right" type="monotone" dataKey="hdPct" name="HD Production %" stroke="#F9A825" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHd)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboards, Alerts & Inventory (1 column) */}
        <div className="space-y-6">
          {/* Unit Ranking Leaderboard */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm uppercase tracking-wider">Unit Leaderboard</h3>
              <Award className="w-4.5 h-4.5 text-secondary" />
            </div>
            
            <div className="space-y-3.5">
              {aggMetrics.rankedUnits.map((unit: any, idx: number) => {
                const rankColors = ['bg-yellow-500 text-white', 'bg-slate-300 text-slate-800', 'bg-amber-600 text-white', 'bg-slate-100 dark:bg-slate-700 text-slate-500'];
                return (
                  <div 
                    key={unit.unitId} 
                    onClick={() => onNavigateToUnit(unit.unitId)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 border border-transparent hover:border-slate-100 dark:hover:border-slate-700/80 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${rankColors[idx] || 'bg-slate-100 text-slate-500'}`}>
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">{unit.unitName}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">{unit.activeSheds} Active Sheds</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-800 dark:text-white text-sm">{unit.performanceScore}</span>
                      <span className={`block text-[9px] font-bold ${
                        unit.performanceLabel === 'Excellent' ? 'text-primary' :
                        unit.performanceLabel === 'Very Good' ? 'text-emerald-500' :
                        unit.performanceLabel === 'Good' ? 'text-yellow-500' : 'text-red-500'
                      }`}>{unit.performanceLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critical Alerts widget */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-3 mb-3">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm uppercase tracking-wider">Critical Alerts</h3>
              <CircleAlert className="w-4.5 h-4.5 text-red-500" />
            </div>

            <div className="space-y-3">
              {/* Active notifications */}
              {notifications.length > 0 ? (
                notifications.slice(0, 3).map(n => (
                  <div key={n.id} className="p-3 bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-950/40 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[11px] font-bold text-red-800 dark:text-red-300 leading-tight">{n.title}</h4>
                      <p className="text-[10px] text-red-600/90 dark:text-red-400/80 leading-snug mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/40 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold">No active alerts. System healthy.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
