import React, { useRef, useState } from 'react';
import {
  DeployableState,
  GameSettings,
  MatchSnapshot,
  SkillSlotIndex,
  TacticalItemId,
} from '../types/game';
import { HERO_DEFINITIONS, SHOP_ITEMS } from '../heroes/heroDefinitions';
import {
  DEPLOYABLE_IDS,
  ELIXIR_IDS,
  TACTICAL_CATALOG,
} from '../combat/tacticalSystem';
import { MAP_HALF_SIZE } from '../map/laneConfig';
import { SkillIconSvg } from './HeroAvatarSvg';
import { soundEngine } from '../audio/soundEngine';

interface MatchHudOverlayProps {
  snapshot: MatchSnapshot;
  settings: GameSettings;
  isPaused: boolean;
  onUpdateSettings: (s: GameSettings) => void;
  onTogglePause: () => void;
  onOpenSettings: () => void;
  onBasicAttack: () => void;
  onCastSkill: (slot: SkillSlotIndex) => void;
  onStartSkillAim: (slot: SkillSlotIndex) => void;
  onUpdateSkillDragAim: (slot: SkillSlotIndex, normX: number, normZ: number) => void;
  onFinishSkillDragAim: (slot: SkillSlotIndex, wasDragged: boolean) => void;
  onCancelSkillAim: () => void;
  onSetActionIndicator: (mode: 'none' | 'attack' | SkillSlotIndex) => void;
  onBuyShopItem: (itemId: string) => void;
  onBuyTacticalItem: (itemId: TacticalItemId) => void;
  onStartTacticalAim: (itemId: TacticalItemId) => void;
  onUpdateTacticalDragAim: (itemId: TacticalItemId, normX: number, normZ: number) => void;
  onFinishTacticalDragAim: (itemId: TacticalItemId, wasDragged: boolean) => void;
  onCancelTacticalAim: () => void;
  onUseTacticalItem: (itemId: TacticalItemId) => void;
  onCenterCamera: () => void;
  onPanCamera: (worldX: number, worldZ: number) => void;
  onZoomCamera: (delta: number) => void;
  onResetCameraZoom: () => void;
  onJoystickMove: (dx: number, dy: number) => void;
  onRestartMatch: () => void;
  onReturnToPick: () => void;
  onReturnToLobby: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getDeployableStateBadge(state?: DeployableState): {
  label: string;
  bg: string;
  text: string;
} | null {
  switch (state) {
    case 'cryo_trap':
      return {
        label: 'CRYO FREEZE TRAP',
        bg: 'bg-cyan-950/95 border-cyan-400/70',
        text: 'text-cyan-300',
      };
    case 'pyro_infused':
      return {
        label: 'PYRO INFUSED',
        bg: 'bg-orange-950/95 border-orange-400/70',
        text: 'text-orange-300',
      };
    case 'vitae_overcharged':
      return {
        label: 'SUPPORT AURA+',
        bg: 'bg-emerald-950/95 border-emerald-400/70',
        text: 'text-emerald-300',
      };
    case 'volt_charged':
      return {
        label: 'VOLT RELAY',
        bg: 'bg-violet-950/95 border-violet-400/70',
        text: 'text-violet-300',
      };
    default:
      return null;
  }
}

const TacticalItemIconSvg: React.FC<{
  itemId: TacticalItemId;
  color: string;
  className?: string;
}> = ({ itemId, color, className = 'w-5 h-5' }) => {
  switch (itemId) {
    case 'pyro_damage':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path d="M9 3h6M10 3v4l-4.5 7.5A3 3 0 0 0 8.1 19h7.8a3 3 0 0 0 2.6-4.5L14 7V3" />
          <path
            d="M12 11c1.5 1.8 2 3.2 1 4.6a2 2 0 0 1-3 0c-1-1.4-.5-2.8 2-4.6z"
            fill={color}
            fillOpacity="0.35"
          />
        </svg>
      );
    case 'cryo_block':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <polygon
            points="12 2 19 7 19 17 12 22 5 17 5 7"
            fill={color}
            fillOpacity="0.22"
          />
          <path d="M12 2v20M5 7l14 10M19 7L5 17" />
        </svg>
      );
    case 'volt_stealth':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path
            d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
            fill={color}
            fillOpacity="0.28"
          />
        </svg>
      );
    case 'vitae_heal':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path d="M9 3h6M10 3v3.5L5.5 14A3.5 3.5 0 0 0 8.5 19h7a3.5 3.5 0 0 0 3-5L14 6.5V3" />
          <path d="M12 10v6M9 13h6" strokeWidth="2.4" />
        </svg>
      );
    case 'barricade':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <rect x="3" y="7" width="18" height="12" rx="2" fill={color} fillOpacity="0.22" />
          <path d="M3 13h18M9 7v6M15 7v6M6 13v6M12 13v6M18 13v6" />
        </svg>
      );
    case 'snap_trap':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <circle cx="12" cy="12" r="7" fill={color} fillOpacity="0.2" />
          <circle cx="12" cy="12" r="2.5" fill={color} />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
        </svg>
      );
    case 'aether_totem':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path d="M8 21h8l-1.5-10h-5L8 21z" fill={color} fillOpacity="0.22" />
          <polygon points="12 3 16 7 12 11 8 7" fill={color} fillOpacity="0.4" />
          <path d="M5 21h14" />
        </svg>
      );
    case 'prismatic_pylon':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <polygon
            points="12 2 18 12 12 22 6 12"
            fill={color}
            fillOpacity="0.25"
          />
          <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
        </svg>
      );
  }
};

