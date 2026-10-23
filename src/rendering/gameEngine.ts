import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CombatEntity,
  DeployableId,
  ElixirId,
  FloatingDamageText,
  GameScreen,
  GameSettings,
  HeroAnimState,
  HeroId,
  LaneId,
  MatchSnapshot,
  MinimapBlip,
  PartyMemberSlot,
  ProjectedHealthBar,
  SkillEffectType,
  SkillSlotIndex,
  TacticalItemId,
  TeamId,
} from '../types/game';
import {
  ActiveElixirZone,
  createDeployableRig,
  createElixirFlaskMesh,
  createElixirZoneInstance,
  DeployableRig,
  FlyingElixirFlask,
  getComboReactionLabel,
  isDeployableId,
  isElixirId,
  TACTICAL_CATALOG,
  updateDeployableRigVisuals,
} from '../combat/tacticalSystem';
import { HERO_DEFINITIONS, HERO_LIST, SHOP_ITEMS } from '../heroes/heroDefinitions';
import { createHeroRig, HeroRig, updateHeroRigAnimation } from '../heroes/heroBuilder';
import {
  ArenaMapObjects,
  buildLobbyStage,
  buildMobaArenaMap,
  LobbyStageObjects,
} from '../map/mobaArenaBuilder';
import {
  ALLY_BASE_POS,
  ALLY_FOUNTAIN_POS,
  ENEMY_BASE_POS,
  ENEMY_FOUNTAIN_POS,
  getInitialTowers,
  getLaneWaypoints,
  JUNGLE_CAMPS,
  MAP_HALF_SIZE,
} from './../map/laneConfig';
import {
  createBaseCoreRig,
  createTowerRig,
  StructureRig,
  updateStructureRig,
} from '../entities/towerSystem';
import { createMinionRig, MinionRig, updateMinionRig } from '../entities/minionSystem';
import { createMonsterRig, MonsterRig, updateMonsterRig } from '../entities/monsterSystem';
import { IndicatorShape, VfxSystem } from '../combat/vfxSystem';
import { InputManager } from '../input/inputManager';
import { soundEngine } from '../audio/soundEngine';

const _projVec = new THREE.Vector3();
const _rayPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _rayIntersect = new THREE.Vector3();

interface WorldDamagePopup {
  id: string;
  worldX: number;
  worldY: number;
  worldZ: number;
  vx: number;
  vy: number;
  text: string;
  color: string;
  isCritOrSkill: boolean;
  elapsed: number;
  duration: number;
}

