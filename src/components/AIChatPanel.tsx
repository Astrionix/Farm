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
  MessageSquare
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
        text: `Welcome! I am **FlockMind**, your AI Poultry ERP Consultant. \nI have analyzed the farm logs and performance metrics for **${formattedDate}**. \n\nYou can ask me questions like:\n* **Compare Unit 1 and Unit 2** performance on this day.\n* **Why did production decrease** in Unit 3?\n* **Forecast tomorrow's production** numbers.\n* **Find abnormal mortality spikes** in the logs.`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      }
    ]);
  }, [selectedDate]);

  useEffect(() => {
    // Scroll chat to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const generateFarmAnalysis = async (targetDate?: string) => {
    const dateToAnalyze = targetDate || selectedDate || new Date().toISOString().split('T')[0];
    setLoading(true);
    try {
      // Get all entries for the selected day to find medications
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
        const report = await response.json();
        setInsights(report);
      }
    } catch (err) {
      console.error('Failed generating analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || chatLoading) return;

    const userMsg = inputVal.trim();
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    setMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp }]);
    setInputVal('');
    setChatLoading(true);

    try {
      const targetDate = selectedDate || new Date().toISOString().split('T')[0];
      const dayEntries = await dbService.getDailyEntries({ date: targetDate });
      const activeMeds = dayEntries.filter(e => e.medication && e.medication.trim() !== '' && e.medication.toLowerCase() !== 'none');

      const summary = await dbService.getAggregatedScores(targetDate);
      const allEntries = await dbService.getDailyEntries();

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg,
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

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full min-h-0 overflow-hidden bg-white dark:bg-slate-900">
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
      <div className={`w-full lg:w-[40%] xl:w-[38%] h-full flex flex-col border-r border-slate-200 dark:border-slate-800 ${
        activeMobileSubTab === 'insights' ? 'flex' : 'hidden lg:flex'
      }`}>
        
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/50 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-black text-slate-800 dark:text-white">Analytics Board</h3>
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
              <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              </div>
              <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              
              {/* Compact Executive Summary */}
              <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <span className="text-[10px] text-primary font-black uppercase tracking-wider block mb-1">Executive Summary</span>
                <p className="text-slate-700 dark:text-slate-300 text-xs font-medium leading-relaxed line-clamp-4" dangerouslySetInnerHTML={{ __html: insights.executiveSummary }} />
              </div>

              {/* 8-Card Responsive KPI Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 flex flex-col justify-between h-20 transition-transform hover:-translate-y-0.5 hover:shadow-md">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Top Unit</span>
                  <div>
                    <span className="text-sm font-black text-slate-800 dark:text-white leading-none">{insights.bestUnit}</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">{insights.bestShed}</span>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-2xl border border-red-100 dark:border-red-800/30 flex flex-col justify-between h-20 transition-transform hover:-translate-y-0.5 hover:shadow-md">
                  <span className="text-[10px] text-red-500 dark:text-red-400 font-bold uppercase tracking-wider">Highest Risk</span>
                  <div>
                    <span className="text-sm font-black text-slate-800 dark:text-white leading-none">{insights.worstUnit}</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">{insights.worstShed}</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-20 transition-transform hover:-translate-y-0.5 hover:shadow-md">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Farm Score</span>
                  <span className="text-sm font-black text-primary leading-none">92 / 100</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-20 transition-transform hover:-translate-y-0.5 hover:shadow-md">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Avg HD%</span>
                  <span className="text-sm font-black text-slate-800 dark:text-white leading-none">88.4%</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-20 transition-transform hover:-translate-y-0.5 hover:shadow-md">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Today's Eggs</span>
                  <span className="text-sm font-black text-slate-800 dark:text-white leading-none">24,500</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-20 transition-transform hover:-translate-y-0.5 hover:shadow-md">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Feed Eff.</span>
                  <span className="text-sm font-black text-slate-800 dark:text-white leading-none">1.45 FCR</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-20 transition-transform hover:-translate-y-0.5 hover:shadow-md">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Mortality</span>
                  <span className="text-sm font-black text-slate-800 dark:text-white leading-none">0.02%</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-20 transition-transform hover:-translate-y-0.5 hover:shadow-md">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Weather Impact</span>
                  <span className="text-sm font-black text-amber-500 leading-none">-1.2% Prod.</span>
                </div>
              </div>

              {/* Compact Observation Cards */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider mb-2">Key Observations</h4>
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/80 border border-red-100 dark:border-red-900/30 rounded-xl shadow-sm">
                  <AlertOctagon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase">Bio-Security</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight mt-0.5">{insights.observations.diseaseIndicators}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/80 border border-orange-100 dark:border-orange-900/30 rounded-xl shadow-sm">
                  <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase">Feed & Nutrition</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight mt-0.5">{insights.observations.feedIssues}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/80 border border-blue-100 dark:border-blue-900/30 rounded-xl shadow-sm">
                  <Gauge className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase">Water Ratio</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight mt-0.5">{insights.observations.waterIssues}</p>
                  </div>
                </div>
              </div>

              {/* Priority Actions */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-1.5 text-primary mb-3">
                  <CheckSquare className="w-4 h-4" />
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Priority Tasks</h4>
                </div>
                <ul className="space-y-2.5">
                  {insights.priorityActions.map((act: string, idx: number) => (
                    <li key={idx} className="flex gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium leading-tight">
                      <span className="w-4 h-4 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold">{idx + 1}</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Chat Workspace */}
      <div className={`w-full lg:w-[60%] xl:w-[62%] h-full flex flex-col bg-slate-50 dark:bg-slate-900/50 relative ${
        activeMobileSubTab === 'chat' ? 'flex' : 'hidden lg:flex'
      }`}>
        
        {/* Chat Header */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-secondary" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white leading-none">FlockMind AI</h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1 inline-block">Online • Connected to Farm Ledger</span>
            </div>
          </div>
          <button className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white uppercase px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            Clear
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
          {messages.map((m, i) => {
            const isBot = m.sender === 'bot';
            return (
              <div 
                key={i} 
                className={`flex gap-3 sm:gap-4 max-w-[90%] sm:max-w-[80%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  isBot ? 'bg-primary text-secondary' : 'bg-secondary text-primary-dark font-extrabold'
                }`}>
                  {isBot ? <Bot className="w-4 h-4 sm:w-5 sm:h-5" /> : <User className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>

                <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[10px] font-bold text-slate-500">{isBot ? 'FlockMind' : 'You'}</span>
                    {m.timestamp && <span className="text-[9px] font-semibold text-slate-400">{m.timestamp}</span>}
                  </div>
                  <div className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm border ${
                    isBot 
                      ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/60 rounded-tl-none' 
                      : 'bg-primary text-white border-primary-dark/20 rounded-tr-none animate-slide-up'
                  }`}>
                    <div 
                      className="whitespace-pre-wrap font-medium"
                      dangerouslySetInnerHTML={{ 
                        __html: m.text
                          .replace(/\*\*(.*?)\*\*/g, `<strong class="font-black ${isBot ? 'text-slate-900 dark:text-white' : 'text-white'}">$1</strong>`)
                          .replace(/^\*\s(.*)$/gm, '<li class="ml-4 list-disc my-1">$1</li>')
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          
          {chatLoading && (
            <div className="flex gap-4 mr-auto max-w-[80%]">
              <div className="w-9 h-9 rounded-full bg-primary text-secondary flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[10px] font-bold text-slate-500">FlockMind</span>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 rounded-tl-none flex items-center gap-1.5 shadow-sm">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Sticky Input Area */}
        <div className="shrink-0 bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-200 dark:border-slate-800">
          
          {/* Conditional Suggested Prompts */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              {[
                { label: 'Compare Units 1 & 2', query: 'Compare Unit 1 and Unit 2 performance on this day.' },
                { label: 'Production drop?', query: 'Why did production decrease in Unit 3?' },
                { label: 'Mortality spikes?', query: 'Find abnormal mortality spikes in the logs.' },
                { label: 'FCR Analysis', query: 'Which shed has the best FCR and why?' }
              ].map((pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputVal(pill.query);
                    setTimeout(() => handleSendMessage(new Event('submit') as any), 10);
                  }}
                  className="px-3 py-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary rounded-xl transition cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3 h-3 inline-block mr-1 opacity-70" />
                  {pill.label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-end bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <textarea
              placeholder="Ask anything about your poultry farm... (Shift+Enter for new line)"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={chatLoading}
              rows={1}
              className="flex-1 max-h-32 min-h-[44px] px-4 py-3 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none disabled:opacity-60 overflow-y-auto"
              style={{ height: inputVal ? 'auto' : '44px' }}
            />
            <button
              type="submit"
              disabled={chatLoading || !inputVal.trim()}
              className="m-1.5 p-2 bg-primary hover:bg-primary-dark text-white rounded-xl transition disabled:opacity-40 disabled:hover:bg-primary cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[9px] text-slate-400 font-semibold">AI can make mistakes. Verify critical farm actions.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
