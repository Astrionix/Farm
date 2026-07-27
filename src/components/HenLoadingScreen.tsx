'use client';

import React, { useState, useEffect } from 'react';

// ─── TIME OF DAY ─────────────────────────────────────────────────────────────
function getTimeOfDay(): 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = new Date().getHours();
  if (h >= 5 && h < 7) return 'dawn';
  if (h >= 7 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 20) return 'evening';
  return 'night';
}

const SKY_THEMES = {
  dawn:      { sky: 'linear-gradient(180deg,#312e81 0%,#7c3aed 18%,#f97316 38%,#fbbf24 52%,#fef9c3 65%,#d1fae5 82%,#16a34a 100%)', sunColor: '#fbbf24', sunGlow: '#f97316', nightMode: true },
  morning:   { sky: 'linear-gradient(180deg,#0ea5e9 0%,#38bdf8 22%,#7dd3fc 44%,#e0f2fe 62%,#d1fae5 80%,#16a34a 100%)',             sunColor: '#fef08a', sunGlow: '#fbbf24', nightMode: false },
  afternoon: { sky: 'linear-gradient(180deg,#1d4ed8 0%,#3b82f6 20%,#60a5fa 40%,#bfdbfe 65%,#d1fae5 82%,#16a34a 100%)',             sunColor: '#fef9c3', sunGlow: '#fef08a', nightMode: false },
  evening:   { sky: 'linear-gradient(180deg,#1e1b4b 0%,#7c3aed 12%,#ea580c 30%,#f97316 48%,#fbbf24 62%,#d1fae5 80%,#16a34a 100%)', sunColor: '#fbbf24', sunGlow: '#ef4444', nightMode: true },
  night:     { sky: 'linear-gradient(180deg,#020617 0%,#0f172a 25%,#1e1b4b 55%,#1e3a5f 78%,#14532d 100%)',                          sunColor: '#e2e8f0', sunGlow: '#93c5fd', nightMode: true },
};

const LOADING_MESSAGES = [
  { icon: '🌾', text: "Collecting today's egg production..." },
  { icon: '📊', text: 'Analyzing flock performance...' },
  { icon: '💀', text: 'Checking mortality records...' },
  { icon: '🌾', text: 'Reviewing feed consumption...' },
  { icon: '🌡', text: 'Loading environmental sensors...' },
  { icon: '🔄', text: 'Synchronizing farm database...' },
  { icon: '🧠', text: 'Generating AI insights...' },
  { icon: '🌤', text: 'Connecting to weather station...' },
  { icon: '📋', text: 'Preparing executive dashboard...' },
  { icon: '✅', text: 'Almost ready...' },
];

const AI_STEPS = [
  "✓ Reading today's records",
  '✓ Calculating HD%',
  '✓ Detecting abnormalities',
  '✓ Comparing historical trends',
  '✓ Preparing recommendations',
];

const TIPS = [
  { label: '💡 Tip', text: 'Maintain humidity between 60–70% for optimal production.' },
  { label: '🧠 AI Tip', text: "Feed efficiency is one of the strongest indicators of future production." },
  { label: '💡 Tip', text: 'Consistent lighting schedules improve egg uniformity by up to 8%.' },
  { label: '🧠 AI Tip', text: "Monitor water-to-feed ratio daily — it's an early stress indicator." },
  { label: '💡 Tip', text: 'Birds aged 20–40 weeks are at peak production. Track FCR closely.' },
];

const STATS = [
  { icon: '🥚', label: 'Eggs Today', value: '90,150' },
  { icon: '🐔', label: 'Active Birds', value: '1,62,400' },
  { icon: '🌡', label: 'Temperature', value: '29°C' },
  { icon: '💧', label: 'Humidity', value: '72%' },
  { icon: '📈', label: 'HD%', value: '88.4%' },
  { icon: '⚖️', label: 'Feed Eff.', value: '1.45 FCR' },
];

interface HenLoadingScreenProps {
  progress?: number;
}

