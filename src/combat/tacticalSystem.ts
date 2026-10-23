import * as THREE from 'three';
import {
  DeployableId,
  DeployableState,
  ElixirId,
  TacticalCatalogItem,
  TacticalItemId,
  TeamId,
} from '../types/game';

export const ELIXIR_IDS: ElixirId[] = [
  'pyro_damage',
  'cryo_block',
  'volt_stealth',
  'vitae_heal',
];

export const DEPLOYABLE_IDS: DeployableId[] = [
  'barricade',
  'snap_trap',
  'aether_totem',
  'prismatic_pylon',
];

export const TACTICAL_CATALOG: Record<TacticalItemId, TacticalCatalogItem> = {
  pyro_damage: {
    id: 'pyro_damage',
    category: 'elixir',
    name: 'Pyro-Scorch Elixir',
    shortLabel: 'Damaged Area',
    hotkey: '1',
    cost: 120,
    maxCharges: 3,
    cooldown: 8,
    range: 13.5,
    radius: 4.2,
    duration: 6.0,
    colorHex: 0xf97316,
    colorCss: '#f97316',
    summary: 'Zona Api (Damaged Area): Bakar musuh 55 DPS & kurangi Armor.',
    comboDescription:
      'Kena Barikade = Ledakan Shrapnel Api • Kena Trap = Ranjau Inferno • Kena Totem = Menara Semburan Api',
  },
  cryo_block: {
    id: 'cryo_block',
    category: 'elixir',
    name: 'Cryo-Barrier Elixir',
    shortLabel: 'Block Area',
    hotkey: '2',
    cost: 140,
    maxCharges: 3,
    cooldown: 10,
    range: 12.5,
    radius: 3.6,
    duration: 5.5,
    colorHex: 0x38bdf8,
    colorCss: '#38bdf8',
    summary: 'Zona Es (Block Area): Bentuk kristal penghalang jalan & Slow 40%.',
    comboDescription:
      'Mengubah Objek apa pun menjadi Perangkap Pembekuan (AoE Freeze Stun 1.8d saat didekati musuh)',
  },
  volt_stealth: {
    id: 'volt_stealth',
    category: 'elixir',
    name: 'Volt-Mirage Elixir',
    shortLabel: 'Invisible Area',
    hotkey: '3',
    cost: 150,
    maxCharges: 3,
    cooldown: 11,
    range: 13.5,
    radius: 4.5,
    duration: 6.0,
    colorHex: 0xa855f7,
    colorCss: '#a855f7',
    summary: 'Zona Halimun (Invisible Area): Sekutu di dalam area menjadi Stealth & +25% Speed.',
    comboDescription:
      'Listrik merambat berantai (Chain Lightning) melewati seluruh Objek kompatibel & menyetrum musuh',
  },
  vitae_heal: {
    id: 'vitae_heal',
    category: 'elixir',
    name: 'Vitae-Bloom Elixir',
    shortLabel: 'Healing Area',
    hotkey: '4',
    cost: 130,
    maxCharges: 3,
    cooldown: 9,
    range: 13.5,
    radius: 4.2,
    duration: 6.0,
    colorHex: 0x10b981,
    colorCss: '#10b981',
    summary: 'Zona Pemulihan (Healing Area): Pulihkan 70 HP/d & 30 Mana/d untuk tim.',
    comboDescription:
      'Mengaktifkan Aura Dukungan & Shield Raksasa pada Totem (serta memperbaiki HP Objek & Tower)',
  },
  barricade: {
    id: 'barricade',
    category: 'deployable',
    name: 'Runic Barricade',
    shortLabel: 'Barricade',
    hotkey: 'Z',
    cost: 150,
    maxCharges: 2,
    cooldown: 12,
    range: 8.5,
    radius: 2.3,
    duration: 18.0,
    colorHex: 0xf59e0b,
    colorCss: '#f59e0b',
    summary: 'Dinding batu runa penghalang jalur gerak hero, minion, & monster.',
    comboDescription: 'Serap Elixir Api (Meledak) atau Elixir Es (Benteng Pembeku).',
  },
  snap_trap: {
    id: 'snap_trap',
    category: 'deployable',
    name: 'Kinetic Snap-Trap',
    shortLabel: 'Snap Trap',
    hotkey: 'X',
    cost: 130,
    maxCharges: 2,
    cooldown: 10,
    range: 9.0,
    radius: 2.2,
    duration: 25.0,
    colorHex: 0xef4444,
    colorCss: '#ef4444',
    summary: 'Perangkap mekanis yang menjepit & menghentikan musuh saat diinjak.',
    comboDescription: 'Berubah menjadi Perangkap Pembekuan (Es) atau Ranjau Cluster (Api).',
  },
  aether_totem: {
    id: 'aether_totem',
    category: 'deployable',
    name: 'Aether Totem',
    shortLabel: 'Aura Totem',
    hotkey: 'C',
    cost: 160,
    maxCharges: 2,
    cooldown: 14,
    range: 8.5,
    radius: 4.2,
    duration: 20.0,
    colorHex: 0x34d399,
    colorCss: '#34d399',
    summary: 'Pilar energi yang memancarkan regenerasi di sekitarnya.',
    comboDescription: 'Serap Elixir Pemulihan (Aura Shield & Heal Luas) atau Api (Gelombang Bakar).',
  },
  prismatic_pylon: {
    id: 'prismatic_pylon',
    category: 'deployable',
    name: 'Prismatic Pylon',
    shortLabel: 'Relay Pylon',
    hotkey: 'V',
    cost: 170,
    maxCharges: 2,
    cooldown: 13,
    range: 10.0,
    radius: 2.0,
    duration: 22.0,
    colorHex: 0x38bdf8,
    colorCss: '#38bdf8',
    summary: 'Kristal konduktor yang memantulkan Elixir & merambatkan petir.',
    comboDescription: 'Pantulkan lemparan Elixir ke musuh & gandakan rambatan Elixir Listrik.',
  },
};

