/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import {
  FriendEntry,
  GameModeId,
  GameScreen,
  GameSettings,
  HeroId,
  MatchSnapshot,
  PartyMemberSlot,
  PickStep,
  PlayerProfile,
  SkillSlotIndex,
} from './types/game';
import {
  buildPartySlots,
  DEFAULT_FRIENDS_DIRECTORY,
  generatePlayerId,
  STORAGE_FRIENDS_KEY,
  STORAGE_PROFILE_KEY,
} from './data/socialData';
import { MobaGameEngine } from './rendering/gameEngine';
import { LobbyOverlay } from './ui/LobbyOverlay';
import { HeroSelectOverlay } from './ui/HeroSelectOverlay';
import { MatchHudOverlay } from './ui/MatchHudOverlay';
import { SettingsModal } from './ui/SettingsModal';
import { IntroSplashScreen } from './ui/IntroSplashScreen';
import { useSilentAutoUpdater } from './utils/useSilentAutoUpdater';

const INITIAL_SNAPSHOT: MatchSnapshot = {
  matchTime: 0,
  allyKills: 0,
  enemyKills: 0,
  waveCount: 0,
  nextWaveIn: 2,
  player: {
    heroId: 'vanguard',
    name: 'Vanguard',
    level: 1,
    xp: 0,
    maxXp: 100,
    gold: 500,
    kills: 0,
    deaths: 0,
    assists: 0,
    hp: 1200,
    maxHp: 1200,
    mana: 420,
    maxMana: 420,
    shield: 0,
    attackDamage: 82,
    moveSpeed: 7.5,
    alive: true,
    respawnTimer: 0,
    skillCooldowns: [5.5, 8.0, 13.0],
    skillTimers: [0, 0, 0],
    aimingSkillSlot: null,
    inventoryCounts: {},
    tacticalInventory: {
      pyro_damage: 0,
      cryo_block: 0,
      volt_stealth: 0,
      vitae_heal: 0,
      barricade: 0,
      snap_trap: 0,
      aether_totem: 0,
      prismatic_pylon: 0,
    },
    tacticalCooldowns: {
      pyro_damage: 0,
      cryo_block: 0,
      volt_stealth: 0,
      vitae_heal: 0,
      barricade: 0,
      snap_trap: 0,
      aether_totem: 0,
      prismatic_pylon: 0,
    },
    aimingTacticalId: null,
    aimingComboPreview: null,
    activeDeployableCount: 0,
    stealthed: false,
  },
  winner: null,
  cameraX: -81,
  cameraZ: 81,
  cameraZoom: 1.0,
  healthBars: [],
  damageTexts: [],
  minimapBlips: [],
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<MobaGameEngine | null>(null);

  // Strictly 3 main pages: 'lobby' | 'pick' | 'games'
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [screen, setScreen] = useState<GameScreen>('lobby');

  // Silent background auto-updater: checks for updates every 1 minute without any UI prompts
  useSilentAutoUpdater(screen);
  const [pickStep, setPickStep] = useState<PickStep>('mode');
  const [selectedMode, setSelectedMode] = useState<GameModeId>('rank');

  const [selectedHeroId, setSelectedHeroId] = useState<HeroId>(() => {
    const saved = localStorage.getItem('aether_rift_hero') as HeroId | null;
    return saved && ['vanguard', 'arcanist', 'ranger', 'wraith', 'colossus'].includes(saved)
      ? saved
      : 'vanguard';
  });

  // Player Profile & First-Login Auto ID Generator
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(() => {
    return !localStorage.getItem(STORAGE_PROFILE_KEY);
  });

  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PlayerProfile;
        if (parsed && parsed.id && parsed.nickname) {
          return parsed;
        }
      }
    } catch {
      // ignore parse errors
    }
    return {
      id: generatePlayerId(),
      nickname: '',
      rankTitle: 'Mythic IV',
      avatarHeroId: 'vanguard',
    };
  });

  // Friendlist & Global Player Search Directory
  const [friends, setFriends] = useState<FriendEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_FRIENDS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FriendEntry[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore parse errors
    }
    return DEFAULT_FRIENDS_DIRECTORY;
  });

  // Invited friends in the 5-player lobby (max 4 invited + 1 player = 5 players)
  const [invitedFriends, setInvitedFriends] = useState<FriendEntry[]>([]);

  // 5-Player Party Slots (Slot 0 = Player, Slots 1..4 = Invited Friends or Auto Bots)
  const [partySlots, setPartySlots] = useState<PartyMemberSlot[]>(() =>
    buildPartySlots(profile, selectedHeroId, [])
  );

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [settings, setSettings] = useState<GameSettings>(() => {
    const isTouchDevice =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 820);
    return {
      controlScheme: 'right_click',
      cameraLocked: true,
      cameraSpeed: 1.0,
      showTouchControls: isTouchDevice,
      joystickSide: 'left',
      audioMuted: false,
      graphicsQuality: 'medium',
    };
  });

  const [snapshot, setSnapshot] = useState<MatchSnapshot>(INITIAL_SNAPSHOT);

  useEffect(() => {
    if (!canvasMountRef.current) return;
    const engine = new MobaGameEngine(canvasMountRef.current, settings, (nextSnap) => {
      setSnapshot(nextSnap);
    });
    engine.selectHero(selectedHeroId);
    engine.setMatchRoster(partySlots, profile.nickname || 'Player');
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleSaveProfile = (updatedProfile: PlayerProfile) => {
    const nextProfile: PlayerProfile = {
      ...updatedProfile,
      avatarHeroId: selectedHeroId,
    };
    setProfile(nextProfile);
    setIsFirstLogin(false);
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(nextProfile));
    const nextSlots = buildPartySlots(nextProfile, selectedHeroId, invitedFriends);
    setPartySlots(nextSlots);
    engineRef.current?.setMatchRoster(nextSlots, nextProfile.nickname);
  };

  const handleAddFriend = (entry: FriendEntry) => {
    setFriends((prev) => {
      const exists = prev.some((f) => f.id.toLowerCase() === entry.id.toLowerCase());
      const next = exists
        ? prev.map((f) =>
            f.id.toLowerCase() === entry.id.toLowerCase() ? { ...f, isFriend: true } : f
          )
        : [{ ...entry, isFriend: true }, ...prev];
      localStorage.setItem(STORAGE_FRIENDS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleInviteFriend = (friend: FriendEntry) => {
    if (invitedFriends.some((f) => f.id === friend.id) || invitedFriends.length >= 4) {
      return;
    }
    const nextInvited = [...invitedFriends, friend];
    setInvitedFriends(nextInvited);
    const nextSlots = buildPartySlots(profile, selectedHeroId, nextInvited);
    setPartySlots(nextSlots);
    engineRef.current?.setMatchRoster(nextSlots, profile.nickname);
  };

  const handleRemoveInvitedFriend = (friendId: string) => {
    const nextInvited = invitedFriends.filter((f) => f.id !== friendId);
    setInvitedFriends(nextInvited);
    const nextSlots = buildPartySlots(profile, selectedHeroId, nextInvited);
    setPartySlots(nextSlots);
    engineRef.current?.setMatchRoster(nextSlots, profile.nickname);
  };

  const handleUpdateSettings = (updated: GameSettings) => {
    setSettings(updated);
    engineRef.current?.updateSettings(updated);
  };

  const handleSelectHero = (heroId: HeroId) => {
    setSelectedHeroId(heroId);
    localStorage.setItem('aether_rift_hero', heroId);
    engineRef.current?.selectHero(heroId);
  };

  const handleNavigateScreen = (nextScreen: GameScreen) => {
    setIsPaused(false);
    if (nextScreen === 'pick') {
      // Always start Page 2 on Mode Selection & 5-Player Lobby
      setPickStep('mode');
      const rebuilt = buildPartySlots(profile, selectedHeroId, invitedFriends);
      setPartySlots(rebuilt);
      engineRef.current?.setMatchRoster(rebuilt, profile.nickname);
    } else if (nextScreen === 'games') {
      engineRef.current?.setMatchRoster(partySlots, profile.nickname || 'Player');
    }
    setScreen(nextScreen);
    engineRef.current?.setScreen(nextScreen);
  };

  const handlePreviewSkill = (slot: SkillSlotIndex) => {
    engineRef.current?.triggerPreviewSkill(slot);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0b0f17]">
      {/* Isolated WebGL Canvas Container */}
      <div ref={canvasMountRef} className="fixed inset-0 w-full h-full z-0" />

      {/* PAGE 1: LOBBY (With Auto ID Generator + Nickname Creation & Friendlist) */}
      {screen === 'lobby' && (
        <LobbyOverlay
          profile={profile}
          isFirstLogin={isFirstLogin}
          friends={friends}
          onSaveProfile={handleSaveProfile}
          onAddFriend={handleAddFriend}
          onGoToPick={() => handleNavigateScreen('pick')}
        />
      )}

      {/* PAGE 2: PICK (Step 1: Mode Selection & 5-Player Party Lobby -> Step 2: Team Draft Pick) */}
      {screen === 'pick' && (
        <HeroSelectOverlay
          profile={profile}
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
          pickStep={pickStep}
          onChangePickStep={(nextStep) => {
            if (nextStep === 'room' || nextStep === 'mode') {
              const lobbySlots = buildPartySlots(profile, selectedHeroId, invitedFriends);
              setPartySlots(lobbySlots);
              engineRef.current?.setMatchRoster(lobbySlots, profile.nickname);
            }
            setPickStep(nextStep);
          }}
          friends={friends}
          invitedFriends={invitedFriends}
          onInviteFriend={handleInviteFriend}
          onRemoveInvitedFriend={handleRemoveInvitedFriend}
          onAddFriend={handleAddFriend}
          partySlots={partySlots}
          onUpdatePartySlots={(slots) => {
            setPartySlots(slots);
            engineRef.current?.setMatchRoster(slots, profile.nickname);
          }}
          selectedHeroId={selectedHeroId}
          onSelectHero={handleSelectHero}
          onPreviewSkill={handlePreviewSkill}
          onConfirmPlay={() => handleNavigateScreen('games')}
          onBackToLobby={() => handleNavigateScreen('lobby')}
        />
      )}

      {/* PAGE 3: GAMES */}
      {screen === 'games' && (
        <MatchHudOverlay
          snapshot={snapshot}
          settings={settings}
          isPaused={isPaused}
          onUpdateSettings={handleUpdateSettings}
          onTogglePause={() => {
            const next = !isPaused;
            setIsPaused(next);
            engineRef.current?.setPaused(next);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onBasicAttack={() => engineRef.current?.triggerPlayerBasicAttack()}
          onCastSkill={(slot) => engineRef.current?.triggerPlayerSkill(slot)}
          onStartSkillAim={(slot) => engineRef.current?.startSkillAim(slot)}
          onUpdateSkillDragAim={(slot, nx, nz) =>
            engineRef.current?.updateSkillDragAim(slot, nx, nz)
          }
          onFinishSkillDragAim={(slot, wasDragged) =>
            engineRef.current?.finishSkillDragAim(slot, wasDragged)
          }
          onCancelSkillAim={() => engineRef.current?.cancelSkillAim()}
          onSetActionIndicator={(mode) => engineRef.current?.setActionIndicator(mode)}
          onBuyShopItem={(itemId) => engineRef.current?.buyShopItem(itemId)}
          onBuyTacticalItem={(itemId) => engineRef.current?.buyTacticalItem(itemId)}
          onStartTacticalAim={(itemId) => engineRef.current?.startTacticalAim(itemId)}
          onUpdateTacticalDragAim={(itemId, nx, nz) =>
            engineRef.current?.updateTacticalDragAim(itemId, nx, nz)
          }
          onFinishTacticalDragAim={(itemId, wasDragged) =>
            engineRef.current?.finishTacticalDragAim(itemId, wasDragged)
          }
          onCancelTacticalAim={() => engineRef.current?.cancelTacticalAim()}
          onUseTacticalItem={(itemId) => engineRef.current?.useTacticalItem(itemId)}
          onCenterCamera={() => engineRef.current?.centerCameraOnPlayer()}
          onPanCamera={(wx, wz) => engineRef.current?.setCameraFocus(wx, wz)}
          onZoomCamera={(delta) => engineRef.current?.zoomCameraBy(delta)}
          onResetCameraZoom={() => engineRef.current?.resetCameraZoom()}
          onJoystickMove={(dx, dy) => engineRef.current?.setVirtualJoystick(dx, dy)}
          onRestartMatch={() => {
            setIsPaused(false);
            engineRef.current?.startNewMatch();
          }}
          onReturnToPick={() => handleNavigateScreen('pick')}
          onReturnToLobby={() => handleNavigateScreen('lobby')}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onChange={handleUpdateSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Intro Masuk Aplikasi by Zell Studio */}
      {showIntro && (
        <IntroSplashScreen onFinish={() => setShowIntro(false)} />
      )}
    </div>
  );
}
