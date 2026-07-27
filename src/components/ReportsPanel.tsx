'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Share2,
  Calendar,
  Grid3X3,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { dbService, DBDailyEntry, isChickShed } from '../services/db';

// React PDF client components
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

interface ReportsPanelProps {
  userRole: 'Owner' | 'Supervisor';
  assignedUnit: number;
}

// -------------------------------------------------------------
// PDF REPORT STYLE SHEET
// -------------------------------------------------------------
const pdfStyles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { borderBottomWidth: 2, borderBottomColor: '#1B5E20', pb: 10, mb: 20 },
  brand: { fontSize: 18, fontWeight: 'bold', color: '#1B5E20' },
  tagline: { fontSize: 8, color: '#F9A825', marginTop: 2, fontWeight: 'bold', textTransform: 'uppercase' },
  title: { fontSize: 12, marginTop: 15, fontWeight: 'bold', color: '#334155' },
  metaContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, mb: 20 },
  metaText: { fontSize: 9, color: '#64748b' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: 15 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1B5E20', color: '#ffffff', padding: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', padding: 6 },
  th: { fontSize: 8, fontWeight: 'bold', flex: 1 },
  td: { fontSize: 8, flex: 1, color: '#334155' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, borderTopWidth: 1, borderTopColor: '#e2e8f0', pt: 10, textAlign: 'center' },
  footerText: { fontSize: 8, color: '#94a3b8' }
});

