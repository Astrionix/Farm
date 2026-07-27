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
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { dbService, DBDailyEntry, DBShed, isChickShed } from '../services/db';
import { calculateShedMetrics, ShedDataInput } from '../utils/calculations';
import { SkeletonDailyEntry } from './SkeletonLoader';

interface DailyEntryProps {
  userRole: 'Owner' | 'Supervisor';
  assignedUnit: number;
}

const UNIT_COORDINATES: Record<number, { lat: number; lon: number }> = {
  1: { lat: 17.18, lon: 82.05 }, // Jaggampeta Unit 1
  2: { lat: 17.18, lon: 82.05 }, // Jaggampeta Unit 2
  3: { lat: 17.18, lon: 82.05 }, // Jaggampeta Unit 3
  4: { lat: 17.88, lon: 83.04 }, // Kotapadu
  5: { lat: 17.18701821929379, lon: 82.31389540958138 }, // Chebrolu
};

export default function DailyEntry({ userRole, assignedUnit }: DailyEntryProps) {
  const [selectedUnit, setSelectedUnit] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Environmental stats
  const [weather, setWeather] = useState<string>('Sunny');
  const [temperature, setTemperature] = useState<string>('31.5');
  const [apparentTemperature, setApparentTemperature] = useState<string>('');
  const [humidity, setHumidity] = useState<string>('60');
  const [generalRemarks, setGeneralRemarks] = useState<string>('');

  const [fetchingWeather, setFetchingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [medsOnlyFilter, setMedsOnlyFilter] = useState(false);

  const [shedsList, setShedsList] = useState<DBShed[]>([]);
  const [shedInputs, setShedInputs] = useState<Record<number, Partial<ShedDataInput>>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState(false);

  const [activeBatchEditShed, setActiveBatchEditShed] = useState<number | null>(null);
  const [expandedShed, setExpandedShed] = useState<number | null>(null);

  // Auto-expand first active shed slot
  useEffect(() => {
    if (shedsList.length > 0) {
      const firstActive = shedsList.find(s => s.status === 'Active')?.shedNumber;
      setExpandedShed(firstActive || shedsList[0].shedNumber);
    }
  }, [shedsList]);


  const [unitsList, setUnitsList] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    async function loadUnits() {
      const u = await dbService.getUnits();
      setUnitsList(u);
    }
    loadUnits();
  }, []);

  const getUnitShortName = (unitId: number) => {
    const full = unitsList.find(u => u.id === unitId)?.name;
    if (!full) return `U${unitId}`;
    if (full.includes('Jaggampeta')) return full.replace('Jaggampeta ', 'Jgp ');
    if (full.includes('Kotapadu')) return 'Kotapadu';
    return full;
  };



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
            const currentDbMode = dbService.getDbMode();
            const prevClosing = yesterdayEntry?.closingBirds ?? (currentDbMode === 'Live' ? 0 : 5000);
            // Auto-calculate bird age from batch placement date
            const autoAge = dbService.calculateBirdAge(selectedUnit, sNum, selectedDate);
            const prevAge = yesterdayEntry?.birdAgeWeeks ?? (currentDbMode === 'Live' ? 0 : (18 + sNum * 2));
            const resolvedAge = autoAge !== null ? autoAge : prevAge;

            inputsMap[sNum] = {
              status: shed.status,
              openingBirds: prevClosing,
              mortality: 0,
              culls: 0,
              closingBirds: prevClosing,
              feedKg: 0,
              waterLiters: 0,
              eggsCount: 0,
              eggWeightG: 0,
              uniformity: 0,
              bodyWeight: 0,
              medication: '',
              remarks: '',
              birdAgeWeeks: resolvedAge,
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

      // Sync capacity if editing openingBirds on the batch start date
      if (field === 'openingBirds') {
        const batchDetails = dbService.getBatchDetails(selectedUnit, shedNum);
        if (batchDetails && batchDetails.startDate === selectedDate) {
          dbService.setBatchDetails(selectedUnit, shedNum, { capacity: Number(value) });
        }
      }

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
            feedKg: Number(input.feedKg ?? 0),
            waterLiters: Number(input.waterLiters || (closing ? Math.round(closing * 0.116 * 2.0) : 0)),
            eggsCount: Number(input.eggsCount || 0),
            eggWeightG: Number(input.eggWeightG || 60.0),
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

  const handleAutoDetectWeather = async () => {
    const coords = UNIT_COORDINATES[selectedUnit];
    if (!coords) return;

    setFetchingWeather(true);
    setWeatherError('');

    try {
      // Query Open-Meteo API (Free, keyless, CORS supported, extremely reliable)
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code`);
      if (!res.ok) throw new Error('Failed to fetch weather');

      const resData = await res.json();
      const current = resData.current || {};

      if (current.temperature_2m !== undefined) {
        setTemperature(current.temperature_2m.toFixed(1));
      }
      if (current.apparent_temperature !== undefined) {
        setApparentTemperature(current.apparent_temperature.toFixed(1));
      }
      if (current.relative_humidity_2m !== undefined) {
        setHumidity(Math.round(current.relative_humidity_2m).toString());
      }
      if (current.weather_code !== undefined) {
        const code = current.weather_code;
        let mappedWeather = 'Sunny';
        
        // Open-Meteo WMO weather codes
        if (code === 0 || code === 1) {
          mappedWeather = 'Sunny';
        } else if (code === 2 || code === 3) {
          mappedWeather = 'Cloudy';
        } else if (code >= 51 && code <= 82) {
          mappedWeather = 'Rainy';
        } else {
          // If relative humidity is very high, classify as Humid, otherwise Sunny fallback
          const rh = current.relative_humidity_2m || 60;
          mappedWeather = rh > 75 ? 'Humid' : 'Sunny';
        }
        setWeather(mappedWeather);
      }
    } catch (err) {
      console.error('Error auto-detecting weather:', err);
      setWeatherError('Failed to auto-detect weather.');
    } finally {
      setFetchingWeather(false);
    }
  };

  // Trigger weather auto-detection for today's new entry
  useEffect(() => {
    if (!selectedDate) return;

    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate === todayStr) {
      dbService.getDailyEntries({ date: selectedDate, unitId: selectedUnit })
        .then(entries => {
          if (entries.length === 0) {
            const coords = UNIT_COORDINATES[selectedUnit];
            if (coords) {
              setFetchingWeather(true);
              const apiKey = process.env.NEXT_PUBLIC_TOMORROW_API_KEY || 'zMKQ3NtHPI3MWY3wWqJQfAHewuxwNZui';
              fetch(`https://api.tomorrow.io/v4/weather/realtime?location=${coords.lat},${coords.lon}&apikey=${apiKey}`)
                .then(res => {
                  if (res.ok) return res.json();
                  throw new Error();
                })
                .then(resData => {
                  const data = resData.data?.values || {};
                  if (data.temperature !== undefined) setTemperature(data.temperature.toFixed(1));
                  if (data.temperatureApparent !== undefined) setApparentTemperature(data.temperatureApparent.toFixed(1));
                  if (data.humidity !== undefined) setHumidity(Math.round(data.humidity).toString());
                  if (data.weatherCode !== undefined) {
                    const code = data.weatherCode;
                    let mappedWeather = 'Sunny';
                    if (code === 1000 || code === 1100) mappedWeather = 'Sunny';
                    else if (code >= 1001 && code <= 1102) mappedWeather = 'Cloudy';
                    else if ((code >= 4000 && code <= 4201) || code === 8000) mappedWeather = 'Rainy';
                    else if (code === 2000 || code === 2100) mappedWeather = 'Humid';
                    setWeather(mappedWeather);
                  }
                })
                .catch(() => { })
                .finally(() => setFetchingWeather(false));
            }
          }
        });
    }
  }, [selectedDate, selectedUnit]);


  // Daily Summary Aggregates for form inputs
  const totalShedEggs = Object.values(shedInputs).reduce((sum, input) => input.status === 'Active' ? sum + Number(input.eggsCount || 0) : sum, 0);
  const totalShedMortality = Object.values(shedInputs).reduce((sum, input) => input.status === 'Active' ? sum + Number(input.mortality || 0) : sum, 0);
  const totalShedFeed = Object.values(shedInputs).reduce((sum, input) => input.status === 'Active' ? sum + Number(input.feedKg || 0) : sum, 0);
  const totalShedClosingBirds = Object.values(shedInputs).reduce((sum, input) => input.status === 'Active' ? sum + Number(input.closingBirds || 0) : sum, 0);
  const dailyHDPct = totalShedClosingBirds > 0 ? (totalShedEggs / totalShedClosingBirds) * 100 : 0;


  if (loading) {
    return <SkeletonDailyEntry />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Sticky Page Header ─────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 pt-4 pb-0 md:px-6 md:pt-6 shrink-0">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg md:text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white leading-tight">
              {userRole === 'Supervisor' ? 'Daily Entry Portal' : 'Daily Entry Portal'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              {unitsList.find(u => u.id === selectedUnit)?.name || `Unit ${selectedUnit}`}
            </p>
          </div>
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
                {u.name.replace('Jaggampeta ', 'J. ')}
                {selectedUnit === u.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary dark:bg-secondary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Scrollable Content ─────────────────────── */}
      <div className="flex-1 overflow-x-hidden p-4 md:p-6 space-y-4">

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm uppercase tracking-wider">
              Environmental Conditions
            </h3>
            <button
              type="button"
              onClick={handleAutoDetectWeather}
              disabled={fetchingWeather}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 disabled:opacity-50"
            >
              <CloudSun className={`w-3.5 h-3.5 ${fetchingWeather ? 'animate-spin' : ''}`} />
              {fetchingWeather ? 'Detecting...' : 'Auto-detect Weather'}
            </button>
          </div>

          {weatherError && (
            <p className="text-[10px] text-red-500 font-bold mb-3">{weatherError}</p>
          )}

          <div className="flex flex-wrap items-end gap-4">
            {/* Date Pick */}
            <div className="space-y-1.5 w-full sm:w-auto min-w-[150px] sm:max-w-[170px]">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Log Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                  required
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Weather Pick */}
            <div className="space-y-1.5 w-full sm:w-auto min-w-[140px] sm:max-w-[160px]">
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
            <div className="space-y-1.5 w-full sm:w-auto min-w-[150px] sm:max-w-[180px]">
              <div className="flex items-center justify-between gap-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block whitespace-nowrap">Temperature (°C)</label>
                {apparentTemperature && (
                  <span className="text-[8.5px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded-md whitespace-nowrap">
                    Feels {apparentTemperature}°C
                  </span>
                )}
              </div>
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
            <div className="space-y-1.5 w-full sm:w-auto min-w-[130px] sm:max-w-[150px]">
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
        <div className="bg-gradient-to-r from-primary to-primary-light text-white p-5 rounded-2xl border border-primary-light/10 shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-5 animate-slide-up">
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-emerald-100">Live Entry Draft Summary</h3>
            <p className="text-[10px] text-emerald-250/70 font-black tracking-wide mt-1">Aggregated values of active sheds before submission</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 max-w-2xl">
            <div className="bg-primary-dark/25 px-3 py-2 rounded-xl border border-white/5">
              <span className="text-[9px] text-emerald-250/50 block font-bold uppercase tracking-wider">Total Eggs</span>
              <span className="text-sm font-black tracking-tight">{totalShedEggs.toLocaleString()}</span>
            </div>
            <div className="bg-primary-dark/25 px-3 py-2 rounded-xl border border-white/5">
              <span className="text-[9px] text-emerald-250/50 block font-bold uppercase tracking-wider">Hen-Day Avg</span>
              <span className="text-sm font-black tracking-tight">{dailyHDPct.toFixed(1)}%</span>
            </div>
            <div className="bg-primary-dark/25 px-3 py-2 rounded-xl border border-white/5">
              <span className="text-[9px] text-emerald-250/50 block font-bold uppercase tracking-wider">Total Feed</span>
              <span className="text-sm font-black tracking-tight">{totalShedFeed.toLocaleString()} kg</span>
            </div>
            <div className="bg-primary-dark/25 px-3 py-2 rounded-xl border border-white/5">
              <span className="text-[9px] text-emerald-250/50 block font-bold uppercase tracking-wider">Total Mortality</span>
              <span className="text-sm font-black tracking-tight text-red-350">{totalShedMortality} birds</span>
            </div>
          </div>
        </div>

        {/* Shed Cards Row */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base">Shed Sheets Logs</h3>
              <p className="text-slate-400 text-xs font-semibold">Log poultry metrics for each active shed slot below.</p>
            </div>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full uppercase tracking-wider">{shedsList.length} slots active</span>
          </div>

          <div className="space-y-3.5">
            {shedsList.map(shed => {
              const sNum = shed.shedNumber;
              const input = shedInputs[sNum] || {};
              const isActive = input.status === 'Active';
              const isExpanded = expandedShed === sNum;

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
                  className={`bg-white dark:bg-slate-900 rounded-2xl border ${
                    isActive 
                      ? 'border-slate-100 dark:border-slate-800 shadow-premium' 
                      : 'border-dashed border-slate-200 dark:border-slate-800 opacity-60'
                  } transition-all duration-300 overflow-hidden`}
                >
                  {/* Collapsible Accordion Header */}
                  <div
                    onClick={() => {
                      if (isActive) {
                        setExpandedShed(isExpanded ? null : sNum);
                      }
                    }}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none ${
                      isActive ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                        isActive ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {sNum}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-850 dark:text-white leading-tight">
                          {isChickShed(selectedUnit, sNum) ? 'Chick Shed' : `Shed ${sNum}`}
                        </h4>
                        {(() => {
                          const batchDate = dbService.getBatchDate(selectedUnit, sNum);
                          const ageFull = dbService.calculateBirdAgeFull(selectedUnit, sNum, selectedDate);
                          return batchDate && ageFull ? (
                            <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 block mt-0.5 uppercase tracking-wide">
                              🐣 {ageFull.weeks}w {ageFull.days}d · Placed: {new Date(batchDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                            </span>
                          ) : (
                            <span className={`text-[9px] font-bold ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                              {isActive ? 'Active and Running' : 'Slot Inactive'}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Inline summary when collapsed */}
                    <div className="flex items-center gap-4 ml-auto sm:ml-0">
                      {isActive && !isExpanded && (
                        <div className="bg-slate-50 dark:bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80 flex items-center gap-4 text-[10px] font-bold text-slate-450 uppercase tracking-wide animate-fade-in">
                          <div>
                            Eggs: <span className="text-slate-800 dark:text-slate-200 font-black">{Number(input.eggsCount || 0).toLocaleString()}</span>
                          </div>
                          <div>
                            HD: <span className="text-slate-800 dark:text-slate-200 font-black">{previewHDPct}%</span>
                          </div>
                          <div>
                            FCR: <span className="text-primary dark:text-primary-light font-black">{previewFCR}</span>
                          </div>
                          <div>
                            Score: <span className={`font-black uppercase ${
                              previewScore >= 90 ? 'text-primary' : previewScore >= 70 ? 'text-blue-500' : 'text-red-500'
                            }`}>{previewScore}</span>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusToggle(sNum);
                          if (!isActive) {
                            setExpandedShed(sNum);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition border cursor-pointer ${isActive
                            ? 'bg-red-50 hover:bg-red-100 text-red-500 border-red-200'
                            : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20'
                          }`}
                      >
                        {isActive ? 'Disable' : 'Enable'}
                      </button>

                      {isActive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveBatchEditShed(activeBatchEditShed === sNum ? null : sNum);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition cursor-pointer ${
                            activeBatchEditShed === sNum
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-amber-50/70 hover:bg-amber-100 text-amber-700 border-amber-200'
                          }`}
                        >
                          Batch
                        </button>
                      )}

                      {isActive && (
                        <div className="text-slate-400 dark:text-slate-600 transition-transform duration-200">
                          {isExpanded ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Batch configuration block inside collapsed/expanded area */}
                  {isActive && activeBatchEditShed === sNum && (
                    <div className="mx-5 mb-5 p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-4 animate-slide-up">
                      <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800/80 pb-2">
                        <span className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          🐣 Shed {sNum} Batch Setup
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveBatchEditShed(null)}
                          className="text-[9px] text-amber-700 dark:text-amber-450 hover:underline font-bold uppercase tracking-wider"
                        >
                          Close
                        </button>
                      </div>
                      
                      {(() => {
                        const batchDetails = dbService.getBatchDetails(selectedUnit, sNum) || {
                          startDate: '',
                          breedType: 'BV300 Premium',
                          placementAgeWeeks: 0,
                          capacity: 5000
                        };
                        const standardBreeds = ['BV300 Premium', 'Hy-Line Brown', 'Lohmann Sandy', 'Dekalb White'];
                        const isCustomBreed = batchDetails.breedType && !standardBreeds.includes(batchDetails.breedType);
                        const selectValue = isCustomBreed ? 'Other' : (batchDetails.breedType || 'BV300 Premium');

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Start Date */}
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Start Date</label>
                              <input
                                type="date"
                                value={batchDetails.startDate || ''}
                                onChange={(e) => {
                                  const dateVal = e.target.value;
                                  dbService.setBatchDetails(selectedUnit, sNum, { startDate: dateVal });
                                  
                                  // Sync capacity if the start date is set to the current logging date
                                  if (dateVal === selectedDate) {
                                    const currentOpening = Number(shedInputs[sNum]?.openingBirds || 0);
                                    if (currentOpening > 0) {
                                      dbService.setBatchDetails(selectedUnit, sNum, { capacity: currentOpening });
                                    }
                                  }
                                  setShedInputs(prev => ({ ...prev }));
                                  window.dispatchEvent(new Event('batch-date-changed'));
                                }}
                                onClick={(e) => e.currentTarget.showPicker?.()}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                                required
                              />
                            </div>

                            {/* Breed Type Dropdown */}
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Breed Type</label>
                              <select
                                value={selectValue}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'Other') {
                                    dbService.setBatchDetails(selectedUnit, sNum, { breedType: 'Custom Breed' });
                                  } else {
                                    dbService.setBatchDetails(selectedUnit, sNum, { breedType: val });
                                  }
                                  setShedInputs(prev => ({ ...prev }));
                                }}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary cursor-pointer"
                              >
                                {standardBreeds.map(b => (
                                  <option key={b} value={b}>{b}</option>
                                ))}
                                <option value="Other">Other (Custom)...</option>
                              </select>

                              {/* Custom Breed Type input field */}
                              {isCustomBreed && (
                                <input
                                  type="text"
                                  placeholder="Type Breed Name..."
                                  value={batchDetails.breedType === 'Custom Breed' ? '' : batchDetails.breedType}
                                  onChange={(e) => {
                                    dbService.setBatchDetails(selectedUnit, sNum, { breedType: e.target.value || 'Custom Breed' });
                                    setShedInputs(prev => ({ ...prev }));
                                  }}
                                  className="w-full px-2.5 py-1.5 mt-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                                />
                              )}
                            </div>

                            {/* Placement Age Weeks */}
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Placement Age (Weeks)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0"
                                value={batchDetails.placementAgeWeeks}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  dbService.setBatchDetails(selectedUnit, sNum, { placementAgeWeeks: isNaN(val) ? 0 : val });
                                  setShedInputs(prev => ({ ...prev }));
                                  window.dispatchEvent(new Event('batch-date-changed'));
                                }}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                              />
                            </div>

                            {/* Capacity Limit */}
                            <div className="space-y-1">
                              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Capacity (Birds)</label>
                              <input
                                type="number"
                                min="1"
                                max="100000"
                                placeholder="e.g. 5000"
                                value={batchDetails.capacity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  const parsedVal = isNaN(val) ? 5000 : val;
                                  dbService.setBatchDetails(selectedUnit, sNum, { capacity: parsedVal });
                                  
                                  // Sync opening birds input if we are on the start date
                                  if (batchDetails.startDate === selectedDate) {
                                    handleInputChange(sNum, 'openingBirds', parsedVal);
                                  } else {
                                    setShedInputs(prev => ({ ...prev }));
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Input Form Grid (Rendered only if Active & Expanded) */}
                  {isActive && isExpanded && (
                    <div className="p-5 border-t border-slate-100 dark:border-slate-800/80 space-y-4 bg-slate-50/50 dark:bg-slate-950/20 animate-slide-up">
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                        {/* Opening Birds */}
                        <div className="space-y-1.5 flex flex-col justify-end h-full">
                          <label className="text-[10px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider block">Opening Birds</label>
                          <input
                            type="number"
                            value={input.openingBirds ?? 0}
                            onChange={(e) => handleInputChange(sNum, 'openingBirds', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                            required
                          />
                        </div>

                        {/* Mortality */}
                        <div className="space-y-1.5 flex flex-col justify-end h-full">
                          <label className="text-[10px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider block">Mortality</label>
                          <input
                            type="number"
                            value={input.mortality ?? 0}
                            onChange={(e) => handleInputChange(sNum, 'mortality', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                          />
                        </div>

                        {/* Culls */}
                        <div className="space-y-1.5 flex flex-col justify-end h-full">
                          <label className="text-[10px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider block">Culls</label>
                          <input
                            type="number"
                            value={input.culls ?? 0}
                            onChange={(e) => handleInputChange(sNum, 'culls', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                          />
                        </div>

                        {/* Closing Birds (Calculated Indicator) */}
                        <div className="space-y-1.5 flex flex-col justify-end h-full">
                          <label className="text-[10px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider block">Closing Birds</label>
                          <div className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-black text-slate-500 dark:text-slate-400">
                            {(input.closingBirds ?? 0).toLocaleString()}
                          </div>
                        </div>

                        {/* Bird Age (Weeks + Days) - Auto from batch date */}
                        {(() => {
                          const ageFull = dbService.calculateBirdAgeFull(selectedUnit, sNum, selectedDate);
                          const hasAuto = ageFull !== null;
                          return (
                            <div className="space-y-1.5 flex flex-col justify-end h-full">
                              <label className="text-[10px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                <span>Bird Age</span>
                                {hasAuto && <span className="text-[7.5px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full font-black normal-case shrink-0">Auto</span>}
                              </label>
                              {hasAuto && ageFull ? (
                                <div className="w-full px-3 py-2 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl text-xs font-black text-primary flex items-center justify-between">
                                  <span>{ageFull.weeks}w {ageFull.days}d</span>
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  value={input.birdAgeWeeks ?? 0}
                                  onChange={(e) => handleInputChange(sNum, 'birdAgeWeeks', Number(e.target.value))}
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                  required
                                />
                              )}
                            </div>
                          );
                        })()}

                        {/* Feed Consumed (kg) + Days Covered */}
                        {(input as Record<string, unknown>).__noFeedToday ? (
                          <div className="space-y-1.5 col-span-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider block">Feed (kg)</label>
                              <button
                                type="button"
                                onClick={() => {
                                  const isNoFeed = (input as Record<string, unknown>).__noFeedToday;
                                  setShedInputs(prev => ({
                                    ...prev,
                                    [sNum]: { ...prev[sNum], feedKg: 0, __noFeedToday: !isNoFeed } as never
                                  }));
                                }}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border transition-all cursor-pointer bg-amber-100 dark:bg-amber-900/30 border-amber-400/60 text-amber-700 dark:text-amber-400"
                              >
                                🚫 No Feed Today
                              </button>
                            </div>
                            <div className="w-full px-3 py-2 bg-amber-50/60 dark:bg-amber-900/10 border border-dashed border-amber-300 dark:border-amber-800/50 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-500 text-center">
                              No feed given — will record as 0 kg
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-1.5 flex flex-col justify-end h-full">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider block">Feed (kg)</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const isNoFeed = (input as Record<string, unknown>).__noFeedToday;
                                    setShedInputs(prev => ({
                                      ...prev,
                                      [sNum]: { ...prev[sNum], feedKg: 0, __noFeedToday: !isNoFeed } as never
                                    }));
                                  }}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border transition-all cursor-pointer bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-amber-400 hover:text-amber-600"
                                >
                                  ✓ Feed Given
                                </button>
                              </div>
                              <input
                                type="number"
                                min={0}
                                value={input.feedKg ?? ''}
                                placeholder="Total kg"
                                onChange={(e) => handleInputChange(sNum, 'feedKg', Number(e.target.value))}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                              />
                            </div>
                            
                            <div className="space-y-1.5 flex flex-col justify-end h-full">
                              <label className="text-[10px] text-transparent font-bold uppercase tracking-wider block select-none h-[15px]">Days</label>
                              <div className="relative w-full" title="Days Covered by this feed">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">For Days:</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={14}
                                  value={input.feedDaysCovered ?? 1}
                                  onChange={(e) => handleInputChange(sNum, 'feedDaysCovered', Number(e.target.value))}
                                  className="w-full pl-14 pr-2 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {/* Eggs Collected */}
                        <div className="space-y-1.5 flex flex-col justify-end h-full">
                          <label className="text-[10px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider block">Eggs Collected</label>
                          <input
                            type="number"
                            value={input.eggsCount ?? 0}
                            onChange={(e) => handleInputChange(sNum, 'eggsCount', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                            required
                          />
                        </div>
                      </div>

                       {/* Remarks & Treatment Row */}
                       {(() => {
                         const standardMeds = ['None', 'Newcastle ND LaSota Vaccine', 'Infectious Bronchitis (IB) Vaccine', 'Soluble Tetracycline', 'Dewormer (Piperazine)', 'B-Complex Vitamins', 'Electrolytes (Summer Heat Stress)', 'Calcium & Vitamin D3'];
                         const standardRemarksOptions = ['No remarks recorded for this day.', 'Flock behavior and activity normal.', 'Slight feed wastage observed near troughs.', 'Water lines flushed and sanitized.', 'Heat stress observed - increased ventilation fans.', 'Mild diarrhea symptoms - treatment started.', 'Egg shell quality optimal.'];
                         
                         const currentMed = input.medication || 'None';
                         const isCustomMed = currentMed !== '' && currentMed !== 'None' && !standardMeds.includes(currentMed);
                         const selectMedVal = isCustomMed ? 'Other' : currentMed;

                         const currentRemark = input.remarks || 'No remarks recorded for this day.';
                         const isCustomRemark = currentRemark !== '' && currentRemark !== 'No remarks recorded for this day.' && !standardRemarksOptions.includes(currentRemark);
                         const selectRemarkVal = isCustomRemark ? 'Other' : currentRemark;

                         return (
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200/50 dark:border-slate-800/80 pt-3">
                             {/* Medication Select */}
                             <div className="space-y-1.5">
                               <label className="text-[10px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider block">Medication Administered</label>
                               <select
                                 value={selectMedVal}
                                 onChange={(e) => {
                                   const val = e.target.value;
                                   if (val === 'Other') {
                                     handleInputChange(sNum, 'medication', 'Custom Medication');
                                   } else {
                                     handleInputChange(sNum, 'medication', val === 'None' ? '' : val);
                                   }
                                 }}
                                 className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary cursor-pointer"
                               >
                                 {standardMeds.map(m => (
                                   <option key={m} value={m}>{m}</option>
                                 ))}
                                 <option value="Other">Other (Custom)...</option>
                               </select>
                               {isCustomMed && (
                                 <input
                                   type="text"
                                   placeholder="Type Custom Medication..."
                                   value={currentMed === 'Custom Medication' ? '' : currentMed}
                                   onChange={(e) => handleInputChange(sNum, 'medication', e.target.value || 'Custom Medication')}
                                   className="w-full px-3 py-2 mt-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/80 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                                 />
                               )}
                             </div>

                             {/* Shed Remarks Select */}
                             <div className="space-y-1.5">
                               <label className="text-[10px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider block">Shed Remarks</label>
                               <select
                                 value={selectRemarkVal}
                                 onChange={(e) => {
                                   const val = e.target.value;
                                   if (val === 'Other') {
                                     handleInputChange(sNum, 'remarks', 'Custom Remark');
                                   } else {
                                     handleInputChange(sNum, 'remarks', val === 'No remarks recorded for this day.' ? '' : val);
                                   }
                                 }}
                                 className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary cursor-pointer"
                               >
                                 {standardRemarksOptions.map(r => (
                                   <option key={r} value={r}>{r}</option>
                                 ))}
                                 <option value="Other">Other (Custom)...</option>
                               </select>
                               {isCustomRemark && (
                                 <input
                                   type="text"
                                   placeholder="Type Custom Remarks..."
                                   value={currentRemark === 'Custom Remark' ? '' : currentRemark}
                                   onChange={(e) => handleInputChange(sNum, 'remarks', e.target.value || 'Custom Remark')}
                                   className="w-full px-3 py-2 mt-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/80 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                                 />
                               )}
                             </div>
                           </div>
                         );
                       })()}
                    </div>
                  )}

                  {/* Slot Inactive Placeholder */}
                  {!isActive && (
                    <div className="p-5 text-center text-xs font-bold italic text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/80">
                      Shed slot currently inactive. Click enable status to permit daily log entries.
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
    </div>
  );
}