export function isElixirId(id: TacticalItemId): id is ElixirId {
  return (
    id === 'pyro_damage' ||
    id === 'cryo_block' ||
    id === 'volt_stealth' ||
    id === 'vitae_heal'
  );
}

export function isDeployableId(id: TacticalItemId): id is DeployableId {
  return (
    id === 'barricade' ||
    id === 'snap_trap' ||
    id === 'aether_totem' ||
    id === 'prismatic_pylon'
  );
}

export function getComboReactionLabel(
  elixirId: ElixirId,
  deployableId: DeployableId
): string {
  if (deployableId === 'prismatic_pylon') {
    if (elixirId === 'volt_stealth') {
      return 'COMBO: OVERLOAD CHAIN LIGHTNING + DOUBLE STEALTH';
    }
    return `COMBO: PRISM BOUNCE & AMPLIFY (${TACTICAL_CATALOG[elixirId].shortLabel.toUpperCase()})`;
  }
  if (elixirId === 'pyro_damage') {
    if (deployableId === 'barricade') return 'COMBO: RUNIC SHRAPNEL DETONATION';
    if (deployableId === 'snap_trap') return 'COMBO: INFERNO CLUSTER MINE';
    if (deployableId === 'aether_totem') return 'COMBO: SOLAR FLARE TURRET';
  }
  if (elixirId === 'cryo_block') {
    return `COMBO: CRYO FREEZE TRAP (${TACTICAL_CATALOG[deployableId].shortLabel.toUpperCase()})`;
  }
  if (elixirId === 'volt_stealth') {
    return 'COMBO: HIGH-VOLTAGE ARC CONDUCTION';
  }
  if (elixirId === 'vitae_heal') {
    if (deployableId === 'aether_totem') return 'COMBO: SANCTUARY SUPPORT & SHIELD AURA';
    return 'COMBO: AETHER FORTIFICATION & SHIELD PULSE';
  }
  return 'COMBO: CATALYTIC REACTION';
}

// ============================================================================
// 3D PROCEDURAL MODELS FOR DEPLOYABLE OBJECTS & ELIXIR ZONES
// ============================================================================

export interface DeployableRig {
  root: THREE.Group;
  coreMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  stateOverlayGroup: THREE.Group;
  cryoSpikes: THREE.Group;
  auraRing: THREE.Mesh;
  auraMat: THREE.MeshBasicMaterial;
}