// PDF Document Component with support for Today, 7D, 30D, 90D
const PoultryPDFReport = ({
  data,
  title,
  date,
  unitId,
  unitName,
  dateRange,
  startDate,
}: {
  data: DBDailyEntry[];
  title: string;
  date: string;
  unitId: number;
  unitName: string;
  dateRange: 'today' | '7d' | '30d' | '90d';
  startDate: string;
}) => {
  const rangeLabel =
    dateRange === 'today'
      ? 'Today'
      : dateRange === '7d'
      ? '7-Day Performance Audit'
      : dateRange === '30d'
      ? '30-Day Executive Report'
      : '90-Day Bank / Operational Audit';

  const periodDisplay = dateRange === 'today' ? date : `${startDate} to ${date}`;

  // Summary KPIs
  const totalEggs = data.reduce((s, e) => s + e.eggsCount, 0);
  const totalMortality = data.reduce((s, e) => s + e.mortality, 0);
  const totalFeed = data.reduce((s, e) => s + e.feedKg, 0);
  const avgFCR = data.length > 0 ? (data.reduce((s, e) => s + e.fcr, 0) / data.length).toFixed(2) : '0';
  const avgHD = data.length > 0 ? (data.reduce((s, e) => s + e.hdPct, 0) / data.length).toFixed(1) : '0';
  const avgScore = data.length > 0 ? Math.round(data.reduce((s, e) => s + e.performanceScore, 0) / data.length) : 0;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.brand}>Sri Mahalakshmi Poultry AI ERP</Text>
          <Text style={pdfStyles.tagline}>Intelligent Poultry Management • Executive Audit Report</Text>
        </View>

        {/* Meta & Period Banner */}
        <View style={pdfStyles.metaContainer}>
          <View>
            <Text style={pdfStyles.title}>{title} ({rangeLabel})</Text>
            <Text style={[pdfStyles.metaText, { marginTop: 4 }]}>Unit: {unitName}</Text>
            <Text style={[pdfStyles.metaText, { marginTop: 2 }]}>Reporting Period: {periodDisplay}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={pdfStyles.metaText}>Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</Text>
            <Text style={[pdfStyles.metaText, { marginTop: 4, fontWeight: 'bold' }]}>Overall Score: {avgScore} / 100</Text>
          </View>
        </View>

        {/* Executive Summary Box */}
        <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 6, border: '1 border-slate-200', padding: 8, marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 7, color: '#64748b', fontWeight: 'bold' }}>TOTAL EGGS</Text>
            <Text style={{ fontSize: 11, color: '#166534', fontWeight: 'bold', marginTop: 2 }}>{totalEggs.toLocaleString()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 7, color: '#64748b', fontWeight: 'bold' }}>TOTAL MORTALITY</Text>
            <Text style={{ fontSize: 11, color: '#dc2626', fontWeight: 'bold', marginTop: 2 }}>{totalMortality} birds</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 7, color: '#64748b', fontWeight: 'bold' }}>FEED CONSUMED</Text>
            <Text style={{ fontSize: 11, color: '#2563eb', fontWeight: 'bold', marginTop: 2 }}>{Math.round(totalFeed).toLocaleString()} kg</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 7, color: '#64748b', fontWeight: 'bold' }}>AVG HD%</Text>
            <Text style={{ fontSize: 11, color: '#166534', fontWeight: 'bold', marginTop: 2 }}>{avgHD}%</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 7, color: '#64748b', fontWeight: 'bold' }}>AVG FCR</Text>
            <Text style={{ fontSize: 11, color: '#15803d', fontWeight: 'bold', marginTop: 2 }}>{avgFCR}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.th, { flex: 1 }]}>Shed Slot</Text>
            <Text style={[pdfStyles.th, { flex: 1, textAlign: 'right' }]}>Birds</Text>
            <Text style={[pdfStyles.th, { flex: 1, textAlign: 'right' }]}>Mortality</Text>
            <Text style={[pdfStyles.th, { flex: 1, textAlign: 'right' }]}>Feed (kg)</Text>
            <Text style={[pdfStyles.th, { flex: 1, textAlign: 'right' }]}>Eggs Gathered</Text>
            <Text style={[pdfStyles.th, { flex: 1, textAlign: 'right' }]}>HD %</Text>
            <Text style={[pdfStyles.th, { flex: 1, textAlign: 'right' }]}>FCR</Text>
            <Text style={[pdfStyles.th, { flex: 1, textAlign: 'right' }]}>Score</Text>
          </View>
          {data.map(item => (
            <View style={pdfStyles.tableRow} key={item.shedNumber}>
              <Text style={[pdfStyles.td, { flex: 1, fontWeight: 'bold' }]}>
                {isChickShed(unitId, item.shedNumber) ? 'Chick Shed' : `Shed ${item.shedNumber}`}
              </Text>
              <Text style={[pdfStyles.td, { flex: 1, textAlign: 'right' }]}>{item.closingBirds.toLocaleString()}</Text>
              <Text style={[pdfStyles.td, { flex: 1, textAlign: 'right', color: item.mortality > 0 ? '#dc2626' : '#334155' }]}>{item.mortality}</Text>
              <Text style={[pdfStyles.td, { flex: 1, textAlign: 'right' }]}>{Math.round(item.feedKg).toLocaleString()}</Text>
              <Text style={[pdfStyles.td, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>{item.eggsCount.toLocaleString()}</Text>
              <Text style={[pdfStyles.td, { flex: 1, textAlign: 'right' }]}>{item.hdPct}%</Text>
              <Text style={[pdfStyles.td, { flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#166534' }]}>{item.fcr}</Text>
              <Text style={[pdfStyles.td, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>{item.performanceScore}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={pdfStyles.footer}>
          <Text style={pdfStyles.footerText}>Sri Mahalakshmi Poultry AI ERP — Official Audit Document • Generated {new Date().toISOString()}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default function ReportsPanel({ userRole, assignedUnit }: ReportsPanelProps) {
  const [selectedUnit, setSelectedUnit] = useState<number>(1);
  const [reportDate, setReportDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<DBDailyEntry[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [unitsList, setUnitsList] = useState<{ id: number; name: string }[]>([]);

  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | '90d'>('today');
  // raw per-shed daily feed rows for weekly analysis
  const [rawDailyByShed, setRawDailyByShed] = useState<Record<number, { date: string; feedKg: number; birds: number }[]>>({});
  const [reportStartDate, setReportStartDate] = useState<string>('');

  useEffect(() => {
    async function loadUnits() {
      const u = await dbService.getUnits();
      setUnitsList(u);
    }
    loadUnits();
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const today = new Date().toISOString().split('T')[0];
    setReportDate(today);
  }, []);

  useEffect(() => {
    if (userRole === 'Supervisor') {
      setSelectedUnit(assignedUnit);
    }
  }, [userRole, assignedUnit]);

  useEffect(() => {
    if (!reportDate) return;

    async function loadReportData() {
      setLoading(true);
      try {
        let filterDays = 1;
        if (dateRange === '7d') filterDays = 7;
        if (dateRange === '30d') filterDays = 30;
        if (dateRange === '90d') filterDays = 90;

        const endDate = reportDate;
        const startDateObj = new Date(reportDate);
        startDateObj.setDate(startDateObj.getDate() - (filterDays - 1));
        const startDate = startDateObj.toISOString().split('T')[0];

        // Fetch entries in date range
        const data = await dbService.getDailyEntries({
          dateStart: startDate,
          dateEnd: endDate,
          unitId: selectedUnit
        });

        // Filter active entries
        const activeData = data.filter(e => e.status === 'Active');

        if (filterDays === 1) {
          setEntries(activeData);
        } else {
          // Aggregate data per shed across the selected period
          const aggregatedMap: Record<number, any> = {};
          const dailyByShed: Record<number, { date: string; feedKg: number; birds: number }[]> = {};

          activeData.forEach(entry => {
            const sNum = entry.shedNumber;
            if (!aggregatedMap[sNum]) {
              aggregatedMap[sNum] = {
                shedNumber: sNum,
                openingBirds: entry.openingBirds,
                mortality: 0,
                culls: 0,
                closingBirds: entry.closingBirds,
                feedKg: 0,
                waterLiters: 0,
                eggsCount: 0,
                eggWeightSum: 0,
                eggWeightCount: 0,
                uniformitySum: 0,
                uniformityCount: 0,
                bodyWeightSum: 0,
                bodyWeightCount: 0,
                birdAgeWeeks: entry.birdAgeWeeks,
                performanceScoreSum: 0,
                performanceScoreCount: 0,
                recordsCount: 0,
                date: entry.date,
              };
              dailyByShed[sNum] = [];
            }

            // collect raw daily feed row
            dailyByShed[sNum].push({
              date: entry.date,
              feedKg: entry.feedKg,
              birds: entry.closingBirds || entry.openingBirds,
            });

            const record = aggregatedMap[sNum];
            // Accumulate
            record.mortality += entry.mortality;
            record.culls += entry.culls;
            record.feedKg += entry.feedKg;
            record.waterLiters += entry.waterLiters;
            record.eggsCount += entry.eggsCount;

            if (entry.eggWeightG > 0) {
              record.eggWeightSum += entry.eggWeightG;
              record.eggWeightCount++;
            }
            if (entry.uniformity > 0) {
              record.uniformitySum += entry.uniformity;
              record.uniformityCount++;
            }
            if (entry.bodyWeight > 0) {
              record.bodyWeightSum += entry.bodyWeight;
              record.bodyWeightCount++;
            }
            if (entry.performanceScore > 0) {
              record.performanceScoreSum += entry.performanceScore;
              record.performanceScoreCount++;
            }

            // Keep the latest record's closingBirds and age
            if (entry.date >= record.date) {
              record.closingBirds = entry.closingBirds;
              record.birdAgeWeeks = entry.birdAgeWeeks;
              record.date = entry.date;
            }
            // Keep the oldest record's openingBirds
            if (entry.date <= record.date) {
              record.openingBirds = entry.openingBirds;
            }

            record.recordsCount++;
          });

          // Compile map back to list with averages
          const compiledList: DBDailyEntry[] = Object.values(aggregatedMap).map((r: any) => {
            const avgEggWeight = r.eggWeightCount > 0 ? Number((r.eggWeightSum / r.eggWeightCount).toFixed(1)) : 60.0;
            const avgUniformity = r.uniformityCount > 0 ? Number((r.uniformitySum / r.uniformityCount).toFixed(1)) : 85.0;
            const avgBodyWeight = r.bodyWeightCount > 0 ? Number((r.bodyWeightSum / r.bodyWeightCount).toFixed(0)) : 1680;
            const avgScore = r.performanceScoreCount > 0 ? Math.round(r.performanceScoreSum / r.performanceScoreCount) : 85;

            const hdPct = r.closingBirds > 0 ? Number(((r.eggsCount / r.recordsCount) / r.closingBirds * 100).toFixed(1)) : 0;
            const fcr = r.eggsCount > 0 ? Number((r.feedKg / ((r.eggsCount * avgEggWeight) / 1000)).toFixed(2)) : 2.15;
            const mortalityPct = r.openingBirds > 0 ? Number((r.mortality / r.openingBirds * 100).toFixed(2)) : 0;

            return {
              id: `agg-shed-${r.shedNumber}`,
              date: endDate,
              unitId: selectedUnit,
              shedNumber: r.shedNumber,
              weather: 'Multiple',
              temperature: 0,
              humidity: 0,
              status: 'Active',
              openingBirds: r.openingBirds,
              mortality: r.mortality,
              culls: r.culls,
              closingBirds: r.closingBirds,
              feedKg: Number(r.feedKg.toFixed(1)),
              waterLiters: Number(r.waterLiters.toFixed(1)),
              eggsCount: r.eggsCount,
              eggWeightG: avgEggWeight,
              uniformity: avgUniformity,
              bodyWeight: avgBodyWeight,
              birdAgeWeeks: r.birdAgeWeeks,
              medication: '',
              remarks: `Period: ${startDate} to ${endDate}`,
              hdPct,
              mortalityPct,
              feedPerBirdG: r.closingBirds > 0 ? Number(((r.feedKg / r.recordsCount) / r.closingBirds * 1000).toFixed(1)) : 0,
              waterPerBirdMl: r.closingBirds > 0 ? Number(((r.waterLiters / r.recordsCount) / r.closingBirds * 1000).toFixed(1)) : 0,
              fcr,
              waterToFeedRatio: r.feedKg > 0 ? Number((r.waterLiters / r.feedKg).toFixed(2)) : 2.0,
              eggMassKg: Number(((r.eggsCount * avgEggWeight) / 1000).toFixed(1)),
              performanceScore: avgScore,
              performanceRating: avgScore >= 90 ? 5 : avgScore >= 80 ? 4 : avgScore >= 70 ? 3 : avgScore >= 50 ? 2 : 1,
              performanceLabel: avgScore >= 90 ? 'Excellent' : avgScore >= 80 ? 'Very Good' : avgScore >= 70 ? 'Good' : 'Needs Attention',
            };
          });

          setEntries(compiledList.sort((a, b) => a.shedNumber - b.shedNumber));
          setRawDailyByShed(dailyByShed);
          setReportStartDate(startDate);
        }
      } catch (err) {
        console.error('Failed loading reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReportData();
  }, [reportDate, selectedUnit, dateRange]);

  const handlePrint = () => {
    window.print();
  };

  const handleCSVExport = () => {
    if (entries.length === 0) return;

    const unitObj = unitsList.find(u => u.id === selectedUnit);
    const unitLabel = unitObj ? unitObj.name.replace(/\s+/g, '_') : `Unit_${selectedUnit}`;
    const rangeTag = dateRange === 'today' ? 'Today' : dateRange.toUpperCase();
    const periodStr = dateRange === 'today' ? reportDate : `${reportStartDate}_to_${reportDate}`;

    // Metadata lines
    const metadata = [
      `"SRI MAHALAKSHMI POULTRY AI ERP - EXECUTIVE REPORT"`,
      `"Unit Name","${unitObj?.name || `Unit ${selectedUnit}`}"`,
      `"Report Preset","${rangeTag}"`,
      `"Reporting Period","${periodStr}"`,
      `"Generated Date","${new Date().toLocaleString()}"`,
      ``, // blank line separator
    ].join('\n');

    // Headers
    const headers = 'Shed Slot,Opening Birds,Mortality,Closing Birds,Feed Consumed (kg),Eggs Gathered,Egg Weight (g),Egg Mass (kg),HD %,FCR,Feed/Bird (g),Bird Age (Wks),Score,Performance Label\n';

    // Rows
    const rows = entries.map(e => {
      const slot = isChickShed(selectedUnit, e.shedNumber) ? 'Chick Shed' : `Shed ${e.shedNumber}`;
      return `"${slot}",${e.openingBirds},${e.mortality},${e.closingBirds},${e.feedKg},${e.eggsCount},${e.eggWeightG},${e.eggMassKg},${e.hdPct},${e.fcr},${e.feedPerBirdG},${e.birdAgeWeeks},${e.performanceScore},"${e.performanceLabel}"`;
    }).join('\n');

    const blob = new Blob([metadata + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Poultry_Report_${unitLabel}_${rangeTag}_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 w-1/3 rounded" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  // Aggregate stats for report overview
  const totalEggs = entries.reduce((sum, e) => sum + e.eggsCount, 0);
  const totalMortality = entries.reduce((sum, e) => sum + e.mortality, 0);
  const totalFeed = entries.reduce((sum, e) => sum + e.feedKg, 0);
  const avgFCR = entries.length > 0
    ? entries.reduce((sum, e) => sum + e.fcr, 0) / entries.length
    : 0;

  const avgShedScore = entries.length > 0
    ? entries.reduce((sum, e) => sum + e.performanceScore, 0) / entries.length
    : 0;

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 print:hidden">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            Reports Generator
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Export production datasets, compile audit-ready spreadsheets, and download PDF sheets
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Unit selection */}
          {userRole === 'Owner' && (
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(Number(e.target.value))}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-750 dark:text-slate-200 focus:outline-none focus:border-primary h-9"
            >
              {unitsList.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}

          {/* Date Range Selectors */}
          <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex gap-0.5 border border-slate-200/50 dark:border-slate-800 h-9 items-center">
            {([
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' }
            ] as const).map(range => (
              <button
                key={range.id}
                type="button"
                onClick={() => setDateRange(range.id)}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-200 ${dateRange === range.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Date Picker */}
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            onClick={(e) => e.currentTarget.showPicker?.()}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-750 dark:text-slate-200 focus:outline-none focus:border-primary h-9 cursor-pointer"
          />
        </div>
      </div>

      {/* Export Controls Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
          <FileText className="w-4 h-4 text-primary" />
          <span>Select format option to download or distribute the compiled report.</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Print */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          {/* Excel Export */}
          <button
            onClick={handleCSVExport}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Excel (CSV)</span>
          </button>

          {/* React PDF Download Button */}
          {isMounted && entries.length > 0 && (
            <PDFDownloadLink
              document={
                <PoultryPDFReport
                  data={entries}
                  title="Production Audit Report"
                  date={reportDate}
                  unitId={selectedUnit}
                  unitName={unitsList.find(u => u.id === selectedUnit)?.name || `Unit ${selectedUnit}`}
                  dateRange={dateRange}
                  startDate={reportStartDate || reportDate}
                />
              }
              fileName={`Poultry_Report_Unit_${selectedUnit}_${dateRange.toUpperCase()}_${reportDate}.pdf`}
              className="px-3.5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm text-center"
            >
              {({ loading: pdfLoading }) => (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{pdfLoading ? 'Preparing PDF...' : `Download ${dateRange.toUpperCase()} PDF`}</span>
                </>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {/* Main Print Layout Report Card */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-premium print:border-none print:shadow-none print:p-0 print:m-0 space-y-6">
        
        {/* Mockup Canvas Header (Landscape Setup) */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            {new Date().toLocaleDateString('en-GB')}, {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
          <div className="uppercase tracking-widest text-[9px] font-black text-slate-500">Sri Mahalakshmi Poultry AI ERP</div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-slate-400 font-semibold block">Reporting Period:</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {(() => {
                  if (dateRange === 'today') return reportDate;
                  let days = 7;
                  if (dateRange === '30d') days = 30;
                  if (dateRange === '90d') days = 90;
                  const start = new Date(reportDate);
                  start.setDate(start.getDate() - (days - 1));
                  return `${start.toISOString().split('T')[0]} to ${reportDate}`;
                })()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Unit Name:</span>
              <span className="font-extrabold text-slate-700 dark:text-slate-200">
                {unitsList.find(u => u.id === selectedUnit)?.name || `Unit ${selectedUnit}`}
              </span>
            </div>
          </div>
        </div>

        {/* Branding Section */}
        <div className="flex items-center gap-5 border-b-2 border-emerald-800/40 pb-5">
          {/* Logo */}
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-2 shadow-md shrink-0 relative overflow-hidden border border-slate-100">
            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-white opacity-85" />
            <svg viewBox="0 0 100 100" className="w-full h-full z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="45" r="22" fill="#F9A825" className="opacity-80" />
              <path d="M75 35 C60 45 40 40 40 60 C55 60 70 50 75 35 Z" fill="#1B5E20" className="opacity-90" />
              <path d="M48 70 C48 75 58 75 58 70 C58 65 48 65 48 70 Z" fill="#F9A825" />
              <path d="M28 72 C32 60 42 50 48 52 C52 53 52 48 50 45 C48 42 45 44 43 40 C41 36 43 32 46 30 C49 32 50 35 48 38 C54 36 60 44 65 52 C70 58 72 65 72 72 Z" fill="#1B5E20" />
            </svg>
          </div>
          <div>
            <h1 className="font-black text-xl tracking-wider text-emerald-800 dark:text-emerald-400 uppercase leading-none">
              SRI MAHALAKSHMI <span className="text-amber-500 font-bold">POULTRY AI ERP</span>
            </h1>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-white mt-1.5 leading-none flex items-center gap-1.5">
              <span>Sri Mahalakshmi Poultry</span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30">
                {unitsList.find(u => u.id === selectedUnit)?.name || `Unit ${selectedUnit}`}
              </span>
            </h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
              INTELLIGENT POULTRY MANAGEMENT POWERED BY AI
            </p>
          </div>
        </div>

        {/* 4-Column KPI Stats Grid Container */}
        <div className="grid grid-cols-4 border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden divide-x divide-slate-200 dark:divide-slate-700 bg-slate-50/20 dark:bg-slate-900/10">
          
          {/* Card 1: Eggs */}
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 shrink-0">
              <span className="text-lg">🥚</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">TOTAL EGGS GATHERED</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block leading-none">{totalEggs.toLocaleString()}</span>
            </div>
          </div>

          {/* Card 2: Mortality */}
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600 shrink-0">
              <span className="text-lg">🐔</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">DAILY MORTALITY COUNT</span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5 block leading-none">{totalMortality} birds</span>
            </div>
          </div>

          {/* Card 3: Feed */}
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600 shrink-0">
              <span className="text-lg">🏠</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">AVERAGE FEED / SHED</span>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5 block leading-none">{Math.round(totalFeed / (entries.length || 1))} kg</span>
            </div>
          </div>

          {/* Card 4: Score */}
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-800 dark:text-emerald-500 shrink-0">
              <span className="text-lg">⭐</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block">UNIT PERFORMANCE RATING</span>
              <span className="text-lg font-black text-emerald-800 dark:text-emerald-500 mt-0.5 block leading-none">{Math.round(avgShedScore)} Score</span>
            </div>
          </div>
        </div>

        {/* ── Per-Shed Daily Feed Analysis (weekly/multi-day only) ── */}
        {dateRange !== 'today' && Object.keys(rawDailyByShed).length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
              <span className="text-base">🌾</span>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                Per-Shed Daily Feed Consumption Analysis
              </h3>
              <span className="ml-auto text-[9px] font-bold text-slate-400 dark:text-slate-500">
                {reportStartDate} → {reportDate}
              </span>
            </div>

            {Object.entries(rawDailyByShed)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([shedNumStr, days]) => {
                const sNum = Number(shedNumStr);
                const shedLabel = isChickShed(selectedUnit, sNum) ? 'Chick Shed' : `Shed ${sNum}`;
                const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));
                const feedDays = sortedDays.filter(d => d.feedKg > 0);
                const totalFeedShed = sortedDays.reduce((s, d) => s + d.feedKg, 0);
                const avgPerFeedDay = feedDays.length > 0 ? totalFeedShed / feedDays.length : 0;
                const avgBirds = days.length > 0 ? Math.round(days.reduce((s, d) => s + d.birds, 0) / days.length) : 0;
                const avgPerBirdG = avgBirds > 0 && feedDays.length > 0 ? (avgPerFeedDay * 1000) / avgBirds : 0;

                return (
                  <div key={sNum} className="bg-slate-50/60 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 space-y-3">
                    {/* Shed header */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-black text-slate-800 dark:text-white">{shedLabel}</span>
                      <div className="flex flex-wrap gap-3">
                        <div className="text-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Total Feed</span>
                          <span className="text-sm font-black text-primary">{totalFeedShed.toFixed(0)} kg</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Feed Days</span>
                          <span className="text-sm font-black text-amber-600">{feedDays.length} / {sortedDays.length} days</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Avg / Feed Day</span>
                          <span className="text-sm font-black text-blue-600 dark:text-blue-400">{avgPerFeedDay.toFixed(0)} kg</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Avg / Bird</span>
                          <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{avgPerBirdG.toFixed(0)} g</span>
                        </div>
                      </div>
                    </div>

                    {/* Day-by-day feed row chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {sortedDays.map(d => {
                        const hasFeed = d.feedKg > 0;
                        const dayLabel = new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                        return (
                          <div
                            key={d.date}
                            className={`flex flex-col items-center px-2.5 py-1.5 rounded-xl border text-center min-w-[52px] ${
                              hasFeed
                                ? 'bg-primary/8 dark:bg-primary/15 border-primary/25 dark:border-primary/30'
                                : 'bg-amber-50/60 dark:bg-amber-900/10 border-dashed border-amber-300/60 dark:border-amber-800/40'
                            }`}
                          >
                            <span className={`text-[8.5px] font-bold ${ hasFeed ? 'text-slate-500 dark:text-slate-400' : 'text-amber-500 dark:text-amber-600' }`}>
                              {dayLabel}
                            </span>
                            <span className={`text-[10px] font-black mt-0.5 ${ hasFeed ? 'text-primary dark:text-emerald-400' : 'text-amber-400 dark:text-amber-600' }`}>
                              {hasFeed ? `${d.feedKg} kg` : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Mini progress bar: feed days vs no-feed days */}
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-bold text-slate-400 shrink-0">Feed Coverage</span>
                      <div className="flex-1 h-2 bg-amber-100 dark:bg-amber-900/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${sortedDays.length > 0 ? (feedDays.length / sortedDays.length) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-[8px] font-black text-primary shrink-0">
                        {sortedDays.length > 0 ? Math.round((feedDays.length / sortedDays.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Entries Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-emerald-900 text-white font-black uppercase text-[8.5px] tracking-wider">
                <th className="py-2.5 px-3 bg-emerald-900 border-none text-white font-extrabold text-[8.5px]">SHED SLOT</th>
                <th className="py-2.5 px-3 bg-emerald-900 border-none text-white font-extrabold text-[8.5px] text-right">BIRDS</th>
                <th className="py-2.5 px-3 bg-emerald-900 border-none text-white font-extrabold text-[8.5px] text-right">MORTALITY</th>
                <th className="py-2.5 px-3 bg-emerald-900 border-none text-white font-extrabold text-[8.5px] text-right">FEED (KG)</th>
                <th className="py-2.5 px-3 bg-emerald-900 border-none text-white font-extrabold text-[8.5px] text-right">TOTAL EGGS</th>
                <th className="py-2.5 px-3 bg-emerald-900 border-none text-white font-extrabold text-[8.5px] text-right">HD %</th>
                <th className="py-2.5 px-3 bg-emerald-900 border-none text-white font-extrabold text-[8.5px] text-right">FCR</th>
                <th className="py-2.5 px-3 bg-emerald-900 border-none text-white font-extrabold text-[8.5px] text-right">SCORE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-semibold text-slate-700 dark:text-slate-300">
              {entries.map(e => (
                <tr key={e.shedNumber} className="hover:bg-slate-50/40 dark:hover:bg-slate-700/10">
                  <td className="py-3 px-3 font-extrabold text-slate-800 dark:text-white">
                    {isChickShed(selectedUnit, e.shedNumber) ? 'Chick Shed' : `Shed ${e.shedNumber}`}
                  </td>
                  <td className="py-3 px-3 text-right">{e.closingBirds.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right text-red-500">{e.mortality}</td>
                  <td className="py-3 px-3 text-right">{e.feedKg.toFixed(1)}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-800 dark:text-white">{e.eggsCount.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right">{e.hdPct}%</td>
                  <td className="py-3 px-3 text-right font-black text-primary">{e.fcr}</td>
                  <td className="py-3 px-3 text-right font-black">{e.performanceScore}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400/80 font-bold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-2xl opacity-60">🗄️</span>
                      <span className="text-[11px] tracking-wide">No data reported for this date.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-emerald-800/40 pt-4 flex items-center justify-between text-[9px] text-slate-400 font-bold mt-4">
          <div className="flex items-center gap-1">
            <span>Generated by Sri Mahalakshmi Poultry AI ERP</span>
          </div>
          <div>Page 1 / 1</div>
        </div>
      </div>
    </div>
  );
}
