import * as THREE from 'three';
import { HeroAnimState } from '../types/game';
import {
  createDetailedMesh,
  createDetailedPbrMaterial,
} from '../rendering/proceduralTextures';

export interface MonsterRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftLimb: THREE.Group;
  rightLimb: THREE.Group;
  materialsToFlash: THREE.MeshStandardMaterial[];
}

export function createMonsterRig(
  variant: 'golem' | 'stalker' | 'wolf' | 'sentinel',
  scale = 1.0
): MonsterRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  const leftLimb = new THREE.Group();
  const rightLimb = new THREE.Group();
  const materialsToFlash: THREE.MeshStandardMaterial[] = [];

  const registerMat = (mat: THREE.MeshStandardMaterial) => {
    mat.userData.baseEmissive = mat.emissive.getHex();
    mat.userData.baseEmissiveIntensity = mat.emissiveIntensity;
    materialsToFlash.push(mat);
    return mat;
  };

  // Contact shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.25 * scale, 20),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  root.add(bodyGroup);
  bodyGroup.add(leftLimb, rightLimb);

  if (variant === 'golem') {
    // Crag Stone Golem with Amber Magma Fissures & Mossy Shoulders
    const rockMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'stone',
        primaryHex: 0x78716c,
        secondaryHex: 0x292524,
        accentHex: 0xf59e0b,
        roughness: 0.85,
        metalness: 0.14,
        flatShading: true,
      })
    );
    const amberGlow = registerMat(
      createDetailedPbrMaterial({
        pattern: 'crystal',
        primaryHex: 0xfde68a,
        secondaryHex: 0xd97706,
        accentHex: 0xffffff,
        emissiveHex: 0xd97706,
        emissiveIntensity: 1.5,
      })
    );

    const torso = createDetailedMesh(
      new THREE.DodecahedronGeometry(0.95, 0),
      rockMat,
      0x57534e,
      0xd6d3d1,
      0x86efac,
      0.24
    );
    torso.position.y = 1.25;
    torso.scale.set(1.15, 1.0, 0.9);
    torso.castShadow = true;
    bodyGroup.add(torso);

    const core = createDetailedMesh(
      new THREE.OctahedronGeometry(0.36, 0),
      amberGlow,
      0xf59e0b,
      0xfef08a,
      0xffffff
    );
    core.position.set(0, 1.3, 0.65);
    bodyGroup.add(core);

    const head = createDetailedMesh(
      new THREE.BoxGeometry(0.55, 0.42, 0.5),
      rockMat,
      0x78716c,
      0xe7e5e4,
      0xfbbf24
    );
    head.position.set(0, 2.15, 0.15);
    bodyGroup.add(head);

    leftLimb.position.set(-1.05, 1.45, 0);
    rightLimb.position.set(1.05, 1.45, 0);
    const lArm = createDetailedMesh(
      new THREE.DodecahedronGeometry(0.45, 0),
      rockMat,
      0x44403c,
      0xa8a29e,
      0xfbbf24,
      0.22
    );
    const rArm = createDetailedMesh(
      new THREE.DodecahedronGeometry(0.45, 0),
      rockMat,
      0x44403c,
      0xa8a29e,
      0xfbbf24,
      0.22
    );
    lArm.scale.set(0.85, 1.45, 0.85);
    rArm.scale.set(0.85, 1.45, 0.85);
    lArm.position.y = -0.45;
    rArm.position.y = -0.45;
    leftLimb.add(lArm);
    rightLimb.add(rArm);
  } else if (variant === 'stalker') {
    // Sylvan Moss Stalker with Striated Bark & Bioluminescent Leaf Crest
    const barkMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'organic',
        primaryHex: 0x5c4033,
        secondaryHex: 0x27170e,
        accentHex: 0x4ade80,
        roughness: 0.82,
      })
    );
    const leafMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'crystal',
        primaryHex: 0x86efac,
        secondaryHex: 0x15803d,
        accentHex: 0xfef08a,
        emissiveHex: 0x16a34a,
        emissiveIntensity: 0.95,
      })
    );

    const body = createDetailedMesh(
      new THREE.ConeGeometry(0.75, 1.65, 7),
      barkMat,
      0x3e2723,
      0x8d6e63,
      0x86efac
    );
    body.position.y = 0.95;
    body.castShadow = true;
    bodyGroup.add(body);

    const crest = createDetailedMesh(
      new THREE.OctahedronGeometry(0.45, 0),
      leafMat,
      0x22c55e,
      0x86efac,
      0xfef08a
    );
    crest.position.set(0, 1.85, 0.15);
    bodyGroup.add(crest);

    leftLimb.position.set(-0.68, 1.15, 0.15);
    rightLimb.position.set(0.68, 1.15, 0.15);
    const lClaw = createDetailedMesh(
      new THREE.ConeGeometry(0.22, 0.95, 5),
      leafMat,
      0x15803d,
      0x4ade80,
      0xffffff
    );
    const rClaw = createDetailedMesh(
      new THREE.ConeGeometry(0.22, 0.95, 5),
      leafMat,
      0x15803d,
      0x4ade80,
      0xffffff
    );
    lClaw.rotation.x = Math.PI / 2;
    rClaw.rotation.x = Math.PI / 2;
    leftLimb.add(lClaw);
    rightLimb.add(rClaw);
  } else if (variant === 'wolf') {
    // Crimson Timber Wolf with Striped Predator Fur & Blood-Moon Markings
    const furMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'organic',
        primaryHex: 0x4c1d3d,
        secondaryHex: 0x1f0918,
        accentHex: 0xf43f5e,
        roughness: 0.74,
      })
    );
    const fangGlow = registerMat(
      createDetailedPbrMaterial({
        pattern: 'crystal',
        primaryHex: 0xfda4af,
        secondaryHex: 0xe11d48,
        accentHex: 0xffffff,
        emissiveHex: 0xe11d48,
        emissiveIntensity: 1.45,
      })
    );

    const body = createDetailedMesh(
      new THREE.BoxGeometry(0.72, 0.68, 1.45),
      furMat,
      0x31102f,
      0x9d174d,
      0xfda4af
    );
    body.position.y = 0.75;
    body.castShadow = true;
    bodyGroup.add(body);

    const head = createDetailedMesh(
      new THREE.ConeGeometry(0.42, 0.75, 6),
      furMat,
      0x4c1d3d,
      0xbe185d,
      0xffffff
    );
    head.rotation.x = Math.PI / 2;
    head.position.set(0, 1.05, 0.85);
    bodyGroup.add(head);

    const eyes = createDetailedMesh(
      new THREE.BoxGeometry(0.38, 0.1, 0.2),
      fangGlow,
      0xf43f5e,
      0xfef08a,
      0xffffff
    );
    eyes.position.set(0, 1.15, 0.92);
    bodyGroup.add(eyes);

    leftLimb.position.set(-0.35, 0.6, 0.45);
    rightLimb.position.set(0.35, 0.6, 0.45);
    leftLimb.add(
      createDetailedMesh(
        new THREE.BoxGeometry(0.22, 0.65, 0.22),
        furMat,
        0x1f0918,
        0x831843,
        0xf43f5e
      )
    );
    rightLimb.add(
      createDetailedMesh(
        new THREE.BoxGeometry(0.22, 0.65, 0.22),
        furMat,
        0x1f0918,
        0x831843,
        0xf43f5e
      )
    );
  } else {
    // River Aether Sentinel with Runed Obsidian Armor & Violet Energy Blades
    const armorMat = registerMat(
      createDetailedPbrMaterial({
        pattern: 'armor',
        primaryHex: 0x334155,
        secondaryHex: 0x0f172a,
        accentHex: 0xc084fc,
        roughness: 0.3,
        metalness: 0.8,
      })
    );
    const aetherGlow = registerMat(
      createDetailedPbrMaterial({
        pattern: 'crystal',
        primaryHex: 0xd8b4fe,
        secondaryHex: 0x7e22ce,
        accentHex: 0x38bdf8,
        emissiveHex: 0x9333ea,
        emissiveIntensity: 1.7,
      })
    );

    const monolith = createDetailedMesh(
      new THREE.OctahedronGeometry(1.05, 0),
      armorMat,
      0x475569,
      0xcbd5e1,
      0xe9d5ff,
      0.24
    );
    monolith.position.y = 1.65;
    monolith.scale.set(0.95, 1.45, 0.95);
    monolith.castShadow = true;
    bodyGroup.add(monolith);

    const halo = createDetailedMesh(
      new THREE.TorusGeometry(1.25, 0.1, 8, 24),
      aetherGlow,
      0x38bdf8,
      0xc084fc,
      0xffffff
    );
    halo.position.y = 1.85;
    halo.rotation.x = Math.PI / 3;
    bodyGroup.add(halo);

    leftLimb.position.set(-1.25, 1.65, 0);
    rightLimb.position.set(1.25, 1.65, 0);
    leftLimb.add(
      createDetailedMesh(
        new THREE.ConeGeometry(0.28, 1.45, 4),
        aetherGlow,
        0x7e22ce,
        0xd8b4fe,
        0xffffff
      )
    );
    rightLimb.add(
      createDetailedMesh(
        new THREE.ConeGeometry(0.28, 1.45, 4),
        aetherGlow,
        0x7e22ce,
        0xd8b4fe,
        0xffffff
      )
    );
  }

  bodyGroup.scale.setScalar(scale);

  return {
    root,
    bodyGroup,
    leftLimb,
    rightLimb,
    materialsToFlash,
  };
}

export function updateMonsterRig(
  rig: MonsterRig,
  state: HeroAnimState,
  animTime: number,
  hitFlashTimer: number
) {
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

  rig.bodyGroup.position.y = Math.sin(animTime * 2.4) * 0.08;
  rig.leftLimb.rotation.set(0, 0, 0);
  rig.rightLimb.rotation.set(0, 0, 0);

  if (state === 'walk') {
    const w = animTime * 9;
    rig.leftLimb.rotation.x = Math.sin(w) * 0.55;
    rig.rightLimb.rotation.x = -Math.sin(w) * 0.55;
  } else if (state === 'attack') {
    const t = Math.min(1, animTime / 0.38);
    const swing = Math.sin(t * Math.PI);
    rig.leftLimb.rotation.x = -1.35 * swing;
    rig.rightLimb.rotation.x = -1.35 * swing;
  }
}
