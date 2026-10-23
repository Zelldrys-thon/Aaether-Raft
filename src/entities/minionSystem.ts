import * as THREE from 'three';
import { HeroAnimState, TeamId } from '../types/game';
import {
  createDetailedMesh,
  createDetailedPbrMaterial,
} from '../rendering/proceduralTextures';

export interface MinionRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  weaponArm: THREE.Group;
  shieldArm: THREE.Group;
  materialsToFlash: THREE.MeshStandardMaterial[];
}

export function createMinionRig(team: TeamId, isRanged = false): MinionRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  const weaponArm = new THREE.Group();
  const shieldArm = new THREE.Group();
  const materialsToFlash: THREE.MeshStandardMaterial[] = [];

  const isAlly = team === 'ally';
  const registerMat = (mat: THREE.MeshStandardMaterial) => {
    mat.userData.baseEmissive = mat.emissive.getHex();
    mat.userData.baseEmissiveIntensity = mat.emissiveIntensity;
    materialsToFlash.push(mat);
    return mat;
  };

  const armorMat = registerMat(
    createDetailedPbrMaterial({
      pattern: isRanged ? 'cloth' : 'armor',
      primaryHex: isAlly ? 0x0284c7 : 0xdc2626,
      secondaryHex: isAlly ? 0x0c4a6e : 0x450a0a,
      accentHex: 0xfbbf24,
      roughness: 0.48,
      metalness: 0.42,
    })
  );

  const metalMat = registerMat(
    createDetailedPbrMaterial({
      pattern: 'armor',
      primaryHex: 0x94a3b8,
      secondaryHex: 0x334155,
      accentHex: isAlly ? 0x38bdf8 : 0xf87171,
      roughness: 0.3,
      metalness: 0.8,
    })
  );

  const glowMat = registerMat(
    createDetailedPbrMaterial({
      pattern: 'crystal',
      primaryHex: isAlly ? 0x6ee7b7 : 0xfca5a5,
      secondaryHex: isAlly ? 0x059669 : 0xb91c1c,
      accentHex: 0xffffff,
      emissiveHex: isAlly ? 0x10b981 : 0xef4444,
      emissiveIntensity: 1.25,
      roughness: 0.18,
    })
  );

  // Contact shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.75, 16),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  root.add(bodyGroup);

  // Torso with Heraldic Trim & Multi-Tone Shading
  const torso = createDetailedMesh(
    isRanged
      ? new THREE.ConeGeometry(0.48, 1.15, 7)
      : new THREE.CylinderGeometry(0.45, 0.38, 1.05, 7),
    armorMat,
    0xfde68a,
    0xcbd5e1,
    0xffffff
  );
  torso.position.y = 0.72;
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Head + Crest Helmet
  const head = createDetailedMesh(
    new THREE.SphereGeometry(0.32, 10, 10),
    metalMat,
    0x64748b,
    0xcbd5e1,
    0xffffff
  );
  head.position.y = 1.42;
  bodyGroup.add(head);

  const eyes = createDetailedMesh(
    new THREE.BoxGeometry(0.34, 0.09, 0.22),
    glowMat,
    0xfef08a,
    0xffffff,
    0xffffff
  );
  eyes.position.set(0, 1.42, 0.22);
  bodyGroup.add(eyes);

  const helmetCone = createDetailedMesh(
    new THREE.ConeGeometry(0.36, 0.48, 6),
    armorMat,
    0x94a3b8,
    0xe2e8f0,
    0xfef08a
  );
  helmetCone.position.y = 1.72;
  bodyGroup.add(helmetCone);

  // Arms
  shieldArm.position.set(-0.52, 1.0, 0);
  weaponArm.position.set(0.52, 1.0, 0);
  bodyGroup.add(shieldArm, weaponArm);

  if (!isRanged) {
    const shield = createDetailedMesh(
      new THREE.BoxGeometry(0.14, 0.72, 0.58),
      metalMat,
      0xfbbf24,
      0xcbd5e1,
      0xffffff
    );
    shield.position.set(-0.1, -0.15, 0.22);
    shieldArm.add(shield);

    const sword = createDetailedMesh(
      new THREE.BoxGeometry(0.1, 0.12, 0.95),
      metalMat,
      0x94a3b8,
      0xe2e8f0,
      0xffffff
    );
    sword.position.set(0, -0.2, 0.45);
    weaponArm.add(sword);
  } else {
    const wand = createDetailedMesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.15, 6),
      metalMat,
      0x78350f,
      0xf59e0b,
      0xfef08a
    );
    wand.position.set(0, 0.1, 0.32);
    weaponArm.add(wand);

    const orb = createDetailedMesh(
      new THREE.OctahedronGeometry(0.19, 0),
      glowMat,
      0x38bdf8,
      0xe0f2fe,
      0xffffff
    );
    orb.position.set(0, 0.72, 0.32);
    weaponArm.add(orb);
  }

  return {
    root,
    bodyGroup,
    weaponArm,
    shieldArm,
    materialsToFlash,
  };
}

export function updateMinionRig(
  rig: MinionRig,
  state: HeroAnimState,
  animTime: number,
  hitFlashTimer: number
) {
  const isFlashing = hitFlashTimer > 0;
  for (let i = 0; i < rig.materialsToFlash.length; i++) {
    const mat = rig.materialsToFlash[i];
    if (isFlashing) {
      mat.emissive.setHex(0xffffff);
      mat.emissiveIntensity = 0.85;
    } else {
      mat.emissive.setHex(mat.userData.baseEmissive ?? 0x000000);
      mat.emissiveIntensity = mat.userData.baseEmissiveIntensity ?? 0;
    }
  }

  rig.bodyGroup.position.y = 0;
  rig.weaponArm.rotation.set(0, 0, 0);
  rig.shieldArm.rotation.set(0, 0, 0);

  if (state === 'walk') {
    const w = animTime * 11;
    rig.bodyGroup.position.y = Math.abs(Math.sin(w)) * 0.11;
    rig.weaponArm.rotation.x = Math.sin(w) * 0.45;
    rig.shieldArm.rotation.x = -Math.sin(w) * 0.35;
  } else if (state === 'attack') {
    const t = Math.min(1, animTime / 0.32);
    const swing = Math.sin(t * Math.PI);
    rig.weaponArm.rotation.x = -1.45 * swing;
  }
}
