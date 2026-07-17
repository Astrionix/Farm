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
import { dbService, DBDailyEntry } from '../services/db';

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

// PDF Document Component
const PoultryPDFReport = ({ data, title, date, unitId }: { data: DBDailyEntry[], title: string, date: string, unitId: number }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      {/* Header */}
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.brand}>Sri Mahalakshmi Poultry</Text>
        <Text style={pdfStyles.tagline}>Intelligent Poultry Management Powered by AI</Text>
      </View>

      {/* Meta info */}
      <View style={pdfStyles.metaContainer}>
        <View>
          <Text style={pdfStyles.title}>{title}</Text>
          <Text style={[pdfStyles.metaText, { marginTop: 4 }]}>Unit Number: {unitId}</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={pdfStyles.metaText}>Generated Date: {new Date().toLocaleDateString()}</Text>
          <Text style={[pdfStyles.metaText, { marginTop: 4 }]}>Reporting Date: {date}</Text>
        </View>
      </View>

      {/* Table */}
      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableHeader}>
          <Text style={[pdfStyles.th, { flex: 0.8 }]}>Shed</Text>
          <Text style={pdfStyles.th}>Birds</Text>
          <Text style={pdfStyles.th}>Mortality</Text>
          <Text style={pdfStyles.th}>Feed (kg)</Text>
          <Text style={pdfStyles.th}>Eggs</Text>
          <Text style={pdfStyles.th}>HD%</Text>
          <Text style={pdfStyles.th}>FCR</Text>
          <Text style={pdfStyles.th}>Score</Text>
        </View>
        {data.map(item => (
          <View style={pdfStyles.tableRow} key={item.shedNumber}>
            <Text style={[pdfStyles.td, { flex: 0.8 }]}>Shed {item.shedNumber}</Text>
            <Text style={pdfStyles.td}>{item.closingBirds.toLocaleString()}</Text>
            <Text style={pdfStyles.td}>{item.mortality}</Text>
            <Text style={pdfStyles.td}>{Math.round(item.feedKg)}</Text>
            <Text style={pdfStyles.td}>{item.eggsCount.toLocaleString()}</Text>
            <Text style={pdfStyles.td}>{item.hdPct}%</Text>
            <Text style={pdfStyles.td}>{item.fcr}</Text>
            <Text style={pdfStyles.td}>{item.performanceScore}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={pdfStyles.footer}>
        <Text style={pdfStyles.footerText}>Sri Mahalakshmi Poultry AI ERP — Confidentially Generated Report</Text>
      </View>
    </Page>
  </Document>
);

export default function ReportsPanel({ userRole, assignedUnit }: ReportsPanelProps) {
  const [selectedUnit, setSelectedUnit] = useState<number>(1);
  const [reportDate, setReportDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<DBDailyEntry[]>([]);
  const [isMounted, setIsMounted] = useState(false);

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
        const data = await dbService.getDailyEntries({ 
          date: reportDate, 
          unitId: selectedUnit 
        });
        setEntries(data.filter(e => e.status === 'Active'));
      } catch (err) {
        console.error('Failed loading reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReportData();
  }, [reportDate, selectedUnit]);

  const handlePrint = () => {
    window.print();
  };

  const handleCSVExport = () => {
    if (entries.length === 0) return;
    
    // Construct CSV file content
    const headers = 'Shed Number,Opening Birds,Mortality,Closing Birds,Feed Consumed (kg),Water Consumed (L),Eggs Gathered,Egg Weight (g),HD%,FCR,Performance Score\n';
    const rows = entries.map(e => 
      `${e.shedNumber},${e.openingBirds},${e.mortality},${e.closingBirds},${e.feedKg},${e.waterLiters},${e.eggsCount},${e.eggWeightG},${e.hdPct},${e.fcr},${e.performanceScore}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Poultry_Report_Unit_${selectedUnit}_${reportDate}.csv`);
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
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-screen">
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
        <div className="flex flex-wrap items-center gap-3">
          {/* Unit selection */}
          {userRole === 'Owner' && (
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(Number(e.target.value))}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
            >
              {[1, 2, 3, 4].map(u => (
                <option key={u} value={u}>Unit {u}</option>
              ))}
            </select>
          )}

          {/* Date Picker */}
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
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
                  title="Daily Production Audit Sheet" 
                  date={reportDate} 
                  unitId={selectedUnit} 
                />
              }
              fileName={`Poultry_Report_Unit_${selectedUnit}_${reportDate}.pdf`}
              className="px-3.5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm text-center"
            >
              {({ loading: pdfLoading }) => (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{pdfLoading ? 'Loading PDF...' : 'Download PDF'}</span>
                </>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {/* Main Print Layout Report Card */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-premium print:border-none print:shadow-none space-y-6">
        {/* Printable Header */}
        <div className="flex justify-between items-start border-b border-primary/20 pb-5">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">Sri Mahalakshmi Poultry</h3>
            <p className="text-[9px] text-secondary font-black tracking-widest uppercase mt-0.5">Intelligent Poultry Management Powered by AI</p>
          </div>
          <div className="text-right text-[10px] text-slate-400 font-semibold space-y-0.5">
            <div>Report: <span className="font-extrabold text-slate-700 dark:text-slate-200">Daily Production Audit</span></div>
            <div>Reporting Date: <span className="font-extrabold text-slate-700 dark:text-slate-200">{reportDate}</span></div>
            <div>Unit Number: <span className="font-extrabold text-slate-700 dark:text-slate-200">Unit {selectedUnit}</span></div>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Eggs Gathered</span>
            <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">{totalEggs.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Daily Mortality Count</span>
            <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">{totalMortality} birds</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Average Feed / Shed</span>
            <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">{Math.round(totalFeed / (entries.length || 1))} kg</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Unit Performance Rating</span>
            <span className="text-base font-black text-primary mt-1 block">{Math.round(avgShedScore)} Score</span>
          </div>
        </div>

        {/* Entries Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-slate-400 font-black uppercase text-[9px] tracking-wider">
                <th className="py-3 px-2">Shed Slot</th>
                <th className="py-3 px-2 text-right">Birds</th>
                <th className="py-3 px-2 text-right">Mortality</th>
                <th className="py-3 px-2 text-right">Feed (kg)</th>
                <th className="py-3 px-2 text-right">Water (L)</th>
                <th className="py-3 px-2 text-right">Total Eggs</th>
                <th className="py-3 px-2 text-right">Egg Weight (g)</th>
                <th className="py-3 px-2 text-right">HD %</th>
                <th className="py-3 px-2 text-right">FCR</th>
                <th className="py-3 px-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-semibold text-slate-700 dark:text-slate-300">
              {entries.map(e => (
                <tr key={e.shedNumber} className="hover:bg-slate-50/40 dark:hover:bg-slate-700/10">
                  <td className="py-3.5 px-2 font-extrabold text-slate-800 dark:text-white">Shed {e.shedNumber}</td>
                  <td className="py-3.5 px-2 text-right">{e.closingBirds.toLocaleString()}</td>
                  <td className="py-3.5 px-2 text-right text-red-500">{e.mortality}</td>
                  <td className="py-3.5 px-2 text-right">{e.feedKg.toFixed(1)}</td>
                  <td className="py-3.5 px-2 text-right">{e.waterLiters.toFixed(1)}</td>
                  <td className="py-3.5 px-2 text-right font-bold text-slate-800 dark:text-white">{e.eggsCount.toLocaleString()}</td>
                  <td className="py-3.5 px-2 text-right">{e.eggWeightG}</td>
                  <td className="py-3.5 px-2 text-right">{e.hdPct}%</td>
                  <td className="py-3.5 px-2 text-right font-black text-primary">{e.fcr}</td>
                  <td className="py-3.5 px-2 text-right font-black">{e.performanceScore}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 italic font-semibold">
                    No data reported for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
