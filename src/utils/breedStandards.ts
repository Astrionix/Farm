// Official BV300 (Babcock / Venky's) Layer Performance Standards (Weeks 18 to 100)

export interface BV300StandardPoint {
  week: number;
  targetHdPct: number;          // Target Hen-Day Egg Production %
  targetFcr: number;            // Target Feed Conversion Ratio (kg feed / kg egg)
  targetBodyWeightG: number;    // Target Body Weight in grams
  targetFeedPerBirdG: number;   // Target Feed Consumption per bird in grams/day
}

// Key week milestones for BV300 Commercial Layers
export const BV300_STANDARD_CURVE: BV300StandardPoint[] = [
  { week: 18, targetHdPct: 15.0, targetFcr: 2.80, targetBodyWeightG: 1260, targetFeedPerBirdG: 85 },
  { week: 19, targetHdPct: 40.0, targetFcr: 2.45, targetBodyWeightG: 1340, targetFeedPerBirdG: 92 },
  { week: 20, targetHdPct: 65.0, targetFcr: 2.20, targetBodyWeightG: 1420, targetFeedPerBirdG: 98 },
  { week: 21, targetHdPct: 82.0, targetFcr: 2.05, targetBodyWeightG: 1480, targetFeedPerBirdG: 104 },
  { week: 22, targetHdPct: 90.0, targetFcr: 1.98, targetBodyWeightG: 1520, targetFeedPerBirdG: 108 },
  { week: 23, targetHdPct: 93.5, targetFcr: 1.95, targetBodyWeightG: 1550, targetFeedPerBirdG: 110 },
  { week: 24, targetHdPct: 95.0, targetFcr: 1.93, targetBodyWeightG: 1580, targetFeedPerBirdG: 112 },
  { week: 25, targetHdPct: 95.5, targetFcr: 1.92, targetBodyWeightG: 1600, targetFeedPerBirdG: 113 },
  { week: 26, targetHdPct: 95.5, targetFcr: 1.92, targetBodyWeightG: 1615, targetFeedPerBirdG: 114 },
  { week: 28, targetHdPct: 95.0, targetFcr: 1.94, targetBodyWeightG: 1635, targetFeedPerBirdG: 115 },
  { week: 30, targetHdPct: 94.5, targetFcr: 1.96, targetBodyWeightG: 1650, targetFeedPerBirdG: 115 },
  { week: 32, targetHdPct: 94.0, targetFcr: 1.98, targetBodyWeightG: 1665, targetFeedPerBirdG: 116 },
  { week: 35, targetHdPct: 93.0, targetFcr: 2.00, targetBodyWeightG: 1680, targetFeedPerBirdG: 116 },
  { week: 40, targetHdPct: 91.5, targetFcr: 2.04, targetBodyWeightG: 1700, targetFeedPerBirdG: 117 },
  { week: 45, targetHdPct: 89.8, targetFcr: 2.08, targetBodyWeightG: 1715, targetFeedPerBirdG: 117 },
  { week: 50, targetHdPct: 88.0, targetFcr: 2.12, targetBodyWeightG: 1730, targetFeedPerBirdG: 118 },
  { week: 55, targetHdPct: 86.2, targetFcr: 2.16, targetBodyWeightG: 1740, targetFeedPerBirdG: 118 },
  { week: 60, targetHdPct: 84.5, targetFcr: 2.20, targetBodyWeightG: 1750, targetFeedPerBirdG: 118 },
  { week: 65, targetHdPct: 82.5, targetFcr: 2.25, targetBodyWeightG: 1760, targetFeedPerBirdG: 119 },
  { week: 70, targetHdPct: 80.5, targetFcr: 2.30, targetBodyWeightG: 1765, targetFeedPerBirdG: 119 },
  { week: 75, targetHdPct: 78.5, targetFcr: 2.35, targetBodyWeightG: 1770, targetFeedPerBirdG: 119 },
  { week: 80, targetHdPct: 76.5, targetFcr: 2.40, targetBodyWeightG: 1775, targetFeedPerBirdG: 120 },
  { week: 85, targetHdPct: 74.5, targetFcr: 2.45, targetBodyWeightG: 1780, targetFeedPerBirdG: 120 },
  { week: 90, targetHdPct: 72.5, targetFcr: 2.50, targetBodyWeightG: 1785, targetFeedPerBirdG: 120 },
  { week: 95, targetHdPct: 70.5, targetFcr: 2.55, targetBodyWeightG: 1790, targetFeedPerBirdG: 120 },
  { week: 100, targetHdPct: 68.0, targetFcr: 2.60, targetBodyWeightG: 1795, targetFeedPerBirdG: 120 },
];

