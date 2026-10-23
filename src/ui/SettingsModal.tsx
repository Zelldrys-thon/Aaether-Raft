import React, { useState } from 'react';
import { GameSettings } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface SettingsModalProps {
  settings: GameSettings;
  onChange: (updated: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onChange, onClose }) => {
  const [copied, setCopied] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 pointer-events-auto select-none overflow-y-auto">
      <div className="w-full max-w-md bg-[#0b0f17] border border-[#2a364f] rounded-xl p-4 sm:p-6 shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-[#2a364f] pb-3 mb-4 sm:mb-5">
          <div className="flex items-center gap-2">
            <img
              src="/logo_zell.png"
              alt="Zell Studio"
              className="w-5 h-5 rounded object-contain"
              onError={(e) => {
                e.currentTarget.src = '/assets/aistudio/image_3db09b16.png';
              }}
            />
            <h3 className="font-display text-base sm:text-lg font-bold text-white">Pengaturan</h3>
          </div>
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-[#151c28] rounded-md cursor-pointer"
          >
            Tutup
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4 text-sm max-h-[75vh] overflow-y-auto pr-1">
          {/* Developer Contact Person (Zell Studio) */}
          <div className="bg-[#151c28] border border-amber-500/40 rounded-xl p-3 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                  Contact Person
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-400/20 text-amber-300 font-mono-tabular font-bold rounded">
                  Zell Studio
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Developer</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#0b0f17] border border-[#2a364f] rounded-lg p-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 text-sm">
                  📞
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-mono-tabular font-bold text-white tracking-wider">
                    088216166515
                  </div>
                  <div className="text-[10px] text-slate-400">Hubungi via WhatsApp / Telp</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <a
                  href="https://wa.me/6288216166515"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-[11px] font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-md transition-colors inline-flex items-center gap-1"
                >
                  <span>💬</span> WhatsApp
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText('088216166515');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-2 py-1 text-[11px] font-semibold bg-[#1e293b] hover:bg-[#2a364f] text-slate-200 border border-[#2a364f] rounded-md transition-colors cursor-pointer"
                >
                  {copied ? '✓ Tersalin!' : 'Salin'}
                </button>
              </div>
            </div>
          </div>
          {/* PC Control Scheme */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              PC Control Scheme
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#151c28] rounded-lg border border-[#2a364f]">
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  onChange({ ...settings, controlScheme: 'right_click' });
                }}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  settings.controlScheme === 'right_click'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Classic MOBA (Right-Click)
              </button>
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  onChange({ ...settings, controlScheme: 'wasd' });
                }}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  settings.controlScheme === 'wasd'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Action MOBA (WASD)
              </button>
            </div>
          </div>

          {/* Mobile Virtual Joystick Visibility & Placement */}
          <div className="flex items-center justify-between bg-[#151c28] border border-[#2a364f] rounded-lg px-4 py-3">
            <div>
              <div className="text-xs font-semibold text-slate-200">Virtual Joystick</div>
              <div className="text-[11px] text-slate-400">On-screen touch joystick for mobile</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  onChange({
                    ...settings,
                    joystickSide: settings.joystickSide === 'left' ? 'right' : 'left',
                  });
                }}
                className="px-2.5 py-1.5 text-xs font-semibold bg-[#1e293b] text-slate-200 border border-[#2a364f] rounded-md cursor-pointer"
              >
                Side: {settings.joystickSide === 'left' ? 'Left' : 'Right'}
              </button>
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  onChange({ ...settings, showTouchControls: !settings.showTouchControls });
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md cursor-pointer ${
                  settings.showTouchControls
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-[#1e293b] text-slate-300 border border-[#2a364f]'
                }`}
              >
                {settings.showTouchControls ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {/* Camera Lock */}
          <div className="flex items-center justify-between bg-[#151c28] border border-[#2a364f] rounded-lg px-4 py-3">
            <div>
              <div className="text-xs font-semibold text-slate-200">Camera Follow Hero</div>
              <div className="text-[11px] text-slate-400">
                Lock isometric camera to Hero or pan freely
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.playUiClick();
                onChange({ ...settings, cameraLocked: !settings.cameraLocked });
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-md cursor-pointer ${
                settings.cameraLocked
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-[#1e293b] text-slate-300 border border-[#2a364f]'
              }`}
            >
              {settings.cameraLocked ? 'Locked' : 'Free Pan'}
            </button>
          </div>

          {/* Graphics Quality */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Graphics Quality
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#151c28] rounded-lg border border-[#2a364f]">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    soundEngine.playUiClick();
                    onChange({ ...settings, graphicsQuality: q });
                  }}
                  className={`py-1.5 px-3 text-xs font-semibold capitalize rounded-md transition-colors cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Sound Effects */}
          <div className="flex items-center justify-between bg-[#151c28] border border-[#2a364f] rounded-lg px-4 py-3">
            <div>
              <div className="text-xs font-semibold text-slate-200">Sound Effects</div>
              <div className="text-[11px] text-slate-400">Procedural Web Audio synth</div>
            </div>
            <button
              onClick={() => {
                onChange({ ...settings, audioMuted: !settings.audioMuted });
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-md cursor-pointer ${
                !settings.audioMuted
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {settings.audioMuted ? 'Muted' : 'Active'}
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            soundEngine.playUiClick();
            onClose();
          }}
          className="mt-6 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
        >
          Save & Close
        </button>
      </div>
    </div>
  );
};
