import * as THREE from 'three';
import { HeroAnimState, HeroId, TeamId } from '../types/game';
import { HERO_DEFINITIONS } from './heroDefinitions';
import {
  createDetailedMesh,
  createDetailedPbrMaterial,
} from '../rendering/proceduralTextures';

export interface HeroRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weaponGroup: THREE.Group;
  extraGroup: THREE.Group;
  teamRing: THREE.Mesh;
  shieldMesh: THREE.Mesh;
  materialsToFlash: THREE.MeshStandardMaterial[];
}

export function createHeroRig(heroId: HeroId, team: TeamId = 'ally'): HeroRig {
  const def = HERO_DEFINITIONS[heroId];
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  const headGroup = new THREE.Group();
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  const weaponGroup = new THREE.Group();
  const extraGroup = new THREE.Group();
  const materialsToFlash: THREE.MeshStandardMaterial[] = [];

  const registerMat = (mat: THREE.MeshStandardMaterial) => {
    mat.userData.baseEmissive = mat.emissive.getHex();
    mat.userData.baseEmissiveIntensity = mat.emissiveIntensity;
    materialsToFlash.push(mat);
    return mat;
  };

  // 1. Mobile Optimized Matte Ground Disc
  const shadowGeo = new THREE.CircleGeometry(1.25, 12);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x050508,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.position.y = 0.02;
  root.add(shadowDisc);

  // Team identification ring on ground
  const ringColor = team === 'ally' ? 0x10b981 : team === 'enemy' ? 0xef4444 : def.accentColor;
  const ringGeo = new THREE.RingGeometry(1.15, 1.35, 16);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: ringColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const teamRing = new THREE.Mesh(ringGeo, ringMat);
  teamRing.position.y = 0.04;
  root.add(teamRing);

  // Shield bubble
  const shieldGeo = new THREE.IcosahedronGeometry(1.85, 1);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
  });
  const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
  shieldMesh.position.y = 1.6;
  shieldMesh.visible = false;
  root.add(shieldMesh);

  root.add(bodyGroup);
  bodyGroup.add(headGroup);
  bodyGroup.add(leftArm);
  bodyGroup.add(rightArm);
  bodyGroup.add(leftLeg);
  bodyGroup.add(rightLeg);
  bodyGroup.add(extraGroup);

  // ==========================================
  // 1. VANGUARD: Ignis Valen (Fighter/Brawler)
  // Two-Handed Executioner Claymore & Cinder Ember
  // ==========================================
  if (heroId === 'vanguard') {
    const armorMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'armor',
        primaryHex: 0x8f2526,
        secondaryHex: 0x27293d,
        accentHex: 0xe86a17,
        roughness: 0.84,
        metalness: 0.15,
        flatShading: true,
      })
    );
    const darkClothMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'cloth',
        primaryHex: 0x27293d,
        secondaryHex: 0x161824,
        accentHex: 0xe86a17,
        roughness: 0.88,
        metalness: 0.05,
        flatShading: true,
      })
    );
    const bladeSteelMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'blade',
        primaryHex: 0x8f2526,
        secondaryHex: 0x27293d,
        accentHex: 0xe86a17,
        roughness: 0.78,
        metalness: 0.25,
        flatShading: true,
      })
    );
    const cinderGlowMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'crystal',
        primaryHex: 0xe86a17,
        secondaryHex: 0x8f2526,
        accentHex: 0xfef08a,
        emissiveHex: 0xe86a17,
        emissiveIntensity: 0.65,
        roughness: 0.65,
        metalness: 0.1,
        flatShading: true,
      })
    );

    // Pelvis & Belt
    const pelvis = createDetailedMesh(
      new THREE.CylinderGeometry(0.38, 0.32, 0.28, 6),
      darkClothMat,
      0x27293d,
      0x8f2526,
      0xe86a17
    );
    pelvis.position.y = 1.15;
    pelvis.scale.set(1.1, 1.0, 0.8);
    bodyGroup.add(pelvis);

    const belt = createDetailedMesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.08, 8),
      armorMat,
      0x161824,
      0x27293d,
      0xe86a17
    );
    belt.position.y = 1.28;
    belt.scale.set(1.08, 1.0, 0.85);
    bodyGroup.add(belt);

    const buckle = createDetailedMesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.12),
      cinderGlowMat,
      0xe86a17,
      0xfef08a,
      0xffffff
    );
    buckle.position.set(0, 1.28, 0.36);
    bodyGroup.add(buckle);

    // Two-Stage Torso (Flexible Abdomen + Flaring Chest)
    const ab = createDetailedMesh(
      new THREE.CylinderGeometry(0.36, 0.33, 0.32, 6),
      darkClothMat,
      0x161824,
      0x27293d,
      0xe86a17
    );
    ab.position.y = 1.45;
    ab.scale.set(1.05, 1.0, 0.75);
    bodyGroup.add(ab);

    const chestGeo = new THREE.ConeGeometry(0.52, 0.48, 6);
    chestGeo.rotateX(Math.PI);
    const chest = createDetailedMesh(
      chestGeo,
      armorMat,
      0x8f2526,
      0x27293d,
      0xe86a17
    );
    chest.position.y = 1.8;
    chest.scale.set(1.15, 1.0, 0.8);
    chest.castShadow = true;
    bodyGroup.add(chest);

    const chestPlate = createDetailedMesh(
      new THREE.BoxGeometry(0.45, 0.38, 0.16),
      armorMat,
      0x8f2526,
      0x27293d,
      0xe86a17
    );
    chestPlate.position.set(0, 1.84, 0.22);
    bodyGroup.add(chestPlate);

    const coreGem = createDetailedMesh(
      new THREE.OctahedronGeometry(0.1, 0),
      cinderGlowMat,
      0xe86a17,
      0xfef08a,
      0xffffff
    );
    coreGem.position.set(0, 1.84, 0.34);
    bodyGroup.add(coreGem);

    // Collar Gorget
    const gorget = createDetailedMesh(
      new THREE.TorusGeometry(0.28, 0.06, 4, 6),
      armorMat,
      0x27293d,
      0x8f2526,
      0xe86a17
    );
    gorget.rotation.x = Math.PI / 2;
    gorget.position.y = 2.06;
    bodyGroup.add(gorget);

    // Articulated Legs
    leftLeg.position.set(-0.32, 1.05, 0);
    rightLeg.position.set(0.32, 1.05, 0);

    const createLeg = (legGroup: THREE.Group) => {
      const thigh = createDetailedMesh(
        new THREE.CylinderGeometry(0.16, 0.12, 0.46, 5),
        darkClothMat,
        0x161824,
        0x27293d,
        0xe86a17
      );
      thigh.position.y = -0.22;
      legGroup.add(thigh);

      const knee = createDetailedMesh(
        new THREE.BoxGeometry(0.14, 0.14, 0.14),
        armorMat,
        0x8f2526,
        0x27293d,
        0xe86a17
      );
      knee.position.set(0, -0.46, 0.12);
      knee.rotation.x = Math.PI / 4;
      legGroup.add(knee);

      const calf = createDetailedMesh(
        new THREE.CylinderGeometry(0.14, 0.11, 0.44, 5),
        armorMat,
        0x8f2526,
        0x27293d,
        0xe86a17
      );
      calf.position.y = -0.68;
      legGroup.add(calf);

      const boot = createDetailedMesh(
        new THREE.BoxGeometry(0.18, 0.16, 0.32),
        armorMat,
        0x27293d,
        0x161824,
        0x8f2526
      );
      boot.position.set(0, -0.94, 0.06);
      legGroup.add(boot);
    };
    createLeg(leftLeg);
    createLeg(rightLeg);

    // Head: Knight Greathelm with Cheekplates & Visor
    headGroup.position.set(0, 2.32, 0);
    const helm = createDetailedMesh(
      new THREE.BoxGeometry(0.42, 0.46, 0.42),
      armorMat,
      0x8f2526,
      0x27293d,
      0xe86a17
    );
    headGroup.add(helm);

    const crestGeo = new THREE.ConeGeometry(0.08, 0.55, 4);
    crestGeo.rotateX(Math.PI / 6);
    const crest = createDetailedMesh(
      crestGeo,
      cinderGlowMat,
      0xe86a17,
      0xfef08a,
      0xffffff
    );
    crest.position.set(0, 0.35, -0.06);
    headGroup.add(crest);

    const visor = createDetailedMesh(
      new THREE.BoxGeometry(0.32, 0.06, 0.06),
      cinderGlowMat,
      0xe86a17,
      0xfef08a,
      0xffffff
    );
    visor.position.set(0, 0.02, 0.23);
    headGroup.add(visor);

    // Spiked Pauldrons
    leftArm.position.set(-0.64, 1.82, 0);
    rightArm.position.set(0.64, 1.82, 0);

    const createArm = (armGroup: THREE.Group, isRight: boolean) => {
      const pauldron = createDetailedMesh(
        new THREE.BoxGeometry(0.38, 0.32, 0.32),
        armorMat,
        0x8f2526,
        0x27293d,
        0xe86a17
      );
      pauldron.position.set(isRight ? 0.08 : -0.08, 0.08, 0);
      armGroup.add(pauldron);

      const bicep = createDetailedMesh(
        new THREE.CylinderGeometry(0.13, 0.1, 0.42, 5),
        darkClothMat,
        0x161824,
        0x27293d,
        0xe86a17
      );
      bicep.position.y = -0.22;
      armGroup.add(bicep);

      const elbow = createDetailedMesh(
        new THREE.BoxGeometry(0.12, 0.12, 0.12),
        armorMat,
        0x27293d,
        0x8f2526,
        0xe86a17
      );
      elbow.position.set(0, -0.44, -0.06);
      armGroup.add(elbow);

      const forearm = createDetailedMesh(
        new THREE.CylinderGeometry(0.12, 0.09, 0.4, 5),
        armorMat,
        0x8f2526,
        0x27293d,
        0xe86a17
      );
      forearm.position.y = -0.64;
      armGroup.add(forearm);
    };
    createArm(leftArm, false);
    createArm(rightArm, true);

    // Two-Handed Executioner Claymore
    weaponGroup.position.set(0.12, -0.65, 0.2);
    weaponGroup.rotation.x = Math.PI / 4;
    rightArm.add(weaponGroup);

    const hilt = createDetailedMesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.65, 5),
      darkClothMat,
      0x161824,
      0x27293d,
      0xe86a17
    );
    weaponGroup.add(hilt);

    const guard = createDetailedMesh(
      new THREE.BoxGeometry(0.44, 0.08, 0.12),
      armorMat,
      0x27293d,
      0x8f2526,
      0xe86a17
    );
    guard.position.y = 0.28;
    weaponGroup.add(guard);

    const blade = createDetailedMesh(
      new THREE.BoxGeometry(0.24, 1.5, 0.05),
      bladeSteelMat,
      0x8f2526,
      0x27293d,
      0xe86a17
    );
    blade.position.y = 1.05;
    weaponGroup.add(blade);

    const fullerCore = createDetailedMesh(
      new THREE.BoxGeometry(0.06, 1.3, 0.07),
      cinderGlowMat,
      0xe86a17,
      0xfef08a,
      0xffffff
    );
    fullerCore.position.y = 1.05;
    weaponGroup.add(fullerCore);

  // ==========================================
  // 2. ARCANIST: Vespera (Mage/Burst)
  // Cosmic Astrolabe Staff & Floating Tiara/Shards
  // ==========================================
  } else if (heroId === 'arcanist') {
    const robeMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'cloth',
        primaryHex: 0x4e2661,
        secondaryHex: 0x160a29,
        accentHex: 0x9f75e8,
        roughness: 0.88,
        metalness: 0.08,
        flatShading: true,
      })
    );
    const trimMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'cloth',
        primaryHex: 0x160a29,
        secondaryHex: 0x0c0517,
        accentHex: 0x9f75e8,
        roughness: 0.85,
        metalness: 0.12,
        flatShading: true,
      })
    );
    const crystalMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'crystal',
        primaryHex: 0x9f75e8,
        secondaryHex: 0x4e2661,
        accentHex: 0xf3e8ff,
        emissiveHex: 0x9f75e8,
        emissiveIntensity: 0.65,
        roughness: 0.55,
        metalness: 0.2,
        flatShading: true,
      })
    );

    // Lower Robe Drape (Majestic cloth silhouette concealing legs)
    const robeGeo = new THREE.ConeGeometry(0.72, 1.05, 7);
    const robe = createDetailedMesh(
      robeGeo,
      robeMat,
      0x160a29,
      0x4e2661,
      0x9f75e8
    );
    robe.position.y = 0.72;
    robe.scale.set(1.05, 1.0, 0.9);
    bodyGroup.add(robe);

    // Torso & Waist
    const waist = createDetailedMesh(
      new THREE.CylinderGeometry(0.32, 0.35, 0.32, 6),
      trimMat,
      0x160a29,
      0x4e2661,
      0x9f75e8
    );
    waist.position.y = 1.35;
    bodyGroup.add(waist);

    const chest = createDetailedMesh(
      new THREE.ConeGeometry(0.46, 0.45, 6),
      robeMat,
      0x160a29,
      0x4e2661,
      0x9f75e8
    );
    chest.position.y = 1.72;
    chest.rotation.x = Math.PI;
    bodyGroup.add(chest);

    // Floating Cosmic Orbital Shards in extraGroup
    extraGroup.position.set(0, 1.95, 0);
    for (const sx of [-0.68, 0.68]) {
      const shard = createDetailedMesh(
        new THREE.OctahedronGeometry(0.18, 0),
        crystalMat,
        0x9f75e8,
        0xf3e8ff,
        0xffffff
      );
      shard.position.set(sx, 0, 0);
      shard.scale.set(0.7, 1.5, 0.7);
      extraGroup.add(shard);
    }

    // Cosmic Cowl Head
    headGroup.position.set(0, 2.3, 0);
    const cowl = createDetailedMesh(
      new THREE.ConeGeometry(0.38, 0.68, 6),
      robeMat,
      0x160a29,
      0x4e2661,
      0x9f75e8
    );
    cowl.position.set(0, 0.04, -0.04);
    headGroup.add(cowl);

    const shadowFace = createDetailedMesh(
      new THREE.IcosahedronGeometry(0.18, 0),
      trimMat,
      0x0c0517,
      0x160a29,
      0x4e2661
    );
    shadowFace.position.set(0, 0.0, 0.1);
    headGroup.add(shadowFace);

    const tiara = createDetailedMesh(
      new THREE.OctahedronGeometry(0.12, 0),
      crystalMat,
      0x9f75e8,
      0xf3e8ff,
      0xffffff
    );
    tiara.position.set(0, 0.24, 0.22);
    headGroup.add(tiara);

    // Sleeved Arms
    leftArm.position.set(-0.56, 1.75, 0);
    rightArm.position.set(0.56, 1.75, 0);

    const lSleeve = createDetailedMesh(
      new THREE.ConeGeometry(0.24, 0.72, 6),
      robeMat,
      0x160a29,
      0x4e2661,
      0x9f75e8
    );
    lSleeve.position.y = -0.36;
    leftArm.add(lSleeve);

    const rSleeve = createDetailedMesh(
      new THREE.ConeGeometry(0.24, 0.72, 6),
      robeMat,
      0x160a29,
      0x4e2661,
      0x9f75e8
    );
    rSleeve.position.y = -0.36;
    rightArm.add(rSleeve);

    // Astrolabe Catalyst Staff
    weaponGroup.position.set(0.15, -0.2, 0.2);
    rightArm.add(weaponGroup);

    const staffShaft = createDetailedMesh(
      new THREE.CylinderGeometry(0.03, 0.03, 2.0, 6),
      trimMat,
      0x160a29,
      0x4e2661,
      0x9f75e8
    );
    weaponGroup.add(staffShaft);

    const gyroRing = createDetailedMesh(
      new THREE.TorusGeometry(0.28, 0.025, 4, 8),
      robeMat,
      0x4e2661,
      0x9f75e8,
      0xf3e8ff
    );
    gyroRing.position.y = 0.98;
    gyroRing.rotation.x = Math.PI / 3;
    weaponGroup.add(gyroRing);

    const catalystOrb = createDetailedMesh(
      new THREE.OctahedronGeometry(0.15, 0),
      crystalMat,
      0x9f75e8,
      0xf3e8ff,
      0xffffff
    );
    catalystOrb.position.y = 0.98;
    weaponGroup.add(catalystOrb);

  // ==========================================
  // 3. RANGER: Zephyr (Marksman/DPS)
  // Recurve Longbow, Split Cape & Quiver
  // ==========================================
  } else if (heroId === 'ranger') {
    const leatherMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'leather',
        primaryHex: 0x238276,
        secondaryHex: 0x1f3842,
        accentHex: 0x8be0bd,
        roughness: 0.85,
        metalness: 0.08,
        flatShading: true,
      })
    );
    const forestDarkMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'cloth',
        primaryHex: 0x1f3842,
        secondaryHex: 0x122229,
        accentHex: 0x8be0bd,
        roughness: 0.88,
        metalness: 0.05,
        flatShading: true,
      })
    );
    const windGlowMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'crystal',
        primaryHex: 0x8be0bd,
        secondaryHex: 0x238276,
        accentHex: 0xffffff,
        emissiveHex: 0x8be0bd,
        emissiveIntensity: 0.55,
        roughness: 0.6,
        metalness: 0.1,
        flatShading: true,
      })
    );

    // Pelvis & Legs
    const pelvis = createDetailedMesh(
      new THREE.CylinderGeometry(0.34, 0.28, 0.26, 6),
      forestDarkMat,
      0x122229,
      0x1f3842,
      0x238276
    );
    pelvis.position.y = 1.15;
    pelvis.scale.set(1.05, 1.0, 0.75);
    bodyGroup.add(pelvis);

    leftLeg.position.set(-0.28, 1.05, 0);
    rightLeg.position.set(0.28, 1.05, 0);

    const createHunterLeg = (legGroup: THREE.Group) => {
      const thigh = createDetailedMesh(
        new THREE.CylinderGeometry(0.14, 0.11, 0.44, 5),
        forestDarkMat,
        0x122229,
        0x1f3842,
        0x8be0bd
      );
      thigh.position.y = -0.22;
      legGroup.add(thigh);

      const calf = createDetailedMesh(
        new THREE.CylinderGeometry(0.12, 0.09, 0.42, 5),
        leatherMat,
        0x1f3842,
        0x238276,
        0x8be0bd
      );
      calf.position.y = -0.66;
      legGroup.add(calf);

      const boot = createDetailedMesh(
        new THREE.BoxGeometry(0.16, 0.14, 0.3),
        leatherMat,
        0x122229,
        0x1f3842,
        0x238276
      );
      boot.position.set(0, -0.92, 0.06);
      legGroup.add(boot);
    };
    createHunterLeg(leftLeg);
    createHunterLeg(rightLeg);

    // Lean Torso & Split Wind Cape
    const torso = createDetailedMesh(
      new THREE.ConeGeometry(0.45, 0.72, 6),
      leatherMat,
      0x1f3842,
      0x238276,
      0x8be0bd
    );
    torso.position.y = 1.62;
    torso.rotation.x = Math.PI;
    torso.scale.set(1.05, 1.0, 0.75);
    bodyGroup.add(torso);

    const cape = createDetailedMesh(
      new THREE.BoxGeometry(0.44, 0.95, 0.04),
      forestDarkMat,
      0x122229,
      0x1f3842,
      0x238276
    );
    cape.position.set(0, 1.35, -0.24);
    cape.rotation.x = 0.18;
    extraGroup.add(cape);

    // Diagonal Quiver with fletched arrows
    const quiver = createDetailedMesh(
      new THREE.CylinderGeometry(0.09, 0.08, 0.68, 5),
      leatherMat,
      0x122229,
      0x1f3842,
      0x238276
    );
    quiver.position.set(0.18, 1.75, -0.24);
    quiver.rotation.z = -0.35;
    quiver.rotation.x = 0.25;
    extraGroup.add(quiver);

    // Scout Hood & Eagle Feather
    headGroup.position.set(0, 2.28, 0);
    const hood = createDetailedMesh(
      new THREE.CylinderGeometry(0.18, 0.34, 0.44, 6),
      leatherMat,
      0x1f3842,
      0x238276,
      0x8be0bd
    );
    headGroup.add(hood);

    const feather = createDetailedMesh(
      new THREE.ConeGeometry(0.05, 0.45, 3),
      windGlowMat,
      0x8be0bd,
      0xffffff,
      0xffffff
    );
    feather.position.set(-0.25, 0.22, -0.05);
    feather.rotation.z = Math.PI / 4;
    headGroup.add(feather);

    // Arms: Asymmetrical archer shoulder guard
    leftArm.position.set(-0.58, 1.75, 0);
    rightArm.position.set(0.58, 1.75, 0);

    const archerGuard = createDetailedMesh(
      new THREE.BoxGeometry(0.28, 0.26, 0.26),
      leatherMat,
      0x1f3842,
      0x238276,
      0x8be0bd
    );
    leftArm.add(archerGuard);

    // Recurve Composite Bow in left hand
    weaponGroup.position.set(0, -0.65, 0.25);
    leftArm.add(weaponGroup);

    const bowShaft = createDetailedMesh(
      new THREE.TorusGeometry(0.68, 0.032, 4, 10, Math.PI),
      leatherMat,
      0x1f3842,
      0x238276,
      0x8be0bd
    );
    bowShaft.rotation.z = Math.PI / 2;
    weaponGroup.add(bowShaft);

    const bowString = createDetailedMesh(
      new THREE.CylinderGeometry(0.008, 0.008, 1.32, 3),
      windGlowMat,
      0x8be0bd,
      0xffffff,
      0xffffff
    );
    bowString.position.x = -0.06;
    weaponGroup.add(bowString);

  // ==========================================
  // 4. WRAITH: Umbra (Assassin/Duelist)
  // Twin Reverse-Grip Trench Daggers & Scarf Tail
  // ==========================================
  } else if (heroId === 'wraith') {
    const stealthMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'leather',
        primaryHex: 0x1c1c20,
        secondaryHex: 0x0f0f12,
        accentHex: 0xe6004c,
        roughness: 0.82,
        metalness: 0.18,
        flatShading: true,
      })
    );
    const maroonMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'cloth',
        primaryHex: 0x3d0c13,
        secondaryHex: 0x1c1c20,
        accentHex: 0xe6004c,
        roughness: 0.86,
        metalness: 0.08,
        flatShading: true,
      })
    );
    const neonCrimsonMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'blade',
        primaryHex: 0xe6004c,
        secondaryHex: 0x3d0c13,
        accentHex: 0xffffff,
        emissiveHex: 0xe6004c,
        emissiveIntensity: 0.75,
        roughness: 0.65,
        metalness: 0.25,
        flatShading: true,
      })
    );

    // Slim Shinobi Torso
    const torso = createDetailedMesh(
      new THREE.CylinderGeometry(0.38, 0.3, 0.68, 6),
      stealthMat,
      0x0f0f12,
      0x1c1c20,
      0x3d0c13
    );
    torso.position.y = 1.48;
    torso.scale.set(1.05, 1.0, 0.75);
    bodyGroup.add(torso);

    // Shinobi Legs
    leftLeg.position.set(-0.25, 1.05, 0);
    rightLeg.position.set(0.25, 1.05, 0);

    const createNinjaLeg = (legGroup: THREE.Group) => {
      const legMesh = createDetailedMesh(
        new THREE.CylinderGeometry(0.13, 0.09, 0.82, 5),
        stealthMat,
        0x0f0f12,
        0x1c1c20,
        0xe6004c
      );
      legMesh.position.y = -0.42;
      legGroup.add(legMesh);
    };
    createNinjaLeg(leftLeg);
    createNinjaLeg(rightLeg);

    // Ninja Mask & Dual Slit Neon Crimson Optics
    headGroup.position.set(0, 2.26, 0);
    const mask = createDetailedMesh(
      new THREE.IcosahedronGeometry(0.25, 0),
      stealthMat,
      0x0f0f12,
      0x1c1c20,
      0x3d0c13
    );
    headGroup.add(mask);

    const scarf = createDetailedMesh(
      new THREE.TorusGeometry(0.25, 0.07, 4, 6),
      maroonMat,
      0x1c1c20,
      0x3d0c13,
      0xe6004c
    );
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = -0.18;
    headGroup.add(scarf);

    const scarfTail = createDetailedMesh(
      new THREE.BoxGeometry(0.12, 0.45, 0.04),
      maroonMat,
      0x1c1c20,
      0x3d0c13,
      0xe6004c
    );
    scarfTail.position.set(0.22, -0.32, -0.26);
    scarfTail.rotation.x = 0.55;
    scarfTail.rotation.z = -0.35;
    headGroup.add(scarfTail);

    for (const ex of [-0.08, 0.08]) {
      const optic = createDetailedMesh(
        new THREE.BoxGeometry(0.07, 0.02, 0.03),
        neonCrimsonMat,
        0xe6004c,
        0xffffff,
        0xffffff
      );
      optic.position.set(ex, 0.02, 0.24);
      headGroup.add(optic);
    }

    // Arms & Twin Reverse-Grip Trench Daggers
    leftArm.position.set(-0.55, 1.72, 0);
    rightArm.position.set(0.55, 1.72, 0);

    const daggerGeoL = new THREE.ConeGeometry(0.08, 0.65, 4);
    daggerGeoL.rotateX(-Math.PI * 0.85);
    const daggerL = createDetailedMesh(
      daggerGeoL,
      neonCrimsonMat,
      0x3d0c13,
      0xe6004c,
      0xffffff
    );
    daggerL.position.set(0, -0.68, 0.1);
    leftArm.add(daggerL);

    const daggerGeoR = new THREE.ConeGeometry(0.08, 0.65, 4);
    daggerGeoR.rotateX(-Math.PI * 0.85);
    const daggerR = createDetailedMesh(
      daggerGeoR,
      neonCrimsonMat,
      0x3d0c13,
      0xe6004c,
      0xffffff
    );
    daggerR.position.set(0, -0.68, 0.1);
    rightArm.add(daggerR);

  // ==========================================
  // 5. COLOSSUS: Balthazar (Tank/Disrupter)
  // Monolithic Boulder Head, Tower Shield & Hammer
  // ==========================================
  } else {
    const rockMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'stone',
        primaryHex: 0x4f483d,
        secondaryHex: 0x262c22,
        accentHex: 0xd4b35d,
        roughness: 0.92,
        metalness: 0.05,
        flatShading: true,
      })
    );
    const mossStoneMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'stone',
        primaryHex: 0x262c22,
        secondaryHex: 0x1b1713,
        accentHex: 0xd4b35d,
        roughness: 0.94,
        metalness: 0.04,
        flatShading: true,
      })
    );
    const runeGoldMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'crystal',
        primaryHex: 0xd4b35d,
        secondaryHex: 0x4f483d,
        accentHex: 0xffffff,
        emissiveHex: 0xd4b35d,
        emissiveIntensity: 0.58,
        roughness: 0.72,
        metalness: 0.15,
        flatShading: true,
      })
    );

    // Hulking Basalt Torso & Hunchback Crag
    const torso = createDetailedMesh(
      new THREE.DodecahedronGeometry(0.85, 0),
      rockMat,
      0x1b1713,
      0x4f483d,
      0xd4b35d
    );
    torso.position.y = 1.62;
    torso.scale.set(1.25, 1.1, 0.95);
    torso.castShadow = true;
    bodyGroup.add(torso);

    const crag = createDetailedMesh(
      new THREE.IcosahedronGeometry(0.48, 0),
      mossStoneMat,
      0x1b1713,
      0x262c22,
      0x4f483d
    );
    crag.position.set(0, 1.82, -0.32);
    crag.scale.set(1.2, 0.9, 1.0);
    bodyGroup.add(crag);

    // Heavy Rock Legs
    leftLeg.position.set(-0.46, 0.9, 0);
    rightLeg.position.set(0.46, 0.9, 0);

    const createRockLeg = (legGroup: THREE.Group) => {
      const leg = createDetailedMesh(
        new THREE.CylinderGeometry(0.22, 0.18, 0.78, 5),
        rockMat,
        0x1b1713,
        0x4f483d,
        0x262c22
      );
      leg.position.y = -0.38;
      legGroup.add(leg);

      const boot = createDetailedMesh(
        new THREE.BoxGeometry(0.28, 0.22, 0.42),
        mossStoneMat,
        0x1b1713,
        0x262c22,
        0xd4b35d
      );
      boot.position.set(0, -0.84, 0.08);
      legGroup.add(boot);
    };
    createRockLeg(leftLeg);
    createRockLeg(rightLeg);

    // Monolithic Head
    headGroup.position.set(0, 2.32, 0.12);
    const head = createDetailedMesh(
      new THREE.BoxGeometry(0.54, 0.5, 0.48),
      rockMat,
      0x262c22,
      0x4f483d,
      0xd4b35d
    );
    headGroup.add(head);

    const brow = createDetailedMesh(
      new THREE.BoxGeometry(0.56, 0.14, 0.18),
      mossStoneMat,
      0x1b1713,
      0x262c22,
      0xd4b35d
    );
    brow.position.set(0, 0.14, 0.26);
    headGroup.add(brow);

    const runeEyes = createDetailedMesh(
      new THREE.BoxGeometry(0.42, 0.06, 0.06),
      runeGoldMat,
      0xd4b35d,
      0xffffff,
      0xffffff
    );
    runeEyes.position.set(0, 0.02, 0.28);
    headGroup.add(runeEyes);

    // Fortress Rampart Shoulders & Arms
    leftArm.position.set(-0.95, 1.88, 0);
    rightArm.position.set(0.95, 1.88, 0);

    const lPauldron = createDetailedMesh(
      new THREE.BoxGeometry(0.52, 0.48, 0.48),
      rockMat,
      0x262c22,
      0x4f483d,
      0xd4b35d
    );
    leftArm.add(lPauldron);

    const rPauldron = createDetailedMesh(
      new THREE.BoxGeometry(0.52, 0.48, 0.48),
      rockMat,
      0x262c22,
      0x4f483d,
      0xd4b35d
    );
    rightArm.add(rPauldron);

    // Massive Fortress Tower Shield on Left Arm
    const shield = createDetailedMesh(
      new THREE.BoxGeometry(0.8, 1.45, 0.18),
      mossStoneMat,
      0x1b1713,
      0x262c22,
      0xd4b35d
    );
    shield.position.set(0, -0.38, 0.38);
    shield.rotation.y = 0.15;
    leftArm.add(shield);

    const shieldBoss = createDetailedMesh(
      new THREE.OctahedronGeometry(0.24, 0),
      runeGoldMat,
      0xd4b35d,
      0xffffff,
      0xffffff
    );
    shieldBoss.position.set(0, -0.38, 0.52);
    leftArm.add(shieldBoss);

    // Granite Warhammer Rested on Right Shoulder
    weaponGroup.position.set(0.12, -0.2, 0.1);
    weaponGroup.rotation.x = -0.65;
    rightArm.add(weaponGroup);

    const shaft = createDetailedMesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.35, 5),
      mossStoneMat,
      0x1b1713,
      0x262c22,
      0x4f483d
    );
    weaponGroup.add(shaft);

    const hammerHead = createDetailedMesh(
      new THREE.BoxGeometry(0.44, 0.35, 0.35),
      rockMat,
      0x262c22,
      0x4f483d,
      0xd4b35d
    );
    hammerHead.position.y = 0.68;
    weaponGroup.add(hammerHead);
  }

  return {
    root,
    bodyGroup,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weaponGroup,
    extraGroup,
    teamRing,
    shieldMesh,
    materialsToFlash,
  };
}

