import React, { useEffect, useRef, useState } from 'react';
import {
  FriendEntry,
  GameModeId,
  HeroId,
  HeroRole,
  PartyMemberSlot,
  PickStep,
  PlayerProfile,
  SkillSlotIndex,
} from '../types/game';
import { HERO_DEFINITIONS } from '../heroes/heroDefinitions';
import { fillEmptySlotsForMatch, getRoleForHero } from '../data/socialData';
import { HeroFacePortrait, SkillIconSvg } from './HeroAvatarSvg';
import { soundEngine } from '../audio/soundEngine';

interface HeroSelectOverlayProps {
  profile: PlayerProfile;
  selectedMode: GameModeId;
  onSelectMode: (mode: GameModeId) => void;
  pickStep: PickStep;
  onChangePickStep: (step: PickStep) => void;
  friends: FriendEntry[];
  invitedFriends: FriendEntry[];
  onInviteFriend: (friend: FriendEntry) => void;
  onRemoveInvitedFriend: (friendId: string) => void;
  onAddFriend: (friend: FriendEntry) => void;
  partySlots: PartyMemberSlot[];
  onUpdatePartySlots: (slots: PartyMemberSlot[]) => void;
  selectedHeroId: HeroId;
  onSelectHero: (id: HeroId) => void;
  onPreviewSkill: (slot: SkillSlotIndex) => void;
  onConfirmPlay: () => void;
  onBackToLobby: () => void;
}

interface ModeCardInfo {
  id: GameModeId;
  title: string;
  subtitle: string;
  badge: string;
  accentBorder: string;
  accentText: string;
  accentBg: string;
  glowColor: string;
}

const MODE_CARDS: ModeCardInfo[] = [
  {
    id: 'rank',
    title: 'RANKED',
    subtitle: 'Mythic Conquest',
    badge: '5V5 RANK',
    accentBorder: 'border-amber-400',
    accentText: 'text-amber-400',
    accentBg: 'from-amber-500/35 via-[#171f2e] to-[#0b0f17]',
    glowColor: 'rgba(245, 158, 11, 0.35)',
  },
  {
    id: 'classic',
    title: 'CLASSIC',
    subtitle: 'Aether Arena',
    badge: '5V5 CLASSIC',
    accentBorder: 'border-sky-400',
    accentText: 'text-sky-400',
    accentBg: 'from-sky-500/35 via-[#171f2e] to-[#0b0f17]',
    glowColor: 'rgba(56, 189, 248, 0.35)',
  },
  {
    id: 'custom',
    title: 'CUSTOM',
    subtitle: 'Tactical Room',
    badge: '5V5 CUSTOM',
    accentBorder: 'border-emerald-400',
    accentText: 'text-emerald-400',
    accentBg: 'from-emerald-500/35 via-[#171f2e] to-[#0b0f17]',
    glowColor: 'rgba(16, 185, 129, 0.35)',
  },
];

// Emblem SVG for Mode Card
const ModeEmblemSvg: React.FC<{ mode: GameModeId; isCenter: boolean }> = ({ mode, isCenter }) => {
  if (mode === 'rank') {
    return (
      <svg className="w-8 h-8 sm:w-14 sm:h-14 md:w-20 md:h-20 mx-auto" viewBox="0 0 96 96" fill="none">
        <polygon
          points="48,8 84,28 72,76 48,88 24,76 12,28"
          fill="#1e1b18"
          stroke={isCenter ? '#fbbf24' : '#78350f'}
          strokeWidth="3"
        />
        <polygon
          points="48,18 70,34 62,68 48,76 34,68 26,34"
          fill="#f59e0b"
          fillOpacity={isCenter ? '0.28' : '0.1'}
          stroke="#fcd34d"
          strokeWidth="2"
        />
        <polygon points="48,26 56,44 74,46 60,58 64,74 48,65 32,74 36,58 22,46 40,44" fill="#fbbf24" />
      </svg>
    );
  }
  if (mode === 'classic') {
    return (
      <svg className="w-8 h-8 sm:w-14 sm:h-14 md:w-20 md:h-20 mx-auto" viewBox="0 0 96 96" fill="none">
        <circle
          cx="48"
          cy="48"
          r="36"
          fill="#0f172a"
          stroke={isCenter ? '#38bdf8' : '#1e3a8a'}
          strokeWidth="3"
        />
        <polygon
          points="48,16 68,48 48,80 28,48"
          fill="#0284c7"
          fillOpacity={isCenter ? '0.35' : '0.12'}
          stroke="#7dd3fc"
          strokeWidth="2"
        />
        <circle cx="48" cy="48" r="10" fill="#38bdf8" />
      </svg>
    );
  }
  return (
    <svg className="w-8 h-8 sm:w-14 sm:h-14 md:w-20 md:h-20 mx-auto" viewBox="0 0 96 96" fill="none">
      <rect
        x="16"
        y="16"
        width="64"
        height="64"
        rx="14"
        fill="#0f221b"
        stroke={isCenter ? '#34d399' : '#064e3b'}
        strokeWidth="3"
      />
      <polygon
        points="48,24 72,48 48,72 24,48"
        fill="#10b981"
        fillOpacity={isCenter ? '0.3' : '0.12'}
        stroke="#6ee7b7"
        strokeWidth="2"
      />
      <rect x="41" y="41" width="14" height="14" rotate="45" fill="#34d399" />
    </svg>
  );
};

interface HeroTableEntry {
  cellId: string;
  heroId: HeroId;
  displayName: string;
  role: HeroRole;
  dummyCode: string;
  dummyBg: string;
  dummyAccent: string;
}

