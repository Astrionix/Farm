'use client';

import React, { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
  '🐔 Gathering shed records...',
  "🥚 Counting today's egg production...",
  '🌾 Calculating feed efficiency...',
  '📊 Analyzing flock performance...',
  '🤖 AI is reviewing farm health...',
  '📈 Preparing executive insights...',
  '🧠 Comparing all six units...',
  '🔍 Detecting production trends...',
  "📋 Building today's farm report...",
  '🚀 Launching FlockMind AI...',
];

interface HenLoadingScreenProps {
  progress?: number;
}

export default function HenLoadingScreen({ progress = 0 }: HenLoadingScreenProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [msgVisible, setMsgVisible] = useState(true);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; type: string; delay: number; dur: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgVisible(false);
      setTimeout(() => {
        setMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
        setMsgVisible(true);
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 80,
        type: i % 3 === 0 ? 'feather' : i % 3 === 1 ? 'sparkle' : 'dust',
        delay: Math.random() * 5,
        dur: 3 + Math.random() * 4,
      }))
    );
  }, []);

  const henLeft = Math.min(Math.max(progress, 4), 93);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', fontFamily: "'Outfit', 'Inter', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');

        .hl-sky {
          position:absolute; inset:0;
          background:linear-gradient(180deg,#fef9c3 0%,#fef3c7 10%,#d1fae5 35%,#a7f3d0 60%,#4ade80 85%,#16a34a 100%);
        }
        .hl-sun {
          position:absolute; top:5%; left:50%; transform:translateX(-50%);
          width:72px; height:72px; border-radius:50%;
          background:radial-gradient(circle,#fef08a 0%,#fbbf24 55%,#fbbf2433 100%);
          box-shadow:0 0 80px 40px #fbbf2444,0 0 160px 80px #fbbf2422;
          animation:hlSunPulse 4s ease-in-out infinite;
        }
        @keyframes hlSunPulse{
          0%,100%{transform:translateX(-50%) scale(1); box-shadow:0 0 80px 40px #fbbf2444,0 0 160px 80px #fbbf2422;}
          50%{transform:translateX(-50%) scale(1.06); box-shadow:0 0 100px 50px #fbbf2455,0 0 200px 100px #fbbf2430;}
        }

        .hl-cloud{position:absolute;background:rgba(255,255,255,0.88);border-radius:60px;filter:blur(2px);}
        .hl-cloud-1{width:130px;height:38px;top:13%;left:-150px;animation:hlCloud 20s linear infinite;}
        .hl-cloud-2{width:90px;height:26px;top:20%;left:-110px;animation:hlCloud 30s linear infinite 7s;}
        .hl-cloud-3{width:170px;height:46px;top:7%;left:-190px;animation:hlCloud 26s linear infinite 14s;}
        @keyframes hlCloud{from{left:-200px} to{left:110vw}}

        .hl-birds{position:absolute;top:16%;left:-80px;animation:hlBirds 16s linear infinite;}
        @keyframes hlBirds{from{left:-80px;opacity:0} 5%{opacity:1} 95%{opacity:1} to{left:110vw;opacity:0}}

        /* HEN animations */
        .hl-hen-wrap{
          position:absolute; top:-62px;
          transform:translateX(-50%);
          transition:left 0.5s cubic-bezier(0.34,1.4,0.64,1);
          filter:drop-shadow(0 8px 16px rgba(0,0,0,0.22));
        }
        .hl-body   {animation:hlBob    0.5s ease-in-out infinite alternate;}
        .hl-head   {animation:hlHead   0.5s ease-in-out infinite alternate;}
        .hl-wing   {animation:hlWing   0.5s ease-in-out infinite alternate; transform-origin:34px 32px;}
        .hl-tail   {animation:hlTail   0.5s ease-in-out infinite alternate; transform-origin:20px 38px;}
        .hl-leg-r  {animation:hlLegR   0.5s ease-in-out infinite alternate; transform-origin:46px 54px;}
        .hl-leg-l  {animation:hlLegL   0.5s ease-in-out infinite alternate-reverse; transform-origin:38px 54px;}
        .hl-beak-lo{animation:hlBeak   1.0s ease-in-out infinite; transform-origin:60px 20px;}
        .hl-egg    {position:absolute;right:-14px;bottom:10px;width:12px;height:15px;
                    border-radius:50% 50% 55% 45%/60% 60% 40% 40%;
                    background:linear-gradient(135deg,#fde68a,#facc15);
                    box-shadow:0 2px 6px rgba(0,0,0,0.18);
                    animation:hlEggBounce 1s ease-in-out infinite;}
        .hl-dust{position:absolute;bottom:-2px;width:12px;height:6px;border-radius:50%;
                 background:rgba(139,94,60,0.28);animation:hlDust 0.5s ease-out infinite;}
        .hl-dust:nth-child(2){left:16px;animation-delay:0.25s;}

        @keyframes hlBob   {from{transform:translateY(0)}   to{transform:translateY(-6px)}}
        @keyframes hlHead  {from{transform:translateY(0) rotate(-5deg)} to{transform:translateY(-5px) rotate(5deg)}}
        @keyframes hlWing  {from{transform:rotate(-18deg)} to{transform:rotate(12deg)}}
        @keyframes hlTail  {from{transform:rotate(-14deg)} to{transform:rotate(10deg)}}
        @keyframes hlLegR  {from{transform:rotate(28deg)}  to{transform:rotate(-18deg)}}
        @keyframes hlLegL  {from{transform:rotate(28deg)}  to{transform:rotate(-18deg)}}
        @keyframes hlBeak  {0%,100%{transform:rotate(0)} 50%{transform:rotate(18deg)}}
        @keyframes hlEggBounce{0%,100%{transform:translateY(0) rotate(-10deg)} 50%{transform:translateY(-10px) rotate(10deg)}}
        @keyframes hlDust  {0%{transform:scale(0.5);opacity:0.55} 100%{transform:scale(2.8) translateY(-5px);opacity:0}}

        /* Track */
        .hl-track-bg{
          width:100%;height:16px;border-radius:20px;
          background:#d1fae5;border:2px solid #6ee7b7;position:relative;overflow:hidden;
        }
        .hl-track-fill{
          height:100%;border-radius:20px;
          background:linear-gradient(90deg,#166534,#22c55e,#4ade80,#facc15);
          transition:width 0.55s cubic-bezier(0.34,1.4,0.64,1);
          position:relative;
        }
        .hl-track-fill::after{
          content:'';position:absolute;inset:0;border-radius:inherit;
          background:repeating-linear-gradient(90deg,transparent 0,transparent 10px,rgba(255,255,255,0.22) 10px,rgba(255,255,255,0.22) 12px);
        }

        /* Particles */
        .hl-particle{position:absolute;pointer-events:none;}
        .hl-pf{width:7px;height:18px;border-radius:50%;background:linear-gradient(160deg,#fde68a,#d1fae5);opacity:0;animation:hlFeather 5s ease-in-out infinite;}
        .hl-ps{width:6px;height:6px;border-radius:50%;background:#facc15;opacity:0;box-shadow:0 0 6px 3px #facc1588;animation:hlSparkle 3s ease-in-out infinite;}
        .hl-pd{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.55);opacity:0;animation:hlDustP 6s ease-in-out infinite;}
        @keyframes hlFeather{0%{opacity:0;transform:translateY(0) rotate(0)}20%{opacity:0.8}80%{opacity:0.4}100%{opacity:0;transform:translateY(-65px) rotate(200deg) translateX(22px)}}
        @keyframes hlSparkle{0%,100%{opacity:0;transform:scale(0)}50%{opacity:1;transform:scale(1.6)}}
        @keyframes hlDustP  {0%{opacity:0;transform:translateY(0)}30%{opacity:0.6}100%{opacity:0;transform:translateY(-45px) translateX(12px)}}

        /* Msg fade */
        .hl-msg{transition:opacity 0.4s,transform 0.4s;}
        .hl-msg-in {opacity:1;transform:translateY(0);}
        .hl-msg-out{opacity:0;transform:translateY(8px);}

        /* Dot pulse */
        .hl-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;animation:hlBob 0.7s ease-in-out infinite alternate;}
      `}</style>

      {/* Sky */}
      <div className="hl-sky" />

      {/* Sun */}
      <div className="hl-sun" />

      {/* Clouds */}
      <div className="hl-cloud hl-cloud-1" />
      <div className="hl-cloud hl-cloud-2" />
      <div className="hl-cloud hl-cloud-3" />

      {/* Birds */}
      <div className="hl-birds">
        <svg width="90" height="26" viewBox="0 0 90 26" fill="none">
          <path d="M0 14 Q12 4 22 14 Q34 24 44 14" stroke="#166534" strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M46 14 Q58 4 68 14 Q80 24 90 14" stroke="#166534" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="hl-birds" style={{ animationDelay: '9s', top: '24%' }}>
        <svg width="55" height="18" viewBox="0 0 55 18" fill="none">
          <path d="M0 10 Q10 2 18 10 Q28 18 36 10" stroke="#166534" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M38 10 Q46 2 55 10" stroke="#166534" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Hills + Sheds */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <svg viewBox="0 0 1200 260" preserveAspectRatio="none" width="100%" height="220" style={{ display: 'block' }}>
          <defs>
            <radialGradient id="hillGrad" cx="50%" cy="0%" r="80%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#15803d" />
            </radialGradient>
          </defs>
          {/* Far hills */}
          <ellipse cx="600" cy="320" rx="950" ry="200" fill="#86efac" />
          {/* Mid hills */}
          <ellipse cx="180" cy="315" rx="500" ry="175" fill="#4ade80" />
          <ellipse cx="950" cy="315" rx="500" ry="170" fill="#4ade80" />
          {/* Near hill */}
          <ellipse cx="600" cy="350" rx="750" ry="150" fill="#22c55e" />
          {/* Ground */}
          <rect x="0" y="215" width="1200" height="50" fill="#16a34a" />
          {/* Path strip */}
          <rect x="200" y="215" width="800" height="12" rx="6" fill="#15803d88" />

          {/* Trees Left */}
          <rect x="55" y="155" width="11" height="64" rx="3" fill="#8B5E3C"/>
          <ellipse cx="60" cy="148" rx="30" ry="40" fill="#15803d"/>
          <ellipse cx="60" cy="142" rx="22" ry="28" fill="#166534"/>
          <rect x="118" y="170" width="9" height="50" rx="3" fill="#8B5E3C"/>
          <ellipse cx="122" cy="163" rx="24" ry="32" fill="#15803d"/>

          {/* Trees Right */}
          <rect x="1110" y="157" width="11" height="62" rx="3" fill="#8B5E3C"/>
          <ellipse cx="1115" cy="150" rx="30" ry="38" fill="#15803d"/>
          <ellipse cx="1115" cy="144" rx="22" ry="28" fill="#166534"/>
          <rect x="1060" y="172" width="9" height="48" rx="3" fill="#8B5E3C"/>
          <ellipse cx="1064" cy="165" rx="22" ry="30" fill="#15803d"/>

          {/* Shed Left */}
          <rect x="155" y="188" width="140" height="55" rx="5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
          <polygon points="138,188 225,158 312,188" fill="#94a3b8"/>
          <rect x="198" y="206" width="34" height="37" rx="2" fill="#cbd5e1"/>
          <rect x="170" y="198" width="22" height="16" rx="2" fill="#bfdbfe88"/>
          <rect x="253" y="198" width="22" height="16" rx="2" fill="#bfdbfe88"/>
          <text x="225" y="250" fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="700">UNIT 1</text>

          {/* Shed Right */}
          <rect x="900" y="188" width="140" height="55" rx="5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
          <polygon points="883,188 970,158 1057,188" fill="#94a3b8"/>
          <rect x="943" y="206" width="34" height="37" rx="2" fill="#cbd5e1"/>
          <rect x="915" y="198" width="22" height="16" rx="2" fill="#bfdbfe88"/>
          <rect x="998" y="198" width="22" height="16" rx="2" fill="#bfdbfe88"/>
          <text x="970" y="250" fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="700">UNIT 2</text>
        </svg>
      </div>

      {/* Windmill */}
      <div style={{ position: 'absolute', bottom: '23%', right: '7%', zIndex: 5 }}>
        <svg width="48" height="88" viewBox="0 0 48 88">
          <rect x="21" y="30" width="7" height="56" rx="2.5" fill="#8B5E3C"/>
          <g style={{ transformOrigin: '16px 16px', animation: 'hlBirds 0s', transform: 'none' }}>
            <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="3s" repeatCount="indefinite"/>
            <ellipse cx="8" cy="16" rx="5" ry="15" fill="#94a3b8bb" transform="rotate(-45 8 16)"/>
            <ellipse cx="8" cy="16" rx="5" ry="15" fill="#94a3b8bb" transform="rotate(45 8 16)"/>
            <ellipse cx="8" cy="16" rx="5" ry="15" fill="#94a3b8bb" transform="rotate(135 8 16)"/>
            <ellipse cx="8" cy="16" rx="5" ry="15" fill="#94a3b8bb" transform="rotate(225 8 16)"/>
            <circle cx="8" cy="16" r="4" fill="#64748b"/>
          </g>
        </svg>
      </div>

      {/* Ambient Particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className={`hl-particle ${p.type === 'feather' ? 'hl-pf' : p.type === 'sparkle' ? 'hl-ps' : 'hl-pd'}`}
          style={{ left: `${p.x}%`, top: `${p.y}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }}
        />
      ))}

      {/* ── CENTER CARD ── */}
      <div style={{
        position: 'relative', zIndex: 20,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 0, marginTop: '-80px',
        padding: '0 16px', width: '100%', maxWidth: 560,
      }}>

        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            fontSize: 'clamp(1.05rem,4.5vw,1.55rem)',
            fontWeight: 900, letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg,#166534 0%,#15803d 50%,#052e16 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            🐓 Sri Mahalakshmi Poultry AI ERP
          </div>
          <div style={{ fontSize: 'clamp(0.62rem,2vw,0.75rem)', color: '#15803d', fontWeight: 600, marginTop: 4, letterSpacing: '0.02em' }}>
            Intelligent Poultry Management Powered by AI
          </div>
        </div>

        {/* ── TRACK + HEN ── */}
        <div style={{ width: '100%', position: 'relative', marginBottom: 6 }}>

          {/* Hen sitting on track */}
          <div className="hl-hen-wrap" style={{ left: `${henLeft}%` }}>
            <div className="hl-dust" style={{ left: 4 }} />
            <div className="hl-dust" style={{ left: 20 }} />
            <div className="hl-egg" />

            <svg width="84" height="72" viewBox="0 0 84 72">
              {/* Tail */}
              <g className="hl-tail">
                <ellipse cx="15" cy="34" rx="11" ry="5" fill="#facc15" transform="rotate(-38 15 34)"/>
                <ellipse cx="12" cy="38" rx="11" ry="4" fill="#fbbf24" transform="rotate(-52 12 38)"/>
                <ellipse cx="11" cy="32" rx="10" ry="4" fill="#f59e0b" transform="rotate(-22 11 32)"/>
              </g>

              {/* Body */}
              <g className="hl-body">
                <ellipse cx="44" cy="41" rx="23" ry="19" fill="#f9fafb" stroke="#e2e8f0" strokeWidth="1.5"/>
                <ellipse cx="46" cy="47" rx="13" ry="10" fill="#fde68a33"/>
                {/* Wing */}
                <g className="hl-wing">
                  <ellipse cx="42" cy="39" rx="15" ry="10" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" transform="rotate(-12 42 39)"/>
                  <ellipse cx="40" cy="42" rx="11" ry="6" fill="#e2e8f0" transform="rotate(-12 40 42)"/>
                </g>
                {/* Spots */}
                <circle cx="52" cy="37" r="3.5" fill="#fde68a33"/>
                <circle cx="46" cy="46" r="2.5" fill="#fde68a22"/>

                {/* Legs */}
                <g className="hl-leg-r">
                  <line x1="48" y1="56" x2="52" y2="67" stroke="#f59e0b" strokeWidth="3.2" strokeLinecap="round"/>
                  <line x1="52" y1="67" x2="59" y2="68" stroke="#f59e0b" strokeWidth="2.6" strokeLinecap="round"/>
                  <line x1="52" y1="67" x2="46" y2="69" stroke="#f59e0b" strokeWidth="2.6" strokeLinecap="round"/>
                </g>
                <g className="hl-leg-l">
                  <line x1="39" y1="56" x2="35" y2="67" stroke="#f59e0b" strokeWidth="3.2" strokeLinecap="round"/>
                  <line x1="35" y1="67" x2="42" y2="68" stroke="#f59e0b" strokeWidth="2.6" strokeLinecap="round"/>
                  <line x1="35" y1="67" x2="29" y2="69" stroke="#f59e0b" strokeWidth="2.6" strokeLinecap="round"/>
                </g>

                {/* Head */}
                <g className="hl-head" style={{ transformOrigin: '55px 24px' }}>
                  <ellipse cx="54" cy="29" rx="9" ry="12" fill="#f9fafb" stroke="#e2e8f0" strokeWidth="1.2"/>
                  <circle cx="56" cy="17" r="14" fill="#f9fafb" stroke="#e2e8f0" strokeWidth="1.5"/>
                  {/* Comb */}
                  <path d="M51 5 Q53.5 0 55.5 4.5 Q57.5 -0.5 59.5 5 Q61.5 0.5 63.5 5.5" stroke="#ef4444" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Eye */}
                  <circle cx="61" cy="14" r="4.5" fill="#0f172a"/>
                  <circle cx="62.5" cy="12.5" r="1.8" fill="white"/>
                  <circle cx="61" cy="14" r="1.8" fill="#166534"/>
                  {/* Wattle */}
                  <ellipse cx="55" cy="25" rx="4.5" ry="5.5" fill="#ef4444"/>
                  {/* Beak */}
                  <g className="hl-beak-lo">
                    <path d="M62 18 L72 21 L62 24 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8"/>
                  </g>
                  <path d="M62 18 L72 20 L62 21 Z" fill="#fbbf24"/>
                </g>
              </g>
            </svg>
          </div>

          {/* Track */}
          <div className="hl-track-bg">
            <div className="hl-track-fill" style={{ width: `${progress}%` }} />
          </div>

          {/* Track labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, padding: '0 2px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#15803d' }}>🌱 Farm Ledger</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#166534' }}>{Math.round(progress)}%</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#15803d' }}>🏁 Dashboard</span>
          </div>
        </div>

        {/* Loading Message */}
        <div style={{ height: 38, display: 'flex', alignItems: 'center', marginTop: 12 }}>
          <p className={`hl-msg ${msgVisible ? 'hl-msg-in' : 'hl-msg-out'}`} style={{
            fontSize: 'clamp(0.72rem,2.5vw,0.84rem)',
            fontWeight: 700, color: '#166534',
            letterSpacing: '0.01em', textAlign: 'center', margin: 0,
          }}>
            {LOADING_MESSAGES[msgIndex]}
          </p>
        </div>

        {/* Dot pulse */}
        <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="hl-dot" style={{ animationDelay: `${i * 0.22}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
