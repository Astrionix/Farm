// Pure mathematical calculations for Sri Mahalakshmi Poultry AI ERP

export interface ShedDataInput {
  status: 'Active' | 'Not In Use';
  openingBirds: number;
  mortality: number;
  culls: number;
  closingBirds: number;
  feedKg: number;
  waterLiters: number;
  eggsCount: number;
  eggWeightG: number;
  eggsBroken: number;
  eggsDirty: number;
  eggsCracked: number;
  uniformity: number;
  bodyWeight: number;
  medication?: string;
  remarks?: string;
  birdAgeWeeks?: number;
}

export interface CalculatedShedMetrics {
  hdPct: number;              // Hen-Day Production %
  mortalityPct: number;       // Mortality %
  feedPerBirdG: number;       // Feed consumed per bird in grams
  waterPerBirdMl: number;     // Water consumed per bird in ml
  eggMassKg: number;          // Total egg weight in kg
  fcr: number;                 // Feed Conversion Ratio (kg feed / kg egg mass)
  waterToFeedRatio: number;   // Water liters / Feed kg
  brokenEggPct: number;       // Broken egg %
  defectEggPct: number;       // Total defective eggs (broken, dirty, cracked) %
  performanceScore: number;   // Performance score (0 - 100)
  performanceRating: number;  // 1 - 5 stars
  performanceLabel: 'Excellent' | 'Very Good' | 'Good' | 'Needs Attention' | 'Critical';
}

export interface UnitMetrics {
  averageShedScore: number;
  unitMortalityPct: number;
  totalProduction: number;
  activeShedsCount: number;
  performanceScore: number;
  performanceLabel: 'Excellent' | 'Very Good' | 'Good' | 'Needs Attention' | 'Critical';
}

// Compute metrics for a single shed
export function calculateShedMetrics(input: ShedDataInput): CalculatedShedMetrics {
  if (input.status === 'Not In Use') {
    return {
      hdPct: 0,
      mortalityPct: 0,
      feedPerBirdG: 0,
      waterPerBirdMl: 0,
      eggMassKg: 0,
      fcr: 0,
      waterToFeedRatio: 0,
      brokenEggPct: 0,
      defectEggPct: 0,
      performanceScore: 0,
      performanceRating: 0,
      performanceLabel: 'Critical',
    };
  }

  const {
    openingBirds,
    mortality,
    culls,
    closingBirds,
    feedKg,
    waterLiters,
    eggsCount,
    eggWeightG,
    eggsBroken,
    eggsDirty,
    eggsCracked,
    uniformity,
  } = input;

  // 1. Basic Counts & Percentages
  const activeBirds = closingBirds > 0 ? closingBirds : (openingBirds - mortality - culls);
  const hdPct = activeBirds > 0 ? (eggsCount / activeBirds) * 100 : 0;
  const mortalityPct = openingBirds > 0 ? (mortality / openingBirds) * 100 : 0;

  // 2. Feed & Water Consumption per Bird
  const feedPerBirdG = activeBirds > 0 ? (feedKg * 1000) / activeBirds : 0;
  const waterPerBirdMl = activeBirds > 0 ? (waterLiters * 1000) / activeBirds : 0;
  const waterToFeedRatio = feedKg > 0 ? waterLiters / feedKg : 0;

  // 3. Egg Mass and Feed Conversion Ratio (FCR)
  // Egg Mass (kg) = (Eggs * Avg Weight in grams) / 1000
  const eggMassKg = (eggsCount * eggWeightG) / 1000;
  // FCR = Feed consumed (kg) / Egg mass (kg)
  const fcr = eggMassKg > 0 ? feedKg / eggMassKg : 0;

  // 4. Quality Defects
  const brokenEggPct = eggsCount > 0 ? (eggsBroken / eggsCount) * 100 : 0;
  const totalDefects = eggsBroken + eggsDirty + eggsCracked;
  const defectEggPct = eggsCount > 0 ? (totalDefects / eggsCount) * 100 : 0;

  // 5. Performance Scoring (0 to 100)
  // HD% (Weight: 35%) -> Target: 92% or higher
  const hdScore = Math.min(35, (hdPct / 92) * 35);

  // Mortality (Weight: 25%) -> Daily target: 0% mortality. 
  // Deduct 10 points for every 0.1% daily mortality (e.g. 0.2% mortality removes 20 points)
  const mortalityScore = Math.max(0, 25 - (mortalityPct * 100));

  // FCR (Weight: 15%) -> Target FCR <= 2.0. Limit <= 3.2
  let fcrScore = 0;
  if (fcr > 0) {
    if (fcr <= 2.0) {
      fcrScore = 15;
    } else if (fcr >= 3.2) {
      fcrScore = 0;
    } else {
      fcrScore = 15 * (1 - (fcr - 2.0) / (3.2 - 2.0));
    }
  }

  // Water Ratio (Weight: 10%) -> Target water ratio is 2.0. Deduct for variance.
  const waterRatioScore = Math.max(0, 10 - Math.abs(waterToFeedRatio - 2.0) * 10);

  // Egg Quality Defects (Weight: 10%) -> Target: 0% defects
  const qualityScore = Math.max(0, 10 - defectEggPct * 2);

  // Uniformity (Weight: 5%) -> Target: 85% or higher
  const uniformityScore = Math.min(5, (uniformity / 85) * 5);

  // Total raw score
  let performanceScore = Math.round(hdScore + mortalityScore + fcrScore + waterRatioScore + qualityScore + uniformityScore);
  performanceScore = Math.max(0, Math.min(100, performanceScore));

  // Ratings & Labels
  let performanceRating = 1;
  let performanceLabel: CalculatedShedMetrics['performanceLabel'] = 'Critical';

  if (performanceScore >= 90) {
    performanceRating = 5;
    performanceLabel = 'Excellent';
  } else if (performanceScore >= 80) {
    performanceRating = 4;
    performanceLabel = 'Very Good';
  } else if (performanceScore >= 70) {
    performanceRating = 3;
    performanceLabel = 'Good';
  } else if (performanceScore >= 50) {
    performanceRating = 2;
    performanceLabel = 'Needs Attention';
  } else {
    performanceRating = 1;
    performanceLabel = 'Critical';
  }

  return {
    hdPct: Number(hdPct.toFixed(2)),
    mortalityPct: Number(mortalityPct.toFixed(2)),
    feedPerBirdG: Number(feedPerBirdG.toFixed(2)),
    waterPerBirdMl: Number(waterPerBirdMl.toFixed(2)),
    eggMassKg: Number(eggMassKg.toFixed(3)),
    fcr: Number(fcr.toFixed(2)),
    waterToFeedRatio: Number(waterToFeedRatio.toFixed(2)),
    brokenEggPct: Number(brokenEggPct.toFixed(2)),
    defectEggPct: Number(defectEggPct.toFixed(2)),
    performanceScore,
    performanceRating,
    performanceLabel,
  };
}