// Right-side Hero Pick Table entries with dummy hero images
const HERO_PICK_TABLE_ENTRIES: HeroTableEntry[] = [
  {
    cellId: 'hero-cell-1',
    heroId: 'vanguard',
    displayName: 'Vanguard',
    role: 'Fighter',
    dummyCode: 'HERO-01',
    dummyBg: '#2b1318',
    dummyAccent: '#ef4444',
  },
  {
    cellId: 'hero-cell-2',
    heroId: 'arcanist',
    displayName: 'Arcanist',
    role: 'Mage',
    dummyCode: 'HERO-02',
    dummyBg: '#221330',
    dummyAccent: '#a855f7',
  },
  {
    cellId: 'hero-cell-3',
    heroId: 'ranger',
    displayName: 'Sylvan Ranger',
    role: 'Marksman',
    dummyCode: 'HERO-03',
    dummyBg: '#0f2920',
    dummyAccent: '#10b981',
  },
  {
    cellId: 'hero-cell-4',
    heroId: 'wraith',
    displayName: 'Void Wraith',
    role: 'Support',
    dummyCode: 'HERO-04',
    dummyBg: '#161830',
    dummyAccent: '#6366f1',
  },
  {
    cellId: 'hero-cell-5',
    heroId: 'colossus',
    displayName: 'Colossus',
    role: 'Tank',
    dummyCode: 'HERO-05',
    dummyBg: '#102233',
    dummyAccent: '#38bdf8',
  },
  {
    cellId: 'hero-cell-6',
    heroId: 'vanguard',
    displayName: 'Kael Berserker',
    role: 'Fighter',
    dummyCode: 'DUMMY-06',
    dummyBg: '#2c1912',
    dummyAccent: '#f97316',
  },
  {
    cellId: 'hero-cell-7',
    heroId: 'arcanist',
    displayName: 'Lyra Astral',
    role: 'Mage',
    dummyCode: 'DUMMY-07',
    dummyBg: '#28122b',
    dummyAccent: '#ec4899',
  },
  {
    cellId: 'hero-cell-8',
    heroId: 'ranger',
    displayName: 'Orion Marksman',
    role: 'Marksman',
    dummyCode: 'DUMMY-08',
    dummyBg: '#182914',
    dummyAccent: '#84cc16',
  },
  {
    cellId: 'hero-cell-9',
    heroId: 'colossus',
    displayName: 'Aegis Guardian',
    role: 'Tank',
    dummyCode: 'DUMMY-09',
    dummyBg: '#13252c',
    dummyAccent: '#06b6d4',
  },
];

// Dummy Hero Image SVG component for the right-side hero pick table
const DummyHeroTableImage: React.FC<{
  entry: HeroTableEntry;
  className?: string;
}> = ({ entry, className = 'w-full h-14' }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 120 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="120" height="76" rx="6" fill={entry.dummyBg} />
      <line x1="0" y1="25" x2="120" y2="25" stroke="#ffffff" strokeOpacity="0.06" />
      <line x1="0" y1="50" x2="120" y2="50" stroke="#ffffff" strokeOpacity="0.06" />
      <line x1="40" y1="0" x2="40" y2="76" stroke="#ffffff" strokeOpacity="0.06" />
      <line x1="80" y1="0" x2="80" y2="76" stroke="#ffffff" strokeOpacity="0.06" />
      <line x1="8" y1="8" x2="112" y2="68" stroke={entry.dummyAccent} strokeOpacity="0.18" />
      <line x1="112" y1="8" x2="8" y2="68" stroke={entry.dummyAccent} strokeOpacity="0.18" />
      <circle
        cx="60"
        cy="27"
        r="12"
        fill="#0b0f17"
        stroke={entry.dummyAccent}
        strokeWidth="2"
      />
      <path
        d="M36 66C36 51 46 43 60 43C74 43 84 51 84 66"
        fill="#0b0f17"
        stroke={entry.dummyAccent}
        strokeWidth="2"
      />
      <rect x="6" y="6" width="44" height="13" rx="3" fill="#0b0f17" fillOpacity="0.82" />
      <text
        x="28"
        y="15"
        textAnchor="middle"
        fill="#cbd5e1"
        fontSize="7.5"
        fontFamily="JetBrains Mono, monospace"
        fontWeight="700"
      >
        {entry.dummyCode}
      </text>
    </svg>
  );
};

