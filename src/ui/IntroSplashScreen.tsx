import React, { useEffect, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';

interface IntroSplashScreenProps {
  onFinish: () => void;
}

export const IntroSplashScreen: React.FC<IntroSplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<number>(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    try {
      soundEngine.playUiClick();
    } catch {
      // ignore
    }

    // Smooth quiet progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2.5;
      });
    }, 60);

    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => handleComplete(), 3400);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleComplete = () => {
    setFadeOut(true);
    setTimeout(() => {
      onFinish();
    }, 550);
  };

  return (
    <div
      onClick={handleComplete}
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-[#020408] select-none overflow-hidden transition-opacity duration-700 cursor-pointer ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
    >
      {/* 1. Atmospheric Dusk / Midnight Sky Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Deep cold twilight gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020408] via-[#050b14] to-[#0a1320]" />

        {/* Cold Pale Moon with Soft Glow */}
        <div className="absolute top-[12%] sm:top-[16%] left-1/2 -translate-x-1/2 w-44 h-44 sm:w-60 sm:h-60 rounded-full bg-gradient-to-b from-[#f8fafc]/15 to-[#38bdf8]/5 blur-md" />
        <div className="absolute top-[14%] sm:top-[18%] left-1/2 -translate-x-1/2 w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-[#f1f5f9]/90 shadow-[0_0_60px_rgba(226,232,240,0.25)] flex items-center justify-center opacity-85">
          <div className="w-full h-full rounded-full bg-[radial-gradient(circle_at_35%_40%,rgba(148,163,184,0.35),transparent_65%)]" />
        </div>

        {/* Quiet drifting night mist / fog layer */}
        <div className="absolute inset-x-0 bottom-24 sm:bottom-32 h-48 bg-gradient-to-t from-[#020408] via-[#0f172a]/20 to-transparent opacity-60 animate-pulse duration-[8000ms]" />

        {/* Stars scattered across quiet sky */}
        <div className="absolute top-8 left-[15%] w-1 h-1 bg-white/60 rounded-full animate-ping duration-[3000ms]" />
        <div className="absolute top-16 left-[30%] w-0.5 h-0.5 bg-slate-300/40 rounded-full" />
        <div className="absolute top-24 right-[25%] w-1 h-1 bg-white/70 rounded-full animate-pulse" />
        <div className="absolute top-12 right-[18%] w-0.5 h-0.5 bg-slate-400/50 rounded-full" />
        <div className="absolute top-36 left-[8%] w-0.5 h-0.5 bg-slate-400/40 rounded-full" />
        <div className="absolute top-32 right-[10%] w-1 h-1 bg-slate-300/60 rounded-full" />
      </div>

      {/* Spacer top */}
      <div className="h-6" />

      {/* 2. Center Silhouette: ONLY Zell Studio Logo & Zell Studio Text */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto px-4">
        {/* Siluet Logo Zell Studio with Subtle Backlit Moon Halo */}
        <div
          className={`relative transition-all duration-1000 transform ${
            phase >= 1 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-3'
          }`}
        >
          {/* Subtle Moon Rim Light / Halo */}
          <div className="absolute -inset-4 rounded-full bg-slate-200/10 blur-xl pointer-events-none" />

          {/* Hexagonal Silhouette Box */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-black/85 border border-slate-700/60 p-3 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.95)] flex items-center justify-center backdrop-blur-sm">
            <img
              src="/logo_zell.png"
              alt="Zell Studio"
              className="w-full h-full object-contain filter drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)] opacity-95"
              onError={(e) => {
                e.currentTarget.src = '/assets/aistudio/image_3db09b16.png';
              }}
            />
          </div>
        </div>

        {/* ONLY Zell Studio Text */}
        <div
          className={`mt-4 sm:mt-5 transition-all duration-1000 delay-150 ${
            phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <div className="text-[10px] sm:text-[12px] font-mono-tabular tracking-[0.35em] text-slate-400 uppercase font-medium">
            by zell studio
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-light text-slate-200 tracking-[0.25em] uppercase mt-1">
            Zell Studio
          </h1>
        </div>
      </div>

      {/* 3. Solitary Landscape Silhouette Vector (Gunung, Tebing, & Pendekar Sendiri di Malam Hari) */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none flex flex-col justify-end">
        <svg
          viewBox="0 0 1200 360"
          preserveAspectRatio="none"
          className="w-full h-44 sm:h-64 md:h-80 block"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Layer 1: Distant Mountain Silhouettes (Deep Charcoal) */}
          <path
            d="M0 240 L160 180 L340 230 L520 160 L680 210 L880 145 L1060 215 L1200 170 L1200 360 L0 360 Z"
            fill="#060d16"
            opacity="0.75"
          />

          {/* Layer 2: Midground Crags & Ancient Ruined Pillars (Darker Charcoal) */}
          <path
            d="M0 270 L110 235 L210 260 L290 220 L440 275 L610 215 L740 260 L890 205 L1020 255 L1200 220 L1200 360 L0 360 Z"
            fill="#040810"
            opacity="0.9"
          />

          {/* Distant Ruin Pillars Silhouette on Left & Right */}
          <rect x="180" y="210" width="12" height="60" fill="#040810" />
          <rect x="202" y="225" width="10" height="45" fill="#040810" />
          <rect x="175" y="205" width="42" height="7" fill="#040810" />

          <rect x="980" y="190" width="14" height="70" fill="#040810" />
          <rect x="1006" y="205" width="12" height="55" fill="#040810" />
          <rect x="972" y="184" width="52" height="8" fill="#040810" />

          {/* Layer 3: Foreground Crag with Lone Champion Silhouette (Jet Black) */}
          <path
            d="M0 310 Q 180 300 340 330 Q 510 355 600 320 Q 720 280 880 325 Q 1060 340 1200 315 L1200 360 L0 360 Z"
            fill="#010204"
          />

          {/* Lone Champion / Warrior Silhouette Standing on the Center Crag (x=600, y=320) */}
          <g transform="translate(600, 318)">
            {/* The Rock Peak */}
            <path d="M-45 0 L0 -14 L45 0 L55 45 L-55 45 Z" fill="#010204" />

            {/* Champion Figure Silhouette: Cloak, Head, Armor, Standing Still */}
            <path d="M-8 0 L-6 -32 L-2 -32 L-4 0 Z" fill="#010204" />
            <path d="M4 0 L6 -32 L2 -32 L4 0 Z" fill="#010204" />
            <path d="M-9 -32 L-7 -58 L7 -58 L9 -32 Q 22 -20 38 -12 Q 20 -25 9 -40 Z" fill="#010204" />
            <circle cx="0" cy="-66" r="6.5" fill="#010204" />
            <path d="M-3 -72 L0 -79 L3 -72 Z" fill="#010204" />
            <line x1="-16" y1="-80" x2="-16" y2="4" stroke="#010204" strokeWidth="2.4" />
            <line x1="-22" y1="-64" x2="-10" y2="-64" stroke="#010204" strokeWidth="2" />
            <circle cx="-16" cy="-81" r="2" fill="#010204" />
            <ellipse cx="-16" cy="-60" rx="3" ry="2.5" fill="#010204" />
          </g>

          {/* Solitary Gnarled Pine Tree Silhouette on the Left Ridge */}
          <g transform="translate(90, 240)">
            <path d="M0 70 Q 8 35 15 0 Q 6 35 0 70 Z" fill="#010204" />
            <path d="M15 10 Q 35 5 45 -6 Q 30 2 15 10 Z" fill="#010204" />
            <path d="M14 25 Q -10 20 -25 12 Q -8 26 14 25 Z" fill="#010204" />
            <path d="M15 40 Q 40 38 52 28 Q 35 44 15 40 Z" fill="#010204" />
          </g>

          {/* Solitary Pine on the Right */}
          <g transform="translate(1120, 230)">
            <path d="M0 80 Q -6 40 -12 0 Q -4 40 0 80 Z" fill="#010204" />
            <path d="M-12 12 Q -32 6 -42 -2 Q -28 10 -12 12 Z" fill="#010204" />
            <path d="M-11 28 Q 12 24 24 16 Q 8 32 -11 28 Z" fill="#010204" />
          </g>
        </svg>

        {/* Ground blend overlay */}
        <div className="h-10 sm:h-14 bg-[#010204] w-full -mt-1" />
      </div>

      {/* 4. Bottom Serene Hairline Progress (Zero Text) */}
      <div className="relative z-20 w-full max-w-xs mx-auto flex flex-col items-center pb-6 sm:pb-8 px-6">
        <div className="w-full h-[1.5px] bg-slate-900/90 rounded-full overflow-hidden border border-slate-800/30">
          <div
            style={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-slate-600 via-slate-300 to-slate-500 transition-all duration-100 ease-out"
          />
        </div>
      </div>
    </div>
  );
};
