import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HeroAnimState, HeroId, SkillSlotIndex, TeamId } from '../types/game';
import { HERO_DEFINITIONS } from './heroDefinitions';

export interface HeroRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  torsoGroup: THREE.Group;
  proceduralGroup: THREE.Group;
  glbGroup: THREE.Group;
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
  isGlbLoaded: boolean;
}

const gltfLoader = new GLTFLoader();
const heroGlbCache = new Map<HeroId, THREE.Group>();

/**
 * Preload and cache Blender-exported GLB models directly
 */
export async function preloadHeroGlb(heroId: HeroId): Promise<THREE.Group> {
  const cached = heroGlbCache.get(heroId);
  if (cached) return cached.clone();

  return new Promise((resolve, reject) => {
    gltfLoader.load(
      `/models/heroes/${heroId}.glb`,
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (mat) {
              mat.flatShading = true;
              mat.roughness = Math.max(0.75, mat.roughness ?? 0.85);
            }
          }
        });
        heroGlbCache.set(heroId, model);
        resolve(model.clone());
      },
      undefined,
      (err) => reject(err)
    );
  });
}

/**
 * Preloads all 5 Blender exported hero models
 */
export async function preloadAllHeroGlbs(): Promise<void> {
  const heroIds: HeroId[] = ['vanguard', 'arcanist', 'ranger', 'wraith', 'colossus'];
  await Promise.allSettled(heroIds.map((id) => preloadHeroGlb(id)));
}

/**
 * Preload the combined 5-hero lineup exported from Blender
 */
export async function preloadAllHeroesGlb(): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      '/models/heroes/all_heroes.glb',
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (mat) {
              mat.flatShading = true;
              mat.roughness = Math.max(0.75, mat.roughness ?? 0.85);
            }
          }
        });
        resolve(model);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

/**
 * Creates 1:1 faceted low-poly mesh matching Blender's shade_flat output
 */
