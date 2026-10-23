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

  // Contact shadow disc
  const shadowGeo = new THREE.CircleGeometry(1.35, 36);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.position.y = 0.02;
  root.add(shadowDisc);

  // Team identification ring on ground
  const ringColor = team === 'ally' ? 0x10b981 : team === 'enemy' ? 0xef4444 : def.accentColor;
  const ringGeo = new THREE.RingGeometry(1.15, 1.38, 48);
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

  // Shield bubble (visible when hero has active shield)
  const shieldGeo = new THREE.IcosahedronGeometry(1.85, 2);
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

  if (heroId === 'vanguard') {
    // 1. VANGUARD: Heavy brushed-steel plate warrior, ornate crimson-and-gold war cloak, magma greatsword
    const armorMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'armor',
        primaryHex: 0x475569,
        secondaryHex: 0x1e293b,
        accentHex: 0xf59e0b,
        roughness: 0.28,
        metalness: 0.82,
      })
    );
    const crimsonClothMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'cloth',
        primaryHex: 0xb91c1c,
        secondaryHex: 0x450a0a,
        accentHex: 0xfbbf24,
        roughness: 0.58,
        metalness: 0.25,
      })
    );
    const bladeSteelMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'blade',
        primaryHex: 0x94a3b8,
        secondaryHex: 0x1e293b,
        accentHex: 0xff2e4c,
        roughness: 0.22,
        metalness: 0.88,
      })
    );
    const glowMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'crystal',
        primaryHex: 0xff4d6d,
        secondaryHex: 0x991b1b,
        accentHex: 0xfef08a,
        emissiveHex: 0xff1e42,
        emissiveIntensity: 1.45,
        roughness: 0.18,
        metalness: 0.2,
      })
    );

    // Greaves & Legs (Higher-poly sculpted capsule greaves + knee guards)
    leftLeg.position.set(-0.34, 0.75, 0);
    rightLeg.position.set(0.34, 0.75, 0);
    const lLegMesh = createDetailedMesh(
      new THREE.CapsuleGeometry(0.19, 0.5, 8, 18),
      armorMat,
      0x475569,
      0x94a3b8,
      0xfef08a
    );
    const rLegMesh = createDetailedMesh(
      new THREE.CapsuleGeometry(0.19, 0.5, 8, 18),
      armorMat,
      0x475569,
      0x94a3b8,
      0xfef08a
    );
    lLegMesh.position.y = -0.35;
    rLegMesh.position.y = -0.35;
    lLegMesh.castShadow = true;
    rLegMesh.castShadow = true;
    leftLeg.add(lLegMesh);
    rightLeg.add(rLegMesh);

    const lKnee = createDetailedMesh(
      new THREE.CylinderGeometry(0.22, 0.19, 0.24, 16, 2),
      crimsonClothMat,
      0xfbbf24,
      0xdc2626,
      0xffffff
    );
    const rKnee = createDetailedMesh(
      new THREE.CylinderGeometry(0.22, 0.19, 0.24, 16, 2),
      crimsonClothMat,
      0xfbbf24,
      0xdc2626,
      0xffffff
    );
    lKnee.position.set(0, -0.18, 0.04);
    rKnee.position.set(0, -0.18, 0.04);
    leftLeg.add(lKnee);
    rightLeg.add(rKnee);

    // Armored Cuirass Torso + Breastplate Collar + Gold War Belt
    const torso = createDetailedMesh(
      new THREE.CylinderGeometry(0.68, 0.52, 1.25, 22, 4),
      armorMat,
      0x64748b,
      0xcbd5e1,
      0xffffff
    );
    torso.position.y = 1.38;
    torso.castShadow = true;
    bodyGroup.add(torso);

    const chestCollar = createDetailedMesh(
      new THREE.TorusGeometry(0.56, 0.08, 12, 28),
      armorMat,
      0x94a3b8,
      0xe2e8f0,
      0xfef08a
    );
    chestCollar.rotation.x = Math.PI / 2;
    chestCollar.position.y = 1.94;
    bodyGroup.add(chestCollar);

    const warBelt = createDetailedMesh(
      new THREE.CylinderGeometry(0.56, 0.58, 0.24, 22, 2),
      crimsonClothMat,
      0xf59e0b,
      0xdc2626,
      0xfef08a
    );
    warBelt.position.y = 0.88;
    bodyGroup.add(warBelt);

    // Chest Crimson Core (Higher-poly faceted gem)
    const chestCore = createDetailedMesh(
      new THREE.OctahedronGeometry(0.27, 2),
      glowMat,
      0xfef08a,
      0xff2e4c,
      0xffffff,
      0.16
    );
    chestCore.position.set(0, 1.45, 0.56);
    bodyGroup.add(chestCore);

    // Embroidered Heavy Cape
    const cape = createDetailedMesh(
      new THREE.BoxGeometry(1.12, 1.48, 0.12, 6, 8, 2),
      crimsonClothMat,
      0xfbbf24,
      0xdc2626,
      0x7f1d1d
    );
    cape.position.set(0, 1.22, -0.52);
    cape.rotation.x = 0.16;
    cape.castShadow = true;
    extraGroup.add(cape);

    // Head + Rounded Greathelm + Horns
    headGroup.position.set(0, 2.22, 0);
    const helm = createDetailedMesh(
      new THREE.CylinderGeometry(0.35, 0.39, 0.52, 22, 3),
      armorMat,
      0x64748b,
      0xcbd5e1,
      0xffffff
    );
    helm.castShadow = true;
    headGroup.add(helm);

    const helmDome = createDetailedMesh(
      new THREE.SphereGeometry(0.35, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
      armorMat,
      0x94a3b8,
      0xe2e8f0,
      0xffffff
    );
    helmDome.position.y = 0.24;
    headGroup.add(helmDome);

    const visor = createDetailedMesh(
      new THREE.BoxGeometry(0.46, 0.12, 0.3, 4, 2, 2),
      glowMat,
      0xfef08a,
      0xff2e4c,
      0xffffff
    );
    visor.position.set(0, 0.04, 0.26);
    headGroup.add(visor);

    const crest = createDetailedMesh(
      new THREE.BoxGeometry(0.14, 0.42, 0.66, 3, 4, 6),
      crimsonClothMat,
      0x991b1b,
      0xef4444,
      0xfef08a
    );
    crest.position.set(0, 0.38, 0);
    headGroup.add(crest);

    // Broad Pauldrons & Arms
    leftArm.position.set(-0.82, 1.82, 0);
    rightArm.position.set(0.82, 1.82, 0);
    const lPauldron = createDetailedMesh(
      new THREE.DodecahedronGeometry(0.43, 1),
      crimsonClothMat,
      0xfbbf24,
      0xdc2626,
      0xffffff,
      0.14
    );
    const rPauldron = createDetailedMesh(
      new THREE.DodecahedronGeometry(0.43, 1),
      crimsonClothMat,
      0xfbbf24,
      0xdc2626,
      0xffffff,
      0.14
    );
    lPauldron.scale.set(1.1, 0.85, 1.1);
    rPauldron.scale.set(1.1, 0.85, 1.1);
    leftArm.add(lPauldron);
    rightArm.add(rPauldron);

    const lArmMesh = createDetailedMesh(
      new THREE.CapsuleGeometry(0.15, 0.48, 8, 16),
      armorMat,
      0x64748b,
      0x94a3b8,
      0xe2e8f0
    );
    const rArmMesh = createDetailedMesh(
      new THREE.CapsuleGeometry(0.15, 0.48, 8, 16),
      armorMat,
      0x64748b,
      0x94a3b8,
      0xe2e8f0
    );
    lArmMesh.position.y = -0.42;
    rArmMesh.position.y = -0.42;
    leftArm.add(lArmMesh);
    rightArm.add(rArmMesh);

    // Runed Greatsword attached to rightArm
    weaponGroup.position.set(0, -0.72, 0.35);
    rightArm.add(weaponGroup);

    const hilt = createDetailedMesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.55, 16, 2),
      crimsonClothMat,
      0xfbbf24,
      0x991b1b,
      0xfef08a
    );
    hilt.rotation.x = Math.PI / 2;
    weaponGroup.add(hilt);

    const crossguard = createDetailedMesh(
      new THREE.BoxGeometry(0.76, 0.16, 0.22, 4, 2, 2),
      armorMat,
      0xf59e0b,
      0xfbbf24,
      0xffffff
    );
    crossguard.position.set(0, 0, 0.28);
    weaponGroup.add(crossguard);

    const blade = createDetailedMesh(
      new THREE.BoxGeometry(0.34, 0.09, 2.15, 4, 2, 8),
      bladeSteelMat,
      0x94a3b8,
      0xe2e8f0,
      0xffffff
    );
    blade.position.set(0, 0, 1.4);
    blade.castShadow = true;
    weaponGroup.add(blade);

    const bladeEdge = createDetailedMesh(
      new THREE.BoxGeometry(0.15, 0.13, 1.96, 2, 2, 6),
      glowMat,
      0xff2e4c,
      0xfbbf24,
      0xffffff
    );
    bladeEdge.position.set(0, 0, 1.38);
    weaponGroup.add(bladeEdge);
  } else if (heroId === 'arcanist') {
    // 2. ARCANIST: Starlight-embroidered mystic robes, golden astral collar & runes, faceted galaxy orbs
    const robeMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'cloth',
        primaryHex: 0x581c87,
        secondaryHex: 0x1e1b4b,
        accentHex: 0xfbbf24,
        roughness: 0.65,
        metalness: 0.2,
      })
    );
    const trimMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'armor',
        primaryHex: 0xf59e0b,
        secondaryHex: 0x78350f,
        accentHex: 0xfef08a,
        roughness: 0.22,
        metalness: 0.88,
      })
    );
    const orbMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'crystal',
        primaryHex: 0xe9d5ff,
        secondaryHex: 0x7e22ce,
        accentHex: 0x38bdf8,
        emissiveHex: 0xa855f7,
        emissiveIntensity: 1.55,
        roughness: 0.14,
        metalness: 0.28,
      })
    );

    leftLeg.position.set(-0.22, 0.6, 0);
    rightLeg.position.set(0.22, 0.6, 0);
    const lBoot = createDetailedMesh(
      new THREE.CapsuleGeometry(0.12, 0.26, 8, 16),
      trimMat,
      0x92400e,
      0xf59e0b,
      0xfef08a
    );
    const rBoot = createDetailedMesh(
      new THREE.CapsuleGeometry(0.12, 0.26, 8, 16),
      trimMat,
      0x92400e,
      0xf59e0b,
      0xfef08a
    );
    lBoot.position.y = -0.35;
    rBoot.position.y = -0.35;
    leftLeg.add(lBoot);
    rightLeg.add(rBoot);

    const robeCone = createDetailedMesh(
      new THREE.ConeGeometry(0.76, 1.55, 24, 5),
      robeMat,
      0xfbbf24,
      0x7e22ce,
      0xc084fc
    );
    robeCone.position.y = 0.88;
    robeCone.castShadow = true;
    bodyGroup.add(robeCone);

    const upperTorso = createDetailedMesh(
      new THREE.CylinderGeometry(0.46, 0.38, 0.9, 20, 4),
      robeMat,
      0x6b21a8,
      0x9333ea,
      0xe9d5ff
    );
    upperTorso.position.y = 1.65;
    upperTorso.castShadow = true;
    bodyGroup.add(upperTorso);

    // Golden Arcane Collar + Front Sash
    const collar = createDetailedMesh(
      new THREE.TorusGeometry(0.48, 0.09, 14, 32),
      trimMat,
      0xf59e0b,
      0xfbbf24,
      0xffffff
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 2.02;
    bodyGroup.add(collar);

    const sash = createDetailedMesh(
      new THREE.BoxGeometry(0.28, 1.15, 0.08, 4, 8, 2),
      trimMat,
      0xfef08a,
      0xf59e0b,
      0xb45309
    );
    sash.position.set(0, 1.18, 0.48);
    sash.rotation.x = -0.18;
    bodyGroup.add(sash);

    // Head + Pointed Astral Hood/Crown
    headGroup.position.set(0, 2.32, 0);
    const headMesh = createDetailedMesh(
      new THREE.SphereGeometry(0.28, 24, 20),
      robeMat,
      0x3b0764,
      0x6b21a8,
      0xc084fc
    );
    headGroup.add(headMesh);

    const eyes = createDetailedMesh(
      new THREE.BoxGeometry(0.32, 0.08, 0.22, 3, 2, 2),
      orbMat,
      0x38bdf8,
      0xe9d5ff,
      0xffffff
    );
    eyes.position.set(0, 0.02, 0.2);
    headGroup.add(eyes);

    const hatBrim = createDetailedMesh(
      new THREE.CylinderGeometry(0.68, 0.68, 0.06, 28, 2),
      robeMat,
      0xfbbf24,
      0x7e22ce,
      0xe9d5ff
    );
    hatBrim.position.y = 0.2;
    headGroup.add(hatBrim);

    const hatCone = createDetailedMesh(
      new THREE.ConeGeometry(0.42, 0.85, 24, 4),
      robeMat,
      0x581c87,
      0x9333ea,
      0xfef08a
    );
    hatCone.position.set(0, 0.62, -0.05);
    hatCone.rotation.x = -0.18;
    headGroup.add(hatCone);

    // Arms
    leftArm.position.set(-0.62, 1.85, 0);
    rightArm.position.set(0.62, 1.85, 0);
    const lSleeve = createDetailedMesh(
      new THREE.ConeGeometry(0.26, 0.78, 18, 4),
      robeMat,
      0xfbbf24,
      0x7e22ce,
      0xd8b4fe
    );
    const rSleeve = createDetailedMesh(
      new THREE.ConeGeometry(0.26, 0.78, 18, 4),
      robeMat,
      0xfbbf24,
      0x7e22ce,
      0xd8b4fe
    );
    lSleeve.position.y = -0.35;
    rSleeve.position.y = -0.35;
    leftArm.add(lSleeve);
    rightArm.add(rSleeve);

    // Astral Staff in Right Hand
    weaponGroup.position.set(0, -0.5, 0.35);
    rightArm.add(weaponGroup);
    const staffShaft = createDetailedMesh(
      new THREE.CylinderGeometry(0.05, 0.05, 2.4, 16, 4),
      trimMat,
      0x78350f,
      0xf59e0b,
      0xfef08a
    );
    staffShaft.position.y = 0.45;
    weaponGroup.add(staffShaft);

    const staffHead = createDetailedMesh(
      new THREE.OctahedronGeometry(0.29, 2),
      orbMat,
      0x38bdf8,
      0xd8b4fe,
      0xffffff,
      0.16
    );
    staffHead.position.y = 1.72;
    weaponGroup.add(staffHead);

    // 3 Orbiting Faceted Galaxy Orbs in extraGroup
    extraGroup.position.set(0, 1.85, 0);
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const orb = createDetailedMesh(
        new THREE.IcosahedronGeometry(0.22, 2),
        orbMat,
        0x38bdf8,
        0xc084fc,
        0xffffff,
        0.15
      );
      orb.position.set(Math.cos(angle) * 1.15, (i % 2) * 0.2, Math.sin(angle) * 1.15);
      extraGroup.add(orb);
    }
  } else if (heroId === 'ranger') {
    // 3. RANGER: Embroidered leaf-pattern emerald tunic, tooled-leather gear, carved jade greatbow
    const tunicMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'cloth',
        primaryHex: 0x059669,
        secondaryHex: 0x064e3b,
        accentHex: 0xfbbf24,
        roughness: 0.6,
        metalness: 0.18,
      })
    );
    const leatherMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'leather',
        primaryHex: 0x78350f,
        secondaryHex: 0x3b1704,
        accentHex: 0xf59e0b,
        roughness: 0.72,
        metalness: 0.15,
      })
    );
    const emeraldGlow = registerMat(
      createDetailedPbrMaterial({
        pattern: 'crystal',
        primaryHex: 0x6ee7b7,
        secondaryHex: 0x059669,
        accentHex: 0xfef08a,
        emissiveHex: 0x10b981,
        emissiveIntensity: 1.45,
        roughness: 0.18,
        metalness: 0.3,
      })
    );

    // Slender Agile Legs with Stitched Leather Boots
    leftLeg.position.set(-0.24, 0.82, 0);
    rightLeg.position.set(0.24, 0.82, 0);
    const lLeg = createDetailedMesh(
      new THREE.CapsuleGeometry(0.12, 0.62, 8, 16),
      leatherMat,
      0x451a03,
      0x92400e,
      0xfde68a
    );
    const rLeg = createDetailedMesh(
      new THREE.CapsuleGeometry(0.12, 0.62, 8, 16),
      leatherMat,
      0x451a03,
      0x92400e,
      0xfde68a
    );
    lLeg.position.y = -0.4;
    rLeg.position.y = -0.4;
    lLeg.castShadow = true;
    rLeg.castShadow = true;
    leftLeg.add(lLeg);
    rightLeg.add(rLeg);

    // Torso + Leather Chest Strap
    const torso = createDetailedMesh(
      new THREE.CylinderGeometry(0.44, 0.34, 1.05, 20, 4),
      tunicMat,
      0xfbbf24,
      0x10b981,
      0xa7f3d0
    );
    torso.position.y = 1.35;
    torso.castShadow = true;
    bodyGroup.add(torso);

    const belt = createDetailedMesh(
      new THREE.CylinderGeometry(0.39, 0.41, 0.2, 20, 2),
      leatherMat,
      0x78350f,
      0xb45309,
      0xfef08a
    );
    belt.position.y = 0.96;
    bodyGroup.add(belt);

    // Detailed Quiver with Glowing Fletched Arrows on Back
    const quiver = createDetailedMesh(
      new THREE.CylinderGeometry(0.16, 0.12, 0.85, 16, 3),
      leatherMat,
      0x451a03,
      0x92400e,
      0xfbbf24
    );
    quiver.position.set(0.2, 1.55, -0.34);
    quiver.rotation.z = -0.35;
    bodyGroup.add(quiver);

    // Sylvan Leaf Cloak
    const cloak = createDetailedMesh(
      new THREE.ConeGeometry(0.62, 1.4, 18, 4, true),
      tunicMat,
      0xfde68a,
      0x059669,
      0x6ee7b7
    );
    cloak.position.set(0, 1.25, -0.25);
    cloak.rotation.x = 0.25;
    extraGroup.add(cloak);

    // Head + Hood
    headGroup.position.set(0, 2.08, 0);
    const hood = createDetailedMesh(
      new THREE.ConeGeometry(0.34, 0.58, 20, 4),
      tunicMat,
      0x065f46,
      0x10b981,
      0xa7f3d0
    );
    hood.position.y = 0.12;
    headGroup.add(hood);

    const visor = createDetailedMesh(
      new THREE.BoxGeometry(0.3, 0.08, 0.25, 3, 2, 2),
      emeraldGlow,
      0x34d399,
      0xa7f3d0,
      0xffffff
    );
    visor.position.set(0, 0.02, 0.18);
    headGroup.add(visor);

    // Arms
    leftArm.position.set(-0.56, 1.72, 0);
    rightArm.position.set(0.56, 1.72, 0);
    const lArm = createDetailedMesh(
      new THREE.CapsuleGeometry(0.105, 0.52, 8, 16),
      leatherMat,
      0x78350f,
      0xb45309,
      0xfde68a
    );
    const rArm = createDetailedMesh(
      new THREE.CapsuleGeometry(0.105, 0.52, 8, 16),
      leatherMat,
      0x78350f,
      0xb45309,
      0xfde68a
    );
    lArm.position.y = -0.32;
    rArm.position.y = -0.32;
    leftArm.add(lArm);
    rightArm.add(rArm);

    // Carved Wood & Jade Greatbow
    weaponGroup.position.set(0, -0.45, 0.45);
    rightArm.add(weaponGroup);

    const bowArc = createDetailedMesh(
      new THREE.TorusGeometry(0.82, 0.065, 14, 36, Math.PI * 0.88),
      leatherMat,
      0x92400e,
      0xf59e0b,
      0xfef08a
    );
    bowArc.rotation.z = -Math.PI * 0.44;
    bowArc.rotation.y = Math.PI / 2;
    weaponGroup.add(bowArc);

    const bowCrystalTop = createDetailedMesh(
      new THREE.ConeGeometry(0.09, 0.36, 14, 2),
      emeraldGlow,
      0x10b981,
      0x6ee7b7,
      0xffffff
    );
    bowCrystalTop.position.set(0, 0.78, 0.15);
    weaponGroup.add(bowCrystalTop);

    const bowCrystalBot = createDetailedMesh(
      new THREE.ConeGeometry(0.09, 0.36, 14, 2),
      emeraldGlow,
      0x10b981,
      0x6ee7b7,
      0xffffff
    );
    bowCrystalBot.position.set(0, -0.78, 0.15);
    bowCrystalBot.rotation.x = Math.PI;
    weaponGroup.add(bowCrystalBot);

    const arrowShaft = createDetailedMesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.25, 12, 2),
      emeraldGlow,
      0x34d399,
      0xa7f3d0,
      0xffffff
    );
    arrowShaft.rotation.x = Math.PI / 2;
    arrowShaft.position.set(0, 0, 0.4);
    weaponGroup.add(arrowShaft);
  } else if (heroId === 'wraith') {
    // 4. WRAITH: Carbon-weave obsidian stealth suit with indigo phantom trim & etched twin blades
    const shadowMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'armor',
        primaryHex: 0x312e81,
        secondaryHex: 0x0f172a,
        accentHex: 0x818cf8,
        roughness: 0.38,
        metalness: 0.72,
      })
    );
    const scarfMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'cloth',
        primaryHex: 0x4338ca,
        secondaryHex: 0x1e1b4b,
        accentHex: 0x38bdf8,
        roughness: 0.62,
        metalness: 0.25,
      })
    );
    const bladeGlow = registerMat(
      createDetailedPbrMaterial({
        pattern: 'blade',
        primaryHex: 0xc7d2fe,
        secondaryHex: 0x3730a3,
        accentHex: 0x38bdf8,
        emissiveHex: 0x6366f1,
        emissiveIntensity: 1.6,
        roughness: 0.15,
        metalness: 0.85,
      })
    );

    // Legs
    leftLeg.position.set(-0.26, 0.78, 0);
    rightLeg.position.set(0.26, 0.78, 0);
    const lLeg = createDetailedMesh(
      new THREE.CapsuleGeometry(0.125, 0.56, 8, 16),
      shadowMat,
      0x312e81,
      0x6366f1,
      0xc7d2fe
    );
    const rLeg = createDetailedMesh(
      new THREE.CapsuleGeometry(0.125, 0.56, 8, 16),
      shadowMat,
      0x312e81,
      0x6366f1,
      0xc7d2fe
    );
    lLeg.position.y = -0.36;
    rLeg.position.y = -0.36;
    leftLeg.add(lLeg);
    rightLeg.add(rLeg);

    // Angular Stealth Torso
    const torso = createDetailedMesh(
      new THREE.ConeGeometry(0.56, 1.2, 16, 4),
      shadowMat,
      0x4338ca,
      0x818cf8,
      0xe0e7ff
    );
    torso.rotation.x = Math.PI;
    torso.position.y = 1.42;
    torso.castShadow = true;
    bodyGroup.add(torso);

    // Glowing Phantom Chest Sigil
    const chestSigil = createDetailedMesh(
      new THREE.OctahedronGeometry(0.22, 2),
      bladeGlow,
      0x38bdf8,
      0xa5b4fc,
      0xffffff
    );
    chestSigil.position.set(0, 1.48, 0.42);
    bodyGroup.add(chestSigil);

    // Embroidered Shadow Scarf Tails
    const scarfTail = createDetailedMesh(
      new THREE.BoxGeometry(0.65, 1.15, 0.08, 4, 8, 2),
      scarfMat,
      0x38bdf8,
      0x6366f1,
      0xc7d2fe
    );
    scarfTail.position.set(0, 1.38, -0.42);
    scarfTail.rotation.x = 0.35;
    extraGroup.add(scarfTail);

    // Masked Head
    headGroup.position.set(0, 2.12, 0.08);
    const headMesh = createDetailedMesh(
      new THREE.OctahedronGeometry(0.32, 2),
      shadowMat,
      0x312e81,
      0x6366f1,
      0xe0e7ff
    );
    headGroup.add(headMesh);

    const maskPlate = createDetailedMesh(
      new THREE.BoxGeometry(0.36, 0.36, 0.14, 3, 3, 2),
      bladeGlow,
      0x38bdf8,
      0xa5b4fc,
      0xffffff
    );
    maskPlate.position.set(0, 0, 0.24);
    maskPlate.rotation.z = Math.PI / 4;
    headGroup.add(maskPlate);

    // Dual Arms with Twin Damascus-Etched Shadow Blades
    leftArm.position.set(-0.66, 1.76, 0);
    rightArm.position.set(0.66, 1.76, 0);
    const lArm = createDetailedMesh(
      new THREE.CapsuleGeometry(0.11, 0.5, 8, 16),
      shadowMat,
      0x4338ca,
      0x818cf8,
      0xe0e7ff
    );
    const rArm = createDetailedMesh(
      new THREE.CapsuleGeometry(0.11, 0.5, 8, 16),
      shadowMat,
      0x4338ca,
      0x818cf8,
      0xe0e7ff
    );
    lArm.position.y = -0.34;
    rArm.position.y = -0.34;
    leftArm.add(lArm);
    rightArm.add(rArm);

    const lDagger = createDetailedMesh(
      new THREE.ConeGeometry(0.15, 1.38, 12, 4),
      bladeGlow,
      0x6366f1,
      0x38bdf8,
      0xffffff
    );
    lDagger.rotation.x = Math.PI / 2;
    lDagger.position.set(0, -0.62, 0.58);
    leftArm.add(lDagger);

    weaponGroup.position.set(0, -0.62, 0.58);
    rightArm.add(weaponGroup);
    const rDagger = createDetailedMesh(
      new THREE.ConeGeometry(0.15, 1.38, 12, 4),
      bladeGlow,
      0x6366f1,
      0x38bdf8,
      0xffffff
    );
    rDagger.rotation.x = Math.PI / 2;
    weaponGroup.add(rDagger);
  } else {
    // 5. COLOSSUS: Ancient rune-veined granite & mossy basalt golem with faceted ice-blue crystals
    const stoneMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'stone',
        primaryHex: 0x64748b,
        secondaryHex: 0x1e293b,
        accentHex: 0x38bdf8,
        roughness: 0.82,
        metalness: 0.18,
        flatShading: true,
      })
    );
    const darkRockMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'stone',
        primaryHex: 0x334155,
        secondaryHex: 0x0f172a,
        accentHex: 0x10b981,
        roughness: 0.86,
        metalness: 0.22,
        flatShading: true,
      })
    );
    const crystalMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'crystal',
        primaryHex: 0x7dd3fc,
        secondaryHex: 0x0284c7,
        accentHex: 0xffffff,
        emissiveHex: 0x0284c7,
        emissiveIntensity: 1.65,
        roughness: 0.12,
        metalness: 0.38,
      })
    );

    // Massive Rune-Carved Stone Legs (Higher-poly subdivided rock geometry)
    leftLeg.position.set(-0.48, 0.85, 0);
    rightLeg.position.set(0.48, 0.85, 0);
    const lLeg = createDetailedMesh(
      new THREE.DodecahedronGeometry(0.42, 1),
      darkRockMat,
      0x334155,
      0x94a3b8,
      0x6ee7b7,
      0.16
    );
    const rLeg = createDetailedMesh(
      new THREE.DodecahedronGeometry(0.42, 1),
      darkRockMat,
      0x334155,
      0x94a3b8,
      0x6ee7b7,
      0.16
    );
    lLeg.scale.set(0.95, 1.35, 0.95);
    rLeg.scale.set(0.95, 1.35, 0.95);
    lLeg.position.y = -0.35;
    rLeg.position.y = -0.35;
    lLeg.castShadow = true;
    rLeg.castShadow = true;
    leftLeg.add(lLeg);
    rightLeg.add(rLeg);

    // Monolithic Boulder Torso with Mossy & Cyan-Veined Multi-Tone Facets
    const torso = createDetailedMesh(
      new THREE.DodecahedronGeometry(0.96, 1),
      stoneMat,
      0x475569,
      0xcbd5e1,
      0x7dd3fc,
      0.16
    );
    torso.scale.set(1.15, 1.05, 0.9);
    torso.position.y = 1.68;
    torso.castShadow = true;
    bodyGroup.add(torso);

    // Glowing Blue Heart Crystal in Chest
    const coreCrystal = createDetailedMesh(
      new THREE.OctahedronGeometry(0.42, 1),
      crystalMat,
      0x0284c7,
      0x7dd3fc,
      0xffffff,
      0.16
    );
    coreCrystal.position.set(0, 1.72, 0.68);
    bodyGroup.add(coreCrystal);

    // Back Crystal Spires in extraGroup
    extraGroup.position.set(0, 2.35, -0.35);
    const spireOffsets = [
      { x: -0.45, y: 0.1, z: -0.1, rotZ: 0.4, scale: 1.0 },
      { x: 0, y: 0.35, z: -0.18, rotZ: 0, scale: 1.35 },
      { x: 0.45, y: 0.1, z: -0.1, rotZ: -0.4, scale: 1.0 },
    ];
    spireOffsets.forEach((cfg) => {
      const spire = createDetailedMesh(
        new THREE.ConeGeometry(0.22, 0.95, 10, 3),
        crystalMat,
        0x0284c7,
        0x7dd3fc,
        0xffffff,
        0.15
      );
      spire.position.set(cfg.x, cfg.y, cfg.z);
      spire.rotation.z = cfg.rotZ;
      spire.rotation.x = -0.28;
      spire.scale.setScalar(cfg.scale);
      extraGroup.add(spire);
    });

    // Monolith Head
    headGroup.position.set(0, 2.68, 0.18);
    const headRock = createDetailedMesh(
      new THREE.DodecahedronGeometry(0.38, 1),
      darkRockMat,
      0x475569,
      0x94a3b8,
      0x7dd3fc,
      0.15
    );
    headRock.scale.set(1.2, 0.95, 1.1);
    headGroup.add(headRock);

    const eyeVisor = createDetailedMesh(
      new THREE.BoxGeometry(0.46, 0.12, 0.2, 4, 2, 2),
      crystalMat,
      0x38bdf8,
      0xbae6fd,
      0xffffff
    );
    eyeVisor.position.set(0, 0.04, 0.26);
    headGroup.add(eyeVisor);

    // Giant Stone Fists & Moss-Capped Shoulders
    leftArm.position.set(-1.18, 2.02, 0);
    rightArm.position.set(1.18, 2.02, 0);

    const lShoulder = createDetailedMesh(
      new THREE.DodecahedronGeometry(0.46, 1),
      stoneMat,
      0x475569,
      0xcbd5e1,
      0x6ee7b7,
      0.16
    );
    const rShoulder = createDetailedMesh(
      new THREE.DodecahedronGeometry(0.46, 1),
      stoneMat,
      0x475569,
      0xcbd5e1,
      0x6ee7b7,
      0.16
    );
    leftArm.add(lShoulder);
    rightArm.add(rShoulder);

    const lFist = createDetailedMesh(
      new THREE.DodecahedronGeometry(0.48, 1),
      darkRockMat,
      0x334155,
      0x94a3b8,
      0x38bdf8,
      0.16
    );
    lFist.position.set(0, -0.78, 0.15);
    lFist.castShadow = true;
    leftArm.add(lFist);

    weaponGroup.position.set(0, -0.78, 0.15);
    rightArm.add(weaponGroup);
    const rFist = createDetailedMesh(
      new THREE.DodecahedronGeometry(0.48, 1),
      darkRockMat,
      0x334155,
      0x94a3b8,
      0x38bdf8,
      0.16
    );
    rFist.castShadow = true;
    weaponGroup.add(rFist);

    const gauntletCrystal = createDetailedMesh(
      new THREE.OctahedronGeometry(0.32, 1),
      crystalMat,
      0x0284c7,
      0x7dd3fc,
      0xffffff
    );
    gauntletCrystal.position.set(0.18, 0, 0.28);
    weaponGroup.add(gauntletCrystal);
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
    const breathe = Math.sin(animTime * 2.6) * 0.06;
    rig.bodyGroup.position.y = breathe;
    rig.leftArm.rotation.x = Math.sin(animTime * 2.0) * 0.08;
    rig.rightArm.rotation.x = -Math.sin(animTime * 2.0) * 0.08;
    rig.headGroup.rotation.y = Math.sin(animTime * 1.1) * 0.12;
  } else if (state === 'walk') {
    const pace = animTime * 10.5;
    const bounce = Math.abs(Math.sin(pace)) * 0.14;
    rig.bodyGroup.position.y = bounce;
    rig.bodyGroup.rotation.x = 0.14;
    rig.leftLeg.rotation.x = Math.sin(pace) * 0.68;
    rig.rightLeg.rotation.x = -Math.sin(pace) * 0.68;
    rig.leftArm.rotation.x = -Math.sin(pace) * 0.52;
    rig.rightArm.rotation.x = Math.sin(pace) * 0.52;
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
