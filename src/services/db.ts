// Unified Data Layer for Sri Mahalakshmi Poultry AI ERP
// Falls back to LocalStorage if Supabase environment variables are missing.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { calculateShedMetrics, calculateUnitMetrics, calculateFarmMetrics, ShedDataInput, CalculatedShedMetrics } from '../utils/calculations';

// -------------------------------------------------------------
// ENVIRONMENT & CREDENTIALS
// -------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';

export let supabaseClient: SupabaseClient | null = null;
export let supabaseActive = isSupabaseConfigured;
if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error('Supabase initialization failed, falling back to local state:', e);
    supabaseActive = false;
  }
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
const STORAGE_KEYS = {
  UNITS: 'smp_units',
  SHEDS: 'smp_sheds',
  DAILY_ENTRIES: 'smp_daily_entries',
  INVENTORY: 'smp_inventory',
  INVENTORY_TRANSACTIONS: 'smp_inventory_transactions',
  NOTIFICATIONS: 'smp_notifications',
  USER_ROLE: 'smp_user_role',
  ASSIGNED_UNIT: 'smp_assigned_unit',
  DB_MODE: 'smp_db_mode',
};

// Seeding 30 Days of high fidelity historical data
function generateHistoricalMockData() {
  const units: DBUnit[] = [
    { id: 1, name: 'Unit 1', status: 'Active' },
    { id: 2, name: 'Unit 2', status: 'Active' },
    { id: 3, name: 'Unit 3', status: 'Active' },
    { id: 4, name: 'Unit 4', status: 'Active' },
  ];

  const sheds: DBShed[] = [];
  for (let u = 1; u <= 4; u++) {
    for (let s = 1; s <= 12; s++) {
      // Setup status according to farm structure rules:
      // Unit 1: 10 active, 2 not in use (11, 12)
      // Unit 2: 8 active, 4 not in use (9-12)
      // Unit 3: 10 active, 2 not in use (11, 12)
      // Unit 4: 2 active, 10 not in use (3-12)
      let status: 'Active' | 'Not In Use' = 'Active';
      if (u === 1 && s > 10) status = 'Not In Use';
      else if (u === 2 && s > 8) status = 'Not In Use';
      else if (u === 3 && s > 10) status = 'Not In Use';
      else if (u === 4 && s > 2) status = 'Not In Use';

      sheds.push({
        unitId: u,
        shedNumber: s,
        status,
      });
    }
  }

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

    // For each unit and active shed
    for (let u = 1; u <= 4; u++) {
      for (let s = 1; s <= 12; s++) {
        const shedKey = `${u}-${s}`;
        const isShedActive = sheds.find(sh => sh.unitId === u && sh.shedNumber === s)?.status === 'Active';
        
        if (!isShedActive) continue;

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

        // Egg quality defects
        const eggsBroken = Math.floor(eggsCount * (0.002 + Math.random() * 0.006));
        const eggsDirty = Math.floor(eggsCount * (0.005 + Math.random() * 0.012));
        const eggsCracked = Math.floor(eggsCount * (0.001 + Math.random() * 0.004));

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
          eggsBroken,
          eggsDirty,
          eggsCracked,
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

        // Add anomaly notifications for Owner dashboard
        if (d === 12 && u === 3 && s === 2) {
          notifications.push({
            id: `notif-${dateStr}-prod-drop`,
            date: dateStr,
            role: 'Owner',
            type: 'Warning',
            title: 'Significant Production Drop',
            message: 'Unit 3, Shed 2 reported a production decline below breed standard (HD% fell to 73.1%).',
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
            title: `Mortality Spike in Unit ${u} Shed ${s}`,
            message: `Mortality spike: ${mortality} birds died in Unit ${u}, Shed ${s} on ${dateStr}.`,
            isRead: false,
            createdAt: new Date(currentDate.getTime() + 17 * 60 * 60 * 1000).toISOString(),
          });
        }
      }
    }

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
      message: 'Unit 4 daily production entries are pending supervisor approval.',
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
async function withTimeout<T>(promise: PromiseLike<T> | Promise<T>, ms = 1200): Promise<T> {
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
  // Initialize state
  init: () => {
    if (typeof window === 'undefined') return;
    
    // Check if seeded
    if (!localStorage.getItem(STORAGE_KEYS.UNITS)) {
      const seed = generateHistoricalMockData();
      localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(seed.units));
      localStorage.setItem(STORAGE_KEYS.SHEDS, JSON.stringify(seed.sheds));
      localStorage.setItem(STORAGE_KEYS.DAILY_ENTRIES, JSON.stringify(seed.dailyEntries));
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(seed.inventory));
      localStorage.setItem(STORAGE_KEYS.INVENTORY_TRANSACTIONS, JSON.stringify(seed.inventoryTransactions));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(seed.notifications));
      
      // Default configurations
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, 'Owner');
      localStorage.setItem(STORAGE_KEYS.ASSIGNED_UNIT, '1');
      localStorage.setItem(STORAGE_KEYS.DB_MODE, 'Demo');
    }
  },

  // DB Mode Access
  getDbMode: (): 'Demo' | 'Live' => {
    if (typeof window === 'undefined') return 'Demo';
    dbService.init();
    return (localStorage.getItem(STORAGE_KEYS.DB_MODE) as 'Demo' | 'Live') || 'Demo';
  },

  clearAllData: async (mode: 'Demo' | 'Live'): Promise<void> => {
    if (typeof window === 'undefined') return;
    dbService.init();

    localStorage.setItem(STORAGE_KEYS.DB_MODE, mode);

    if (mode === 'Demo') {
      const seed = generateHistoricalMockData();
      localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(seed.units));
      localStorage.setItem(STORAGE_KEYS.SHEDS, JSON.stringify(seed.sheds));
      localStorage.setItem(STORAGE_KEYS.DAILY_ENTRIES, JSON.stringify(seed.dailyEntries));
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(seed.inventory));
      localStorage.setItem(STORAGE_KEYS.INVENTORY_TRANSACTIONS, JSON.stringify(seed.inventoryTransactions));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(seed.notifications));
    } else {
      // Live / Clean slate
      const units = [
        { id: 1, name: 'Unit 1', status: 'Active' as const },
        { id: 2, name: 'Unit 2', status: 'Active' as const },
        { id: 3, name: 'Unit 3', status: 'Active' as const },
        { id: 4, name: 'Unit 4', status: 'Active' as const },
      ];

      const sheds = [];
      for (let u = 1; u <= 4; u++) {
        for (let s = 1; s <= 12; s++) {
          let status: 'Active' | 'Not In Use' = 'Active';
          if (u === 1 && s > 10) status = 'Not In Use';
          else if (u === 2 && s > 8) status = 'Not In Use';
          else if (u === 3 && s > 10) status = 'Not In Use';
          else if (u === 4 && s > 2) status = 'Not In Use';
          sheds.push({ unitId: u, shedNumber: s, status });
        }
      }

      const inventory = [
        { id: 'inv-feed-1', category: 'Feed' as const, itemName: 'Layer Feed MaxPlus', stockLevel: 0, reorderLevel: 2000, uom: 'kg', supplier: 'Kargil Poultry Feeds Ltd', expiryDate: null },
        { id: 'inv-feed-2', category: 'Feed' as const, itemName: 'Pre-Lay Starter Crumble', stockLevel: 0, reorderLevel: 500, uom: 'kg', supplier: 'Kargil Poultry Feeds Ltd', expiryDate: null },
        { id: 'inv-med-1', category: 'Medicines' as const, itemName: 'Amprolium Dewormer 9.6%', stockLevel: 0, reorderLevel: 8.0, uom: 'liters', supplier: 'VetCare India Labs', expiryDate: '2027-04-18' },
        { id: 'inv-vac-1', category: 'Vaccines' as const, itemName: 'Newcastle ND LaSota (1000 doses)', stockLevel: 0, reorderLevel: 4, uom: 'vials', supplier: 'Indovax Bio', expiryDate: '2026-11-20' },
        { id: 'inv-tray-1', category: 'Egg Trays' as const, itemName: 'Premium Molded Fiber Paper Trays', stockLevel: 0, reorderLevel: 1500, uom: 'units', supplier: 'Sri Lakshmi Paper Products', expiryDate: null },
        { id: 'inv-pack-1', category: 'Packaging' as const, itemName: 'Recycled Egg Cartons (12 Eggs Size)', stockLevel: 0, reorderLevel: 400, uom: 'units', supplier: 'Carton Works Co.', expiryDate: null },
        { id: 'inv-chem-1', category: 'Chemicals' as const, itemName: 'Virkon S Bio-Disinfectant Powder', stockLevel: 0, reorderLevel: 10.0, uom: 'kg', supplier: 'Antec Chemical Solutions', expiryDate: '2027-08-10' },
      ];

      localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
      localStorage.setItem(STORAGE_KEYS.SHEDS, JSON.stringify(sheds));
      localStorage.setItem(STORAGE_KEYS.DAILY_ENTRIES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
      localStorage.setItem(STORAGE_KEYS.INVENTORY_TRANSACTIONS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    }

    // Force a storage role change update to trigger components refreshing
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

  // 1. UNITS
  getUnits: async (): Promise<DBUnit[]> => {
    try {
      if (supabaseActive && supabaseClient) {
        const { data, error } = await withTimeout(supabaseClient.from('units').select('*').order('id', { ascending: true }));
        if (!error && data && data.length > 0) return data;
      }
    } catch (e) {
      console.warn('Supabase connection failed in getUnits. Switching to offline mode.', e);
      supabaseActive = false;
    }
    dbService.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.UNITS) || '[]');
  },

  updateUnitStatus: async (unitId: number, status: 'Active' | 'Not In Use'): Promise<void> => {
    try {
      if (supabaseActive && supabaseClient) {
        await withTimeout(supabaseClient.from('units').update({ status }).eq('id', unitId));
      }
    } catch (e) {
      console.warn('Supabase connection failed in updateUnitStatus. Switching to offline mode.', e);
      supabaseActive = false;
    }
    dbService.init();
    const units = await dbService.getUnits();
    const index = units.findIndex(u => u.id === unitId);
    if (index !== -1) {
      units[index].status = status;
      localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
    }
  },

  // 2. SHEDS
  getSheds: async (): Promise<DBShed[]> => {
    try {
      if (supabaseActive && supabaseClient) {
        const { data, error } = await withTimeout(supabaseClient.from('sheds').select('*').order('unit_id', { ascending: true }).order('shed_number', { ascending: true }));
        if (!error && data && data.length > 0) return data.map(s => ({ unitId: s.unit_id, shedNumber: s.shed_number, status: s.status }));
      }
    } catch (e) {
      console.warn('Supabase connection failed in getSheds. Switching to offline mode.', e);
      supabaseActive = false;
    }
    dbService.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHEDS) || '[]');
  },

  updateShedStatus: async (unitId: number, shedNumber: number, status: 'Active' | 'Not In Use'): Promise<void> => {
    try {
      if (supabaseActive && supabaseClient) {
        await withTimeout(supabaseClient.from('sheds').update({ status }).eq('unit_id', unitId).eq('shed_number', shedNumber));
      }
    } catch (e) {
      console.warn('Supabase connection failed in updateShedStatus. Switching to offline mode.', e);
      supabaseActive = false;
    }
    dbService.init();
    const sheds = await dbService.getSheds();
    const index = sheds.findIndex(s => s.unitId === unitId && s.shedNumber === shedNumber);
    if (index !== -1) {
      sheds[index].status = status;
      localStorage.setItem(STORAGE_KEYS.SHEDS, JSON.stringify(sheds));
    }
  },

  // 3. DAILY ENTRIES
  getDailyEntries: async (filters?: { date?: string; unitId?: number; dateStart?: string; dateEnd?: string }): Promise<DBDailyEntry[]> => {
    try {
      if (supabaseActive && supabaseClient) {
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
            eggsBroken: d.eggs_broken,
            eggsDirty: d.eggs_dirty,
            eggsCracked: d.eggs_cracked,
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
            brokenEggPct: Number(d.broken_egg_pct),
            defectEggPct: Number(d.broken_egg_pct),
            performanceScore: d.performance_score,
            performanceRating: d.performance_score >= 90 ? 5 : d.performance_score >= 80 ? 4 : d.performance_score >= 70 ? 3 : d.performance_score >= 50 ? 2 : 1,
            performanceLabel: d.performance_score >= 90 ? 'Excellent' : d.performance_score >= 80 ? 'Very Good' : d.performance_score >= 70 ? 'Good' : d.performance_score >= 50 ? 'Needs Attention' : 'Critical',
          }));
        }
      }
    } catch (e) {
      console.warn('Supabase connection failed in getDailyEntries. Switching to offline mode.', e);
      supabaseActive = false;
    }
    
    dbService.init();
    let entries: DBDailyEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_ENTRIES) || '[]');
    
    if (filters) {
      if (filters.date) {
        entries = entries.filter(e => e.date === filters.date);
      }
      if (filters.unitId) {
        entries = entries.filter(e => e.unitId === filters.unitId);
      }
      if (filters.dateStart) {
        entries = entries.filter(e => e.date >= filters.dateStart!);
      }
      if (filters.dateEnd) {
        entries = entries.filter(e => e.date <= filters.dateEnd!);
      }
    }
    
    return entries.sort((a, b) => b.date.localeCompare(a.date) || a.shedNumber - b.shedNumber);
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

    // 2. Perform DB insert
    if (supabaseActive && supabaseClient) {
      try {
        const records = processedEntries.map(e => ({
          date: e.date,
          unit_id: e.unitId,
          shed_number: e.shedNumber,
          weather: e.weather,
          temperature: e.temperature,
          humidity: e.humidity,
          opening_birds: e.openingBirds,
          mortality: e.mortality,
          culls: e.culls,
          closing_birds: e.closingBirds,
          uniformity: e.uniformity,
          body_weight: e.bodyWeight,
          bird_age_weeks: e.birdAgeWeeks || 20,
          feed_kg: e.feedKg,
          water_liters: e.waterLiters,
          eggs_count: e.eggsCount,
          egg_weight_g: e.eggWeightG,
          eggs_broken: e.eggsBroken,
          eggs_dirty: e.eggsDirty,
          eggs_cracked: e.eggsCracked,
          medication: e.medication || '',
          remarks: e.remarks || '',
          hd_pct: e.hdPct,
          mortality_pct: e.mortalityPct,
          feed_per_bird_g: e.feedPerBirdG,
          water_per_bird_ml: e.waterPerBirdMl,
          fcr: e.fcr,
          water_to_feed_ratio: e.waterToFeedRatio,
          egg_mass_kg: e.eggMassKg,
          broken_egg_pct: e.brokenEggPct,
          performance_score: e.performanceScore,
        }));

        const { error } = await supabaseClient.from('daily_entries').upsert(records, { onConflict: 'date,unit_id,shed_number' });
        if (error) {
          console.error('Supabase save failed:', error);
        }
      } catch (e) {
        console.warn('Supabase connection failed in saveDailyEntries. Switching to offline mode.', e);
        supabaseActive = false;
      }
    }

    // Local Storage save
    dbService.init();
    const entries: DBDailyEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_ENTRIES) || '[]');
    const inventory: DBInventoryItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY) || '[]');
    const transactions: DBInventoryTransaction[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY_TRANSACTIONS) || '[]');
    const notifications: DBNotification[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');

    let feedConsumedTotal = 0;
    let eggsHarvestedTotal = 0;

    processedEntries.forEach(newEntry => {
      const matchIndex = entries.findIndex(e => e.date === date && e.unitId === unitId && e.shedNumber === newEntry.shedNumber);
      
      if (matchIndex !== -1) {
        entries[matchIndex] = {
          ...newEntry,
          id: entries[matchIndex].id,
        } as DBDailyEntry;
      } else {
        const entryId = `entry-${date}-${unitId}-${newEntry.shedNumber}`;
        entries.push({
          ...newEntry,
          id: entryId,
        } as DBDailyEntry);
      }

      if (newEntry.status === 'Active') {
        feedConsumedTotal += newEntry.feedKg;
        eggsHarvestedTotal += newEntry.eggsCount;

        if (newEntry.mortality > 5) {
          notifications.push({
            id: `notif-${date}-spike-${unitId}-${newEntry.shedNumber}`,
            date,
            role: 'Owner',
            type: 'Alert',
            title: `High Mortality Alert`,
            message: `Supervisor logged ${newEntry.mortality} mortalities in Unit ${unitId}, Shed ${newEntry.shedNumber}.`,
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    });

    // Deduct feed inventory
    const feedItem = inventory.find(i => i.category === 'Feed' && i.itemName.includes('Layer Feed'));
    if (feedItem && feedConsumedTotal > 0) {
      feedItem.stockLevel = Math.max(0, feedItem.stockLevel - feedConsumedTotal);
      transactions.push({
        id: `t-feed-consume-${date}-${unitId}`,
        inventoryId: feedItem.id,
        transactionType: 'Consumption',
        quantity: feedConsumedTotal,
        date,
        reference: `Unit ${unitId} Feed Entry`,
        remarks: `Daily feeding consumption logs.`,
      });

      if (feedItem.stockLevel < feedItem.reorderLevel) {
        const orderQty = 10000;
        feedItem.stockLevel += orderQty;
        transactions.push({
          id: `t-feed-restock-${date}-${unitId}`,
          inventoryId: feedItem.id,
          transactionType: 'Purchase',
          quantity: orderQty,
          date,
          reference: `AUTO-REORDER-${unitId}`,
          remarks: 'Automatic layer feed purchase on low stock.',
        });
        notifications.push({
          id: `notif-${date}-low-feed-auto-${unitId}`,
          date,
          role: 'All',
          type: 'Success',
          title: 'Feed Restocked Automatically',
          message: `Stock level fell below safety threshold. Restocked ${orderQty} kg feed.`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Deduct trays inventory
    const traysItem = inventory.find(i => i.category === 'Egg Trays');
    const traysNeeded = Math.ceil(eggsHarvestedTotal / 30);
    if (traysItem && traysNeeded > 0) {
      traysItem.stockLevel = Math.max(0, traysItem.stockLevel - traysNeeded);
      transactions.push({
        id: `t-trays-consume-${date}-${unitId}`,
        inventoryId: traysItem.id,
        transactionType: 'Consumption',
        quantity: traysNeeded,
        date,
        reference: `Unit ${unitId} Eggs Harvest`,
        remarks: `Standard trays used for egg storage.`,
      });
    }

    localStorage.setItem(STORAGE_KEYS.DAILY_ENTRIES, JSON.stringify(entries));
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    localStorage.setItem(STORAGE_KEYS.INVENTORY_TRANSACTIONS, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  // 4. INVENTORY
  getInventory: async (): Promise<DBInventoryItem[]> => {
    try {
      if (supabaseActive && supabaseClient) {
        const { data, error } = await withTimeout(supabaseClient.from('inventory').select('*').order('category', { ascending: true }));
        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            category: d.category,
            itemName: d.item_name,
            stockLevel: Number(d.stock_level),
            reorderLevel: Number(d.reorder_level),
            uom: d.uom,
            supplier: d.supplier || '',
            expiryDate: d.expiry_date,
          }));
        }
      }
    } catch (e) {
      console.warn('Supabase connection failed in getInventory. Switching to offline mode.', e);
      supabaseActive = false;
    }
    dbService.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY) || '[]');
  },

  getInventoryTransactions: async (): Promise<DBInventoryTransaction[]> => {
    try {
      if (supabaseActive && supabaseClient) {
        const { data, error } = await withTimeout(supabaseClient.from('inventory_transactions').select('*').order('date', { ascending: false }));
        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            inventoryId: d.inventory_id,
            transactionType: d.transaction_type,
            quantity: Number(d.quantity),
            date: d.date,
            reference: d.reference || '',
            remarks: d.remarks || '',
          }));
        }
      }
    } catch (e) {
      console.warn('Supabase connection failed in getInventoryTransactions. Switching to offline mode.', e);
      supabaseActive = false;
    }
    dbService.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY_TRANSACTIONS) || '[]');
  },

  addInventoryTransaction: async (
    inventoryId: string,
    transactionType: 'Purchase' | 'Consumption',
    quantity: number,
    remarks: string,
    reference: string
  ): Promise<void> => {
    const date = new Date().toISOString().split('T')[0];

    if (supabaseActive && supabaseClient) {
      try {
        const { error } = await withTimeout(supabaseClient.from('inventory_transactions').insert({
          inventory_id: inventoryId,
          transaction_type: transactionType,
          quantity,
          date,
          reference,
          remarks,
        }));
        if (error) console.error('Supabase inventory insert failed:', error);
      } catch (e) {
        console.warn('Supabase connection failed in addInventoryTransaction. Switching to offline mode.', e);
        supabaseActive = false;
      }
    }

    dbService.init();
    const inventory: DBInventoryItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY) || '[]');
    const transactions: DBInventoryTransaction[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY_TRANSACTIONS) || '[]');
    const notifications: DBNotification[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');

    const item = inventory.find(i => i.id === inventoryId);
    if (item) {
      if (transactionType === 'Purchase') {
        item.stockLevel += quantity;
      } else if (transactionType === 'Consumption') {
        item.stockLevel = Math.max(0, item.stockLevel - quantity);
      }

      transactions.push({
        id: `t-manual-${Date.now()}`,
        inventoryId,
        transactionType,
        quantity,
        date,
        reference,
        remarks,
      });

      if (item.stockLevel < item.reorderLevel) {
        notifications.push({
          id: `notif-manual-low-${Date.now()}`,
          date,
          role: 'Owner',
          type: 'Warning',
          title: `Low Stock: ${item.itemName}`,
          message: `${item.itemName} (${item.stockLevel} ${item.uom}) has fallen below reorder level (${item.reorderLevel} ${item.uom}).`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
      localStorage.setItem(STORAGE_KEYS.INVENTORY_TRANSACTIONS, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    }
  },

  // 5. NOTIFICATIONS
  getNotifications: async (): Promise<DBNotification[]> => {
    try {
      if (supabaseActive && supabaseClient) {
        const { data, error } = await withTimeout(supabaseClient.from('notifications').select('*').order('created_at', { ascending: false }));
        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            date: d.date,
            role: d.role,
            type: d.type,
            title: d.title,
            message: d.message,
            isRead: d.is_read,
            createdAt: d.created_at,
          }));
        }
      }
    } catch (e) {
      console.warn('Supabase connection failed in getNotifications. Switching to offline mode.', e);
      supabaseActive = false;
    }
    dbService.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
  },

  markNotificationAsRead: async (id: string): Promise<void> => {
    try {
      if (supabaseActive && supabaseClient) {
        await withTimeout(supabaseClient.from('notifications').update({ is_read: true }).eq('id', id));
      }
    } catch (e) {
      console.warn('Supabase connection failed in markNotificationAsRead. Switching to offline mode.', e);
      supabaseActive = false;
    }
    dbService.init();
    const notifications = await dbService.getNotifications();
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].isRead = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    }
  },

  // 6. SCORES METRICS AGGREGATIONS
  getAggregatedScores: async (dateStr: string) => {
    dbService.init();
    const entries = await dbService.getDailyEntries({ date: dateStr });
    const sheds = await dbService.getSheds();

    const unitSummaries = [1, 2, 3, 4].map(unitId => {
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
        unitName: `Unit ${unitId}`,
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
