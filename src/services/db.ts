// Unified Data Layer for Sri Mahalakshmi Poultry AI ERP
// Falls back to LocalStorage if Supabase environment variables are missing.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { calculateShedMetrics, calculateUnitMetrics, calculateFarmMetrics, ShedDataInput, CalculatedShedMetrics } from '../utils/calculations';

export function isChickShed(unitId: number, shedNumber: number): boolean {
  return (unitId === 6 && shedNumber === 1) || // New Chick Shed Unit (1 shed)
         (unitId === 4 && shedNumber === 12);
}

// -------------------------------------------------------------
// ENVIRONMENT & CREDENTIALS
// -------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';

export let supabaseClient: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// -------------------------------------------------------------
// DATA INTERFACES
// -------------------------------------------------------------
export interface DBUnit {
  id: number;
  name: string;
  status: 'Active' | 'Not In Use';
}

export interface DBShed {
  unitId: number;
  shedNumber: number;
  status: 'Active' | 'Not In Use';
}

export interface DBShedBatchDetails {
  startDate: string;
  breedType: string;
  placementAgeWeeks: number;
  capacity: number;
}

export interface DBDailyEntry extends ShedDataInput, CalculatedShedMetrics {
  id: string;
  date: string;
  unitId: number;
  shedNumber: number;
  weather: string;
  temperature: number;
  humidity: number;
}

export interface DBInventoryItem {
  id: string;
  category: 'Feed' | 'Medicines' | 'Vaccines' | 'Egg Trays' | 'Packaging' | 'Chemicals';
  itemName: string;
  stockLevel: number;
  reorderLevel: number;
  uom: string;
  supplier: string;
  expiryDate: string | null;
}

export interface DBInventoryTransaction {
  id: string;
  inventoryId: string;
  transactionType: 'Purchase' | 'Consumption' | 'Adjustment';
  quantity: number;
  date: string;
  reference: string;
  remarks: string;
}