export const MatchHudOverlay: React.FC<MatchHudOverlayProps> = ({
  snapshot,
  settings,
  isPaused,
  onUpdateSettings,
  onTogglePause,
  onOpenSettings,
  onBasicAttack,
  onCastSkill,
  onStartSkillAim,
  onUpdateSkillDragAim,
  onFinishSkillDragAim,
  onCancelSkillAim,
  onSetActionIndicator,
  onBuyShopItem,
  onBuyTacticalItem,
  onStartTacticalAim,
  onUpdateTacticalDragAim,
  onFinishTacticalDragAim,
  onCancelTacticalAim,
  onUseTacticalItem,
  onCenterCamera,
  onPanCamera,
  onZoomCamera,
  onResetCameraZoom,
  onJoystickMove,
  onRestartMatch,
  onReturnToPick,
  onReturnToLobby,
}) => {
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState<'elixirs' | 'deployables' | 'gear'>('elixirs');
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const joyActiveRef = useRef(false);

  // Drag-to-Aim state for the 3 Circular Skill Buttons
  const [skillDragState, setSkillDragState] = useState<{
    slot: SkillSlotIndex | null;
    dx: number;
    dy: number;
    wasDragged: boolean;
  }>({ slot: null, dx: 0, dy: 0, wasDragged: false });
  const skillStartPosRef = useRef<{ x: number; y: number; wasAlreadyAiming: boolean }>({
    x: 0,
    y: 0,
    wasAlreadyAiming: false,
  });

  // Drag-to-Aim state for the Bottom-Center Tactical Belt Slots (Elixirs & Deployables)
  const [tacticalDragState, setTacticalDragState] = useState<{
    itemId: TacticalItemId | null;
    dx: number;
    dy: number;
    wasDragged: boolean;
  }>({ itemId: null, dx: 0, dy: 0, wasDragged: false });
  const tacticalStartPosRef = useRef<{ x: number; y: number; wasAlreadyAiming: boolean }>({
    x: 0,
    y: 0,
    wasAlreadyAiming: false,
  });

  const hero = HERO_DEFINITIONS[snapshot.player.heroId];

  // Minimap click/drag to pan camera
  const handleMinimapPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const nz = (e.clientY - rect.top) / rect.height;
    const worldX = (nx * 2 - 1) * MAP_HALF_SIZE;
    const worldZ = (nz * 2 - 1) * MAP_HALF_SIZE;
    if (settings.cameraLocked) {
      onUpdateSettings({ ...settings, cameraLocked: false });
    }
    onPanCamera(worldX, worldZ);
  };

  // Virtual Joystick handler
  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joyBaseRef.current) return;
    const rect = joyBaseRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, maxR);
    const nx = dist > 0.01 ? dx / dist : 0;
    const ny = dist > 0.01 ? dy / dist : 0;
    setJoyKnob({ x: nx * clamped, y: ny * clamped });
    onJoystickMove(nx * (clamped / maxR), ny * (clamped / maxR));
  };

  // Radial offsets for the 3 Circular Skill Buttons surrounding the bottom-right Basic Attack button
  // Slot 0 (Q): Left of Attack | Slot 1 (W): Diagonal Top-Left | Slot 2 (E): Above Attack
  const radialPositions: { slot: SkillSlotIndex; rightPx: number; bottomPx: number }[] = [
    { slot: 0, rightPx: 112, bottomPx: 18 },
    { slot: 1, rightPx: 94, bottomPx: 86 },
    { slot: 2, rightPx: 26, bottomPx: 112 },
  ];

  const activeTacticalItem = snapshot.player.aimingTacticalId
    ? TACTICAL_CATALOG[snapshot.player.aimingTacticalId]
    : null;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none overflow-hidden select-none">
      {/* 1. Overhead Projected HP & Mana Bars (Directly above Player, Heroes, Towers, Monsters, Deployables, Minions) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {snapshot.healthBars.map((hb) => {
          const hpPct = Math.max(0, Math.min(100, (hb.hp / Math.max(1, hb.maxHp)) * 100));
          const manaPct =
            hb.maxMana > 0
              ? Math.max(0, Math.min(100, (hb.mana / Math.max(1, hb.maxMana)) * 100))
              : 0;

          const barColor =
            hb.team === 'ally'
              ? hb.isPlayer
                ? '#34d399'
                : hb.type === 'deployable'
                  ? '#a855f7'
                  : '#38bdf8'
              : hb.team === 'enemy'
                ? '#ef4444'
                : '#f59e0b';

          const isMajor =
            hb.type === 'hero' ||
            hb.type === 'tower' ||
            hb.type === 'base' ||
            hb.type === 'deployable';
          const widthPx =
            hb.type === 'base'
              ? 104
              : hb.type === 'tower'
                ? 82
                : hb.isPlayer
                  ? 92
                  : hb.type === 'hero'
                    ? 78
                    : hb.type === 'deployable'
                      ? 66
                      : hb.type === 'monster'
                        ? 58
                        : 42;

          const deployableBadge =
            hb.type === 'deployable' ? getDeployableStateBadge(hb.deployableState) : null;

          return (
            <div
              key={hb.id}
              style={{
                transform: `translate3d(${Math.round(hb.screenX - widthPx / 2)}px, ${Math.round(
                  hb.screenY
                )}px, 0)`,
                width: `${widthPx}px`,
              }}
              className="absolute top-0 left-0 flex flex-col items-center"
            >
              {/* Status Badges above HP Bar (Stealth or Infused Deployable Reaction State) */}
              {hb.stealthed && (
                <div className="mb-0.5 px-1.5 py-0 text-[9px] font-mono-tabular font-extrabold tracking-wider bg-violet-950/95 text-violet-200 border border-violet-400/70 rounded">
                  STEALTH · INVISIBLE
                </div>
              )}
              {deployableBadge && (
                <div
                  className={`mb-0.5 px-1.5 py-0 text-[9px] font-mono-tabular font-extrabold tracking-wider border rounded whitespace-nowrap ${deployableBadge.bg} ${deployableBadge.text}`}
                >
                  {deployableBadge.label}
                </div>
              )}

              {isMajor && (
                <div className="flex items-center gap-1 mb-0.5 whitespace-nowrap">
                  {hb.type === 'hero' && (
                    <span className="px-1 py-0 text-[10px] font-mono-tabular font-bold bg-[#0b0f17] text-amber-400 border border-[#2a364f] rounded">
                      {hb.level}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-semibold px-1 rounded ${
                      hb.isPlayer
                        ? 'bg-[#0b0f17] text-emerald-300 border border-emerald-500/40'
                        : hb.type === 'deployable'
                          ? 'bg-[#0b0f17]/92 text-purple-200 border border-purple-500/40'
                          : 'bg-[#0b0f17]/90 text-slate-100'
                    }`}
                  >
                    {hb.name}
                  </span>
                </div>
              )}

              {/* HP Bar */}
              <div
                className={`w-full bg-[#0b0f17] border border-[#1e293b] rounded-sm overflow-hidden ${
                  hb.isPlayer ? 'h-2.5' : isMajor ? 'h-2' : 'h-1.5'
                }`}
              >
                <div
                  style={{ width: `${hpPct}%`, backgroundColor: barColor }}
                  className="h-full transition-none"
                />
              </div>

              {/* Mana Bar (for Heroes) */}
              {hb.type === 'hero' && hb.maxMana > 0 && (
                <div className="w-full h-1 bg-[#0b0f17] border border-t-0 border-[#1e293b] overflow-hidden">
                  <div
                    style={{ width: `${manaPct}%` }}
                    className="h-full bg-sky-400 transition-none"
                  />
                </div>
              )}

              {/* Shield Bar */}
              {hb.shield > 0 && (
                <div className="w-full h-1 bg-amber-300 mt-0.5 rounded-sm" />
              )}
            </div>
          );
        })}

        {/* Floating Damage & Heal Output Texts */}
        {snapshot.damageTexts.map((dt) => (
          <div
            key={dt.id}
            style={{
              transform: `translate3d(${Math.round(dt.screenX)}px, ${Math.round(dt.screenY)}px, 0) translate(-50%, -50%)`,
              color: dt.color,
              opacity: dt.opacity,
              textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,1)',
            }}
            className={`absolute top-0 left-0 font-mono-tabular font-extrabold tracking-tight whitespace-nowrap pointer-events-none ${
              dt.isCritOrSkill ? 'text-sm scale-110' : 'text-xs'
            }`}
          >
            {dt.text}
          </div>
        ))}
      </div>

      {/* 2. Top-Left: Tactical 3-Lane Minimap (Both PC & Mobile) */}
      {/* 2. Top-Left: Tactical 3-Lane Minimap (Both PC & Mobile) */}
      <div className="fixed top-2 sm:top-3 left-2 sm:left-3 z-20 pointer-events-auto bg-[#0b0f17]/94 border border-[#2a364f] p-1 sm:p-1.5 rounded-xl shadow-2xl">
        <svg
          viewBox="-104 -104 208 208"
          onPointerDown={handleMinimapPointer}
          onPointerMove={(e) => {
            if (e.buttons === 1) handleMinimapPointer(e);
          }}
          className="w-[92px] h-[92px] sm:w-[128px] sm:h-[128px] bg-[#08120d] rounded-lg border border-[#2a364f] cursor-crosshair touch-none block"
        >
          {/* River */}
          <path
            d="M -95 -87 Q -26 -26 0 0 T 95 87"
            stroke="#84cc16"
            strokeWidth="10"
            fill="none"
            opacity="0.52"
          />
          {/* Top Lane */}
          <path
            d="M -78 78 C -81 14, -80 -69, -49 -75 C -14 -80, 44 -80, 78 -78"
            stroke="#475569"
            strokeWidth="6.5"
            fill="none"
          />
          {/* Mid Lane */}
          <path
            d="M -78 78 C -40 35, -14 17, 0 0 C 17 -14, 40 -35, 78 -78"
            stroke="#475569"
            strokeWidth="6.5"
            fill="none"
          />
          {/* Bot Lane */}
          <path
            d="M -78 78 C -14 80, 61 75, 72 49 C 80 14, 81 -36, 78 -78"
            stroke="#475569"
            strokeWidth="6.5"
            fill="none"
          />

          {snapshot.minimapBlips.map((b) => {
            const color =
              b.team === 'ally'
                ? b.isPlayer
                  ? '#facc15'
                  : b.type === 'deployable'
                    ? '#c084fc'
                    : '#10b981'
                : b.team === 'enemy'
                  ? '#ef4444'
                  : '#f59e0b';
            const r =
              b.type === 'base'
                ? 7.2
                : b.type === 'tower'
                  ? 4.8
                  : b.type === 'hero'
                    ? 5.8
                    : b.type === 'deployable'
                      ? 4.0
                      : b.type === 'monster'
                        ? 3.8
                        : 2.5;
            return <circle key={b.id} cx={b.x} cy={b.z} r={r} fill={color} />;
          })}

          {(() => {
            const vw = 44 * (snapshot.cameraZoom || 1);
            const vh = 32 * (snapshot.cameraZoom || 1);
            return (
              <rect
                x={snapshot.cameraX - vw / 2}
                y={snapshot.cameraZ - vh / 2}
                width={vw}
                height={vh}
                fill="none"
                stroke="#f8fafc"
                strokeWidth="2.2"
                opacity="0.78"
              />
            );
          })()}
        </svg>
      </div>

      {/* 3. Top-Center: Compact Scoreboard & Match Timer */}
      <div className="fixed top-2 sm:top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-[#0b0f17]/94 border border-[#2a364f] px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl shadow-xl font-mono-tabular">
        <span className="text-[11px] sm:text-xs font-bold text-emerald-400">{snapshot.allyKills}</span>
        <span className="text-[9px] sm:text-[10px] text-slate-400">ALLY</span>
        <span className="text-slate-600">·</span>
        <span className="text-[11px] sm:text-xs font-bold text-slate-100">{formatTime(snapshot.matchTime)}</span>
        <span className="text-slate-600">·</span>
        <span className="text-[9px] sm:text-[10px] text-slate-400">ENM</span>
        <span className="text-[11px] sm:text-xs font-bold text-rose-400">{snapshot.enemyKills}</span>
      </div>

      {/* Top-Right: Shop Button, Camera Lock/Free & Settings/Pause (No camera zoom HUD) */}
      <div className="fixed top-2 sm:top-3 right-2 sm:right-3 z-30 pointer-events-auto flex items-center gap-1.5 sm:gap-2">
        {/* Dedicated Prominent Gold Shop Button in Top-Right */}
        <button
          onClick={() => {
            soundEngine.playUiClick();
            setIsShopOpen((prev) => !prev);
          }}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#0b0f17]/96 hover:bg-[#151c28] border-2 border-amber-400 hover:border-amber-300 rounded-xl shadow-2xl text-amber-300 font-display font-bold text-[10px] sm:text-xs tracking-wider transition-all active:scale-95 cursor-pointer min-h-[30px] sm:min-h-[36px]"
          title="Buka Toko Item & Elixir (Gold Shop)"
        >
          <span className="flex items-center justify-center w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-amber-400/20 text-[10px] sm:text-xs shrink-0">
            🛒
          </span>
          <div className="flex flex-col text-left leading-none">
            <span className="text-[9px] sm:text-[11px] font-bold text-white uppercase">
              SHOP
            </span>
            <span className="text-[8.5px] sm:text-[10px] font-mono-tabular text-amber-400 font-bold mt-0.5">
              {snapshot.player.gold}g
            </span>
          </div>
        </button>

        <button
          onClick={() => {
            soundEngine.playUiClick();
            if (settings.cameraLocked) {
              onUpdateSettings({ ...settings, cameraLocked: false });
            } else {
              onUpdateSettings({ ...settings, cameraLocked: true });
              onCenterCamera();
            }
          }}
          className={`min-h-[30px] sm:min-h-[36px] px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
            settings.cameraLocked
              ? 'bg-[#0b0f17]/94 text-emerald-300 border-emerald-500/50'
              : 'bg-[#0b0f17]/94 text-amber-300 border-amber-500/60'
          }`}
          title="Toggle Kamera Mengikuti Hero atau Geser/Scroll Bebas"
        >
          {settings.cameraLocked ? 'Lock' : 'Free'}
        </button>

        <button
          onClick={() => {
            soundEngine.playUiClick();
            onOpenSettings();
          }}
          className="min-h-[30px] sm:min-h-[36px] px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-slate-200 bg-[#0b0f17]/94 hover:bg-[#151c28] border border-[#2a364f] rounded-xl cursor-pointer"
          title="Pengaturan"
        >
          ⚙
        </button>

        <button
          onClick={() => {
            soundEngine.playUiClick();
            onTogglePause();
          }}
          className="min-h-[30px] sm:min-h-[36px] px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-amber-300 bg-[#0b0f17]/94 hover:bg-[#151c28] border border-[#2a364f] rounded-xl cursor-pointer"
          title="Pause / Lanjutkan"
        >
          ⏸
        </button>
      </div>

      {/* Expanded Sanctum Armory (Gold Shop: Elixirs, Deployable Objects, & Hero Gear) - Compact Mobile/PC */}
      {isShopOpen && (
        <div className="fixed top-12 sm:top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[295px] sm:w-[325px] max-w-[94vw] bg-[#0b0f17]/96 border border-[#2a364f] rounded-xl p-2 sm:p-2.5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#2a364f] pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-[10px] sm:text-[11px] font-bold text-white tracking-wide">
                SANCTUM ARMORY
              </span>
              <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono-tabular font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                {snapshot.player.gold}g
              </span>
            </div>
            <button
              onClick={() => setIsShopOpen(false)}
              className="text-[10px] sm:text-xs text-slate-400 hover:text-white cursor-pointer px-1.5 py-0.5"
            >
              Tutup ✕
            </button>
          </div>

          {/* 3 Category Tabs: Elixirs | Deployable Objects | Hero Gear */}
          <div className="grid grid-cols-3 gap-1 mb-2 bg-[#111722] p-0.5 rounded-lg border border-[#1e293b]">
            <button
              onClick={() => {
                soundEngine.playUiClick();
                setShopTab('elixirs');
              }}
              className={`py-1 text-[9px] sm:text-[10px] font-bold rounded transition-colors cursor-pointer ${
                shopTab === 'elixirs'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Elixir (1-4)
            </button>
            <button
              onClick={() => {
                soundEngine.playUiClick();
                setShopTab('deployables');
              }}
              className={`py-1 text-[9px] sm:text-[10px] font-bold rounded transition-colors cursor-pointer ${
                shopTab === 'deployables'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Objek (Z-V)
            </button>
            <button
              onClick={() => {
                soundEngine.playUiClick();
                setShopTab('gear');
              }}
              className={`py-1 text-[9px] sm:text-[10px] font-bold rounded transition-colors cursor-pointer ${
                shopTab === 'gear'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Gear Stat
            </button>
          </div>

          {shopTab === 'elixirs' && (
            <div className="space-y-1.5 max-h-56 sm:max-h-64 overflow-y-auto pr-0.5">
              {ELIXIR_IDS.map((id) => {
                const item = TACTICAL_CATALOG[id];
                const charges = snapshot.player.tacticalInventory[id] || 0;
                const isFull = charges >= item.maxCharges;
                const canAfford = snapshot.player.gold >= item.cost && !isFull;

                return (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-1.5 bg-[#151c28] border border-[#2a364f] rounded-lg px-2 py-1.5"
                  >
                    <div className="flex items-start gap-1.5 min-w-0">
                      <div
                        style={{ borderColor: item.colorCss }}
                        className="w-7 h-7 rounded-md bg-[#0b0f17] border flex items-center justify-center shrink-0 mt-0.5"
                      >
                        <TacticalItemIconSvg
                          itemId={id}
                          color={item.colorCss}
                          className="w-4 h-4"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] sm:text-[11px] font-bold text-white truncate">
                            {item.name}
                          </span>
                          <span
                            style={{ color: item.colorCss }}
                            className="text-[8px] font-mono-tabular font-bold px-1 py-0 bg-[#0b0f17] border border-[#2a364f] rounded"
                          >
                            {item.shortLabel}
                          </span>
                        </div>
                        <div className="text-[8.5px] sm:text-[9px] text-slate-300 leading-tight mt-0.5 line-clamp-1">
                          {item.summary}
                        </div>
                        <div className="text-[8.5px] text-amber-300/90 leading-tight line-clamp-1">
                          ★ Combo: {item.comboDescription}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-0.5">
                      <span className="text-[8.5px] font-mono-tabular text-slate-400">
                        {charges}/{item.maxCharges}
                      </span>
                      <button
                        onClick={() => onBuyTacticalItem(id)}
                        disabled={!canAfford}
                        className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-mono-tabular font-bold text-[9.5px] sm:text-[10.5px] rounded cursor-pointer"
                      >
                        {isFull ? 'MAX' : `${item.cost}g`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {shopTab === 'deployables' && (
            <div className="space-y-1.5 max-h-56 sm:max-h-64 overflow-y-auto pr-0.5">
              <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono-tabular text-slate-400 px-0.5">
                <span>Objek Aktif: {snapshot.player.activeDeployableCount}/3</span>
                <span>Kombo dgn Elixir!</span>
              </div>
              {DEPLOYABLE_IDS.map((id) => {
                const item = TACTICAL_CATALOG[id];
                const charges = snapshot.player.tacticalInventory[id] || 0;
                const isFull = charges >= item.maxCharges;
                const canAfford = snapshot.player.gold >= item.cost && !isFull;

                return (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-1.5 bg-[#151c28] border border-[#2a364f] rounded-lg px-2 py-1.5"
                  >
                    <div className="flex items-start gap-1.5 min-w-0">
                      <div
                        style={{ borderColor: item.colorCss }}
                        className="w-7 h-7 rounded-md bg-[#0b0f17] border flex items-center justify-center shrink-0 mt-0.5"
                      >
                        <TacticalItemIconSvg
                          itemId={id}
                          color={item.colorCss}
                          className="w-4 h-4"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] sm:text-[11px] font-bold text-white truncate">
                            {item.name}
                          </span>
                          <span
                            style={{ color: item.colorCss }}
                            className="text-[8px] font-mono-tabular font-bold px-1 py-0 bg-[#0b0f17] border border-[#2a364f] rounded"
                          >
                            [{item.hotkey}]
                          </span>
                        </div>
                        <div className="text-[8.5px] sm:text-[9px] text-slate-300 leading-tight mt-0.5 line-clamp-1">
                          {item.summary}
                        </div>
                        <div className="text-[8.5px] text-cyan-300/90 leading-tight line-clamp-1">
                          ★ Reaksi: {item.comboDescription}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-0.5">
                      <span className="text-[8.5px] font-mono-tabular text-slate-400">
                        {charges}/{item.maxCharges}
                      </span>
                      <button
                        onClick={() => onBuyTacticalItem(id)}
                        disabled={!canAfford}
                        className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-mono-tabular font-bold text-[9.5px] sm:text-[10.5px] rounded cursor-pointer"
                      >
                        {isFull ? 'MAX' : `${item.cost}g`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {shopTab === 'gear' && (
            <div className="space-y-1.5 max-h-56 sm:max-h-64 overflow-y-auto pr-0.5">
              {SHOP_ITEMS.map((item) => {
                const count = snapshot.player.inventoryCounts[item.id] || 0;
                const canAfford = snapshot.player.gold >= item.cost;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-1.5 bg-[#151c28] border border-[#2a364f] rounded-lg px-2 py-1.5"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] sm:text-[11px] font-semibold text-white truncate">
                        {item.name}{' '}
                        {count > 0 && (
                          <span className="text-amber-400 font-mono-tabular text-[9.5px]">x{count}</span>
                        )}
                      </div>
                      <div className="text-[8.5px] sm:text-[9px] text-slate-400 truncate">{item.summary}</div>
                    </div>
                    <button
                      onClick={() => onBuyShopItem(item.id)}
                      disabled={!canAfford}
                      className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-mono-tabular font-bold text-[9.5px] sm:text-[10.5px] rounded cursor-pointer shrink-0"
                    >
                      {item.cost}g
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Respawn Banner if Player is Fallen */}
      {!snapshot.player.alive && !snapshot.winner && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-30 bg-[#0b0f17]/95 border border-rose-500/60 px-5 py-2.5 rounded-xl text-center shadow-2xl">
          <div className="text-xs font-bold text-rose-400 font-mono-tabular">
            Respawning in {snapshot.player.respawnTimer}s...
          </div>
        </div>
      )}

      {/* 4. Virtual Joystick for Mobile / Touch */}
      {settings.showTouchControls && (
        <div
          ref={joyBaseRef}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            joyActiveRef.current = true;
            updateJoystick(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (!joyActiveRef.current) return;
            updateJoystick(e.clientX, e.clientY);
          }}
          onPointerUp={() => {
            joyActiveRef.current = false;
            setJoyKnob({ x: 0, y: 0 });
            onJoystickMove(0, 0);
          }}
          onPointerCancel={() => {
            joyActiveRef.current = false;
            setJoyKnob({ x: 0, y: 0 });
            onJoystickMove(0, 0);
          }}
          className={`fixed bottom-7 z-20 pointer-events-auto w-28 h-28 rounded-full bg-[#0b0f17]/88 border-2 border-[#2a364f] flex items-center justify-center touch-none cursor-pointer ${
            settings.joystickSide === 'right' ? 'right-48' : 'left-6'
          }`}
        >
          <div
            style={{
              transform: `translate3d(${joyKnob.x}px, ${joyKnob.y}px, 0)`,
            }}
            className="w-12 h-12 rounded-full bg-amber-500/90 border border-amber-200 shadow-md"
          />
        </div>
      )}

      {/* 5. Bottom-Center: Tactical Belt Bar — Hidden when player has 0 Elixir / Deployable Objects */}
      {(() => {
        const ownedElixirs = ELIXIR_IDS.filter(
          (id) => (snapshot.player.tacticalInventory[id] || 0) > 0
        );
        const ownedDeployables = DEPLOYABLE_IDS.filter(
          (id) => (snapshot.player.tacticalInventory[id] || 0) > 0
        );
        if (ownedElixirs.length === 0 && ownedDeployables.length === 0) {
          return null;
        }

        return (
          <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-1.5">
            {/* Live Aiming & Catalytic Reaction Preview Banner */}
            {activeTacticalItem && (
              <div className="pointer-events-auto flex items-center gap-2 bg-[#0b0f17]/95 border border-[#2a364f] px-3 py-1 rounded-lg shadow-xl">
                <span
                  style={{ color: activeTacticalItem.colorCss }}
                  className="text-[11px] font-bold"
                >
                  {activeTacticalItem.name}
                </span>
                {snapshot.player.aimingComboPreview ? (
                  <span className="px-2 py-0.5 text-[10px] font-mono-tabular font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/60 rounded">
                    ⚡ {snapshot.player.aimingComboPreview}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    Klik tanah / seret tombol untuk{' '}
                    {activeTacticalItem.category === 'elixir' ? 'melempar' : 'memasang'}
                  </span>
                )}
                <button
                  onClick={() => {
                    soundEngine.playUiClick();
                    setTacticalDragState({ itemId: null, dx: 0, dy: 0, wasDragged: false });
                    onCancelTacticalAim();
                  }}
                  className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-rose-950/90 hover:bg-rose-900 text-rose-200 border border-rose-500/50 rounded cursor-pointer"
                >
                  Batal [ESC]
                </button>
              </div>
            )}

            {/* Main Tactical Belt Container (Only renders owned items) */}
            <div className="pointer-events-auto flex items-center gap-2 bg-[#0b0f17]/94 border border-[#2a364f] px-2.5 py-1.5 rounded-xl shadow-2xl">
              {/* Owned Alchemical Elixirs */}
              {ownedElixirs.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {ownedElixirs.map((itemId) => {
                    const item = TACTICAL_CATALOG[itemId];
                    const charges = snapshot.player.tacticalInventory[itemId] || 0;
                    const cd = snapshot.player.tacticalCooldowns[itemId] || 0;
                    const isAiming = snapshot.player.aimingTacticalId === itemId;
                    const isDraggingThis = tacticalDragState.itemId === itemId;
                    const isReady = charges > 0 && cd <= 0 && snapshot.player.alive;

                    return (
                      <button
                        key={itemId}
                        onPointerDown={(e) => {
                          if (!snapshot.player.alive || charges <= 0 || cd > 0) return;
                          e.currentTarget.setPointerCapture(e.pointerId);
                          const wasAlreadyAiming = snapshot.player.aimingTacticalId === itemId;
                          tacticalStartPosRef.current = {
                            x: e.clientX,
                            y: e.clientY,
                            wasAlreadyAiming,
                          };
                          setTacticalDragState({ itemId, dx: 0, dy: 0, wasDragged: false });
                          onStartTacticalAim(itemId);
                        }}
                        onPointerMove={(e) => {
                          if (tacticalDragState.itemId !== itemId) return;
                          const rawDx = e.clientX - tacticalStartPosRef.current.x;
                          const rawDy = e.clientY - tacticalStartPosRef.current.y;
                          const dist = Math.hypot(rawDx, rawDy);
                          const maxRadius = 36;
                          const clamped = Math.min(dist, maxRadius);
                          const nx = dist > 0.01 ? rawDx / dist : 0;
                          const ny = dist > 0.01 ? rawDy / dist : 0;
                          const wasDragged = dist > 8 || tacticalDragState.wasDragged;

                          setTacticalDragState({
                            itemId,
                            dx: nx * clamped,
                            dy: ny * clamped,
                            wasDragged,
                          });

                          if (wasDragged) {
                            onUpdateTacticalDragAim(
                              itemId,
                              (nx * clamped) / maxRadius,
                              (ny * clamped) / maxRadius
                            );
                          }
                        }}
                        onPointerUp={() => {
                          if (tacticalDragState.itemId !== itemId) return;
                          const { wasDragged } = tacticalDragState;
                          const { wasAlreadyAiming } = tacticalStartPosRef.current;
                          setTacticalDragState({ itemId: null, dx: 0, dy: 0, wasDragged: false });

                          if (wasDragged) {
                            onFinishTacticalDragAim(itemId, true);
                          } else if (wasAlreadyAiming) {
                            onUseTacticalItem(itemId);
                          } else {
                            onFinishTacticalDragAim(itemId, false);
                          }
                        }}
                        onPointerCancel={() => {
                          setTacticalDragState({ itemId: null, dx: 0, dy: 0, wasDragged: false });
                          onCancelTacticalAim();
                        }}
                        style={{
                          borderColor: isAiming
                            ? '#facc15'
                            : isReady
                              ? item.colorCss
                              : '#2a364f',
                        }}
                        className={`relative w-11 h-11 rounded-lg bg-[#111722] border-2 flex flex-col items-center justify-center cursor-pointer touch-none transition-transform ${
                          isAiming ? 'scale-105 bg-[#192232]' : ''
                        } ${!isReady ? 'opacity-55' : ''}`}
                        title={`${item.name} (${item.shortLabel}) [${item.hotkey}] — ${item.summary}`}
                      >
                        {isDraggingThis && tacticalDragState.wasDragged && (
                          <div
                            style={{
                              transform: `translate3d(${tacticalDragState.dx}px, ${tacticalDragState.dy}px, 0)`,
                              backgroundColor: item.colorCss,
                            }}
                            className="absolute w-3.5 h-3.5 rounded-full border border-white pointer-events-none z-20"
                          />
                        )}

                        <TacticalItemIconSvg
                          itemId={itemId}
                          color={isReady ? item.colorCss : '#64748b'}
                          className="w-5 h-5 pointer-events-none"
                        />
                        <span className="text-[8px] font-mono-tabular font-bold text-slate-300 leading-none mt-0.5 pointer-events-none">
                          {item.shortLabel.split(' ')[0]}
                        </span>

                        <span className="absolute -top-1.5 -left-1 px-1 text-[8px] font-mono-tabular font-bold bg-[#0b0f17] text-slate-300 border border-[#2a364f] rounded pointer-events-none">
                          {item.hotkey}
                        </span>

                        <span className="absolute -bottom-1 -right-1 px-1 text-[9px] font-mono-tabular font-bold rounded border bg-[#0b0f17] text-amber-300 border-amber-500/50 pointer-events-none">
                          x{charges}
                        </span>

                        {cd > 0 && (
                          <span className="absolute inset-0 rounded-lg bg-black/80 flex items-center justify-center text-[10px] font-mono-tabular font-bold text-amber-300 pointer-events-none">
                            {cd}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Center Divider only if both Elixirs and Deployables are owned */}
              {ownedElixirs.length > 0 && ownedDeployables.length > 0 && (
                <div className="w-px h-8 bg-[#2a364f] mx-0.5" />
              )}

              {/* Owned Deployable Objects */}
              {ownedDeployables.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {ownedDeployables.map((itemId) => {
                    const item = TACTICAL_CATALOG[itemId];
                    const charges = snapshot.player.tacticalInventory[itemId] || 0;
                    const cd = snapshot.player.tacticalCooldowns[itemId] || 0;
                    const isAiming = snapshot.player.aimingTacticalId === itemId;
                    const isDraggingThis = tacticalDragState.itemId === itemId;
                    const isReady = charges > 0 && cd <= 0 && snapshot.player.alive;

                    return (
                      <button
                        key={itemId}
                        onPointerDown={(e) => {
                          if (!snapshot.player.alive || charges <= 0 || cd > 0) return;
                          e.currentTarget.setPointerCapture(e.pointerId);
                          const wasAlreadyAiming = snapshot.player.aimingTacticalId === itemId;
                          tacticalStartPosRef.current = {
                            x: e.clientX,
                            y: e.clientY,
                            wasAlreadyAiming,
                          };
                          setTacticalDragState({ itemId, dx: 0, dy: 0, wasDragged: false });
                          onStartTacticalAim(itemId);
                        }}
                        onPointerMove={(e) => {
                          if (tacticalDragState.itemId !== itemId) return;
                          const rawDx = e.clientX - tacticalStartPosRef.current.x;
                          const rawDy = e.clientY - tacticalStartPosRef.current.y;
                          const dist = Math.hypot(rawDx, rawDy);
                          const maxRadius = 36;
                          const clamped = Math.min(dist, maxRadius);
                          const nx = dist > 0.01 ? rawDx / dist : 0;
                          const ny = dist > 0.01 ? rawDy / dist : 0;
                          const wasDragged = dist > 8 || tacticalDragState.wasDragged;

                          setTacticalDragState({
                            itemId,
                            dx: nx * clamped,
                            dy: ny * clamped,
                            wasDragged,
                          });

                          if (wasDragged) {
                            onUpdateTacticalDragAim(
                              itemId,
                              (nx * clamped) / maxRadius,
                              (ny * clamped) / maxRadius
                            );
                          }
                        }}
                        onPointerUp={() => {
                          if (tacticalDragState.itemId !== itemId) return;
                          const { wasDragged } = tacticalDragState;
                          const { wasAlreadyAiming } = tacticalStartPosRef.current;
                          setTacticalDragState({ itemId: null, dx: 0, dy: 0, wasDragged: false });

                          if (wasDragged) {
                            onFinishTacticalDragAim(itemId, true);
                          } else if (wasAlreadyAiming) {
                            onUseTacticalItem(itemId);
                          } else {
                            onFinishTacticalDragAim(itemId, false);
                          }
                        }}
                        onPointerCancel={() => {
                          setTacticalDragState({ itemId: null, dx: 0, dy: 0, wasDragged: false });
                          onCancelTacticalAim();
                        }}
                        style={{
                          borderColor: isAiming
                            ? '#facc15'
                            : isReady
                              ? item.colorCss
                              : '#2a364f',
                        }}
                        className={`relative w-11 h-11 rounded-lg bg-[#111722] border-2 flex flex-col items-center justify-center cursor-pointer touch-none transition-transform ${
                          isAiming ? 'scale-105 bg-[#192232]' : ''
                        } ${!isReady ? 'opacity-55' : ''}`}
                        title={`${item.name} (${item.shortLabel}) [${item.hotkey}] — ${item.summary}`}
                      >
                        {isDraggingThis && tacticalDragState.wasDragged && (
                          <div
                            style={{
                              transform: `translate3d(${tacticalDragState.dx}px, ${tacticalDragState.dy}px, 0)`,
                              backgroundColor: item.colorCss,
                            }}
                            className="absolute w-3.5 h-3.5 rounded-full border border-white pointer-events-none z-20"
                          />
                        )}

                        <TacticalItemIconSvg
                          itemId={itemId}
                          color={isReady ? item.colorCss : '#64748b'}
                          className="w-5 h-5 pointer-events-none"
                        />
                        <span className="text-[8px] font-mono-tabular font-bold text-slate-300 leading-none mt-0.5 pointer-events-none">
                          {item.shortLabel.split(' ')[0]}
                        </span>

                        <span className="absolute -top-1.5 -left-1 px-1 text-[8px] font-mono-tabular font-bold bg-[#0b0f17] text-slate-300 border border-[#2a364f] rounded pointer-events-none">
                          {item.hotkey}
                        </span>

                        <span className="absolute -bottom-1 -right-1 px-1 text-[9px] font-mono-tabular font-bold rounded border bg-[#0b0f17] text-cyan-300 border-cyan-500/50 pointer-events-none">
                          x{charges}
                        </span>

                        {cd > 0 && (
                          <span className="absolute inset-0 rounded-lg bg-black/80 flex items-center justify-center text-[10px] font-mono-tabular font-bold text-amber-300 pointer-events-none">
                            {cd}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* 6. Bottom-Right Corner: Basic Attack Button surrounded by 3 Circular Skills */}
      <div className="fixed bottom-0 right-0 z-20 pointer-events-none w-56 h-56">
        {/* Cancel Skill Aim Button when a skill indicator is active */}
        {snapshot.player.aimingSkillSlot !== null && (
          <button
            onClick={() => {
              soundEngine.playUiClick();
              setSkillDragState({ slot: null, dx: 0, dy: 0, wasDragged: false });
              onCancelSkillAim();
            }}
            className="pointer-events-auto absolute right-6 bottom-44 px-3 py-1.5 rounded-full bg-rose-950/90 hover:bg-rose-900 border border-rose-500/70 text-[11px] font-bold text-rose-200 shadow-lg cursor-pointer"
          >
            Batal Arah [ESC]
          </button>
        )}

        {/* 3 Circular Skill Buttons in Radial Arc around Basic Attack (Drag to Aim 360° or Tap to Aim) */}
        {radialPositions.map(({ slot, rightPx, bottomPx }) => {
          const sk = hero.skills[slot];
          const cdRemaining = snapshot.player.skillTimers[slot];
          const notEnoughMana = snapshot.player.mana < sk.manaCost;
          const isReady = cdRemaining <= 0 && !notEnoughMana && snapshot.player.alive;
          const isAimingThis = snapshot.player.aimingSkillSlot === slot;
          const isDraggingThis = skillDragState.slot === slot;

          return (
            <button
              key={sk.id}
              onPointerEnter={() => onSetActionIndicator(slot)}
              onPointerLeave={() => {
                if (!isDraggingThis) onSetActionIndicator('none');
              }}
              onPointerDown={(e) => {
                if (!snapshot.player.alive) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                const wasAlreadyAiming = snapshot.player.aimingSkillSlot === slot;
                skillStartPosRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                  wasAlreadyAiming,
                };
                setSkillDragState({ slot, dx: 0, dy: 0, wasDragged: false });
                onStartSkillAim(slot);
              }}
              onPointerMove={(e) => {
                if (skillDragState.slot !== slot) return;
                const rawDx = e.clientX - skillStartPosRef.current.x;
                const rawDy = e.clientY - skillStartPosRef.current.y;
                const dist = Math.hypot(rawDx, rawDy);
                const maxRadius = 38;
                const clamped = Math.min(dist, maxRadius);
                const nx = dist > 0.01 ? rawDx / dist : 0;
                const ny = dist > 0.01 ? rawDy / dist : 0;
                const wasDragged = dist > 8 || skillDragState.wasDragged;

                setSkillDragState({
                  slot,
                  dx: nx * clamped,
                  dy: ny * clamped,
                  wasDragged,
                });

                if (wasDragged) {
                  onUpdateSkillDragAim(
                    slot,
                    (nx * clamped) / maxRadius,
                    (ny * clamped) / maxRadius
                  );
                }
              }}
              onPointerUp={() => {
                if (skillDragState.slot !== slot) return;
                const { wasDragged } = skillDragState;
                const { wasAlreadyAiming } = skillStartPosRef.current;
                setSkillDragState({ slot: null, dx: 0, dy: 0, wasDragged: false });

                if (wasDragged) {
                  // Dragged to aim -> release immediately casts toward aimed direction!
                  onFinishSkillDragAim(slot, true);
                } else if (wasAlreadyAiming) {
                  // Tapped the glowing skill button a second time -> fire immediately!
                  onCastSkill(slot);
                } else {
                  // First tap -> keep 3D indicator active on the ground so player can steer & click arena!
                  onFinishSkillDragAim(slot, false);
                }
              }}
              onPointerCancel={() => {
                setSkillDragState({ slot: null, dx: 0, dy: 0, wasDragged: false });
                onCancelSkillAim();
              }}
              style={{
                right: `${rightPx}px`,
                bottom: `${bottomPx}px`,
                borderColor: isAimingThis
                  ? '#facc15'
                  : isReady
                    ? hero.accentCss
                    : '#2a364f',
              }}
              className={`pointer-events-auto absolute w-14 h-14 rounded-full bg-[#0b0f17]/95 border-2 flex flex-col items-center justify-center shadow-xl cursor-pointer touch-none ${
                !isReady ? 'opacity-60' : ''
              }`}
              title={`${sk.name} [${sk.hotkey}]`}
            >
              {/* Movable Aim Thumb-Knob when dragging on the Skill Button */}
              {isDraggingThis && skillDragState.wasDragged && (
                <div
                  style={{
                    transform: `translate3d(${skillDragState.dx}px, ${skillDragState.dy}px, 0)`,
                    backgroundColor: hero.accentCss,
                  }}
                  className="absolute w-4 h-4 rounded-full border border-white pointer-events-none z-20"
                />
              )}

              <SkillIconSvg
                iconType={sk.iconType}
                color={isReady ? hero.accentCss : '#64748b'}
                className="w-6 h-6 pointer-events-none"
              />
              {cdRemaining > 0 ? (
                <span className="absolute inset-0 rounded-full bg-black/75 flex items-center justify-center text-xs font-mono-tabular font-bold text-amber-300 pointer-events-none">
                  {cdRemaining}
                </span>
              ) : (
                <span className="absolute -top-1 -right-1 px-1 text-[9px] font-mono-tabular font-bold bg-[#151c28] text-slate-200 border border-[#2a364f] rounded pointer-events-none">
                  {sk.hotkey}
                </span>
              )}
            </button>
          );
        })}

        {/* Main Basic Attack Button in Bottom-Right Corner */}
        <button
          onPointerEnter={() => onSetActionIndicator('attack')}
          onPointerLeave={() => onSetActionIndicator('none')}
          onPointerDown={() => {
            onSetActionIndicator('attack');
            onBasicAttack();
          }}
          onPointerUp={() => onSetActionIndicator('none')}
          onPointerCancel={() => onSetActionIndicator('none')}
          disabled={!snapshot.player.alive}
          className="pointer-events-auto absolute right-5 bottom-5 w-20 h-20 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-45 text-slate-950 font-display font-bold text-xs border-3 border-amber-200 shadow-2xl flex flex-col items-center justify-center cursor-pointer touch-none"
        >
          <svg
            className="w-7 h-7 mb-0.5 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          >
            <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
            <path d="M13 19l6-6" />
            <path d="M16 16l4 4" />
          </svg>
          <span className="pointer-events-none">ATTACK</span>
        </button>
      </div>

      {/* 7. Pause OR Victory / Defeat Modal */}
      {(isPaused || snapshot.winner) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
          <div className="w-full max-w-sm bg-[#0b0f17] border border-[#2a364f] rounded-xl p-6 text-center shadow-2xl">
            <h2
              className={`font-display text-2xl font-bold mb-2 ${
                snapshot.winner === 'ally'
                  ? 'text-amber-400'
                  : snapshot.winner === 'enemy'
                    ? 'text-rose-400'
                    : 'text-white'
              }`}
            >
              {snapshot.winner === 'ally'
                ? 'VICTORY'
                : snapshot.winner === 'enemy'
                  ? 'DEFEAT'
                  : 'PAUSED'}
            </h2>

            <div className="grid grid-cols-3 gap-2 bg-[#151c28] border border-[#2a364f] rounded-lg p-3 my-4 font-mono-tabular text-xs">
              <div>
                <div className="text-slate-400">Time</div>
                <div className="font-bold text-white">{formatTime(snapshot.matchTime)}</div>
              </div>
              <div>
                <div className="text-slate-400">K / D / A</div>
                <div className="font-bold text-emerald-400">
                  {snapshot.player.kills}/{snapshot.player.deaths}/{snapshot.player.assists}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Level</div>
                <div className="font-bold text-amber-400">Lv.{snapshot.player.level}</div>
              </div>
            </div>

            <div className="space-y-2">
              {!snapshot.winner && (
                <button
                  onClick={() => {
                    soundEngine.playUiClick();
                    onTogglePause();
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Resume
                </button>
              )}
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  onRestartMatch();
                }}
                className="w-full py-2.5 bg-[#151c28] hover:bg-[#1e293b] text-slate-100 font-semibold text-xs border border-[#2a364f] rounded-lg cursor-pointer"
              >
                Restart Match
              </button>
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  onReturnToPick();
                }}
                className="w-full py-2.5 bg-[#151c28] hover:bg-[#1e293b] text-slate-200 font-semibold text-xs border border-[#2a364f] rounded-lg cursor-pointer"
              >
                Back to Pick
              </button>
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  onReturnToLobby();
                }}
                className="w-full py-2.5 bg-[#151c28] hover:bg-[#1e293b] text-slate-400 font-semibold text-xs border border-[#2a364f] rounded-lg cursor-pointer"
              >
                Back to Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
