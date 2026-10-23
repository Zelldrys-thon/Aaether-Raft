export type GameScreen = 'lobby' | 'pick' | 'games';

export type PickStep = 'mode' | 'room' | 'draft';

export type GameModeId = 'rank' | 'classic' | 'custom';

export type ControlScheme = 'right_click' | 'wasd';

export type HeroId = 'vanguard' | 'arcanist' | 'ranger' | 'wraith' | 'colossus';

export type HeroRole = 'Fighter' | 'Mage' | 'Marksman' | 'Assassin' | 'Tank' | 'Support';

export type HeroAnimState = 'idle' | 'walk' | 'attack' | 'skill';

export type TeamId = 'ally' | 'enemy' | 'neutral';

export type LaneId = 'top' | 'mid' | 'bot';

export type EntityType = 'hero' | 'minion' | 'tower' | 'base' | 'monster' | 'deployable';

export type SkillSlotIndex = 0 | 1 | 2;

export type ElixirId = 'pyro_damage' | 'cryo_block' | 'volt_stealth' | 'vitae_heal';

export type DeployableId = 'barricade' | 'snap_trap' | 'aether_totem' | 'prismatic_pylon';

export type TacticalItemId = ElixirId | DeployableId;

export type DeployableState =
  | 'normal'
  | 'pyro_infused'
  | 'cryo_trap'
  | 'volt_charged'
  | 'vitae_overcharged';

export interface TacticalCatalogItem {
  id: TacticalItemId;
  category: 'elixir' | 'deployable';
  name: string;
  shortLabel: string;
  hotkey: string;
  cost: number;
  maxCharges: number;
  cooldown: number;
  range: number;
  radius: number;
  duration: number;
  colorHex: number;
  colorCss: string;
  summary: string;
  comboDescription: string;
}

export interface PlayerProfile {
  id: string;
  nickname: string;
  rankTitle: string;
  avatarHeroId: HeroId;
}

export interface FriendEntry {
  id: string;
  nickname: string;
  rankTitle: string;
  status: 'online' | 'in_match' | 'offline';
  favoriteHeroId: HeroId;
  isFriend: boolean;
}

export type DraftPickStatus = 'waiting' | 'picking' | 'locked';

export interface PartyMemberSlot {
  slotIndex: number;
  id: string;
  nickname: string;
  rankTitle: string;
  isPlayer: boolean;
  isBot: boolean;
  isEmpty?: boolean;
  heroId: HeroId | null;
  draftStatus: DraftPickStatus;
  preferredRole: HeroRole;
}

export interface GameSettings {
  controlScheme: ControlScheme;
  cameraLocked: boolean;
  cameraSpeed: number;
  showTouchControls: boolean;
  joystickSide: 'left' | 'right';
  audioMuted: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';
}

export interface HeroStats {
  maxHp: number;
  maxMana: number;
  attackDamage: number;
  attackRange: number;
  attackSpeed: number;
  moveSpeed: number;
  armor: number;
}

export type SkillEffectCategory = 'Line' | 'Circle' | 'Dash' | 'Buff';

export type SkillEffectType =
  | SkillEffectCategory
  | 'cleave_slam'
  | 'valor_charge'
  | 'earthshatter'
  | 'void_nova'
  | 'astral_phase'
  | 'starfall_cataclysm'
  | 'arrow_volley'
  | 'gale_stride'
  | 'sovereign_arrow'
  | 'shadow_bind'
  | 'mending_veil'
  | 'twilight_sanctuary'
  | 'crystal_quake'
  | 'monolith_bulwark'
  | 'avalanche_crash';

export interface Visual3DConcept {
  headStyle: string;
  shoulderStyle: string;
  weaponStyle: string;
  ornaments: string[];
  renderStyle: {
    polyCountEstimate: number;
    flatShaded: boolean;
    roughness: number;
    metalness: number;
  };
}