export interface DBNotification {
  id: string;
  date: string;
  role: 'Owner' | 'Supervisor' | 'All';
  type: 'Alert' | 'Warning' | 'Info' | 'Success';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// -------------------------------------------------------------
// LOCAL STATE STORAGE ENGINE
// -------------------------------------------------------------
// Only config/session keys stored locally — all data lives in Supabase
const STORAGE_KEYS = {
  USER_ROLE: 'smp_user_role',
  ASSIGNED_UNIT: 'smp_assigned_unit',
  BATCH_DATES: 'smp_batch_dates', // { "unitId-shedNumber": "YYYY-MM-DD" }
};

export const UNIT_CONFIGS = [
  { id: 1, name: 'Jaggampeta Unit 1', shedsCount: 6, status: 'Active' as const },
  { id: 2, name: 'Jaggampeta Unit 2', shedsCount: 7, status: 'Active' as const },
  { id: 3, name: 'Jaggampeta Unit 3', shedsCount: 3, status: 'Active' as const },
  { id: 6, name: 'Chick Shed Unit', shedsCount: 1, status: 'Active' as const }, // Moved directly after Unit 3
  { id: 4, name: 'Kotapadu', shedsCount: 12, status: 'Active' as const },
  { id: 5, name: 'Chebrolu', shedsCount: 2, status: 'Active' as const },
];

// Seeding 30 Days of high fidelity historical data
function generateHistoricalMockData() {
  const units: DBUnit[] = UNIT_CONFIGS.map(uc => ({ id: uc.id, name: uc.name, status: uc.status }));

  const sheds: DBShed[] = [];
  UNIT_CONFIGS.forEach(uc => {
    for (let s = 1; s <= uc.shedsCount; s++) {
      sheds.push({
        unitId: uc.id,
        shedNumber: s,
        status: 'Active',
      });
    }
  });

  // Set up default inventory
  const inventory: DBInventoryItem[] = [
    {
      id: 'inv-feed-1',
      category: 'Feed',
      itemName: 'Layer Feed MaxPlus',
      stockLevel: 7850,
      reorderLevel: 2000,
      uom: 'kg',
      supplier: 'Kargil Poultry Feeds Ltd',
      expiryDate: null,
    },
    {
      id: 'inv-feed-2',
      category: 'Feed',
      itemName: 'Pre-Lay Starter Crumble',
      stockLevel: 1500,
      reorderLevel: 500,
      uom: 'kg',
      supplier: 'Kargil Poultry Feeds Ltd',
      expiryDate: null,
    },
    {
      id: 'inv-med-1',
      category: 'Medicines',
      itemName: 'Amprolium Dewormer 9.6%',
      stockLevel: 32.5,
      reorderLevel: 8.0,
      uom: 'liters',
      supplier: 'VetCare India Labs',
      expiryDate: '2027-04-18',
    },
    {
      id: 'inv-vac-1',
      category: 'Vaccines',
      itemName: 'Newcastle ND LaSota (1000 doses)',
      stockLevel: 14,
      reorderLevel: 4,
      uom: 'vials',
      supplier: 'Indovax Bio',
      expiryDate: '2026-11-20',
    },
    {
      id: 'inv-tray-1',
      category: 'Egg Trays',
      itemName: 'Premium Molded Fiber Paper Trays',
      stockLevel: 5800,
      reorderLevel: 1500,
      uom: 'units',
      supplier: 'Sri Lakshmi Paper Products',
      expiryDate: null,
    },
    {
      id: 'inv-pack-1',
      category: 'Packaging',
      itemName: 'Recycled Egg Cartons (12 Eggs Size)',
      stockLevel: 1850,
      reorderLevel: 400,
      uom: 'units',
      supplier: 'Carton Works Co.',
      expiryDate: null,
    },
    {
      id: 'inv-chem-1',
      category: 'Chemicals',
      itemName: 'Virkon S Bio-Disinfectant Powder',
      stockLevel: 45.0,
      reorderLevel: 10.0,
      uom: 'kg',
      supplier: 'Antec Chemical Solutions',
      expiryDate: '2027-08-10',
    },
  ];

  const inventoryTransactions: DBInventoryTransaction[] = [
    {
      id: 't-init-1',
      inventoryId: 'inv-feed-1',
      transactionType: 'Purchase',
      quantity: 12000,
      date: '2026-06-18',
      reference: 'INV-55212',
      remarks: 'Bulk layer feed purchase for the month',
    },
    {
      id: 't-init-2',
      inventoryId: 'inv-med-1',
      transactionType: 'Purchase',
      quantity: 40,
      date: '2026-06-18',
      reference: 'INV-55215',
      remarks: 'Amprolium solution order',
    },
    {
      id: 't-init-3',
      inventoryId: 'inv-tray-1',
      transactionType: 'Purchase',
      quantity: 8000,
      date: '2026-06-20',
      reference: 'INV-55310',
      remarks: 'Paper egg trays delivery',
    },
  ];

  const dailyEntries: DBDailyEntry[] = [];
  const notifications: DBNotification[] = [];

  // Generate 30 days of data
  const today = new Date();
  const weatherOptions = ['Sunny', 'Cloudy', 'Humid', 'Rainy'];
  
  // Starting bird flock sizes per active shed (roughly around 4800 to 5200)
  const initialBirdCount: Record<string, number> = {};
  sheds.forEach(s => {
    if (s.status === 'Active') {
      initialBirdCount[`${s.unitId}-${s.shedNumber}`] = 4900 + Math.floor(Math.random() * 250);
    }
  });

  // Track dynamic current bird counts as we advance in days
  const currentBirdCounts = { ...initialBirdCount };

  for (let d = 30; d >= 0; d--) {
    const currentDate = new Date();
    currentDate.setDate(today.getDate() - d);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Weather environment variables per day
    const weather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
    let temp = 28 + Math.random() * 6; // 28 - 34 deg C
    let humidity = 55 + Math.random() * 30; // 55% - 85%
    if (weather === 'Rainy') {
      temp = 24 + Math.random() * 3;
      humidity = 80 + Math.random() * 15;
    } else if (weather === 'Sunny') {
      temp = 32 + Math.random() * 4;
      humidity = 40 + Math.random() * 15;
    }

    let dailyFeedConsumptionTotal = 0;
    let dailyEggsHarvestedTotal = 0;

    // For each active shed
    sheds.forEach(shed => {
      const u = shed.unitId;
      const s = shed.shedNumber;
      const isShedActive = shed.status === 'Active';
      if (!isShedActive) return;

      const shedKey = `${u}-${s}`;
      const opening = currentBirdCounts[shedKey];
      
      // Random mortality (usually 0, 1, or 2 birds per day per shed. Occasionally a bit more)
      let mortality = 0;
      const randMort = Math.random();
      if (randMort > 0.96) {
        mortality = 4 + Math.floor(Math.random() * 4); // Spike!
      } else if (randMort > 0.85) {
        mortality = 2;
      } else if (randMort > 0.5) {
        mortality = 1;
      }
      
      // Culls
      const culls = Math.random() > 0.92 ? 1 + Math.floor(Math.random() * 2) : 0;
      const closing = opening - mortality - culls;
      currentBirdCounts[shedKey] = closing;

      // Feed consumption in kg (usually ~112 - 120 grams per bird per day)
      const avgFeedPerBirdG = 112 + Math.random() * 8; // g
      const feedKg = (closing * avgFeedPerBirdG) / 1000;
      dailyFeedConsumptionTotal += feedKg;

      // Water consumption in Liters (usually 2 to 2.2 times feed in weight, i.e., ~220 - 250 ml/bird)
      const waterRatio = 1.9 + Math.random() * 0.3;
      const waterLiters = feedKg * waterRatio;

      // Egg Production (Hen-day rate usually 88% - 93% in peak, standard aging is fine)
      // Let's create an production anomaly in Unit 3, Shed 2 around 12 days ago to simulate issues
      let productionRate = 0.89 + (Math.random() * 0.04); // 89% - 93%
      
      if (u === 3 && s === 2 && d < 15 && d > 8) {
        // Trigger drop: disease or feed issue
        productionRate = 0.72 + (Math.random() * 0.05); // Drop to 72% - 77%
      }
      
      const eggsCount = Math.floor(closing * productionRate);
      dailyEggsHarvestedTotal += eggsCount;

      // Egg average weight in grams (~58 - 63 grams)
      const eggWeightG = 59.5 + Math.random() * 2.5;

      // Uniformity % (~82 - 88%)
      const uniformity = 83 + Math.random() * 5;

      // Body Weight in grams (~1620 - 1730g)
      const bodyWeight = 1640 + Math.floor(Math.random() * 80);

      // Medications
      let medication = '';
      if (mortality > 3) {
        medication = 'Tetracycline HCL (soluble)';
      }

      // Calculations
      const inputMetrics: ShedDataInput = {
        status: 'Active',
        openingBirds: opening,
        mortality,
        culls,
        closingBirds: closing,
        feedKg,
        waterLiters,
        eggsCount,
        eggWeightG,
        uniformity,
        bodyWeight,
        birdAgeWeeks: 18 + s * 2,
      };

      const calculated = calculateShedMetrics(inputMetrics);

      dailyEntries.push({
        id: `entry-${dateStr}-${u}-${s}`,
        date: dateStr,
        unitId: u,
        shedNumber: s,
        weather,
        temperature: Number(temp.toFixed(1)),
        humidity: Number(humidity.toFixed(1)),
        ...inputMetrics,
        ...calculated,
        medication,
        remarks: mortality > 3 ? 'Slightly higher mortality. Initiated preventive antibiotics.' : '',
      });

      const unitName = units.find(unit => unit.id === u)?.name || `Unit ${u}`;
      const shedName = isChickShed(u, s) ? 'Chick Shed' : `Shed ${s}`;

      // Add anomaly notifications for Owner dashboard
      if (d === 12 && u === 3 && s === 2) {
        notifications.push({
          id: `notif-${dateStr}-prod-drop`,
          date: dateStr,
          role: 'Owner',
          type: 'Warning',
          title: 'Significant Production Drop',
          message: `${unitName}, ${shedName} reported a production decline below breed standard (HD% fell to 73.1%).`,
          isRead: false,
          createdAt: new Date(currentDate.getTime() + 18 * 60 * 60 * 1000).toISOString(), // 6PM
        });
      }
      
      if (mortality > 5) {
        notifications.push({
          id: `notif-${dateStr}-mort-spike-${u}-${s}`,
          date: dateStr,
          role: 'Owner',
          type: 'Alert',
          title: `Mortality Spike in ${unitName} ${shedName}`,
          message: `Mortality spike: ${mortality} birds died in ${unitName}, ${shedName} on ${dateStr}.`,
          isRead: false,
          createdAt: new Date(currentDate.getTime() + 17 * 60 * 60 * 1000).toISOString(),
        });
      }
    });

    // Deduct feed and egg packaging trays daily from inventory
    // 1 egg tray holds 30 eggs
    const traysUsed = Math.ceil(dailyEggsHarvestedTotal / 30);
    const cartonsUsed = Math.ceil(dailyEggsHarvestedTotal * 0.1 / 12); // Assume 10% boxed in premium cartons

    inventory[0].stockLevel = Math.max(0, inventory[0].stockLevel - dailyFeedConsumptionTotal);
    inventory[4].stockLevel = Math.max(0, inventory[4].stockLevel - traysUsed);
    inventory[5].stockLevel = Math.max(0, inventory[5].stockLevel - cartonsUsed);

    // Seed automatic purchases in transaction history if stock falls below reorder
    if (inventory[0].stockLevel < inventory[0].reorderLevel) {
      const feedBuyAmount = 10000;
      inventory[0].stockLevel += feedBuyAmount;
      inventoryTransactions.push({
        id: `t-feed-buy-${dateStr}`,
        inventoryId: 'inv-feed-1',
        transactionType: 'Purchase',
        quantity: feedBuyAmount,
        date: dateStr,
        reference: `INV-AUTO-${d}`,
        remarks: 'Automatic replenishment: Stock fell below safety reorder level.',
      });
      notifications.push({
        id: `notif-${dateStr}-auto-buy`,
        date: dateStr,
        role: 'All',
        type: 'Success',
        title: 'Feed Restocked Automatically',
        message: `Layer Feed stock level reordered. Purchased ${feedBuyAmount} kg from Cargill Solutions.`,
        isRead: d > 1, // Read for historical
        createdAt: new Date(currentDate.getTime() + 8 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  // Pre-seed some active pending notifications for today
  notifications.push(
    {
      id: 'notif-pending-u4',
      date: today.toISOString().split('T')[0],
      role: 'Owner',
      type: 'Info',
      title: 'Pending Daily Entry',
      message: 'Kotapadu daily production entries are pending supervisor approval.',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif-low-vac',
      date: today.toISOString().split('T')[0],
      role: 'Owner',
      type: 'Warning',
      title: 'Low Vaccine Inventory',
      message: 'Newcastle ND LaSota Vaccine stock (14 vials) is close to reorder levels.',
      isRead: false,
      createdAt: new Date().toISOString(),
    }
  );

  return {
    units,
    sheds,
    dailyEntries,
    inventory,
    inventoryTransactions,
    notifications,
  };
}

// Promise timeout race wrapper to prevent UI hanging on slow/unresolved network queries
async function withTimeout<T>(promise: PromiseLike<T> | Promise<T>, ms = 8000): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Network request timed out'));
    }, ms);
  });
  
  return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

// -------------------------------------------------------------
// CLIENT API INTERFACE (SUPABASE / LOCALSTORAGE HYBRID)
// -------------------------------------------------------------
export const dbService = {
  // Initialize state — also silently purges notifications older than 90 days
  init: () => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(STORAGE_KEYS.USER_ROLE)) {
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, 'Owner');
      localStorage.setItem(STORAGE_KEYS.ASSIGNED_UNIT, '1');
    }
    // Run notification cleanup in the background — non-blocking
    dbService.cleanupOldNotifications(90).catch(() => {});
  },

  // DB Mode Access
  getDbMode: (): 'Demo' | 'Live' => {
    return 'Live';
  },

  clearAllData: async (_mode?: 'Demo' | 'Live'): Promise<void> => {
    if (typeof window === 'undefined') return;
    dbService.init();
    window.dispatchEvent(new Event('storage-role-change'));
  },

  // Role Access
  getUserRole: (): 'Owner' | 'Supervisor' => {
    if (typeof window === 'undefined') return 'Owner';
    dbService.init();
    return (localStorage.getItem(STORAGE_KEYS.USER_ROLE) as 'Owner' | 'Supervisor') || 'Owner';
  },

  setUserRole: (role: 'Owner' | 'Supervisor') => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
    window.dispatchEvent(new Event('storage-role-change'));
  },

  getAssignedUnit: (): number => {
    if (typeof window === 'undefined') return 1;
    return Number(localStorage.getItem(STORAGE_KEYS.ASSIGNED_UNIT)) || 1;
  },

  setAssignedUnit: (unitId: number) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.ASSIGNED_UNIT, String(unitId));
    window.dispatchEvent(new Event('storage-role-change'));
  },

  // 1. UNITS — Supabase only
  getUnits: async (): Promise<DBUnit[]> => {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient.from('units').select('*').order('id', { ascending: true });
    if (error) { console.error('getUnits failed:', error.message); return []; }
    return (data || []).sort((a: any, b: any) => {
      const idxA = UNIT_CONFIGS.findIndex(uc => uc.id === a.id);
      const idxB = UNIT_CONFIGS.findIndex(uc => uc.id === b.id);
      return idxA - idxB;
    });
  },

  updateUnitStatus: async (unitId: number, status: 'Active' | 'Not In Use'): Promise<void> => {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.from('units').update({ status }).eq('id', unitId);
    if (error) console.error('updateUnitStatus failed:', error.message);
  },

  // 2. SHEDS — Supabase only
  getSheds: async (): Promise<DBShed[]> => {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient.from('sheds').select('*').order('unit_id', { ascending: true }).order('shed_number', { ascending: true });
    if (error) { console.error('getSheds failed:', error.message); return []; }
    
    // Sync batch details to localStorage so synchronous age calculations work across devices
    if (typeof window !== 'undefined') {
      const allBatchDates = JSON.parse(localStorage.getItem(STORAGE_KEYS.BATCH_DATES) || '{}');
      let updated = false;
      data.forEach((s: any) => {
        if (s.batch_start_date) {
          allBatchDates[`${s.unit_id}-${s.shed_number}`] = {
            startDate: s.batch_start_date,
            breedType: s.batch_breed_type || 'BV300 Premium',
            placementAgeWeeks: s.batch_placement_age_weeks || 0,
            capacity: s.batch_capacity || 5000
          };
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEYS.BATCH_DATES, JSON.stringify(allBatchDates));
      }
    }

    return (data || []).map((s: any) => ({ unitId: s.unit_id, shedNumber: s.shed_number, status: s.status }));
  },

  updateShedStatus: async (unitId: number, shedNumber: number, status: 'Active' | 'Not In Use'): Promise<void> => {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.from('sheds').update({ status }).eq('unit_id', unitId).eq('shed_number', shedNumber);
    if (error) console.error('updateShedStatus failed:', error.message);
  },

  // ─── BATCH / FLOCK PLACEMENT DATE ───────────────────────────
  // Key format: "unitId-shedNumber" → "YYYY-MM-DD" or DBShedBatchDetails object
  // Once set, birdAgeWeeks auto-calculates every day until changed.

  /** Store batch details for a specific shed */
  setBatchDetails: async (unitId: number, shedNumber: number, details: Partial<DBShedBatchDetails>): Promise<void> => {
    if (typeof window === 'undefined') return;
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.BATCH_DATES) || '{}');
    const existing = all[`${unitId}-${shedNumber}`];
    let current: DBShedBatchDetails = {
      startDate: '',
      breedType: 'BV300 Premium',
      placementAgeWeeks: 0,
      capacity: 5000
    };
    if (existing) {
      if (typeof existing === 'string') {
        current.startDate = existing;
      } else {
        current = { ...current, ...existing };
      }
    }
    const updated = { ...current, ...details };
    all[`${unitId}-${shedNumber}`] = updated;
    localStorage.setItem(STORAGE_KEYS.BATCH_DATES, JSON.stringify(all));

    // Persist to Supabase so it syncs across all devices
    if (supabaseClient) {
      const { error } = await supabaseClient.from('sheds').update({
        batch_start_date: updated.startDate || null,
        batch_breed_type: updated.breedType,
        batch_placement_age_weeks: updated.placementAgeWeeks,
        batch_capacity: updated.capacity
      }).eq('unit_id', unitId).eq('shed_number', shedNumber);
      
      if (error) console.error('Failed to sync batch details to Supabase:', error.message);
    }
  },

  /** Get batch details for a specific shed (returns null if not set) */
  getBatchDetails: (unitId: number, shedNumber: number): DBShedBatchDetails | null => {
    if (typeof window === 'undefined') return null;
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.BATCH_DATES) || '{}');
    const val = all[`${unitId}-${shedNumber}`];
    if (!val) return null;
    if (typeof val === 'string') {
      return {
        startDate: val,
        breedType: 'BV300 Premium',
        placementAgeWeeks: 0,
        capacity: 5000
      };
    }
    return {
      startDate: val.startDate || '',
      breedType: val.breedType || 'BV300 Premium',
      placementAgeWeeks: typeof val.placementAgeWeeks === 'number' ? val.placementAgeWeeks : 0,
      capacity: typeof val.capacity === 'number' ? val.capacity : 5000
    };
  },

  /** Store a batch placement date for a specific shed */
  setBatchDate: async (unitId: number, shedNumber: number, dateISO: string): Promise<void> => {
    await dbService.setBatchDetails(unitId, shedNumber, { startDate: dateISO });
  },

  /** Get batch placement date for a specific shed (returns null if not set) */
  getBatchDate: (unitId: number, shedNumber: number): string | null => {
    const details = dbService.getBatchDetails(unitId, shedNumber);
    return details ? details.startDate : null;
  },

  /** Get all batch dates as a map */
  getAllBatchDates: (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.BATCH_DATES) || '{}');
    const result: Record<string, string> = {};
    Object.keys(all).forEach(key => {
      const val = all[key];
      if (typeof val === 'string') {
        result[key] = val;
      } else if (val && typeof val === 'object' && val.startDate) {
        result[key] = val.startDate;
      }
    });
    return result;
  },

  /** Auto-calculate bird age in weeks from placement date to a target date (defaults to today) */
  calculateBirdAge: (unitId: number, shedNumber: number, targetDateISO?: string): number | null => {
    const details = dbService.getBatchDetails(unitId, shedNumber);
    if (!details || !details.startDate) return null;
    const start = new Date(details.startDate);
    const end = targetDateISO ? new Date(targetDateISO) : new Date();
    // Set to midnight to avoid DST issues
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.floor(diffDays / 7) + details.placementAgeWeeks);
  },

  /** Returns bird age as { weeks, days, totalDays } for "7 wks 3 days" display */
  calculateBirdAgeFull: (unitId: number, shedNumber: number, targetDateISO?: string): { weeks: number; days: number; totalDays: number } | null => {
    const details = dbService.getBatchDetails(unitId, shedNumber);
    if (!details || !details.startDate) return null;
    const start = new Date(details.startDate);
    const end = targetDateISO ? new Date(targetDateISO) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = diffDays + (details.placementAgeWeeks * 7);
    return {
      totalDays,
      weeks: Math.floor(totalDays / 7),
      days: totalDays % 7,
    };
  },

  // ─── CONNECTION STATUS ────────────────────────────
  isOnline: (): boolean => {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  },

  getSyncQueueLength: (): number => 0,
  addToSyncQueue: (_entries: any[]): void => {},

  // Sync queue removed — all saves go directly to Supabase
  syncPendingEntries: async (): Promise<void> => { return; },

  // 3. DAILY ENTRIES — Supabase only
  getDailyEntries: async (filters?: { date?: string; unitId?: number; dateStart?: string; dateEnd?: string }): Promise<DBDailyEntry[]> => {
    try {
      if (supabaseClient) {
        let query = supabaseClient.from('daily_entries').select('*');
        if (filters?.date) query = query.eq('date', filters.date);
        if (filters?.unitId) query = query.eq('unit_id', filters.unitId);
        if (filters?.dateStart) query = query.gte('date', filters.dateStart);
        if (filters?.dateEnd) query = query.lte('date', filters.dateEnd);
        
        const { data, error } = await withTimeout(query.order('date', { ascending: false }).order('shed_number', { ascending: true }));
        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            date: d.date,
            unitId: d.unit_id,
            shedNumber: d.shed_number,
            weather: d.weather,
            temperature: Number(d.temperature),
            humidity: Number(d.humidity),
            status: d.opening_birds > 0 ? 'Active' : 'Not In Use',
            openingBirds: d.opening_birds,
            mortality: d.mortality,
            culls: d.culls,
            closingBirds: d.closing_birds,
            feedKg: Number(d.feed_kg),
            waterLiters: Number(d.water_liters),
            eggsCount: d.eggs_count,
            eggWeightG: Number(d.egg_weight_g),
            uniformity: Number(d.uniformity),
            bodyWeight: Number(d.body_weight),
            birdAgeWeeks: d.bird_age_weeks || 20,
            medication: d.medication,
            remarks: d.remarks,
            hdPct: Number(d.hd_pct),
            mortalityPct: Number(d.mortality_pct),
            feedPerBirdG: Number(d.feed_per_bird_g),
            waterPerBirdMl: Number(d.water_per_bird_ml),
            fcr: Number(d.fcr),
            waterToFeedRatio: Number(d.water_to_feed_ratio),
            eggMassKg: Number(d.egg_mass_kg),
            performanceScore: d.performance_score,
            performanceRating: d.performance_score >= 90 ? 5 : d.performance_score >= 80 ? 4 : d.performance_score >= 70 ? 3 : d.performance_score >= 50 ? 2 : 1,
            performanceLabel: d.performance_score >= 90 ? 'Excellent' : d.performance_score >= 80 ? 'Very Good' : d.performance_score >= 70 ? 'Good' : d.performance_score >= 50 ? 'Needs Attention' : 'Critical',
          }));
        }
      }
    } catch (e) {
      console.error('getDailyEntries failed:', e);
    }
    return [];
  },

  saveDailyEntries: async (
    date: string,
    unitId: number,
    weather: string,
    temperature: number,
    humidity: number,
    remarks: string,
    shedInputs: { shedNumber: number; input: ShedDataInput }[]
  ): Promise<void> => {
    // 0. Pre-process feed distribution (Forward Auto-Averaging)
    const futureRecords: any[] = [];
    
    shedInputs.forEach(item => {
      if (item.input.feedKg && item.input.feedKg > 0 && item.input.feedDaysCovered && item.input.feedDaysCovered > 1) {
        const totalFeed = item.input.feedKg;
        const days = item.input.feedDaysCovered;
        const dailyFeed = totalFeed / days;
        
        // Update current day's input
        item.input.feedKg = dailyFeed;
        
        // Generate future days
        const currentDateObj = new Date(date);
        for (let i = 1; i < days; i++) {
          const futureDateObj = new Date(currentDateObj);
          futureDateObj.setDate(currentDateObj.getDate() + i);
          const futureDateStr = futureDateObj.toISOString().split('T')[0];
          
          // Create dummy input for future calculation
          const futureInput: ShedDataInput = {
            ...item.input,
            mortality: 0,
            culls: 0,
            openingBirds: item.input.closingBirds,
            closingBirds: item.input.closingBirds,
            eggsCount: 0,
            feedKg: dailyFeed,
            waterLiters: 0, 
          };
          
          const calc = calculateShedMetrics(futureInput);
          
          futureRecords.push({
            date: futureDateStr,
            unit_id: unitId,
            shed_number: item.shedNumber,
            weather: weather,
            temperature: temperature,
            humidity: humidity,
            opening_birds: futureInput.openingBirds,
            mortality: futureInput.mortality,
            culls: futureInput.culls,
            closing_birds: futureInput.closingBirds,
            uniformity: futureInput.uniformity,
            body_weight: futureInput.bodyWeight,
            bird_age_weeks: futureInput.birdAgeWeeks || 20,
            feed_kg: futureInput.feedKg,
            water_liters: futureInput.waterLiters,
            eggs_count: futureInput.eggsCount,
            egg_weight_g: futureInput.eggWeightG,
            medication: futureInput.medication || '',
            remarks: 'Auto-distributed feed from bulk entry.',
            hd_pct: calc.hdPct,
            mortality_pct: calc.mortalityPct,
            feed_per_bird_g: calc.feedPerBirdG,
            water_per_bird_ml: calc.waterPerBirdMl,
            fcr: calc.fcr,
            water_to_feed_ratio: calc.waterToFeedRatio,
            egg_mass_kg: calc.eggMassKg,
            performance_score: calc.performanceScore,
          });
        }
      }
    });

    // 1. Compute calculations for each active shed
    const processedEntries: Omit<DBDailyEntry, 'id'>[] = shedInputs.map(item => {
      const calculated = calculateShedMetrics(item.input);
      return {
        date,
        unitId,
        shedNumber: item.shedNumber,
        weather,
        temperature,
        humidity,
        ...item.input,
        ...calculated,
        remarks: item.input.remarks || remarks,
      };
    });

    // 2. Save directly to Supabase — no offline fallback
    if (!supabaseClient) {
      throw new Error('No Supabase connection. Please check your internet and try again.');
    }

    // --- Retroactive Auto-Averaging for Feed ---
    const retroUpdates: any[] = [];
    const currentDateObj = new Date(date);

    for (const item of shedInputs) {
      if (item.input.feedKg && item.input.feedKg > 0) {
        // Find the previous entry with feed > 0 for this shed
        const { data: prevFeedData, error: prevError } = await supabaseClient
          .from('daily_entries')
          .select('*')
          .eq('unit_id', unitId)
          .eq('shed_number', item.shedNumber)
          .lt('date', date)
          .gt('feed_kg', 0)
          .order('date', { ascending: false })
          .limit(1);

        if (!prevError && prevFeedData && prevFeedData.length > 0) {
          const prevEntry = prevFeedData[0];
          const prevDateObj = new Date(prevEntry.date);
          
          // Calculate difference in days
          const diffTime = Math.abs(currentDateObj.getTime() - prevDateObj.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays > 1) {
            // Calculate the smoothed average
            const dailyAvgFeed = prevEntry.feed_kg / diffDays;

            // Fetch all entries in the gap (from prevDate up to currentDate - 1)
            const { data: gapData, error: gapError } = await supabaseClient
              .from('daily_entries')
              .select('*')
              .eq('unit_id', unitId)
              .eq('shed_number', item.shedNumber)
              .gte('date', prevEntry.date)
              .lt('date', date);

            if (!gapError && gapData && gapData.length > 0) {
              for (const gapRow of gapData) {
                // Reconstruct input to recalculate metrics
                const gapInput: ShedDataInput = {
                  status: gapRow.status || 'Active',
                  openingBirds: gapRow.opening_birds,
                  mortality: gapRow.mortality,
                  culls: gapRow.culls,
                  closingBirds: gapRow.closing_birds,
                  feedKg: dailyAvgFeed, // The smoothed average
                  waterLiters: gapRow.water_liters,
                  eggsCount: gapRow.eggs_count,
                  eggWeightG: gapRow.egg_weight_g,
                  uniformity: gapRow.uniformity,
                  bodyWeight: gapRow.body_weight,
                  medication: gapRow.medication,
                  remarks: gapRow.remarks,
                  birdAgeWeeks: gapRow.bird_age_weeks,
                };
                
                const calc = calculateShedMetrics(gapInput);
                
                retroUpdates.push({
                  ...gapRow, // retain all existing fields
                  feed_kg: dailyAvgFeed,
                  hd_pct: calc.hdPct,
                  mortality_pct: calc.mortalityPct,
                  feed_per_bird_g: calc.feedPerBirdG,
                  water_per_bird_ml: calc.waterPerBirdMl,
                  fcr: calc.fcr,
                  water_to_feed_ratio: calc.waterToFeedRatio,
                  egg_mass_kg: calc.eggMassKg,
                  performance_score: calc.performanceScore,
                });
              }
            }
          }
        }
      }
    }

    // Apply retroactive updates if there are any
    if (retroUpdates.length > 0) {
      const { error: retroError } = await supabaseClient
        .from('daily_entries')
        .upsert(retroUpdates, { onConflict: 'date,unit_id,shed_number' });
      if (retroError) {
        console.error('Retroactive feed auto-averaging failed:', {
          message: retroError.message,
          code: retroError.code,
          details: retroError.details,
          hint: retroError.hint,
        });
      }
    }
    // -------------------------------------------

    // Helper: sanitize a number and clamp to max allowed by DB column precision
    const safe = (v: any, max: number) => {
      const n = Number(v);
      if (!isFinite(n) || isNaN(n)) return 0;
      return Math.min(Math.max(n, 0), max);
    };

    const records = processedEntries
      .filter(e => e.status !== 'Not In Use' || e.openingBirds > 0)
      .map(e => ({
        date: e.date,
        unit_id: e.unitId,
        shed_number: e.shedNumber,
        weather: e.weather || 'Sunny',
        temperature: safe(e.temperature, 99.99),
        humidity: safe(e.humidity, 100),
        opening_birds: Math.max(0, Number(e.openingBirds) || 0),
        mortality: Math.max(0, Number(e.mortality) || 0),
        culls: Math.max(0, Number(e.culls) || 0),
        closing_birds: Math.max(0, Number(e.closingBirds) || 0),
        uniformity: safe(e.uniformity, 100),
        body_weight: safe(e.bodyWeight, 9999.99),
        bird_age_weeks: Math.max(0, Number(e.birdAgeWeeks) || 20),
        feed_kg: safe(e.feedKg, 99999.99),
        water_liters: safe(e.waterLiters, 99999.99),
        eggs_count: Math.max(0, Number(e.eggsCount) || 0),
        egg_weight_g: safe(e.eggWeightG, 999.99),
        medication: e.medication || '',
        remarks: e.remarks || '',
        hd_pct: safe(e.hdPct, 999.99),           // NUMERIC(5,2)
        mortality_pct: safe(e.mortalityPct, 999.99), // NUMERIC(5,2)
        feed_per_bird_g: safe(e.feedPerBirdG, 9999.99),  // NUMERIC(6,2)
        water_per_bird_ml: safe(e.waterPerBirdMl, 9999.99), // NUMERIC(6,2)
        fcr: safe(e.fcr, 999.99),                // NUMERIC(5,2)
        water_to_feed_ratio: safe(e.waterToFeedRatio, 999.99), // NUMERIC(5,2)
        egg_mass_kg: safe(e.eggMassKg, 999999.99), // NUMERIC(8,2)
        performance_score: safe(e.performanceScore, 100),
      }));

    const allRecords = [...records, ...futureRecords];
    const { error } = await supabaseClient.from('daily_entries').upsert(allRecords, { onConflict: 'date,unit_id,shed_number' });
    if (error) {
      console.error('[SB ERR] message :', error.message);
      console.error('[SB ERR] code    :', error.code);
      console.error('[SB ERR] details :', error.details);
      console.error('[SB ERR] hint    :', error.hint);
      console.error('[SB ERR] keys    :', Object.keys(error));
      console.error('[SB ERR] raw JSON:', JSON.stringify(error));
      throw new Error(`Save failed: ${error.message || error.code || 'Unknown Supabase error — check [SB ERR] logs'}`);
    }

  },


  // 4. INVENTORY — Supabase only
  getInventory: async (): Promise<DBInventoryItem[]> => {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient.from('inventory').select('*').order('category', { ascending: true });
    if (error) { console.error('getInventory failed:', error.message); return []; }
    return (data || []).map((d: any) => ({
      id: d.id,
      category: d.category,
      itemName: d.item_name,
      stockLevel: Number(d.stock_level),
      reorderLevel: Number(d.reorder_level),
      uom: d.uom,
      supplier: d.supplier || '',
      expiryDate: d.expiry_date,
    }));
  },

  getInventoryTransactions: async (): Promise<DBInventoryTransaction[]> => {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient.from('inventory_transactions').select('*').order('date', { ascending: false });
    if (error) { console.error('getInventoryTransactions failed:', error.message); return []; }
    return (data || []).map((d: any) => ({
      id: d.id,
      inventoryId: d.inventory_id,
      transactionType: d.transaction_type,
      quantity: Number(d.quantity),
      date: d.date,
      reference: d.reference || '',
      remarks: d.remarks || '',
    }));
  },

  addInventoryTransaction: async (
    inventoryId: string,
    transactionType: 'Purchase' | 'Consumption',
    quantity: number,
    remarks: string,
    reference: string
  ): Promise<void> => {
    if (!supabaseClient) throw new Error('No Supabase connection.');
    const date = new Date().toISOString().split('T')[0];
    const { error } = await supabaseClient.from('inventory_transactions').insert({
      inventory_id: inventoryId,
      transaction_type: transactionType,
      quantity,
      date,
      reference,
      remarks,
    });
    if (error) {
      console.error('addInventoryTransaction failed:', error.message);
      throw new Error(error.message);
    }
  },

  // 5. NOTIFICATIONS — Supabase only
  getNotifications: async (): Promise<DBNotification[]> => {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient.from('notifications').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getNotifications failed:', error.message); return []; }
    return (data || []).map((d: any) => ({
      id: d.id,
      date: d.date,
      role: d.role,
      type: d.type,
      title: d.title,
      message: d.message,
      isRead: d.is_read,
      createdAt: d.created_at,
    }));
  },

  markNotificationAsRead: async (id: string): Promise<void> => {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) console.error('markNotificationAsRead failed:', error.message);
  },

  deleteNotification: async (id: string): Promise<void> => {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.from('notifications').delete().eq('id', id);
    if (error) console.error('deleteNotification failed:', error.message);
  },

  /**
   * Deletes notifications older than `olderThanDays` days.
   * Runs automatically on app startup (90-day window).
   * Also exposed so the owner can trigger a manual cleanup from settings.
   */
  cleanupOldNotifications: async (olderThanDays: number = 90): Promise<number> => {
    if (!supabaseClient) return 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const cutoffISO = cutoff.toISOString();

    const { data, error } = await supabaseClient
      .from('notifications')
      .delete()
      .lt('created_at', cutoffISO)
      .select('id');

    if (error) {
      console.warn('cleanupOldNotifications failed:', error.message);
      return 0;
    }
    const deleted = data?.length ?? 0;
    if (deleted > 0) {
      console.info(`[DB Cleanup] Deleted ${deleted} notification(s) older than ${olderThanDays} days.`);
    }
    return deleted;
  },

  // 6. SCORES METRICS AGGREGATIONS — Supabase only
  getAggregatedScores: async (dateStr: string) => {
    let entries = await dbService.getDailyEntries({ date: dateStr });
    if (entries.length === 0) {
      // If no entries logged for target date, fallback to the latest available entries overall
      const allEntries = await dbService.getDailyEntries();
      if (allEntries.length > 0) {
        const latestAvailableDate = allEntries[0].date;
        entries = allEntries.filter(e => e.date === latestAvailableDate);
      }
    }
    const sheds = await dbService.getSheds();
    const units = await dbService.getUnits();
    const unitSummaries = units.map((unit: any) => {
      const unitId = unit.id;
      const unitSheds = sheds.filter(s => s.unitId === unitId);
      const unitEntries = entries.filter(e => e.unitId === unitId);

      const mappedSheds = unitSheds.map(s => {
        const entry = unitEntries.find(e => e.shedNumber === s.shedNumber);
        return {
          status: s.status,
          score: entry ? entry.performanceScore : 0,
          mortality: entry ? entry.mortality : 0,
          openingBirds: entry ? entry.openingBirds : 0,
          eggs: entry ? entry.eggsCount : 0,
        };
      });

      const metrics = calculateUnitMetrics(mappedSheds);
      const activeShedCount = unitSheds.filter(s => s.status === 'Active').length;
      const inactiveShedCount = unitSheds.length - activeShedCount;

      return {
        unitId,
        unitName: unit.name,
        ...metrics,
        activeSheds: activeShedCount,
        inactiveSheds: inactiveShedCount,
      };
    });

    const farmMetrics = calculateFarmMetrics(unitSummaries);

    const rankedUnits = [...unitSummaries].sort((a, b) => b.performanceScore - a.performanceScore);

    const activeEntries = entries.filter(e => e.status === 'Active');
    const rankedSheds = activeEntries.map(e => ({
      unitId: e.unitId,
      shedNumber: e.shedNumber,
      score: e.performanceScore,
      hdPct: e.hdPct,
      mortalityPct: e.mortalityPct,
      fcr: e.fcr,
      label: e.performanceLabel,
    })).sort((a, b) => b.score - a.score);

    return {
      farmScore: farmMetrics.farmPerformanceScore,
      farmLabel: farmMetrics.farmPerformanceLabel,
      totalProduction: farmMetrics.totalProduction,
      unitSummaries,
      rankedUnits,
      rankedSheds,
      bestUnit: rankedUnits[0]?.performanceScore > 0 ? rankedUnits[0] : null,
      worstUnit: rankedUnits[rankedUnits.length - 1]?.performanceScore > 0 ? rankedUnits[rankedUnits.length - 1] : null,
      bestShed: rankedSheds[0] || null,
      worstShed: rankedSheds[rankedSheds.length - 1] || null,
    };
  },
};
