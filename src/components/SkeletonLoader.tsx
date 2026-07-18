'use client';

import React from 'react';

// Base shimmer pulse block
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700/60 rounded-xl ${className}`} />
  );
}

// Stat card skeleton (for Owner Dashboard KPI cards)
export function SkeletonStatCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-5 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-8 w-8 rounded-xl" />
      </div>
      <SkeletonBlock className="h-8 w-32" />
      <SkeletonBlock className="h-3 w-20" />
    </div>
  );
}

// Table row skeleton
export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBlock className={`h-3.5 ${i === 0 ? 'w-28' : 'w-16'}`} />
        </td>
      ))}
    </tr>
  );
}

// Full dashboard skeleton
export function SkeletonDashboard() {
  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-64" />
          <SkeletonBlock className="h-4 w-40" />
        </div>
        <SkeletonBlock className="h-9 w-28 rounded-xl" />
      </div>

      {/* KPI Cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <SkeletonStatCard key={i} />)}
      </div>

      {/* Chart area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SkeletonBlock className="h-64 lg:col-span-2" />
        <SkeletonBlock className="h-64" />
      </div>

      {/* Table area */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <SkeletonBlock className="h-5 w-48" />
        </div>
        <table className="w-full">
          <tbody>
            {[1, 2, 3, 4, 5].map(i => <SkeletonTableRow key={i} cols={5} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Shed card skeleton for Unit Dashboard
export function SkeletonShedCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-5 w-20" />
        <SkeletonBlock className="h-5 w-14 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-1">
            <SkeletonBlock className="h-3 w-12" />
            <SkeletonBlock className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Daily Entry form skeleton
export function SkeletonDailyEntry() {
  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-64" />
          <SkeletonBlock className="h-4 w-48" />
        </div>
        <SkeletonBlock className="h-9 w-36 rounded-xl" />
      </div>
      {/* Environmental panel */}
      <SkeletonBlock className="h-28 w-full rounded-2xl" />
      {/* Shed inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3].map(i => (
          <SkeletonBlock key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