/**
 * Returns BV300 standard targets for any flock age in weeks (18–100).
 * Uses linear interpolation for exact week matches.
 */
export function getBV300StandardForWeek(week: number): BV300StandardPoint {
  const w = Math.max(18, Math.min(100, week));
  
  const exact = BV300_STANDARD_CURVE.find(p => p.week === Math.round(w));
  if (exact) return exact;

  // Find bounding points for interpolation
  let lower = BV300_STANDARD_CURVE[0];
  let upper = BV300_STANDARD_CURVE[BV300_STANDARD_CURVE.length - 1];

  for (let i = 0; i < BV300_STANDARD_CURVE.length - 1; i++) {
    if (BV300_STANDARD_CURVE[i].week <= w && BV300_STANDARD_CURVE[i + 1].week >= w) {
      lower = BV300_STANDARD_CURVE[i];
      upper = BV300_STANDARD_CURVE[i + 1];
      break;
    }
  }

  const ratio = (w - lower.week) / (upper.week - lower.week || 1);

  return {
    week: w,
    targetHdPct: Number((lower.targetHdPct + (upper.targetHdPct - lower.targetHdPct) * ratio).toFixed(1)),
    targetFcr: Number((lower.targetFcr + (upper.targetFcr - lower.targetFcr) * ratio).toFixed(2)),
    targetBodyWeightG: Math.round(lower.targetBodyWeightG + (upper.targetBodyWeightG - lower.targetBodyWeightG) * ratio),
    targetFeedPerBirdG: Number((lower.targetFeedPerBirdG + (upper.targetFeedPerBirdG - lower.targetFeedPerBirdG) * ratio).toFixed(1)),
  };
}

export interface BreedVarianceReport {
  week: number;
  actualHdPct: number;
  targetHdPct: number;
  hdVariance: number;          // actual - target
  actualFcr: number;
  targetFcr: number;
  fcrVariance: number;         // actual - target (lower is better)
  actualBodyWeightG: number;
  targetBodyWeightG: number;
  status: 'Peak Perform' | 'On Target' | 'Minor Lag' | 'Needs Attention' | 'Critical Lag';
}

/**
 * Calculates variance between a shed's actual metrics and the BV300 standard benchmark.
 */
export function calculateBreedVariance(
  week: number,
  actualHdPct: number,
  actualFcr: number,
  actualBodyWeightG: number = 0
): BreedVarianceReport {
  const std = getBV300StandardForWeek(week);

  const hdVariance = Number((actualHdPct - std.targetHdPct).toFixed(1));
  const fcrVariance = Number((actualFcr - std.targetFcr).toFixed(2));

  let status: BreedVarianceReport['status'] = 'On Target';

  if (hdVariance >= 2.0 && fcrVariance <= 0) {
    status = 'Peak Perform';
  } else if (hdVariance >= -3.0 && fcrVariance <= 0.15) {
    status = 'On Target';
  } else if (hdVariance >= -7.0 && fcrVariance <= 0.35) {
    status = 'Minor Lag';
  } else if (hdVariance >= -12.0 || fcrVariance <= 0.50) {
    status = 'Needs Attention';
  } else {
    status = 'Critical Lag';
  }

  return {
    week,
    actualHdPct,
    targetHdPct: std.targetHdPct,
    hdVariance,
    actualFcr,
    targetFcr: std.targetFcr,
    fcrVariance,
    actualBodyWeightG,
    targetBodyWeightG: std.targetBodyWeightG,
    status,
  };
}