export default function HenLoadingScreen({ progress = 0 }: HenLoadingScreenProps) {
  const tod = getTimeOfDay();
  const theme = SKY_THEMES[tod];
  const night = theme.nightMode;

  const [msgIndex, setMsgIndex] = useState(0);
  const [msgVisible, setMsgVisible] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);
  const [statIndex, setStatIndex] = useState(0);
  const [statVisible, setStatVisible] = useState(true);
  const [aiStep, setAiStep] = useState(0);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; type: string; delay: number; dur: number }[]>([]);
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);
  const [mounted, setMounted] = useState(false);

  const henLeft = Math.min(Math.max(progress, 3), 91);

  useEffect(() => {
    setMounted(true);
    setParticles(Array.from({ length: 18 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 70,
      type: i % 3 === 0 ? 'feather' : i % 3 === 1 ? 'sparkle' : 'dust',
      delay: Math.random() * 5, dur: 3 + Math.random() * 4,
    })));
    setStars(Array.from({ length: 55 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 50,
      size: 0.8 + Math.random() * 2, delay: Math.random() * 4,
    })));
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setMsgVisible(false);
      setTimeout(() => { setMsgIndex(p => (p + 1) % LOADING_MESSAGES.length); setMsgVisible(true); }, 380);
    }, 2600);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => { setTipIndex(p => (p + 1) % TIPS.length); setTipVisible(true); }, 380);
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setStatVisible(false);
      setTimeout(() => { setStatIndex(p => (p + 1) % STATS.length); setStatVisible(true); }, 350);
    }, 2200);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    let cur = 0;
    const iv = setInterval(() => {
      if (cur < AI_STEPS.length - 1) { cur++; setAiStep(cur); }
    }, 900);
    return () => clearInterval(iv);
  }, []);

  // Colors
  const accent = night ? '#4ade80' : '#166534';
  const accentLight = night ? '#4ade80' : '#15803d';
  const cyan = '#22d3ee';
  const panelBg = night ? 'rgba(15,23,42,0.72)' : 'rgba(240,253,244,0.78)';
  const panelBorder = night ? 'rgba(74,222,128,0.22)' : 'rgba(34,197,94,0.3)';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', fontFamily: "'Outfit','Inter',sans-serif",
      opacity: mounted ? 1 : 0, transition: 'opacity 0.6s ease',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap');

        .hls-sky { position:absolute;inset:0; }

        /* Stars */
        .hls-star { position:absolute;border-radius:50%;background:#fff;
          animation:hlsStar var(--sdur,3s) ease-in-out infinite var(--sdly,0s); }
        @keyframes hlsStar{0%,100%{opacity:0.15}50%{opacity:1}}

        /* Moon */
        .hls-moon{position:absolute;top:6%;right:10%;width:58px;height:58px;border-radius:50%;
          background:radial-gradient(circle at 35% 40%,#e2e8f0,#94a3b8);
          box-shadow:0 0 40px 16px #93c5fd44;animation:hlsMoon 5s ease-in-out infinite;}
        @keyframes hlsMoon{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}

        /* Sun */
        .hls-sun{position:absolute;top:5%;left:50%;transform:translateX(-50%);
          width:82px;height:82px;border-radius:50%;animation:hlsSun 4s ease-in-out infinite;}
        @keyframes hlsSun{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.07)}}

        /* Clouds */
        .hls-cloud{position:absolute;border-radius:60px;filter:blur(2px);}
        .hls-c1{width:140px;height:42px;top:11%;left:-160px;animation:hlsCloud 22s linear infinite;}
        .hls-c2{width:100px;height:30px;top:19%;left:-120px;animation:hlsCloud 32s linear infinite 8s;}
        .hls-c3{width:180px;height:50px;top:6%;left:-200px;animation:hlsCloud 28s linear infinite 15s;}
        @keyframes hlsCloud{from{left:-220px}to{left:110vw}}

        /* Birds */
        .hls-birds-fly{position:absolute;animation:hlsBirdsFly 18s linear infinite;}
        @keyframes hlsBirdsFly{from{left:-100px;opacity:0}5%{opacity:1}95%{opacity:1}to{left:110vw;opacity:0}}

        /* HEN on track */
        .hls-hen-wrap{position:absolute;top:-88px;transform:translateX(-50%);
          transition:left 0.55s cubic-bezier(0.34,1.4,0.64,1);
          filter:drop-shadow(0 10px 22px rgba(0,0,0,0.28));}
        .hls-body  {animation:hlsBob  0.48s ease-in-out infinite alternate;}
        .hls-head  {animation:hlsHead 0.48s ease-in-out infinite alternate;}
        .hls-wing  {animation:hlsWing 0.48s ease-in-out infinite alternate;transform-origin:50px 48px;}
        .hls-tail  {animation:hlsTail 0.48s ease-in-out infinite alternate;transform-origin:22px 46px;}
        .hls-legR  {animation:hlsLegR 0.48s ease-in-out infinite alternate;transform-origin:58px 68px;}
        .hls-legL  {animation:hlsLegL 0.48s ease-in-out infinite alternate-reverse;transform-origin:46px 68px;}
        .hls-beak  {animation:hlsBeak 1.2s ease-in-out infinite;transform-origin:78px 22px;}
        .hls-blink {animation:hlsBlink 4.5s ease-in-out infinite;}
        .hls-d1,.hls-d2{position:absolute;bottom:-2px;width:14px;height:7px;border-radius:50%;
          background:rgba(139,94,60,0.3);animation:hlsDust 0.5s ease-out infinite;}
        .hls-d2{left:22px;animation-delay:.25s;}

        @keyframes hlsBob  {from{transform:translateY(0)}   to{transform:translateY(-8px)}}
        @keyframes hlsHead {from{transform:translateY(0) rotate(-6deg)} to{transform:translateY(-6px) rotate(7deg)}}
        @keyframes hlsWing {from{transform:rotate(-20deg)} to{transform:rotate(15deg)}}
        @keyframes hlsTail {from{transform:rotate(-16deg)} to{transform:rotate(12deg)}}
        @keyframes hlsLegR {from{transform:rotate(30deg)}  to{transform:rotate(-20deg)}}
        @keyframes hlsLegL {from{transform:rotate(30deg)}  to{transform:rotate(-20deg)}}
        @keyframes hlsBeak {0%,100%{transform:rotate(0)}50%{transform:rotate(20deg)}}
        @keyframes hlsBlink{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(0.08)}}
        @keyframes hlsDust {0%{transform:scale(0.5);opacity:0.6}100%{transform:scale(3) translateY(-6px);opacity:0}}

        /* Ground walking hen */
        .hls-gwhen{position:absolute;bottom:58px;animation:hlsGwalk 16s linear infinite;}
        .hls-gwhen2{position:absolute;bottom:60px;animation:hlsGwalk2 24s linear infinite 8s;}
        @keyframes hlsGwalk {from{left:-80px}to{left:110%}}
        @keyframes hlsGwalk2{from{left:-60px}to{left:110%}}

        /* Track */
        .hls-track{width:100%;height:18px;border-radius:20px;position:relative;overflow:hidden;}
        .hls-fill{height:100%;border-radius:20px;transition:width 0.55s cubic-bezier(0.34,1.4,0.64,1);position:relative;}
        .hls-fill::after{content:'';position:absolute;inset:0;border-radius:inherit;
          background:repeating-linear-gradient(90deg,transparent 0,transparent 10px,rgba(255,255,255,0.2) 10px,rgba(255,255,255,0.2) 12px);}

        /* Particles */
        .hls-particle{position:absolute;pointer-events:none;}
        .hls-pf{width:8px;height:20px;border-radius:50%;background:linear-gradient(160deg,#fde68a,#d1fae5);opacity:0;animation:hlsFeather 5s ease-in-out infinite;}
        .hls-ps{width:7px;height:7px;border-radius:50%;background:#facc15;opacity:0;box-shadow:0 0 8px 4px #facc1588;animation:hlsSparkle 3s ease-in-out infinite;}
        .hls-pd{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.5);opacity:0;animation:hlsDustP 6s ease-in-out infinite;}
        @keyframes hlsFeather{0%{opacity:0;transform:translateY(0) rotate(0)}20%{opacity:0.8}80%{opacity:0.4}100%{opacity:0;transform:translateY(-70px) rotate(220deg) translateX(25px)}}
        @keyframes hlsSparkle{0%,100%{opacity:0;transform:scale(0)}50%{opacity:1;transform:scale(1.8)}}
        @keyframes hlsDustP  {0%{opacity:0;transform:translateY(0)}30%{opacity:0.6}100%{opacity:0;transform:translateY(-50px) translateX(14px)}}

        /* Glass card */
        .hls-card{
          background:rgba(255,255,255,0.13);
          backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);
          border:1.5px solid rgba(255,255,255,0.3);
          border-radius:28px;
          box-shadow:0 8px 64px rgba(0,0,0,0.22),inset 0 0 0 0.5px rgba(255,255,255,0.1);
          padding:26px 28px 22px;width:100%;max-width:560px;
        }

        /* Fade transitions */
        .hls-fade{transition:opacity 0.38s,transform 0.38s;}
        .hls-in {opacity:1;transform:translateY(0);}
        .hls-out{opacity:0;transform:translateY(8px);}

        /* AI step appear */
        .hls-ai-in{animation:hlsAiIn 0.5s ease forwards;}
        @keyframes hlsAiIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}

        /* Dot */
        .hls-dot{width:9px;height:9px;border-radius:50%;animation:hlsBob 0.7s ease-in-out infinite alternate;}

        /* Entrance */
        .hls-entry{animation:hlsEntry 0.75s cubic-bezier(0.16,1,0.3,1) both;}
        @keyframes hlsEntry{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Sky */}
      <div className="hls-sky" style={{ background: theme.sky }} />

      {/* Stars */}
      {night && stars.map(s => (
        <div key={s.id} className="hls-star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          // @ts-ignore css variables
          '--sdur': `${2 + s.delay}s`, '--sdly': `${s.delay}s`,
        }} />
      ))}

      {/* Moon (night only) */}
      {tod === 'night' && <div className="hls-moon" />}

      {/* Sun */}
      {tod !== 'night' && (
        <div className="hls-sun" style={{
          background: `radial-gradient(circle,${theme.sunColor} 0%,${theme.sunGlow} 55%,transparent 100%)`,
          boxShadow: `0 0 90px 45px ${theme.sunGlow}44,0 0 180px 90px ${theme.sunGlow}22`,
        }} />
      )}

      {/* Clouds */}
      {(['morning','afternoon'] as const).includes(tod as any) && (<>
        <div className="hls-cloud hls-c1" style={{ background: 'rgba(255,255,255,0.88)' }} />
        <div className="hls-cloud hls-c2" style={{ background: 'rgba(255,255,255,0.82)' }} />
        <div className="hls-cloud hls-c3" style={{ background: 'rgba(255,255,255,0.76)' }} />
      </>)}
      {night && (<>
        <div className="hls-cloud hls-c1" style={{ background: 'rgba(148,163,184,0.18)' }} />
        <div className="hls-cloud hls-c2" style={{ background: 'rgba(148,163,184,0.14)' }} />
      </>)}

      {/* Flying birds (day only) */}
      {!night && (<>
        <div className="hls-birds-fly" style={{ top: '14%', left: '-100px' }}>
          <svg width="90" height="26" viewBox="0 0 90 26" fill="none">
            <path d="M0 14 Q12 4 22 14 Q34 24 44 14" stroke="#166534" strokeWidth="2.2" strokeLinecap="round"/>
            <path d="M46 14 Q58 4 68 14 Q80 24 90 14" stroke="#166534" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="hls-birds-fly" style={{ top: '22%', left: '-60px', animationDelay: '8s' }}>
          <svg width="55" height="18" viewBox="0 0 55 18" fill="none">
            <path d="M0 10 Q10 2 18 10 Q28 18 36 10" stroke="#1d4ed8" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M38 10 Q46 2 55 10" stroke="#1d4ed8" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
      </>)}

      {/* Farm Landscape */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <svg viewBox="0 0 1200 270" preserveAspectRatio="none" width="100%" height="225" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="hF" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={night ? '#1e3a5f' : '#86efac'}/>
              <stop offset="100%" stopColor={night ? '#0f172a' : '#15803d'}/>
            </linearGradient>
            <linearGradient id="hN" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={night ? '#14532d' : '#22c55e'}/>
              <stop offset="100%" stopColor={night ? '#052e16' : '#16a34a'}/>
            </linearGradient>
          </defs>
          <ellipse cx="600" cy="330" rx="960" ry="205" fill="url(#hF)" />
          <ellipse cx="200" cy="322" rx="520" ry="182" fill={night?'#0f3460':'#4ade80'} />
          <ellipse cx="970" cy="322" rx="520" ry="177" fill={night?'#0f3460':'#4ade80'} />
          <ellipse cx="600" cy="362" rx="760" ry="157" fill="url(#hN)" />
          <rect x="0" y="218" width="1200" height="55" fill={night?'#14532d':'#16a34a'} />
          <rect x="220" y="218" width="760" height="12" rx="6" fill={night?'#052e1688':'#15803d88'} />

          {/* Trees with SVG sway animation */}
          <g transform="translate(60,60)">
            <animateTransform attributeName="transform" type="rotate" values="-3 60 158;3 60 158;-3 60 158" dur="4s" repeatCount="indefinite" additive="sum"/>
            <rect x="54" y="155" width="11" height="65" rx="3" fill="#8B5E3C"/>
            <ellipse cx="60" cy="148" rx="32" ry="42" fill={night?'#14532d':'#15803d'}/>
            <ellipse cx="60" cy="140" rx="23" ry="30" fill={night?'#052e16':'#166534'}/>
          </g>
          <g transform="translate(0,0)">
            <animateTransform attributeName="transform" type="rotate" values="3 122 220;-3 122 220;3 122 220" dur="5.5s" repeatCount="indefinite" additive="sum"/>
            <rect x="118" y="170" width="9" height="50" rx="3" fill="#8B5E3C"/>
            <ellipse cx="122" cy="163" rx="24" ry="32" fill={night?'#14532d':'#15803d'}/>
          </g>
          <g transform="translate(0,0)">
            <animateTransform attributeName="transform" type="rotate" values="-2.5 1115 207;2.5 1115 207;-2.5 1115 207" dur="4.5s" repeatCount="indefinite" additive="sum"/>
            <rect x="1110" y="157" width="11" height="63" rx="3" fill="#8B5E3C"/>
            <ellipse cx="1115" cy="150" rx="31" ry="40" fill={night?'#14532d':'#15803d'}/>
            <ellipse cx="1115" cy="143" rx="22" ry="29" fill={night?'#052e16':'#166534'}/>
          </g>
          <g transform="translate(0,0)">
            <animateTransform attributeName="transform" type="rotate" values="3 1064 218;-3 1064 218;3 1064 218" dur="6s" repeatCount="indefinite" additive="sum"/>
            <rect x="1060" y="172" width="9" height="48" rx="3" fill="#8B5E3C"/>
            <ellipse cx="1064" cy="165" rx="22" ry="30" fill={night?'#14532d':'#15803d'}/>
          </g>

          {/* Sheds */}
          <rect x="155" y="187" width="148" height="58" rx="5" fill={night?'#1e293b':'#f8fafc'} stroke={night?'#334155':'#e2e8f0'} strokeWidth="1.5"/>
          <polygon points="138,187 229,155 320,187" fill={night?'#475569':'#94a3b8'}/>
          <rect x="200" y="205" width="36" height="40" rx="2" fill={night?'#334155':'#cbd5e1'}/>
          <rect x="170" y="197" width="22" height="16" rx="2" fill={night?'#fbbf2466':'#bfdbfe88'}/>
          <rect x="256" y="197" width="22" height="16" rx="2" fill={night?'#fbbf2466':'#bfdbfe88'}/>
          <text x="229" y="255" fill={night?'#64748b':'#94a3b8'} fontSize="9" textAnchor="middle" fontWeight="700">UNIT 1</text>

          <rect x="520" y="192" width="160" height="52" rx="5" fill={night?'#1e293b':'#f1f5f9'} stroke={night?'#334155':'#e2e8f0'} strokeWidth="1.5"/>
          <polygon points="502,192 600,160 698,192" fill={night?'#475569':'#94a3b8'}/>
          <rect x="566" y="210" width="38" height="34" rx="2" fill={night?'#334155':'#cbd5e1'}/>
          <rect x="530" y="200" width="24" height="16" rx="2" fill={night?'#fbbf2466':'#bfdbfe88'}/>
          <rect x="643" y="200" width="24" height="16" rx="2" fill={night?'#fbbf2466':'#bfdbfe88'}/>
          <text x="600" y="258" fill={night?'#64748b':'#94a3b8'} fontSize="9" textAnchor="middle" fontWeight="700">UNIT 3</text>

          <rect x="900" y="187" width="148" height="58" rx="5" fill={night?'#1e293b':'#f8fafc'} stroke={night?'#334155':'#e2e8f0'} strokeWidth="1.5"/>
          <polygon points="882,187 976,155 1070,187" fill={night?'#475569':'#94a3b8'}/>
          <rect x="944" y="205" width="36" height="40" rx="2" fill={night?'#334155':'#cbd5e1'}/>
          <rect x="914" y="197" width="22" height="16" rx="2" fill={night?'#fbbf2466':'#bfdbfe88'}/>
          <rect x="1000" y="197" width="22" height="16" rx="2" fill={night?'#fbbf2466':'#bfdbfe88'}/>
          <text x="976" y="255" fill={night?'#64748b':'#94a3b8'} fontSize="9" textAnchor="middle" fontWeight="700">UNIT 2</text>

          {/* Windmill */}
          <rect x="455" y="170" width="7" height="58" rx="2.5" fill="#8B5E3C"/>
          <g>
            <animateTransform attributeName="transform" type="rotate" from="0 459 170" to="360 459 170" dur="3.5s" repeatCount="indefinite"/>
            <ellipse cx="451" cy="170" rx="5" ry="14" fill="#94a3b8bb" transform="rotate(-45 451 170)"/>
            <ellipse cx="451" cy="170" rx="5" ry="14" fill="#94a3b8bb" transform="rotate(45 451 170)"/>
            <ellipse cx="451" cy="170" rx="5" ry="14" fill="#94a3b8bb" transform="rotate(135 451 170)"/>
            <ellipse cx="451" cy="170" rx="5" ry="14" fill="#94a3b8bb" transform="rotate(225 451 170)"/>
            <circle cx="451" cy="170" r="4" fill="#64748b"/>
          </g>

          {/* Grass wave blades */}
          {Array.from({ length: 28 }, (_, i) => (
            <g key={i}>
              <animateTransform attributeName="transform" type="rotate"
                values={`${i%2===0?-7:7} ${170+i*30} 220;${i%2===0?7:-7} ${170+i*30} 220;${i%2===0?-7:7} ${170+i*30} 220`}
                dur={`${2.5 + (i%5)*0.4}s`} repeatCount="indefinite" additive="sum"/>
              <rect x={168+i*30} y="207" width="3" height={12+(i%4)*3} rx="1.5"
                fill={night?'#166534':'#22c55e'} />
            </g>
          ))}
        </svg>
      </div>

      {/* Ground-walking chickens */}
      <div className="hls-gwhen" style={{ zIndex: 6 }}>
        <svg width="38" height="32" viewBox="0 0 38 32">
          <ellipse cx="16" cy="18" rx="10" ry="8" fill={night?'#f1f5f9':'#f9fafb'} stroke="#e2e8f0" strokeWidth="1"/>
          <circle cx="26" cy="10" r="7" fill={night?'#f1f5f9':'#f9fafb'} stroke="#e2e8f0" strokeWidth="1"/>
          <path d="M23 3 Q25 0 26 3.5 Q27.5 0 29.5 4" stroke="#ef4444" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <circle cx="28" cy="8" r="2.2" fill="#0f172a"/>
          <ellipse cx="23" cy="13" rx="2.2" ry="3.2" fill="#ef4444"/>
          <line x1="13" y1="24" x2="11" y2="31" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
          <line x1="19" y1="24" x2="21" y2="31" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="hls-gwhen2" style={{ zIndex: 6, transform: 'scaleX(-1)' }}>
        <svg width="30" height="25" viewBox="0 0 30 25">
          <ellipse cx="12" cy="15" rx="8" ry="6.5" fill="#fef3c7" stroke="#e2e8f0" strokeWidth="1"/>
          <circle cx="20" cy="8" r="5.5" fill="#fef3c7" stroke="#e2e8f0" strokeWidth="1"/>
          <path d="M18 2 Q19.5 0 21 2 Q22.5 0 24 2" stroke="#ef4444" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
          <circle cx="22" cy="6" r="1.8" fill="#0f172a"/>
          <ellipse cx="18" cy="11" rx="1.8" ry="2.6" fill="#ef4444"/>
          <line x1="10" y1="19" x2="8" y2="24" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="14" y1="19" x2="16" y2="24" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Ambient particles */}
      {particles.map(p => (
        <div key={p.id}
          className={`hls-particle ${p.type==='feather'?'hls-pf':p.type==='sparkle'?'hls-ps':'hls-pd'}`}
          style={{ left:`${p.x}%`, top:`${p.y}%`, animationDelay:`${p.delay}s`, animationDuration:`${p.dur}s` }}
        />
      ))}

      {/* ── GLASS CARD ── */}
      <div className="hls-card hls-entry" style={{ position: 'relative', zIndex: 20, margin: '0 14px', marginTop: '-70px' }}>

        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 6 }}>🐔</div>
          <div style={{
            fontSize: 'clamp(1.1rem,4.5vw,1.6rem)', fontWeight: 900,
            letterSpacing: '-0.02em', lineHeight: 1.15,
            background: night
              ? 'linear-gradient(135deg,#4ade80 0%,#22d3ee 100%)'
              : 'linear-gradient(135deg,#166534 0%,#15803d 50%,#052e16 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Sri Mahalakshmi<br/>Poultry AI ERP
          </div>
          <div style={{ fontSize: '0.68rem', color: night?'#4ade80':'#15803d', fontWeight: 700, marginTop: 6, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Powered by <span style={{ color: night?cyan:'#0ea5e9', fontWeight: 900 }}>FlockMind AI</span>
          </div>
        </div>

        {/* TRACK + HEN */}
        <div style={{ width: '100%', position: 'relative', marginBottom: 10 }}>
          {/* Hen — 40% larger (108×90) */}
          <div className="hls-hen-wrap" style={{ left:`${henLeft}%` }}>
            <div className="hls-d1" style={{ left: 5 }} />
            <div className="hls-d2" />
            <svg width="108" height="90" viewBox="0 0 108 90">
              <g className="hls-tail">
                <ellipse cx="18" cy="42" rx="14" ry="6" fill="#facc15" transform="rotate(-40 18 42)"/>
                <ellipse cx="14" cy="48" rx="13" ry="5" fill="#fbbf24" transform="rotate(-56 14 48)"/>
                <ellipse cx="13" cy="38" rx="12" ry="5" fill="#f59e0b" transform="rotate(-24 13 38)"/>
              </g>
              <g className="hls-body">
                <ellipse cx="55" cy="51" rx="28" ry="23" fill="#f9fafb" stroke="#e2e8f0" strokeWidth="1.8"/>
                <ellipse cx="57" cy="58" rx="16" ry="13" fill="#fde68a22"/>
                <g className="hls-wing">
                  <ellipse cx="52" cy="48" rx="18" ry="12" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.2" transform="rotate(-12 52 48)"/>
                  <ellipse cx="50" cy="52" rx="13" ry="7" fill="#e2e8f0" transform="rotate(-12 50 52)"/>
                </g>
                <g className="hls-legR">
                  <line x1="60" y1="70" x2="65" y2="84" stroke="#f59e0b" strokeWidth="3.8" strokeLinecap="round"/>
                  <line x1="65" y1="84" x2="74" y2="85" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="65" y1="84" x2="57" y2="87" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
                </g>
                <g className="hls-legL">
                  <line x1="48" y1="70" x2="42" y2="84" stroke="#f59e0b" strokeWidth="3.8" strokeLinecap="round"/>
                  <line x1="42" y1="84" x2="51" y2="85" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="42" y1="84" x2="35" y2="87" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
                </g>
                <g className="hls-head" style={{ transformOrigin: '70px 26px' }}>
                  <ellipse cx="70" cy="34" rx="11" ry="15" fill="#f9fafb" stroke="#e2e8f0" strokeWidth="1.4"/>
                  <circle cx="70" cy="20" r="17" fill="#f9fafb" stroke="#e2e8f0" strokeWidth="1.6"/>
                  <path d="M65 6 Q67.5 0 70 5 Q72.5 -1 75 5.5 Q77.5 0 80 6" stroke="#ef4444" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <g className="hls-blink" style={{ transformOrigin: '77px 17px' }}>
                    <circle cx="77" cy="17" r="5.5" fill="#0f172a"/>
                    <circle cx="79" cy="15" r="2.2" fill="white"/>
                    <circle cx="77" cy="17" r="2.2" fill="#166534"/>
                  </g>
                  <ellipse cx="67" cy="31" rx="5.5" ry="7" fill="#ef4444"/>
                  <g className="hls-beak">
                    <path d="M78 21 L94 25 L78 29 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1"/>
                  </g>
                  <path d="M78 21 L94 24 L78 25 Z" fill="#fbbf24"/>
                </g>
              </g>
            </svg>
          </div>

          {/* Track bar */}
          <div className="hls-track" style={{
            background: night?'rgba(30,41,59,0.7)':'#d1fae5',
            border: `2px solid ${night?'rgba(74,222,128,0.3)':'#6ee7b7'}`,
          }}>
            <div className="hls-fill" style={{
              width: `${progress}%`,
              background: night
                ? 'linear-gradient(90deg,#065f46,#10b981,#4ade80,#22d3ee)'
                : 'linear-gradient(90deg,#166534,#22c55e,#4ade80,#facc15)',
            }} />
          </div>

          {/* Track labels */}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, padding:'0 2px' }}>
            <span style={{ fontSize:10, fontWeight:700, color:accentLight }}>🌱 Farm Ledger</span>
            <div style={{ textAlign:'center' }}>
              <span style={{ fontSize:16, fontWeight:900, color:accent }}>{Math.round(progress)}%</span>
              <span style={{ fontSize:9, color:accentLight, display:'block', marginTop:1 }}>
                {Math.min(Math.ceil(progress / 14.3), 7)} of 7 modules
              </span>
            </div>
            <span style={{ fontSize:10, fontWeight:700, color:accentLight }}>🏁 Dashboard</span>
          </div>
        </div>

        {/* BOTTOM PANELS */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:10 }}>

          {/* FlockMind AI */}
          <div style={{ background:panelBg, border:`1px solid ${panelBorder}`, borderRadius:14, padding:'10px 12px' }}>
            <div style={{ fontSize:10, fontWeight:800, color:night?cyan:'#0ea5e9', marginBottom:7, letterSpacing:'0.05em' }}>
              🧠 FlockMind AI
            </div>
            {AI_STEPS.map((step, i) => (
              <div key={i}
                className={i <= aiStep ? 'hls-ai-in' : ''}
                style={{
                  fontSize:9.5, fontWeight:600,
                  color: i <= aiStep ? accent : (night?'#334155':'#e5e7eb'),
                  marginBottom:4, opacity: i <= aiStep ? 1 : 0.22,
                  transition:'color 0.4s,opacity 0.4s',
                  animationDelay:`${i*0.1}s`,
                }}
              >{step}</div>
            ))}
          </div>

          {/* Stat + Tip */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ background:panelBg, border:`1px solid ${panelBorder}`, borderRadius:14, padding:'8px 10px', flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div className={`hls-fade ${statVisible?'hls-in':'hls-out'}`} style={{ textAlign:'center' }}>
                <div style={{ fontSize:20 }}>{STATS[statIndex].icon}</div>
                <div style={{ fontSize:9, color:night?'#94a3b8':'#6b7280', fontWeight:600, marginTop:2 }}>{STATS[statIndex].label}</div>
                <div style={{ fontSize:16, fontWeight:900, color:accent, marginTop:2 }}>{STATS[statIndex].value}</div>
              </div>
            </div>
            <div style={{ background: night?'rgba(15,23,42,0.72)':'rgba(255,251,235,0.82)', border:`1px solid ${night?'rgba(251,191,36,0.22)':'rgba(251,191,36,0.4)'}`, borderRadius:14, padding:'8px 10px', flex:1 }}>
              <div className={`hls-fade ${tipVisible?'hls-in':'hls-out'}`}>
                <div style={{ fontSize:9.5, fontWeight:800, color:night?'#fbbf24':'#d97706', marginBottom:3 }}>{TIPS[tipIndex].label}</div>
                <div style={{ fontSize:9, color:night?'#e2e8f0':'#78350f', fontWeight:600, lineHeight:1.45 }}>{TIPS[tipIndex].text}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading message */}
        <div style={{ height:32, display:'flex', alignItems:'center', justifyContent:'center', marginTop:12 }}>
          <p className={`hls-fade ${msgVisible?'hls-in':'hls-out'}`} style={{
            fontSize:'clamp(0.7rem,2.2vw,0.82rem)', fontWeight:700,
            color:accent, letterSpacing:'0.01em', textAlign:'center', margin:0,
          }}>
            {LOADING_MESSAGES[msgIndex].icon} {LOADING_MESSAGES[msgIndex].text}
          </p>
        </div>

        {/* Dots */}
        <div style={{ display:'flex', gap:7, marginTop:8, justifyContent:'center' }}>
          {[0,1,2].map(i => (
            <div key={i} className="hls-dot" style={{ animationDelay:`${i*0.22}s`, background:accent }} />
          ))}
        </div>
      </div>
    </div>
  );
}