export const HeroSelectOverlay: React.FC<HeroSelectOverlayProps> = ({
  profile,
  selectedMode,
  onSelectMode,
  pickStep,
  onChangePickStep,
  friends,
  invitedFriends,
  onInviteFriend,
  onRemoveInvitedFriend,
  onAddFriend,
  partySlots,
  onUpdatePartySlots,
  selectedHeroId,
  onSelectHero,
  onPreviewSkill,
  onConfirmPlay,
  onBackToLobby,
}) => {
  const [activeSkillSlot, setActiveSkillSlot] = useState<SkillSlotIndex | null>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playerLocked, setPlayerLocked] = useState<boolean>(false);
  const [draftCountdown, setDraftCountdown] = useState<number>(35);
  const [selectedTableCellId, setSelectedTableCellId] = useState<string>('hero-cell-1');

  // Unlimited Carousel State for Mode Selection
  const [carouselIndex, setCarouselIndex] = useState<number>(() => {
    const idx = MODE_CARDS.findIndex((m) => m.id === selectedMode);
    return idx >= 0 ? idx : 0;
  });
  const [dragDeltaX, setDragDeltaX] = useState<number>(0);
  const dragStartRef = useRef<number | null>(null);
  const wheelLockRef = useRef<number>(0);

  // Viewport tracking for reactive responsive sizing across mobile & desktop
  const [viewport, setViewport] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 1024,
    h: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const onResize = () => {
      setViewport({
        w: window.innerWidth,
        h: window.innerHeight,
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobile = viewport.w < 768 || viewport.h < 560;
  const isCompactMobile = viewport.w < 480 || viewport.h < 420;

  // Server Matchmaking State inside Room Lobby when clicking PLAY GAMES
  const [isSearchingMatch, setIsSearchingMatch] = useState<boolean>(false);
  const [searchSeconds, setSearchSeconds] = useState<number>(0);
  const [matchmakingStatusText, setMatchmakingStatusText] = useState<string>(
    'Mencari pemain lain yang sedang online di server...'
  );

  const hero = HERO_DEFINITIONS[selectedHeroId];
  const activeSkill = activeSkillSlot !== null ? hero.skills[activeSkillSlot] : null;

  // Keep refs updated so natural 0-5s timers always access latest slots & selected hero
  const latestSlotsRef = useRef<PartyMemberSlot[]>(partySlots);
  latestSlotsRef.current = partySlots;
  const latestHeroRef = useRef<HeroId>(selectedHeroId);
  latestHeroRef.current = selectedHeroId;

  // Sync selectedMode whenever unlimited carouselIndex changes
  const shiftCarouselBy = (delta: number) => {
    soundEngine.playUiClick();
    setCarouselIndex((prev) => {
      const next = prev + delta;
      const wrappedIdx = ((next % MODE_CARDS.length) + MODE_CARDS.length) % MODE_CARDS.length;
      onSelectMode(MODE_CARDS[wrappedIdx].id);
      return next;
    });
  };

  // Handle pointer drag for unlimited mode carousel
  const handleCarouselPointerDown = (e: React.PointerEvent) => {
    dragStartRef.current = e.clientX;
    setDragDeltaX(0);
  };

  const handleCarouselPointerMove = (e: React.PointerEvent) => {
    if (dragStartRef.current === null) return;
    const dx = e.clientX - dragStartRef.current;
    setDragDeltaX(dx);
  };

  const handleCarouselPointerUp = () => {
    if (dragStartRef.current === null) return;
    if (dragDeltaX <= -45) {
      shiftCarouselBy(1);
    } else if (dragDeltaX >= 45) {
      shiftCarouselBy(-1);
    }
    dragStartRef.current = null;
    setDragDeltaX(0);
  };

  const handleCarouselWheel = (e: React.WheelEvent) => {
    const now = performance.now();
    if (now - wheelLockRef.current < 260) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 12) {
      wheelLockRef.current = now;
      shiftCarouselBy(delta > 0 ? 1 : -1);
    }
  };

  // Matchmaking effect when player clicks PLAY GAMES in the Room Lobby
  useEffect(() => {
    if (!isSearchingMatch) {
      setSearchSeconds(0);
      return;
    }

    setMatchmakingStatusText('Mencari pemain lain yang sedang online di server...');

    // Listen for any other real tab/player via BroadcastChannel
    const foundOnlinePlayers: Array<{ id: string; nickname: string; rankTitle: string }> = [];
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('aether_rift_matchmaking_v1');
      bc.postMessage({
        type: 'SEARCHING',
        mode: selectedMode,
        player: {
          id: profile.id,
          nickname: profile.nickname,
          rankTitle: profile.rankTitle,
        },
      });
      bc.onmessage = (ev) => {
        if (ev.data?.type === 'SEARCHING' && ev.data?.player?.id !== profile.id) {
          const p = ev.data.player;
          if (!foundOnlinePlayers.some((x) => x.id === p.id)) {
            foundOnlinePlayers.push(p);
          }
        }
      };
    } catch {
      // ignore if BroadcastChannel unavailable
    }

    const secInterval = window.setInterval(() => {
      setSearchSeconds((prev) => prev + 1);
    }, 1000);

    // At 1.5s, update status if no other human players found
    const statusTimer = window.setTimeout(() => {
      if (foundOnlinePlayers.length === 0) {
        setMatchmakingStatusText(
          'Tidak ada pemain lain ditemukan • Menyiapkan pertandingan lawan Bot...'
        );
      } else {
        setMatchmakingStatusText(`Ditemukan ${foundOnlinePlayers.length} pemain online!`);
      }
    }, 1500);

    // At 2.5s, fill remaining empty slots (with matched players or Bots) and enter Draft Pick
    const finishTimer = window.setTimeout(() => {
      soundEngine.playUiClick();
      const filledSlots = fillEmptySlotsForMatch(latestSlotsRef.current, foundOnlinePlayers);
      onUpdatePartySlots(filledSlots);
      setIsSearchingMatch(false);
      onChangePickStep('draft');
    }, 2500);

    return () => {
      window.clearInterval(secInterval);
      window.clearTimeout(statusTimer);
      window.clearTimeout(finishTimer);
      if (bc) bc.close();
    };
  }, [isSearchingMatch]);

  // Natural Teammate Pick Timing (0 to 5 seconds random thinking per teammate) when in 'draft'
  useEffect(() => {
    if (pickStep !== 'draft') {
      setPlayerLocked(false);
      setDraftCountdown(35);
      return;
    }

    const allHeroes: HeroId[] = ['vanguard', 'arcanist', 'ranger', 'wraith', 'colossus'];
    const otherHeroes = allHeroes.filter((h) => h !== selectedHeroId);

    // Ensure any empty slots are filled before starting draft pick
    const readySlots = fillEmptySlotsForMatch(latestSlotsRef.current);

    // At start of Draft Pick: Player is 'picking', teammates 1..4 are thinking ('picking')
    const initialSlots: PartyMemberSlot[] = readySlots.map((slot, idx) => {
      if (idx === 0) {
        return {
          ...slot,
          heroId: selectedHeroId,
          draftStatus: 'picking',
          preferredRole: getRoleForHero(selectedHeroId),
        };
      }
      return {
        ...slot,
        heroId: null,
        draftStatus: 'picking',
        preferredRole: getRoleForHero(otherHeroes[(idx - 1) % otherHeroes.length]),
      };
    });
    onUpdatePartySlots(initialSlots);

    const timers: number[] = [];

    // Each teammate (slots 1..4) thinks naturally for 0 to 5 seconds (0..5000 ms) before locking hero
    [1, 2, 3, 4].forEach((slotIdx) => {
      const thinkDurationMs = Math.floor(Math.random() * 5000); // 0 - 5000ms (0-5 seconds)

      if (thinkDurationMs > 900) {
        const hoverTimeMs = Math.max(150, Math.floor(thinkDurationMs * 0.55));
        timers.push(
          window.setTimeout(() => {
            onUpdatePartySlots(updateTeammateSlot(slotIdx, 'picking', selectedHeroId));
          }, hoverTimeMs)
        );
      }

      timers.push(
        window.setTimeout(() => {
          soundEngine.playUiClick();
          onUpdatePartySlots(updateTeammateSlot(slotIdx, 'locked', selectedHeroId));
        }, thinkDurationMs)
      );
    });

    const countdownInterval = window.setInterval(() => {
      setDraftCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearInterval(countdownInterval);
    };
  }, [pickStep]);

  // Track if arena start has already been triggered to avoid duplicate transitions
  const hasStartedArenaRef = useRef<boolean>(false);

  useEffect(() => {
    if (pickStep !== 'draft') {
      hasStartedArenaRef.current = false;
    }
  }, [pickStep]);

  // When 35s draft countdown ends, automatically enter arena without waiting
  useEffect(() => {
    if (pickStep === 'draft' && draftCountdown === 0 && !hasStartedArenaRef.current) {
      hasStartedArenaRef.current = true;
      handleFinalizeAndStartArena();
    }
  }, [pickStep, draftCountdown]);

  const updateTeammateSlot = (
    targetSlotIdx: number,
    nextStatus: 'waiting' | 'picking' | 'locked',
    currentPlayerHero: HeroId
  ): PartyMemberSlot[] => {
    const current = latestSlotsRef.current;
    const pHero = latestHeroRef.current || currentPlayerHero;
    const allHeroes: HeroId[] = ['vanguard', 'arcanist', 'ranger', 'wraith', 'colossus'];
    const remaining = allHeroes.filter((h) => h !== pHero);

    return current.map((slot, idx) => {
      if (idx !== targetSlotIdx) return slot;
      const assignedHero = remaining[(idx - 1) % remaining.length];
      return {
        ...slot,
        heroId: assignedHero,
        draftStatus: nextStatus,
        preferredRole: getRoleForHero(assignedHero),
      };
    });
  };

  const handleSelectHeroFromTable = (entry: HeroTableEntry) => {
    setSelectedTableCellId(entry.cellId);
    onSelectHero(entry.heroId);
    setActiveSkillSlot(0);

    const allHeroes: HeroId[] = ['vanguard', 'arcanist', 'ranger', 'wraith', 'colossus'];
    const remaining = allHeroes.filter((h) => h !== entry.heroId);

    const updated = partySlots.map((slot, idx) => {
      if (idx === 0) {
        return {
          ...slot,
          heroId: entry.heroId,
          preferredRole: getRoleForHero(entry.heroId),
        };
      }
      if (slot.heroId !== null) {
        const nextTeammateHero = remaining[(idx - 1) % remaining.length];
        return {
          ...slot,
          heroId: nextTeammateHero,
          preferredRole: getRoleForHero(nextTeammateHero),
        };
      }
      return slot;
    });
    onUpdatePartySlots(updated);
  };

  const handleClickSkillCircle = (slot: SkillSlotIndex) => {
    soundEngine.playUiClick();
    onPreviewSkill(slot);
    setActiveSkillSlot((prev) => (prev === slot ? null : slot));
  };

  // Lock hero selection (without exiting to arena immediately)
  const handleLockHeroChoice = () => {
    soundEngine.playUiClick();
    setPlayerLocked(true);
    const updated = partySlots.map((slot, idx) => {
      if (idx === 0) {
        return {
          ...slot,
          heroId: selectedHeroId,
          draftStatus: 'locked' as const,
          preferredRole: getRoleForHero(selectedHeroId),
        };
      }
      return slot;
    });
    onUpdatePartySlots(updated);
  };

  // Finalize all slots and enter the match arena
  const handleFinalizeAndStartArena = () => {
    hasStartedArenaRef.current = true;
    soundEngine.playUiClick();
    setPlayerLocked(true);
    const allHeroes: HeroId[] = ['vanguard', 'arcanist', 'ranger', 'wraith', 'colossus'];
    const currentHero = latestHeroRef.current || selectedHeroId;
    const remaining = allHeroes.filter((h) => h !== currentHero);

    const finalized = latestSlotsRef.current.map((slot, idx) => {
      if (idx === 0) {
        return {
          ...slot,
          heroId: currentHero,
          draftStatus: 'locked' as const,
          preferredRole: getRoleForHero(currentHero),
        };
      }
      const assigned = slot.heroId || remaining[(idx - 1) % remaining.length];
      return {
        ...slot,
        heroId: assigned,
        draftStatus: 'locked' as const,
        preferredRole: getRoleForHero(assigned),
      };
    });
    onUpdatePartySlots(finalized);
    onConfirmPlay();
  };

  // Filter Friendlist & Global Search by Nickname or ID
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const displayedFriends = friends.filter((f) => {
    if (!normalizedSearch) return f.isFriend;
    return (
      f.nickname.toLowerCase().includes(normalizedSearch) ||
      f.id.toLowerCase().includes(normalizedSearch)
    );
  });

  const dynamicSearchMatch: FriendEntry | null =
    normalizedSearch.length >= 3 && displayedFriends.length === 0
      ? {
          id: normalizedSearch.startsWith('ar-')
            ? normalizedSearch.toUpperCase()
            : `AR-${Math.abs(
                normalizedSearch.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 13)
              )
                .toString()
                .slice(0, 6)
                .padEnd(6, '8')}`,
          nickname: normalizedSearch.startsWith('ar-')
            ? `Player_${normalizedSearch.slice(-3).toUpperCase()}`
            : searchQuery.trim().slice(0, 15),
          rankTitle: 'Mythic IV',
          status: 'online',
          favoriteHeroId: 'arcanist',
          isFriend: false,
        }
      : null;

  // ==========================================================================
  // HALAMAN 2A: PILIH MODE (UNLIMITED CAROUSEL: TENGAH TERANG & BESAR, KIRI/KANAN GELAP & KECIL)
  // ==========================================================================
  if (pickStep === 'mode') {
    const relativeOffsets = [-2, -1, 0, 1, 2];
    const cardSpacing = isCompactMobile ? 96 : isMobile ? 122 : 210;

    return (
      <div
        onWheel={handleCarouselWheel}
        className="fixed inset-0 z-10 pointer-events-auto bg-[#05080d]/90 backdrop-blur-md flex flex-col justify-between p-2 sm:p-4 md:p-6 select-none overflow-hidden"
      >
        {/* Top Bar: Compact Back Button & Title */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onBackToLobby();
            }}
            className="min-h-[28px] sm:min-h-[36px] px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold text-slate-200 bg-[#0b0f17] hover:bg-[#151c28] border border-[#2a364f] rounded-lg transition-colors cursor-pointer"
          >
            ← Kembali
          </button>

          <div className="text-center">
            <h1 className="font-display text-sm sm:text-xl font-bold text-white tracking-widest leading-tight">
              PILIH MODE
            </h1>
            <span className="text-[8px] sm:text-[10px] text-slate-400 font-mono-tabular">
              Geser kartu atau tekan tombol mode
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0b0f17] border border-[#2a364f] rounded-lg px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] sm:text-xs font-bold text-white truncate max-w-[80px] sm:max-w-none">
              {profile.nickname}
            </span>
          </div>
        </div>

        {/* Center: Carousel with Left & Right Arrow Buttons */}
        <div className="relative flex-1 flex items-center justify-center w-full overflow-hidden my-1 sm:my-2">
          {/* Left Arrow Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              shiftCarouselBy(-1);
            }}
            className="absolute left-1 sm:left-4 z-40 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[#0b0f17]/90 hover:bg-[#151c28] border border-amber-400/50 hover:border-amber-400 text-amber-300 flex items-center justify-center text-xs sm:text-sm font-bold transition-all shadow-lg cursor-pointer active:scale-90"
            title="Geser Kiri"
          >
            ◀
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              shiftCarouselBy(1);
            }}
            className="absolute right-1 sm:right-4 z-40 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[#0b0f17]/90 hover:bg-[#151c28] border border-amber-400/50 hover:border-amber-400 text-amber-300 flex items-center justify-center text-xs sm:text-sm font-bold transition-all shadow-lg cursor-pointer active:scale-90"
            title="Geser Kanan"
          >
            ▶
          </button>

          {/* Carousel Track with drag gestures */}
          <div
            onPointerDown={handleCarouselPointerDown}
            onPointerMove={handleCarouselPointerMove}
            onPointerUp={handleCarouselPointerUp}
            onPointerCancel={handleCarouselPointerUp}
            className="relative w-full max-w-4xl h-[175px] sm:h-[260px] md:h-[310px] flex items-center justify-center cursor-grab active:cursor-grabbing touch-pan-y"
          >
            {relativeOffsets.map((rel) => {
              const virtualIndex = carouselIndex + rel;
              const wrappedIdx =
                ((virtualIndex % MODE_CARDS.length) + MODE_CARDS.length) % MODE_CARDS.length;
              const card = MODE_CARDS[wrappedIdx];
              const isCenter = rel === 0;
              const isSide = Math.abs(rel) === 1;

              // Calculate horizontal offset + live drag delta
              const baseTranslateX = rel * cardSpacing + dragDeltaX * 0.65;
              const scale = isCenter ? (isMobile ? 1.0 : 1.08) : isSide ? (isMobile ? 0.68 : 0.74) : 0.48;
              const opacity = isCenter ? 1 : isSide ? 0.45 : 0;
              const zIndex = isCenter ? 30 : isSide ? 20 : 10;

              return (
                <div
                  key={virtualIndex}
                  onClick={() => {
                    if (Math.abs(dragDeltaX) > 12) return;
                    if (rel === 0) {
                      soundEngine.playUiClick();
                      onChangePickStep('room');
                    } else {
                      shiftCarouselBy(rel);
                    }
                  }}
                  style={{
                    transform: `translateX(${baseTranslateX}px) scale(${scale})`,
                    opacity,
                    zIndex,
                    filter: isCenter ? 'brightness(1.15)' : 'brightness(0.35)',
                    boxShadow: isCenter ? `0 12px 36px -8px ${card.glowColor}` : 'none',
                  }}
                  className={`absolute w-[105px] xs:w-[125px] sm:w-[180px] md:w-[230px] h-[142px] xs:h-[168px] sm:h-[220px] md:h-[280px] rounded-xl sm:rounded-2xl p-2 sm:p-4 bg-gradient-to-b ${
                    card.accentBg
                  } border-2 transition-all duration-300 ease-out flex flex-col items-center justify-between text-center cursor-pointer ${
                    isCenter ? card.accentBorder : 'border-[#1e293b]'
                  }`}
                >
                  <span
                    className={`text-[7px] sm:text-[9px] font-mono-tabular font-bold px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-black/60 border border-white/10 ${card.accentText}`}
                  >
                    {card.badge}
                  </span>

                  <ModeEmblemSvg mode={card.id} isCenter={isCenter} />

                  <div>
                    <h2 className="font-display text-xs sm:text-lg md:text-2xl font-bold text-white tracking-wider">
                      {card.title}
                    </h2>
                    <div className={`text-[8px] sm:text-[10px] md:text-xs font-semibold mt-0.5 ${card.accentText}`}>
                      {card.subtitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Mode Switcher Chips & Bottom CTA */}
        <div className="flex flex-col items-center gap-1.5 sm:gap-2 shrink-0 pb-1">
          {/* Quick 1-Tap Mode Selector Chips */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            {MODE_CARDS.map((m, idx) => {
              const isCurrent = selectedMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    soundEngine.playUiClick();
                    onSelectMode(m.id);
                    setCarouselIndex((prev) => {
                      const currentWrapped =
                        ((prev % MODE_CARDS.length) + MODE_CARDS.length) % MODE_CARDS.length;
                      const diff = idx - currentWrapped;
                      return prev + diff;
                    });
                  }}
                  className={`min-h-[26px] sm:min-h-[32px] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-xs font-bold uppercase transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-400 text-slate-950 shadow-md ring-1 ring-amber-200'
                      : 'bg-[#0b0f17]/90 text-slate-400 hover:text-white border border-[#2a364f]'
                  }`}
                >
                  {m.title}
                </button>
              );
            })}
          </div>

          {/* Bottom CTA Button: Enter Room Lobby */}
          <button
            onClick={() => {
              soundEngine.playUiClick();
              onChangePickStep('room');
            }}
            className="min-w-[130px] sm:min-w-[190px] py-1.5 sm:py-2 px-4 sm:px-8 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-display font-bold text-[10px] sm:text-xs md:text-sm tracking-wider rounded-lg sm:rounded-xl border border-amber-300 shadow-xl transition-all cursor-pointer whitespace-nowrap"
          >
            MASUK LOBBY ({selectedMode.toUpperCase()}) →
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // HALAMAN 2B: DI DALAM LOBBY (KOMPAK DI KIRI/TENGAH, 4 SLOT KOSONG, FRIENDLIST DI KANAN)
  // ==========================================================================
  if (pickStep === 'room') {
    const filledCount = partySlots.filter((s) => !s.isEmpty).length;

    return (
      <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-2.5 sm:p-4 md:p-6 select-none overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 shrink-0">
          <button
            onClick={() => {
              if (isSearchingMatch) return;
              soundEngine.playUiClick();
              onChangePickStep('mode');
            }}
            className="pointer-events-auto min-h-[30px] sm:min-h-[38px] px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-slate-200 bg-[#0b0f17]/92 hover:bg-[#151c28] border border-[#2a364f] rounded-lg sm:rounded-xl transition-colors cursor-pointer"
          >
            ← Ganti Mode
          </button>

          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 bg-[#0b0f17]/92 border border-[#2a364f] rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1 sm:py-1.5 shadow-lg">
            <span className="text-[9px] sm:text-[10px] font-mono-tabular font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">
              {selectedMode.toUpperCase()}
            </span>
            <span className="font-display text-[11px] sm:text-xs md:text-sm font-bold text-white tracking-wider">
              LOBBY TIM ({filledCount}/5)
            </span>
          </div>

          <div className="hidden sm:flex pointer-events-auto items-center gap-2 bg-[#0b0f17]/92 border border-[#2a364f] rounded-xl px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold text-white">{profile.nickname}</span>
          </div>
        </div>

        {/* Main Middle Area: Compact 5-Slot Lobby on Left + Friendlist on Right (Side-by-Side both Mobile & PC) */}
        <div className="flex-1 flex flex-row items-center justify-between gap-2 sm:gap-4 my-auto w-full max-w-5xl mx-auto px-1 overflow-hidden">
          {/* Compact 5-Slot Party Box (Player in Slot 1, Slots 2..5 Empty unless friend invited) */}
          <div className="pointer-events-auto w-[58%] sm:w-[62%] md:max-w-[490px] bg-[#0b0f17]/92 border border-[#2a364f] rounded-xl sm:rounded-2xl p-2 sm:p-3.5 shadow-2xl">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2.5 pb-1 sm:pb-2 border-b border-[#2a364f]">
              <span className="font-display text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider truncate">
                Room Lobby ({filledCount}/5)
              </span>
              <span className="text-[8px] sm:text-[10px] text-slate-400 truncate ml-1">
                4 Slot Kosong
              </span>
            </div>

            {/* 5 Compact Slots */}
            <div className="grid grid-cols-5 gap-1 sm:gap-2">
              {partySlots.map((slot) => {
                if (slot.isEmpty) {
                  return (
                    <div
                      key={slot.slotIndex}
                      className="h-[74px] sm:h-[112px] rounded-lg sm:rounded-xl bg-[#111722]/70 border border-dashed border-slate-700 flex flex-col items-center justify-center p-1 sm:p-2 text-center"
                    >
                      <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[#151c28] border border-slate-700 flex items-center justify-center text-slate-500 text-xs sm:text-sm font-bold mb-0.5 sm:mb-1">
                        +
                      </div>
                      <span className="text-[8px] sm:text-[10px] font-semibold text-slate-400 leading-none">Kosong</span>
                      <span className="text-[7px] sm:text-[9px] text-slate-600 mt-0.5">#{slot.slotIndex + 1}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={slot.slotIndex}
                    className={`relative h-[74px] sm:h-[112px] rounded-lg sm:rounded-xl p-1 sm:p-2 border flex flex-col items-center justify-between text-center ${
                      slot.isPlayer
                        ? 'bg-amber-500/12 border-amber-400/80'
                        : 'bg-sky-500/12 border-sky-400/80'
                    }`}
                  >
                    {!slot.isPlayer && (
                      <button
                        onClick={() => {
                          soundEngine.playUiClick();
                          onRemoveInvitedFriend(slot.id);
                        }}
                        className="absolute top-0.5 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-rose-500/30 hover:bg-rose-500 text-rose-200 text-[8px] flex items-center justify-center cursor-pointer"
                        title="Keluarkan"
                      >
                        ✕
                      </button>
                    )}

                    <HeroFacePortrait
                      heroId={slot.heroId || 'vanguard'}
                      className="w-6 h-6 sm:w-10 sm:h-10 rounded-md sm:rounded-lg border border-amber-400/60 shrink-0 mt-0.5"
                    />

                    <div className="w-full min-w-0">
                      <div className="text-[8px] sm:text-[10px] font-bold text-white truncate">
                        {slot.nickname}
                      </div>
                      <div className="text-[7px] sm:text-[9px] text-amber-400/90 truncate hidden sm:block">{slot.rankTitle}</div>
                    </div>

                    <span
                      className={`px-1 py-0 rounded text-[7px] sm:text-[8px] font-bold uppercase leading-tight ${
                        slot.isPlayer
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-sky-400 text-slate-950'
                      }`}
                    >
                      {slot.isPlayer ? 'HOST' : 'TEMAN'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Matchmaking Status or Play Games CTA */}
            <div className="mt-2 sm:mt-3 pt-1.5 sm:pt-2.5 border-t border-[#2a364f]">
              {isSearchingMatch ? (
                <div className="flex items-center justify-between gap-1.5 sm:gap-3 bg-[#151c28] border border-amber-400/60 rounded-lg sm:rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2.5">
                  <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] sm:text-xs font-bold text-amber-300 truncate">
                        {matchmakingStatusText}
                      </div>
                      <div className="text-[8px] sm:text-[10px] font-mono-tabular text-slate-400 truncate">
                        {searchSeconds}d • Jika tidak ada pemain = Lawan Bot
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      soundEngine.playUiClick();
                      setIsSearchingMatch(false);
                    }}
                    className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] sm:text-[10px] font-semibold cursor-pointer shrink-0"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    soundEngine.playUiClick();
                    setIsSearchingMatch(true);
                  }}
                  className="w-full py-1.5 sm:py-2.5 px-2 sm:px-5 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-display font-bold text-[9px] sm:text-xs tracking-wider rounded-lg sm:rounded-xl border border-amber-300 shadow-lg transition-all cursor-pointer whitespace-nowrap"
                >
                  PLAY GAMES (CARI PEMAIN / DRAFT) →
                </button>
              )}
            </div>
          </div>

          {/* Right Side: Compact Friendlist & Search Player Panel */}
          <div className="pointer-events-auto w-[40%] sm:w-[36%] md:w-[300px] bg-[#0b0f17]/94 border border-[#2a364f] rounded-xl sm:rounded-2xl p-2 sm:p-3.5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
              <h3 className="font-display text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider">
                Friendlist
              </h3>
              <span className="text-[8px] sm:text-[10px] font-mono-tabular text-sky-400">
                Undang ({invitedFriends.length}/4)
              </span>
            </div>

            <div className="mb-1.5 sm:mb-2.5">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Nick / ID..."
                className="w-full px-2 py-1 text-[10px] sm:text-xs bg-[#151c28] border border-[#2a364f] focus:border-sky-400 rounded-md sm:rounded-lg text-white placeholder-slate-500 outline-none"
              />
            </div>

            <div className="max-h-[140px] sm:max-h-[210px] overflow-y-auto space-y-1 sm:space-y-1.5 pr-0.5 sm:pr-1">
              {displayedFriends.map((friend) => {
                const isAlreadyInLobby = invitedFriends.some((f) => f.id === friend.id);
                const lobbyFull = invitedFriends.length >= 4;

                return (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between gap-1 sm:gap-2 p-1 sm:p-2 rounded-md sm:rounded-lg bg-[#151c28] border border-[#2a364f]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <HeroFacePortrait
                        heroId={friend.favoriteHeroId}
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-md shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-[9px] sm:text-xs font-bold text-white truncate">
                          {friend.nickname}
                        </div>
                        <div className="flex items-center gap-1 text-[7px] sm:text-[9px] font-mono-tabular">
                          <span className="text-sky-400 truncate">{friend.id}</span>
                          <span className="text-slate-500">•</span>
                          <span
                            className={
                              friend.status === 'online'
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }
                          >
                            {friend.status === 'online' ? 'Online' : 'In Match'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!friend.isFriend && (
                        <button
                          onClick={() => {
                            soundEngine.playUiClick();
                            onAddFriend(friend);
                          }}
                          className="px-1 py-0.5 sm:px-1.5 sm:py-1 rounded bg-[#1e293b] hover:bg-slate-700 text-sky-300 border border-sky-500/40 text-[8px] sm:text-[9px] font-bold cursor-pointer"
                        >
                          +Teman
                        </button>
                      )}

                      {isAlreadyInLobby ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[8px] sm:text-[9px] font-bold">
                          Lobby
                        </span>
                      ) : (
                        <button
                          disabled={lobbyFull || isSearchingMatch}
                          onClick={() => {
                            soundEngine.playUiClick();
                            onInviteFriend(friend);
                          }}
                          className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[8px] sm:text-[9px] font-bold transition-colors ${
                            lobbyFull || isSearchingMatch
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer'
                          }`}
                        >
                          Undang
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {dynamicSearchMatch && (
                <div className="flex items-center justify-between gap-1 sm:gap-2 p-1 sm:p-2 rounded-md sm:rounded-lg bg-[#151c28] border border-sky-400/60">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <HeroFacePortrait
                      heroId={dynamicSearchMatch.favoriteHeroId}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-md shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[9px] sm:text-xs font-bold text-white truncate">
                        {dynamicSearchMatch.nickname}
                      </div>
                      <div className="text-[7px] sm:text-[9px] font-mono-tabular text-sky-400 truncate">
                        {dynamicSearchMatch.id}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      soundEngine.playUiClick();
                      onAddFriend(dynamicSearchMatch);
                      onInviteFriend(dynamicSearchMatch);
                      setSearchQuery('');
                    }}
                    className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 text-[8px] sm:text-[9px] font-bold cursor-pointer"
                  >
                    Undang
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-0.5" />
      </div>
    );
  }

  // ==========================================================================
  // HALAMAN 2C: DRAFT PICK (KIRI: TIM 5 PLAYER, TENGAH: 3D HERO, KANAN: TABEL GAMBAR HERO DUMMY)
  // ==========================================================================
  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-2.5 sm:p-4 md:p-6 select-none overflow-hidden">
      {/* Top Bar: Back to Room Lobby + Mode & Draft Countdown Banner */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 shrink-0">
        <button
          onClick={() => {
            soundEngine.playUiClick();
            onChangePickStep('room');
          }}
          className="pointer-events-auto min-h-[30px] sm:min-h-[42px] px-2.5 py-1 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-semibold text-slate-200 bg-[#0b0f17]/92 hover:bg-[#151c28] border border-[#2a364f] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          ← Kembali ke Lobby
        </button>

        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-3 bg-[#0b0f17]/94 border border-[#2a364f] rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1 sm:py-2 shadow-xl">
          <span className="text-[9px] sm:text-[11px] font-mono-tabular font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            {selectedMode.toUpperCase()}
          </span>
          <span className="font-display font-bold text-[10px] sm:text-xs md:text-sm text-white tracking-wider">
            DRAFT PICK
          </span>
          <span
            className={`font-mono-tabular text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded border transition-colors ${
              draftCountdown <= 5
                ? 'bg-rose-500/25 text-rose-300 border-rose-400 animate-pulse'
                : 'bg-[#151c28] text-sky-400 border-[#2a364f]'
            }`}
          >
            Mulai: {draftCountdown}s
          </span>
        </div>

        <div className="hidden md:block w-36" />
      </div>

      {/* Main Content Area: Left = 5-Player Team List + Skill Icons | Center = 3D Hero | Right = Hero Pick Table (Dummy Images) */}
      <div className="flex-1 flex flex-row items-stretch justify-between gap-1 sm:gap-3 my-1 sm:my-2 overflow-hidden">
        {/* Left Column: 5-Player Team Draft Status (Compact) + Bottom Skill Preview Buttons */}
        <div className="flex flex-col justify-between gap-1 sm:gap-2 w-[112px] xs:w-[124px] sm:w-[168px] md:w-[210px] shrink-0">
          {/* 5-Player Team Draft Pick Roster - Compact Size */}
          <div className="pointer-events-auto bg-[#0b0f17]/94 border border-[#2a364f] rounded-lg sm:rounded-xl p-1 sm:p-2 shadow-2xl">
            <div className="flex items-center justify-between mb-0.5 sm:mb-1 pb-0.5 sm:pb-1 border-b border-[#2a364f]">
              <span className="font-display font-bold text-[8px] sm:text-[10.5px] text-white uppercase tracking-wider">
                Tim Kamu (5)
              </span>
              <span className="text-[7px] sm:text-[9px] font-mono-tabular text-slate-400">
                Status
              </span>
            </div>

            <div className="space-y-0.5 sm:space-y-1">
              {partySlots.map((slot) => {
                const pickedDef = slot.heroId ? HERO_DEFINITIONS[slot.heroId] : null;
                const isPicking =
                  slot.draftStatus === 'picking' && !(slot.isPlayer && playerLocked);
                const isLocked =
                  slot.draftStatus === 'locked' || (slot.isPlayer && playerLocked);

                return (
                  <div
                    key={slot.slotIndex}
                    className={`flex items-center justify-between gap-1 p-0.5 sm:p-1.5 rounded sm:rounded-md border transition-all ${
                      slot.isPlayer
                        ? 'bg-amber-500/15 border-amber-400/80'
                        : isLocked
                          ? 'bg-[#151c28]/95 border-emerald-500/40'
                          : isPicking
                            ? 'bg-sky-500/10 border-sky-400/70'
                            : 'bg-[#151c28]/60 border-[#2a364f]'
                    }`}
                  >
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      {slot.heroId && (isPicking || isLocked || slot.isPlayer) ? (
                        <HeroFacePortrait
                          heroId={slot.heroId}
                          className="w-4 h-4 sm:w-6 sm:h-6 rounded shrink-0 border border-white/20"
                        />
                      ) : (
                        <div className="w-4 h-4 sm:w-6 sm:h-6 rounded bg-[#0b0f17] border border-dashed border-slate-600 flex items-center justify-center shrink-0">
                          <span className="text-[8px] sm:text-[10px] font-bold text-slate-500">?</span>
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <span className="text-[8px] sm:text-[10px] font-bold text-white truncate">
                            {slot.nickname}
                          </span>
                          {slot.isPlayer && (
                            <span className="text-[6px] sm:text-[8px] px-0.5 rounded bg-amber-400 text-slate-950 font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[7px] sm:text-[9px] text-slate-300 truncate leading-none">
                          {pickedDef && (isPicking || isLocked || slot.isPlayer)
                            ? `${pickedDef.name}`
                            : `Memikir...`}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isLocked ? (
                        <span className="inline-block px-1 py-0 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[7px] sm:text-[8.5px] font-bold">
                          Kunci
                        </span>
                      ) : isPicking ? (
                        <span className="inline-block px-1 py-0 rounded bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[7px] sm:text-[8.5px] font-bold animate-pulse">
                          Pilih
                        </span>
                      ) : (
                        <span className="inline-block px-1 py-0 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[7px] sm:text-[8.5px] font-semibold">
                          Wait
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom-Left: 3 Circular Skill Preview Buttons + Popover (Compact) */}
          <div className="mt-auto flex flex-col items-start gap-1">
            {activeSkill && (
              <div className="pointer-events-auto w-full bg-[#0b0f17]/95 border border-[#2a364f] rounded-lg p-1 sm:p-2 shadow-xl">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <div className="flex items-center gap-1">
                    <div
                      style={{ borderColor: hero.accentCss }}
                      className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-[#151c28] border flex items-center justify-center shrink-0"
                    >
                      <SkillIconSvg
                        iconType={activeSkill.iconType}
                        color={hero.accentCss}
                        className="w-2 h-2 sm:w-3 sm:h-3"
                      />
                    </div>
                    <span className="font-display font-bold text-[9px] sm:text-[11px] text-white truncate">
                      {activeSkill.name}
                    </span>
                  </div>
                  <span className="font-mono-tabular text-[8px] sm:text-[9.5px] text-slate-400 whitespace-nowrap">
                    {activeSkill.cooldown}s
                  </span>
                </div>
                <p className="text-[7.5px] sm:text-[9.5px] text-slate-300 leading-snug line-clamp-2">
                  {activeSkill.description}
                </p>
              </div>
            )}

            <div className="pointer-events-auto flex items-center gap-1 sm:gap-2">
              {hero.skills.map((sk) => {
                const isSelected = activeSkillSlot === sk.slot;
                return (
                  <button
                    key={sk.id}
                    onClick={() => handleClickSkillCircle(sk.slot)}
                    style={{
                      borderColor: isSelected ? hero.accentCss : '#2a364f',
                    }}
                    className={`relative w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-[#0b0f17]/95 border-1.5 flex items-center justify-center transition-transform active:scale-95 cursor-pointer ${
                      isSelected ? 'scale-105 shadow-lg' : 'hover:border-slate-400'
                    }`}
                    title={sk.name}
                  >
                    <SkillIconSvg
                      iconType={sk.iconType}
                      color={isSelected ? hero.accentCss : '#cbd5e1'}
                      className="w-3 h-3 sm:w-4 sm:h-4"
                    />
                    <span className="absolute -bottom-0.5 right-0 px-0.5 text-[6.5px] sm:text-[8px] font-mono-tabular font-bold bg-[#151c28] text-slate-300 border border-[#2a364f] rounded">
                      {sk.hotkey}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: TABEL PILIHAN HERO (DUMMY HERO IMAGES TABLE) + LOCK HERO CTA - Compact Size */}
        <div className="my-auto ml-auto w-[128px] xs:w-[140px] sm:w-[190px] md:w-[245px] pointer-events-auto shrink-0">
          <div className="bg-[#0b0f17]/95 border border-[#2a364f] rounded-lg sm:rounded-xl p-1 sm:p-2.5 shadow-2xl flex flex-col gap-1 sm:gap-2">
            {/* Selected Hero Header (Compact) */}
            <div className="flex items-center justify-between gap-1 pb-0.5 sm:pb-1.5 border-b border-[#2a364f]">
              <div className="min-w-0">
                <div className="text-[7px] sm:text-[8.5px] font-mono-tabular uppercase tracking-wider text-slate-400 truncate">
                  PILIH HERO
                </div>
                <div className="flex items-center gap-1 truncate">
                  <h2 className="font-display text-[10px] sm:text-[13px] font-bold text-white truncate">
                    {hero.name}
                  </h2>
                  <span
                    style={{ color: hero.accentCss }}
                    className="text-[8px] sm:text-[10px] font-bold tracking-wide truncate"
                  >
                    • {hero.role}
                  </span>
                </div>
              </div>
              <div className="text-right font-mono-tabular text-[7px] sm:text-[9px] text-slate-300 shrink-0">
                <div>HP {hero.stats.maxHp}</div>
                <div className="text-rose-400">ATK {hero.stats.attackDamage}</div>
              </div>
            </div>

            {/* Right-Side Hero Table (3x3 Table Grid with Dummy Images - Compact) */}
            <div className="border border-[#2a364f] rounded-md sm:rounded-lg overflow-hidden bg-[#111722]">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr className="bg-[#151c28] border-b border-[#2a364f] text-[6px] sm:text-[8px] font-mono-tabular text-slate-400 uppercase">
                    <th className="py-0.5 px-0.5 border-r border-[#2a364f] text-center">Col 1</th>
                    <th className="py-0.5 px-0.5 border-r border-[#2a364f] text-center">Col 2</th>
                    <th className="py-0.5 px-0.5 text-center">Col 3</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2].map((rowIndex) => {
                    const rowItems = HERO_PICK_TABLE_ENTRIES.slice(
                      rowIndex * 3,
                      rowIndex * 3 + 3
                    );
                    return (
                      <tr key={rowIndex} className="border-b last:border-b-0 border-[#2a364f]">
                        {rowItems.map((entry, colIndex) => {
                          const isCellSelected = selectedTableCellId === entry.cellId;
                          return (
                            <td
                              key={entry.cellId}
                              onClick={() => handleSelectHeroFromTable(entry)}
                              className={`p-0.5 sm:p-1 align-top cursor-pointer transition-colors ${
                                colIndex < 2 ? 'border-r border-[#2a364f]' : ''
                              } ${
                                isCellSelected
                                  ? 'bg-amber-500/20 ring-1 ring-inset ring-amber-400'
                                  : 'hover:bg-[#1e293b]/80'
                              }`}
                            >
                              <div className="flex flex-col items-center text-center">
                                <DummyHeroTableImage
                                  entry={entry}
                                  className="w-full h-5 sm:h-7 md:h-9 rounded border border-white/10"
                                />
                                <span className="mt-0.5 text-[7px] sm:text-[9px] font-bold text-white truncate w-full">
                                  {entry.displayName}
                                </span>
                                <span className="text-[6px] sm:text-[7.5px] font-mono-tabular text-slate-400 hidden sm:block">
                                  {entry.role}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => {
                if (!playerLocked) {
                  handleLockHeroChoice();
                } else {
                  handleFinalizeAndStartArena();
                }
              }}
              className={`w-full min-h-[26px] sm:min-h-[34px] py-1 sm:py-1.5 px-1.5 sm:px-3 font-display font-bold text-[8.5px] sm:text-[11px] tracking-wider rounded sm:rounded-lg transition-all cursor-pointer shadow-lg whitespace-nowrap ${
                playerLocked
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-300'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-300 active:scale-[0.99]'
              }`}
            >
              {playerLocked
                ? `✓ TERKUNCI • MASUK (${draftCountdown}s)`
                : `KUNCI HERO (${hero.name.toUpperCase()})`}
            </button>
            <div className="text-center text-[7.5px] sm:text-[9px] text-slate-400 font-mono-tabular">
              Masuk arena dalam <span className="text-amber-400 font-bold">{draftCountdown}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
