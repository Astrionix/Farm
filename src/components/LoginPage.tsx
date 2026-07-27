'use client';

import React, { useState } from 'react';
import { Lock, Mail, Bot, ArrowRight, ShieldAlert } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (role: 'Owner' | 'Supervisor', assignedUnit: number) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-configured ERP User Accounts
  const usersDb = [
    { email: 'owner@mahalakshmi.com', password: 'owner@smp', role: 'Owner' as const, unit: 1 },
    { email: 'unit1@mahalakshmi.com', password: 'unit1@smp', role: 'Supervisor' as const, unit: 1 },
    { email: 'unit2@mahalakshmi.com', password: 'unit2@smp', role: 'Supervisor' as const, unit: 2 },
    { email: 'unit3@mahalakshmi.com', password: 'unit3@smp', role: 'Supervisor' as const, unit: 3 },
    { email: 'unit4@mahalakshmi.com', password: 'unit4@smp', role: 'Supervisor' as const, unit: 4 },
    { email: 'unit5@mahalakshmi.com', password: 'unit5@smp', role: 'Supervisor' as const, unit: 5 },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    // Simulate standard latency
    setTimeout(() => {
      const matchedUser = usersDb.find(
        u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
      );

      if (matchedUser) {
        onLoginSuccess(matchedUser.role, matchedUser.unit);
      } else {
        setErrorMsg('Invalid email address or passcode. Please check the credential guide below.');
      }
      setLoading(false);
    }, 800);
  };

  const prefill = (emailVal: string, passVal: string) => {
    setEmail(emailVal);
    setPassword(passVal);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Graphic Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-tr from-primary/10 to-primary-light/5 rounded-full blur-[100px] animate-blob-float-1" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-bl from-secondary/10 to-accent/5 rounded-full blur-[100px] animate-blob-float-2" />

      {/* Main glass panel container */}
      <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-slate-800/80 shadow-2xl p-8 relative z-10 space-y-6 animate-slide-up">
        
        {/* Brand & SVG Logo */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center p-2.5 shadow-lg shadow-primary/20 mx-auto relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/35 to-transparent opacity-80" />
            <svg viewBox="0 0 100 100" className="w-full h-full z-10 transition-transform duration-500 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="45" r="22" fill="#F9A825" className="opacity-80" />
              <path d="M75 35 C60 45 40 40 40 60 C55 60 70 50 75 35 Z" fill="#ffffff" className="opacity-95" />
              <path d="M48 70 C48 75 58 75 58 70 C58 65 48 65 48 70 Z" fill="#F9A825" />
              <path d="M28 72 C32 60 42 50 48 52 C52 53 52 48 50 45 C48 42 45 44 43 40 C41 36 43 32 46 30 C49 32 50 35 48 38 C54 36 60 44 65 52 C70 58 72 65 72 72 Z" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight leading-none">
              Sri Mahalakshmi
            </h1>
            <p className="text-[10px] text-primary dark:text-primary-light font-black tracking-widest uppercase mt-1">
              Poultry AI ERP
            </p>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold border border-red-500/20 flex items-start gap-2.5 animate-pulse">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Email Address</label>
            <div className="relative group">
              <input
                type="email"
                placeholder="user@mahalakshmi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                required
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 group-focus-within:text-primary transition-colors duration-200" />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Passcode</label>
            <div className="relative group">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 group-focus-within:text-primary transition-colors duration-200" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-[1px]"
          >
            {loading ? (
              <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter AI Portal</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Credential Prefill Widget Guide */}
        <div className="border-t border-slate-200/50 dark:border-slate-800/60 pt-4.5 space-y-3">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider">
            <Bot className="w-4 h-4 text-primary" />
            <span>Demonstration Access Panel</span>
          </div>

          <div className="space-y-2">
            {/* Owner account prefill */}
            <div 
              onClick={() => prefill('owner@mahalakshmi.com', 'owner@smp')}
              className="p-3 bg-slate-50/70 dark:bg-slate-950/40 hover:bg-primary/5 dark:hover:bg-primary/10 border border-slate-200/60 dark:border-slate-800 rounded-xl cursor-pointer flex justify-between items-center transition-all duration-300 hover:scale-[1.01] hover:border-primary/30 group"
            >
              <div>
                <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 block leading-none">Owner Dashboard (Full Control)</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1 block">owner@mahalakshmi.com • owner@smp</span>
              </div>
              <span className="text-[9px] text-primary dark:text-primary-light font-black tracking-wide group-hover:underline">Prefill</span>
            </div>

            {/* Supervisor account prefill */}
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4, 5].map(uNum => (
                <div 
                  key={uNum}
                  onClick={() => prefill(`unit${uNum}@mahalakshmi.com`, `unit${uNum}@smp`)}
                  className="p-2.5 bg-slate-50/70 dark:bg-slate-950/40 hover:bg-primary/5 dark:hover:bg-primary/10 border border-slate-200/60 dark:border-slate-800 rounded-xl cursor-pointer flex justify-between items-center transition-all duration-300 hover:scale-[1.01] hover:border-primary/30 group text-left"
                >
                  <div>
                    <span className="text-[9px] font-black text-slate-800 dark:text-slate-200 block leading-none">Supervisor U{uNum}</span>
                    <span className="text-[8px] text-slate-450 dark:text-slate-500 font-bold mt-1 block">unit{uNum}@smp</span>
                  </div>
                  <span className="text-[8px] text-primary dark:text-primary-light font-black group-hover:underline shrink-0 ml-1">Prefill</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