export function createDeployableRig(
  deployableId: DeployableId,
  team: TeamId
): DeployableRig {
  const root = new THREE.Group();
  const teamColor = team === 'ally' ? 0x38bdf8 : 0xef4444;

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.78,
    metalness: 0.22,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.42,
    metalness: 0.78,
  });
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.35,
    metalness: 0.82,
  });

  let coreColor = TACTICAL_CATALOG[deployableId].colorHex;
  if (team === 'enemy') coreColor = 0xf43f5e;

  const coreMat = new THREE.MeshStandardMaterial({
    color: coreColor,
    emissive: coreColor,
    emissiveIntensity: 0.75,
    roughness: 0.2,
    metalness: 0.5,
  });

  let coreMesh: THREE.Mesh;
  let ringMesh: THREE.Mesh;

  if (deployableId === 'barricade') {
    // Composite 7-part Runic Stone Wall Barricade (Blocks movement)
    const baseSlab = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.45, 1.35), darkMetalMat);
    baseSlab.position.y = 0.225;
    baseSlab.castShadow = true;
    baseSlab.receiveShadow = true;
    root.add(baseSlab);

    const centerWall = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.75, 0.95), stoneMat);
    centerWall.position.y = 1.05;
    centerWall.castShadow = true;
    centerWall.receiveShadow = true;
    root.add(centerWall);

    // Left & right reinforced pillars
    for (const side of [-1.65, 1.65]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 2.2, 6), darkMetalMat);
      pillar.position.set(side, 1.1, 0);
      pillar.castShadow = true;
      root.add(pillar);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.5, 6), bronzeMat);
      cap.position.set(side, 2.45, 0);
      root.add(cap);
    }

    // Glowing rune core embedded in center of wall
    coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.52, 0), coreMat);
    coreMesh.position.set(0, 1.35, 0);
    root.add(coreMesh);

    ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(1.9, 2.15, 24),
      new THREE.MeshBasicMaterial({
        color: teamColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
    );
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.05;
    root.add(ringMesh);
  } else if (deployableId === 'snap_trap') {
    // Composite 6-part Mechanical Jaw Trap
    const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.5, 0.18, 12), darkMetalMat);
    basePlate.position.y = 0.09;
    root.add(basePlate);

    const innerGear = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.24, 8), bronzeMat);
    innerGear.position.y = 0.14;
    root.add(innerGear);

    // 4 toothed mechanical claws around the perimeter
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
      const jaw = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.85, 4), stoneMat);
      jaw.position.set(Math.cos(angle) * 1.05, 0.42, Math.sin(angle) * 1.05);
      jaw.rotation.z = Math.cos(angle) * 0.35;
      jaw.rotation.x = -Math.sin(angle) * 0.35;
      root.add(jaw);
    }

    coreMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 12), coreMat);
    coreMesh.position.y = 0.22;
    root.add(coreMesh);

    ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(1.95, 2.2, 28),
      new THREE.MeshBasicMaterial({
        color: coreColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      })
    );
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.04;
    root.add(ringMesh);
  } else if (deployableId === 'aether_totem') {
    // Composite 6-part Floating Rune Totem with Aura Ring
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.1, 0.5, 8), stoneMat);
    pedestal.position.y = 0.25;
    pedestal.castShadow = true;
    root.add(pedestal);

    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.58, 1.9, 6), bronzeMat);
    column.position.y = 1.35;
    column.castShadow = true;
    root.add(column);

    coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), coreMat);
    coreMesh.position.y = 2.75;
    root.add(coreMesh);

    const orbitHalo = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 8, 24), bronzeMat);
    orbitHalo.position.y = 2.75;
    orbitHalo.rotation.x = Math.PI / 3;
    coreMesh.add(orbitHalo);

    ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(3.85, 4.15, 36),
      new THREE.MeshBasicMaterial({
        color: coreColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
    );
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.05;
    root.add(ringMesh);
  } else {
    // prismatic_pylon: Composite Crystal Relay & Lightning Conductor
    const tripodBase = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.15, 0.45, 6), darkMetalMat);
    tripodBase.position.y = 0.225;
    root.add(tripodBase);

    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.9, 0.22), bronzeMat);
      strut.position.set(Math.cos(a) * 0.55, 1.15, Math.sin(a) * 0.55);
      strut.rotation.z = Math.cos(a) * 0.18;
      strut.rotation.x = -Math.sin(a) * 0.18;
      root.add(strut);
    }

    coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.72, 1), coreMat);
    coreMesh.position.y = 2.35;
    root.add(coreMesh);

    ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(1.75, 2.0, 24),
      new THREE.MeshBasicMaterial({
        color: coreColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      })
    );
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.05;
    root.add(ringMesh);
  }

  // State Overlay Group (Cryo ice spikes + expanded elemental aura ring)
  const stateOverlayGroup = new THREE.Group();
  root.add(stateOverlayGroup);

  const cryoSpikes = new THREE.Group();
  cryoSpikes.visible = false;
  const iceMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x0284c7,
    emissiveIntensity: 0.65,
    roughness: 0.15,
    metalness: 0.3,
    transparent: true,
    opacity: 0.88,
  });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.55, 5), iceMat);
    spike.position.set(Math.cos(a) * 1.1, 0.75, Math.sin(a) * 1.1);
    spike.rotation.z = -Math.cos(a) * 0.32;
    spike.rotation.x = Math.sin(a) * 0.32;
    cryoSpikes.add(spike);
  }
  stateOverlayGroup.add(cryoSpikes);

  const auraMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const auraRing = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.0, 40), auraMat);
  auraRing.rotation.x = -Math.PI / 2;
  auraRing.position.y = 0.06;
  stateOverlayGroup.add(auraRing);

  return {
    root,
    coreMesh,
    ringMesh,
    stateOverlayGroup,
    cryoSpikes,
    auraRing,
    auraMat,
  };
}

