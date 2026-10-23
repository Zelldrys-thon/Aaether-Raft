import * as THREE from 'three';
import { HeroAnimState, HeroId, TeamId } from '../types/game';
import { HERO_DEFINITIONS } from './heroDefinitions';

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

/**
 * Creates 1:1 identical faceted low-poly mesh matching Blender's shade_flat output
 */
function createFacetedMesh(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
  const nonIndexedGeo = geo.toNonIndexed();
  nonIndexedGeo.computeVertexNormals();
  const mesh = new THREE.Mesh(nonIndexedGeo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Matte PBR Material with exact flatShading & zero glare/distortion
 */
function createMatteMaterial(
  colorHex: number,
  roughness = 0.85,
  metalness = 0.08,
  emissiveHex = 0x000000,
  emissiveIntensity = 0.0
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness,
    metalness,
    flatShading: true,
    emissive: new THREE.Color(emissiveHex),
    emissiveIntensity,
  });
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

  // Common dark tone for flexible undersuit / joints
  const mDark = registerMat(createMatteMaterial(0x161822, 0.92, 0.02));

  // ==========================================
  // 1. VANGUARD: Ignis Valen (Fighter/Brawler)
  // Two-Handed Executioner Claymore & Cinder Ember
  // ==========================================
  if (heroId === 'vanguard') {
    const mPri = registerMat(createMatteMaterial(def.primaryColor, 0.84, 0.15));
    const mSec = registerMat(createMatteMaterial(def.secondaryColor, 0.88, 0.08));
    const mAcc = registerMat(createMatteMaterial(def.accentColor, 0.55, 0.22, def.accentColor, 0.45));

    // Pelvis & Belt
    const pelvis = createFacetedMesh(new THREE.CylinderGeometry(0.38, 0.32, 0.28, 6), mSec);
    pelvis.position.y = 1.15;
    pelvis.scale.set(1.1, 1.0, 0.8);
    bodyGroup.add(pelvis);

    const belt = createFacetedMesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 8), mDark);
    belt.position.y = 1.28;
    belt.scale.set(1.08, 1.0, 0.85);
    bodyGroup.add(belt);

    const buckle = createFacetedMesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), mAcc);
    buckle.position.set(0, 1.28, 0.36);
    bodyGroup.add(buckle);

    // Two-Stage Torso (Flexible Abdomen + Flaring Chest)
    const ab = createFacetedMesh(new THREE.CylinderGeometry(0.36, 0.33, 0.32, 6), mDark);
    ab.position.y = 1.45;
    ab.scale.set(1.05, 1.0, 0.75);
    bodyGroup.add(ab);

    const chestGeo = new THREE.ConeGeometry(0.52, 0.48, 6);
    chestGeo.rotateX(Math.PI);
    const chest = createFacetedMesh(chestGeo, mPri);
    chest.position.y = 1.8;
    chest.scale.set(1.15, 1.0, 0.8);
    bodyGroup.add(chest);

    const chestPlate = createFacetedMesh(new THREE.BoxGeometry(0.45, 0.38, 0.16), mSec);
    chestPlate.position.set(0, 1.84, 0.22);
    bodyGroup.add(chestPlate);

    const coreGem = createFacetedMesh(new THREE.OctahedronGeometry(0.1, 0), mAcc);
    coreGem.position.set(0, 1.84, 0.34);
    bodyGroup.add(coreGem);

    // Collar Gorget
    const gorget = createFacetedMesh(new THREE.TorusGeometry(0.28, 0.06, 4, 6), mSec);
    gorget.rotation.x = Math.PI / 2;
    gorget.position.y = 2.06;
    bodyGroup.add(gorget);

    // Articulated Legs
    leftLeg.position.set(-0.32, 1.05, 0);
    rightLeg.position.set(0.32, 1.05, 0);

    const createLeg = (legGroup: THREE.Group) => {
      const thigh = createFacetedMesh(new THREE.CylinderGeometry(0.16, 0.12, 0.46, 5), mDark);
      thigh.position.y = -0.22;
      legGroup.add(thigh);

      const knee = createFacetedMesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), mSec);
      knee.position.set(0, -0.46, 0.12);
      knee.rotation.x = Math.PI / 4;
      legGroup.add(knee);

      const calf = createFacetedMesh(new THREE.CylinderGeometry(0.14, 0.11, 0.44, 5), mPri);
      calf.position.y = -0.68;
      legGroup.add(calf);

      const boot = createFacetedMesh(new THREE.BoxGeometry(0.18, 0.16, 0.32), mSec);
      boot.position.set(0, -0.94, 0.06);
      legGroup.add(boot);
    };
    createLeg(leftLeg);
    createLeg(rightLeg);

    // Head: Knight Greathelm with Cheekplates & Visor
    headGroup.position.set(0, 2.32, 0);
    const helm = createFacetedMesh(new THREE.BoxGeometry(0.42, 0.46, 0.42), mPri);
    headGroup.add(helm);

    const crestGeo = new THREE.ConeGeometry(0.08, 0.55, 4);
    crestGeo.rotateX(Math.PI / 6);
    const crest = createFacetedMesh(crestGeo, mAcc);
    crest.position.set(0, 0.35, -0.06);
    headGroup.add(crest);

    const visor = createFacetedMesh(new THREE.BoxGeometry(0.32, 0.06, 0.06), mAcc);
    visor.position.set(0, 0.02, 0.23);
    headGroup.add(visor);

    // Spiked Pauldrons & Arms
    leftArm.position.set(-0.64, 1.82, 0);
    rightArm.position.set(0.64, 1.82, 0);

    const createArm = (armGroup: THREE.Group, isRight: boolean) => {
      const pauldron = createFacetedMesh(new THREE.BoxGeometry(0.38, 0.32, 0.32), mSec);
      pauldron.position.set(isRight ? 0.08 : -0.08, 0.08, 0);
      armGroup.add(pauldron);

      const spike = createFacetedMesh(new THREE.ConeGeometry(0.08, 0.28, 4), mAcc);
      spike.position.set(isRight ? 0.18 : -0.18, 0.26, 0);
      armGroup.add(spike);

      const bicep = createFacetedMesh(new THREE.CylinderGeometry(0.13, 0.1, 0.42, 5), mDark);
      bicep.position.y = -0.22;
      armGroup.add(bicep);

      const elbow = createFacetedMesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), mSec);
      elbow.position.set(0, -0.44, -0.06);
      armGroup.add(elbow);

      const forearm = createFacetedMesh(new THREE.CylinderGeometry(0.12, 0.09, 0.4, 5), mPri);
      forearm.position.y = -0.64;
      armGroup.add(forearm);

      const hand = createFacetedMesh(new THREE.IcosahedronGeometry(0.09, 0), mSec);
      hand.position.set(0, -0.86, 0.04);
      armGroup.add(hand);
    };
    createArm(leftArm, false);
    createArm(rightArm, true);

    // Two-Handed Executioner Claymore
    weaponGroup.position.set(0.12, -0.65, 0.2);
    weaponGroup.rotation.x = Math.PI / 4;
    rightArm.add(weaponGroup);

    const hilt = createFacetedMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.65, 5), mDark);
    weaponGroup.add(hilt);

    const guard = createFacetedMesh(new THREE.BoxGeometry(0.44, 0.08, 0.12), mSec);
    guard.position.y = 0.28;
    weaponGroup.add(guard);

    const blade = createFacetedMesh(new THREE.BoxGeometry(0.24, 1.5, 0.05), mPri);
    blade.position.y = 1.05;
    weaponGroup.add(blade);

    const fullerCore = createFacetedMesh(new THREE.BoxGeometry(0.06, 1.3, 0.07), mAcc);
    fullerCore.position.y = 1.05;
    weaponGroup.add(fullerCore);

  // ==========================================
  // 2. ARCANIST: Vespera (Mage/Burst)
  // Cosmic Astrolabe Staff & Floating Tiara/Shards
  // ==========================================
  } else if (heroId === 'arcanist') {
    const mPri = registerMat(createMatteMaterial(def.primaryColor, 0.88, 0.08));
    const mSec = registerMat(createMatteMaterial(def.secondaryColor, 0.9, 0.05));
    const mAcc = registerMat(createMatteMaterial(def.accentColor, 0.52, 0.2, def.accentColor, 0.5));

    // Lower Robe Drape (Majestic cloth silhouette concealing legs)
    const robeGeo = new THREE.ConeGeometry(0.72, 1.05, 7);
    const robe = createFacetedMesh(robeGeo, mPri);
    robe.position.y = 0.72;
    robe.scale.set(1.05, 1.0, 0.9);
    bodyGroup.add(robe);

    // Torso & Waist
    const waist = createFacetedMesh(new THREE.CylinderGeometry(0.32, 0.35, 0.32, 6), mSec);
    waist.position.y = 1.35;
    bodyGroup.add(waist);

    const chest = createFacetedMesh(new THREE.ConeGeometry(0.46, 0.45, 6), mPri);
    chest.position.y = 1.72;
    chest.rotation.x = Math.PI;
    bodyGroup.add(chest);

    // Floating Cosmic Orbital Shards in extraGroup
    extraGroup.position.set(0, 1.95, 0);
    for (const sx of [-0.72, 0.72]) {
      const shard = createFacetedMesh(new THREE.OctahedronGeometry(0.18, 0), mAcc);
      shard.position.set(sx, 0, 0);
      shard.scale.set(0.7, 1.5, 0.7);
      extraGroup.add(shard);
    }

    // Cosmic Cowl Head
    headGroup.position.set(0, 2.3, 0);
    const cowl = createFacetedMesh(new THREE.ConeGeometry(0.38, 0.68, 6), mSec);
    cowl.position.set(0, 0.04, -0.04);
    headGroup.add(cowl);

    const shadowFace = createFacetedMesh(new THREE.IcosahedronGeometry(0.18, 0), mDark);
    shadowFace.position.set(0, 0.0, 0.1);
    headGroup.add(shadowFace);

    const tiara = createFacetedMesh(new THREE.OctahedronGeometry(0.12, 0), mAcc);
    tiara.position.set(0, 0.24, 0.22);
    headGroup.add(tiara);

    // Sleeved Arms
    leftArm.position.set(-0.56, 1.75, 0);
    rightArm.position.set(0.56, 1.75, 0);

    const lSleeve = createFacetedMesh(new THREE.ConeGeometry(0.24, 0.72, 6), mPri);
    lSleeve.position.y = -0.36;
    leftArm.add(lSleeve);

    const rSleeve = createFacetedMesh(new THREE.ConeGeometry(0.24, 0.72, 6), mPri);
    rSleeve.position.y = -0.36;
    rightArm.add(rSleeve);

    // Astrolabe Catalyst Staff
    weaponGroup.position.set(0.15, -0.2, 0.2);
    rightArm.add(weaponGroup);

    const staffShaft = createFacetedMesh(new THREE.CylinderGeometry(0.03, 0.03, 2.0, 6), mSec);
    weaponGroup.add(staffShaft);

    const gyroRing = createFacetedMesh(new THREE.TorusGeometry(0.28, 0.025, 4, 8), mPri);
    gyroRing.position.y = 0.98;
    gyroRing.rotation.x = Math.PI / 3;
    weaponGroup.add(gyroRing);

    const catalystOrb = createFacetedMesh(new THREE.OctahedronGeometry(0.15, 0), mAcc);
    catalystOrb.position.y = 0.98;
    weaponGroup.add(catalystOrb);

  // ==========================================
  // 3. RANGER: Zephyr (Marksman/DPS)
  // Recurve Longbow, Split Cape & Quiver
  // ==========================================
  } else if (heroId === 'ranger') {
    const mPri = registerMat(createMatteMaterial(def.primaryColor, 0.85, 0.08));
    const mSec = registerMat(createMatteMaterial(def.secondaryColor, 0.88, 0.05));
    const mAcc = registerMat(createMatteMaterial(def.accentColor, 0.55, 0.15, def.accentColor, 0.4));

    // Pelvis & Legs
    const pelvis = createFacetedMesh(new THREE.CylinderGeometry(0.34, 0.28, 0.26, 6), mSec);
    pelvis.position.y = 1.15;
    pelvis.scale.set(1.05, 1.0, 0.75);
    bodyGroup.add(pelvis);

    leftLeg.position.set(-0.28, 1.05, 0);
    rightLeg.position.set(0.28, 1.05, 0);

    const createHunterLeg = (legGroup: THREE.Group) => {
      const thigh = createFacetedMesh(new THREE.CylinderGeometry(0.14, 0.11, 0.44, 5), mDark);
      thigh.position.y = -0.22;
      legGroup.add(thigh);

      const calf = createFacetedMesh(new THREE.CylinderGeometry(0.12, 0.09, 0.42, 5), mPri);
      calf.position.y = -0.66;
      legGroup.add(calf);

      const boot = createFacetedMesh(new THREE.BoxGeometry(0.16, 0.14, 0.3), mSec);
      boot.position.set(0, -0.92, 0.06);
      legGroup.add(boot);
    };
    createHunterLeg(leftLeg);
    createHunterLeg(rightLeg);

    // Lean Torso & Split Wind Cape
    const torso = createFacetedMesh(new THREE.ConeGeometry(0.45, 0.72, 6), mPri);
    torso.position.y = 1.62;
    torso.rotation.x = Math.PI;
    torso.scale.set(1.05, 1.0, 0.75);
    bodyGroup.add(torso);

    const cape = createFacetedMesh(new THREE.BoxGeometry(0.44, 0.95, 0.04), mSec);
    cape.position.set(0, 1.35, -0.24);
    cape.rotation.x = 0.18;
    extraGroup.add(cape);

    // Diagonal Quiver with fletched arrows
    const quiver = createFacetedMesh(new THREE.CylinderGeometry(0.09, 0.08, 0.68, 5), mSec);
    quiver.position.set(0.18, 1.75, -0.24);
    quiver.rotation.z = -0.35;
    quiver.rotation.x = 0.25;
    extraGroup.add(quiver);

    for (const aOff of [-0.04, 0.04]) {
      const fletch = createFacetedMesh(new THREE.ConeGeometry(0.03, 0.2, 3), mAcc);
      fletch.position.set(0.24 + aOff, 2.15, -0.32);
      extraGroup.add(fletch);
    }

    // Scout Hood & Eagle Feather
    headGroup.position.set(0, 2.28, 0);
    const hood = createFacetedMesh(new THREE.CylinderGeometry(0.18, 0.34, 0.44, 6), mPri);
    headGroup.add(hood);

    const feather = createFacetedMesh(new THREE.ConeGeometry(0.05, 0.45, 3), mAcc);
    feather.position.set(-0.25, 0.22, -0.05);
    feather.rotation.z = Math.PI / 4;
    headGroup.add(feather);

    // Arms: Asymmetrical archer shoulder guard
    leftArm.position.set(-0.58, 1.75, 0);
    rightArm.position.set(0.58, 1.75, 0);

    const archerGuard = createFacetedMesh(new THREE.BoxGeometry(0.28, 0.26, 0.26), mSec);
    leftArm.add(archerGuard);

    // Recurve Composite Bow in left hand
    weaponGroup.position.set(0, -0.65, 0.25);
    leftArm.add(weaponGroup);

    const bowShaft = createFacetedMesh(new THREE.TorusGeometry(0.68, 0.032, 4, 10, Math.PI), mPri);
    bowShaft.rotation.z = Math.PI / 2;
    weaponGroup.add(bowShaft);

    const bowString = createFacetedMesh(new THREE.CylinderGeometry(0.008, 0.008, 1.32, 3), mAcc);
    bowString.position.x = -0.06;
    weaponGroup.add(bowString);

  // ==========================================
  // 4. WRAITH: Umbra (Assassin/Duelist)
  // Twin Reverse-Grip Trench Daggers & Scarf Tail
  // ==========================================
  } else if (heroId === 'wraith') {
    const mPri = registerMat(createMatteMaterial(def.primaryColor, 0.82, 0.18));
    const mSec = registerMat(createMatteMaterial(def.secondaryColor, 0.86, 0.08));
    const mAcc = registerMat(createMatteMaterial(def.accentColor, 0.5, 0.25, def.accentColor, 0.6));

    // Slim Shinobi Torso
    const torso = createFacetedMesh(new THREE.CylinderGeometry(0.38, 0.3, 0.68, 6), mPri);
    torso.position.y = 1.48;
    torso.scale.set(1.05, 1.0, 0.75);
    bodyGroup.add(torso);

    // Shinobi Legs
    leftLeg.position.set(-0.25, 1.05, 0);
    rightLeg.position.set(0.25, 1.05, 0);

    const createNinjaLeg = (legGroup: THREE.Group) => {
      const legMesh = createFacetedMesh(new THREE.CylinderGeometry(0.13, 0.09, 0.82, 5), mPri);
      legMesh.position.y = -0.42;
      legGroup.add(legMesh);
    };
    createNinjaLeg(leftLeg);
    createNinjaLeg(rightLeg);

    // Ninja Mask & Dual Slit Neon Crimson Optics
    headGroup.position.set(0, 2.26, 0);
    const mask = createFacetedMesh(new THREE.IcosahedronGeometry(0.25, 0), mDark);
    headGroup.add(mask);

    const scarf = createFacetedMesh(new THREE.TorusGeometry(0.25, 0.07, 4, 6), mSec);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = -0.18;
    headGroup.add(scarf);

    const scarfTail = createFacetedMesh(new THREE.BoxGeometry(0.12, 0.45, 0.04), mSec);
    scarfTail.position.set(0.22, -0.32, -0.26);
    scarfTail.rotation.x = 0.55;
    scarfTail.rotation.z = -0.35;
    headGroup.add(scarfTail);

    for (const ex of [-0.08, 0.08]) {
      const optic = createFacetedMesh(new THREE.BoxGeometry(0.07, 0.02, 0.03), mAcc);
      optic.position.set(ex, 0.02, 0.24);
      headGroup.add(optic);
    }

    // Arms & Twin Reverse-Grip Trench Daggers
    leftArm.position.set(-0.55, 1.72, 0);
    rightArm.position.set(0.55, 1.72, 0);

    const daggerGeoL = new THREE.ConeGeometry(0.08, 0.65, 4);
    daggerGeoL.rotateX(-Math.PI * 0.85);
    const daggerL = createFacetedMesh(daggerGeoL, mAcc);
    daggerL.position.set(0, -0.68, 0.1);
    leftArm.add(daggerL);

    const daggerGeoR = new THREE.ConeGeometry(0.08, 0.65, 4);
    daggerGeoR.rotateX(-Math.PI * 0.85);
    const daggerR = createFacetedMesh(daggerGeoR, mAcc);
    daggerR.position.set(0, -0.68, 0.1);
    rightArm.add(daggerR);

  // ==========================================
  // 5. COLOSSUS: Balthazar (Tank/Disrupter)
  // Monolithic Boulder Head, Tower Shield & Hammer
  // ==========================================
  } else {
    const mPri = registerMat(createMatteMaterial(def.primaryColor, 0.92, 0.05));
    const mSec = registerMat(createMatteMaterial(def.secondaryColor, 0.94, 0.04));
    const mAcc = registerMat(createMatteMaterial(def.accentColor, 0.65, 0.15, def.accentColor, 0.45));

    // Hulking Basalt Torso & Hunchback Crag
    const torso = createFacetedMesh(new THREE.DodecahedronGeometry(0.85, 0), mPri);
    torso.position.y = 1.62;
    torso.scale.set(1.25, 1.1, 0.95);
    bodyGroup.add(torso);

    const crag = createFacetedMesh(new THREE.IcosahedronGeometry(0.48, 0), mSec);
    crag.position.set(0, 1.82, -0.32);
    crag.scale.set(1.2, 0.9, 1.0);
    bodyGroup.add(crag);

    // Heavy Rock Legs
    leftLeg.position.set(-0.46, 0.9, 0);
    rightLeg.position.set(0.46, 0.9, 0);

    const createRockLeg = (legGroup: THREE.Group) => {
      const leg = createFacetedMesh(new THREE.CylinderGeometry(0.22, 0.18, 0.78, 5), mPri);
      leg.position.y = -0.38;
      legGroup.add(leg);

      const boot = createFacetedMesh(new THREE.BoxGeometry(0.28, 0.22, 0.42), mSec);
      boot.position.set(0, -0.84, 0.08);
      legGroup.add(boot);
    };
    createRockLeg(leftLeg);
    createRockLeg(rightLeg);

    // Monolithic Head
    headGroup.position.set(0, 2.32, 0.12);
    const head = createFacetedMesh(new THREE.BoxGeometry(0.54, 0.5, 0.48), mPri);
    headGroup.add(head);

    const brow = createFacetedMesh(new THREE.BoxGeometry(0.56, 0.14, 0.18), mSec);
    brow.position.set(0, 0.14, 0.26);
    headGroup.add(brow);

    const runeEyes = createFacetedMesh(new THREE.BoxGeometry(0.42, 0.06, 0.06), mAcc);
    runeEyes.position.set(0, 0.02, 0.28);
    headGroup.add(runeEyes);

    // Fortress Rampart Shoulders & Arms
    leftArm.position.set(-0.95, 1.88, 0);
    rightArm.position.set(0.95, 1.88, 0);

    const lPauldron = createFacetedMesh(new THREE.BoxGeometry(0.52, 0.48, 0.48), mPri);
    leftArm.add(lPauldron);

    const rPauldron = createFacetedMesh(new THREE.BoxGeometry(0.52, 0.48, 0.48), mPri);
    rightArm.add(rPauldron);

    // Massive Fortress Tower Shield on Left Arm
    const shield = createFacetedMesh(new THREE.BoxGeometry(0.8, 1.45, 0.18), mSec);
    shield.position.set(0, -0.38, 0.38);
    shield.rotation.y = 0.15;
    leftArm.add(shield);

    const shieldBoss = createFacetedMesh(new THREE.OctahedronGeometry(0.24, 0), mAcc);
    shieldBoss.position.set(0, -0.38, 0.52);
    leftArm.add(shieldBoss);

    // Granite Warhammer Rested on Right Shoulder
    weaponGroup.position.set(0.12, -0.2, 0.1);
    weaponGroup.rotation.x = -0.65;
    rightArm.add(weaponGroup);

    const shaft = createFacetedMesh(new THREE.CylinderGeometry(0.06, 0.06, 1.35, 5), mSec);
    weaponGroup.add(shaft);

    const hammerHead = createFacetedMesh(new THREE.BoxGeometry(0.44, 0.35, 0.35), mPri);
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