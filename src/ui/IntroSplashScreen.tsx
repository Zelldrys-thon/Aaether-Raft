import React, { useEffect, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';

interface IntroSplashScreenProps {
  onFinish: () => void;
}

export const IntroSplashScreen: React.FC<IntroSplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'studio' | 'game' | 'ready'>('studio');
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Sound cue on intro start
    soundEngine.playUiClick();

    // Progress bar animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 8) + 4;
        return Math.min(100, next);
      });
    }, 90);

    // Phase transition timers
    const t1 = setTimeout(() => {
      setPhase('game');
    }, 1200);

    const t2 = setTimeout(() => {
      setPhase('ready');
    }, 2400);

    const t3 = setTimeout(() => {
      handleComplete();
    }, 3200);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const handleComplete = () => {
    setFadeOut(true);
    setTimeout(() => {
      onFinish();
    }, 450);
  };

  return (
    <div
      onClick={handleComplete}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#05080d] select-none p-6 transition-opacity duration-500 cursor-pointer ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
    >
      {/* Background ambient radial glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-sky-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-amber-500/10 rounded-full blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#05080d_85%)]" />
      </div>

      {/* Top Tag */}
      <div className="relative z-10 text-center pt-2 sm:pt-4">
        <span className="text-[10px] sm:text-xs font-mono-tabular tracking-widest text-slate-500 uppercase">
          Aetheria Project • Mobile 3D MOBA
        </span>
      </div>

      {/* Center: Zell Studio Logo & Game Reveal */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto">
        {/* Animated Studio Logo */}
        <div className="relative group mb-4 sm:mb-6">
          <div className="absolute -inset-3 bg-gradient-to-r from-amber-500/40 via-sky-500/40 to-emerald-500/40 rounded-3xl blur-xl opacity-75 animate-pulse" />
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-[#0b0f17] border-2 border-amber-400/80 p-3 shadow-2xl flex items-center justify-center overflow-hidden">
            <img
              src="/logo_zell.png"
              alt="Zell Studio"
              className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(245,158,11,0.5)] transition-transform duration-700 hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = '/assets/aistudio/image_3db09b16.png';
              }}
            />
          </div>
        </div>

        {/* Studio Branding */}
        <div className="space-y-1">
          <div className="text-[11px] sm:text-xs font-mono-tabular tracking-widest text-amber-400 uppercase font-bold">
            by zell studio
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-widest leading-none drop-shadow-md">
            ZELL STUDIO
          </h1>
        </div>

        {/* Game Title & Badge */}
        <div
          className={`mt-4 sm:mt-5 transition-all duration-700 flex flex-col items-center ${
            phase === 'studio' ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          <div className="flex items-center gap-2 px-3 py-1 bg-[#151c28]/90 border border-sky-400/50 rounded-full shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-display text-xs sm:text-sm font-bold text-sky-300 tracking-wider">
              AETHER RIFT MOBA
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-2 font-mono-tabular">
            5v5 Tactical Combat • 3 Lanes • Real-Time 3D
          </p>
        </div>
      </div>

      {/* Bottom Loading Progress & Skip CTA */}
      <div className="relative z-10 w-full max-w-xs sm:max-w-sm flex flex-col items-center gap-2 pb-2 sm:pb-4">
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-[#151c28] border border-[#2a364f] rounded-full overflow-hidden">
          <div
            style={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400 transition-all duration-150"
          />
        </div>

        <div className="flex items-center justify-between w-full text-[10px] font-mono-tabular text-slate-400 px-1">
          <span>{progress < 100 ? 'Memuat aset game...' : 'Siap dimainkan!'}</span>
          <span className="text-amber-400 font-bold">{progress}%</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleComplete();
          }}
          className="mt-1 text-[11px] sm:text-xs text-slate-300 hover:text-white font-semibold transition-colors flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#151c28]/80 border border-[#2a364f] active:scale-95"
        >
          <span>Ketuk layar untuk memulai</span>
          <span className="text-amber-400">▶</span>
        </button>
      </div>
    </div>
  );
};