export function updateDeployableRigVisuals(
  rig: DeployableRig,
  deployableId: DeployableId,
  state: DeployableState,
  elapsed: number,
  hitFlashTimer: number
) {
  const coreMat = rig.coreMesh.material as THREE.MeshStandardMaterial;

  if (deployableId === 'aether_totem' || deployableId === 'prismatic_pylon') {
    rig.coreMesh.rotation.y = elapsed * 1.8;
    rig.coreMesh.position.y =
      (deployableId === 'aether_totem' ? 2.75 : 2.35) + Math.sin(elapsed * 3.2) * 0.16;
  } else if (deployableId === 'barricade') {
    rig.coreMesh.rotation.y = elapsed * 1.1;
  }

  rig.cryoSpikes.visible = state === 'cryo_trap';

  if (hitFlashTimer > 0) {
    coreMat.emissive.setHex(0xffffff);
    coreMat.emissiveIntensity = 1.6;
    return;
  }

  if (state === 'pyro_infused') {
    coreMat.color.setHex(0xf97316);
    coreMat.emissive.setHex(0xea580c);
    coreMat.emissiveIntensity = 1.2 + Math.sin(elapsed * 8) * 0.3;
    rig.auraMat.color.setHex(0xf97316);
    rig.auraMat.opacity = 0.48;
    rig.auraRing.scale.setScalar(5.2);
  } else if (state === 'cryo_trap') {
    coreMat.color.setHex(0x38bdf8);
    coreMat.emissive.setHex(0x0284c7);
    coreMat.emissiveIntensity = 1.1;
    rig.auraMat.color.setHex(0x38bdf8);
    rig.auraMat.opacity = 0.52;
    rig.auraRing.scale.setScalar(4.6);
  } else if (state === 'volt_charged') {
    coreMat.color.setHex(0xc084fc);
    coreMat.emissive.setHex(0x9333ea);
    coreMat.emissiveIntensity = 1.35;
    rig.auraMat.color.setHex(0xa855f7);
    rig.auraMat.opacity = 0.45;
    rig.auraRing.scale.setScalar(4.8);
  } else if (state === 'vitae_overcharged') {
    coreMat.color.setHex(0x34d399);
    coreMat.emissive.setHex(0x10b981);
    coreMat.emissiveIntensity = 1.3;
    rig.auraMat.color.setHex(0x10b981);
    rig.auraMat.opacity = 0.55;
    rig.auraRing.scale.setScalar(7.5);
  } else {
    const defaultHex = TACTICAL_CATALOG[deployableId].colorHex;
    coreMat.color.setHex(defaultHex);
    coreMat.emissive.setHex(defaultHex);
    coreMat.emissiveIntensity = 0.75;
    rig.auraMat.opacity = 0;
  }
}

// ============================================================================
// ACTIVE ELIXIR ZONES (4 DISTINCT ZONE TYPES) & PARABOLIC FLASK PROJECTILES
// ============================================================================