function createFacetedMesh(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
  const nonIndexedGeo = geo.toNonIndexed();
  nonIndexedGeo.computeVertexNormals();
  const mesh = new THREE.Mesh(nonIndexedGeo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.isProcedural = true;
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

function getTargetGroupForGlbNode(heroId: HeroId, idx: number, rig: HeroRig): THREE.Group | null {
  if (idx <= 2) return null; // Pedestals
  if (idx >= 3 && idx <= 11) return rig.torsoGroup;
  if (idx >= 12 && idx <= 15) return rig.leftLeg;
  if (idx >= 16 && idx <= 19) return rig.rightLeg;
  if (idx >= 20 && idx <= 23) return rig.leftArm;
  if (idx >= 24 && idx <= 27) return rig.rightArm;

  if (idx >= 28 && idx <= 29) {
    if (heroId === 'arcanist') return rig.extraGroup; // Orbital Shards
    if (heroId === 'ranger') return rig.leftArm; // Archer Guard
    if (heroId === 'wraith') return rig.torsoGroup; // Shoulder cowl
    return rig.leftArm; // Left pauldron
  }
  if (idx >= 30 && idx <= 31) {
    if (heroId === 'arcanist') return rig.extraGroup; // Orbital Shards
    if (heroId === 'ranger') return rig.headGroup; // Hood & feather
    if (heroId === 'wraith') return rig.headGroup; // Scarf collar
    return rig.rightArm; // Right pauldron
  }
  if (idx >= 32 && idx <= 35) {
    if (heroId === 'ranger') return rig.extraGroup; // Cape, quiver, fletchings
    if (heroId === 'wraith' && idx === 32) return rig.extraGroup; // Scarf tail
    if (heroId === 'wraith' && (idx === 33 || idx === 34)) return rig.headGroup; // Optics
    if (heroId === 'wraith' && idx === 35) return rig.leftArm; // Left dagger
    if (heroId === 'arcanist' && idx === 33) return rig.torsoGroup; // Skirt
    if (heroId === 'arcanist' && (idx === 34 || idx === 35)) return rig.rightArm; // Staff
    return rig.headGroup;
  }
  if (idx >= 36) {
    if (heroId === 'wraith') return idx === 36 ? rig.leftArm : rig.rightArm;
    if (heroId === 'colossus') return idx <= 37 ? rig.leftArm : rig.rightArm; // Shield vs Hammer
    if (heroId === 'ranger') return rig.leftArm; // Bow
    if (heroId === 'arcanist') return rig.rightArm; // Staff orb
    return rig.rightArm; // Claymore
  }
  return rig.torsoGroup;
}

export function createHeroRig(heroId: HeroId, team: TeamId = 'ally'): HeroRig {
  const def = HERO_DEFINITIONS[heroId];
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  const torsoGroup = new THREE.Group();
  const headGroup = new THREE.Group();
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  const weaponGroup = new THREE.Group();
  const extraGroup = new THREE.Group();
  const proceduralGroup = new THREE.Group();
  const glbGroup = new THREE.Group();
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

  // Synchronized pivot hierarchy:
  // Hip sockets on bodyGroup
  leftLeg.position.set(-0.28, 0.75, 0);
  rightLeg.position.set(0.28, 0.75, 0);
  bodyGroup.add(leftLeg);
  bodyGroup.add(rightLeg);

  // Waist pivot on bodyGroup
  torsoGroup.position.set(0, 0.85, 0);
  bodyGroup.add(torsoGroup);

  // Neck pivot on torsoGroup
  headGroup.position.set(0, 0.93, 0);
  torsoGroup.add(headGroup);

  // Shoulder sockets on torsoGroup
  leftArm.position.set(-0.58, 0.60, 0);
  rightArm.position.set(0.58, 0.60, 0);
  torsoGroup.add(leftArm);
  torsoGroup.add(rightArm);

  // Accessories on torsoGroup
  extraGroup.position.set(0, 0.80, 0);
  torsoGroup.add(extraGroup);

  bodyGroup.add(proceduralGroup);
  bodyGroup.add(glbGroup);

  const glbAttachedChildren: THREE.Object3D[] = [];

  const rig: HeroRig = {
    root,
    bodyGroup,
    torsoGroup,
    proceduralGroup,
    glbGroup,
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
    isGlbLoaded: false,
  };

  const applyGlb = (model: THREE.Group) => {
    // Hide procedural fallback cleanly
    proceduralGroup.visible = false;

    // Remove any previously attached GLB meshes
    glbAttachedChildren.forEach((c) => {
      c.parent?.remove(c);
    });
    glbAttachedChildren.length = 0;

    // Blender hero models stand atop an internal pedestal at Y=0.30.
    // Shifting Y by -0.30 places boots firmly on the ground plane (Y=0.0).
    model.position.y = -0.30;
    root.add(model);
    root.updateMatrixWorld(true);

    const children = [...model.children];
    children.forEach((child, idx) => {
      // Hide internal pedestal so the hero stands directly on the arena/lobby ground
      if (child.name.toLowerCase().includes('pedestal') || idx <= 2) {
        child.visible = false;
        return;
      }
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.flatShading = true;
          mat.roughness = Math.max(0.75, mat.roughness ?? 0.85);
          registerMat(mat);
        }
      }

      const targetGroup = getTargetGroupForGlbNode(heroId, idx, rig);
      if (targetGroup) {
        targetGroup.attach(child);
        glbAttachedChildren.push(child);
      }
    });

    root.remove(model);
    rig.isGlbLoaded = true;
  };

  // Check if Blender GLB model is already in cache
  const cachedGlb = heroGlbCache.get(heroId);
  if (cachedGlb) {
    applyGlb(cachedGlb.clone());
  } else {
    proceduralGroup.visible = true;
    glbGroup.visible = false;
    preloadHeroGlb(heroId)
      .then((model) => {
        applyGlb(model);
      })
      .catch((err) => {
        console.warn(`[HeroBuilder] Loading GLB for ${heroId} failed, procedural fallback active:`, err);
        proceduralGroup.visible = true;
      });
  }

  // ========================================================
  // PROCEDURAL FACETED MESHES (Synchronous fallback matching Blender)
  // ========================================================
  const mDark = registerMat(createMatteMaterial(0x161822, 0.92, 0.02));

  if (heroId === 'vanguard') {
    const mPri = registerMat(createMatteMaterial(def.primaryColor, 0.84, 0.15));
    const mSec = registerMat(createMatteMaterial(def.secondaryColor, 0.88, 0.08));
    const mAcc = registerMat(createMatteMaterial(def.accentColor, 0.55, 0.22, def.accentColor, 0.45));

    const pelvis = createFacetedMesh(new THREE.CylinderGeometry(0.38, 0.32, 0.28, 6), mSec);
    pelvis.position.y = 1.15;
    pelvis.scale.set(1.1, 1.0, 0.8);
    proceduralGroup.add(pelvis);

    const belt = createFacetedMesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 8), mDark);
    belt.position.y = 1.28;
    belt.scale.set(1.08, 1.0, 0.85);
    proceduralGroup.add(belt);

    const buckle = createFacetedMesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), mAcc);
    buckle.position.set(0, 1.28, 0.36);
    proceduralGroup.add(buckle);

    const ab = createFacetedMesh(new THREE.CylinderGeometry(0.36, 0.33, 0.32, 6), mDark);
    ab.position.y = 1.45;
    ab.scale.set(1.05, 1.0, 0.75);
    proceduralGroup.add(ab);

    const chestGeo = new THREE.ConeGeometry(0.52, 0.48, 6);
    chestGeo.rotateX(Math.PI);
    const chest = createFacetedMesh(chestGeo, mPri);
    chest.position.y = 1.8;
    chest.scale.set(1.15, 1.0, 0.8);
    proceduralGroup.add(chest);

    const chestPlate = createFacetedMesh(new THREE.BoxGeometry(0.45, 0.38, 0.16), mSec);
    chestPlate.position.set(0, 1.84, 0.22);
    proceduralGroup.add(chestPlate);

    const coreGem = createFacetedMesh(new THREE.OctahedronGeometry(0.1, 0), mAcc);
    coreGem.position.set(0, 1.84, 0.34);
    proceduralGroup.add(coreGem);

    const gorget = createFacetedMesh(new THREE.TorusGeometry(0.28, 0.06, 4, 6), mSec);
    gorget.rotation.x = Math.PI / 2;
    gorget.position.y = 2.06;
    proceduralGroup.add(gorget);

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

  } else if (heroId === 'arcanist') {
    const mPri = registerMat(createMatteMaterial(def.primaryColor, 0.88, 0.08));
    const mSec = registerMat(createMatteMaterial(def.secondaryColor, 0.9, 0.05));
    const mAcc = registerMat(createMatteMaterial(def.accentColor, 0.52, 0.2, def.accentColor, 0.5));

    const robeGeo = new THREE.ConeGeometry(0.72, 1.05, 7);
    const robe = createFacetedMesh(robeGeo, mPri);
    robe.position.y = 0.72;
    robe.scale.set(1.05, 1.0, 0.9);
    proceduralGroup.add(robe);

    const waist = createFacetedMesh(new THREE.CylinderGeometry(0.32, 0.35, 0.32, 6), mSec);
    waist.position.y = 1.35;
    proceduralGroup.add(waist);

    const chest = createFacetedMesh(new THREE.ConeGeometry(0.46, 0.45, 6), mPri);
    chest.position.y = 1.72;
    chest.rotation.x = Math.PI;
    proceduralGroup.add(chest);

    extraGroup.position.set(0, 1.95, 0);
    for (const sx of [-0.72, 0.72]) {
      const shard = createFacetedMesh(new THREE.OctahedronGeometry(0.18, 0), mAcc);
      shard.position.set(sx, 0, 0);
      shard.scale.set(0.7, 1.5, 0.7);
      extraGroup.add(shard);
    }

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

    leftArm.position.set(-0.56, 1.75, 0);
    rightArm.position.set(0.56, 1.75, 0);

    const lSleeve = createFacetedMesh(new THREE.ConeGeometry(0.24, 0.72, 6), mPri);
    lSleeve.position.y = -0.36;
    leftArm.add(lSleeve);

    const rSleeve = createFacetedMesh(new THREE.ConeGeometry(0.24, 0.72, 6), mPri);
    rSleeve.position.y = -0.36;
    rightArm.add(rSleeve);

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

  } else if (heroId === 'ranger') {
    const mPri = registerMat(createMatteMaterial(def.primaryColor, 0.85, 0.08));
    const mSec = registerMat(createMatteMaterial(def.secondaryColor, 0.88, 0.05));
    const mAcc = registerMat(createMatteMaterial(def.accentColor, 0.55, 0.15, def.accentColor, 0.4));

    const pelvis = createFacetedMesh(new THREE.CylinderGeometry(0.34, 0.28, 0.26, 6), mSec);
    pelvis.position.y = 1.15;
    pelvis.scale.set(1.05, 1.0, 0.75);
    proceduralGroup.add(pelvis);

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

    const torso = createFacetedMesh(new THREE.ConeGeometry(0.45, 0.72, 6), mPri);
    torso.position.y = 1.62;
    torso.rotation.x = Math.PI;
    torso.scale.set(1.05, 1.0, 0.75);
    proceduralGroup.add(torso);

    const cape = createFacetedMesh(new THREE.BoxGeometry(0.44, 0.95, 0.04), mSec);
    cape.position.set(0, 1.35, -0.24);
    cape.rotation.x = 0.18;
    extraGroup.add(cape);

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

    headGroup.position.set(0, 2.28, 0);
    const hood = createFacetedMesh(new THREE.CylinderGeometry(0.18, 0.34, 0.44, 6), mPri);
    headGroup.add(hood);

    const feather = createFacetedMesh(new THREE.ConeGeometry(0.05, 0.45, 3), mAcc);
    feather.position.set(-0.25, 0.22, -0.05);
    feather.rotation.z = Math.PI / 4;
    headGroup.add(feather);

    leftArm.position.set(-0.58, 1.75, 0);
    rightArm.position.set(0.58, 1.75, 0);

    const archerGuard = createFacetedMesh(new THREE.BoxGeometry(0.28, 0.26, 0.26), mSec);
    leftArm.add(archerGuard);

    weaponGroup.position.set(0, -0.65, 0.25);
    leftArm.add(weaponGroup);

    const bowShaft = createFacetedMesh(new THREE.TorusGeometry(0.68, 0.032, 4, 10, Math.PI), mPri);
    bowShaft.rotation.z = Math.PI / 2;
    weaponGroup.add(bowShaft);

    const bowString = createFacetedMesh(new THREE.CylinderGeometry(0.008, 0.008, 1.32, 3), mAcc);
    bowString.position.x = -0.06;
    weaponGroup.add(bowString);

  } else if (heroId === 'wraith') {
    const mPri = registerMat(createMatteMaterial(def.primaryColor, 0.82, 0.18));
    const mSec = registerMat(createMatteMaterial(def.secondaryColor, 0.86, 0.08));
    const mAcc = registerMat(createMatteMaterial(def.accentColor, 0.5, 0.25, def.accentColor, 0.6));

    const torso = createFacetedMesh(new THREE.CylinderGeometry(0.38, 0.3, 0.68, 6), mPri);
    torso.position.y = 1.48;
    torso.scale.set(1.05, 1.0, 0.75);
    proceduralGroup.add(torso);

    leftLeg.position.set(-0.25, 1.05, 0);
    rightLeg.position.set(0.25, 1.05, 0);

    const createNinjaLeg = (legGroup: THREE.Group) => {
      const legMesh = createFacetedMesh(new THREE.CylinderGeometry(0.13, 0.09, 0.82, 5), mPri);
      legMesh.position.y = -0.42;
      legGroup.add(legMesh);
    };
    createNinjaLeg(leftLeg);
    createNinjaLeg(rightLeg);

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

  } else {
    const mPri = registerMat(createMatteMaterial(def.primaryColor, 0.92, 0.05));
    const mSec = registerMat(createMatteMaterial(def.secondaryColor, 0.94, 0.04));
    const mAcc = registerMat(createMatteMaterial(def.accentColor, 0.65, 0.15, def.accentColor, 0.45));

    const torso = createFacetedMesh(new THREE.DodecahedronGeometry(0.85, 0), mPri);
    torso.position.y = 1.62;
    torso.scale.set(1.25, 1.1, 0.95);
    torso.castShadow = true;
    proceduralGroup.add(torso);

    const crag = createFacetedMesh(new THREE.IcosahedronGeometry(0.48, 0), mSec);
    crag.position.set(0, 1.82, -0.32);
    crag.scale.set(1.2, 0.9, 1.0);
    proceduralGroup.add(crag);

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

    headGroup.position.set(0, 2.32, 0.12);
    const head = createFacetedMesh(new THREE.BoxGeometry(0.54, 0.5, 0.48), mPri);
    headGroup.add(head);

    const brow = createFacetedMesh(new THREE.BoxGeometry(0.56, 0.14, 0.18), mSec);
    brow.position.set(0, 0.14, 0.26);
    headGroup.add(brow);

    const runeEyes = createFacetedMesh(new THREE.BoxGeometry(0.42, 0.06, 0.06), mAcc);
    runeEyes.position.set(0, 0.02, 0.28);
    headGroup.add(runeEyes);

    leftArm.position.set(-0.95, 1.88, 0);
    rightArm.position.set(0.95, 1.88, 0);

    const lPauldron = createFacetedMesh(new THREE.BoxGeometry(0.52, 0.48, 0.48), mPri);
    leftArm.add(lPauldron);

    const rPauldron = createFacetedMesh(new THREE.BoxGeometry(0.52, 0.48, 0.48), mPri);
    rightArm.add(rPauldron);

    const shield = createFacetedMesh(new THREE.BoxGeometry(0.8, 1.45, 0.18), mSec);
    shield.position.set(0, -0.38, 0.38);
    shield.rotation.y = 0.15;
    leftArm.add(shield);

    const shieldBoss = createFacetedMesh(new THREE.OctahedronGeometry(0.24, 0), mAcc);
    shieldBoss.position.set(0, -0.38, 0.52);
    leftArm.add(shieldBoss);

    weaponGroup.position.set(0.12, -0.2, 0.1);
    weaponGroup.rotation.x = -0.65;
    rightArm.add(weaponGroup);

    const shaft = createFacetedMesh(new THREE.CylinderGeometry(0.06, 0.06, 1.35, 5), mSec);
    weaponGroup.add(shaft);

    const hammerHead = createFacetedMesh(new THREE.BoxGeometry(0.44, 0.35, 0.35), mPri);
    hammerHead.position.y = 0.68;
    weaponGroup.add(hammerHead);
  }

  return rig;
}