// Compute metrics for a unit based on its active sheds
export function calculateUnitMetrics(sheds: { status: 'Active' | 'Not In Use'; score: number; mortality: number; openingBirds: number; eggs: number }[]): UnitMetrics {
  const activeSheds = sheds.filter(s => s.status === 'Active');
  const activeShedsCount = activeSheds.length;

  if (activeShedsCount === 0) {
    return {
      averageShedScore: 0,
      unitMortalityPct: 0,
      totalProduction: 0,
      activeShedsCount: 0,
      performanceScore: 0,
      performanceLabel: 'Critical',
    };
  }

  const averageShedScore = activeSheds.reduce((acc, s) => acc + s.score, 0) / activeShedsCount;
  
  const totalOpeningBirds = sheds.reduce((acc, s) => acc + s.openingBirds, 0);
  const totalMortality = sheds.reduce((acc, s) => acc + s.mortality, 0);
  const unitMortalityPct = totalOpeningBirds > 0 ? (totalMortality / totalOpeningBirds) * 100 : 0;
  
  const totalProduction = sheds.reduce((acc, s) => acc + s.eggs, 0);

  // Performance Score = Average Shed Score adjusted by Unit Mortality penalty (if mortality is high)
  // Daily mortality of > 0.15% is penalized
  const dailyMortalityPenalty = Math.max(0, (unitMortalityPct - 0.15) * 20);
  let performanceScore = Math.round(averageShedScore - dailyMortalityPenalty);
  performanceScore = Math.max(0, Math.min(100, performanceScore));

  let performanceLabel: UnitMetrics['performanceLabel'] = 'Critical';
  if (performanceScore >= 90) performanceLabel = 'Excellent';
  else if (performanceScore >= 80) performanceLabel = 'Very Good';
  else if (performanceScore >= 70) performanceLabel = 'Good';
  else if (performanceScore >= 50) performanceLabel = 'Needs Attention';

  return {
    averageShedScore: Number(averageShedScore.toFixed(1)),
    unitMortalityPct: Number(unitMortalityPct.toFixed(2)),
    totalProduction,
    activeShedsCount,
    performanceScore,
    performanceLabel,
  };
}

// Compute overall farm metrics
export function calculateFarmMetrics(units: { performanceScore: number; totalProduction: number; activeShedsCount: number }[]) {
  const activeUnits = units.filter(u => u.activeShedsCount > 0);
  const activeUnitsCount = activeUnits.length;

  if (activeUnitsCount === 0) {
    return {
      farmPerformanceScore: 0,
      totalProduction: 0,
      farmPerformanceLabel: 'Critical' as const,
    };
  }

  const farmPerformanceScore = Math.round(activeUnits.reduce((acc, u) => acc + u.performanceScore, 0) / activeUnitsCount);
  const totalProduction = units.reduce((acc, u) => acc + u.totalProduction, 0);

  let farmPerformanceLabel: 'Excellent' | 'Very Good' | 'Good' | 'Needs Attention' | 'Critical' = 'Critical';
  if (farmPerformanceScore >= 90) farmPerformanceLabel = 'Excellent';
  else if (farmPerformanceScore >= 80) farmPerformanceLabel = 'Very Good';
  else if (farmPerformanceScore >= 70) farmPerformanceLabel = 'Good';
  else if (farmPerformanceScore >= 50) farmPerformanceLabel = 'Needs Attention';

  return {
    farmPerformanceScore,
    totalProduction,
    farmPerformanceLabel,
  };
}
