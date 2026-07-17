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
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { dbService, DBDailyEntry, DBShed } from '../services/db';
import { calculateShedMetrics, ShedDataInput } from '../utils/calculations';

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

  // Lock unit to assigned unit for supervisors
  useEffect(() => {
    if (userRole === 'Supervisor') {
      setSelectedUnit(assignedUnit);
    }
  }, [userRole, assignedUnit]);

  // Set default date to today's local date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

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
            };
          }
        });

        setShedInputs(inputsMap);
      } catch (err) {
        console.error('Error fetching entries:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedDate, selectedUnit]);

  // Handle single input field updates
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

      // Auto FCR preview and calculations are handled inline in the UI render

      inputs[shedNum] = updated;
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      const inputsArray: { shedNumber: number; input: ShedDataInput }[] = [];
      
      for (const [shedNumStr, input] of Object.entries(shedInputs)) {
        const sNum = Number(shedNumStr);
        inputsArray.push({
          shedNumber: sNum,
          input: {
            status: input.status || 'Active',
            openingBirds: Number(input.openingBirds || 0),
            mortality: Number(input.mortality || 0),
            culls: Number(input.culls || 0),
            closingBirds: Number(input.closingBirds || 0),
            feedKg: Number(input.feedKg || 0),
            waterLiters: Number(input.waterLiters || 0),
            eggsCount: Number(input.eggsCount || 0),
            eggWeightG: Number(input.eggWeightG || 0),
            eggsBroken: Number(input.eggsBroken || 0),
            eggsDirty: Number(input.eggsDirty || 0),
            eggsCracked: Number(input.eggsCracked || 0),
            uniformity: Number(input.uniformity || 0),
            bodyWeight: Number(input.bodyWeight || 0),
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

      // Trigger Confetti for professional success response
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

  if (loading) {
    return (
      <div className="flex-1 p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 w-1/3 rounded" />
        <div className="h-24 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-xl" />
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-screen">
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
                const dummyInput: ShedDataInput = {
                  status: 'Active',
                  openingBirds: Number(input.openingBirds || 0),
                  mortality: Number(input.mortality || 0),
                  culls: Number(input.culls || 0),
                  closingBirds: Number(input.closingBirds || 0),
                  feedKg: Number(input.feedKg || 0),
                  waterLiters: Number(input.waterLiters || 0),
                  eggsCount: Number(input.eggsCount || 0),
                  eggWeightG: Number(input.eggWeightG || 0),
                  eggsBroken: Number(input.eggsBroken || 0),
                  eggsDirty: Number(input.eggsDirty || 0),
                  eggsCracked: Number(input.eggsCracked || 0),
                  uniformity: Number(input.uniformity || 0),
                  bodyWeight: Number(input.bodyWeight || 0),
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
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

                      {/* Feed consumed (kg) */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Feed Consumed (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={input.feedKg ?? 0}
                          onChange={(e) => handleInputChange(sNum, 'feedKg', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                          required
                        />
                      </div>

                      {/* Water Consumed (L) */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Water Consumed (L)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={input.waterLiters ?? 0}
                          onChange={(e) => handleInputChange(sNum, 'waterLiters', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                          required
                        />
                      </div>

                      {/* Eggs Count */}
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

                      {/* Egg weight average */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Egg Weight (g)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={input.eggWeightG ?? 0}
                          onChange={(e) => handleInputChange(sNum, 'eggWeightG', Number(e.target.value))}
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

                      {/* Uniformity */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Uniformity (%)</label>
                        <input
                          type="number"
                          value={input.uniformity ?? 0}
                          onChange={(e) => handleInputChange(sNum, 'uniformity', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                        />
                      </div>

                      {/* Body weight average */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Body Weight (g)</label>
                        <input
                          type="number"
                          value={input.bodyWeight ?? 0}
                          onChange={(e) => handleInputChange(sNum, 'bodyWeight', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                        />
                      </div>

                      {/* Medication */}
                      <div className="space-y-1 col-span-2">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Medication / Feed Additives</label>
                        <input
                          type="text"
                          value={input.medication ?? ''}
                          onChange={(e) => handleInputChange(sNum, 'medication', e.target.value)}
                          placeholder="e.g. Vitamin Premix"
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                        />
                      </div>

                      {/* Remarks */}
                      <div className="space-y-1 col-span-2 sm:col-span-3">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Specific Remarks</label>
                        <input
                          type="text"
                          value={input.remarks ?? ''}
                          onChange={(e) => handleInputChange(sNum, 'remarks', e.target.value)}
                          placeholder="e.g. Feather picking noted"
                          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
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
    </div>
  );
}