export function updateHeroRigAnimation(
  rig: HeroRig,
  heroId: HeroId,
  state: HeroAnimState,
  animTime: number,
  hitFlashTimer: number,
  hasShield: boolean,
  skillSlot: SkillSlotIndex = 0
) {
  rig.shieldMesh.visible = hasShield;
  if (hasShield) {
    rig.shieldMesh.rotation.y = animTime * 1.5;
  }

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

  // Neutral base transform reset
  rig.bodyGroup.position.set(0, 0, 0);
  rig.bodyGroup.rotation.set(0, 0, 0);
  rig.torsoGroup.position.set(0, 0.85, 0);
  rig.torsoGroup.rotation.set(0, 0, 0);
  rig.torsoGroup.scale.set(1, 1, 1);
  rig.headGroup.position.set(0, 0.93, 0);
  rig.headGroup.rotation.set(0, 0, 0);
  rig.leftArm.position.set(-0.58, 0.60, 0);
  rig.leftArm.rotation.set(0, 0, 0);
  rig.rightArm.position.set(0.58, 0.60, 0);
  rig.rightArm.rotation.set(0, 0, 0);
  rig.leftLeg.position.set(-0.28, 0.75, 0);
  rig.leftLeg.rotation.set(0, 0, 0);
  rig.rightLeg.position.set(0.28, 0.75, 0);
  rig.rightLeg.rotation.set(0, 0, 0);
  rig.extraGroup.position.set(0, 0.80, 0);
  rig.extraGroup.rotation.set(0, 0, 0);

  if (state === 'idle') {
    // 1. SYNCHRONIZED IDLE: Organic breathing & idle combat readiness
    const breathe = Math.sin(animTime * 2.3);
    rig.bodyGroup.position.y = breathe * 0.035;
    rig.torsoGroup.scale.set(1 + breathe * 0.016, 1 + breathe * 0.022, 1 + breathe * 0.016);
    rig.torsoGroup.rotation.x = breathe * 0.02;
    rig.headGroup.rotation.y = Math.sin(animTime * 0.9) * 0.07;
    rig.headGroup.rotation.x = -breathe * 0.025;

    if (heroId === 'vanguard') {
      rig.leftArm.rotation.set(-0.62 + breathe * 0.03, 0.35, 0.22);
      rig.rightArm.rotation.set(-0.75 + breathe * 0.03, -0.28, -0.18);
      rig.torsoGroup.rotation.y = 0.06;
    } else if (heroId === 'arcanist') {
      rig.leftArm.rotation.set(-0.45 + breathe * 0.05, 0.28, 0.2);
      rig.rightArm.rotation.set(-0.25 - breathe * 0.02, -0.18, -0.12);
      rig.extraGroup.rotation.y = animTime * 2.2;
      rig.extraGroup.position.y = 0.80 + breathe * 0.04;
    } else if (heroId === 'ranger') {
      rig.leftArm.rotation.set(-0.72 + breathe * 0.03, 0.15, 0.1);
      rig.rightArm.rotation.set(-0.32 - breathe * 0.02, -0.18, -0.12);
      rig.extraGroup.rotation.x = 0.18 + Math.sin(animTime * 2.8) * 0.07;
    } else if (heroId === 'wraith') {
      rig.bodyGroup.position.y = -0.06 + breathe * 0.02;
      rig.torsoGroup.rotation.x = 0.12;
      rig.leftArm.rotation.set(-0.85 + breathe * 0.02, 0.45, 0.35);
      rig.rightArm.rotation.set(-0.85 + breathe * 0.02, -0.45, -0.35);
      rig.extraGroup.rotation.x = 0.25 + Math.sin(animTime * 3.4) * 0.09;
      rig.extraGroup.rotation.z = Math.sin(animTime * 2.6) * 0.07;
    } else {
      rig.bodyGroup.position.y = 0;
      rig.leftArm.rotation.set(-0.35, 0.2, 0.08);
      rig.rightArm.rotation.set(-0.62 + breathe * 0.02, -0.18, -0.12);
      rig.headGroup.rotation.y = Math.sin(animTime * 0.6) * 0.05;
    }
  } else if (state === 'walk') {
    // 2. SYNCHRONIZED WALK: Contra-lateral Locomotion Gait
    const pace = animTime * 11.2;
    const stride = Math.sin(pace);
    const bounce = Math.abs(stride) * 0.12;
    const hipSway = stride * 0.055;
    const torsoTwist = -stride * 0.08;

    rig.bodyGroup.position.y = bounce;
    rig.bodyGroup.position.x = hipSway * 0.45;
    rig.bodyGroup.rotation.z = hipSway;
    rig.bodyGroup.rotation.x = 0.14;
    rig.torsoGroup.rotation.y = torsoTwist;
    rig.headGroup.rotation.y = -torsoTwist * 0.7;

    rig.leftLeg.rotation.x = stride * 0.72;
    rig.rightLeg.rotation.x = -stride * 0.72;

    if (heroId === 'vanguard') {
      rig.leftArm.rotation.x = -stride * 0.55 - 0.2;
      rig.leftArm.rotation.z = 0.18;
      rig.rightArm.rotation.x = stride * 0.55 - 0.35;
      rig.rightArm.rotation.z = -0.2;
    } else if (heroId === 'arcanist') {
      rig.leftArm.rotation.x = -stride * 0.45;
      rig.rightArm.rotation.x = stride * 0.35 - 0.2;
      rig.extraGroup.rotation.y = animTime * 3.4;
      rig.extraGroup.position.z = -0.1 - bounce * 0.4;
    } else if (heroId === 'ranger') {
      rig.leftArm.rotation.x = -stride * 0.3 - 0.45;
      rig.leftArm.rotation.z = 0.12;
      rig.rightArm.rotation.x = stride * 0.58;
      rig.extraGroup.rotation.x = 0.48 + Math.abs(stride) * 0.22;
    } else if (heroId === 'wraith') {
      rig.bodyGroup.rotation.x = 0.28;
      rig.leftArm.rotation.x = -stride * 0.42 - 0.5;
      rig.rightArm.rotation.x = stride * 0.42 - 0.5;
      rig.extraGroup.rotation.x = 0.72 + Math.abs(stride) * 0.25;
    } else {
      rig.bodyGroup.position.y = Math.abs(stride) * 0.15;
      rig.leftArm.rotation.x = -stride * 0.32 - 0.25;
      rig.rightArm.rotation.x = stride * 0.52 - 0.35;
    }
  } else if (state === 'attack') {
    // 3. SYNCHRONIZED BASIC ATTACK
    const t = Math.min(1, animTime / 0.35);
    const swing = Math.sin(t * Math.PI);
    if (heroId === 'vanguard') {
      rig.torsoGroup.rotation.y = -swing * 0.65;
      rig.rightArm.rotation.set(-1.85 * swing, -0.35 * swing, -0.3 * swing);
      rig.leftArm.rotation.set(-1.15 * swing, 0.35 * swing, 0.2 * swing);
      rig.bodyGroup.rotation.x = 0.1 * swing;
    } else if (heroId === 'arcanist') {
      rig.torsoGroup.rotation.y = 0.25 * swing;
      rig.rightArm.rotation.set(-1.45 * swing, 0, 0);
      rig.leftArm.rotation.set(-0.85 * swing, 0.35 * swing, 0);
      rig.extraGroup.rotation.y = animTime * 6.0;
    } else if (heroId === 'ranger') {
      rig.torsoGroup.rotation.y = 0.65 * swing;
      rig.leftArm.rotation.set(-1.35 * swing, 0, 0.1);
      rig.rightArm.rotation.set(-1.45 * swing, -0.4 * swing, -0.5 * swing);
    } else if (heroId === 'wraith') {
      rig.leftArm.rotation.set(-1.65 * swing, 0.45 * swing, 0.55 * swing);
      rig.rightArm.rotation.set(-1.65 * swing, -0.45 * swing, -0.55 * swing);
      rig.torsoGroup.rotation.y = swing * 0.35;
    } else {
      rig.rightArm.rotation.set(-2.25 * swing, 0, 0);
      rig.leftArm.rotation.set(-0.65 * swing, 0.25 * swing, 0);
      rig.bodyGroup.position.y = swing * 0.18;
    }
  } else if (state === 'skill') {
    // 4. SYNCHRONIZED SKILL POSES FOR ALL HEROES (Q, W, E)
    const t = Math.min(1, animTime / 0.55);
    const curve = Math.sin(t * Math.PI);

    if (heroId === 'vanguard') {
      if (skillSlot === 0) {
        // Q: Cinder Cleave - 360 Whirlwind cleave
        rig.torsoGroup.rotation.y = t * Math.PI * 2;
        rig.rightArm.rotation.set(-1.45, -0.3, -0.2);
        rig.leftArm.rotation.set(-1.25, 0.3, 0.2);
        rig.bodyGroup.position.y = curve * 0.3;
        rig.leftLeg.rotation.x = 0.25;
        rig.rightLeg.rotation.x = -0.25;
      } else if (skillSlot === 1) {
        // W: Blazing Bulwark - Shield Charge
        rig.bodyGroup.position.y = curve * 0.18;
        rig.bodyGroup.rotation.x = 0.38 * curve;
        rig.leftArm.rotation.set(-1.45 * curve, 0.4 * curve, 0.3 * curve);
        rig.rightArm.rotation.set(0.45 * curve, -0.25, 0);
        rig.leftLeg.rotation.x = 0.65 * curve;
        rig.rightLeg.rotation.x = -0.55 * curve;
      } else {
        // E: Infernal Cataclysm - Meteor Leap Slam
        const jumpY = Math.sin(t * Math.PI) * 2.25;
        rig.bodyGroup.position.y = jumpY;
        if (t < 0.5) {
          rig.rightArm.rotation.set(-2.85, -0.15, -0.15);
          rig.leftArm.rotation.set(-2.55, 0.15, 0.15);
          rig.torsoGroup.rotation.x = -0.35;
          rig.leftLeg.rotation.x = -0.55;
          rig.rightLeg.rotation.x = -0.55;
        } else {
          rig.rightArm.rotation.set(0.25, 0, 0);
          rig.leftArm.rotation.set(0.25, 0, 0);
          rig.torsoGroup.rotation.x = 0.48;
          rig.bodyGroup.rotation.x = 0.22;
          rig.leftLeg.rotation.set(0.45, 0, -0.25);
          rig.rightLeg.rotation.set(0.45, 0, 0.25);
        }
      }
    } else if (heroId === 'arcanist') {
      if (skillSlot === 0) {
        // Q: Astral Shard - Beam thrust
        rig.rightArm.rotation.set(-1.75 * curve, 0, 0);
        rig.leftArm.rotation.set(-1.35 * curve, 0.45 * curve, 0);
        rig.torsoGroup.rotation.y = 0.25 * curve;
        rig.extraGroup.rotation.y = animTime * 8.5;
        rig.extraGroup.position.z = 0.45 * curve;
      } else if (skillSlot === 1) {
        // W: Dimensional Rift - Spacetime Levitation
        rig.bodyGroup.position.y = curve * 1.05;
        rig.bodyGroup.rotation.y = t * Math.PI * 2;
        rig.leftArm.rotation.set(-0.85 * curve, 0, 1.25 * curve);
        rig.rightArm.rotation.set(-0.85 * curve, 0, -1.25 * curve);
        rig.extraGroup.rotation.y = animTime * 14.0;
      } else {
        // E: Event Horizon - Singularity Nova Cataclysm
        rig.bodyGroup.position.y = curve * 1.75;
        rig.torsoGroup.rotation.x = -0.35 * curve;
        rig.headGroup.rotation.x = -0.45 * curve;
        rig.rightArm.rotation.set(-2.65 * curve, -0.18, 0);
        rig.leftArm.rotation.set(-2.45 * curve, 0.18, 0);
        rig.extraGroup.rotation.y = animTime * 24.0;
      }
    } else if (heroId === 'ranger') {
      if (skillSlot === 0) {
        // Q: Gale Piercer - Precision sniper archery draw
        rig.torsoGroup.rotation.y = 0.78 * curve;
        rig.headGroup.rotation.y = -0.78 * curve;
        rig.leftArm.rotation.set(-1.45 * curve, 0, 0.15);
        rig.rightArm.rotation.set(-1.55 * curve, -0.55 * curve, -0.65 * curve);
        rig.leftLeg.rotation.x = 0.35 * curve;
        rig.rightLeg.rotation.x = -0.42 * curve;
        if (t > 0.68) {
          rig.leftArm.position.z += 0.12;
          rig.rightArm.rotation.x += 0.45;
        }
      } else if (skillSlot === 1) {
        // W: Tailwind Leap - Backward vault
        rig.bodyGroup.position.y = curve * 1.35;
        rig.bodyGroup.position.z = -curve * 0.95;
        rig.bodyGroup.rotation.x = -curve * 0.55;
        rig.leftArm.rotation.set(-0.65 * curve, 0, 0.85 * curve);
        rig.rightArm.rotation.set(-0.45 * curve, 0, -0.85 * curve);
        rig.leftLeg.rotation.x = -0.75 * curve;
        rig.rightLeg.rotation.x = -0.75 * curve;
        rig.extraGroup.rotation.x = 0.95 * curve;
      } else {
        // E: Tempest Barrage - Rapid fire machine bow
        rig.torsoGroup.rotation.y = 0.58;
        rig.headGroup.rotation.y = -0.58;
        rig.leftArm.rotation.set(-1.45, 0, 0.15);
        rig.rightArm.rotation.set(-1.35 + Math.sin(animTime * 30.0) * 0.38, -0.48, -0.48);
        rig.extraGroup.rotation.x = 0.65 + Math.sin(animTime * 24.0) * 0.22;
      }
    } else if (heroId === 'wraith') {
      if (skillSlot === 0) {
        // Q: Shadow Strike - Low scissor slice
        rig.bodyGroup.position.y = -0.24 * curve;
        rig.bodyGroup.rotation.x = 0.45 * curve;
        rig.leftArm.rotation.set(-1.65 * curve, 0.65 * curve, 0.75 * curve);
        rig.rightArm.rotation.set(-1.65 * curve, -0.65 * curve, -0.75 * curve);
        rig.leftLeg.rotation.x = 0.75 * curve;
        rig.rightLeg.rotation.x = -0.75 * curve;
        rig.extraGroup.rotation.x = 0.85 * curve;
      } else if (skillSlot === 1) {
        // W: Veil of Night - Stealth shroud
        rig.bodyGroup.position.y = curve * 0.3;
        rig.leftArm.rotation.set(-1.2 * curve, 0.85 * curve, 0);
        rig.rightArm.rotation.set(-1.2 * curve, -0.85 * curve, 0);
        rig.headGroup.rotation.x = 0.38 * curve;
        rig.extraGroup.rotation.y = animTime * 7.5;
      } else {
        // E: Phantom Execution - Ambush plunge
        rig.bodyGroup.position.y = curve * 1.85;
        rig.bodyGroup.rotation.x = curve * 0.45;
        if (t < 0.55) {
          rig.leftArm.rotation.set(-2.55 * curve, 0.35, 0.45);
          rig.rightArm.rotation.set(-2.55 * curve, -0.35, -0.45);
        } else {
          rig.leftArm.rotation.set(0.15, 0.2, 0.3);
          rig.rightArm.rotation.set(0.15, -0.2, -0.3);
        }
      }
    } else {
      // Colossus
      if (skillSlot === 0) {
        // Q: Tectonic Slam - Shield slam
        rig.bodyGroup.position.y = -0.16 * curve;
        rig.bodyGroup.rotation.x = 0.38 * curve;
        rig.leftArm.rotation.set(-2.05 * curve, 0.25, 0);
        rig.rightArm.rotation.set(-0.85 * curve, -0.35, 0);
        rig.leftLeg.rotation.x = 0.55 * curve;
        rig.rightLeg.rotation.x = -0.45 * curve;
      } else if (skillSlot === 1) {
        // W: Bastion Fortress - Shield lockdown
        rig.bodyGroup.position.y = -0.14 * curve;
        rig.leftArm.rotation.set(-1.45 * curve, 0.48 * curve, 0.22);
        rig.rightArm.rotation.set(-1.18 * curve, -0.68 * curve, 0);
        rig.headGroup.rotation.x = 0.28 * curve;
        rig.leftLeg.rotation.z = -0.28 * curve;
        rig.rightLeg.rotation.z = 0.28 * curve;
      } else {
        // E: Earthshaker Leap - Colossal meteor slam
        rig.bodyGroup.position.y = curve * 2.65;
        if (t < 0.5) {
          rig.rightArm.rotation.set(-2.75 * curve, -0.15, 0);
          rig.leftArm.rotation.set(-2.35 * curve, 0.2, 0);
          rig.torsoGroup.rotation.x = -0.25;
        } else {
          rig.rightArm.rotation.set(0.18, 0, 0);
          rig.leftArm.rotation.set(0.18, 0, 0);
          rig.bodyGroup.rotation.x = 0.38;
          rig.leftLeg.rotation.set(0.45, 0, -0.35);
          rig.rightLeg.rotation.set(0.45, 0, 0.35);
        }
      }
    }
  }
}