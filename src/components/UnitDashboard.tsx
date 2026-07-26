'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  HelpCircle, 
  Settings, 
  Info, 
  Activity, 
  HeartPulse, 
  Zap, 
  AlertOctagon, 
  ChevronRight, 
  TrendingUp,
  Star,
  Sparkles,
  Calendar
} from 'lucide-react';
import { dbService, DBDailyEntry, DBShed, isChickShed } from '../services/db';

interface UnitDashboardProps {
  userRole: 'Owner' | 'Supervisor';
  assignedUnit: number;
}

export default function UnitDashboard({ userRole, assignedUnit }: UnitDashboardProps) {
  const [selectedUnit, setSelectedUnit] = useState<number>(1);
  const [entries, setEntries] = useState<DBDailyEntry[]>([]);
  const [shedStatusMap, setShedStatusMap] = useState<Record<number, 'Active' | 'Not In Use'>>({});
  const [loading, setLoading] = useState(true);
  const [selectedShedDetails, setSelectedShedDetails] = useState<DBDailyEntry | null>(null);
  const [unitsList, setUnitsList] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    async function loadUnits() {
      const u = await dbService.getUnits();
      setUnitsList(u);
    }
    loadUnits();
  }, []);

  // Sync unit choice with assigned unit for supervisors
  useEffect(() => {
    if (userRole === 'Supervisor') {
      setSelectedUnit(assignedUnit);
    }
  }, [userRole, assignedUnit]);

  // Load data for the selected unit
  useEffect(() => {
    async function loadUnitData() {
      setLoading(true);
      try {
        const allSheds = await dbService.getSheds();
        const unitSheds = allSheds.filter(s => s.unitId === selectedUnit);
        const map: Record<number, 'Active' | 'Not In Use'> = {};
        unitSheds.forEach(s => {
          map[s.shedNumber] = s.status;
        });
        setShedStatusMap(map);

        // Fetch latest entries for this unit
        const unitEntries = await dbService.getDailyEntries({ unitId: selectedUnit });
        setEntries(unitEntries);
      } catch (err) {
        console.error('Error loading unit dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUnitData();
  }, [selectedUnit]);

  const toggleShedStatus = async (shedNum: number) => {
    if (userRole !== 'Owner') return; // Supervisors cannot change shed configuration

    const currentStatus = shedStatusMap[shedNum] || 'Active';
    const targetStatus = currentStatus === 'Active' ? 'Not In Use' : 'Active';

    try {
      await dbService.updateShedStatus(selectedUnit, shedNum, targetStatus);
      setShedStatusMap(prev => ({
        ...prev,
        [shedNum]: targetStatus,
      }));
    } catch (err) {
      console.error('Failed to toggle shed status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 w-1/3 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
      </div>
    );
  }

  // Get most recent record per shed
  const latestDate = entries[0]?.date || '';
  const latestEntries = entries.filter(e => e.date === latestDate);

  // Aggregate unit stats
  const activeShedsCount = Object.values(shedStatusMap).filter(s => s === 'Active').length;
  const totalOpeningBirds = latestEntries.reduce((sum, e) => sum + e.openingBirds, 0);
  const totalClosingBirds = latestEntries.reduce((sum, e) => sum + e.closingBirds, 0);
  const totalEggs = latestEntries.reduce((sum, e) => sum + e.eggsCount, 0);
  const totalMortality = latestEntries.reduce((sum, e) => sum + e.mortality, 0);
  const totalFeed = latestEntries.reduce((sum, e) => sum + e.feedKg, 0);
  const totalWater = latestEntries.reduce((sum, e) => sum + e.waterLiters, 0);

  const unitHDPct = totalClosingBirds > 0 ? (totalEggs / totalClosingBirds) * 100 : 0;
  const unitMortPct = totalOpeningBirds > 0 ? (totalMortality / totalOpeningBirds) * 100 : 0;

  // Calculate unit-wise average bird age for active sheds
  const activeShedEntries = latestEntries.filter(e => shedStatusMap[e.shedNumber] === 'Active');
  const totalActiveAge = activeShedEntries.reduce((sum, e) => sum + (e.birdAgeWeeks || 0), 0);
  const avgBirdAge = activeShedEntries.length > 0 
    ? (totalActiveAge / activeShedEntries.length) 
    : 0;

  // AI Score calculations (Performance, Health, Efficiency, Risk)
  const averageShedScore = latestEntries.length > 0 
    ? latestEntries.reduce((sum, e) => sum + e.performanceScore, 0) / latestEntries.length
    : 0;

  const scorePerformance = Math.round(averageShedScore || 85);
  // Health Score: 100 - (mortality rate scaled)
  const scoreHealth = Math.round(Math.max(0, 100 - (unitMortPct * 100 * 10)));
  // Efficiency Score: based on FCR target (2.0 gives 100, 3.0 gives 50)
  const unitFCR = totalEggs > 0 && latestEntries[0] 
    ? totalFeed / ((totalEggs * latestEntries[0].eggWeightG) / 1000)
    : 2.15;
  const scoreEfficiency = Math.round(Math.max(0, 100 - Math.max(0, unitFCR - 2.0) * 45));
  // Risk Score: low is good. High is bad.
  const scoreRisk = Math.round(Math.min(100, (unitMortPct * 200) + (100 - scorePerformance) * 0.5));

  // Circular gauge renderer helper
  const renderGauge = (score: number, title: string, icon: any, colorClass: string, trackColor: string) => {
    const Icon = icon;
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium flex items-center gap-3">
        <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 56 56" className="w-14 h-14 transform -rotate-90">
            <circle cx="28" cy="28" r={radius} className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="5" fill="transparent" />
            <circle 
              cx="28" 
              cy="28" 
              r={radius} 
              className={trackColor} 
              strokeWidth="5" 
              fill="transparent" 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-[11px] font-black text-slate-800 dark:text-white leading-none">{score}%</span>
          </div>
        </div>
        <div>
          <h4 className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider">{title}</h4>
          <div className="flex items-center gap-1.5 mt-1">
            <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
              {score >= 90 ? 'Excellent' : score >= 80 ? 'Optimal' : score >= 70 ? 'Stable' : score >= 50 ? 'Warning' : 'Critical'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Sticky Page Header ─────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 pt-4 pb-0 md:px-6 md:pt-6 shrink-0">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg md:text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white leading-tight">
              Unit &amp; Shed Dashboard
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 hidden md:block">
              Real-time shed performance metrics, status configurations, and score breakdowns
            </p>
          </div>
          {userRole === 'Supervisor' && (
            <span className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-extrabold uppercase tracking-wide shrink-0">
              {unitsList.find(u => u.id === selectedUnit)?.name?.replace('Jaggampeta ', 'J. ') || `Unit ${selectedUnit}`}
            </span>
          )}
        </div>

        {/* Scrollable Unit Tabs */}
        {userRole === 'Owner' && (
          <div className="flex overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide border-t border-slate-100 dark:border-slate-700/50">
            {unitsList.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUnit(u.id)}
                className={`flex-shrink-0 px-3.5 py-2.5 text-xs font-bold transition-all relative ${
                  selectedUnit === u.id
                    ? 'text-primary dark:text-secondary'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {/* On desktop show full name, on mobile keep shortened J. wrapper */}
                <span className="md:hidden">{u.name.replace('Jaggampeta ', 'J. ')}</span>
                <span className="hidden md:inline">{u.name}</span>
                {selectedUnit === u.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary dark:bg-secondary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Scrollable Content ─────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-4">

        {/* Metrics Grid — 2 cols on mobile, 3 cols on tablet, 7 cols on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* Total Eggs Card */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-premium flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/15 flex items-center justify-center text-amber-500 border border-amber-100/50 dark:border-amber-900/30">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-slate-400 dark:text-slate-500 font-bold text-[9px] uppercase tracking-wider leading-none">Total Eggs</h4>
              <span className="text-base font-black text-slate-800 dark:text-white block mt-1 leading-none">
                {totalEggs.toLocaleString()}
              </span>
              <span className="text-[9px] text-primary font-bold mt-1 block">
                {unitHDPct.toFixed(1)}% HD Avg
              </span>
            </div>
          </div>

          {/* Average Flock Age Card */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-premium flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/15 flex items-center justify-center text-blue-500 border border-blue-100/50 dark:border-blue-900/30">
              <Calendar className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-slate-400 dark:text-slate-500 font-bold text-[9px] uppercase tracking-wider leading-none">Flock Age</h4>
              <span className="text-base font-black text-slate-800 dark:text-white block mt-1 leading-none">
                {avgBirdAge > 0 ? `${avgBirdAge.toFixed(1)}w` : '0.0w'}
              </span>
              <span className="text-[9px] text-blue-500 font-bold mt-1 block">Active Lifecycle</span>
            </div>
          </div>

          {/* Feed Consumed Card */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-premium flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/15 flex items-center justify-center text-emerald-500 border border-emerald-100/50 dark:border-emerald-900/30">
              <Zap className="w-4.5 h-4.5 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-slate-400 dark:text-slate-500 font-bold text-[9px] uppercase tracking-wider leading-none">Feed Consumed</h4>
              <span className="text-base font-black text-slate-800 dark:text-white block mt-1 leading-none">
                {totalFeed.toLocaleString()} kg
              </span>
              <span className="text-[9px] text-emerald-500 font-bold mt-1 block">Unit Feed Total</span>
            </div>
          </div>

          {renderGauge(scorePerformance, 'Performance', Activity, 'text-primary', 'stroke-primary')}
          {renderGauge(scoreHealth, 'Health Score', HeartPulse, 'text-emerald-500', 'stroke-emerald-500')}
          {renderGauge(scoreEfficiency, 'Efficiency', Zap, 'text-secondary', 'stroke-secondary')}
          {renderGauge(scoreRisk, 'Risk Score', AlertOctagon, 'text-red-500', 'stroke-red-500')}
        </div>

      {/* Shed Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-800 dark:text-white text-base">Shed Slot Grid</h3>
            <p className="text-slate-400 text-xs font-semibold">
              {unitsList.find(u => u.id === selectedUnit)?.name || `Unit ${selectedUnit}`} contains {activeShedsCount} Active sheds and {Object.keys(shedStatusMap).length - activeShedsCount} Not In Use slots
            </p>
          </div>
          {userRole === 'Owner' && (
            <span className="text-[10px] text-primary bg-primary/5 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 border border-primary/10">
              <Settings className="w-3 h-3 animate-spin-slow" />
              Shed Toggle Enabled
            </span>
          )}
        </div>

        {/* Shed Slot Grid — 2 col on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {Array.from({ length: Object.keys(shedStatusMap).length }, (_, i) => i + 1).map(shedNum => {
            const status = shedStatusMap[shedNum] || 'Active';
            const isActive = status === 'Active';
            const entry = latestEntries.find(e => e.shedNumber === shedNum);

            // Card highlight color based on performance
            let borderClass = 'border-slate-100 dark:border-slate-800';
            let bgClass = 'bg-white dark:bg-slate-800';
            let scoreColor = 'text-slate-800 dark:text-white';
            
            if (isActive && entry) {
              if (entry.performanceScore >= 90) {
                borderClass = 'border-l-4 border-l-primary border-slate-100 dark:border-slate-800 hover:border-primary';
                bgClass = 'bg-emerald-50/10 dark:bg-emerald-950/5';
              } else if (entry.performanceScore >= 80) {
                borderClass = 'border-l-4 border-l-emerald-500 border-slate-100 dark:border-slate-800 hover:border-emerald-500';
              } else if (entry.performanceScore >= 70) {
                borderClass = 'border-l-4 border-l-yellow-500 border-slate-100 dark:border-slate-800 hover:border-yellow-500';
              } else {
                borderClass = 'border-l-4 border-l-red-500 border-slate-100 dark:border-slate-800 hover:border-red-500';
                bgClass = 'bg-red-50/10 dark:bg-red-950/5';
                scoreColor = 'text-red-500';
              }
            }

            return (
              <div 
                key={shedNum}
                className={`p-5 rounded-2xl border ${borderClass} ${bgClass} shadow-premium transition-all duration-300 relative group flex flex-col justify-between min-h-48 ${
                  isActive ? 'hover:shadow-md cursor-pointer hover:-translate-y-0.5' : 'opacity-60 bg-slate-50 dark:bg-slate-900/40'
                }`}
                onClick={() => {
                  if (isActive && entry) {
                    setSelectedShedDetails(entry);
                  }
                }}
              >
                {/* Top header row */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {isChickShed(selectedUnit, shedNum) ? 'Chick Shed' : `Shed ${shedNum}`}
                    </h4>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase mt-1 ${
                      isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}>
                      {status}
                    </span>
                  </div>

                  {/* Owner Status Toggle Switch */}
                  {userRole === 'Owner' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleShedStatus(shedNum);
                      }}
                      className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                        isActive ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                      title={isActive ? 'Deactivate Shed' : 'Activate Shed'}
                    >
                      <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-200 ${
                        isActive ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  )}
                </div>

                {/* Body details */}
                {isActive ? (
                  entry ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
                          {entry.performanceScore}
                        </span>
                        <div className="flex items-center text-[10px] text-amber-500 gap-0.5 font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{entry.performanceRating}.0</span>
                        </div>
                      </div>
                      
                      {/* Sub metrics grid */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 border-t border-slate-100 dark:border-slate-700/60 pt-2 font-medium">
                        <div>
                          HD%: <span className="font-bold text-slate-700 dark:text-slate-300">{entry.hdPct}%</span>
                        </div>
                        <div>
                          Age: <span className="font-bold text-slate-700 dark:text-slate-300">{entry.birdAgeWeeks ?? 'N/A'} wks</span>
                          {(() => {
                            const batchDate = dbService.getBatchDate(selectedUnit, shedNum);
                            if (!batchDate) return null;
                            const d = new Date(batchDate);
                            const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
                            const dateStr = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
                            return (
                              <span className="block text-[8px] text-amber-600 dark:text-amber-400 font-semibold tracking-tight mt-0.5" title={`Placed on ${dayStr}, ${dateStr}`}>
                                Pl: {dayStr}, {dateStr}
                              </span>
                            );
                          })()}
                        </div>
                        <div>
                          FCR: <span className="font-bold text-slate-700 dark:text-slate-300">{entry.fcr}</span>
                        </div>
                        <div>
                          Eggs: <span className="font-bold text-slate-700 dark:text-slate-300">{entry.eggsCount.toLocaleString()}</span>
                        </div>
                        <div className="col-span-2">
                          Mortality: <span className="font-bold text-slate-700 dark:text-slate-300">{entry.mortality} birds</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-center py-4 text-xs text-slate-400 font-semibold italic">
                      No entry submitted today.
                    </div>
                  )
                ) : (
                  <div className="mt-4 text-center py-6 text-xs text-slate-400 dark:text-slate-600 font-semibold uppercase tracking-wider">
                    Shed Disabled
                  </div>
                )}

                {/* Inspect Link */}
                {isActive && entry && (
                  <div className="text-[10px] text-primary font-bold mt-3 flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Inspect</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Close flex-1 p-4 content wrapper */}
      </div>

      {/* Shed Details Modal */}
      {selectedShedDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in border border-slate-100 dark:border-slate-700">
            {/* Modal Header */}
            <div className="bg-primary text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-secondary font-black uppercase tracking-widest">Inspection Sheet</span>
                <h3 className="text-lg font-extrabold mt-0.5">
                  {unitsList.find(u => u.id === selectedShedDetails.unitId)?.name || `Unit ${selectedShedDetails.unitId}`} — {isChickShed(selectedShedDetails.unitId, selectedShedDetails.shedNumber) ? 'Chick Shed' : `Shed ${selectedShedDetails.shedNumber}`}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedShedDetails(null)}
                className="text-white hover:text-secondary font-bold text-sm bg-primary-dark/30 hover:bg-primary-dark/50 w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Score summary panel */}
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Performance Score</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-slate-800 dark:text-white">{selectedShedDetails.performanceScore}</span>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                      selectedShedDetails.performanceLabel === 'Excellent' ? 'bg-primary/10 text-primary' :
                      selectedShedDetails.performanceLabel === 'Very Good' ? 'bg-emerald-500/10 text-emerald-500' :
                      selectedShedDetails.performanceLabel === 'Good' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {selectedShedDetails.performanceLabel}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1 text-amber-500">
                  {Array.from({ length: selectedShedDetails.performanceRating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                  {Array.from({ length: 5 - selectedShedDetails.performanceRating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-slate-200 dark:text-slate-700" />
                  ))}
                </div>
              </div>

              {/* Param tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Flock & Feed */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-xs text-primary uppercase border-b border-primary/10 pb-1.5">Flock & Inputs</h4>
                  
                  <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Opening Birds:</span>
                      <span className="text-slate-800 dark:text-white font-bold">{selectedShedDetails.openingBirds.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mortality:</span>
                      <span className="text-slate-800 dark:text-white font-bold">{selectedShedDetails.mortality} birds ({selectedShedDetails.mortalityPct}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Culls:</span>
                      <span className="text-slate-800 dark:text-white font-bold">{selectedShedDetails.culls} birds</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Closing Birds:</span>
                      <span className="text-slate-800 dark:text-white font-bold">{selectedShedDetails.closingBirds.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
                      <span>Bird Age (Weeks):</span>
                      <span className="text-slate-800 dark:text-white font-bold">{selectedShedDetails.birdAgeWeeks ?? 'N/A'} weeks</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Feed Consumed:</span>
                      <span className="text-slate-800 dark:text-white font-bold">{selectedShedDetails.feedKg.toFixed(1)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Water Consumed:</span>
                      <span className="text-slate-800 dark:text-white font-bold">{selectedShedDetails.waterLiters.toFixed(1)} L</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Feed / Bird:</span>
                      <span className="text-slate-800 dark:text-white font-bold">{selectedShedDetails.feedPerBirdG} grams</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Water / Bird:</span>
                      <span className="text-slate-800 dark:text-white font-bold">{selectedShedDetails.waterPerBirdMl} ml</span>
                    </div>
                  </div>
                </div>

                {/* Right: Eggs & Quality */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-xs text-primary uppercase border-b border-primary/10 pb-1.5">Production & Quality</h4>
                  
                  <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Total Eggs:</span>
                      <span className="text-slate-800 dark:text-white font-bold">{selectedShedDetails.eggsCount.toLocaleString()} ({selectedShedDetails.hdPct}% HD)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Egg Weight:</span>
                      <span className="text-slate-800 dark:text-white font-bold">{selectedShedDetails.eggWeightG} grams</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Egg Mass:</span>
                      <span className="text-slate-800 dark:text-white font-bold">{selectedShedDetails.eggMassKg} kg</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
                      <span>Feed Conversion (FCR):</span>
                      <span className="text-primary font-black">{selectedShedDetails.fcr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Flock Uniformity:</span>
                      <span className="text-slate-800 dark:text-white font-bold">{selectedShedDetails.uniformity}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Treatment log */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-4">
                <h4 className="font-extrabold text-xs text-primary uppercase">Daily Log Remarks & Treatment</h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-semibold space-y-1">
                  <div className="text-slate-700 dark:text-slate-300">
                    <span className="text-slate-400 font-bold">Medication Administered:</span>{' '}
                    {selectedShedDetails.medication || 'None'}
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 mt-1">
                    <span className="text-slate-400 font-bold">Remarks:</span>{' '}
                    {selectedShedDetails.remarks || 'No remarks recorded for this day.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button 
                onClick={() => setSelectedShedDetails(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition"
              >
                Close Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