export interface ActiveElixirZone {
  id: string;
  elixirId: ElixirId;
  team: TeamId;
  ownerEntityId: string;
  x: number;
  z: number;
  radius: number;
  remaining: number;
  maxDuration: number;
  tickAccum: number;
  group: THREE.Group;
  innerDiscMat: THREE.MeshBasicMaterial;
  outerRingMat: THREE.MeshBasicMaterial;
  accentGroup: THREE.Group;
}

export function createElixirZoneInstance(opts: {
  id: string;
  elixirId: ElixirId;
  team: TeamId;
  ownerEntityId: string;
  x: number;
  z: number;
  radius: number;
  duration: number;
}): ActiveElixirZone {
  const group = new THREE.Group();
  group.position.set(opts.x, 0.05, opts.z);

  const colorHex = TACTICAL_CATALOG[opts.elixirId].colorHex;

  const innerDiscMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: opts.elixirId === 'volt_stealth' ? 0.22 : 0.28,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const innerDisc = new THREE.Mesh(new THREE.CircleGeometry(opts.radius, 36), innerDiscMat);
  innerDisc.rotation.x = -Math.PI / 2;
  group.add(innerDisc);

  const outerRingMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const outerRing = new THREE.Mesh(
    new THREE.RingGeometry(opts.radius * 0.9, opts.radius, 40),
    outerRingMat
  );
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.02;
  group.add(outerRing);

  const accentGroup = new THREE.Group();
  group.add(accentGroup);

  if (opts.elixirId === 'pyro_damage') {
    // Pyro Damaged Area: Searing magma fissures & flame pillars
    const spireMat = new THREE.MeshBasicMaterial({
      color: 0xfb923c,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const dist = opts.radius * 0.55;
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.35, 5), spireMat);
      flame.position.set(Math.cos(a) * dist, 0.65, Math.sin(a) * dist);
      accentGroup.add(flame);
    }
  } else if (opts.elixirId === 'cryo_block') {
    // Cryo Block Area: Jagged physical glacier crystals that block unit movement
    const glacierMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.15,
      metalness: 0.25,
      transparent: true,
      opacity: 0.92,
    });
    const centerMonolith = new THREE.Mesh(new THREE.ConeGeometry(1.15, 2.7, 6), glacierMat);
    centerMonolith.position.y = 1.35;
    accentGroup.add(centerMonolith);

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const dist = opts.radius * 0.58;
      const shard = new THREE.Mesh(new THREE.ConeGeometry(0.68, 1.95, 5), glacierMat);
      shard.position.set(Math.cos(a) * dist, 0.95, Math.sin(a) * dist);
      shard.rotation.z = -Math.cos(a) * 0.22;
      shard.rotation.x = Math.sin(a) * 0.22;
      accentGroup.add(shard);
    }
  } else if (opts.elixirId === 'volt_stealth') {
    // Volt Invisible Area: Ionized translucent stealth dome + static ring
    const domeMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(opts.radius, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
      domeMat
    );
    accentGroup.add(dome);
  } else if (opts.elixirId === 'vitae_heal') {
    // Vitae Healing Area: Inner sanctuary cross & rising emerald beacons
    const healMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(opts.radius * 0.45, opts.radius * 0.54, 32),
      healMat
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.03;
    accentGroup.add(innerRing);
  }

  return {
    id: opts.id,
    elixirId: opts.elixirId,
    team: opts.team,
    ownerEntityId: opts.ownerEntityId,
    x: opts.x,
    z: opts.z,
    radius: opts.radius,
    remaining: opts.duration,
    maxDuration: opts.duration,
    tickAccum: 0,
    group,
    innerDiscMat,
    outerRingMat,
    accentGroup,
  };
}

export interface FlyingElixirFlask {
  elixirId: ElixirId;
  team: TeamId;
  ownerEntityId: string;
  startX: number;
  startZ: number;
  targetX: number;
  targetZ: number;
  elapsed: number;
  duration: number;
  isReflectedBounce: boolean;
  mesh: THREE.Group;
}

export function createElixirFlaskMesh(elixirId: ElixirId): THREE.Group {
  const group = new THREE.Group();
  const colorHex = TACTICAL_CATALOG[elixirId].colorHex;

  const body = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42, 1),
    new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 1.1,
      roughness: 0.15,
      metalness: 0.3,
    })
  );
  group.add(body);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.22, 0.28, 8),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.8 })
  );
  neck.position.y = 0.38;
  group.add(neck);

  return group;
}
