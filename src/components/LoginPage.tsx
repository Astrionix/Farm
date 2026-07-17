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
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Graphic Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/15 rounded-full blur-3xl" />

      {/* Main glass panel container */}
      <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/40 dark:border-white/5 shadow-2xl p-8 relative z-10 space-y-6">
        
        {/* Brand & SVG Logo */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center p-2.5 shadow-lg mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 to-white/10 opacity-70" />
            <svg viewBox="0 0 100 100" className="w-full h-full z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="45" r="22" fill="#F9A825" className="opacity-80" />
              <path d="M75 35 C60 45 40 40 40 60 C55 60 70 50 75 35 Z" fill="#ffffff" className="opacity-95" />
              <path d="M48 70 C48 75 58 75 58 70 C58 65 48 65 48 70 Z" fill="#F9A825" />
              <path d="M28 72 C32 60 42 50 48 52 C52 53 52 48 50 45 C48 42 45 44 43 40 C41 36 43 32 46 30 C49 32 50 35 48 38 C54 36 60 44 65 52 C70 58 72 65 72 72 Z" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wide">
              Sri Mahalakshmi Poultry
            </h1>
            <p className="text-xs text-primary font-bold tracking-widest uppercase">
              Intelligent Poultry Management
            </p>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-xl text-xs font-semibold border border-red-200/50 dark:border-red-950/30 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <input
                type="email"
                placeholder="user@mahalakshmi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                required
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Passcode</label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:bg-primary/50"
          >
            {loading ? (
              <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter AI Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Credential Prefill Widget Guide */}
        <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wide">
            <Bot className="w-4 h-4 text-primary" />
            <span>Demonstration Credential Guide</span>
          </div>

          <div className="space-y-2">
            {/* Owner account prefill */}
            <div 
              onClick={() => prefill('owner@mahalakshmi.com', 'owner@smp')}
              className="p-2.5 bg-slate-50 dark:bg-slate-800/40 hover:bg-primary/5 border border-slate-200/50 dark:border-slate-800 rounded-xl cursor-pointer flex justify-between items-center transition group"
            >
              <div>
                <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 block leading-none">Owner Portal (Full Access)</span>
                <span className="text-[9px] text-slate-400 font-medium">owner@mahalakshmi.com • owner@smp</span>
              </div>
              <span className="text-[9px] text-primary font-bold group-hover:underline">Prefill</span>
            </div>

            {/* Supervisor account prefill */}
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map(uNum => (
                <div 
                  key={uNum}
                  onClick={() => prefill(`unit${uNum}@mahalakshmi.com`, `unit${uNum}@smp`)}
                  className="p-2 bg-slate-50 dark:bg-slate-800/40 hover:bg-primary/5 border border-slate-200/50 dark:border-slate-800 rounded-xl cursor-pointer flex justify-between items-center transition group text-left"
                >
                  <div>
                    <span className="text-[9px] font-black text-slate-800 dark:text-slate-200 block leading-none">Supervisor U{uNum}</span>
                    <span className="text-[8px] text-slate-400 font-medium mt-0.5 block">unit{uNum}@smp</span>
                  </div>
                  <span className="text-[8px] text-primary font-bold group-hover:underline shrink-0">Prefill</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