export function updateHeroRigAnimation(
  rig: HeroRig,
  heroId: HeroId,
  state: HeroAnimState,
  animTime: number,
  hitFlashTimer: number,
  hasShield: boolean
) {
  rig.shieldMesh.visible = hasShield;
  if (hasShield) {
    rig.shieldMesh.rotation.y = animTime * 1.4;
  }

  // Hit flash modulation
  const isFlashing = hitFlashTimer > 0;
  for (let i = 0; i < rig.materialsToFlash.length; i++) {
    const mat = rig.materialsToFlash[i];
    if (isFlashing) {
      mat.emissive.setHex(0xffffff);
      mat.emissiveIntensity = 0.9;
    } else {
      mat.emissive.setHex(mat.userData.baseEmissive ?? 0x000000);
      mat.emissiveIntensity = mat.userData.baseEmissiveIntensity ?? 0;
    }
  }

  // Reset base transforms smoothly
  rig.bodyGroup.position.set(0, 0, 0);
  rig.bodyGroup.rotation.set(0, 0, 0);
  rig.headGroup.rotation.set(0, 0, 0);
  rig.leftArm.rotation.set(0, 0, 0);
  rig.rightArm.rotation.set(0, 0, 0);
  rig.leftLeg.rotation.set(0, 0, 0);
  rig.rightLeg.rotation.set(0, 0, 0);
  rig.extraGroup.rotation.set(0, 0, 0);

  if (heroId === 'arcanist') {
    rig.extraGroup.rotation.y = animTime * 2.2;
  }

  if (state === 'idle') {
    const breathe = Math.sin(animTime * 2.6) * 0.04;
    rig.bodyGroup.position.y = breathe;
    rig.leftArm.rotation.x = Math.sin(animTime * 2.0) * 0.06;
    rig.rightArm.rotation.x = -Math.sin(animTime * 2.0) * 0.06;
    rig.headGroup.rotation.y = Math.sin(animTime * 1.1) * 0.08;
  } else if (state === 'walk') {
    const pace = animTime * 10.5;
    const bounce = Math.abs(Math.sin(pace)) * 0.12;
    rig.bodyGroup.position.y = bounce;
    rig.bodyGroup.rotation.x = 0.12;
    rig.leftLeg.rotation.x = Math.sin(pace) * 0.65;
    rig.rightLeg.rotation.x = -Math.sin(pace) * 0.65;
    rig.leftArm.rotation.x = -Math.sin(pace) * 0.5;
    rig.rightArm.rotation.x = Math.sin(pace) * 0.5;
  } else if (state === 'attack') {
    const t = Math.min(1, animTime / 0.35);
    const swing = Math.sin(t * Math.PI);
    rig.bodyGroup.rotation.y = -swing * 0.45;
    rig.rightArm.rotation.x = -1.65 * swing;
    rig.rightArm.rotation.z = -0.35 * swing;
    rig.leftArm.rotation.x = 0.45 * swing;
    if (heroId === 'wraith') {
      rig.leftArm.rotation.x = -1.55 * Math.sin(Math.min(1, t * 1.2) * Math.PI);
    }
  } else if (state === 'skill') {
    const t = Math.min(1, animTime / 0.55);
    const pulse = Math.sin(t * Math.PI);
    if (heroId === 'vanguard') {
      rig.bodyGroup.position.y = pulse * 0.85;
      rig.bodyGroup.rotation.x = t < 0.5 ? -0.35 : 0.45;
      rig.rightArm.rotation.x = t < 0.5 ? -2.4 : -0.2;
      rig.leftArm.rotation.x = t < 0.5 ? -1.8 : -0.2;
    } else if (heroId === 'arcanist') {
      rig.bodyGroup.position.y = pulse * 0.65;
      rig.leftArm.rotation.z = 0.9 * pulse;
      rig.rightArm.rotation.x = -1.4 * pulse;
      rig.extraGroup.rotation.y = animTime * 9.0;
    } else if (heroId === 'ranger') {
      rig.bodyGroup.rotation.y = 0.35;
      rig.rightArm.rotation.x = -1.45;
      rig.leftArm.rotation.x = -1.25 - pulse * 0.4;
    } else if (heroId === 'wraith') {
      rig.bodyGroup.rotation.y = t * Math.PI * 2;
      rig.leftArm.rotation.x = -1.4;
      rig.rightArm.rotation.x = -1.4;
    } else {
      rig.bodyGroup.position.y = t < 0.45 ? pulse * 0.55 : 0;
      rig.leftArm.rotation.x = t < 0.45 ? -2.1 : -0.35;
      rig.rightArm.rotation.x = t < 0.45 ? -2.1 : -0.35;
    }
  }
}