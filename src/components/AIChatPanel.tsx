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
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([]);
  const [inputVal, setInputVal] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateFarmAnalysis(selectedDate);
    
    const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    setMessages([
      { 
        sender: 'bot', 
        text: `Welcome! I am **FlockMind**, your AI Poultry ERP Consultant. 
I have analyzed the farm logs and performance metrics for **${formattedDate}**. 

You can ask me questions like:
* **Compare Unit 1 and Unit 2** performance on this day.
* **Why did production decrease** in Unit 3?
* **Forecast tomorrow's production** numbers.
* **Find abnormal mortality spikes** in the logs.` 
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
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
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
        setMessages(prev => [...prev, { sender: 'bot', text: resJson.response }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I encountered an issue accessing the AI engine. Please try again.' }]);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: `Error connecting to the chat service. Details: ${err?.message || String(err)}` 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 lg:flex-row lg:gap-6 h-[calc(100vh-145px)] lg:h-[calc(100vh-2rem)] overflow-hidden">
      {/* Mobile Sub-Tab Selector */}
      <div className="lg:hidden flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
        <button
          onClick={() => setActiveMobileSubTab('insights')}
          className={`flex-1 py-2 rounded-lg text-xs font-extrabold uppercase transition ${
            activeMobileSubTab === 'insights'
              ? 'bg-primary text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          AI Insights
        </button>
        <button
          onClick={() => setActiveMobileSubTab('chat')}
          className={`flex-1 py-2 rounded-lg text-xs font-extrabold uppercase transition ${
            activeMobileSubTab === 'chat'
              ? 'bg-primary text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          Chat Consultant
        </button>
      </div>

      {/* LEFT PANEL: Executive AI Advisory Board */}
      <div className={`w-full lg:w-1/2 flex-col gap-5 overflow-y-auto pr-1 ${
        activeMobileSubTab === 'insights' ? 'flex' : 'hidden lg:flex'
      }`}>
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5.5 h-5.5 text-primary" />
            <h3 className="text-lg font-black text-slate-800 dark:text-white">AI Consulting Board</h3>
          </div>
          <div className="flex items-center gap-3">
            {/* Calendar Date Picker */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide shrink-0">📅 Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer w-28 border-none"
              />
            </div>
            
            <button
              onClick={() => generateFarmAnalysis(selectedDate)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-500 hover:text-primary transition flex items-center gap-1.5 text-xs font-bold uppercase border border-slate-200/50 dark:border-slate-700/50"
              title="Recalculate analysis metrics"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Analyzing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {loading || !insights ? (
          <div className="space-y-4 animate-pulse flex-1">
            <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
            <div className="h-44 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
            <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            {/* Medications Administered Card */}
            {medsToday.length > 0 && (
              <div className="bg-amber-500/10 dark:bg-amber-500/5 p-4 rounded-2xl border border-amber-500/25 shadow-premium space-y-2">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-black text-[10px] uppercase tracking-wider">
                  <span>💊 Treatments Administered on {new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                </div>
                <div className="space-y-1.5 mt-1">
                  {medsToday.map((m, idx) => (
                    <div key={idx} className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <div>
                        <span className="font-extrabold text-primary">{m.unitId === 4 ? 'Chick Shed' : `Unit ${m.unitId} Shed ${m.shedNumber}`}</span>: <span className="font-black text-amber-600 dark:text-amber-400">{m.medication}</span>
                        {m.remarks && <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Note: {m.remarks}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Executive Summary Card */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium">
              <span className="text-[10px] text-primary font-black uppercase tracking-wider block">Executive Summary</span>
              <p className="text-slate-600 dark:text-slate-300 text-xs font-semibold leading-relaxed mt-2.5" dangerouslySetInnerHTML={{ __html: insights.executiveSummary }} />
            </div>

            {/* Score Leaders */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50/20 dark:bg-emerald-950/5 p-4 rounded-xl border border-emerald-100/50 dark:border-emerald-900/10">
                <span className="text-[9px] text-primary font-black uppercase block tracking-wider">Top Performing Unit</span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-white block mt-1.5">{insights.bestUnit}</span>
                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Best Shed: {insights.bestShed}</span>
              </div>
              <div className="bg-red-50/20 dark:bg-red-950/5 p-4 rounded-xl border border-red-100/50 dark:border-red-900/10">
                <span className="text-[9px] text-red-500 font-black uppercase block tracking-wider">Highest Risk / Defect</span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-white block mt-1.5">{insights.worstUnit}</span>
                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Lowest Shed: {insights.worstShed}</span>
              </div>
            </div>

            {/* Observations (Tabs/Grid) */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium space-y-3.5">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Observations Log</h4>
              
              <div className="space-y-3 text-xs font-semibold">
                <div className="p-3 bg-red-50/30 dark:bg-red-950/10 rounded-xl border border-red-100/30">
                  <span className="text-red-500 font-black uppercase text-[9px] tracking-wider block">Bio-Security & Diseases</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 leading-snug">{insights.observations.diseaseIndicators}</p>
                </div>
                <div className="p-3 bg-orange-50/30 dark:bg-orange-950/10 rounded-xl border border-orange-100/30">
                  <span className="text-orange-500 font-black uppercase text-[9px] tracking-wider block">Feed & Nutrition Issues</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 leading-snug">{insights.observations.feedIssues}</p>
                </div>
                <div className="p-3 bg-blue-50/30 dark:bg-blue-950/10 rounded-xl border border-blue-100/30">
                  <span className="text-blue-500 font-black uppercase text-[9px] tracking-wider block">Water & Hydration Ratio</span>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 leading-snug">{insights.observations.waterIssues}</p>
                </div>
                {insights.observations.weatherCorrelation && (
                  <div className="p-3 bg-amber-50/30 dark:bg-amber-950/10 rounded-xl border border-amber-100/30">
                    <span className="text-amber-600 dark:text-amber-400 font-black uppercase text-[9px] tracking-wider block">Weather & Climate Correlation</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 leading-snug">{insights.observations.weatherCorrelation}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Priority Actions */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium space-y-3">
              <div className="flex items-center gap-1.5 text-primary">
                <CheckSquare className="w-4.5 h-4.5" />
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Priority Tasks</h4>
              </div>
              <ul className="space-y-2">
                {insights.priorityActions.map((act: string, idx: number) => (
                  <li key={idx} className="flex gap-2.5 text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                    <span className="w-4 h-4 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold mt-0.5">{idx + 1}</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Predictions & Risk */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-red-500 mb-1.5">
                  <AlertTriangle className="w-4.5 h-4.5" />
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Risk Analysis</h4>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-xs font-semibold leading-relaxed pl-6">{insights.riskAnalysis}</p>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4">
                <div className="flex items-center gap-1.5 text-secondary mb-3">
                  <TrendingUp className="w-4.5 h-4.5" />
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Forecast Model</h4>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold pl-6">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold block">Tomorrow</span>
                    <span className="font-black text-slate-800 dark:text-white mt-1 block">{insights.predictions.tomorrow}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold block">Weekly Est.</span>
                    <span className="font-black text-slate-800 dark:text-white mt-1 block">{insights.predictions.weekly}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold block">Monthly Est.</span>
                    <span className="font-black text-slate-800 dark:text-white mt-1 block">{insights.predictions.monthly}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Interactive Chat Assistant */}
      <div className={`w-full lg:w-1/2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium flex flex-col h-full overflow-hidden ${
        activeMobileSubTab === 'chat' ? 'flex' : 'hidden lg:flex'
      }`}>
        {/* Header */}
        <div className="bg-primary text-white p-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <Bot className="w-5.5 h-5.5 text-secondary animate-bounce-slow" />
            <div>
              <h3 className="text-sm font-extrabold leading-none">FlockMind AI Consultant</h3>
              <span className="text-[9px] text-emerald-200 font-bold mt-1 inline-block">Online • Connected to Farm Ledger</span>
            </div>
          </div>
          <MessageSquare className="w-5 h-5 opacity-40" />
        </div>

        {/* Message Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
          {messages.map((m, i) => {
            const isBot = m.sender === 'bot';
            return (
              <div 
                key={i} 
                className={`flex gap-3 max-w-[88%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  isBot ? 'bg-primary text-white' : 'bg-secondary text-primary-dark font-extrabold'
                }`}>
                  {isBot ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                </div>

                {/* Bubble */}
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed font-medium shadow-sm border ${
                  isBot 
                    ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700/60' 
                    : 'bg-primary text-white border-primary-dark/20 animate-slide-up'
                }`}>
                  {/* Clean Markdown rendering support */}
                  <div 
                    className="whitespace-pre-line font-semibold"
                    dangerouslySetInnerHTML={{ 
                      __html: m.text
                        .replace(/\*\*(.*?)\*\*/g, `<strong class="font-black ${isBot ? 'text-slate-900 dark:text-white' : 'text-white'}">$1</strong>`)
                        .replace(/^\*\s(.*)$/gm, '<li class="ml-4 list-disc my-1">$1</li>')
                    }}
                  />
                </div>
              </div>
            );
          })}
          
          {/* Thinking bubble */}
          {chatLoading && (
            <div className="flex gap-3 mr-auto max-w-[85%]">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2.5 h-2.5 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Click-to-Prompt Suggestions Grid */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 flex gap-2 overflow-x-auto scrollbar-hide bg-slate-50/20 dark:bg-slate-950/40 shrink-0">
          {[
            { label: 'Compare Units 1 & 2', query: 'Compare Unit 1 and Unit 2 performance on this day.' },
            { label: 'Production drop?', query: 'Why did production decrease in Unit 3?' },
            { label: 'Mortality spikes?', query: 'Find abnormal mortality spikes in the logs.' },
            { label: 'FCR Analysis', query: 'Which shed has the best FCR and why?' }
          ].map((pill, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputVal(pill.query)}
              className="px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider text-primary dark:text-secondary bg-primary/5 hover:bg-primary/10 border border-primary/20 dark:border-secondary/20 rounded-full shrink-0 transition cursor-pointer"
            >
              💡 {pill.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2 bg-white dark:bg-slate-900 shrink-0">
          <input
            type="text"
            placeholder="Ask a question about your farm ledger..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={chatLoading}
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-primary disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={chatLoading || !inputVal.trim()}
            className="p-3 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-md transition disabled:bg-primary/40 cursor-pointer shrink-0"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
