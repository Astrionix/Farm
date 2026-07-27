'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  TrendingUp, 
  AlertOctagon, 
  AlertTriangle,
  CheckSquare, 
  RefreshCw,
  Gauge,
  BrainCircuit,
  MessageSquare,
  Activity,
  ArrowRight,
  Clock,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { dbService } from '../services/db';

export default function AIChatPanel() {
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [activeMobileSubTab, setActiveMobileSubTab] = useState<'insights' | 'chat'>('insights');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [medsToday, setMedsToday] = useState<any[]>([]);
  
  // Chat state
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; timestamp?: string }>>([]);
  const [inputVal, setInputVal] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateFarmAnalysis(selectedDate);
    
    const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    setMessages([
      { 
        sender: 'bot', 
        text: `Welcome! I am **FlockMind**, your AI Poultry Consultant & Decision Support System. \nI have analyzed the farm logs and performance metrics for **${formattedDate}**. \n\nYou can ask me analytical questions like:\n* **Why did Unit 2 perform worse?**\n* **Which shed needs attention first?**\n* **Predict next week's egg production.**\n* **Compare today's performance with last Monday.**\n* **What if humidity increases to 85%?**`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      }
    ]);
  }, [selectedDate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const generateFarmAnalysis = async (targetDate?: string) => {
    const dateToAnalyze = targetDate || selectedDate || new Date().toISOString().split('T')[0];
    setLoading(true);
    try {
      const dayEntries = await dbService.getDailyEntries({ date: dateToAnalyze });
      const activeMeds = dayEntries.filter(e => e.medication && e.medication.trim() !== '' && e.medication.toLowerCase() !== 'none');
      setMedsToday(activeMeds);

      const summary = await dbService.getAggregatedScores(dateToAnalyze);
      const allEntries = await dbService.getDailyEntries();
      
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dataSummary: {
            ...summary,
            medicationsAdministered: activeMeds.map(m => ({
              unitId: m.unitId,
              shedNumber: m.shedNumber,
              medication: m.medication,
              remarks: m.remarks
            })),
            dailyEntries: dayEntries.map(e => ({
              unitId: e.unitId,
              shedNumber: e.shedNumber,
              openingBirds: e.openingBirds,
              mortality: e.mortality,
              culls: e.culls,
              closingBirds: e.closingBirds,
              feedKg: e.feedKg,
              waterLiters: e.waterLiters,
              eggsCount: e.eggsCount,
              eggWeightG: e.eggWeightG,
              uniformity: e.uniformity,
              bodyWeight: e.bodyWeight,
              birdAgeWeeks: e.birdAgeWeeks,
              medication: e.medication,
              remarks: e.remarks,
              fcr: e.fcr,
              hdPct: e.hdPct,
              performanceScore: e.performanceScore,
              performanceLabel: e.performanceLabel
            })),
            historicalLogs: allEntries.slice(0, 300).map(e => ({
              date: e.date,
              unitId: e.unitId,
              shedNumber: e.shedNumber,
              mortality: e.mortality,
              eggsCount: e.eggsCount,
              medication: e.medication || '',
              remarks: e.remarks || ''
            }))
          }
        })
      });

      if (response.ok) {
        const resJson = await response.json();
        setInsights(resJson);
      } else {
        console.error('Failed to generate insights');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = inputVal.trim();
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    setMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp }]);
    setInputVal('');
    setChatLoading(true);

    try {
      const dayEntries = await dbService.getDailyEntries({ date: selectedDate });
      const summary = await dbService.getAggregatedScores(selectedDate);
      const allEntries = await dbService.getDailyEntries();

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg,
          context: {
            summary,
            dailyEntries: dayEntries.map(e => ({
              unitId: e.unitId,
              shedNumber: e.shedNumber,
              openingBirds: e.openingBirds,
              mortality: e.mortality,
              culls: e.culls,
              closingBirds: e.closingBirds,
              feedKg: e.feedKg,
              waterLiters: e.waterLiters,
              eggsCount: e.eggsCount,
              eggWeightG: e.eggWeightG,
              uniformity: e.uniformity,
              bodyWeight: e.bodyWeight,
              birdAgeWeeks: e.birdAgeWeeks,
              medication: e.medication,
              remarks: e.remarks,
              fcr: e.fcr,
              hdPct: e.hdPct,
              performanceScore: e.performanceScore,
              performanceLabel: e.performanceLabel
            })),
            historicalLogs: allEntries.slice(0, 300).map(e => ({
              date: e.date,
              unitId: e.unitId,
              shedNumber: e.shedNumber,
              mortality: e.mortality,
              eggsCount: e.eggsCount,
              medication: e.medication || '',
              remarks: e.remarks || ''
            }))
          }
        })
      });

      if (response.ok) {
        const resJson = await response.json();
        setMessages(prev => [...prev, { sender: 'bot', text: resJson.response, timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I encountered an issue accessing the AI engine. Please try again.', timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }]);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: `Error connecting to the chat service. Details: ${err?.message || String(err)}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  };

  const getAlertColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30';
      case 'high': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30';
      case 'medium': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30';
      case 'low': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/30';
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col lg:flex-row bg-white dark:bg-slate-900">
      {/* Mobile Sub-Tab Selector */}
      <div className="lg:hidden flex bg-slate-50 dark:bg-slate-900 p-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex bg-slate-200/50 dark:bg-slate-800/80 p-1 rounded-xl w-full">
          <button
            onClick={() => setActiveMobileSubTab('insights')}
            className={`flex-1 py-2 rounded-lg text-xs font-extrabold uppercase transition ${
              activeMobileSubTab === 'insights'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            AI Insights
          </button>
          <button
            onClick={() => setActiveMobileSubTab('chat')}
            className={`flex-1 py-2 rounded-lg text-xs font-extrabold uppercase transition ${
              activeMobileSubTab === 'chat'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Chat Consultant
          </button>
        </div>
      </div>

      {/* LEFT PANEL: Analytics & Insights */}
      <div className={`w-full lg:w-[45%] xl:w-[42%] h-full flex flex-col border-r border-slate-200 dark:border-slate-800 ${
        activeMobileSubTab === 'insights' ? 'flex' : 'hidden lg:flex'
      }`}>
        
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/50 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-black text-slate-800 dark:text-white">Decision Support</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer w-28 border-none"
              />
            </div>
            <button
              onClick={() => generateFarmAnalysis(selectedDate)}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-primary transition border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
              title="Recalculate analysis metrics"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Scrollable Analytics Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30 dark:bg-slate-900/20">
          {loading || !insights ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in pb-10">
              
              {/* 1. Manager Dashboard Snapshot */}
              <div className="bg-slate-800 dark:bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-premium relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                <h4 className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-3">Farm Management Snapshot</h4>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-300 block leading-tight">Status</span>
                      <span className="text-lg font-black text-white leading-tight">{insights.managerDashboard.status}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-300 block leading-tight">Overall Score</span>
                    <span className="text-xl font-black text-primary leading-tight">{insights.managerDashboard.score}<span className="text-xs text-slate-500">/100</span></span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Top Performing</span>
                    <span className="text-xs font-black text-emerald-400 block truncate">{insights.managerDashboard.topUnit}</span>
                  </div>
                  <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Needs Attention</span>
                    <span className="text-xs font-black text-red-400 block truncate">{insights.managerDashboard.needsAttention}</span>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl flex items-start gap-3">
                  <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-primary font-black uppercase tracking-wider block">Recommended Action</span>
                    <p className="text-xs text-slate-200 mt-0.5 leading-snug">{insights.managerDashboard.recommendedAction}</p>
                  </div>
                </div>
              </div>

              {/* 2. Executive Summary & Farm Health Breakdown */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Executive Summary</h4>
                  <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/30">
                    Confidence: {insights.farmHealth.confidence}%
                  </span>
                </div>
                
                <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">{insights.executiveSummary}</p>
                <div className="bg-red-50 dark:bg-red-900/10 border-l-2 border-red-500 p-2.5 rounded-r-xl mb-2">
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">Primary Concern:</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{insights.primaryConcern}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/10 border-l-2 border-blue-500 p-2.5 rounded-r-xl mb-4">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Immediate Recommendation:</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{insights.immediateRecommendation}</p>
                  <span className="text-[9px] font-black text-blue-500 block mt-1">Expected Impact: {insights.expectedImpact}</span>
                </div>

                {/* Health Pillars */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Health Breakdown</span>
                  {Object.entries(insights.farmHealth.breakdown).map(([key, val]: any) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-20 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide capitalize">{key}</span>
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${val >= 90 ? 'bg-emerald-500' : val >= 75 ? 'bg-primary' : 'bg-orange-500'}`} style={{ width: `${val}%` }} />
                      </div>
                      <span className="text-[10px] font-black text-slate-800 dark:text-white w-6 text-right">{val}</span>
                    </div>
                  ))}
                  <p className="text-[8px] text-slate-400 mt-2 text-right">{insights.farmHealth.scoreExplanation}</p>
                </div>
              </div>

              {/* 3. Root Cause Analysis */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> Root Cause Analysis
                  </h4>
                  <span className="text-[9px] font-black bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800/30">
                    Confidence: {insights.rootCauseAnalysis.confidence}%
                  </span>
                </div>
                <p className="text-sm font-black text-slate-800 dark:text-white mb-3 pb-3 border-b border-slate-100 dark:border-slate-700/50">
                  {insights.rootCauseAnalysis.observation}
                </p>
                <div className="space-y-3">
                  {insights.rootCauseAnalysis.causes.map((cause: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cause.color === 'orange' ? 'bg-orange-500' : cause.color === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cause.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 uppercase block leading-none">Impact</span>
                        <span className="text-xs font-black text-slate-800 dark:text-white leading-none">{cause.impact}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Priority Alerts */}
              <div className="space-y-2">
                <h4 className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider ml-1">Priority Alerts</h4>
                {insights.priorityAlerts.map((alert: any, idx: number) => (
                  <div key={idx} className={`p-3 rounded-xl border flex gap-3 items-start ${getAlertColor(alert.level)}`}>
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider">{alert.level}</span>
                      </div>
                      <p className="text-xs font-bold mb-1 opacity-90">{alert.issue}</p>
                      {alert.action && (
                        <p className="text-[10px] font-semibold opacity-80 uppercase tracking-wide">→ {alert.action}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 5. Forecast & Trends Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 bg-gradient-to-br from-primary/10 to-transparent p-4 rounded-2xl border border-primary/20">
                  <h4 className="text-[10px] text-primary font-black uppercase tracking-wider mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Forecast Tomorrow
                  </h4>
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{insights.forecast.tomorrowEggs.value}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mt-1">Eggs</span>
                    </div>
                    <span className="text-sm font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                      {insights.forecast.tomorrowEggs.trend}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-primary/10">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">HD%</span>
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200">{insights.forecast.expectedHD}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Mortality</span>
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200">{insights.forecast.mortality}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Feed</span>
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200">{insights.forecast.feed}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Smart Recommendations */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h4 className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-3">Smart Recommendations</h4>
                <div className="space-y-2 mb-4">
                  {insights.smartRecommendations.actions.map((action: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{action}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 p-2.5 rounded-xl flex justify-between items-center">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Expected Improvement</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{insights.smartRecommendations.expectedImprovement}</span>
                </div>
              </div>

              {/* 7. Industry Benchmarks */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h4 className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-3">Industry Comparison</h4>
                <div className="space-y-3">
                  {Object.entries(insights.benchmarks).map(([key, val]: any) => (
                    <div key={key} className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0 last:pb-0">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-[9px] text-slate-400 block leading-none">Farm</span>
                          <span className="text-xs font-black text-slate-800 dark:text-white leading-none">{val.farm}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block leading-none">Industry</span>
                          <span className="text-xs font-bold text-slate-500 leading-none">{val.industry}</span>
                        </div>
                        <span className={`text-[10px] font-black w-16 text-right ${val.status === 'Better' ? 'text-emerald-500' : 'text-orange-500'}`}>
                          {val.status === 'Better' ? '▲ Better' : '▼ Lagging'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 8. AI Deep Dive & Confidence */}
              <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h4 className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">AI Deep Dive</h4>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed mb-4">
                  {insights.naturalLanguageInsight}
                </p>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Conclusion Confidence</span>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-sm font-black text-slate-800 dark:text-white">{insights.confidenceIndicator.statement}</span>
                    <span className="text-lg font-black text-primary leading-none">{insights.confidenceIndicator.confidence}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {insights.confidenceIndicator.basedOn.map((b: string, i: number) => (
                      <span key={i} className="text-[9px] font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                        ✓ {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Chat Consultant */}
      <div className={`flex-1 h-full flex flex-col bg-slate-50/50 dark:bg-slate-900/50 ${
        activeMobileSubTab === 'chat' ? 'flex' : 'hidden lg:flex'
      }`}>
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-yellow-400 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-white">FlockMind AI</h2>
              <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Decision Support Active
              </p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
              )}
              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 ${
                msg.sender === 'user' 
                  ? 'bg-primary text-slate-900 rounded-tr-sm shadow-md' 
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-700 shadow-sm'
              }`}>
                <div 
                  className="text-sm font-medium leading-relaxed whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                />
                {msg.timestamp && (
                  <span className={`text-[9px] font-bold block mt-2 text-right ${
                    msg.sender === 'user' ? 'text-slate-800/60' : 'text-slate-400'
                  }`}>
                    {msg.timestamp}
                  </span>
                )}
              </div>
              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          {chatLoading && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggested Prompts (disappears after first user message) */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2 justify-end">
            <button onClick={() => setInputVal("Which shed needs attention first?")} className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Which shed needs attention first?</button>
            <button onClick={() => setInputVal("Explain today's farm score.")} className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Explain today's farm score</button>
            <button onClick={() => setInputVal("What if humidity increases to 85%?")} className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">What if humidity increases to 85%?</button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto flex items-end gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary/50 transition-all shadow-inner">
            <textarea
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask FlockMind for decision support..."
              className="flex-1 bg-transparent border-none focus:outline-none text-sm text-slate-800 dark:text-white px-3 py-2 resize-none min-h-[44px] max-h-32 placeholder-slate-400 dark:placeholder-slate-500"
              rows={inputVal.split('\\n').length > 1 ? Math.min(inputVal.split('\\n').length, 4) : 1}
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || chatLoading}
              className="p-3 bg-primary hover:bg-yellow-400 text-slate-900 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-sm mb-0.5"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> FlockMind AI can make mistakes. Verify critical actions.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
