import React, { useState } from 'react';
import { GameSettings } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface SettingsModalProps {
  settings: GameSettings;
  onChange: (updated: GameSettings) => void;
  onClose: () => void;
  isInMatch?: boolean;
  onReturnToLobby?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onChange,
  onClose,
  isInMatch,
  onReturnToLobby,
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmAfk, setConfirmAfk] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 pointer-events-auto select-none overflow-y-auto">
      {/* Low-Poly Faceted Semi-3D Modal Panel */}
      <div className="w-full max-w-md bg-[#121722] border-t-2 border-l-2 border-b-2 border-r-2 border-t-[#475569] border-l-[#475569] border-b-[#0a0d14] border-r-[#0a0d14] p-4 sm:p-5 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242e42] pb-2.5 mb-3.5">
          <div className="flex items-center gap-2">
            <img
              src="/logo_zell.png"
              alt="Zell Studio"
              className="w-5 h-5 rounded object-contain"
              onError={(e) => {
                e.currentTarget.src = '/assets/aistudio/image_3db09b16.png';
              }}
            />
            <h3 className="font-display text-sm sm:text-base font-bold text-white tracking-wider uppercase">
              Pengaturan
            </h3>
          </div>
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              soundEngine.playUiClick();
              onClose();
            }}
            className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-[#1a2232] border-t border-l border-t-[#475569] border-l-[#475569] border-b border-r border-b-[#0b0f17] border-r-[#0b0f17] cursor-pointer"
          >
            Tutup [✕]
          </button>
        </div>

        <div className="space-y-3 text-xs max-h-[72vh] overflow-y-auto pr-1">
          {/* AFK / Return to Lobby during live match */}
          {isInMatch && onReturnToLobby && (
            <div className="bg-[#181f2c] border-t-2 border-l-2 border-b-2 border-r-2 border-t-[#b45309] border-l-[#b45309] border-b-[#0a0d14] border-r-[#0a0d14] p-3">
              <div className="text-amber-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Tinggalkan Laga (AFK)</span>
                <span className="text-[10px] text-slate-400">Online Match</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug mb-2.5">
                Game online berjalan terus tanpa jeda. Keluar ke lobby akan dicatat sebagai aksi AFK.
              </p>

              {!confirmAfk ? (
                <button
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    soundEngine.playUiClick();
                    setConfirmAfk(true);
                  }}
                  className="w-full py-2 bg-[#78350f] hover:bg-[#92400e] text-amber-200 border-t border-l border-t-[#d97706] border-l-[#d97706] border-b border-r border-b-[#291305] border-r-[#291305] font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Keluar ke Lobby (AFK)
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      soundEngine.playUiClick();
                      onReturnToLobby();
                    }}
                    className="flex-1 py-1.5 bg-[#b45309] hover:bg-[#d97706] text-white font-bold text-xs uppercase cursor-pointer"
                  >
                    Ya, Keluar (AFK)
                  </button>
                  <button
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      soundEngine.playUiClick();
                      setConfirmAfk(false);
                    }}
                    className="flex-1 py-1.5 bg-[#1a2232] text-slate-300 border border-[#334155] font-bold text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Contact Person */}
          <div className="bg-[#161d2a] border-t border-l border-t-[#334155] border-l-[#334155] border-b border-r border-b-[#0b0f17] border-r-[#0b0f17] p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                Developer Contact
              </span>
              <span className="text-[9px] px-1.5 py-0.2 bg-[#0d121b] text-amber-300 border border-[#2a364f]">
                Zell Studio
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-[#0d121a] p-2 border border-[#222c3e]">
              <div className="font-mono-tabular font-bold text-white text-xs tracking-wider">
                088216166515
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href="https://wa.me/6288216166515"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 text-[10px] font-bold bg-[#b45309] hover:bg-[#d97706] text-white"
                >
                  WhatsApp
                </a>
                <button
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    navigator.clipboard?.writeText('088216166515');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-[#1a2232] text-slate-200 border border-[#334155] cursor-pointer"
                >
                  {copied ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            </div>
          </div>

          {/* PC Control Scheme */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Skema Kontrol PC
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0d121a] border border-[#242e42]">
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  soundEngine.playUiClick();
                  onChange({ ...settings, controlScheme: 'right_click' });
                }}
                className={`py-1.5 px-2 text-xs font-semibold cursor-pointer border-t border-l border-b border-r ${
                  settings.controlScheme === 'right_click'
                    ? 'bg-[#b45309] text-white border-t-[#d97706] border-l-[#d97706] border-b-[#451a03] border-r-[#451a03]'
                    : 'bg-[#161d2a] text-slate-300 hover:text-white border-t-[#334155] border-l-[#334155] border-b-[#0a0d14] border-r-[#0a0d14]'
                }`}
              >
                Classic MOBA (Klik Kanan)
              </button>
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  soundEngine.playUiClick();
                  onChange({ ...settings, controlScheme: 'wasd' });
                }}
                className={`py-1.5 px-2 text-xs font-semibold cursor-pointer border-t border-l border-b border-r ${
                  settings.controlScheme === 'wasd'
                    ? 'bg-[#b45309] text-white border-t-[#d97706] border-l-[#d97706] border-b-[#451a03] border-r-[#451a03]'
                    : 'bg-[#161d2a] text-slate-300 hover:text-white border-t-[#334155] border-l-[#334155] border-b-[#0a0d14] border-r-[#0a0d14]'
                }`}
              >
                Action MOBA (WASD)
              </button>
            </div>
          </div>

          {/* Mobile Virtual Joystick */}
          <div className="flex items-center justify-between bg-[#161d2a] border border-[#242e42] p-2.5">
            <div>
              <div className="text-xs font-semibold text-slate-200">Virtual Joystick (Mobile)</div>
              <div className="text-[10px] text-slate-400">Analog sentuh di layar</div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  soundEngine.playUiClick();
                  onChange({
                    ...settings,
                    joystickSide: settings.joystickSide === 'left' ? 'right' : 'left',
                  });
                }}
                className="px-2 py-1 text-xs font-semibold bg-[#1a2232] text-slate-200 border border-[#334155] cursor-pointer"
              >
                Posisi: {settings.joystickSide === 'left' ? 'Kiri' : 'Kanan'}
              </button>
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  soundEngine.playUiClick();
                  onChange({ ...settings, showTouchControls: !settings.showTouchControls });
                }}
                className={`px-2.5 py-1 text-xs font-bold cursor-pointer ${
                  settings.showTouchControls
                    ? 'bg-[#b45309] text-white'
                    : 'bg-[#1a2232] text-slate-400 border border-[#334155]'
                }`}
              >
                {settings.showTouchControls ? 'Aktif' : 'Mati'}
              </button>
            </div>
          </div>

          {/* Camera Lock */}
          <div className="flex items-center justify-between bg-[#161d2a] border border-[#242e42] p-2.5">
            <div>
              <div className="text-xs font-semibold text-slate-200">Kamera Mengikuti Hero</div>
              <div className="text-[10px] text-slate-400">Lock kamera atau geser bebas</div>
            </div>
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                soundEngine.playUiClick();
                onChange({ ...settings, cameraLocked: !settings.cameraLocked });
              }}
              className={`px-3 py-1 text-xs font-bold cursor-pointer ${
                settings.cameraLocked
                  ? 'bg-[#b45309] text-white'
                  : 'bg-[#1a2232] text-slate-300 border border-[#334155]'
              }`}
            >
              {settings.cameraLocked ? 'Terkunci' : 'Bebas (Free)'}
            </button>
          </div>

          {/* Graphics Quality */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Kualitas Grafis
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0d121a] border border-[#242e42]">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    soundEngine.playUiClick();
                    onChange({ ...settings, graphicsQuality: q });
                  }}
                  className={`py-1 px-2 text-xs font-semibold capitalize cursor-pointer border-t border-l border-b border-r ${
                    settings.graphicsQuality === q
                      ? 'bg-[#b45309] text-white border-t-[#d97706] border-l-[#d97706] border-b-[#451a03] border-r-[#451a03]'
                      : 'bg-[#161d2a] text-slate-300 hover:text-white border-t-[#334155] border-l-[#334155] border-b-[#0a0d14] border-r-[#0a0d14]'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Sound Effects */}
          <div className="flex items-center justify-between bg-[#161d2a] border border-[#242e42] p-2.5">
            <div>
              <div className="text-xs font-semibold text-slate-200">Audio Suara</div>
              <div className="text-[10px] text-slate-400">Web Audio sintetis</div>
            </div>
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                onChange({ ...settings, audioMuted: !settings.audioMuted });
              }}
              className={`px-3 py-1 text-xs font-bold cursor-pointer ${
                !settings.audioMuted
                  ? 'bg-[#b45309] text-white'
                  : 'bg-[#1a2232] text-slate-400 border border-[#334155]'
              }`}
            >
              {settings.audioMuted ? 'Muted' : 'Aktif'}
            </button>
          </div>
        </div>

        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            soundEngine.playUiClick();
            onClose();
          }}
          className="mt-4 w-full py-2 bg-[#b45309] hover:bg-[#d97706] text-white font-bold text-xs uppercase tracking-wider border-t border-l border-t-[#d97706] border-l-[#d97706] border-b border-r border-b-[#451a03] border-r-[#451a03] cursor-pointer"
        >
          Simpan & Tutup
        </button>
      </div>
    </div>
  );
};