export interface HeroSkillInfo {
  id: string;
  slot: SkillSlotIndex;
  hotkey: 'Q' | 'W' | 'E';
  name: string;
  cooldown: number;
  manaCost: number;
  damage: number;
  range: number;
  radius: number;
  description: string;
  effectType: SkillEffectType;
  category?: SkillEffectCategory;
  iconType: string;
  icon?: string;
  mechanicDetails?: {
    castTime: number;
    projectileSpeed?: number;
    buffDuration?: number;
    crowdControl?: 'Stun' | 'Slow' | 'Knockup' | 'Silence' | 'None';
    ccDuration?: number;
  };
}

export interface HeroDefinition {
  id: HeroId;
  name: string;
  title: string;
  role: HeroRole;
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  accentCss: string;
  visualConcept?: Visual3DConcept;
  stats: HeroStats;
  skills: [HeroSkillInfo, HeroSkillInfo, HeroSkillInfo];
}

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  summary: string;
  statType: 'damage' | 'vitality' | 'speed' | 'arcane';
}

export interface CombatEntity {
  id: string;
  name: string;
  type: EntityType;
  team: TeamId;
  heroId?: HeroId;
  lane?: LaneId;
  x: number;
  z: number;
  rotationY: number;
  radius: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  shield: number;
  level: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  attackTimer: number;
  skillCooldowns: [number, number, number];
  skillTimers: [number, number, number];
  cooldownReduction: number;
  moveSpeed: number;
  alive: boolean;
  respawnTimer: number;
  maxRespawnTime: number;
  targetEntityId: string | null;
  moveTargetX: number | null;
  moveTargetZ: number | null;
  waypointIndex: number;
  homeX: number;
  homeZ: number;
  animState: HeroAnimState;
  animTime: number;
  animLockTimer: number;
  lastSkillSlot?: SkillSlotIndex;
  stunTimer: number;
  slowTimer: number;
  speedBuffTimer: number;
  hitFlashTimer: number;
  isPlayer?: boolean;
  monsterVariant?: 'golem' | 'stalker' | 'wolf' | 'sentinel';
  deployableId?: DeployableId;
  deployableState?: DeployableState;
  durationTimer?: number;
  maxDuration?: number;
  actionPulseTimer?: number;
  stealthed?: boolean;
  armorDebuffTimer?: number;
}

export interface ProjectedHealthBar {
  id: string;
  name: string;
  type: EntityType;
  team: TeamId;
  level: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  shield: number;
  screenX: number;
  screenY: number;
  isPlayer: boolean;
  visible: boolean;
  stealthed?: boolean;
  deployableState?: DeployableState;
}

export interface MinimapBlip {
  id: string;
  type: EntityType;
  team: TeamId;
  x: number;
  z: number;
  isPlayer?: boolean;
}

export interface FloatingDamageText {
  id: string;
  text: string;
  screenX: number;
  screenY: number;
  color: string;
  isCritOrSkill: boolean;
  opacity: number;
}

export interface MatchSnapshot {
  matchTime: number;
  allyKills: number;
  enemyKills: number;
  waveCount: number;
  nextWaveIn: number;
  player: {
    heroId: HeroId;
    name: string;
    level: number;
    xp: number;
    maxXp: number;
    gold: number;
    kills: number;
    deaths: number;
    assists: number;
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    shield: number;
    attackDamage: number;
    moveSpeed: number;
    alive: boolean;
    respawnTimer: number;
    skillCooldowns: [number, number, number];
    skillTimers: [number, number, number];
    aimingSkillSlot: SkillSlotIndex | null;
    inventoryCounts: Record<string, number>;
    tacticalInventory: Record<TacticalItemId, number>;
    tacticalCooldowns: Record<TacticalItemId, number>;
    aimingTacticalId: TacticalItemId | null;
    aimingComboPreview: string | null;
    activeDeployableCount: number;
    stealthed: boolean;
  };
  winner: TeamId | null;
  cameraX: number;
  cameraZ: number;
  cameraZoom: number;
  healthBars: ProjectedHealthBar[];
  damageTexts: FloatingDamageText[];
  minimapBlips: MinimapBlip[];
}