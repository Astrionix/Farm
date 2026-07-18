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
  
  // Chat state
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    { 
      sender: 'bot', 
      text: `Welcome! I am **FlockMind**, your AI Poultry ERP Consultant. 
I have analyzed today's farm logs and inventory ledgers. 

You can ask me questions like:
* **Compare Unit 1 and Unit 2** performance today.
* **Why did production decrease** in Unit 3?
* **Forecast tomorrow's production** numbers.
* **Find abnormal mortality spikes** in the logs.` 
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateFarmAnalysis();
  }, []);

  useEffect(() => {
    // Scroll chat to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const generateFarmAnalysis = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const summary = await dbService.getAggregatedScores(today);
      
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataSummary: summary })
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
      const today = new Date().toISOString().split('T')[0];
      const summary = await dbService.getAggregatedScores(today);

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg,
          dataSummary: summary 
        })
      });

      if (response.ok) {
        const resJson = await response.json();
        setMessages(prev => [...prev, { sender: 'bot', text: resJson.response }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I encountered an issue accessing the AI engine. Please try again.' }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Error connecting to the chat service.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 max-h-screen overflow-hidden">
      {/* LEFT PANEL: Executive AI Advisory Board */}
      <div className="w-full lg:w-1/2 flex flex-col gap-5 overflow-y-auto pr-1">
        {/* Title */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5.5 h-5.5 text-primary" />
            <h3 className="text-lg font-black text-slate-800 dark:text-white">AI Consulting Board</h3>
          </div>
          <button
            onClick={generateFarmAnalysis}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-500 hover:text-primary transition flex items-center gap-1.5 text-xs font-bold uppercase border border-slate-200/50 dark:border-slate-700/50"
            title="Recalculate analysis metrics"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing...' : 'Refresh'}</span>
          </button>
        </div>

        {loading || !insights ? (
          <div className="space-y-4 animate-pulse flex-1">
            <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
            <div className="h-44 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
            <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
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
      <div className="w-full lg:w-1/2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-premium flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-white p-4 flex items-center justify-between">
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
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-900/20">
          {messages.map((m, i) => {
            const isBot = m.sender === 'bot';
            return (
              <div 
                key={i} 
                className={`flex gap-3 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
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
                    : 'bg-primary text-white border-primary-dark/20'
                }`}>
                  {/* Clean Markdown Bold rendering support */}
                  <p 
                    className="whitespace-pre-line font-semibold"
                    dangerouslySetInnerHTML={{ 
                      __html: m.text
                        .replace(/\*\*(.*?)\*\*/g, '<b class="font-extrabold text-slate-900 dark:text-white">$1</b>') 
                        .replace(/\*(.*?)\*/g, '<span class="text-secondary">$1</span>') 
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

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
          <input
            type="text"
            placeholder="Ask a question about your farm ledger..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={chatLoading}
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary disabled:opacity-60"
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
