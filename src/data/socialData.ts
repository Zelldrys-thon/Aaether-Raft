import { FriendEntry, HeroId, HeroRole, PartyMemberSlot, PlayerProfile } from '../types/game';

export const STORAGE_PROFILE_KEY = 'aether_rift_player_profile_v1';
export const STORAGE_FRIENDS_KEY = 'aether_rift_friends_v1';

export function generatePlayerId(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `AR-${digits}`;
}

export const RANDOM_NICKNAME_SUGGESTIONS: string[] = [
  'NightValkyrie',
  'RiftBreaker',
  'ShadowAether',
  'KaelenVox',
  'SylvaRanger',
  'AstralMonarch',
  'ZeroGravity',
  'VortexSlayer',
];

export const DEFAULT_FRIENDS_DIRECTORY: FriendEntry[] = [
  {
    id: 'AR-882910',
    nickname: 'ZephyrBlade',
    rankTitle: 'Mythic Glory II',
    status: 'online',
    favoriteHeroId: 'vanguard',
    isFriend: true,
  },
  {
    id: 'AR-409182',
    nickname: 'LyraStarfall',
    rankTitle: 'Mythic IV',
    status: 'online',
    favoriteHeroId: 'arcanist',
    isFriend: true,
  },
  {
    id: 'AR-715339',
    nickname: 'KaelShadow',
    rankTitle: 'Legend I',
    status: 'online',
    favoriteHeroId: 'ranger',
    isFriend: true,
  },
  {
    id: 'AR-620441',
    nickname: 'AegisTitan',
    rankTitle: 'Mythic III',
    status: 'online',
    favoriteHeroId: 'colossus',
    isFriend: true,
  },
  {
    id: 'AR-331905',
    nickname: 'NyxWhisper',
    rankTitle: 'Legend III',
    status: 'in_match',
    favoriteHeroId: 'wraith',
    isFriend: true,
  },
  {
    id: 'AR-954120',
    nickname: 'DracoVanguard',
    rankTitle: 'Mythic I',
    status: 'online',
    favoriteHeroId: 'vanguard',
    isFriend: false,
  },
  {
    id: 'AR-118742',
    nickname: 'VelvetArcane',
    rankTitle: 'Epic I',
    status: 'online',
    favoriteHeroId: 'arcanist',
    isFriend: false,
  },
  {
    id: 'AR-502874',
    nickname: 'OrionSniper',
    rankTitle: 'Legend II',
    status: 'online',
    favoriteHeroId: 'ranger',
    isFriend: false,
  },
  {
    id: 'AR-779316',
    nickname: 'RuneColossus',
    rankTitle: 'Mythic V',
    status: 'online',
    favoriteHeroId: 'colossus',
    isFriend: false,
  },
];

export const BOT_ROSTER_TEMPLATES: Array<{
  id: string;
  nickname: string;
  rankTitle: string;
  preferredRole: HeroRole;
  defaultHeroId: HeroId;
}> = [
  {
    id: 'BOT-5192',
    nickname: 'Bot Aegis',
    rankTitle: 'Bot AI',
    preferredRole: 'Tank',
    defaultHeroId: 'colossus',
  },
  {
    id: 'BOT-6481',
    nickname: 'Bot Sylphira',
    rankTitle: 'Bot AI',
    preferredRole: 'Mage',
    defaultHeroId: 'arcanist',
  },
  {
    id: 'BOT-2938',
    nickname: 'Bot Kaelen',
    rankTitle: 'Bot AI',
    preferredRole: 'Marksman',
    defaultHeroId: 'ranger',
  },
  {
    id: 'BOT-8374',
    nickname: 'Bot Ragnar',
    rankTitle: 'Bot AI',
    preferredRole: 'Support',
    defaultHeroId: 'wraith',
  },
];

const HERO_ROLE_MAP: Record<HeroId, HeroRole> = {
  vanguard: 'Fighter',
  arcanist: 'Mage',
  ranger: 'Marksman',
  wraith: 'Support',
  colossus: 'Tank',
};

export function getRoleForHero(heroId: HeroId): HeroRole {
  return HERO_ROLE_MAP[heroId] || 'Fighter';
}

/**
 * Builds the 5-slot lobby state when the player is in the Room Lobby.
 * Slot 0 = Player (Host).
 * Slots 1..4 = Invited friends, or EMPTY ('Kosong') if no friend is invited.
 */
export function buildPartySlots(
  playerProfile: PlayerProfile,
  selectedHeroId: HeroId,
  invitedFriends: FriendEntry[]
): PartyMemberSlot[] {
  const slots: PartyMemberSlot[] = [];

  // Slot 0: The logged-in Player (Host)
  slots.push({
    slotIndex: 0,
    id: playerProfile.id,
    nickname: playerProfile.nickname || 'Player',
    rankTitle: playerProfile.rankTitle,
    isPlayer: true,
    isBot: false,
    isEmpty: false,
    heroId: selectedHeroId,
    draftStatus: 'picking',
    preferredRole: getRoleForHero(selectedHeroId),
  });

  // Slots 1..4: Filled ONLY by invited friends in the lobby; otherwise left EMPTY
  for (let i = 1; i <= 4; i++) {
    const invited = invitedFriends[i - 1];

    if (invited) {
      slots.push({
        slotIndex: i,
        id: invited.id,
        nickname: invited.nickname,
        rankTitle: invited.rankTitle,
        isPlayer: false,
        isBot: false,
        isEmpty: false,
        heroId: null,
        draftStatus: 'waiting',
        preferredRole: getRoleForHero(invited.favoriteHeroId),
      });
    } else {
      slots.push({
        slotIndex: i,
        id: '',
        nickname: 'Kosong',
        rankTitle: 'Slot Tersedia',
        isPlayer: false,
        isBot: false,
        isEmpty: true,
        heroId: null,
        draftStatus: 'waiting',
        preferredRole: BOT_ROSTER_TEMPLATES[i - 1].preferredRole,
      });
    }
  }

  return slots;
}

/**
 * Called when PLAY GAMES matchmaking finishes.
 * Any empty slots not filled by matched online players are filled by Bots.
 */
export function fillEmptySlotsForMatch(
  currentSlots: PartyMemberSlot[],
  matchedOnlinePlayers: Array<{ id: string; nickname: string; rankTitle: string; preferredRole?: HeroRole }> = []
): PartyMemberSlot[] {
  let onlineIdx = 0;

  return currentSlots.map((slot, idx) => {
    if (idx === 0 || !slot.isEmpty) {
      return slot;
    }

    const matchedHuman = matchedOnlinePlayers[onlineIdx];
    if (matchedHuman) {
      onlineIdx++;
      return {
        slotIndex: idx,
        id: matchedHuman.id,
        nickname: matchedHuman.nickname,
        rankTitle: matchedHuman.rankTitle || 'Mythic IV',
        isPlayer: false,
        isBot: false,
        isEmpty: false,
        heroId: null,
        draftStatus: 'picking',
        preferredRole: matchedHuman.preferredRole || BOT_ROSTER_TEMPLATES[(idx - 1) % 4].preferredRole,
      };
    }

    const botTemplate = BOT_ROSTER_TEMPLATES[(idx - 1) % BOT_ROSTER_TEMPLATES.length];
    return {
      slotIndex: idx,
      id: botTemplate.id,
      nickname: botTemplate.nickname,
      rankTitle: botTemplate.rankTitle,
      isPlayer: false,
      isBot: true,
      isEmpty: false,
      heroId: null,
      draftStatus: 'picking',
      preferredRole: botTemplate.preferredRole,
    };
  });
}
