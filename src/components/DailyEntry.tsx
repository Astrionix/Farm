'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Calendar, 
  CloudSun, 
  Thermometer, 
  Droplet, 
  Plus,
  History,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { dbService, DBDailyEntry, DBShed } from '../services/db';
import { calculateShedMetrics, ShedDataInput } from '../utils/calculations';
import { SkeletonDailyEntry } from './SkeletonLoader';

interface DailyEntryProps {
  userRole: 'Owner' | 'Supervisor';
  assignedUnit: number;
}

export default function DailyEntry({ userRole, assignedUnit }: DailyEntryProps) {
  const [selectedUnit, setSelectedUnit] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Environmental stats
  const [weather, setWeather] = useState<string>('Sunny');
  const [temperature, setTemperature] = useState<string>('31.5');
  const [humidity, setHumidity] = useState<string>('60');
  const [generalRemarks, setGeneralRemarks] = useState<string>('');

  const [shedsList, setShedsList] = useState<DBShed[]>([]);
  const [shedInputs, setShedInputs] = useState<Record<number, Partial<ShedDataInput>>>({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // History search/filter state
  const [historyEntries, setHistoryEntries] = useState<DBDailyEntry[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterUnit, setHistoryFilterUnit] = useState<number | 'all'>('all');
  const [historyLoading, setHistoryLoading] = useState(false);

  const DRAFT_KEY = `smp_draft_${assignedUnit}`;

  // Lock unit to assigned unit for supervisors
  useEffect(() => {
    if (userRole === 'Supervisor') {
      setSelectedUnit(assignedUnit);
    }
  }, [userRole, assignedUnit]);

  // Set default date to today's local date & restore draft
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);

    // Check for saved draft
    const saved = localStorage.getItem(`smp_draft_${assignedUnit}`);
    if (saved) setHasDraft(true);
  }, [assignedUnit]);

  // Fetch sheds and load existing entry if any
  useEffect(() => {
    if (!selectedDate) return;

    async function loadData() {
      setLoading(true);
      try {
        const allSheds = await dbService.getSheds();
        const unitSheds = allSheds.filter(s => s.unitId === selectedUnit);
        setShedsList(unitSheds);

        // Try to fetch existing entries for this date
        const existingEntries = await dbService.getDailyEntries({ 
          date: selectedDate, 
          unitId: selectedUnit 
        });

        // Get entries from the day before (for opening birds prefill)
        const prevDateObj = new Date(selectedDate);
        prevDateObj.setDate(prevDateObj.getDate() - 1);
        const prevDateStr = prevDateObj.toISOString().split('T')[0];
        const prevEntries = await dbService.getDailyEntries({
          date: prevDateStr,
          unitId: selectedUnit
        });

        const inputsMap: Record<number, Partial<ShedDataInput>> = {};

        unitSheds.forEach(shed => {
          const sNum = shed.shedNumber;
          const todayEntry = existingEntries.find(e => e.shedNumber === sNum);
          const yesterdayEntry = prevEntries.find(e => e.shedNumber === sNum);

          if (todayEntry) {
            // Edit existing entry
            inputsMap[sNum] = {
              status: todayEntry.status,
              openingBirds: todayEntry.openingBirds,
              mortality: todayEntry.mortality,
              culls: todayEntry.culls,
              closingBirds: todayEntry.closingBirds,
              feedKg: todayEntry.feedKg,
              waterLiters: todayEntry.waterLiters,
              eggsCount: todayEntry.eggsCount,
              eggWeightG: todayEntry.eggWeightG,
              eggsBroken: todayEntry.eggsBroken,
              eggsDirty: todayEntry.eggsDirty,
              eggsCracked: todayEntry.eggsCracked,
              uniformity: todayEntry.uniformity,
              bodyWeight: todayEntry.bodyWeight,
              medication: todayEntry.medication,
              remarks: todayEntry.remarks,
              birdAgeWeeks: todayEntry.birdAgeWeeks,
            };
            if (sNum === 1) {
              setWeather(todayEntry.weather);
              setTemperature(String(todayEntry.temperature));
              setHumidity(String(todayEntry.humidity));
              setGeneralRemarks(todayEntry.remarks || '');
            }
          } else {
            // Prefill new entry
            const prevClosing = yesterdayEntry?.closingBirds ?? 5000;
            inputsMap[sNum] = {
              status: shed.status,
              openingBirds: prevClosing,
              mortality: 0,
              culls: 0,
              closingBirds: prevClosing,
              feedKg: Math.round((prevClosing * 0.116)), // pre-fill estimated 116g/bird
              waterLiters: Math.round((prevClosing * 0.116 * 2)), // pre-fill estimated 2.0 ratio
              eggsCount: Math.round(prevClosing * 0.90), // prefill 90% production
              eggWeightG: 60.5,
              eggsBroken: 0,
              eggsDirty: 0,
              eggsCracked: 0,
              uniformity: 85,
              bodyWeight: 1680,
              medication: '',
              remarks: '',
              birdAgeWeeks: yesterdayEntry?.birdAgeWeeks ?? (18 + sNum * 2),
            };
          }
        });

        setShedInputs(inputsMap);

        // Load history for search panel
        setHistoryLoading(true);
        const recent = await dbService.getDailyEntries({ unitId: userRole === 'Owner' ? undefined : selectedUnit });
        setHistoryEntries(recent);
        setHistoryLoading(false);
      } catch (err) {
        console.error('Error fetching entries:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedDate, selectedUnit]);

  // Auto-save draft on input change
  const handleInputChange = (shedNum: number, field: keyof ShedDataInput, value: string | number) => {
    setShedInputs(prev => {
      const inputs = { ...prev };
      const oldVal = inputs[shedNum] || {};
      
      const updated = {
        ...oldVal,
        [field]: value,
      };

      // Auto-calculate closing birds if opening, mortality or culls changes
      if (field === 'openingBirds' || field === 'mortality' || field === 'culls') {
        const opening = Number(updated.openingBirds || 0);
        const mort = Number(updated.mortality || 0);
        const culls = Number(updated.culls || 0);
        updated.closingBirds = Math.max(0, opening - mort - culls);
      }

      inputs[shedNum] = updated;

      // Persist draft to localStorage
      const draft = { weather, temperature, humidity, generalRemarks, shedInputs: { ...inputs } };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setHasDraft(true);

      return inputs;
    });
  };

  const handleStatusToggle = (shedNum: number) => {
    setShedInputs(prev => {
      const inputs = { ...prev };
      const current = inputs[shedNum]?.status || 'Active';
      inputs[shedNum] = {
        ...inputs[shedNum],
        status: current === 'Active' ? 'Not In Use' : 'Active',
      };
      return inputs;
    });
  };

  // Intercept submit → show confirm dialog
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  // Actual save after confirm
  const handleConfirmedSave = async () => {
    setShowConfirm(false);
    setSaving(true);
    setSuccessMsg('');

    try {
      const inputsArray: { shedNumber: number; input: ShedDataInput }[] = [];
      
      for (const [shedNumStr, input] of Object.entries(shedInputs)) {
        const sNum = Number(shedNumStr);
        const closing = Number(input.closingBirds ?? (Number(input.openingBirds || 0) - Number(input.mortality || 0) - Number(input.culls || 0)));
        inputsArray.push({
          shedNumber: sNum,
          input: {
            status: input.status || 'Active',
            openingBirds: Number(input.openingBirds || 0),
            mortality: Number(input.mortality || 0),
            culls: Number(input.culls || 0),
            closingBirds: closing,
            feedKg: Number(input.feedKg || (closing ? Math.round(closing * 0.116) : 0)),
            waterLiters: Number(input.waterLiters || (closing ? Math.round(closing * 0.116 * 2.0) : 0)),
            eggsCount: Number(input.eggsCount || 0),
            eggWeightG: Number(input.eggWeightG || 60.0),
            eggsBroken: Number(input.eggsBroken || 0),
            eggsDirty: Number(input.eggsDirty || 0),
            eggsCracked: Number(input.eggsCracked || 0),
            uniformity: Number(input.uniformity || 85),
            bodyWeight: Number(input.bodyWeight || 1680),
            medication: input.medication || '',
            remarks: input.remarks || '',
          },
        });
      }

      await dbService.saveDailyEntries(
        selectedDate,
        selectedUnit,
        weather,
        Number(temperature),
        Number(humidity),
        generalRemarks,
        inputsArray
      );

      // Clear saved draft on success
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#1B5E20', '#F9A825', '#FF9800'],
      });

      setSuccessMsg('Daily logs successfully saved and metrics recalculated.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed saving entry:', err);
    } finally {
      setSaving(false);
    }
  };

  // Restore saved draft
  const handleRestoreDraft = () => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      if (draft.weather) setWeather(draft.weather);
      if (draft.temperature) setTemperature(draft.temperature);
      if (draft.humidity) setHumidity(draft.humidity);
      if (draft.generalRemarks) setGeneralRemarks(draft.generalRemarks);
      if (draft.shedInputs) setShedInputs(draft.shedInputs);
    } catch {}
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  };

  // Filtered history
  const filteredHistory = historyEntries.filter(e => {
    const matchesSearch = historySearch === '' ||
      e.date.includes(historySearch) ||
      String(e.shedNumber).includes(historySearch) ||
      String(e.eggsCount).includes(historySearch);
    const matchesUnit = historyFilterUnit === 'all' || e.unitId === historyFilterUnit;
    return matchesSearch && matchesUnit;
  });

  if (loading) {
    return <SkeletonDailyEntry />;
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-screen">

      {/* Confirm Save Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/15 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-white text-sm">Confirm Save Entry</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">This will write production logs for Unit {selectedUnit} on {selectedDate}. Are you sure?</p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedSave}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary-dark transition flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft Restore Banner */}
      {hasDraft && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <History className="w-4 h-4" />
            <span>Unsaved draft found for Unit {assignedUnit}. Restore your previous work?</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={handleRestoreDraft} className="text-[10px] font-bold px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition">Restore</button>
            <button onClick={handleDiscardDraft} className="text-[10px] font-bold px-3 py-1.5 border border-amber-300 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition">Discard</button>
          </div>
        </div>
      )}
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            Supervisor Daily Entry Portal
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Log birds inventory, feed/water usage, and egg counts for Unit {selectedUnit}
          </p>
        </div>

        {userRole === 'Owner' && (
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1 border border-slate-200/50 dark:border-slate-700/50">
            {[1, 2, 3, 4].map(u => (
              <button
                key={u}
                onClick={() => setSelectedUnit(u)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedUnit === u
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                Unit {u}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Success Alert Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-950/40 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 font-semibold animate-fade-in shadow-premium">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Environment Settings Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium">
          <h3 className="font-extrabold text-slate-800 dark:text-white text-sm uppercase tracking-wider mb-4">
            Environmental Conditions
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {/* Date Pick */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Log Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                  required
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Weather Pick */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Weather</label>
              <div className="relative">
                <select
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary appearance-none"
                >
                  <option value="Sunny">Sunny ☀️</option>
                  <option value="Cloudy">Cloudy ☁️</option>
                  <option value="Humid">Humid 🥵</option>
                  <option value="Rainy">Rainy 🌧️</option>
                </select>
                <CloudSun className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Temp */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Temperature (°C)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                  required
                />
                <Thermometer className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Humidity */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Humidity (% RH)</label>
              <div className="relative">
                <input
                  type="number"
                  value={humidity}
                  onChange={(e) => setHumidity(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                  required
                />
                <Droplet className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Shed Cards Row */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Shed Sheets Logs</h3>
            <span className="text-[10px] text-slate-400 font-bold">12 slots supported</span>
          </div>

          <div className="space-y-4">
            {shedsList.map(shed => {
              const sNum = shed.shedNumber;
              const input = shedInputs[sNum] || {};
              const isActive = input.status === 'Active';

              // Live FCR, HD% and Score calculation preview
              let previewFCR = '0.00';
              let previewHDPct = '0.0';
              let previewScore = 0;
              let scoreLabel = 'Critical';

              if (isActive) {
                const closing = Number(input.closingBirds ?? (Number(input.openingBirds || 0) - Number(input.mortality || 0) - Number(input.culls || 0)));
                const dummyInput: ShedDataInput = {
                  status: 'Active',
                  openingBirds: Number(input.openingBirds || 0),
                  mortality: Number(input.mortality || 0),
                  culls: Number(input.culls || 0),
                  closingBirds: closing,
                  feedKg: Number(input.feedKg || (closing ? Math.round(closing * 0.116) : 0)),
                  waterLiters: Number(input.waterLiters || (closing ? Math.round(closing * 0.116 * 2.0) : 0)),
                  eggsCount: Number(input.eggsCount || 0),
                  eggWeightG: Number(input.eggWeightG || 60.0),
                  eggsBroken: Number(input.eggsBroken || 0),
                  eggsDirty: Number(input.eggsDirty || 0),
                  eggsCracked: Number(input.eggsCracked || 0),
                  uniformity: Number(input.uniformity || 85),
                  bodyWeight: Number(input.bodyWeight || 1680),
                };

                const calc = calculateShedMetrics(dummyInput);
                previewFCR = String(calc.fcr);
                previewHDPct = String(calc.hdPct);
                previewScore = calc.performanceScore;
                scoreLabel = calc.performanceLabel;
              }

              return (
                <div 
                  key={sNum}
                  className={`bg-white dark:bg-slate-800 rounded-2xl border ${
                    isActive ? 'border-slate-100 dark:border-slate-800' : 'border-dashed border-slate-200 dark:border-slate-700 opacity-60'
                  } p-5 shadow-premium transition-all relative`}
                >
                  {/* Top Bar for Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3.5 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                        {sNum}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Shed {sNum}</h4>
                        <span className={`text-[10px] font-bold ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                          {isActive ? 'Active & Included in Reports' : 'Not In Use — Excluded from Math'}
                        </span>
                      </div>
                    </div>

                    {/* Active Checkbox */}
                    <div className="flex items-center gap-4">
                      {isActive && (
                        <div className="bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-4 text-[11px] font-extrabold text-slate-500">
                          <div>
                            HD%: <span className="text-slate-700 dark:text-slate-200 font-black">{previewHDPct}%</span>
                          </div>
                          <div>
                            FCR: <span className="text-primary font-black">{previewFCR}</span>
                          </div>
                          <div>
                            Shed Score: <span className={`font-black ${previewScore >= 90 ? 'text-primary' : 'text-amber-500'}`}>{previewScore} ({scoreLabel})</span>
                          </div>
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(sNum)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition border ${
                          isActive 
                            ? 'bg-red-50 hover:bg-red-100 text-red-500 border-red-200' 
                            : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20'
                        }`}
                      >
                        {isActive ? 'Disable Shed' : 'Enable Shed'}
                      </button>
                    </div>
                  </div>

                  {/* Input Grid (Rendered only if Active) */}
                  {isActive ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-4">
                      {/* Opening Birds */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Opening Birds</label>
                        <input
                          type="number"
                          value={input.openingBirds ?? 0}
                          onChange={(e) => handleInputChange(sNum, 'openingBirds', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
 
                      {/* Mortality */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Mortality</label>
                        <input
                          type="number"
                          value={input.mortality ?? 0}
                          onChange={(e) => handleInputChange(sNum, 'mortality', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                        />
                      </div>
 
                      {/* Culls */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Culls</label>
                        <input
                          type="number"
                          value={input.culls ?? 0}
                          onChange={(e) => handleInputChange(sNum, 'culls', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                        />
                      </div>
 
                      {/* Closing Birds (Calculated Indicator) */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Closing Birds</label>
                        <div className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400">
                          {input.closingBirds ?? 0}
                        </div>
                      </div>

                      {/* Bird Age (Weeks) */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Bird Age (Weeks)</label>
                        <input
                          type="number"
                          value={input.birdAgeWeeks ?? 0}
                          onChange={(e) => handleInputChange(sNum, 'birdAgeWeeks', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
 
                      {/* Eggs Collected */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Eggs Collected</label>
                        <input
                          type="number"
                          value={input.eggsCount ?? 0}
                          onChange={(e) => handleInputChange(sNum, 'eggsCount', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
 
                      {/* Broken eggs */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Broken Eggs</label>
                        <input
                          type="number"
                          value={input.eggsBroken ?? 0}
                          onChange={(e) => handleInputChange(sNum, 'eggsBroken', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                        />
                      </div>
 
                      {/* Dirty eggs */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Dirty Eggs</label>
                        <input
                          type="number"
                          value={input.eggsDirty ?? 0}
                          onChange={(e) => handleInputChange(sNum, 'eggsDirty', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                        />
                      </div>
 
                      {/* Cracked eggs */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Cracked Eggs</label>
                        <input
                          type="number"
                          value={input.eggsCracked ?? 0}
                          onChange={(e) => handleInputChange(sNum, 'eggsCracked', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs font-bold italic text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-900/10 rounded-xl">
                      Shed slot currently inactive. Enable status to permit daily log entries.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-semibold text-xs">
            <AlertCircle className="w-4 h-4 text-secondary" />
            <span>Verify input values before saving to production log records.</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary text-white text-xs font-bold uppercase rounded-xl shadow-md hover:bg-primary-dark transition flex items-center gap-2 cursor-pointer disabled:bg-primary/40 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Production Logs'}</span>
          </button>
        </div>
      </form>

      {/* ─── History Search & Filter Panel ─── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-premium overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">Entry History</h3>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
              {filteredHistory.length} records
            </span>
          </div>
          <div className="flex gap-2 sm:ml-auto">
            {/* Search box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search date, shed, eggs…"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="pl-8 pr-8 py-1.5 text-[11px] font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-primary text-slate-700 dark:text-slate-200 w-48"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              {historySearch && (
                <button onClick={() => setHistorySearch('')} className="absolute right-2 top-2">
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>
            {/* Unit filter (owner only) */}
            {userRole === 'Owner' && (
              <select
                value={historyFilterUnit}
                onChange={e => setHistoryFilterUnit(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="py-1.5 px-2 text-[11px] font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-primary text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Units</option>
                {[1,2,3,4].map(u => <option key={u} value={u}>Unit {u}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {historyLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 font-semibold animate-pulse">Loading history…</div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-semibold">No records match your search.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50">
                  {['Date','Unit','Shed','Birds','Eggs','HD%','FCR','Mortality','Score'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredHistory.slice(0, 50).map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-200">{e.date}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">U{e.unitId}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">S{e.shedNumber}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200">{e.closingBirds?.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200">{e.eggsCount?.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-semibold text-primary">{e.hdPct?.toFixed(1)}%</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200">{e.fcr?.toFixed(2)}</td>
                    <td className={`px-4 py-2.5 font-bold ${e.mortality > 5 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>{e.mortality}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        e.performanceScore >= 90 ? 'bg-emerald-100 text-emerald-700' :
                        e.performanceScore >= 70 ? 'bg-blue-100 text-blue-700' :
                        e.performanceScore >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>{e.performanceScore}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
