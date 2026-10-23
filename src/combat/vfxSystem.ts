import * as THREE from 'three';

export interface ActiveProjectile {
  active: boolean;
  mesh: THREE.Group;
  coreMat: THREE.MeshBasicMaterial;
  tailMat: THREE.MeshBasicMaterial;
  startX: number;
  startY: number;
  startZ: number;
  targetEntityId: string | null;
  targetX: number;
  targetZ: number;
  speed: number;
  damage: number;
  sourceTeam: 'ally' | 'enemy' | 'neutral';
  sourceEntityId: string;
  aoeRadius: number;
  slowDuration: number;
  isSkillNova: boolean;
}

interface PooledRingEffect {
  active: boolean;
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  elapsed: number;
  duration: number;
  maxScale: number;
  rotSpeed: number;
}

interface PooledSpikeGroup {
  active: boolean;
  group: THREE.Group;
  elapsed: number;
  duration: number;
}

interface PooledSlashArc {
  active: boolean;
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  elapsed: number;
  duration: number;
  startRotY: number;
  sweepAngle: number;
  maxScale: number;
}

interface PooledPillarBeam {
  active: boolean;
  group: THREE.Group;
  beamMat: THREE.MeshBasicMaterial;
  sigilMat: THREE.MeshBasicMaterial;
  meteorMesh: THREE.Mesh;
  elapsed: number;
  duration: number;
  radius: number;
}

interface PooledDashRibbon {
  active: boolean;
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  elapsed: number;
  duration: number;
}

interface PooledDomeEffect {
  active: boolean;
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  elapsed: number;
  duration: number;
  maxRadius: number;
}

interface BurstParticle {
  active: boolean;
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  vx: number;
  vy: number;
  vz: number;
  elapsed: number;
  duration: number;
}

export type IndicatorShape = 'none' | 'attack' | 'line' | 'cone' | 'aoe_target' | 'aoe_self';

function createRangeCircleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const cx = 256;
  const cy = 256;

  // Clean subtle fill near edge
  const grad = ctx.createRadialGradient(cx, cy, 190, cx, cy, 246);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
  grad.addColorStop(0.88, 'rgba(255, 255, 255, 0.14)');
  grad.addColorStop(0.98, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 246, 0, Math.PI * 2);
  ctx.fill();

  // Single clean solid outer ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 240, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createDirectionalArrowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Clean static directional arrow body
  ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.beginPath();
  ctx.moveTo(74, 496);
  ctx.lineTo(74, 128);
  ctx.lineTo(30, 128);
  ctx.lineTo(128, 16);
  ctx.lineTo(226, 128);
  ctx.lineTo(182, 128);
  ctx.lineTo(182, 496);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = 6;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createConeSectorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const cx = 256;
  const cy = 480;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, 440, -Math.PI * 0.78, -Math.PI * 0.22, false);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = 6;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTargetReticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const cx = 128;
  const cy = 128;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.beginPath();
  ctx.arc(cx, cy, 114, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, 114, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class VfxSystem {
  private group = new THREE.Group();
  private projectiles: ActiveProjectile[] = [];
  private ringPool: PooledRingEffect[] = [];
  private crystalSpikePool: PooledSpikeGroup[] = [];
  private slashArcPool: PooledSlashArc[] = [];
  private pillarPool: PooledPillarBeam[] = [];
  private dashRibbonPool: PooledDashRibbon[] = [];
  private domePool: PooledDomeEffect[] = [];
  private particlePool: BurstParticle[] = [];

  private moveMarker: THREE.Mesh;
  private moveMarkerMat: THREE.MeshBasicMaterial;
  private moveMarkerTimer = 0;

  // Real-time Tactical Ground Indicators (Basic Attack Range + Skill Directional/AoE)
  private indicatorGroup = new THREE.Group();
  private rangeCircleMesh: THREE.Mesh;
  private rangeCircleMat: THREE.MeshBasicMaterial;
  private lineArrowMesh: THREE.Mesh;
  private lineArrowMat: THREE.MeshBasicMaterial;
  private coneSectorMesh: THREE.Mesh;
  private coneSectorMat: THREE.MeshBasicMaterial;
  private targetCircleMesh: THREE.Mesh;
  private targetCircleMat: THREE.MeshBasicMaterial;
  private indicatorHoldTimer = 0;

  constructor(parentScene: THREE.Scene) {
    parentScene.add(this.group);

    // 1. Move Target Indicator Ring on Ground
    this.moveMarkerMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const markerGeo = new THREE.RingGeometry(0.45, 0.72, 24);
    markerGeo.rotateX(-Math.PI / 2);
    this.moveMarker = new THREE.Mesh(markerGeo, this.moveMarkerMat);
    this.moveMarker.position.y = 0.1;
    this.moveMarker.visible = false;
    this.group.add(this.moveMarker);

    // 2. Tactical Ground Indicator Meshes (Attack Range & Skill Aiming)
    this.group.add(this.indicatorGroup);
    this.indicatorGroup.visible = false;

    const rangeTex = createRangeCircleTexture();
    this.rangeCircleMat = new THREE.MeshBasicMaterial({
      map: rangeTex,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });
    const rangeGeo = new THREE.PlaneGeometry(2, 2);
    rangeGeo.rotateX(-Math.PI / 2);
    this.rangeCircleMesh = new THREE.Mesh(rangeGeo, this.rangeCircleMat);
    this.rangeCircleMesh.position.y = 0.25;
    this.rangeCircleMesh.renderOrder = 24;
    this.indicatorGroup.add(this.rangeCircleMesh);

    const arrowTex = createDirectionalArrowTexture();
    this.lineArrowMat = new THREE.MeshBasicMaterial({
      map: arrowTex,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });
    const arrowGeo = new THREE.PlaneGeometry(1, 1);
    arrowGeo.translate(0, 0.5, 0);
    arrowGeo.rotateX(-Math.PI / 2);
    this.lineArrowMesh = new THREE.Mesh(arrowGeo, this.lineArrowMat);
    this.lineArrowMesh.position.y = 0.28;
    this.lineArrowMesh.renderOrder = 25;
    this.indicatorGroup.add(this.lineArrowMesh);

    const coneTex = createConeSectorTexture();
    this.coneSectorMat = new THREE.MeshBasicMaterial({
      map: coneTex,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });
    const coneGeo = new THREE.PlaneGeometry(2, 1);
    coneGeo.translate(0, 0.5, 0);
    coneGeo.rotateX(-Math.PI / 2);
    this.coneSectorMesh = new THREE.Mesh(coneGeo, this.coneSectorMat);
    this.coneSectorMesh.position.y = 0.28;
    this.coneSectorMesh.renderOrder = 25;
    this.indicatorGroup.add(this.coneSectorMesh);

    const reticleTex = createTargetReticleTexture();
    this.targetCircleMat = new THREE.MeshBasicMaterial({
      map: reticleTex,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });
    const targetGeo = new THREE.PlaneGeometry(2, 2);
    targetGeo.rotateX(-Math.PI / 2);
    this.targetCircleMesh = new THREE.Mesh(targetGeo, this.targetCircleMat);
    this.targetCircleMesh.position.y = 0.3;
    this.targetCircleMesh.renderOrder = 26;
    this.indicatorGroup.add(this.targetCircleMesh);

    // 3. Pre-allocate Enhanced Comet Projectiles (36 projectiles)
    const projCoreGeo = new THREE.OctahedronGeometry(0.34, 1);
    const projTailGeo = new THREE.ConeGeometry(0.26, 1.55, 6);
    projTailGeo.rotateX(-Math.PI / 2);
    projTailGeo.translate(0, 0, -0.75);

    for (let i = 0; i < 36; i++) {
      const pGroup = new THREE.Group();
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const tailMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      });
      const coreMesh = new THREE.Mesh(projCoreGeo, coreMat);
      const tailMesh = new THREE.Mesh(projTailGeo, tailMat);
      const outerHalo = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.48, 0),
        tailMat
      );
      pGroup.add(coreMesh, tailMesh, outerHalo);
      pGroup.visible = false;
      this.group.add(pGroup);

      this.projectiles.push({
        active: false,
        mesh: pGroup,
        coreMat,
        tailMat,
        startX: 0,
        startY: 1.5,
        startZ: 0,
        targetEntityId: null,
        targetX: 0,
        targetZ: 0,
        speed: 22,
        damage: 0,
        sourceTeam: 'ally',
        sourceEntityId: '',
        aoeRadius: 0,
        slowDuration: 0,
        isSkillNova: false,
      });
    }

    // 4. Pre-allocate Shockwave / Rune Ring Pool (32 rings)
    const ringGeo = new THREE.PlaneGeometry(2, 2);
    ringGeo.rotateX(-Math.PI / 2);
    for (let i = 0; i < 32; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: reticleTex,
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.ringPool.push({
        active: false,
        mesh,
        mat,
        elapsed: 0,
        duration: 0.45,
        maxScale: 4.5,
        rotSpeed: (i % 2 === 0 ? 1 : -1) * 2.4,
      });
    }

    // 5. Pre-allocate 3D Crescent Slash Arc Pool (12 slash waves)
    const slashGeo = new THREE.RingGeometry(1.1, 2.2, 24, 1, -Math.PI * 0.42, Math.PI * 0.84);
    slashGeo.rotateX(-Math.PI / 2);
    slashGeo.rotateY(Math.PI / 2);
    for (let i = 0; i < 12; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(slashGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.slashArcPool.push({
        active: false,
        mesh,
        mat,
        elapsed: 0,
        duration: 0.36,
        startRotY: 0,
        sweepAngle: 1.6,
        maxScale: 1.5,
      });
    }

    // 6. Pre-allocate Sky Pillar / Meteor Strike Pool (8 orbital beams)
    const beamGeo = new THREE.CylinderGeometry(0.85, 1.15, 16, 16, 1, true);
    beamGeo.translate(0, 8, 0);
    const meteorGeo = new THREE.OctahedronGeometry(1.1, 0);
    for (let i = 0; i < 8; i++) {
      const grp = new THREE.Group();
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const sigilMat = new THREE.MeshBasicMaterial({
        map: reticleTex,
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      const sigilMesh = new THREE.Mesh(ringGeo, sigilMat);
      sigilMesh.position.y = 0.14;
      const meteorMesh = new THREE.Mesh(meteorGeo, beamMat);
      grp.add(beamMesh, sigilMesh, meteorMesh);
      grp.visible = false;
      this.group.add(grp);

      this.pillarPool.push({
        active: false,
        group: grp,
        beamMat,
        sigilMat,
        meteorMesh,
        elapsed: 0,
        duration: 0.72,
        radius: 4.5,
      });
    }

    // 7. Pre-allocate Dash Trail Ribbons (10 trails)
    const dashGeo = new THREE.PlaneGeometry(1.6, 1);
    dashGeo.translate(0, 0.5, 0);
    dashGeo.rotateX(-Math.PI / 2);
    for (let i = 0; i < 10; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: arrowTex,
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(dashGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.dashRibbonPool.push({
        active: false,
        mesh,
        mat,
        elapsed: 0,
        duration: 0.45,
      });
    }

    // 8. Pre-allocate Geodesic Energy Dome Pool (8 domes for heals, shields, sanctuaries)
    const domeGeo = new THREE.SphereGeometry(1, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    for (let i = 0; i < 8; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(domeGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.domePool.push({
        active: false,
        mesh,
        mat,
        elapsed: 0,
        duration: 0.65,
        maxRadius: 4.5,
      });
    }

    // 9. Pre-allocate Crystal Quake Spike Groups (6 groups of 10 spikes)
    const spikeGeo = new THREE.ConeGeometry(0.36, 2.4, 5);
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x0284c7,
      emissiveIntensity: 1.8,
      roughness: 0.14,
    });
    for (let i = 0; i < 6; i++) {
      const grp = new THREE.Group();
      for (let s = 0; s < 10; s++) {
        const ang = (s / 10) * Math.PI * 2;
        const dist = s % 2 === 0 ? 3.2 : 2.1;
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        spike.position.set(Math.cos(ang) * dist, 1.0, Math.sin(ang) * dist);
        spike.rotation.z = -Math.cos(ang) * 0.38;
        spike.rotation.x = Math.sin(ang) * 0.38;
        grp.add(spike);
      }
      grp.visible = false;
      this.group.add(grp);
      this.crystalSpikePool.push({
        active: false,
        group: grp,
        elapsed: 0,
        duration: 0.72,
      });
    }

    // 10. Pre-allocate 3D Burst Shards / Sparks Pool (90 particles)
    const partGeo = new THREE.OctahedronGeometry(0.18, 0);
    for (let i = 0; i < 90; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(partGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.particlePool.push({
        active: false,
        mesh,
        mat,
        vx: 0,
        vy: 0,
        vz: 0,
        elapsed: 0,
        duration: 0.5,
      });
    }
  }

  /**
   * Displays the live 3D Range & Directional/AoE Indicator around the player hero.
   */
  public showTacticalIndicator(opts: {
    shape: IndicatorShape;
    originX: number;
    originZ: number;
    aimX: number;
    aimZ: number;
    range: number;
    aoeRadius: number;
    colorHex: number;
    holdSeconds?: number;
  }) {
    if (opts.shape === 'none') {
      this.indicatorGroup.visible = false;
      return;
    }

    this.indicatorGroup.visible = true;
    this.indicatorHoldTimer = opts.holdSeconds ?? 0.12;

    const dx = opts.aimX - opts.originX;
    const dz = opts.aimZ - opts.originZ;
    const dist = Math.hypot(dx, dz) || 0.001;
    const angle = Math.atan2(dx, dz);

    // Outer Range Circle centered on player (Static, no animation)
    this.rangeCircleMesh.position.set(opts.originX, 0.25, opts.originZ);
    this.rangeCircleMesh.rotation.z = 0;
    this.rangeCircleMesh.scale.setScalar(Math.max(1.5, opts.range));
    this.rangeCircleMat.color.setHex(opts.colorHex);
    this.rangeCircleMat.opacity = 0.85;
    this.rangeCircleMesh.visible = true;

    this.lineArrowMesh.visible = false;
    this.coneSectorMesh.visible = false;
    this.targetCircleMesh.visible = false;

    const clampedDist = Math.min(opts.range, dist);
    const tx = opts.originX + (dx / dist) * clampedDist;
    const tz = opts.originZ + (dz / dist) * clampedDist;

    if (opts.shape === 'attack') {
      // Basic Attack: only the outer attack range circle is shown
    } else if (opts.shape === 'line') {
      this.lineArrowMesh.position.set(opts.originX, 0.28, opts.originZ);
      this.lineArrowMesh.rotation.y = angle + Math.PI;
      this.lineArrowMesh.scale.set(Math.max(2.0, opts.aoeRadius * 0.7), 1, opts.range);
      this.lineArrowMat.color.setHex(opts.colorHex);
      this.lineArrowMesh.visible = true;
    } else if (opts.shape === 'cone') {
      this.coneSectorMesh.position.set(opts.originX, 0.28, opts.originZ);
      this.coneSectorMesh.rotation.y = angle + Math.PI;
      this.coneSectorMesh.scale.set(opts.range * 1.25, 1, opts.range);
      this.coneSectorMat.color.setHex(opts.colorHex);
      this.coneSectorMesh.visible = true;
    } else if (opts.shape === 'aoe_target') {
      this.targetCircleMesh.position.set(tx, 0.3, tz);
      this.targetCircleMesh.rotation.z = 0;
      this.targetCircleMesh.scale.setScalar(Math.max(2.0, opts.aoeRadius));
      this.targetCircleMat.color.setHex(opts.colorHex);
      this.targetCircleMesh.visible = true;
    } else if (opts.shape === 'aoe_self') {
      this.rangeCircleMesh.scale.setScalar(Math.max(2.2, opts.aoeRadius));
    }
  }

  public showMoveIndicator(x: number, z: number, colorHex = 0x34d399) {
    this.moveMarker.position.set(x, 0.12, z);
    this.moveMarkerMat.color.setHex(colorHex);
    this.moveMarker.visible = true;
    this.moveMarkerTimer = 0.55;
  }

  public spawnShockwave(x: number, z: number, colorHex: number, maxRadius: number, duration = 0.45) {
    const slot = this.ringPool.find((r) => !r.active);
    if (!slot) return;
    slot.active = true;
    slot.elapsed = 0;
    slot.duration = duration;
    slot.maxScale = maxRadius;
    slot.mat.color.setHex(colorHex);
    slot.mat.opacity = 0.95;
    slot.mesh.position.set(x, 0.16, z);
    slot.mesh.scale.setScalar(0.3);
    slot.mesh.visible = true;
  }

  public spawnSlashArc(
    x: number,
    z: number,
    facingAngle: number,
    colorHex: number,
    maxScale = 2.2,
    duration = 0.36
  ) {
    const slot = this.slashArcPool.find((s) => !s.active);
    if (!slot) return;
    slot.active = true;
    slot.elapsed = 0;
    slot.duration = duration;
    slot.startRotY = facingAngle - 0.85;
    slot.sweepAngle = 1.7;
    slot.maxScale = maxScale;
    slot.mat.color.setHex(colorHex);
    slot.mat.opacity = 0.95;
    slot.mesh.position.set(x, 1.25, z);
    slot.mesh.rotation.y = slot.startRotY;
    slot.mesh.scale.setScalar(0.5);
    slot.mesh.visible = true;
  }

  public spawnPillarStrike(
    x: number,
    z: number,
    colorHex: number,
    radius: number,
    duration = 0.72
  ) {
    const slot = this.pillarPool.find((p) => !p.active);
    if (!slot) return;
    slot.active = true;
    slot.elapsed = 0;
    slot.duration = duration;
    slot.radius = radius;
    slot.beamMat.color.setHex(colorHex);
    slot.sigilMat.color.setHex(colorHex);
    slot.beamMat.opacity = 0.9;
    slot.sigilMat.opacity = 0.95;
    slot.group.position.set(x, 0, z);
    slot.meteorMesh.position.set(0, 12, 0);
    slot.group.visible = true;
    this.spawnBurstParticles(x, 0.6, z, colorHex, 16, 9.5);
  }

  public spawnDashTrail(
    startX: number,
    startZ: number,
    endX: number,
    endZ: number,
    colorHex: number,
    width = 2.2
  ) {
    const slot = this.dashRibbonPool.find((d) => !d.active);
    if (!slot) return;
    const dx = endX - startX;
    const dz = endZ - startZ;
    const len = Math.max(1, Math.hypot(dx, dz));
    const angle = Math.atan2(dx, dz);

    slot.active = true;
    slot.elapsed = 0;
    slot.duration = 0.45;
    slot.mat.color.setHex(colorHex);
    slot.mat.opacity = 0.9;
    slot.mesh.position.set(startX, 0.18, startZ);
    slot.mesh.rotation.y = angle + Math.PI;
    slot.mesh.scale.set(width, 1, len);
    slot.mesh.visible = true;
  }

  public spawnSanctuaryDome(
    x: number,
    z: number,
    colorHex: number,
    maxRadius: number,
    duration = 0.7
  ) {
    const slot = this.domePool.find((d) => !d.active);
    if (!slot) return;
    slot.active = true;
    slot.elapsed = 0;
    slot.duration = duration;
    slot.maxRadius = maxRadius;
    slot.mat.color.setHex(colorHex);
    slot.mat.opacity = 0.85;
    slot.mesh.position.set(x, 0.05, z);
    slot.mesh.scale.setScalar(0.4);
    slot.mesh.visible = true;
    this.spawnBurstParticles(x, 1.0, z, colorHex, 14, 7.5);
  }

  public spawnCrystalSpikes(x: number, z: number) {
    const slot = this.crystalSpikePool.find((c) => !c.active);
    if (!slot) return;
    slot.active = true;
    slot.elapsed = 0;
    slot.duration = 0.72;
    slot.group.position.set(x, 0, z);
    slot.group.scale.set(1, 0.1, 1);
    slot.group.visible = true;
    this.spawnBurstParticles(x, 0.8, z, 0x38bdf8, 14, 8.5);
  }

  public spawnBurstParticles(
    x: number,
    y: number,
    z: number,
    colorHex: number,
    count = 12,
    speed = 7.5
  ) {
    let spawned = 0;
    for (let i = 0; i < this.particlePool.length && spawned < count; i++) {
      const p = this.particlePool[i];
      if (p.active) continue;
      p.active = true;
      p.elapsed = 0;
      p.duration = 0.38 + Math.random() * 0.25;
      const angle = (spawned / count) * Math.PI * 2 + Math.random() * 0.4;
      const spd = speed * (0.55 + Math.random() * 0.65);
      p.vx = Math.cos(angle) * spd;
      p.vy = 2.8 + Math.random() * 5.2;
      p.vz = Math.sin(angle) * spd;
      p.mat.color.setHex(colorHex);
      p.mat.opacity = 1.0;
      p.mesh.position.set(x, y, z);
      p.mesh.scale.setScalar(0.8 + Math.random() * 0.7);
      p.mesh.visible = true;
      spawned++;
    }
  }

  public spawnProjectile(opts: {
    startX: number;
    startY: number;
    startZ: number;
    targetEntityId: string | null;
    targetX: number;
    targetZ: number;
    speed: number;
    damage: number;
    colorHex: number;
    scale?: number;
    sourceTeam: 'ally' | 'enemy' | 'neutral';
    sourceEntityId: string;
    aoeRadius?: number;
    slowDuration?: number;
    isSkillNova?: boolean;
  }) {
    const slot = this.projectiles.find((p) => !p.active);
    if (!slot) return;
    slot.active = true;
    slot.startX = opts.startX;
    slot.startY = opts.startY;
    slot.startZ = opts.startZ;
    slot.targetEntityId = opts.targetEntityId;
    slot.targetX = opts.targetX;
    slot.targetZ = opts.targetZ;
    slot.speed = opts.speed;
    slot.damage = opts.damage;
    slot.sourceTeam = opts.sourceTeam;
    slot.sourceEntityId = opts.sourceEntityId;
    slot.aoeRadius = opts.aoeRadius ?? 0;
    slot.slowDuration = opts.slowDuration ?? 0;
    slot.isSkillNova = opts.isSkillNova ?? false;

    slot.mesh.position.set(opts.startX, opts.startY, opts.startZ);
    const dx = opts.targetX - opts.startX;
    const dz = opts.targetZ - opts.startZ;
    slot.mesh.rotation.set(0, Math.atan2(dx, dz), 0);
    slot.mesh.scale.setScalar(opts.scale ?? 1.0);
    slot.coreMat.color.setHex(0xffffff);
    slot.tailMat.color.setHex(opts.colorHex);
    slot.mesh.visible = true;
  }

  public getActiveProjectiles(): ActiveProjectile[] {
    return this.projectiles;
  }

  public updateVisuals(dt: number) {
    // 1. Tactical Range & Directional Indicator (Static, no rotation animation)
    if (this.indicatorGroup.visible) {
      this.indicatorHoldTimer -= dt;
      if (this.indicatorHoldTimer <= 0) {
        this.indicatorGroup.visible = false;
      }
    }

    // 2. Move indicator animation
    if (this.moveMarkerTimer > 0) {
      this.moveMarkerTimer -= dt;
      const t = 1 - Math.max(0, this.moveMarkerTimer / 0.55);
      this.moveMarker.scale.setScalar(0.5 + t * 1.15);
      this.moveMarkerMat.opacity = (1 - t) * 0.9;
      if (this.moveMarkerTimer <= 0) {
        this.moveMarker.visible = false;
      }
    }

    // 3. Shockwave / Rune Ring effects
    for (let i = 0; i < this.ringPool.length; i++) {
      const r = this.ringPool[i];
      if (!r.active) continue;
      r.elapsed += dt;
      const progress = Math.min(1, r.elapsed / r.duration);
      const scale = THREE.MathUtils.lerp(0.35, r.maxScale, 1 - Math.pow(1 - progress, 2));
      r.mesh.scale.setScalar(scale);
      r.mesh.rotation.z += dt * r.rotSpeed;
      r.mat.opacity = (1 - progress) * 0.92;
      if (progress >= 1) {
        r.active = false;
        r.mesh.visible = false;
      }
    }

    // 4. Sweeping Crescent Slash Arcs
    for (let i = 0; i < this.slashArcPool.length; i++) {
      const s = this.slashArcPool[i];
      if (!s.active) continue;
      s.elapsed += dt;
      const p = Math.min(1, s.elapsed / s.duration);
      const ease = 1 - Math.pow(1 - p, 3);
      s.mesh.rotation.y = s.startRotY + ease * s.sweepAngle;
      s.mesh.scale.setScalar(THREE.MathUtils.lerp(0.55, s.maxScale, ease));
      s.mat.opacity = (1 - p) * 0.95;
      if (p >= 1) {
        s.active = false;
        s.mesh.visible = false;
      }
    }

    // 5. Sky Pillar / Meteor Strikes
    for (let i = 0; i < this.pillarPool.length; i++) {
      const pl = this.pillarPool[i];
      if (!pl.active) continue;
      pl.elapsed += dt;
      const p = Math.min(1, pl.elapsed / pl.duration);
      const beamMesh = pl.group.children[0] as THREE.Mesh;
      const sigilMesh = pl.group.children[1] as THREE.Mesh;

      const rScale = pl.radius * (0.4 + 0.6 * Math.sin(p * Math.PI));
      beamMesh.scale.set(rScale * 0.42, 1, rScale * 0.42);
      sigilMesh.scale.setScalar(pl.radius * (0.5 + 0.5 * p));
      sigilMesh.rotation.z += dt * 3.2;

      pl.meteorMesh.position.y = Math.max(0.5, (1 - Math.min(1, p * 2.2)) * 13);
      pl.meteorMesh.rotation.y += dt * 8;
      pl.meteorMesh.rotation.x += dt * 6;

      pl.beamMat.opacity = (1 - p) * 0.85;
      pl.sigilMat.opacity = (1 - p) * 0.95;
      if (p >= 1) {
        pl.active = false;
        pl.group.visible = false;
      }
    }

    // 6. Dash Trail Ribbons
    for (let i = 0; i < this.dashRibbonPool.length; i++) {
      const d = this.dashRibbonPool[i];
      if (!d.active) continue;
      d.elapsed += dt;
      const p = Math.min(1, d.elapsed / d.duration);
      d.mat.opacity = (1 - p) * 0.88;
      if (p >= 1) {
        d.active = false;
        d.mesh.visible = false;
      }
    }

    // 7. Geodesic Sanctuary Domes
    for (let i = 0; i < this.domePool.length; i++) {
      const dm = this.domePool[i];
      if (!dm.active) continue;
      dm.elapsed += dt;
      const p = Math.min(1, dm.elapsed / dm.duration);
      const ease = 1 - Math.pow(1 - p, 2);
      dm.mesh.scale.setScalar(THREE.MathUtils.lerp(0.5, dm.maxRadius, ease));
      dm.mesh.rotation.y += dt * 2.2;
      dm.mat.opacity = (1 - p) * 0.85;
      if (p >= 1) {
        dm.active = false;
        dm.mesh.visible = false;
      }
    }

    // 8. Crystal spikes
    for (let i = 0; i < this.crystalSpikePool.length; i++) {
      const c = this.crystalSpikePool[i];
      if (!c.active) continue;
      c.elapsed += dt;
      const progress = Math.min(1, c.elapsed / c.duration);
      const yScale = progress < 0.25 ? progress * 4 : Math.max(0, 1 - (progress - 0.25) / 0.75);
      c.group.scale.set(1, yScale, 1);
      if (progress >= 1) {
        c.active = false;
        c.group.visible = false;
      }
    }

    // 9. 3D Burst Particles
    for (let i = 0; i < this.particlePool.length; i++) {
      const pt = this.particlePool[i];
      if (!pt.active) continue;
      pt.elapsed += dt;
      const p = Math.min(1, pt.elapsed / pt.duration);
      pt.vy -= 14.5 * dt; // Gravity
      pt.mesh.position.x += pt.vx * dt;
      pt.mesh.position.y = Math.max(0.1, pt.mesh.position.y + pt.vy * dt);
      pt.mesh.position.z += pt.vz * dt;
      pt.mesh.rotation.x += dt * 9;
      pt.mesh.rotation.y += dt * 7;
      pt.mat.opacity = 1 - p;
      if (p >= 1) {
        pt.active = false;
        pt.mesh.visible = false;
      }
    }
  }

  public clearAll() {
    this.moveMarker.visible = false;
    this.moveMarkerTimer = 0;
    this.indicatorGroup.visible = false;
    this.indicatorHoldTimer = 0;
    this.projectiles.forEach((p) => {
      p.active = false;
      p.mesh.visible = false;
    });
    this.ringPool.forEach((r) => {
      r.active = false;
      r.mesh.visible = false;
    });
    this.slashArcPool.forEach((s) => {
      s.active = false;
      s.mesh.visible = false;
    });
    this.pillarPool.forEach((pl) => {
      pl.active = false;
      pl.group.visible = false;
    });
    this.dashRibbonPool.forEach((d) => {
      d.active = false;
      d.mesh.visible = false;
    });
    this.domePool.forEach((dm) => {
      dm.active = false;
      dm.mesh.visible = false;
    });
    this.crystalSpikePool.forEach((c) => {
      c.active = false;
      c.group.visible = false;
    });
    this.particlePool.forEach((pt) => {
      pt.active = false;
      pt.mesh.visible = false;
    });
  }
}
