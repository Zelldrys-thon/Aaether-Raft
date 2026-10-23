import * as THREE from 'three';
import { TeamId } from '../types/game';
import {
  createDetailedMesh,
  createDetailedPbrMaterial,
} from '../rendering/proceduralTextures';

export interface StructureRig {
  root: THREE.Group;
  crystalMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  rangeCircle: THREE.Mesh;
  materialsToFlash: THREE.MeshStandardMaterial[];
}

export function createTowerRig(team: TeamId): StructureRig {
  const root = new THREE.Group();
  const isAlly = team === 'ally';
  const materialsToFlash: THREE.MeshStandardMaterial[] = [];

  const registerMat = (mat: THREE.MeshStandardMaterial) => {
    mat.userData.baseEmissive = mat.emissive.getHex();
    mat.userData.baseEmissiveIntensity = mat.emissiveIntensity;
    materialsToFlash.push(mat);
    return mat;
  };

  const stoneMat = registerMat(
    createDetailedPbrMaterial({
      pattern: 'stone',
      primaryHex: isAlly ? 0x475569 : 0x4c1d24,
      secondaryHex: isAlly ? 0x1e293b : 0x1f0a0d,
      accentHex: isAlly ? 0x10b981 : 0xef4444,
      roughness: 0.74,
      metalness: 0.24,
    })
  );

  const trimMat = registerMat(
    createDetailedPbrMaterial({
      pattern: 'armor',
      primaryHex: isAlly ? 0x0d9488 : 0xb91c1c,
      secondaryHex: isAlly ? 0x115e59 : 0x450a0a,
      accentHex: isAlly ? 0xfbbf24 : 0xfca5a5,
      roughness: 0.3,
      metalness: 0.78,
    })
  );

  const crystalMat = registerMat(
    createDetailedPbrMaterial({
      pattern: 'crystal',
      primaryHex: isAlly ? 0x6ee7b7 : 0xfca5a5,
      secondaryHex: isAlly ? 0x059669 : 0xdc2626,
      accentHex: 0xffffff,
      emissiveHex: isAlly ? 0x059669 : 0xdc2626,
      emissiveIntensity: 1.65,
      roughness: 0.14,
      metalness: 0.35,
    })
  );

  const rangeCircle = new THREE.Mesh(
    new THREE.RingGeometry(13.2, 13.5, 48),
    new THREE.MeshBasicMaterial({
      color: isAlly ? 0x10b981 : 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  rangeCircle.rotation.x = -Math.PI / 2;
  rangeCircle.position.y = 0.06;
  root.add(rangeCircle);

  // Stepped octagonal foundation with multi-tone vertex gradient
  const baseStep = createDetailedMesh(
    new THREE.CylinderGeometry(1.75, 2.15, 0.9, 8),
    stoneMat,
    0x64748b,
    0x94a3b8,
    0xe2e8f0
  );
  baseStep.position.y = 0.45;
  baseStep.castShadow = true;
  baseStep.receiveShadow = true;
  root.add(baseStep);

  // Main obelisk pillar
  const pillar = createDetailedMesh(
    new THREE.CylinderGeometry(1.05, 1.48, 3.6, 8),
    stoneMat,
    0x64748b,
    0xcbd5e1,
    0xffffff
  );
  pillar.position.y = 2.55;
  pillar.castShadow = true;
  root.add(pillar);

  // 4 Buttress fins around tower
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const fin = createDetailedMesh(
      new THREE.BoxGeometry(0.42, 2.6, 0.85),
      trimMat,
      0x94a3b8,
      0xe2e8f0,
      0xfef08a
    );
    fin.position.set(Math.cos(angle) * 1.2, 1.8, Math.sin(angle) * 1.2);
    fin.rotation.y = -angle;
    root.add(fin);
  }

  // Crown cradle
  const crown = createDetailedMesh(
    new THREE.CylinderGeometry(1.45, 0.95, 0.65, 8),
    trimMat,
    0x94a3b8,
    0xe2e8f0,
    0xfef08a
  );
  crown.position.y = 4.55;
  root.add(crown);

  // Floating Arcane Turret Crystal
  const crystalMesh = createDetailedMesh(
    new THREE.OctahedronGeometry(0.88, 0),
    crystalMat,
    isAlly ? 0x10b981 : 0xef4444,
    isAlly ? 0x6ee7b7 : 0xfca5a5,
    0xffffff,
    0.22
  );
  crystalMesh.position.y = 6.0;
  crystalMesh.scale.set(0.85, 1.45, 0.85);
  crystalMesh.castShadow = true;
  root.add(crystalMesh);

  // Orbiting Halo Ring
  const ringMesh = createDetailedMesh(
    new THREE.TorusGeometry(1.25, 0.09, 8, 24),
    trimMat,
    0xfde68a,
    0xfbbf24,
    0xffffff
  );
  ringMesh.position.y = 6.0;
  ringMesh.rotation.x = Math.PI / 3;
  root.add(ringMesh);

  return {
    root,
    crystalMesh,
    ringMesh,
    rangeCircle,
    materialsToFlash,
  };
}

export function createBaseCoreRig(team: TeamId): StructureRig {
  const root = new THREE.Group();
  const isAlly = team === 'ally';
  const materialsToFlash: THREE.MeshStandardMaterial[] = [];

  const registerMat = (mat: THREE.MeshStandardMaterial) => {
    mat.userData.baseEmissive = mat.emissive.getHex();
    mat.userData.baseEmissiveIntensity = mat.emissiveIntensity;
    materialsToFlash.push(mat);
    return mat;
  };

  const stoneMat = registerMat(
    createDetailedPbrMaterial({
      pattern: 'stone',
      primaryHex: isAlly ? 0x334155 : 0x451a24,
      secondaryHex: isAlly ? 0x0f172a : 0x19080c,
      accentHex: isAlly ? 0x38bdf8 : 0xf43f5e,
      roughness: 0.7,
      metalness: 0.3,
    })
  );

  const goldMat = registerMat(
    createDetailedPbrMaterial({
      pattern: 'armor',
      primaryHex: isAlly ? 0xf59e0b : 0xdc2626,
      secondaryHex: isAlly ? 0x78350f : 0x450a0a,
      accentHex: 0xfef08a,
      roughness: 0.24,
      metalness: 0.86,
    })
  );

  const coreMat = registerMat(
    createDetailedPbrMaterial({
      pattern: 'crystal',
      primaryHex: isAlly ? 0x7dd3fc : 0xfda4af,
      secondaryHex: isAlly ? 0x0284c7 : 0xe11d48,
      accentHex: 0xffffff,
      emissiveHex: isAlly ? 0x0284c7 : 0xe11d48,
      emissiveIntensity: 1.8,
      roughness: 0.12,
      metalness: 0.4,
    })
  );

  const rangeCircle = new THREE.Mesh(
    new THREE.RingGeometry(15.5, 15.9, 48),
    new THREE.MeshBasicMaterial({
      color: isAlly ? 0x38bdf8 : 0xf43f5e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28,
    })
  );
  rangeCircle.rotation.x = -Math.PI / 2;
  rangeCircle.position.y = 0.08;
  root.add(rangeCircle);

  // Ancient Shrine Base
  const plinth = createDetailedMesh(
    new THREE.CylinderGeometry(3.4, 4.2, 1.3, 12),
    stoneMat,
    0x64748b,
    0x94a3b8,
    0xe2e8f0
  );
  plinth.position.y = 0.65;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  root.add(plinth);

  const tier2 = createDetailedMesh(
    new THREE.CylinderGeometry(2.3, 3.0, 1.5, 8),
    stoneMat,
    0x94a3b8,
    0xcbd5e1,
    0xffffff
  );
  tier2.position.y = 2.0;
  tier2.castShadow = true;
  root.add(tier2);

  // 4 Guardian Pylons around the Ancient Core
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const pylon = createDetailedMesh(
      new THREE.BoxGeometry(0.65, 3.8, 0.65),
      goldMat,
      0x92400e,
      0xfbbf24,
      0xffffff
    );
    pylon.position.set(Math.cos(angle) * 2.85, 2.2, Math.sin(angle) * 2.85);
    pylon.rotation.y = -angle;
    pylon.rotation.z = 0.18;
    pylon.castShadow = true;
    root.add(pylon);
  }

  // Giant Floating Ancient Nexus Crystal
  const crystalMesh = createDetailedMesh(
    new THREE.OctahedronGeometry(1.55, 0),
    coreMat,
    isAlly ? 0x0284c7 : 0xe11d48,
    isAlly ? 0x7dd3fc : 0xfda4af,
    0xffffff,
    0.24
  );
  crystalMesh.position.y = 5.2;
  crystalMesh.scale.set(1, 1.55, 1);
  crystalMesh.castShadow = true;
  root.add(crystalMesh);

  const ringMesh = createDetailedMesh(
    new THREE.TorusGeometry(2.35, 0.12, 8, 32),
    goldMat,
    0xfde68a,
    0xfbbf24,
    0xffffff
  );
  ringMesh.position.y = 5.2;
  ringMesh.rotation.x = Math.PI / 4;
  root.add(ringMesh);

  return {
    root,
    crystalMesh,
    ringMesh,
    rangeCircle,
    materialsToFlash,
  };
}

export function updateStructureRig(
  rig: StructureRig,
  elapsed: number,
  hitFlashTimer: number,
  baseY: number
) {
  rig.crystalMesh.position.y = baseY + Math.sin(elapsed * 2.2) * 0.28;
  rig.crystalMesh.rotation.y = elapsed * 1.1;
  rig.ringMesh.rotation.y = -elapsed * 1.5;
  rig.ringMesh.rotation.z = Math.sin(elapsed * 1.2) * 0.35;

  const isFlashing = hitFlashTimer > 0;
  for (let i = 0; i < rig.materialsToFlash.length; i++) {
    const mat = rig.materialsToFlash[i];
    if (isFlashing) {
      mat.emissive.setHex(0xffffff);
      mat.emissiveIntensity = 0.95;
    } else {
      mat.emissive.setHex(mat.userData.baseEmissive ?? 0x000000);
      mat.emissiveIntensity = mat.userData.baseEmissiveIntensity ?? 0;
    }
  }
}