export class MobaGameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private frameId = 0;
  private disposed = false;

  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  private lobbyStage: LobbyStageObjects;
  private arenaStage: ArenaMapObjects;
  private previewHeroRig: HeroRig | null = null;
  private previewHeroId: HeroId = 'vanguard';
  private previewAnimState: HeroAnimState = 'idle';
  private previewAnimTimer = 0;
  private previewTurntableAngle = 0;
  private previewShieldActive = false;

  private screen: GameScreen = 'lobby';
  private selectedHeroId: HeroId = 'vanguard';
  private playerNickname = 'AetherPlayer';
  private partySlots: PartyMemberSlot[] = [];
  private isPaused = false;
  private settings: GameSettings;

  private input: InputManager;
  private vfx: VfxSystem;
  private raycaster = new THREE.Raycaster();
  private mouseNdc = new THREE.Vector2();
  private activeIndicatorMode: 'none' | 'attack' | SkillSlotIndex = 'none';
  private aimingSkillSlot: SkillSlotIndex | null = null;
  private dragAimActive = false;
  private dragAimX = 0;
  private dragAimZ = 0;

  // Tactical Elixir & Deployable Objects State
  private aimingTacticalId: TacticalItemId | null = null;
  private aimingComboPreview: string | null = null;
  private tacticalDragActive = false;
  private tacticalDragX = 0;
  private tacticalDragZ = 0;
  private tacticalInventory: Record<TacticalItemId, number> = {
    pyro_damage: 0,
    cryo_block: 0,
    volt_stealth: 0,
    vitae_heal: 0,
    barricade: 0,
    snap_trap: 0,
    aether_totem: 0,
    prismatic_pylon: 0,
  };
  private tacticalCooldowns: Record<TacticalItemId, number> = {
    pyro_damage: 0,
    cryo_block: 0,
    volt_stealth: 0,
    vitae_heal: 0,
    barricade: 0,
    snap_trap: 0,
    aether_totem: 0,
    prismatic_pylon: 0,
  };
  private deployableRigs = new Map<string, DeployableRig>();
  private activeElixirZones: ActiveElixirZone[] = [];
  private flyingElixirs: FlyingElixirFlask[] = [];
  private tacticalSeq = 0;

  // Match Entities & Rigs
  private entities: CombatEntity[] = [];
  private heroRigs = new Map<string, HeroRig>();
  private structureRigs = new Map<string, StructureRig>();
  private minionRigs = new Map<string, MinionRig>();
  private monsterRigs = new Map<string, MonsterRig>();
  private matchGroup = new THREE.Group();
  private damagePopups: WorldDamagePopup[] = [];
  private damagePopupSeq = 0;

  // Match telemetry
  private matchTime = 0;
  private waveTimer = 2.0;
  private waveCount = 0;
  private allyKills = 0;
  private enemyKills = 0;
  private playerLevel = 1;
  private playerXp = 0;
  private playerMaxXp = 100;
  private playerGold = 650;
  private playerKills = 0;
  private playerDeaths = 0;
  private playerAssists = 0;
  private inventoryCounts: Record<string, number> = {};
  private winner: TeamId | null = null;

  // Camera state (2.5D Isometric Projection + Zoom & Scroll)
  private camFocusX = -81;
  private camFocusZ = 81;
  private camPanOffsetX = 0;
  private camPanOffsetZ = 0;
  private camZoom = 1.0;
  private targetCamZoom = 1.0;
  private pickCamZoom = 1.18; // Clean zoom-out framing for Hero Pick screen
  private camShakeAmount = 0;
  private isDraggingCamera = false;
  private pointerDownX = 0;
  private pointerDownY = 0;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private pinchStartDist = 0;
  private pinchStartZoom = 1.0;
  private isMobileDevice = false;
  private shadowTick = 0;
  private separationTick = 0;

  private onSnapshot: (snapshot: MatchSnapshot) => void;
  private snapshotAccum = 0;
  private clock = new THREE.Clock();

  constructor(
    container: HTMLElement,
    initialSettings: GameSettings,
    onSnapshot: (snapshot: MatchSnapshot) => void
  ) {
    this.container = container;
    this.settings = { ...initialSettings };
    this.onSnapshot = onSnapshot;
    this.input = new InputManager();

    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.96;
    this.updateRendererQuality();

    this.renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight
    );
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040906);
    this.scene.fog = new THREE.Fog(0x040906, 85, 225);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    this.camera = new THREE.PerspectiveCamera(
      40,
      (container.clientWidth || window.innerWidth) /
        (container.clientHeight || window.innerHeight),
      0.5,
      480
    );

    // Nocturnal rainforest ambient & moonlight directional light
    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x05140c, 0.56);
    this.hemiLight.position.set(0, 60, 0);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xdbeafe, 1.38);
    this.dirLight.position.set(28, 46, 24);
    this.dirLight.castShadow = !this.isSoftwareGl && this.settings.graphicsQuality !== 'low';
    this.dirLight.shadow.mapSize.width = this.settings.graphicsQuality === 'high' ? 2048 : 1024;
    this.dirLight.shadow.mapSize.height = this.settings.graphicsQuality === 'high' ? 2048 : 1024;
    const d = 54;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.camera.near = 2;
    this.dirLight.shadow.camera.far = 190;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    this.lobbyStage = buildLobbyStage(this.renderer);
    this.scene.add(this.lobbyStage.group);

    this.arenaStage = buildMobaArenaMap(this.renderer);
    this.arenaStage.group.visible = false;
    this.scene.add(this.arenaStage.group);

    this.scene.add(this.matchGroup);
    this.vfx = new VfxSystem(this.scene);

    this.rebuildPreviewHero(this.selectedHeroId);
    this.bindEvents();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.clock.start();
    this.startLoop();
  }

  private updateRendererQuality() {
    this.isMobileDevice =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

    const q = this.settings.graphicsQuality;
    // On high-DPI mobile screens (2.5x-3.5x DPR), cap to 1.15 (high), 1.0 (medium), or 0.85 (low)
    // to prevent rendering over 2-4 million pixels per frame which causes severe stuttering.
    const maxDpr = this.isMobileDevice
      ? q === 'high'
        ? 1.15
        : q === 'medium'
          ? 1.0
          : 0.85
      : q === 'high'
        ? 2
        : q === 'medium'
          ? 1.5
          : 1;

    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, maxDpr)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && q !== 'low';
    this.renderer.shadowMap.type = this.isMobileDevice ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    // On mobile, throttle shadow map updates to every 3rd frame to save GPU draw calls
    this.renderer.shadowMap.autoUpdate = !this.isMobileDevice;

    if (this.dirLight) {
      const shadowRes = this.isMobileDevice
        ? q === 'high'
          ? 1024
          : 512
        : q === 'high'
          ? 2048
          : 1024;
      this.dirLight.shadow.mapSize.width = shadowRes;
      this.dirLight.shadow.mapSize.height = shadowRes;
      this.dirLight.shadow.needsUpdate = true;
    }
  }

  public updateSettings(newSettings: GameSettings) {
    this.settings = { ...newSettings };
    soundEngine.setMuted(this.settings.audioMuted);
    this.updateRendererQuality();
  }

  public setScreen(screen: GameScreen) {
    this.screen = screen;
    if (screen === 'lobby' || screen === 'pick') {
      this.lobbyStage.group.visible = true;
      this.arenaStage.group.visible = false;
      this.matchGroup.visible = false;
      this.vfx.clearAll();
      this.camera.fov = 40;
      this.camera.updateProjectionMatrix();
      this.scene.fog = new THREE.FogExp2(0x040906, 0.015);
      this.dirLight.position.set(14, 24, 16);
      this.dirLight.target.position.set(0, 1.5, 0);
      this.rebuildPreviewHero(this.selectedHeroId);
    } else if (screen === 'games') {
      this.lobbyStage.group.visible = false;
      this.arenaStage.group.visible = true;
      this.matchGroup.visible = true;
      // Strong 2.5D Isometric Diorama Telephoto Projection:
      // 15° ultra-telephoto FOV eliminates perspective convergence so all units/walls share uniform 2.5D scale,
      // paired with 1.15x vertical relief pop on the arena & units.
      this.camera.fov = 15;
      this.camera.updateProjectionMatrix();
      this.arenaStage.group.scale.set(1, 1.15, 1);
      this.matchGroup.scale.set(1, 1.15, 1);
      this.scene.fog = new THREE.Fog(0x040906, 95, 240);
      this.startNewMatch();
    }
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public selectHero(heroId: HeroId) {
    this.selectedHeroId = heroId;
    soundEngine.playHeroSelect(heroId);
    this.rebuildPreviewHero(heroId);
    this.triggerPreviewSkill(0);
  }

  public setMatchRoster(slots: PartyMemberSlot[], playerNickname: string) {
    this.partySlots = slots.map((s) => ({ ...s }));
    if (playerNickname && playerNickname.trim()) {
      this.playerNickname = playerNickname.trim();
    }
  }

  public triggerPreviewSkill(slot: SkillSlotIndex) {
    this.previewAnimState = slot === 1 ? 'attack' : 'skill';
    this.previewAnimTimer = 0;
    const def = HERO_DEFINITIONS[this.selectedHeroId];
    const skill = def.skills[slot];
    soundEngine.playSkillCast(this.selectedHeroId, slot);

    const ringScale = slot === 2 ? 4.4 : slot === 1 ? 3.0 : 3.6;
    this.vfx.spawnShockwave(0, 1.5, def.accentColor, ringScale, 0.52);
    this.vfx.spawnBurstParticles(0, 1.4, 1.5, def.accentColor, 14, 7.5);

    if (slot === 0) {
      this.vfx.spawnSlashArc(0, 1.5, 0, def.accentColor, 2.2, 0.42);
    } else if (slot === 1) {
      this.vfx.spawnSanctuaryDome(0, 1.5, def.accentColor, 2.6, 0.55);
    } else if (slot === 2) {
      this.vfx.spawnPillarStrike(0, 1.5, def.accentColor, 3.2, 0.68);
    }

    this.previewShieldActive =
      skill.effectType === 'valor_charge' ||
      skill.effectType === 'mending_veil' ||
      skill.effectType === 'monolith_bulwark';

    if (
      this.selectedHeroId === 'colossus' &&
      (slot === 0 || slot === 2)
    ) {
      this.vfx.spawnCrystalSpikes(0, 1.5);
    }
  }

  private rebuildPreviewHero(heroId: HeroId) {
    if (this.previewHeroRig) {
      this.lobbyStage.pedestalGroup.remove(this.previewHeroRig.root);
    }
    this.previewHeroId = heroId;
    this.previewShieldActive = false;
    this.previewHeroRig = createHeroRig(heroId, 'ally');
    this.previewHeroRig.root.position.set(0, 0.45, 0);
    this.previewHeroRig.root.scale.setScalar(1.22);
    this.lobbyStage.pedestalGroup.add(this.previewHeroRig.root);
  }

  // ============================================================================
  // MATCH INITIALIZATION & SPAWNING (PAGE 3: GAMES)
  // ============================================================================

  public startNewMatch() {
    while (this.matchGroup.children.length > 0) {
      this.matchGroup.remove(this.matchGroup.children[0]);
    }
    this.entities = [];
    this.heroRigs.clear();
    this.structureRigs.clear();
    this.minionRigs.clear();
    this.monsterRigs.clear();
    this.deployableRigs.clear();
    this.activeElixirZones = [];
    this.flyingElixirs = [];
    this.damagePopups = [];
    this.vfx.clearAll();

    this.matchTime = 0;
    this.waveTimer = 2.0;
    this.waveCount = 0;
    this.allyKills = 0;
    this.enemyKills = 0;
    this.playerLevel = 1;
    this.playerXp = 0;
    this.playerMaxXp = 100;
    this.playerGold = 650;
    this.playerKills = 0;
    this.playerDeaths = 0;
    this.playerAssists = 0;
    this.inventoryCounts = {};
    this.tacticalInventory = {
      pyro_damage: 0,
      cryo_block: 0,
      volt_stealth: 0,
      vitae_heal: 0,
      barricade: 0,
      snap_trap: 0,
      aether_totem: 0,
      prismatic_pylon: 0,
    };
    this.tacticalCooldowns = {
      pyro_damage: 0,
      cryo_block: 0,
      volt_stealth: 0,
      vitae_heal: 0,
      barricade: 0,
      snap_trap: 0,
      aether_totem: 0,
      prismatic_pylon: 0,
    };
    this.winner = null;
    this.isPaused = false;
    this.aimingSkillSlot = null;
    this.aimingTacticalId = null;
    this.aimingComboPreview = null;
    this.dragAimActive = false;
    this.tacticalDragActive = false;
    this.activeIndicatorMode = 'none';

    this.spawnBaseCore('ally', ALLY_BASE_POS.x, ALLY_BASE_POS.z);
    this.spawnBaseCore('enemy', ENEMY_BASE_POS.x, ENEMY_BASE_POS.z);

    const towerConfigs = getInitialTowers();
    towerConfigs.forEach((tc) => {
      this.spawnTower(tc.id, tc.name, tc.team, tc.lane, tc.x, tc.z);
    });

    JUNGLE_CAMPS.forEach((camp) => {
      this.spawnJungleMonster(camp);
    });

    const remainingHeroes = HERO_LIST.map((h) => h.id).filter((id) => id !== this.selectedHeroId);
    const allyLanes: LaneId[] = ['mid', 'top', 'bot', 'top', 'bot'];
    const allyOffsets = [
      { dx: 4, dz: -4 },
      { dx: 2, dz: -8 },
      { dx: 8, dz: -2 },
      { dx: 6, dz: -9 },
      { dx: 9, dz: -6 },
    ];

    // Spawn Player (Slot 0)
    this.spawnHeroEntity({
      id: 'hero_player',
      heroId: this.selectedHeroId,
      customName: this.playerNickname,
      team: 'ally',
      lane: 'mid',
      x: ALLY_FOUNTAIN_POS.x + allyOffsets[0].dx,
      z: ALLY_FOUNTAIN_POS.z + allyOffsets[0].dz,
      isPlayer: true,
    });

    // Spawn 4 Ally Teammates from the 5-player Lobby
    for (let i = 1; i <= 4; i++) {
      const slot = this.partySlots[i];
      const allyHeroId = slot?.heroId || remainingHeroes[(i - 1) % remainingHeroes.length];
      const allyName = slot?.nickname
        ? slot.nickname
        : HERO_DEFINITIONS[allyHeroId].name;
      this.spawnHeroEntity({
        id: `hero_ally_${i}`,
        heroId: allyHeroId,
        customName: allyName,
        team: 'ally',
        lane: allyLanes[i],
        x: ALLY_FOUNTAIN_POS.x + allyOffsets[i].dx,
        z: ALLY_FOUNTAIN_POS.z + allyOffsets[i].dz,
        isPlayer: false,
      });
    }

    // Spawn 5 Enemy Team Heroes with realistic player nicknames
    const enemyPlayerNicks = [
      'Vexana_ID',
      'RiftKing99',
      'KyrosBlade',
      'NoctisX',
      'AetherLord',
    ];
    const enemyHeroes: HeroId[] = [
      remainingHeroes[0],
      remainingHeroes[1],
      remainingHeroes[2],
      remainingHeroes[3],
      this.selectedHeroId,
    ];
    const enemyOffsets = [
      { dx: -4, dz: 4 },
      { dx: -8, dz: 2 },
      { dx: -2, dz: 8 },
      { dx: -9, dz: 6 },
      { dx: -6, dz: 9 },
    ];
    for (let i = 0; i < 5; i++) {
      const eHero = enemyHeroes[i];
      this.spawnHeroEntity({
        id: `hero_enemy_${i}`,
        heroId: eHero,
        customName: enemyPlayerNicks[i] || HERO_DEFINITIONS[eHero].name,
        team: 'enemy',
        lane: allyLanes[i],
        x: ENEMY_FOUNTAIN_POS.x + enemyOffsets[i].dx,
        z: ENEMY_FOUNTAIN_POS.z + enemyOffsets[i].dz,
        isPlayer: false,
      });
    }

    this.camFocusX = ALLY_FOUNTAIN_POS.x + 6;
    this.camFocusZ = ALLY_FOUNTAIN_POS.z - 6;
    this.camPanOffsetX = 0;
    this.camPanOffsetZ = 0;
    this.camZoom = 1.0;
    this.targetCamZoom = 1.0;
    this.emitHudSnapshot();
  }

  private spawnBaseCore(team: 'ally' | 'enemy', x: number, z: number) {
    const id = `base_${team}`;
    const rig = createBaseCoreRig(team);
    rig.root.position.set(x, 0, z);
    this.matchGroup.add(rig.root);
    this.structureRigs.set(id, rig);

    this.entities.push({
      id,
      name: team === 'ally' ? 'Radiant Sanctum' : 'Crimson Citadel',
      type: 'base',
      team,
      x,
      z,
      rotationY: 0,
      radius: 3.8,
      hp: 4200,
      maxHp: 4200,
      mana: 0,
      maxMana: 0,
      shield: 0,
      level: 1,
      attackDamage: 125,
      attackRange: 15.5,
      attackCooldown: 1.25,
      attackTimer: 0,
      skillCooldowns: [0, 0, 0],
      skillTimers: [0, 0, 0],
      cooldownReduction: 0,
      moveSpeed: 0,
      alive: true,
      respawnTimer: 0,
      maxRespawnTime: 0,
      targetEntityId: null,
      moveTargetX: null,
      moveTargetZ: null,
      waypointIndex: 0,
      homeX: x,
      homeZ: z,
      animState: 'idle',
      animTime: 0,
      animLockTimer: 0,
      stunTimer: 0,
      slowTimer: 0,
      speedBuffTimer: 0,
      hitFlashTimer: 0,
    });
  }

  private spawnTower(
    id: string,
    name: string,
    team: 'ally' | 'enemy',
    lane: LaneId,
    x: number,
    z: number
  ) {
    const rig = createTowerRig(team);
    rig.root.position.set(x, 0, z);
    this.matchGroup.add(rig.root);
    this.structureRigs.set(id, rig);

    this.entities.push({
      id,
      name,
      type: 'tower',
      team,
      lane,
      x,
      z,
      rotationY: 0,
      radius: 2.1,
      hp: 2200,
      maxHp: 2200,
      mana: 0,
      maxMana: 0,
      shield: 0,
      level: 1,
      attackDamage: 110,
      attackRange: 13.4,
      attackCooldown: 1.35,
      attackTimer: 0,
      skillCooldowns: [0, 0, 0],
      skillTimers: [0, 0, 0],
      cooldownReduction: 0,
      moveSpeed: 0,
      alive: true,
      respawnTimer: 0,
      maxRespawnTime: 0,
      targetEntityId: null,
      moveTargetX: null,
      moveTargetZ: null,
      waypointIndex: 0,
      homeX: x,
      homeZ: z,
      animState: 'idle',
      animTime: 0,
      animLockTimer: 0,
      stunTimer: 0,
      slowTimer: 0,
      speedBuffTimer: 0,
      hitFlashTimer: 0,
    });
  }

  private spawnJungleMonster(camp: (typeof JUNGLE_CAMPS)[number]) {
    const rig = createMonsterRig(camp.variant, camp.scale);
    rig.root.position.set(camp.x, 0, camp.z);
    this.matchGroup.add(rig.root);
    this.monsterRigs.set(camp.id, rig);

    this.entities.push({
      id: camp.id,
      name: camp.name,
      type: 'monster',
      team: 'neutral',
      x: camp.x,
      z: camp.z,
      rotationY: Math.atan2(-camp.x, -camp.z),
      radius: 1.35 * camp.scale,
      hp: camp.maxHp,
      maxHp: camp.maxHp,
      mana: 0,
      maxMana: 0,
      shield: 0,
      level: 2,
      attackDamage: camp.damage,
      attackRange: 3.1,
      attackCooldown: 1.35,
      attackTimer: 0,
      skillCooldowns: [0, 0, 0],
      skillTimers: [0, 0, 0],
      cooldownReduction: 0,
      moveSpeed: 6.2,
      alive: true,
      respawnTimer: 0,
      maxRespawnTime: 28,
      targetEntityId: null,
      moveTargetX: null,
      moveTargetZ: null,
      waypointIndex: 0,
      homeX: camp.x,
      homeZ: camp.z,
      animState: 'idle',
      animTime: Math.random() * 5,
      animLockTimer: 0,
      stunTimer: 0,
      slowTimer: 0,
      speedBuffTimer: 0,
      hitFlashTimer: 0,
      monsterVariant: camp.variant,
    });
  }

  private spawnHeroEntity(opts: {
    id: string;
    heroId: HeroId;
    customName?: string;
    team: 'ally' | 'enemy';
    lane: LaneId;
    x: number;
    z: number;
    isPlayer: boolean;
  }) {
    const def = HERO_DEFINITIONS[opts.heroId];
    const rig = createHeroRig(opts.heroId, opts.team);
    rig.root.position.set(opts.x, 0, opts.z);
    this.matchGroup.add(rig.root);
    this.heroRigs.set(opts.id, rig);

    const waypoints = getLaneWaypoints(opts.lane);
    const startWp = opts.team === 'ally' ? 1 : waypoints.length - 2;

    this.entities.push({
      id: opts.id,
      name:
        opts.customName ||
        (opts.isPlayer ? def.name : `${def.name} (${opts.team === 'ally' ? 'Ally' : 'Bot'})`),
      type: 'hero',
      team: opts.team,
      heroId: opts.heroId,
      lane: opts.lane,
      x: opts.x,
      z: opts.z,
      rotationY: opts.team === 'ally' ? Math.PI * 0.75 : -Math.PI * 0.25,
      radius: 1.25,
      hp: def.stats.maxHp,
      maxHp: def.stats.maxHp,
      mana: def.stats.maxMana,
      maxMana: def.stats.maxMana,
      shield: 0,
      level: 1,
      attackDamage: def.stats.attackDamage,
      attackRange: def.stats.attackRange,
      attackCooldown: 1 / def.stats.attackSpeed,
      attackTimer: 0,
      skillCooldowns: [
        def.skills[0].cooldown,
        def.skills[1].cooldown,
        def.skills[2].cooldown,
      ],
      skillTimers: [0, 0, 0],
      cooldownReduction: 0,
      moveSpeed: def.stats.moveSpeed,
      alive: true,
      respawnTimer: 0,
      maxRespawnTime: 8,
      targetEntityId: null,
      moveTargetX: null,
      moveTargetZ: null,
      waypointIndex: startWp,
      homeX: opts.x,
      homeZ: opts.z,
      animState: 'idle',
      animTime: 0,
      animLockTimer: 0,
      stunTimer: 0,
      slowTimer: 0,
      speedBuffTimer: 0,
      hitFlashTimer: 0,
      isPlayer: opts.isPlayer,
    });
  }

  private spawnMinionWave() {
    this.waveCount++;
    const lanes: LaneId[] = ['top', 'mid', 'bot'];
    const teams: ('ally' | 'enemy')[] = ['ally', 'enemy'];

    lanes.forEach((lane) => {
      const waypoints = getLaneWaypoints(lane);
      teams.forEach((team) => {
        const isAlly = team === 'ally';
        const spawnPt = isAlly ? waypoints[1] : waypoints[waypoints.length - 2];
        const nextWp = isAlly ? 2 : waypoints.length - 3;

        for (let i = 0; i < 3; i++) {
          const isRanged = i === 2;
          const id = `minion_${team}_${lane}_w${this.waveCount}_${i}`;
          const offsetAngle = (i / 3) * Math.PI * 2;
          const sx = spawnPt.x + Math.cos(offsetAngle) * 1.6;
          const sz = spawnPt.z + Math.sin(offsetAngle) * 1.6;

          const rig = createMinionRig(team, isRanged);
          rig.root.position.set(sx, 0, sz);
          this.matchGroup.add(rig.root);
          this.minionRigs.set(id, rig);

          this.entities.push({
            id,
            name: isRanged ? 'Caster Minion' : 'Melee Minion',
            type: 'minion',
            team,
            lane,
            x: sx,
            z: sz,
            rotationY: isAlly ? Math.PI * 0.75 : -Math.PI * 0.25,
            radius: 0.78,
            hp: isRanged ? 290 : 420,
            maxHp: isRanged ? 290 : 420,
            mana: 0,
            maxMana: 0,
            shield: 0,
            level: this.waveCount,
            attackDamage: isRanged ? 34 : 26,
            attackRange: isRanged ? 7.8 : 2.5,
            attackCooldown: isRanged ? 1.4 : 1.15,
            attackTimer: Math.random() * 0.4,
            skillCooldowns: [0, 0, 0],
            skillTimers: [0, 0, 0],
            cooldownReduction: 0,
            moveSpeed: 5.8,
            alive: true,
            respawnTimer: 0,
            maxRespawnTime: 0,
            targetEntityId: null,
            moveTargetX: null,
            moveTargetZ: null,
            waypointIndex: nextWp,
            homeX: sx,
            homeZ: sz,
            animState: 'walk',
            animTime: Math.random() * 2,
            animLockTimer: 0,
            stunTimer: 0,
            slowTimer: 0,
            speedBuffTimer: 0,
            hitFlashTimer: 0,
          });
        }
      });
    });
  }

  // ============================================================================
  // PLAYER ACTIONS, 3-SKILL SYSTEM & IN-GAME SHOP
  // ============================================================================

  public getPlayerEntity(): CombatEntity | undefined {
    return this.entities.find((e) => e.isPlayer);
  }

  public buyShopItem(itemId: string): boolean {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    const player = this.getPlayerEntity();
    if (!item || !player || this.playerGold < item.cost) return false;

    this.playerGold -= item.cost;
    this.inventoryCounts[itemId] = (this.inventoryCounts[itemId] || 0) + 1;

    if (item.statType === 'damage') {
      player.attackDamage += 22;
    } else if (item.statType === 'vitality') {
      player.maxHp += 240;
      player.hp = Math.min(player.maxHp, player.hp + 240);
    } else if (item.statType === 'speed') {
      player.moveSpeed = Number((player.moveSpeed + 0.8).toFixed(1));
      player.attackCooldown = Math.max(0.35, player.attackCooldown * 0.9);
    } else if (item.statType === 'arcane') {
      player.cooldownReduction = Math.min(0.4, player.cooldownReduction + 0.12);
      player.maxMana += 150;
      player.mana = Math.min(player.maxMana, player.mana + 150);
    }

    soundEngine.playShopBuy();
    this.vfx.spawnShockwave(player.x, player.z, 0xf59e0b, 3.2, 0.45);
    this.emitHudSnapshot();
    return true;
  }

  public buyTacticalItem(itemId: TacticalItemId): boolean {
    const spec = TACTICAL_CATALOG[itemId];
    const player = this.getPlayerEntity();
    if (!spec || !player) return false;
    const currentCount = this.tacticalInventory[itemId] || 0;
    if (this.playerGold < spec.cost || currentCount >= spec.maxCharges) return false;

    this.playerGold -= spec.cost;
    this.tacticalInventory[itemId] = currentCount + 1;
    soundEngine.playShopBuy();
    this.vfx.spawnShockwave(player.x, player.z, spec.colorHex, 2.8, 0.4);
    this.emitHudSnapshot();
    return true;
  }

  public startTacticalAim(itemId: TacticalItemId) {
    const player = this.getPlayerEntity();
    if (!player || !player.alive) return;
    if ((this.tacticalInventory[itemId] || 0) <= 0 || (this.tacticalCooldowns[itemId] || 0) > 0) {
      return;
    }
    this.aimingSkillSlot = null;
    this.dragAimActive = false;
    this.aimingTacticalId = itemId;
    this.tacticalDragActive = false;
    this.showPlayerTacticalIndicator(player, itemId, 0.45);
    this.emitHudSnapshot();
  }

  public updateTacticalDragAim(itemId: TacticalItemId, normX: number, normZ: number) {
    const player = this.getPlayerEntity();
    if (!player || !player.alive) return;
    if ((this.tacticalInventory[itemId] || 0) <= 0 || (this.tacticalCooldowns[itemId] || 0) > 0) {
      return;
    }
    this.aimingSkillSlot = null;
    this.aimingTacticalId = itemId;
    const mag = Math.hypot(normX, normZ);
    if (mag > 0.06) {
      this.tacticalDragActive = true;
      this.tacticalDragX = normX;
      this.tacticalDragZ = normZ;
    } else {
      this.tacticalDragActive = false;
    }
    this.showPlayerTacticalIndicator(player, itemId, 0.25);
  }

  public finishTacticalDragAim(itemId: TacticalItemId, wasDragged: boolean) {
    const player = this.getPlayerEntity();
    if (!player || !player.alive) {
      this.cancelTacticalAim();
      return;
    }
    if ((this.tacticalInventory[itemId] || 0) <= 0 || (this.tacticalCooldowns[itemId] || 0) > 0) {
      this.cancelTacticalAim();
      return;
    }

    if (wasDragged) {
      const { aimX, aimZ } = this.getTacticalAimWorldPos(player, itemId);
      this.useTacticalItem(itemId, aimX, aimZ);
      this.aimingTacticalId = null;
      this.aimingComboPreview = null;
      this.tacticalDragActive = false;
      this.emitHudSnapshot();
    } else {
      this.aimingTacticalId = itemId;
      this.tacticalDragActive = false;
      this.showPlayerTacticalIndicator(player, itemId, 0.55);
      this.emitHudSnapshot();
    }
  }

  public cancelTacticalAim() {
    this.aimingTacticalId = null;
    this.aimingComboPreview = null;
    this.tacticalDragActive = false;
    if (this.activeIndicatorMode === 'none' && this.aimingSkillSlot === null) {
      this.vfx.showTacticalIndicator({
        shape: 'none',
        originX: 0,
        originZ: 0,
        aimX: 0,
        aimZ: 0,
        range: 1,
        aoeRadius: 1,
        colorHex: 0xffffff,
      });
    }
    this.emitHudSnapshot();
  }

  private getTacticalAimWorldPos(
    player: CombatEntity,
    itemId: TacticalItemId
  ): { aimX: number; aimZ: number } {
    const spec = TACTICAL_CATALOG[itemId];
    const maxRange = spec.range;

    if (this.tacticalDragActive) {
      const mag = Math.hypot(this.tacticalDragX, this.tacticalDragZ);
      if (mag > 0.05) {
        const clampedMag = Math.min(1, mag);
        const nx = this.tacticalDragX / mag;
        const nz = this.tacticalDragZ / mag;
        return {
          aimX: player.x + nx * maxRange * clampedMag,
          aimZ: player.z + nz * maxRange * clampedMag,
        };
      }
    }

    if (this.input.cursorWorldX !== 0 || this.input.cursorWorldZ !== 0) {
      const dx = this.input.cursorWorldX - player.x;
      const dz = this.input.cursorWorldZ - player.z;
      const dist = Math.hypot(dx, dz);
      const clamped = Math.min(dist, maxRange);
      if (dist > 0.01) {
        return {
          aimX: player.x + (dx / dist) * clamped,
          aimZ: player.z + (dz / dist) * clamped,
        };
      }
    }

    return {
      aimX: player.x + Math.sin(player.rotationY) * (maxRange * 0.65),
      aimZ: player.z + Math.cos(player.rotationY) * (maxRange * 0.65),
    };
  }

  private showPlayerTacticalIndicator(
    player: CombatEntity,
    itemId: TacticalItemId,
    holdSeconds = 0.3
  ) {
    const spec = TACTICAL_CATALOG[itemId];
    const { aimX, aimZ } = this.getTacticalAimWorldPos(player, itemId);

    // Check if aiming an Elixir near an active Deployable Object to preview Combo Reaction!
    let comboText: string | null = null;
    if (isElixirId(itemId)) {
      const nearObj = this.findNearestDeployableAt(aimX, aimZ, 3.6);
      if (nearObj && nearObj.deployableId) {
        comboText = getComboReactionLabel(itemId, nearObj.deployableId);
      }
    }
    this.aimingComboPreview = comboText;

    this.vfx.showTacticalIndicator({
      shape: 'aoe_target',
      originX: player.x,
      originZ: player.z,
      aimX,
      aimZ,
      range: spec.range,
      aoeRadius: spec.radius,
      colorHex: comboText ? 0xfacc15 : spec.colorHex,
      holdSeconds,
    });
  }

  private findNearestDeployableAt(x: number, z: number, maxDist: number): CombatEntity | null {
    let best: CombatEntity | null = null;
    let bestDist = maxDist;
    for (let i = 0; i < this.entities.length; i++) {
      const ent = this.entities[i];
      if (!ent.alive || ent.type !== 'deployable') continue;
      const d = Math.hypot(ent.x - x, ent.z - z);
      if (d <= bestDist) {
        bestDist = d;
        best = ent;
      }
    }
    return best;
  }

  public useTacticalItem(
    itemId: TacticalItemId,
    targetWorldX?: number,
    targetWorldZ?: number
  ): boolean {
    const player = this.getPlayerEntity();
    if (!player || !player.alive || player.stunTimer > 0) return false;
    const spec = TACTICAL_CATALOG[itemId];
    if (!spec) return false;
    const charges = this.tacticalInventory[itemId] || 0;
    const cd = this.tacticalCooldowns[itemId] || 0;
    if (charges <= 0 || cd > 0) return false;

    const fallback = this.getTacticalAimWorldPos(player, itemId);
    const rawX = targetWorldX !== undefined ? targetWorldX : fallback.aimX;
    const rawZ = targetWorldZ !== undefined ? targetWorldZ : fallback.aimZ;

    const dx = rawX - player.x;
    const dz = rawZ - player.z;
    const dist = Math.hypot(dx, dz);
    const clampedDist = Math.min(spec.range, dist);
    const finalX = THREE.MathUtils.clamp(
      dist > 0.05 ? player.x + (dx / dist) * clampedDist : player.x + Math.sin(player.rotationY) * 3,
      -MAP_HALF_SIZE + 2,
      MAP_HALF_SIZE - 2
    );
    const finalZ = THREE.MathUtils.clamp(
      dist > 0.05 ? player.z + (dz / dist) * clampedDist : player.z + Math.cos(player.rotationY) * 3,
      -MAP_HALF_SIZE + 2,
      MAP_HALF_SIZE - 2
    );

    this.tacticalInventory[itemId] = charges - 1;
    this.tacticalCooldowns[itemId] = spec.cooldown;
    this.aimingTacticalId = null;
    this.aimingComboPreview = null;
    this.tacticalDragActive = false;

    player.rotationY = Math.atan2(finalX - player.x, finalZ - player.z);
    player.animState = 'skill';
    player.animTime = 0;
    player.animLockTimer = 0.28;

    if (isElixirId(itemId)) {
      this.throwElixirFlask(player, itemId, finalX, finalZ, false);
    } else if (isDeployableId(itemId)) {
      this.spawnDeployableObject(player, itemId, finalX, finalZ);
    }

    this.emitHudSnapshot();
    return true;
  }

  private spawnDeployableObject(
    owner: CombatEntity,
    deployableId: DeployableId,
    x: number,
    z: number
  ) {
    // Prevent overlapping inside towers/bases
    for (let i = 0; i < this.entities.length; i++) {
      const st = this.entities[i];
      if (!st.alive || (st.type !== 'tower' && st.type !== 'base')) continue;
      const d = Math.hypot(x - st.x, z - st.z);
      const minClearance = st.radius + 2.2;
      if (d < minClearance) {
        const nx = (x - st.x) / (d || 1);
        const nz = (z - st.z) / (d || 1);
        x = st.x + nx * minClearance;
        z = st.z + nz * minClearance;
      }
    }

    // Enforce max 3 active deployables per team (remove oldest if already 3)
    const teamDeployables = this.entities.filter(
      (e) => e.alive && e.type === 'deployable' && e.team === owner.team
    );
    if (teamDeployables.length >= 3) {
      const oldest = teamDeployables[0];
      this.handleEntityDeath(undefined, oldest);
    }

    const spec = TACTICAL_CATALOG[deployableId];
    const id = `deploy_${owner.team}_${++this.tacticalSeq}`;
    const rig = createDeployableRig(deployableId, owner.team);
    rig.root.position.set(x, 0, z);
    // Orient barricade perpendicular to caster->target vector so it blocks the corridor cleanly
    const rotY = Math.atan2(x - owner.x, z - owner.z);
    rig.root.rotation.y = rotY;
    this.matchGroup.add(rig.root);
    this.deployableRigs.set(id, rig);

    const maxHp =
      deployableId === 'barricade'
        ? 460
        : deployableId === 'aether_totem'
          ? 380
          : deployableId === 'prismatic_pylon'
            ? 320
            : 190;

    this.entities.push({
      id,
      name: spec.name,
      type: 'deployable',
      team: owner.team,
      x,
      z,
      rotationY: rotY,
      radius: deployableId === 'barricade' ? 2.1 : 1.25,
      hp: maxHp,
      maxHp,
      mana: 0,
      maxMana: 0,
      shield: 0,
      level: owner.level,
      attackDamage: 0,
      attackRange: 0,
      attackCooldown: 1,
      attackTimer: 0,
      skillCooldowns: [0, 0, 0],
      skillTimers: [0, 0, 0],
      cooldownReduction: 0,
      moveSpeed: 0,
      alive: true,
      respawnTimer: 0,
      maxRespawnTime: 0,
      targetEntityId: null,
      moveTargetX: null,
      moveTargetZ: null,
      waypointIndex: 0,
      homeX: x,
      homeZ: z,
      animState: 'idle',
      animTime: 0,
      animLockTimer: 0,
      stunTimer: 0,
      slowTimer: 0,
      speedBuffTimer: 0,
      hitFlashTimer: 0,
      deployableId,
      deployableState: 'normal',
      durationTimer: spec.duration,
      maxDuration: spec.duration,
      actionPulseTimer: 0.8,
    });

    soundEngine.playSkillCast(this.selectedHeroId, 1);
    this.vfx.spawnShockwave(x, z, spec.colorHex, 2.8, 0.42);
    this.vfx.spawnBurstParticles(x, 0.8, z, spec.colorHex, 10, 6.0);
    this.spawnFloatingText(x, z, `${spec.shortLabel.toUpperCase()}!`, spec.colorCss, true);
  }

  private throwElixirFlask(
    owner: CombatEntity,
    elixirId: ElixirId,
    targetX: number,
    targetZ: number,
    isReflectedBounce = false
  ) {
    const mesh = createElixirFlaskMesh(elixirId);
    mesh.position.set(owner.x, 1.6, owner.z);
    this.matchGroup.add(mesh);

    soundEngine.playSkillCast(this.selectedHeroId, 0);
    this.flyingElixirs.push({
      elixirId,
      team: owner.team,
      ownerEntityId: owner.id,
      startX: owner.x,
      startZ: owner.z,
      targetX,
      targetZ,
      elapsed: 0,
      duration: isReflectedBounce ? 0.28 : 0.34,
      isReflectedBounce,
      mesh,
    });
  }

  private resolveElixirImpact(flask: FlyingElixirFlask) {
    const { elixirId, team, ownerEntityId, targetX, targetZ, isReflectedBounce } = flask;
    const owner = this.entities.find((e) => e.id === ownerEntityId);
    const spec = TACTICAL_CATALOG[elixirId];

    // Check if the Elixir hits a Deployable Object within 3.6m!
    const hitDeployable = this.findNearestDeployableAt(targetX, targetZ, 3.6);
    if (hitDeployable && hitDeployable.deployableId) {
      this.resolveCatalyticObjectReaction(
        owner,
        team,
        elixirId,
        hitDeployable,
        isReflectedBounce
      );
      return;
    }

    // Standard Ground Impact -> Spawn Active Elixir Zone
    // River bonus: Volt-Mirage (Electric) on the River expands radius by +25%!
    const isOnRiver = Math.abs(targetX - targetZ) < 18 && Math.hypot(targetX, targetZ) < 88;
    const effectiveRadius =
      elixirId === 'volt_stealth' && isOnRiver
        ? spec.radius * 1.25
        : isReflectedBounce
          ? spec.radius * 1.2
          : spec.radius;

    this.spawnElixirZone(elixirId, team, ownerEntityId, targetX, targetZ, effectiveRadius, spec.duration);
  }

  private spawnElixirZone(
    elixirId: ElixirId,
    team: TeamId,
    ownerEntityId: string,
    x: number,
    z: number,
    radius: number,
    duration: number
  ) {
    // Cap at 5 active zones for smooth mobile/PC frame rate
    if (this.activeElixirZones.length >= 5) {
      const oldest = this.activeElixirZones.shift()!;
      this.matchGroup.remove(oldest.group);
    }

    const spec = TACTICAL_CATALOG[elixirId];
    const zone = createElixirZoneInstance({
      id: `zone_${++this.tacticalSeq}`,
      elixirId,
      team,
      ownerEntityId,
      x,
      z,
      radius,
      duration,
    });
    this.matchGroup.add(zone.group);
    this.activeElixirZones.push(zone);

    this.vfx.spawnShockwave(x, z, spec.colorHex, radius * 1.1, 0.55);
    this.vfx.spawnBurstParticles(x, 0.8, z, spec.colorHex, 14, 7.5);
    this.spawnFloatingText(x, z, spec.shortLabel.toUpperCase(), spec.colorCss, true);
  }

  private resolveCatalyticObjectReaction(
    owner: CombatEntity | undefined,
    team: TeamId,
    elixirId: ElixirId,
    obj: CombatEntity,
    isReflectedBounce: boolean
  ) {
    const depId = obj.deployableId!;
    const spec = TACTICAL_CATALOG[elixirId];

    // 1. PRISMATIC PYLON: Reflects & Amplifies any Elixir + Conducts Volt Lightning
    if (depId === 'prismatic_pylon' && !isReflectedBounce) {
      obj.deployableState = elixirId === 'volt_stealth' ? 'volt_charged' : 'vitae_overcharged';
      obj.hp = obj.maxHp;
      obj.shield = 120;
      this.vfx.spawnSanctuaryDome(obj.x, obj.z, spec.colorHex, 3.8, 0.55);
      this.spawnFloatingText(obj.x, obj.z, 'PRISM REFLECT & AMPLIFY!', '#38bdf8', true);

      // Spawn a zone right at the Pylon AND bounce a 2nd amplified flask toward nearest enemy!
      this.spawnElixirZone(elixirId, team, owner?.id || obj.id, obj.x, obj.z, spec.radius, spec.duration);

      const nearestEnemy = this.findNearestHostile(obj, 11.5, false);
      const bounceX = nearestEnemy
        ? nearestEnemy.x
        : THREE.MathUtils.clamp(obj.x + (Math.random() - 0.5) * 9, -MAP_HALF_SIZE, MAP_HALF_SIZE);
      const bounceZ = nearestEnemy
        ? nearestEnemy.z
        : THREE.MathUtils.clamp(obj.z + (Math.random() - 0.5) * 9, -MAP_HALF_SIZE, MAP_HALF_SIZE);

      this.throwElixirFlask(obj, elixirId, bounceX, bounceZ, true);

      if (elixirId === 'volt_stealth') {
        this.triggerVoltChainConduction(owner, team, obj);
      }
      return;
    }

    // 2. PYRO-SCORCH ELIXIR (Api) hitting Deployable Object:
    if (elixirId === 'pyro_damage') {
      if (depId === 'barricade') {
        // Detonates Barricade into high-damage fiery shrapnel explosion + burning crater!
        this.vfx.spawnPillarStrike(obj.x, obj.z, 0xf97316, 5.8, 0.75);
        this.vfx.spawnShockwave(obj.x, obj.z, 0xef4444, 6.2, 0.65);
        this.vfx.spawnBurstParticles(obj.x, 1.4, obj.z, 0xf97316, 22, 11.0);
        this.camShakeAmount = 0.55;
        this.spawnFloatingText(obj.x, obj.z, 'SHRAPNEL DETONATION! -240', '#f97316', true);
        if (owner) {
          this.applyAoeDamage(owner, obj.x, obj.z, 5.8, 240, 1.0, 2.5);
        }
        this.handleEntityDeath( undefined, obj);
        this.spawnElixirZone('pyro_damage', team, owner?.id || obj.id, obj.x, obj.z, 5.0, 6.5);
        return;
      }

      // Transforms Snap-Trap into Inferno Cluster Mine or Aether Totem into Solar Flare Turret
      obj.deployableState = 'pyro_infused';
      obj.hp = obj.maxHp;
      obj.durationTimer = Math.max(obj.durationTimer || 15, 16);
      this.vfx.spawnShockwave(obj.x, obj.z, 0xf97316, 4.5, 0.55);
      this.spawnFloatingText(
        obj.x,
        obj.z,
        depId === 'snap_trap' ? 'INFERNO CLUSTER MINE!' : 'SOLAR FLARE TURRET!',
        '#f97316',
        true
      );
      return;
    }

    // 3. CRYO-BARRIER ELIXIR (Es) hitting ANY Deployable Object -> Transforms into Cryo-Freeze Trap!
    if (elixirId === 'cryo_block') {
      obj.deployableState = 'cryo_trap';
      obj.hp = obj.maxHp;
      obj.shield = 140;
      obj.durationTimer = Math.max(obj.durationTimer || 15, 18);
      this.vfx.spawnCrystalSpikes(obj.x, obj.z);
      this.vfx.spawnShockwave(obj.x, obj.z, 0x38bdf8, 4.6, 0.55);
      this.spawnFloatingText(obj.x, obj.z, 'CRYO FREEZE TRAP ARMED!', '#38bdf8', true);
      return;
    }

    // 4. VOLT-MIRAGE ELIXIR (Listrik) hitting Deployable Object -> Chain Lightning Conduction!
    if (elixirId === 'volt_stealth') {
      obj.deployableState = 'volt_charged';
      obj.hp = obj.maxHp;
      this.triggerVoltChainConduction(owner, team, obj);
      this.spawnElixirZone('volt_stealth', team, owner?.id || obj.id, obj.x, obj.z, 4.8, 6.0);
      return;
    }

    // 5. VITAE-BLOOM ELIXIR (Pemulihan) hitting Deployable Object -> Overcharged Support Aura on Totem!
    if (elixirId === 'vitae_heal') {
      obj.deployableState = 'vitae_overcharged';
      obj.hp = obj.maxHp;
      obj.shield = 200;
      obj.durationTimer = Math.max(obj.durationTimer || 16, 18);
      this.vfx.spawnSanctuaryDome(obj.x, obj.z, 0x10b981, 6.8, 0.7);
      this.vfx.spawnShockwave(obj.x, obj.z, 0x34d399, 7.2, 0.65);
      this.spawnFloatingText(obj.x, obj.z, 'SANCTUARY SUPPORT OVERCHARGE!', '#34d399', true);

      // Instant burst heal + shield to all nearby allies & allied towers
      for (let i = 0; i < this.entities.length; i++) {
        const ally = this.entities[i];
        if (!ally.alive || ally.team !== team) continue;
        const d = Math.hypot(ally.x - obj.x, ally.z - obj.z);
        if (d <= 7.8) {
          if (ally.type === 'hero' || ally.type === 'minion') {
            ally.hp = Math.min(ally.maxHp, ally.hp + 185);
            ally.shield = Math.max(ally.shield, 160);
            ally.speedBuffTimer = Math.max(ally.speedBuffTimer, 3.5);
            this.spawnFloatingText(ally.x, ally.z, '+185 HP & SHIELD', '#34d399', true);
          } else if (ally.type === 'tower') {
            ally.shield = Math.max(ally.shield, 260);
          }
        }
      }
    }
  }

  private triggerVoltChainConduction(
    owner: CombatEntity | undefined,
    team: TeamId,
    sourceObj: CombatEntity
  ) {
    this.spawnFloatingText(sourceObj.x, sourceObj.z, 'CHAIN LIGHTNING CONDUCTION!', '#c084fc', true);
    this.vfx.spawnShockwave(sourceObj.x, sourceObj.z, 0xa855f7, 5.2, 0.5);

    const nodes: CombatEntity[] = [sourceObj];
    for (let i = 0; i < this.entities.length; i++) {
      const other = this.entities[i];
      if (!other.alive || other.type !== 'deployable' || other.id === sourceObj.id) continue;
      if (Math.hypot(other.x - sourceObj.x, other.z - sourceObj.z) <= 13.5) {
        other.deployableState = 'volt_charged';
        nodes.push(other);
      }
    }

    // Arc lightning between all connected deployable nodes and shock nearby enemies
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      if (owner) {
        this.applyAoeDamage(owner, nodeA.x, nodeA.z, 4.8, 175, 0.75, 2.0);
      }
      if (i + 1 < nodes.length) {
        const nodeB = nodes[i + 1];
        this.vfx.spawnDashTrail(nodeA.x, nodeA.z, nodeB.x, nodeB.z, 0xc084fc, 1.35);
        const midX = (nodeA.x + nodeB.x) * 0.5;
        const midZ = (nodeA.z + nodeB.z) * 0.5;
        if (owner) {
          this.applyAoeDamage(owner, midX, midZ, 3.8, 145, 0.6, 1.5);
        }
      }
    }
  }

  private triggerCryoTrapShatter(trapObj: CombatEntity) {
    if (!trapObj.alive) return;
    const owner = this.getPlayerEntity();
    this.vfx.spawnCrystalSpikes(trapObj.x, trapObj.z);
    this.vfx.spawnSanctuaryDome(trapObj.x, trapObj.z, 0x38bdf8, 5.0, 0.65);
    this.vfx.spawnShockwave(trapObj.x, trapObj.z, 0x7dd3fc, 5.4, 0.6);
    this.spawnFloatingText(trapObj.x, trapObj.z, 'CRYO FREEZE SHATTER! (1.8s STUN)', '#38bdf8', true);

    for (let i = 0; i < this.entities.length; i++) {
      const target = this.entities[i];
      if (!target.alive || target.team === trapObj.team) continue;
      if (target.type === 'tower' || target.type === 'base') continue;
      const d = Math.hypot(target.x - trapObj.x, target.z - trapObj.z) - target.radius;
      if (d <= 5.0) {
        this.applyDamage(owner, target, 165, true);
        target.stunTimer = Math.max(target.stunTimer, 1.85);
        target.slowTimer = Math.max(target.slowTimer, 3.5);
      }
    }

    this.handleEntityDeath(undefined, trapObj);
  }

  private updateTacticalSystems(dt: number, elapsed: number) {
    // 1. Tick Tactical Cooldowns
    for (const key of Object.keys(this.tacticalCooldowns) as TacticalItemId[]) {
      if (this.tacticalCooldowns[key] > 0) {
        this.tacticalCooldowns[key] = Math.max(0, this.tacticalCooldowns[key] - dt);
      }
    }

    // 2. Update Flying Parabolic Elixir Flasks
    for (let i = this.flyingElixirs.length - 1; i >= 0; i--) {
      const f = this.flyingElixirs[i];
      f.elapsed += dt;
      const t = Math.min(1, f.elapsed / f.duration);
      const x = THREE.MathUtils.lerp(f.startX, f.targetX, t);
      const z = THREE.MathUtils.lerp(f.startZ, f.targetZ, t);
      const y = 1.2 * (1 - t) + 4 * 5.2 * t * (1 - t); // Smooth parabolic throw arc
      f.mesh.position.set(x, y, z);
      f.mesh.rotation.x += dt * 11;
      f.mesh.rotation.z += dt * 9;

      if (t >= 1) {
        this.matchGroup.remove(f.mesh);
        this.flyingElixirs.splice(i, 1);
        this.resolveElixirImpact(f);
      }
    }

    // Reset hero stealth before evaluating active Volt-Mirage Invisible Areas
    for (let i = 0; i < this.entities.length; i++) {
      const e = this.entities[i];
      if (e.type === 'hero') {
        e.stealthed = false;
      }
      if (e.armorDebuffTimer && e.armorDebuffTimer > 0) {
        e.armorDebuffTimer = Math.max(0, e.armorDebuffTimer - dt);
      }
    }

    // 3. Update Active Elixir Zones (Damaged, Block, Invisible, Healing)
    const player = this.getPlayerEntity();
    for (let i = this.activeElixirZones.length - 1; i >= 0; i--) {
      const zone = this.activeElixirZones[i];
      zone.remaining -= dt;
      zone.tickAccum += dt;
      zone.accentGroup.rotation.y = elapsed * 1.4;

      if (zone.remaining < 1.0) {
        zone.innerDiscMat.opacity = Math.max(0, zone.remaining * 0.25);
        zone.outerRingMat.opacity = Math.max(0, zone.remaining * 0.8);
      }

      // Continuous Invisible Area check (Volt-Mirage Elixir)
      if (zone.elixirId === 'volt_stealth') {
        for (let j = 0; j < this.entities.length; j++) {
          const unit = this.entities[j];
          if (!unit.alive || unit.team !== zone.team || unit.type !== 'hero') continue;
          if (Math.hypot(unit.x - zone.x, unit.z - zone.z) <= zone.radius) {
            unit.stealthed = true;
            unit.speedBuffTimer = Math.max(unit.speedBuffTimer, 0.35);
          }
        }
      }

      // Continuous Cryo Block Area slow check
      if (zone.elixirId === 'cryo_block') {
        for (let j = 0; j < this.entities.length; j++) {
          const unit = this.entities[j];
          if (!unit.alive || unit.team === zone.team) continue;
          if (unit.type === 'tower' || unit.type === 'base') continue;
          if (Math.hypot(unit.x - zone.x, unit.z - zone.z) <= zone.radius + 1.2) {
            unit.slowTimer = Math.max(unit.slowTimer, 0.5);
          }
        }
      }

      // 0.5s Periodic Tick for Pyro Damaged Area & Vitae Healing Area
      if (zone.tickAccum >= 0.5) {
        zone.tickAccum -= 0.5;
        for (let j = 0; j < this.entities.length; j++) {
          const unit = this.entities[j];
          if (!unit.alive) continue;
          const d = Math.hypot(unit.x - zone.x, unit.z - zone.z) - unit.radius;
          if (d > zone.radius) continue;

          if (zone.elixirId === 'pyro_damage' && unit.team !== zone.team) {
            if (unit.type !== 'tower' && unit.type !== 'base') {
              unit.armorDebuffTimer = 2.0;
              this.applyDamage(player, unit, 28, true);
            }
          } else if (zone.elixirId === 'vitae_heal' && unit.team === zone.team) {
            if (unit.type === 'hero' || unit.type === 'minion') {
              const prevHp = unit.hp;
              unit.hp = Math.min(unit.maxHp, unit.hp + 35);
              if (unit.type === 'hero') {
                unit.mana = Math.min(unit.maxMana, unit.mana + 15);
              }
              if (unit.hp - prevHp >= 10 && unit.isPlayer) {
                this.spawnFloatingText(unit.x, unit.z, `+${Math.round(unit.hp - prevHp)}`, '#34d399', false);
              }
            }
          }
        }
      }

      if (zone.remaining <= 0) {
        this.matchGroup.remove(zone.group);
        this.activeElixirZones.splice(i, 1);
      }
    }

    // 4. Update Active Deployable Objects (Duration, Proximity Triggers, & Aura Pulses)
    for (let i = 0; i < this.entities.length; i++) {
      const ent = this.entities[i];
      if (!ent.alive || ent.type !== 'deployable' || !ent.deployableId) continue;

      if (ent.durationTimer !== undefined) {
        ent.durationTimer -= dt;
        if (ent.durationTimer <= 0) {
          this.handleEntityDeath(undefined, ent);
          continue;
        }
      }

      const rig = this.deployableRigs.get(ent.id);
      if (rig) {
        updateDeployableRigVisuals(
          rig,
          ent.deployableId,
          ent.deployableState || 'normal',
          elapsed,
          ent.hitFlashTimer
        );
      }

      // Check if transformed into a Cryo-Freeze Trap -> Shatters when an enemy gets within 3.6m!
      if (ent.deployableState === 'cryo_trap') {
        const hostile = this.findNearestHostile(ent, 3.6, false);
        if (hostile) {
          this.triggerCryoTrapShatter(ent);
          continue;
        }
      }

      // Snap-Trap proximity trigger
      if (ent.deployableId === 'snap_trap') {
        const hostile = this.findNearestHostile(ent, 2.35, false);
        if (hostile) {
          const isPyroMine = ent.deployableState === 'pyro_infused';
          const blastRadius = isPyroMine ? 5.0 : 2.8;
          const blastDmg = isPyroMine ? 215 : 125;
          this.vfx.spawnShockwave(
            ent.x,
            ent.z,
            isPyroMine ? 0xf97316 : 0xef4444,
            blastRadius,
            0.5
          );
          this.vfx.spawnBurstParticles(
            ent.x,
            0.9,
            ent.z,
            isPyroMine ? 0xf97316 : 0xef4444,
            14,
            8.0
          );
          this.spawnFloatingText(
            ent.x,
            ent.z,
            isPyroMine ? 'INFERNO MINE TRIGGERED!' : 'SNAP-TRAP TRIGGERED!',
            '#f87171',
            true
          );
          this.applyAoeDamage(player || ent, ent.x, ent.z, blastRadius, blastDmg, 1.25, 2.5);
          this.handleEntityDeath(undefined, ent);
          continue;
        }
      }

      // Aether Totem periodic pulses (Heal Aura or Pyro Solar Flare Turret)
      if (ent.deployableId === 'aether_totem') {
        ent.actionPulseTimer = (ent.actionPulseTimer || 1.0) - dt;
        if (ent.actionPulseTimer <= 0) {
          ent.actionPulseTimer = 1.0;
          if (ent.deployableState === 'pyro_infused') {
            this.vfx.spawnShockwave(ent.x, ent.z, 0xf97316, 5.2, 0.38);
            this.applyAoeDamage(player || ent, ent.x, ent.z, 5.2, 85, 0, 1.2);
          } else {
            const healRadius = ent.deployableState === 'vitae_overcharged' ? 7.5 : 4.2;
            const healAmount = ent.deployableState === 'vitae_overcharged' ? 75 : 24;
            for (let j = 0; j < this.entities.length; j++) {
              const ally = this.entities[j];
              if (!ally.alive || ally.team !== ent.team) continue;
              if (ally.type !== 'hero' && ally.type !== 'minion') continue;
              if (Math.hypot(ally.x - ent.x, ally.z - ent.z) <= healRadius) {
                ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);
                if (ent.deployableState === 'vitae_overcharged') {
                  ally.shield = Math.max(ally.shield, 90);
                }
              }
            }
          }
        }
      }
    }

    // Apply semi-transparent stealth shimmer to hero rigs inside Volt-Mirage Invisible Area
    for (let i = 0; i < this.entities.length; i++) {
      const ent = this.entities[i];
      if (ent.type !== 'hero') continue;
      const rig = this.heroRigs.get(ent.id);
      if (rig) {
        rig.root.scale.setScalar(ent.stealthed ? 0.94 : 1.0);
      }
    }
  }

  public setActionIndicator(mode: 'none' | 'attack' | SkillSlotIndex) {
    this.activeIndicatorMode = mode;
    if (mode === 'none' && this.aimingSkillSlot === null) {
      this.vfx.showTacticalIndicator({
        shape: 'none',
        originX: 0,
        originZ: 0,
        aimX: 0,
        aimZ: 0,
        range: 1,
        aoeRadius: 1,
        colorHex: 0xffffff,
      });
    } else {
      const player = this.getPlayerEntity();
      const effectiveMode = this.aimingSkillSlot !== null ? this.aimingSkillSlot : mode;
      if (player && player.alive && effectiveMode !== 'none') {
        this.showPlayerActionIndicator(player, effectiveMode, 0.25);
      }
    }
  }

  public startSkillAim(slot: SkillSlotIndex) {
    const player = this.getPlayerEntity();
    if (!player || !player.alive) return;
    this.aimingSkillSlot = slot;
    this.dragAimActive = false;
    this.showPlayerActionIndicator(player, slot, 0.35);
    this.emitHudSnapshot();
  }

  public updateSkillDragAim(slot: SkillSlotIndex, normX: number, normZ: number) {
    const player = this.getPlayerEntity();
    if (!player || !player.alive) return;
    this.aimingSkillSlot = slot;
    const mag = Math.hypot(normX, normZ);
    if (mag > 0.06) {
      this.dragAimActive = true;
      this.dragAimX = normX;
      this.dragAimZ = normZ;
    } else {
      this.dragAimActive = false;
    }
    this.showPlayerActionIndicator(player, slot, 0.25);
  }

  public finishSkillDragAim(slot: SkillSlotIndex, wasDragged: boolean) {
    const player = this.getPlayerEntity();
    if (!player || !player.alive) {
      this.cancelSkillAim();
      return;
    }

    if (wasDragged) {
      // Player dragged on the skill button to aim: cast immediately toward drag direction
      this.triggerPlayerSkill(slot);
      this.aimingSkillSlot = null;
      this.dragAimActive = false;
      this.emitHudSnapshot();
    } else {
      // Single tap/click on skill button: keep Aim Mode active on ground so player can steer & click arena (or tap again to fire)
      this.aimingSkillSlot = slot;
      this.dragAimActive = false;
      this.showPlayerActionIndicator(player, slot, 0.5);
      this.emitHudSnapshot();
    }
  }

  public cancelSkillAim() {
    this.aimingSkillSlot = null;
    this.dragAimActive = false;
    if (this.activeIndicatorMode === 'none') {
      this.vfx.showTacticalIndicator({
        shape: 'none',
        originX: 0,
        originZ: 0,
        aimX: 0,
        aimZ: 0,
        range: 1,
        aoeRadius: 1,
        colorHex: 0xffffff,
      });
    }
    this.emitHudSnapshot();
  }

  private getSkillIndicatorShape(effectType: SkillEffectType): IndicatorShape {
    switch (effectType) {
      case 'cleave_slam':
      case 'arrow_volley':
      case 'crystal_quake':
        return 'cone';
      case 'valor_charge':
      case 'astral_phase':
      case 'gale_stride':
      case 'sovereign_arrow':
        return 'line';
      case 'earthshatter':
      case 'void_nova':
      case 'starfall_cataclysm':
      case 'shadow_bind':
      case 'avalanche_crash':
        return 'aoe_target';
      case 'mending_veil':
      case 'twilight_sanctuary':
      case 'monolith_bulwark':
      default:
        return 'aoe_self';
    }
  }

  private getPlayerAimWorldPos(
    player: CombatEntity,
    mode?: 'attack' | SkillSlotIndex
  ): { aimX: number; aimZ: number } {
    const def = player.heroId ? HERO_DEFINITIONS[player.heroId] : undefined;
    const maxRange =
      typeof mode === 'number' && def
        ? Math.max(3.5, def.skills[mode].range)
        : player.attackRange;

    // 1. Priority: Active Drag-to-Aim on the Skill Button (360° steerable vector)
    if (this.dragAimActive) {
      const mag = Math.hypot(this.dragAimX, this.dragAimZ);
      if (mag > 0.05) {
        const clampedMag = Math.min(1, mag);
        const nx = this.dragAimX / mag;
        const nz = this.dragAimZ / mag;
        return {
          aimX: player.x + nx * maxRange * clampedMag,
          aimZ: player.z + nz * maxRange * clampedMag,
        };
      }
    }

    // 2. Priority: PC Mouse / Pointer World Cursor when aiming
    if (this.input.cursorWorldX !== 0 || this.input.cursorWorldZ !== 0) {
      return {
        aimX: this.input.cursorWorldX,
        aimZ: this.input.cursorWorldZ,
      };
    }

    // 3. Priority: Virtual Joystick direction
    const joyMag = Math.hypot(this.input.joystickX, this.input.joystickY);
    if (joyMag > 0.1) {
      return {
        aimX: player.x + (this.input.joystickX / joyMag) * maxRange,
        aimZ: player.z + (this.input.joystickY / joyMag) * maxRange,
      };
    }

    // 4. Priority: Current locked hostile target
    if (player.targetEntityId) {
      const t = this.entities.find((e) => e.id === player.targetEntityId && e.alive);
      if (t) {
        return { aimX: t.x, aimZ: t.z };
      }
    }

    // 5. Fallback: Hero current facing direction
    return {
      aimX: player.x + Math.sin(player.rotationY) * maxRange,
      aimZ: player.z + Math.cos(player.rotationY) * maxRange,
    };
  }

  private showPlayerActionIndicator(
    player: CombatEntity,
    mode: 'attack' | SkillSlotIndex,
    holdSeconds = 0.42
  ) {
    if (!player.heroId) return;
    const def = HERO_DEFINITIONS[player.heroId];
    const { aimX, aimZ } = this.getPlayerAimWorldPos(player, mode);

    if (mode === 'attack') {
      this.vfx.showTacticalIndicator({
        shape: 'attack',
        originX: player.x,
        originZ: player.z,
        aimX,
        aimZ,
        range: player.attackRange,
        aoeRadius: 1.4,
        colorHex: 0xfbbf24,
        holdSeconds,
      });
    } else {
      const skill = def.skills[mode];
      const shape = this.getSkillIndicatorShape(skill.effectType);
      this.vfx.showTacticalIndicator({
        shape,
        originX: player.x,
        originZ: player.z,
        aimX,
        aimZ,
        range: skill.range,
        aoeRadius: skill.radius,
        colorHex: def.accentColor,
        holdSeconds,
      });
    }
  }

  public triggerPlayerBasicAttack() {
    const player = this.getPlayerEntity();
    if (!player || !player.alive) return;

    // Always display Basic Attack Range Indicator when triggered
    this.showPlayerActionIndicator(player, 'attack', 0.55);

    let bestTarget: CombatEntity | null = null;
    let bestDist = player.attackRange + 4.5;

    for (const other of this.entities) {
      if (!other.alive || other.team === player.team) continue;
      const dist = Math.hypot(other.x - player.x, other.z - player.z) - other.radius;
      if (dist < bestDist) {
        bestDist = dist;
        bestTarget = other;
      }
    }

    if (bestTarget) {
      player.targetEntityId = bestTarget.id;
      player.moveTargetX = null;
      player.moveTargetZ = null;
      const distToTarget =
        Math.hypot(bestTarget.x - player.x, bestTarget.z - player.z) - bestTarget.radius;
      if (distToTarget <= player.attackRange && player.attackTimer <= 0) {
        this.performBasicAttack(player, bestTarget);
      }
    } else if (player.attackTimer <= 0) {
      player.attackTimer = player.attackCooldown * 0.6;
      player.animState = 'attack';
      player.animTime = 0;
      player.animLockTimer = 0.32;
      const def = HERO_DEFINITIONS[player.heroId!];
      soundEngine.playBasicAttack(def.stats.attackRange > 5);
      this.vfx.spawnSlashArc(
        player.x,
        player.z,
        player.rotationY,
        def.accentColor,
        1.75,
        0.28
      );
      this.vfx.spawnShockwave(
        player.x + Math.sin(player.rotationY) * 2.0,
        player.z + Math.cos(player.rotationY) * 2.0,
        def.accentColor,
        1.8,
        0.25
      );
    }
  }

  public triggerPlayerSkill(slot: SkillSlotIndex, explicitAimX?: number, explicitAimZ?: number) {
    const player = this.getPlayerEntity();
    if (!player || !player.alive || player.stunTimer > 0) return;

    // Show skill indicator even if on cooldown / low mana so player sees range feedback
    this.showPlayerActionIndicator(player, slot, 0.52);

    if (player.skillTimers[slot] > 0) return;

    const def = HERO_DEFINITIONS[player.heroId!];
    const skill = def.skills[slot];
    if (player.mana < skill.manaCost) return;

    const fallbackAim = this.getPlayerAimWorldPos(player, slot);
    const aimX = explicitAimX !== undefined ? explicitAimX : fallbackAim.aimX;
    const aimZ = explicitAimZ !== undefined ? explicitAimZ : fallbackAim.aimZ;
    this.aimingSkillSlot = null;
    this.dragAimActive = false;
    this.castHeroSkill(player, slot, aimX, aimZ);
    this.emitHudSnapshot();
  }

  private handleHotkeySkillPress(slot: SkillSlotIndex) {
    if (this.aimingSkillSlot === slot) {
      // Second press confirms and fires the aimed skill toward the cursor!
      this.triggerPlayerSkill(slot);
    } else {
      // First press activates Aim Mode so the player can see & steer the indicator
      this.startSkillAim(slot);
    }
  }

  public centerCameraOnPlayer() {
    const player = this.getPlayerEntity();
    this.camPanOffsetX = 0;
    this.camPanOffsetZ = 0;
    if (player) {
      this.camFocusX = player.x;
      this.camFocusZ = player.z;
    }
    this.emitHudSnapshot();
  }

  public setCameraFocus(worldX: number, worldZ: number) {
    this.camPanOffsetX = 0;
    this.camPanOffsetZ = 0;
    this.camFocusX = THREE.MathUtils.clamp(worldX, -MAP_HALF_SIZE, MAP_HALF_SIZE);
    this.camFocusZ = THREE.MathUtils.clamp(worldZ, -MAP_HALF_SIZE, MAP_HALF_SIZE);
    this.emitHudSnapshot();
  }

  public zoomCameraBy(delta: number) {
    this.targetCamZoom = THREE.MathUtils.clamp(this.targetCamZoom + delta, 0.55, 1.65);
    this.emitHudSnapshot();
  }

  public resetCameraZoom() {
    this.targetCamZoom = 1.0;
    this.emitHudSnapshot();
  }

  public scrollCameraBy(dx: number, dz: number) {
    if (this.settings.cameraLocked) {
      this.camPanOffsetX = THREE.MathUtils.clamp(
        this.camPanOffsetX + dx,
        -MAP_HALF_SIZE,
        MAP_HALF_SIZE
      );
      this.camPanOffsetZ = THREE.MathUtils.clamp(
        this.camPanOffsetZ + dz,
        -MAP_HALF_SIZE,
        MAP_HALF_SIZE
      );
    } else {
      this.camFocusX = THREE.MathUtils.clamp(
        this.camFocusX + dx,
        -MAP_HALF_SIZE,
        MAP_HALF_SIZE
      );
      this.camFocusZ = THREE.MathUtils.clamp(
        this.camFocusZ + dz,
        -MAP_HALF_SIZE,
        MAP_HALF_SIZE
      );
    }
    this.emitHudSnapshot();
  }

  public setVirtualJoystick(dx: number, dy: number) {
    this.input.setVirtualJoystick(dx, dy);
  }

  private castHeroSkill(
    caster: CombatEntity,
    slot: SkillSlotIndex,
    targetX: number,
    targetZ: number
  ) {
    if (!caster.heroId) return;
    const def = HERO_DEFINITIONS[caster.heroId];
    const skill = def.skills[slot];

    caster.mana = Math.max(0, caster.mana - skill.manaCost);
    const effectiveCd = skill.cooldown * (1 - caster.cooldownReduction);
    caster.skillTimers[slot] = effectiveCd;
    caster.animState = 'skill';
    caster.animTime = 0;
    caster.animLockTimer = 0.48;

    const startX = caster.x;
    const startZ = caster.z;
    const dx = targetX - caster.x;
    const dz = targetZ - caster.z;
    const dist = Math.hypot(dx, dz) || 1;
    const dirX = dx / dist;
    const dirZ = dz / dist;
    caster.rotationY = Math.atan2(dirX, dirZ);

    if (caster.isPlayer) {
      this.showPlayerActionIndicator(caster, slot, 0.48);
    }

    soundEngine.playSkillCast(caster.heroId, slot);
    const scaledDamage = skill.damage + (caster.level - 1) * 24;

    switch (skill.effectType) {
      // 1. VANGUARD (FIGHTER)
      case 'cleave_slam': {
        this.vfx.spawnSlashArc(caster.x, caster.z, caster.rotationY, def.accentColor, 2.6, 0.4);
        this.vfx.spawnSlashArc(caster.x, caster.z, caster.rotationY + Math.PI, 0xfbbf24, 2.2, 0.36);
        this.vfx.spawnShockwave(caster.x, caster.z, def.accentColor, skill.radius, 0.45);
        this.vfx.spawnBurstParticles(caster.x, 1.2, caster.z, def.accentColor, 18, 9.0);
        this.applyAoeDamage(caster, caster.x, caster.z, skill.radius, scaledDamage, 0, 0.5);
        break;
      }
      case 'valor_charge': {
        const dash = Math.min(skill.range, dist);
        caster.x = THREE.MathUtils.clamp(caster.x + dirX * dash, -MAP_HALF_SIZE, MAP_HALF_SIZE);
        caster.z = THREE.MathUtils.clamp(caster.z + dirZ * dash, -MAP_HALF_SIZE, MAP_HALF_SIZE);
        caster.shield = Math.max(caster.shield, 220 + caster.level * 30);
        this.vfx.spawnDashTrail(startX, startZ, caster.x, caster.z, def.accentColor, 2.4);
        this.vfx.spawnSanctuaryDome(caster.x, caster.z, 0xfbbf24, skill.radius, 0.48);
        this.vfx.spawnShockwave(caster.x, caster.z, def.accentColor, skill.radius, 0.42);
        this.applyAoeDamage(caster, caster.x, caster.z, skill.radius, scaledDamage, 0, 1.0);
        break;
      }
      case 'earthshatter': {
        const jump = Math.min(skill.range, dist);
        caster.x = THREE.MathUtils.clamp(caster.x + dirX * jump, -MAP_HALF_SIZE, MAP_HALF_SIZE);
        caster.z = THREE.MathUtils.clamp(caster.z + dirZ * jump, -MAP_HALF_SIZE, MAP_HALF_SIZE);
        this.vfx.spawnDashTrail(startX, startZ, caster.x, caster.z, def.accentColor, 2.0);
        this.vfx.spawnPillarStrike(caster.x, caster.z, def.accentColor, skill.radius, 0.72);
        this.vfx.spawnShockwave(caster.x, caster.z, 0xfbbf24, skill.radius * 1.1, 0.65);
        if (caster.isPlayer) this.camShakeAmount = 0.55;
        this.applyAoeDamage(caster, caster.x, caster.z, skill.radius, scaledDamage, 1.2, 2.0);
        break;
      }

      // 2. ARCANIST (MAGE)
      case 'void_nova': {
        const castDist = Math.min(skill.range, Math.max(2.5, dist));
        this.vfx.spawnBurstParticles(caster.x, 1.8, caster.z, def.accentColor, 10, 6.5);
        this.vfx.spawnProjectile({
          startX: caster.x,
          startY: 1.9,
          startZ: caster.z,
          targetEntityId: null,
          targetX: caster.x + dirX * castDist,
          targetZ: caster.z + dirZ * castDist,
          speed: 22,
          damage: scaledDamage,
          colorHex: def.accentColor,
          scale: 1.85,
          sourceTeam: caster.team,
          sourceEntityId: caster.id,
          aoeRadius: skill.radius,
          slowDuration: 2.8,
          isSkillNova: true,
        });
        break;
      }
      case 'astral_phase': {
        this.vfx.spawnSanctuaryDome(startX, startZ, def.accentColor, 2.6, 0.4);
        const blinkDist = Math.min(skill.range, dist);
        caster.x = THREE.MathUtils.clamp(caster.x + dirX * blinkDist, -MAP_HALF_SIZE, MAP_HALF_SIZE);
        caster.z = THREE.MathUtils.clamp(caster.z + dirZ * blinkDist, -MAP_HALF_SIZE, MAP_HALF_SIZE);
        caster.speedBuffTimer = 2.8;
        this.vfx.spawnDashTrail(startX, startZ, caster.x, caster.z, def.accentColor, 2.2);
        this.vfx.spawnSanctuaryDome(caster.x, caster.z, 0x38bdf8, skill.radius, 0.48);
        this.vfx.spawnShockwave(caster.x, caster.z, def.accentColor, skill.radius, 0.45);
        this.applyAoeDamage(caster, caster.x, caster.z, skill.radius, scaledDamage, 0, 1.5);
        break;
      }
      case 'starfall_cataclysm': {
        const castDist = Math.min(skill.range, Math.max(3.0, dist));
        const destX = caster.x + dirX * castDist;
        const destZ = caster.z + dirZ * castDist;
        this.vfx.spawnPillarStrike(destX, destZ, def.accentColor, skill.radius, 0.8);
        this.vfx.spawnSanctuaryDome(destX, destZ, 0x38bdf8, skill.radius * 0.9, 0.65);
        this.vfx.spawnShockwave(destX, destZ, def.accentColor, skill.radius, 0.72);
        if (caster.isPlayer) this.camShakeAmount = 0.52;
        this.applyAoeDamage(caster, destX, destZ, skill.radius, scaledDamage, 0.8, 3.0);
        break;
      }

      // 3. RANGER (MARKSMAN)
      case 'arrow_volley': {
        const baseAngle = Math.atan2(dirX, dirZ);
        this.vfx.spawnSlashArc(caster.x, caster.z, baseAngle, def.accentColor, 2.4, 0.34);
        this.vfx.spawnBurstParticles(caster.x, 1.5, caster.z, def.accentColor, 12, 8.0);
        for (let i = -2; i <= 2; i++) {
          const ang = baseAngle + i * 0.14;
          this.vfx.spawnProjectile({
            startX: caster.x,
            startY: 1.5,
            startZ: caster.z,
            targetEntityId: null,
            targetX: caster.x + Math.sin(ang) * skill.range,
            targetZ: caster.z + Math.cos(ang) * skill.range,
            speed: 29,
            damage: Math.round(scaledDamage * 0.58),
            colorHex: def.accentColor,
            scale: 1.25,
            sourceTeam: caster.team,
            sourceEntityId: caster.id,
            aoeRadius: 1.8,
            slowDuration: 1.2,
            isSkillNova: true,
          });
        }
        break;
      }
      case 'gale_stride': {
        const dash = Math.min(skill.range, dist);
        caster.x = THREE.MathUtils.clamp(caster.x + dirX * dash, -MAP_HALF_SIZE, MAP_HALF_SIZE);
        caster.z = THREE.MathUtils.clamp(caster.z + dirZ * dash, -MAP_HALF_SIZE, MAP_HALF_SIZE);
        caster.speedBuffTimer = 3.5;
        caster.hp = Math.min(caster.maxHp, caster.hp + 95);
        this.vfx.spawnDashTrail(startX, startZ, caster.x, caster.z, def.accentColor, 2.1);
        this.vfx.spawnSanctuaryDome(caster.x, caster.z, def.accentColor, 2.8, 0.45);
        this.vfx.spawnShockwave(caster.x, caster.z, def.accentColor, 3.0, 0.42);
        break;
      }
      case 'sovereign_arrow': {
        const endX = caster.x + dirX * skill.range;
        const endZ = caster.z + dirZ * skill.range;
        this.vfx.spawnDashTrail(caster.x, caster.z, endX, endZ, def.accentColor, 1.5);
        this.vfx.spawnBurstParticles(caster.x, 1.6, caster.z, 0xfef08a, 14, 9.0);
        this.vfx.spawnProjectile({
          startX: caster.x,
          startY: 1.6,
          startZ: caster.z,
          targetEntityId: null,
          targetX: endX,
          targetZ: endZ,
          speed: 35,
          damage: scaledDamage,
          colorHex: def.accentColor,
          scale: 2.25,
          sourceTeam: caster.team,
          sourceEntityId: caster.id,
          aoeRadius: skill.radius,
          slowDuration: 2.0,
          isSkillNova: true,
        });
        break;
      }

      // 4. WRAITH (SUPPORT)
      case 'shadow_bind': {
        const blinkDist = Math.min(skill.range, dist);
        caster.x = THREE.MathUtils.clamp(caster.x + dirX * blinkDist, -MAP_HALF_SIZE, MAP_HALF_SIZE);
        caster.z = THREE.MathUtils.clamp(caster.z + dirZ * blinkDist, -MAP_HALF_SIZE, MAP_HALF_SIZE);
        this.vfx.spawnDashTrail(startX, startZ, caster.x, caster.z, def.accentColor, 2.2);
        this.vfx.spawnSlashArc(caster.x, caster.z, caster.rotationY, def.accentColor, 2.4, 0.38);
        this.vfx.spawnSlashArc(caster.x, caster.z, caster.rotationY + Math.PI, 0x38bdf8, 2.4, 0.38);
        this.vfx.spawnShockwave(caster.x, caster.z, def.accentColor, skill.radius, 0.48);
        this.applyAoeDamage(caster, caster.x, caster.z, skill.radius, scaledDamage, 0, 2.8);
        break;
      }
      case 'mending_veil': {
        const healAmt = 190 + caster.level * 30;
        this.vfx.spawnSanctuaryDome(caster.x, caster.z, 0x34d399, skill.radius, 0.65);
        this.vfx.spawnShockwave(caster.x, caster.z, 0x34d399, skill.radius, 0.55);
        for (const ally of this.entities) {
          if (!ally.alive || ally.team !== caster.team || ally.type !== 'hero') continue;
          if (Math.hypot(ally.x - caster.x, ally.z - caster.z) <= skill.radius) {
            ally.hp = Math.min(ally.maxHp, ally.hp + healAmt);
            ally.shield = Math.max(ally.shield, 160 + caster.level * 25);
            this.spawnFloatingText(ally.x, ally.z, `+${healAmt}`, '#34d399', true);
            this.vfx.spawnSanctuaryDome(ally.x, ally.z, 0x38bdf8, 2.5, 0.5);
            this.vfx.spawnBurstParticles(ally.x, 1.0, ally.z, 0x34d399, 12, 6.5);
          }
        }
        break;
      }
      case 'twilight_sanctuary': {
        this.vfx.spawnPillarStrike(caster.x, caster.z, def.accentColor, skill.radius, 0.78);
        this.vfx.spawnSanctuaryDome(caster.x, caster.z, def.accentColor, skill.radius, 0.72);
        this.vfx.spawnShockwave(caster.x, caster.z, 0x34d399, skill.radius, 0.65);
        this.applyAoeDamage(caster, caster.x, caster.z, skill.radius, scaledDamage, 1.5, 2.5);
        for (const ally of this.entities) {
          if (!ally.alive || ally.team !== caster.team || ally.type !== 'hero') continue;
          if (Math.hypot(ally.x - caster.x, ally.z - caster.z) <= skill.radius) {
            ally.hp = Math.min(ally.maxHp, ally.hp + 180);
            this.spawnFloatingText(ally.x, ally.z, '+180', '#34d399', true);
          }
        }
        break;
      }

      // 5. COLOSSUS (TANK)
      case 'crystal_quake': {
        this.vfx.spawnCrystalSpikes(caster.x, caster.z);
        this.vfx.spawnSlashArc(caster.x, caster.z, caster.rotationY, def.accentColor, 2.6, 0.42);
        this.vfx.spawnShockwave(caster.x, caster.z, def.accentColor, skill.radius, 0.55);
        this.applyAoeDamage(caster, caster.x, caster.z, skill.radius, scaledDamage, 0.6, 2.2);
        break;
      }
      case 'monolith_bulwark': {
        caster.shield = 340 + caster.level * 45;
        caster.hp = Math.min(caster.maxHp, caster.hp + 140);
        this.spawnFloatingText(caster.x, caster.z, '+140', '#34d399', true);
        this.vfx.spawnSanctuaryDome(caster.x, caster.z, def.accentColor, skill.radius, 0.65);
        this.vfx.spawnCrystalSpikes(caster.x, caster.z);
        this.vfx.spawnShockwave(caster.x, caster.z, def.accentColor, skill.radius, 0.52);
        this.applyAoeDamage(caster, caster.x, caster.z, skill.radius, scaledDamage, 0, 1.5);
        break;
      }
      case 'avalanche_crash':
      default: {
        const charge = Math.min(skill.range, dist);
        caster.x = THREE.MathUtils.clamp(caster.x + dirX * charge, -MAP_HALF_SIZE, MAP_HALF_SIZE);
        caster.z = THREE.MathUtils.clamp(caster.z + dirZ * charge, -MAP_HALF_SIZE, MAP_HALF_SIZE);
        this.vfx.spawnDashTrail(startX, startZ, caster.x, caster.z, def.accentColor, 2.8);
        this.vfx.spawnPillarStrike(caster.x, caster.z, def.accentColor, skill.radius, 0.75);
        this.vfx.spawnCrystalSpikes(caster.x, caster.z);
        this.vfx.spawnShockwave(caster.x, caster.z, def.accentColor, skill.radius, 0.72);
        if (caster.isPlayer) this.camShakeAmount = 0.6;
        this.applyAoeDamage(caster, caster.x, caster.z, skill.radius, scaledDamage, 1.5, 2.5);
        break;
      }
    }
  }

  private applyAoeDamage(
    attacker: CombatEntity,
    centerX: number,
    centerZ: number,
    radius: number,
    damage: number,
    stunDuration: number,
    slowDuration: number
  ) {
    for (const target of this.entities) {
      if (!target.alive || target.team === attacker.team) continue;
      if (target.type === 'tower' || target.type === 'base') continue;
      const d = Math.hypot(target.x - centerX, target.z - centerZ) - target.radius;
      if (d <= radius) {
        this.applyDamage(attacker, target, damage, true);
        if (stunDuration > 0) target.stunTimer = Math.max(target.stunTimer, stunDuration);
        if (slowDuration > 0) target.slowTimer = Math.max(target.slowTimer, slowDuration);
      }
    }
  }

  private performBasicAttack(attacker: CombatEntity, target: CombatEntity) {
    attacker.attackTimer = attacker.attackCooldown;
    attacker.animState = 'attack';
    attacker.animTime = 0;
    attacker.animLockTimer = 0.34;

    const dx = target.x - attacker.x;
    const dz = target.z - attacker.z;
    attacker.rotationY = Math.atan2(dx, dz);

    const isRanged = attacker.attackRange > 4.5;
    if (attacker.isPlayer) {
      soundEngine.playBasicAttack(isRanged);
      this.showPlayerActionIndicator(attacker, 'attack', 0.42);
    }

    if (isRanged) {
      let colorHex = attacker.team === 'ally' ? 0x38bdf8 : 0xf87171;
      if (attacker.heroId) {
        colorHex = HERO_DEFINITIONS[attacker.heroId].accentColor;
      }
      this.vfx.spawnProjectile({
        startX: attacker.x,
        startY: attacker.type === 'tower' || attacker.type === 'base' ? 5.6 : 1.5,
        startZ: attacker.z,
        targetEntityId: target.id,
        targetX: target.x,
        targetZ: target.z,
        speed: attacker.type === 'tower' ? 24 : 26,
        damage: attacker.attackDamage,
        colorHex,
        scale: attacker.type === 'tower' || attacker.type === 'base' ? 1.45 : 1.0,
        sourceTeam: attacker.team,
        sourceEntityId: attacker.id,
      });
    } else {
      let slashColor = attacker.team === 'ally' ? 0x34d399 : 0xf87171;
      if (attacker.heroId) {
        slashColor = HERO_DEFINITIONS[attacker.heroId].accentColor;
        this.vfx.spawnSlashArc(attacker.x, attacker.z, attacker.rotationY, slashColor, 1.75, 0.26);
      }
      this.vfx.spawnShockwave(
        attacker.x + Math.sin(attacker.rotationY) * 1.4,
        attacker.z + Math.cos(attacker.rotationY) * 1.4,
        slashColor,
        1.65,
        0.22
      );
      this.applyDamage(attacker, target, attacker.attackDamage, false);
    }
  }

  private spawnFloatingText(
    worldX: number,
    worldZ: number,
    text: string,
    color: string,
    isCritOrSkill: boolean
  ) {
    if (this.damagePopups.length > 36) {
      this.damagePopups.shift();
    }
    const jitterX = (Math.random() - 0.5) * 1.1;
    const jitterZ = (Math.random() - 0.5) * 0.8;
    this.damagePopups.push({
      id: `dmg_${++this.damagePopupSeq}`,
      worldX: worldX + jitterX,
      worldY: 2.6 + Math.random() * 0.5,
      worldZ: worldZ + jitterZ,
      vx: (Math.random() - 0.5) * 1.2,
      vy: isCritOrSkill ? 3.4 : 2.7,
      text,
      color,
      isCritOrSkill,
      elapsed: 0,
      duration: isCritOrSkill ? 0.95 : 0.78,
    });
  }

  private applyDamage(
    attacker: CombatEntity | undefined,
    target: CombatEntity,
    rawDamage: number,
    isSkill = false
  ) {
    if (!target.alive) return;
    target.hitFlashTimer = 0.14;

    if (target.type === 'monster' && attacker && attacker.alive) {
      target.targetEntityId = attacker.id;
    }

    const armorMultiplier = target.armorDebuffTimer && target.armorDebuffTimer > 0 ? 1.18 : 1.0;
    const roundedDmg = Math.max(1, Math.round(rawDamage * armorMultiplier));

    // If an enemy attacks a Cryo-Trap deployable, it immediately shatters and freezes them!
    if (
      target.type === 'deployable' &&
      target.deployableState === 'cryo_trap' &&
      attacker &&
      attacker.team !== target.team
    ) {
      this.triggerCryoTrapShatter(target);
      return;
    }

    // Spawn Floating Damage Output Text ("buat text damage output")
    const player = this.getPlayerEntity();
    const isPlayerInvolved =
      attacker?.isPlayer ||
      target.isPlayer ||
      (player && Math.hypot(target.x - player.x, target.z - player.z) < 28);

    if (isPlayerInvolved) {
      let dmgColor = '#f8fafc';
      let isBig = isSkill;
      if (attacker?.isPlayer) {
        if (isSkill) {
          dmgColor = attacker.heroId ? HERO_DEFINITIONS[attacker.heroId].accentCss : '#38bdf8';
          isBig = true;
        } else {
          dmgColor = '#fbbf24'; // Crisp gold-amber for player basic attack damage output
        }
      } else if (target.isPlayer) {
        dmgColor = '#fb7185'; // Rose-red when player takes damage
        isBig = isSkill || roundedDmg >= 90;
      } else if (attacker?.team === 'ally') {
        dmgColor = '#bae6fd';
      } else {
        dmgColor = '#fca5a5';
      }

      this.spawnFloatingText(
        target.x,
        target.z,
        `-${roundedDmg}`,
        dmgColor,
        Boolean(isBig || attacker?.isPlayer)
      );
    }

    let remainingDmg = roundedDmg;
    if (target.shield > 0) {
      const absorbed = Math.min(target.shield, remainingDmg);
      target.shield -= absorbed;
      remainingDmg -= absorbed;
    }

    target.hp = Math.max(0, target.hp - remainingDmg);
    if (target.hp <= 0) {
      this.handleEntityDeath(attacker, target);
    }
  }

  private handleEntityDeath(killer: CombatEntity | undefined, victim: CombatEntity) {
    victim.alive = false;
    victim.hp = 0;
    victim.shield = 0;
    victim.targetEntityId = null;
    victim.moveTargetX = null;
    victim.moveTargetZ = null;

    const deathColor =
      victim.team === 'ally' ? 0x10b981 : victim.team === 'enemy' ? 0xef4444 : 0xf59e0b;
    this.vfx.spawnShockwave(victim.x, victim.z, deathColor, victim.radius * 2.4, 0.5);

    const player = this.getPlayerEntity();
    if (player && victim.team !== 'ally') {
      const distToPlayer = Math.hypot(victim.x - player.x, victim.z - player.z);
      const killerIsPlayer = killer?.id === player.id;
      if (killerIsPlayer || distToPlayer < 22) {
        const xpGain =
          victim.type === 'hero'
            ? 95
            : victim.type === 'tower'
              ? 120
              : victim.type === 'monster'
                ? 65
                : 28;
        const goldGain =
          victim.type === 'hero'
            ? 200
            : victim.type === 'tower'
              ? 250
              : victim.type === 'monster'
                ? 85
                : 35;
        this.grantPlayerProgress(xpGain, killerIsPlayer ? goldGain : Math.round(goldGain * 0.5));
      }
    }

    if (victim.type === 'hero') {
      victim.respawnTimer = victim.maxRespawnTime + victim.level * 1.5;
      const rig = this.heroRigs.get(victim.id);
      if (rig) rig.root.visible = false;

      if (victim.team === 'enemy') {
        this.allyKills++;
        if (killer?.isPlayer) this.playerKills++;
        else this.playerAssists++;
      } else {
        this.enemyKills++;
        if (victim.isPlayer) this.playerDeaths++;
      }
    } else if (victim.type === 'minion') {
      const rig = this.minionRigs.get(victim.id);
      if (rig) {
        this.matchGroup.remove(rig.root);
        this.minionRigs.delete(victim.id);
      }
    } else if (victim.type === 'monster') {
      victim.respawnTimer = victim.maxRespawnTime;
      const rig = this.monsterRigs.get(victim.id);
      if (rig) rig.root.visible = false;
      if (killer?.isPlayer && player) {
        player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * 0.15));
        player.mana = Math.min(player.maxMana, player.mana + Math.round(player.maxMana * 0.25));
      }
    } else if (victim.type === 'deployable') {
      const rig = this.deployableRigs.get(victim.id);
      if (rig) {
        this.matchGroup.remove(rig.root);
        this.deployableRigs.delete(victim.id);
      }
    } else if (victim.type === 'tower') {
      const rig = this.structureRigs.get(victim.id);
      if (rig) rig.root.visible = false;
    } else if (victim.type === 'base') {
      const rig = this.structureRigs.get(victim.id);
      if (rig) rig.root.visible = false;
      this.winner = victim.team === 'enemy' ? 'ally' : 'enemy';
    }
  }

  private grantPlayerProgress(xp: number, gold: number) {
    this.playerGold += gold;
    this.playerXp += xp;
    const player = this.getPlayerEntity();
    while (this.playerXp >= this.playerMaxXp && this.playerLevel < 15) {
      this.playerXp -= this.playerMaxXp;
      this.playerLevel++;
      this.playerMaxXp = Math.round(this.playerMaxXp * 1.25);
      if (player) {
        player.level = this.playerLevel;
        player.maxHp += 110;
        player.hp = Math.min(player.maxHp, player.hp + 180);
        player.maxMana += 45;
        player.mana = Math.min(player.maxMana, player.mana + 100);
        player.attackDamage += 12;
        this.vfx.spawnShockwave(player.x, player.z, 0xf59e0b, 3.8, 0.6);
      }
      soundEngine.playLevelUp();
    }
  }

  // ============================================================================
  // MAIN SIMULATION LOOP (60FPS + SOFTWARE GL FENCE SYNC)
  // ============================================================================

  private startLoop() {
    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (this.disposed) return;
      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const elapsed = this.clock.getElapsedTime();

      this.updateFrame(dt, elapsed);

      if (this.isMobileDevice && this.renderer.shadowMap.enabled && this.screen === 'games') {
        this.shadowTick = (this.shadowTick + 1) % 3;
        if (this.shadowTick === 0) {
          this.dirLight.shadow.needsUpdate = true;
        }
      }

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    this.frameId = requestAnimationFrame(tick);
  }

  private updateFrame(dt: number, elapsed: number) {
    if (this.screen === 'lobby' || this.screen === 'pick') {
      this.updateLobbyAndPick(dt, elapsed);
      this.input.endFrame();
      return;
    }

    if (this.input.consumeJustPressed('Escape')) {
      if (this.aimingSkillSlot !== null || this.aimingTacticalId !== null) {
        this.cancelSkillAim();
        this.cancelTacticalAim();
      }
    }

    if (!this.isPaused && !this.winner) {
      this.updateMatchSimulation(dt, elapsed);
    }

    this.arenaStage.update(dt, elapsed);
    this.updateArenaCamera(dt);
    this.vfx.updateVisuals(dt);

    this.snapshotAccum += dt;
    if (this.snapshotAccum >= 0.066) {
      this.snapshotAccum = 0;
      this.emitHudSnapshot();
    }

    this.input.endFrame();
  }

  private updateLobbyAndPick(dt: number, elapsed: number) {
    this.lobbyStage.centralCrystal.position.y = 4.2 + Math.sin(elapsed * 1.8) * 0.35;
    this.lobbyStage.centralCrystal.rotation.y = elapsed * 0.65;
    this.lobbyStage.floatingRings[0].rotation.x = elapsed * 0.7;
    this.lobbyStage.floatingRings[0].rotation.y = elapsed * 0.5;
    this.lobbyStage.floatingRings[1].rotation.y = -elapsed * 0.8;
    this.lobbyStage.floatingRings[1].rotation.z = elapsed * 0.4;
    this.lobbyStage.particles.rotation.y = elapsed * 0.08;

    if (this.previewHeroRig) {
      this.previewAnimTimer += dt;
      if (
        (this.previewAnimState === 'attack' && this.previewAnimTimer > 0.42) ||
        (this.previewAnimState === 'skill' && this.previewAnimTimer > 0.65)
      ) {
        this.previewAnimState = 'idle';
        this.previewAnimTimer = 0;
        this.previewShieldActive = false;
      }

      updateHeroRigAnimation(
        this.previewHeroRig,
        this.previewHeroId,
        this.previewAnimState,
        this.previewAnimState === 'idle' || this.previewAnimState === 'walk'
          ? elapsed
          : this.previewAnimTimer,
        0,
        this.previewShieldActive
      );

      if (!this.isDraggingCamera) {
        this.previewTurntableAngle += dt * 0.35;
      }
      this.previewHeroRig.root.rotation.y = Math.sin(this.previewTurntableAngle) * 0.42;
    }

    this.vfx.updateVisuals(dt);

    if (this.screen === 'lobby') {
      // Wide sanctuary & pedestal view
      const targetX = Math.sin(elapsed * 0.22) * 2.8;
      const targetY = 4.8;
      const targetZ = 11.4 + Math.cos(elapsed * 0.22) * 0.9;
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetX, 4, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetY, 4, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetZ, 4, dt);
      this.camera.lookAt(0, 2.0, -0.5);
    } else {
      // PICK Page: Hero model zoomed out cleanly so the full hero, weapon, and pedestal fit nicely
      const isNarrow = this.camera.aspect < 1.15;
      const baseDistanceZ = isNarrow ? 9.8 : 8.85;
      const targetX = 0;
      const targetY = (isNarrow ? 3.15 : 2.95) * this.pickCamZoom;
      const targetZ = 1.5 + (baseDistanceZ - 1.5) * this.pickCamZoom;
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetX, 5, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetY, 5, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetZ, 5, dt);
      this.camera.lookAt(0, 1.62, 1.5);
    }
  }

  private updateMatchSimulation(dt: number, elapsed: number) {
    this.matchTime += dt;

    this.waveTimer -= dt;
    if (this.waveTimer <= 0) {
      this.waveTimer = 22.0;
      this.spawnMinionWave();
    }

    // Live Tactical Ground Indicator while aiming a skill, tactical item, hovering HUD buttons, or holding KeyA
    const playerForInd = this.getPlayerEntity();
    if (playerForInd && playerForInd.alive) {
      if (this.aimingTacticalId !== null) {
        this.showPlayerTacticalIndicator(playerForInd, this.aimingTacticalId, 0.18);
      } else if (this.aimingSkillSlot !== null) {
        this.showPlayerActionIndicator(playerForInd, this.aimingSkillSlot, 0.18);
      } else if (this.activeIndicatorMode !== 'none') {
        this.showPlayerActionIndicator(playerForInd, this.activeIndicatorMode, 0.15);
      } else if (
        this.settings.controlScheme === 'right_click' &&
        this.input.heldKeys.has('KeyA')
      ) {
        this.showPlayerActionIndicator(playerForInd, 'attack', 0.15);
      }
    }

    // PC Hotkeys for 3 Active Skills (Q, W, E)
    if (this.input.consumeJustPressed('KeyQ')) {
      this.handleHotkeySkillPress(0);
    }
    if (this.input.consumeJustPressed('KeyW') && this.settings.controlScheme === 'right_click') {
      this.handleHotkeySkillPress(1);
    }
    if (this.input.consumeJustPressed('KeyE')) {
      this.handleHotkeySkillPress(2);
    }

    // PC Hotkeys for Tactical Belt: 1-4 (4 Elixirs) and Z, X, C, V (4 Deployable Objects)
    const handleTacticalHotkey = (itemId: TacticalItemId) => {
      if (this.aimingTacticalId === itemId) {
        this.useTacticalItem(itemId);
      } else {
        this.startTacticalAim(itemId);
      }
    };
    if (this.input.consumeJustPressed('Digit1')) handleTacticalHotkey('pyro_damage');
    if (this.input.consumeJustPressed('Digit2')) handleTacticalHotkey('cryo_block');
    if (this.input.consumeJustPressed('Digit3')) handleTacticalHotkey('volt_stealth');
    if (this.input.consumeJustPressed('Digit4')) handleTacticalHotkey('vitae_heal');
    if (this.input.consumeJustPressed('KeyZ')) handleTacticalHotkey('barricade');
    if (this.input.consumeJustPressed('KeyX')) handleTacticalHotkey('snap_trap');
    if (this.input.consumeJustPressed('KeyC')) handleTacticalHotkey('aether_totem');
    if (this.input.consumeJustPressed('KeyV')) handleTacticalHotkey('prismatic_pylon');

    if (this.input.consumeJustPressed('Space')) {
      if (this.settings.controlScheme === 'wasd') {
        this.triggerPlayerBasicAttack();
      } else {
        this.centerCameraOnPlayer();
      }
    }

    this.updateTacticalSystems(dt, elapsed);
    this.updateProjectiles(dt);
    this.entities = this.entities.filter(
      (e) => !((e.type === 'minion' || e.type === 'deployable') && !e.alive)
    );

    for (let i = 0; i < this.entities.length; i++) {
      const ent = this.entities[i];

      if (!ent.alive) {
        if (ent.respawnTimer > 0) {
          ent.respawnTimer -= dt;
          if (ent.respawnTimer <= 0) {
            this.respawnEntity(ent);
          }
        }
        continue;
      }

      if (ent.attackTimer > 0) ent.attackTimer = Math.max(0, ent.attackTimer - dt);
      for (let s = 0; s < 3; s++) {
        if (ent.skillTimers[s] > 0) {
          ent.skillTimers[s] = Math.max(0, ent.skillTimers[s] - dt);
        }
      }
      if (ent.stunTimer > 0) ent.stunTimer = Math.max(0, ent.stunTimer - dt);
      if (ent.slowTimer > 0) ent.slowTimer = Math.max(0, ent.slowTimer - dt);
      if (ent.speedBuffTimer > 0) ent.speedBuffTimer = Math.max(0, ent.speedBuffTimer - dt);
      if (ent.hitFlashTimer > 0) ent.hitFlashTimer = Math.max(0, ent.hitFlashTimer - dt);
      if (ent.animLockTimer > 0) ent.animLockTimer = Math.max(0, ent.animLockTimer - dt);

      ent.animTime += dt;

      // Ambient Mana & Fountain HP Regen for Heroes
      if (ent.type === 'hero') {
        ent.mana = Math.min(ent.maxMana, ent.mana + 12 * dt);
        const basePos = ent.team === 'ally' ? ALLY_BASE_POS : ENEMY_BASE_POS;
        if (Math.hypot(ent.x - basePos.x, ent.z - basePos.z) < 13) {
          ent.hp = Math.min(ent.maxHp, ent.hp + ent.maxHp * 0.1 * dt);
          ent.mana = Math.min(ent.maxMana, ent.mana + ent.maxMana * 0.15 * dt);
        }
      }

      if (ent.isPlayer) {
        this.updatePlayerBehavior(ent, dt);
      } else if (ent.type === 'hero') {
        this.updateBotHeroBehavior(ent, dt);
      } else if (ent.type === 'minion') {
        this.updateMinionBehavior(ent, dt);
      } else if (ent.type === 'monster') {
        this.updateMonsterBehavior(ent, dt);
      } else if (ent.type === 'tower' || ent.type === 'base') {
        this.updateStructureBehavior(ent, elapsed);
      }

      this.syncEntityVisualRig(ent, elapsed);
    }

    // Update Floating Damage Output Popups
    for (let i = this.damagePopups.length - 1; i >= 0; i--) {
      const dp = this.damagePopups[i];
      dp.elapsed += dt;
      dp.worldX += dp.vx * dt;
      dp.worldY += dp.vy * dt;
      dp.vy = Math.max(0.8, dp.vy - 2.6 * dt);
      if (dp.elapsed >= dp.duration) {
        this.damagePopups.splice(i, 1);
      }
    }

    this.resolveUnitSeparation();
  }

  private respawnEntity(ent: CombatEntity) {
    ent.alive = true;
    ent.hp = ent.maxHp;
    ent.mana = ent.maxMana;
    ent.shield = 0;
    ent.x = ent.homeX;
    ent.z = ent.homeZ;
    ent.targetEntityId = null;
    ent.moveTargetX = null;
    ent.moveTargetZ = null;
    ent.stunTimer = 0;
    ent.slowTimer = 0;
    ent.animState = 'idle';

    if (ent.type === 'hero') {
      const waypoints = getLaneWaypoints(ent.lane || 'mid');
      ent.waypointIndex = ent.team === 'ally' ? 1 : waypoints.length - 2;
      const rig = this.heroRigs.get(ent.id);
      if (rig) {
        rig.root.position.set(ent.x, 0, ent.z);
        rig.root.visible = true;
      }
      if (ent.isPlayer) {
        this.vfx.spawnShockwave(ent.x, ent.z, 0x38bdf8, 3.5, 0.5);
      }
    } else if (ent.type === 'monster') {
      const rig = this.monsterRigs.get(ent.id);
      if (rig) {
        rig.root.position.set(ent.x, 0, ent.z);
        rig.root.visible = true;
      }
    }
  }

  private updatePlayerBehavior(player: CombatEntity, dt: number) {
    if (player.stunTimer > 0) return;

    const speedMult =
      (player.slowTimer > 0 ? 0.65 : 1.0) * (player.speedBuffTimer > 0 ? 1.32 : 1.0);
    const effectiveSpeed = player.moveSpeed * speedMult;

    let moveVecX = this.input.joystickX;
    let moveVecZ = this.input.joystickY;

    if (this.settings.controlScheme === 'wasd') {
      const w = this.input.heldKeys.has('KeyW') || this.input.heldKeys.has('ArrowUp') ? 1 : 0;
      const s = this.input.heldKeys.has('KeyS') || this.input.heldKeys.has('ArrowDown') ? 1 : 0;
      const a = this.input.heldKeys.has('KeyA') || this.input.heldKeys.has('ArrowLeft') ? 1 : 0;
      const d = this.input.heldKeys.has('KeyD') || this.input.heldKeys.has('ArrowRight') ? 1 : 0;
      if (w || s || a || d) {
        moveVecX = d - a;
        moveVecZ = s - w;
      }
    }

    const directMag = Math.hypot(moveVecX, moveVecZ);
    if (directMag > 0.08) {
      player.moveTargetX = null;
      player.moveTargetZ = null;
      player.targetEntityId = null;

      const nx = moveVecX / directMag;
      const nz = moveVecZ / directMag;
      player.x = THREE.MathUtils.clamp(
        player.x + nx * effectiveSpeed * dt,
        -MAP_HALF_SIZE,
        MAP_HALF_SIZE
      );
      player.z = THREE.MathUtils.clamp(
        player.z + nz * effectiveSpeed * dt,
        -MAP_HALF_SIZE,
        MAP_HALF_SIZE
      );
      player.rotationY = Math.atan2(nx, nz);
      if (player.animLockTimer <= 0) {
        player.animState = 'walk';
      }
      return;
    }

    if (player.targetEntityId) {
      const target = this.entities.find((e) => e.id === player.targetEntityId && e.alive);
      if (!target) {
        player.targetEntityId = null;
      } else {
        const dx = target.x - player.x;
        const dz = target.z - player.z;
        const dist = Math.hypot(dx, dz) - target.radius;
        if (dist <= player.attackRange) {
          player.rotationY = Math.atan2(dx, dz);
          if (player.attackTimer <= 0) {
            this.performBasicAttack(player, target);
          } else if (player.animLockTimer <= 0) {
            player.animState = 'idle';
          }
        } else {
          const len = Math.hypot(dx, dz) || 1;
          player.x += (dx / len) * effectiveSpeed * dt;
          player.z += (dz / len) * effectiveSpeed * dt;
          player.rotationY = Math.atan2(dx, dz);
          if (player.animLockTimer <= 0) {
            player.animState = 'walk';
          }
        }
        return;
      }
    }

    if (player.moveTargetX !== null && player.moveTargetZ !== null) {
      const dx = player.moveTargetX - player.x;
      const dz = player.moveTargetZ - player.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.35) {
        player.x += (dx / dist) * effectiveSpeed * dt;
        player.z += (dz / dist) * effectiveSpeed * dt;
        player.rotationY = Math.atan2(dx, dz);
        if (player.animLockTimer <= 0) {
          player.animState = 'walk';
        }
        return;
      } else {
        player.moveTargetX = null;
        player.moveTargetZ = null;
      }
    }

    if (player.animLockTimer <= 0) {
      player.animState = 'idle';
    }
  }

  private updateBotHeroBehavior(bot: CombatEntity, dt: number) {
    if (bot.stunTimer > 0) return;

    const speedMult =
      (bot.slowTimer > 0 ? 0.65 : 1.0) * (bot.speedBuffTimer > 0 ? 1.3 : 1.0);
    const speed = bot.moveSpeed * speedMult;

    const basePos = bot.team === 'ally' ? ALLY_BASE_POS : ENEMY_BASE_POS;
    if (bot.hp < bot.maxHp * 0.24 && Math.hypot(bot.x - basePos.x, bot.z - basePos.z) > 10) {
      const dx = basePos.x - bot.x;
      const dz = basePos.z - bot.z;
      const d = Math.hypot(dx, dz) || 1;
      bot.x += (dx / d) * speed * dt;
      bot.z += (dz / d) * speed * dt;
      bot.rotationY = Math.atan2(dx, dz);
      if (bot.animLockTimer <= 0) bot.animState = 'walk';
      return;
    }

    const target = this.findNearestHostile(bot, 13.5);
    if (target) {
      const dx = target.x - bot.x;
      const dz = target.z - bot.z;
      const dist = Math.hypot(dx, dz) - target.radius;

      // Bot casts available skills
      const def = HERO_DEFINITIONS[bot.heroId!];
      for (const sIdx of [2, 0, 1] as SkillSlotIndex[]) {
        const sk = def.skills[sIdx];
        if (
          bot.skillTimers[sIdx] <= 0 &&
          bot.mana >= sk.manaCost &&
          (target.type === 'hero' || target.type === 'minion') &&
          dist <= sk.range * 0.9
        ) {
          this.castHeroSkill(bot, sIdx, target.x, target.z);
          return;
        }
      }

      if (dist <= bot.attackRange) {
        bot.rotationY = Math.atan2(dx, dz);
        if (bot.attackTimer <= 0) {
          this.performBasicAttack(bot, target);
        } else if (bot.animLockTimer <= 0) {
          bot.animState = 'idle';
        }
      } else {
        const len = Math.hypot(dx, dz) || 1;
        bot.x += (dx / len) * speed * dt;
        bot.z += (dz / len) * speed * dt;
        bot.rotationY = Math.atan2(dx, dz);
        if (bot.animLockTimer <= 0) bot.animState = 'walk';
      }
      return;
    }

    this.advanceAlongLane(bot, speed, dt);
  }

  private updateMinionBehavior(minion: CombatEntity, dt: number) {
    if (minion.stunTimer > 0) return;

    const speed = minion.moveSpeed * (minion.slowTimer > 0 ? 0.65 : 1.0);
    const target = this.findNearestHostile(minion, 10.5);

    if (target) {
      const dx = target.x - minion.x;
      const dz = target.z - minion.z;
      const dist = Math.hypot(dx, dz) - target.radius;
      if (dist <= minion.attackRange) {
        minion.rotationY = Math.atan2(dx, dz);
        if (minion.attackTimer <= 0) {
          this.performBasicAttack(minion, target);
        } else if (minion.animLockTimer <= 0) {
          minion.animState = 'idle';
        }
      } else {
        const len = Math.hypot(dx, dz) || 1;
        minion.x += (dx / len) * speed * dt;
        minion.z += (dz / len) * speed * dt;
        minion.rotationY = Math.atan2(dx, dz);
        if (minion.animLockTimer <= 0) minion.animState = 'walk';
      }
      return;
    }

    this.advanceAlongLane(minion, speed, dt);
  }

  private advanceAlongLane(unit: CombatEntity, speed: number, dt: number) {
    const waypoints = getLaneWaypoints(unit.lane || 'mid');
    const wp = waypoints[unit.waypointIndex];
    if (!wp) return;

    const dx = wp.x - unit.x;
    const dz = wp.z - unit.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 2.4) {
      if (unit.team === 'ally') {
        unit.waypointIndex = Math.min(waypoints.length - 1, unit.waypointIndex + 1);
      } else {
        unit.waypointIndex = Math.max(0, unit.waypointIndex - 1);
      }
    } else {
      unit.x += (dx / dist) * speed * dt;
      unit.z += (dz / dist) * speed * dt;
      unit.rotationY = Math.atan2(dx, dz);
      if (unit.animLockTimer <= 0) unit.animState = 'walk';
    }
  }

  private updateMonsterBehavior(monster: CombatEntity, dt: number) {
    if (monster.stunTimer > 0) return;

    const distFromHome = Math.hypot(monster.x - monster.homeX, monster.z - monster.homeZ);
    if (distFromHome > 13.5) {
      monster.targetEntityId = null;
    }

    if (monster.targetEntityId) {
      const target = this.entities.find((e) => e.id === monster.targetEntityId && e.alive);
      if (!target || Math.hypot(target.x - monster.homeX, target.z - monster.homeZ) > 14.5) {
        monster.targetEntityId = null;
      } else {
        const dx = target.x - monster.x;
        const dz = target.z - monster.z;
        const dist = Math.hypot(dx, dz) - target.radius;
        if (dist <= monster.attackRange) {
          monster.rotationY = Math.atan2(dx, dz);
          if (monster.attackTimer <= 0) {
            this.performBasicAttack(monster, target);
          } else if (monster.animLockTimer <= 0) {
            monster.animState = 'idle';
          }
        } else {
          const len = Math.hypot(dx, dz) || 1;
          monster.x += (dx / len) * monster.moveSpeed * dt;
          monster.z += (dz / len) * monster.moveSpeed * dt;
          monster.rotationY = Math.atan2(dx, dz);
          if (monster.animLockTimer <= 0) monster.animState = 'walk';
        }
        return;
      }
    }

    if (distFromHome > 0.4) {
      const dx = monster.homeX - monster.x;
      const dz = monster.homeZ - monster.z;
      monster.x += (dx / distFromHome) * monster.moveSpeed * dt;
      monster.z += (dz / distFromHome) * monster.moveSpeed * dt;
      monster.rotationY = Math.atan2(dx, dz);
      monster.hp = Math.min(monster.maxHp, monster.hp + monster.maxHp * 0.1 * dt);
      if (monster.animLockTimer <= 0) monster.animState = 'walk';
    } else if (monster.animLockTimer <= 0) {
      monster.animState = 'idle';
    }
  }

  private updateStructureBehavior(structure: CombatEntity, elapsed: number) {
    const rig = this.structureRigs.get(structure.id);
    if (rig) {
      updateStructureRig(
        rig,
        elapsed,
        structure.hitFlashTimer,
        structure.type === 'base' ? 5.2 : 6.0
      );
    }

    if (structure.attackTimer > 0) return;

    const target = this.findNearestHostile(structure, structure.attackRange, true);
    if (target) {
      this.performBasicAttack(structure, target);
    }
  }

  private findNearestHostile(
    source: CombatEntity,
    maxRange: number,
    prioritizeMinions = false
  ): CombatEntity | null {
    // Fast path: If unit already has a valid alive target within range, retain it (O(1) lookup)
    if (source.targetEntityId) {
      const existing = this.entities.find((e) => e.id === source.targetEntityId && e.alive);
      if (existing) {
        const dx = existing.x - source.x;
        const dz = existing.z - source.z;
        const distSq = dx * dx + dz * dz;
        const retainRange = maxRange + 1.6;
        if (distSq <= retainRange * retainRange && !(existing.stealthed && distSq > 5.29)) {
          return existing;
        }
      }
      source.targetEntityId = null;
    }

    const maxRangeSq = (maxRange + 1.8) * (maxRange + 1.8);
    let bestTarget: CombatEntity | null = null;
    let bestScore = Infinity;

    for (let i = 0; i < this.entities.length; i++) {
      const other = this.entities[i];
      if (!other.alive || other.team === source.team || other.team === 'neutral') continue;

      const dx = other.x - source.x;
      const dz = other.z - source.z;
      const distSq = dx * dx + dz * dz;
      if (distSq > maxRangeSq) continue;

      const dist = Math.sqrt(distSq) - other.radius;
      if (dist > maxRange) continue;

      // Stealthed heroes inside a Volt-Mirage Invisible Area cannot be auto-targeted unless within 2.3m!
      if (other.stealthed && dist > 2.3) continue;

      const priorityPenalty =
        prioritizeMinions && (other.type === 'hero' || other.type === 'deployable') ? 100 : 0;
      const score = dist + priorityPenalty;
      if (score < bestScore) {
        bestScore = score;
        bestTarget = other;
      }
    }

    if (bestTarget) {
      source.targetEntityId = bestTarget.id;
    }
    return bestTarget;
  }

  private updateProjectiles(dt: number) {
    const projectiles = this.vfx.getActiveProjectiles();
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.active) continue;

      let tx = p.targetX;
      let tz = p.targetZ;
      let targetEnt: CombatEntity | undefined;

      if (p.targetEntityId) {
        targetEnt = this.entities.find((e) => e.id === p.targetEntityId && e.alive);
        if (targetEnt) {
          tx = targetEnt.x;
          tz = targetEnt.z;
          p.targetX = tx;
          p.targetZ = tz;
        }
      }

      const dx = tx - p.mesh.position.x;
      const dz = tz - p.mesh.position.z;
      const dist = Math.hypot(dx, dz);
      const step = p.speed * dt;

      if (dist <= step + 0.45) {
        p.active = false;
        p.mesh.visible = false;
        const attacker = this.entities.find((e) => e.id === p.sourceEntityId);
        const projColor = p.tailMat.color.getHex();

        if (p.isSkillNova) {
          this.vfx.spawnSanctuaryDome(tx, tz, projColor, (p.aoeRadius || 3.5) * 0.85, 0.45);
          this.vfx.spawnShockwave(tx, tz, projColor, p.aoeRadius || 3.5, 0.45);
          this.vfx.spawnBurstParticles(tx, 1.1, tz, projColor, 14, 8.5);
          if (attacker) {
            this.applyAoeDamage(
              attacker,
              tx,
              tz,
              p.aoeRadius || 3.2,
              p.damage,
              0,
              p.slowDuration
            );
          }
        } else if (targetEnt) {
          this.vfx.spawnBurstParticles(tx, 1.2, tz, projColor, 6, 5.5);
          this.applyDamage(attacker, targetEnt, p.damage);
        }
      } else {
        p.mesh.position.x += (dx / dist) * step;
        p.mesh.position.z += (dz / dist) * step;
        p.mesh.rotation.y = Math.atan2(dx, dz);
        p.mesh.children[0].rotation.z += dt * 12;
      }
    }
  }

  private syncEntityVisualRig(ent: CombatEntity, elapsed: number) {
    const dx = ent.x - this.camFocusX;
    const dz = ent.z - this.camFocusZ;
    // Beyond 54 units from camera center, units are offscreen or tiny silhouettes: skip limb sine math
    const isFar = dx * dx + dz * dz > 2916;

    if (ent.type === 'hero') {
      const rig = this.heroRigs.get(ent.id);
      if (rig) {
        rig.root.position.set(ent.x, 0, ent.z);
        rig.root.rotation.y = ent.rotationY;
        if (!isFar || ent.isPlayer) {
          updateHeroRigAnimation(
            rig,
            ent.heroId!,
            ent.animState,
            ent.animState === 'idle' || ent.animState === 'walk' ? elapsed : ent.animTime,
            ent.hitFlashTimer,
            ent.shield > 0
          );
        }
      }
    } else if (ent.type === 'minion') {
      const rig = this.minionRigs.get(ent.id);
      if (rig) {
        rig.root.position.set(ent.x, 0, ent.z);
        rig.root.rotation.y = ent.rotationY;
        if (!isFar) {
          updateMinionRig(rig, ent.animState, ent.animTime, ent.hitFlashTimer);
        }
      }
    } else if (ent.type === 'monster') {
      const rig = this.monsterRigs.get(ent.id);
      if (rig) {
        rig.root.position.set(ent.x, 0, ent.z);
        rig.root.rotation.y = ent.rotationY;
        if (!isFar) {
          updateMonsterRig(rig, ent.animState, ent.animTime, ent.hitFlashTimer);
        }
      }
    }
  }

  private resolveUnitSeparation() {
    this.separationTick++;
    // Run unit separation physics every 2nd frame (30 Hz is optimal for soft crowd collision)
    if (this.separationTick % 2 !== 0) return;

    for (let i = 0; i < this.entities.length; i++) {
      const a = this.entities[i];
      if (!a.alive || a.type === 'tower' || a.type === 'base' || a.type === 'deployable') continue;

      // 1. Physical pathing block from Cryo-Barrier Elixir Zones (Block Area)
      if (this.activeElixirZones.length > 0) {
        for (let zIdx = 0; zIdx < this.activeElixirZones.length; zIdx++) {
          const zone = this.activeElixirZones[zIdx];
          if (zone.elixirId !== 'cryo_block') continue;
          const dx = a.x - zone.x;
          const dz = a.z - zone.z;
          const blockRadius = zone.radius * 0.78 + a.radius;
          const distSq = dx * dx + dz * dz;
          if (distSq < blockRadius * blockRadius) {
            const dist = Math.sqrt(distSq);
            const push = blockRadius - Math.max(0.01, dist);
            const nx = dist > 0.01 ? dx / dist : 1;
            const nz = dist > 0.01 ? dz / dist : 0;
            a.x += nx * push;
            a.z += nz * push;
          }
        }
      }

      for (let j = 0; j < this.entities.length; j++) {
        if (i === j) continue;
        const b = this.entities[j];
        if (!b.alive) continue;

        // 2. Physical pathing block from Runic Barricade & Deployables
        if (b.type === 'deployable') {
          if (b.deployableId === 'snap_trap') continue;
          const dx = a.x - b.x;
          const dz = a.z - b.z;
          const minDist = a.radius + b.radius;
          const distSq = dx * dx + dz * dz;
          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq);
            const overlap = minDist - Math.max(0.01, dist);
            const nx = dist > 0.01 ? dx / dist : 1;
            const nz = dist > 0.01 ? dz / dist : 0;
            a.x += nx * overlap;
            a.z += nz * overlap;
          }
          continue;
        }

        if (j < i) continue;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const minDist = (a.radius + b.radius) * 0.72;
        const distSq = dx * dx + dz * dz;
        if (distSq > 0.0001 && distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          const overlap = (minDist - dist) * 0.35;
          const nx = dx / dist;
          const nz = dz / dist;
          if (b.type === 'tower' || b.type === 'base') {
            a.x -= nx * overlap * 2;
            a.z -= nz * overlap * 2;
          } else {
            a.x -= nx * overlap;
            a.z -= nz * overlap;
            b.x += nx * overlap;
            b.z += nz * overlap;
          }
        }
      }
    }
  }

  private updateArenaCamera(dt: number) {
    const player = this.getPlayerEntity();

    // Keyboard Zoom shortcuts (+ / -)
    if (this.input.consumeJustPressed('Equal') || this.input.consumeJustPressed('NumpadAdd')) {
      this.zoomCameraBy(-0.15);
    }
    if (this.input.consumeJustPressed('Minus') || this.input.consumeJustPressed('NumpadSubtract')) {
      this.zoomCameraBy(0.15);
    }

    this.camZoom = THREE.MathUtils.damp(this.camZoom, this.targetCamZoom, 8.5, dt);

    // Arrow-key Camera Scroll works anytime (in Right-Click mode or Free Cam)
    if (this.settings.controlScheme === 'right_click' || !this.settings.cameraLocked) {
      const panSpeed = 36 * this.settings.cameraSpeed * this.camZoom * dt;
      let moveX = 0;
      let moveZ = 0;
      if (this.input.heldKeys.has('ArrowUp')) moveZ -= panSpeed;
      if (this.input.heldKeys.has('ArrowDown')) moveZ += panSpeed;
      if (this.input.heldKeys.has('ArrowLeft')) moveX -= panSpeed;
      if (this.input.heldKeys.has('ArrowRight')) moveX += panSpeed;
      if (moveX !== 0 || moveZ !== 0) {
        this.scrollCameraBy(moveX, moveZ);
      }
    }

    if (this.settings.cameraLocked && player && player.alive) {
      const targetX = THREE.MathUtils.clamp(
        player.x + this.camPanOffsetX,
        -MAP_HALF_SIZE,
        MAP_HALF_SIZE
      );
      const targetZ = THREE.MathUtils.clamp(
        player.z + this.camPanOffsetZ,
        -MAP_HALF_SIZE,
        MAP_HALF_SIZE
      );
      this.camFocusX = THREE.MathUtils.damp(this.camFocusX, targetX, 6.5, dt);
      this.camFocusZ = THREE.MathUtils.damp(this.camFocusZ, targetZ, 6.5, dt);
    }

    this.camFocusX = THREE.MathUtils.clamp(this.camFocusX, -MAP_HALF_SIZE, MAP_HALF_SIZE);
    this.camFocusZ = THREE.MathUtils.clamp(this.camFocusZ, -MAP_HALF_SIZE, MAP_HALF_SIZE);

    let shakeX = 0;
    let shakeZ = 0;
    if (this.camShakeAmount > 0.01) {
      shakeX = (Math.random() - 0.5) * this.camShakeAmount;
      shakeZ = (Math.random() - 0.5) * this.camShakeAmount;
      this.camShakeAmount = THREE.MathUtils.damp(this.camShakeAmount, 0, 12, dt);
    } else {
      this.camShakeAmount = 0;
    }

    // Strong 2.5D Isometric Diorama Camera Rig:
    // Ultra-telephoto 15° FOV + lower ~38.5° diorama elevation angle (camHeight=62, camZOffset=78)
    // makes vertical silhouettes of jungle walls, trees, monsters, and heroes pop in 2.5D!
    const camHeight = 62.0 * this.camZoom;
    const camZOffset = 78.0 * this.camZoom;
    this.camera.position.set(
      this.camFocusX + shakeX,
      camHeight,
      this.camFocusZ + camZOffset + shakeZ
    );
    this.camera.lookAt(this.camFocusX + shakeX, 0.8, this.camFocusZ - 1.2 + shakeZ);

    // Keep linear jungle fog scaled with zoom so center arena is crisp and perimeter is misty
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.near = 96 * this.camZoom;
      this.scene.fog.far = 235 * this.camZoom;
    }

    this.dirLight.position.set(this.camFocusX + 26, 48, this.camFocusZ + 22);
    this.dirLight.target.position.set(this.camFocusX, 0, this.camFocusZ);
  }

  private bindEvents() {
    const canvas = this.renderer.domElement;

    const updateMouseRay = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouseNdc, this.camera);
      if (this.raycaster.ray.intersectPlane(_rayPlane, _rayIntersect)) {
        this.input.cursorWorldX = _rayIntersect.x;
        this.input.cursorWorldZ = _rayIntersect.z;
      }
    };

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Mouse Wheel / Trackpad Zoom
    canvas.addEventListener(
      'wheel',
      (e) => {
        if (this.isPaused) return;
        if (this.screen === 'pick') {
          e.preventDefault();
          const zoomStep = e.deltaY > 0 ? 0.08 : -0.08;
          this.pickCamZoom = THREE.MathUtils.clamp(this.pickCamZoom + zoomStep, 0.75, 1.75);
          return;
        }
        if (this.screen !== 'games') return;
        e.preventDefault();
        const zoomStep = e.deltaY > 0 ? 0.12 : -0.12;
        this.zoomCameraBy(zoomStep);
      },
      { passive: false }
    );

    // Two-Finger Touch Pinch-to-Zoom & Two-Finger Scroll
    canvas.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length !== 2) return;
        if (this.screen !== 'games' && this.screen !== 'pick') return;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.pinchStartDist = Math.hypot(dx, dy);
        this.pinchStartZoom = this.screen === 'pick' ? this.pickCamZoom : this.targetCamZoom;
      },
      { passive: true }
    );

    canvas.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length !== 2 || this.pinchStartDist <= 10) return;
        if (this.screen !== 'games' && this.screen !== 'pick') return;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const scale = this.pinchStartDist / Math.max(20, dist);
        if (this.screen === 'pick') {
          this.pickCamZoom = THREE.MathUtils.clamp(this.pinchStartZoom * scale, 0.75, 1.75);
        } else {
          this.targetCamZoom = THREE.MathUtils.clamp(this.pinchStartZoom * scale, 0.55, 1.65);
        }
      },
      { passive: true }
    );

    canvas.addEventListener(
      'touchend',
      () => {
        this.pinchStartDist = 0;
      },
      { passive: true }
    );

    canvas.addEventListener('pointerdown', (e) => {
      updateMouseRay(e.clientX, e.clientY);
      this.pointerDownX = e.clientX;
      this.pointerDownY = e.clientY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      if (this.screen === 'pick') {
        this.isDraggingCamera = true;
        return;
      }

      if (this.screen !== 'games' || this.isPaused || this.winner) return;

      // Middle mouse button, Shift+Left-Click, or Left-Click when Cam: Free is enabled starts Camera Scroll Drag
      if (
        e.button === 1 ||
        (e.button === 0 && e.shiftKey) ||
        (!this.settings.cameraLocked && e.button === 0 && this.aimingSkillSlot === null)
      ) {
        this.isDraggingCamera = true;
      }

      const player = this.getPlayerEntity();
      if (!player || !player.alive) return;

      const worldX = THREE.MathUtils.clamp(this.input.cursorWorldX, -MAP_HALF_SIZE, MAP_HALF_SIZE);
      const worldZ = THREE.MathUtils.clamp(this.input.cursorWorldZ, -MAP_HALF_SIZE, MAP_HALF_SIZE);

      if (this.input.consumeJustPressed('Escape')) {
        if (this.aimingTacticalId !== null) {
          this.cancelTacticalAim();
        } else if (this.aimingSkillSlot !== null) {
          this.cancelSkillAim();
        }
      }

      // If Player is currently aiming a Tactical Elixir or Deployable Object, Left-Click / Tap casts it!
      if (this.aimingTacticalId !== null) {
        if (e.button === 2) {
          this.cancelTacticalAim();
          return;
        }
        if (e.button === 0) {
          this.useTacticalItem(this.aimingTacticalId, worldX, worldZ);
          return;
        }
      }

      // If Player is currently aiming a skill, Left-Click / Touch on the arena casts toward that point!
      if (this.aimingSkillSlot !== null) {
        if (e.button === 2) {
          this.cancelSkillAim();
          return;
        }
        if (e.button === 0) {
          this.triggerPlayerSkill(this.aimingSkillSlot, worldX, worldZ);
          return;
        }
      }

      // If starting a dedicated camera drag (Middle mouse or Shift+Click), don't issue move/attack orders
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        return;
      }

      const clickedHostile = this.findEntityAtWorldPos(worldX, worldZ, player.team);

      if (this.settings.controlScheme === 'right_click') {
        if (e.button === 2 || (e.pointerType === 'touch' && e.button === 0 && this.settings.cameraLocked)) {
          if (clickedHostile) {
            player.targetEntityId = clickedHostile.id;
            player.moveTargetX = null;
            player.moveTargetZ = null;
            this.vfx.showMoveIndicator(clickedHostile.x, clickedHostile.z, 0xef4444);
          } else {
            player.targetEntityId = null;
            player.moveTargetX = worldX;
            player.moveTargetZ = worldZ;
            this.vfx.showMoveIndicator(worldX, worldZ, 0x34d399);
          }
        } else if (e.button === 0 && clickedHostile) {
          player.targetEntityId = clickedHostile.id;
          this.vfx.showMoveIndicator(clickedHostile.x, clickedHostile.z, 0xef4444);
        }
      } else {
        if (clickedHostile) {
          player.targetEntityId = clickedHostile.id;
        }
        if (this.settings.cameraLocked) {
          this.triggerPlayerBasicAttack();
        }
      }
    });

    window.addEventListener('pointermove', (e) => {
      updateMouseRay(e.clientX, e.clientY);

      if (this.isDraggingCamera) {
        const dx = e.clientX - this.lastPointerX;
        const dy = e.clientY - this.lastPointerY;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;

        if (this.screen === 'pick' && this.previewHeroRig) {
          this.previewHeroRig.root.rotation.y += dx * 0.012;
        } else if (this.screen === 'games') {
          const panScale = 0.085 * this.settings.cameraSpeed * this.camZoom;
          this.scrollCameraBy(-dx * panScale, -dy * panScale);
        }
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (
        this.isDraggingCamera &&
        this.screen === 'games' &&
        !this.settings.cameraLocked &&
        this.aimingSkillSlot === null
      ) {
        // If user just tapped without dragging in Free Cam on touch, allow tap-to-move
        const dragDist = Math.hypot(e.clientX - this.pointerDownX, e.clientY - this.pointerDownY);
        const player = this.getPlayerEntity();
        if (dragDist < 6 && e.pointerType === 'touch' && player && player.alive) {
          const worldX = THREE.MathUtils.clamp(
            this.input.cursorWorldX,
            -MAP_HALF_SIZE,
            MAP_HALF_SIZE
          );
          const worldZ = THREE.MathUtils.clamp(
            this.input.cursorWorldZ,
            -MAP_HALF_SIZE,
            MAP_HALF_SIZE
          );
          player.moveTargetX = worldX;
          player.moveTargetZ = worldZ;
          this.vfx.showMoveIndicator(worldX, worldZ, 0x34d399);
        }
      }
      this.isDraggingCamera = false;
    });

    window.addEventListener('resize', () => {
      if (this.disposed) return;
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  private findEntityAtWorldPos(
    worldX: number,
    worldZ: number,
    playerTeam: TeamId
  ): CombatEntity | null {
    let best: CombatEntity | null = null;
    let bestDist = Infinity;

    for (let i = 0; i < this.entities.length; i++) {
      const ent = this.entities[i];
      if (!ent.alive || ent.team === playerTeam) continue;
      const d = Math.hypot(ent.x - worldX, ent.z - worldZ);
      const hitRadius = ent.radius + 1.45;
      if (d <= hitRadius && d < bestDist) {
        bestDist = d;
        best = ent;
      }
    }
    return best;
  }

  private emitHudSnapshot() {
    const player = this.getPlayerEntity();
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    const healthBars: ProjectedHealthBar[] = [];
    const minimapBlips: MinimapBlip[] = [];

    for (let i = 0; i < this.entities.length; i++) {
      const ent = this.entities[i];
      if (!ent.alive) continue;

      minimapBlips.push({
        id: ent.id,
        type: ent.type,
        team: ent.team,
        x: ent.x,
        z: ent.z,
        isPlayer: ent.isPlayer,
      });

      const zoomOffset = Math.max(0, (this.camZoom - 1.0) * 1.8);
      const yHeight =
        ent.type === 'base'
          ? 7.2
          : ent.type === 'tower'
            ? 7.2
            : ent.type === 'hero'
              ? 3.9 + zoomOffset
              : ent.type === 'monster'
                ? 2.9 + zoomOffset * 0.5
                : 2.25 + zoomOffset * 0.4;

      _projVec.set(ent.x, yHeight, ent.z);
      _projVec.project(this.camera);

      if (_projVec.z > 1) continue;
      const sx = (_projVec.x * 0.5 + 0.5) * width;
      const sy = (-(_projVec.y * 0.5) + 0.5) * height;

      if (sx < -60 || sx > width + 60 || sy < -40 || sy > height + 40) continue;

      // In MOBAs, full-HP minions don't need floating DOM health bars unless damaged or close to the player
      if (ent.type === 'minion' && ent.hp >= ent.maxHp && ent.hitFlashTimer <= 0) {
        const distToPlayer = player ? Math.hypot(ent.x - player.x, ent.z - player.z) : 999;
        if (distToPlayer > 14) continue;
      }

      healthBars.push({
        id: ent.id,
        name: ent.name,
        type: ent.type,
        team: ent.team,
        level: ent.level,
        hp: Math.ceil(ent.hp),
        maxHp: ent.maxHp,
        mana: Math.ceil(ent.mana),
        maxMana: ent.maxMana,
        shield: Math.ceil(ent.shield),
        screenX: sx,
        screenY: sy,
        isPlayer: !!ent.isPlayer,
        visible: true,
        stealthed: ent.stealthed,
        deployableState: ent.deployableState,
      });
    }

    const damageTexts: FloatingDamageText[] = [];
    for (let i = 0; i < this.damagePopups.length; i++) {
      const dp = this.damagePopups[i];
      _projVec.set(dp.worldX, dp.worldY * 1.15, dp.worldZ);
      _projVec.project(this.camera);
      if (_projVec.z > 1) continue;
      const sx = (_projVec.x * 0.5 + 0.5) * width;
      const sy = (-(_projVec.y * 0.5) + 0.5) * height;
      if (sx < -40 || sx > width + 40 || sy < -40 || sy > height + 40) continue;

      const t = Math.min(1, dp.elapsed / dp.duration);
      const opacity = t < 0.7 ? 1 : Math.max(0, 1 - (t - 0.7) / 0.3);
      damageTexts.push({
        id: dp.id,
        text: dp.text,
        screenX: sx,
        screenY: sy,
        color: dp.color,
        isCritOrSkill: dp.isCritOrSkill,
        opacity: Number(opacity.toFixed(2)),
      });
    }

    const activeDeployableCount = this.entities.filter(
      (e) => e.alive && e.type === 'deployable' && e.team === 'ally'
    ).length;

    const def = HERO_DEFINITIONS[this.selectedHeroId];
    this.onSnapshot({
      matchTime: this.matchTime,
      allyKills: this.allyKills,
      enemyKills: this.enemyKills,
      waveCount: this.waveCount,
      nextWaveIn: Math.ceil(this.waveTimer),
      player: {
        heroId: this.selectedHeroId,
        name: def.name,
        level: this.playerLevel,
        xp: this.playerXp,
        maxXp: this.playerMaxXp,
        gold: this.playerGold,
        kills: this.playerKills,
        deaths: this.playerDeaths,
        assists: this.playerAssists,
        hp: player ? Math.ceil(player.hp) : 0,
        maxHp: player ? player.maxHp : def.stats.maxHp,
        mana: player ? Math.ceil(player.mana) : 0,
        maxMana: player ? player.maxMana : def.stats.maxMana,
        shield: player ? Math.ceil(player.shield) : 0,
        attackDamage: player ? player.attackDamage : def.stats.attackDamage,
        moveSpeed: player ? player.moveSpeed : def.stats.moveSpeed,
        alive: player ? player.alive : false,
        respawnTimer: player ? Math.ceil(player.respawnTimer) : 0,
        skillCooldowns: [
          def.skills[0].cooldown,
          def.skills[1].cooldown,
          def.skills[2].cooldown,
        ],
        skillTimers: player
          ? [
              Number(player.skillTimers[0].toFixed(1)),
              Number(player.skillTimers[1].toFixed(1)),
              Number(player.skillTimers[2].toFixed(1)),
            ]
          : [0, 0, 0],
        aimingSkillSlot: this.aimingSkillSlot,
        inventoryCounts: { ...this.inventoryCounts },
        tacticalInventory: { ...this.tacticalInventory },
        tacticalCooldowns: {
          pyro_damage: Number(this.tacticalCooldowns.pyro_damage.toFixed(1)),
          cryo_block: Number(this.tacticalCooldowns.cryo_block.toFixed(1)),
          volt_stealth: Number(this.tacticalCooldowns.volt_stealth.toFixed(1)),
          vitae_heal: Number(this.tacticalCooldowns.vitae_heal.toFixed(1)),
          barricade: Number(this.tacticalCooldowns.barricade.toFixed(1)),
          snap_trap: Number(this.tacticalCooldowns.snap_trap.toFixed(1)),
          aether_totem: Number(this.tacticalCooldowns.aether_totem.toFixed(1)),
          prismatic_pylon: Number(this.tacticalCooldowns.prismatic_pylon.toFixed(1)),
        },
        aimingTacticalId: this.aimingTacticalId,
        aimingComboPreview: this.aimingComboPreview,
        activeDeployableCount,
        stealthed: Boolean(player?.stealthed),
      },
      winner: this.winner,
      cameraX: this.camFocusX,
      cameraZ: this.camFocusZ,
      cameraZoom: Number(this.targetCamZoom.toFixed(2)),
      healthBars,
      damageTexts,
      minimapBlips,
    });
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.input.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
