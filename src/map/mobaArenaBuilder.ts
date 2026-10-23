import * as THREE from 'three';
import {
  ALLY_BASE_POS,
  ENEMY_BASE_POS,
  getLaneCurve,
  isPointNearLaneOrStructure,
  JUNGLE_CAMPS,
  MAP_HALF_SIZE,
  RIVER_CONTROL_POINTS,
} from './laneConfig';
import { LaneId } from '../types/game';
import {
  applyRichVertexColors,
  createDetailedMesh,
  createDetailedPbrMaterial,
} from '../rendering/proceduralTextures';

export interface LobbyStageObjects {
  group: THREE.Group;
  centralCrystal: THREE.Mesh;
  floatingRings: THREE.Mesh[];
  pedestalGroup: THREE.Group;
  particles: THREE.Points;
}

export interface ArenaMapObjects {
  group: THREE.Group;
  groundPlane: THREE.Mesh;
  riverMesh: THREE.Mesh;
  ambientParticles: THREE.Points;
  update: (dt: number, elapsed: number) => void;
}

function createDetailedBiomeGroundTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep nocturnal rainforest soil & dark wet moss base ("suasana gelap, hutan rimba")
  const baseGrad = ctx.createLinearGradient(0, 0, 512, 512);
  baseGrad.addColorStop(0, '#07140d');
  baseGrad.addColorStop(0.5, '#0b1e14');
  baseGrad.addColorStop(1, '#05100a');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Damp jungle humus, dark fern clearings, and wet mud patches
  for (let i = 0; i < 180; i++) {
    const x = (i * 73) % 512;
    const y = (i * 113) % 512;
    const r = 18 + (i % 42);
    const grad = ctx.createRadialGradient(x, y, 2, x, y, r);
    if (i % 4 === 0) {
      grad.addColorStop(0, 'rgba(16, 56, 36, 0.58)');
      grad.addColorStop(1, 'rgba(16, 56, 36, 0)');
    } else if (i % 5 === 0) {
      // Wet rainwater seep in the grass
      grad.addColorStop(0, 'rgba(14, 116, 144, 0.32)');
      grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.25)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    } else if (i % 7 === 0) {
      grad.addColorStop(0, 'rgba(30, 41, 59, 0.42)');
      grad.addColorStop(1, 'rgba(30, 41, 59, 0)');
    } else {
      grad.addColorStop(0, 'rgba(4, 12, 8, 0.65)');
      grad.addColorStop(1, 'rgba(4, 12, 8, 0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Painted shallow rainwater puddles nestled in the grass ("genangan air dirumput")
  for (let i = 0; i < 28; i++) {
    const px = 28 + ((i * 89) % 456);
    const py = 28 + ((i * 137) % 456);
    const rx = 14 + (i % 18);
    const ry = 9 + ((i * 5) % 13);
    const rot = ((i * 31) % 314) / 100;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);

    // Dark wet mud rim
    ctx.fillStyle = 'rgba(6, 18, 14, 0.78)';
    ctx.beginPath();
    ctx.ellipse(0, 0, rx + 4, ry + 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Moonlit water surface
    const pGrad = ctx.createRadialGradient(-rx * 0.2, -ry * 0.2, 2, 0, 0, rx);
    pGrad.addColorStop(0, 'rgba(125, 211, 252, 0.55)');
    pGrad.addColorStop(0.55, 'rgba(14, 116, 144, 0.62)');
    pGrad.addColorStop(1, 'rgba(8, 47, 73, 0.75)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle water ripple ring
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.42)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.62, ry * 0.62, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Dense rainforest grass blade tufts & nocturnal bioluminescent spores
  for (let i = 0; i < 460; i++) {
    const x = (i * 59) % 512;
    const y = (i * 89) % 512;
    ctx.strokeStyle =
      i % 3 === 0 ? 'rgba(34, 197, 94, 0.34)' : 'rgba(6, 78, 59, 0.62)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 3.5, y - 8);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 3.5, y - 7);
    ctx.stroke();

    if (i % 16 === 0) {
      ctx.fillStyle = i % 32 === 0 ? 'rgba(52, 211, 153, 0.72)' : 'rgba(56, 189, 248, 0.68)';
      ctx.beginPath();
      ctx.arc(x, y - 4, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function createGrassPuddleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 256);

  const cx = 128;
  const cy = 128;

  // Organic puddle silhouette using layered radial gradient
  const grad = ctx.createRadialGradient(cx - 18, cy - 16, 8, cx, cy, 118);
  grad.addColorStop(0, 'rgba(186, 230, 253, 0.78)');
  grad.addColorStop(0.32, 'rgba(56, 189, 248, 0.62)');
  grad.addColorStop(0.68, 'rgba(14, 116, 144, 0.58)');
  grad.addColorStop(0.88, 'rgba(6, 38, 32, 0.45)');
  grad.addColorStop(1, 'rgba(4, 18, 12, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 2; a += 0.15) {
    const r =
      104 +
      Math.sin(a * 3) * 10 +
      Math.cos(a * 5) * 6 +
      Math.sin(a * 2 + 1.2) * 7;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (a === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Concentric raindrop ripples inside the puddle
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.48)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx - 16, cy - 10, 32, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(125, 211, 252, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx + 22, cy + 18, 24, 0, Math.PI * 2);
  ctx.stroke();

  // Grass blades & lily/moss specks around puddle rim
  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 2;
    const rad = 88 + (i % 5) * 4;
    const gx = cx + Math.cos(ang) * rad;
    const gy = cy + Math.sin(ang) * rad;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + Math.cos(ang) * 9, gy - 8);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates a weathered, crumbling stone lane texture with alpha-blended edges,
 * broken border flagstones, and moss encroachment so roads transition organically
 * into the jungle grass ("transisi antar jalan agar tidak kaku dengan rumput, seperti jalan yang rusak dipinggir").
 */
function createDetailedLaneCobbleTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Start fully transparent so outer road shoulders fade organically into the grass
  ctx.clearRect(0, 0, 256, 512);

  // 1. Irregular weathered dirt & moss roadbed underlayer with wavy edges
  for (let y = 0; y < 512; y += 6) {
    const waveL = 32 + Math.sin(y * 0.045) * 14 + Math.cos(y * 0.11) * 8;
    const waveR = 224 + Math.cos(y * 0.05) * 14 + Math.sin(y * 0.09) * 8;
    const rowGrad = ctx.createLinearGradient(waveL - 16, 0, waveR + 16, 0);
    rowGrad.addColorStop(0, 'rgba(7, 20, 13, 0)');
    rowGrad.addColorStop(0.12, 'rgba(15, 34, 24, 0.72)');
    rowGrad.addColorStop(0.24, 'rgba(41, 37, 36, 0.94)');
    rowGrad.addColorStop(0.5, 'rgba(71, 85, 105, 0.98)');
    rowGrad.addColorStop(0.76, 'rgba(41, 37, 36, 0.94)');
    rowGrad.addColorStop(0.88, 'rgba(15, 34, 24, 0.72)');
    rowGrad.addColorStop(1, 'rgba(7, 20, 13, 0)');
    ctx.fillStyle = rowGrad;
    ctx.fillRect(0, y, 256, 7);
  }

  // 2. Interlocking ancient flagstones with broken/missing edge stones ("jalan yang rusak dipinggir")
  const rows = 16;
  const rowH = 512 / rows;
  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    const cols = 5;
    const offset = (r % 2) * 16;
    for (let c = 0; c < cols; c++) {
      const isEdge = c === 0 || c === cols - 1;
      const hash = (r * 19 + c * 31) % 17;

      // Skip some outer edge stones so grass & mud show through the broken road border
      if (isEdge && hash < 5) continue;

      const jitterX = ((hash % 7) - 3) * (isEdge ? 3.2 : 1.2);
      const jitterY = ((hash % 5) - 2) * 1.1;
      const x = 38 + c * 36 + (offset % 14) - 6 + jitterX;
      const w = (isEdge ? 26 + (hash % 10) : 33) - (hash % 4);
      const h = rowH - 5 - (isEdge ? hash % 6 : 0);

      const shade = 68 + ((r * 11 + c * 17) % 38);
      ctx.save();
      ctx.translate(x + w * 0.5, y + h * 0.5 + 2 + jitterY);
      ctx.rotate(((hash % 9) - 4) * (isEdge ? 0.045 : 0.012));

      // Warm mossy stone vs cool slate variation
      if (hash % 4 === 0) {
        ctx.fillStyle = `rgba(${shade - 6}, ${shade + 8}, ${shade - 4}, ${isEdge ? 0.88 : 0.96})`;
      } else {
        ctx.fillStyle = `rgba(${shade}, ${shade + 7}, ${shade + 16}, ${isEdge ? 0.88 : 0.96})`;
      }
      ctx.strokeStyle = 'rgba(10, 18, 15, 0.78)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-w * 0.5, -h * 0.5, w, h, isEdge ? 6 : 4);
      ctx.fill();
      ctx.stroke();

      // Cracks inside weathered flagstones
      if (hash % 3 === 0) {
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-w * 0.25, -h * 0.3);
        ctx.lineTo(w * 0.05, 0);
        ctx.lineTo(w * 0.28, h * 0.22);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 3. Scattered broken rubble stones & mossy grass patches along both road borders
  for (let i = 0; i < 64; i++) {
    const isLeft = i % 2 === 0;
    const baseEdgeX = isLeft ? 26 + ((i * 13) % 26) : 204 + ((i * 17) % 26);
    const py = (i * 29) % 512;
    const rx = 5 + (i % 7);
    const ry = 4 + ((i * 3) % 6);

    if (i % 3 === 0) {
      // Creeping jungle moss tuft eating into the stone road edge
      const mossGrad = ctx.createRadialGradient(baseEdgeX, py, 1, baseEdgeX, py, rx * 2.1);
      mossGrad.addColorStop(0, 'rgba(16, 185, 129, 0.55)');
      mossGrad.addColorStop(0.5, 'rgba(6, 78, 59, 0.65)');
      mossGrad.addColorStop(1, 'rgba(6, 78, 59, 0)');
      ctx.fillStyle = mossGrad;
      ctx.beginPath();
      ctx.arc(baseEdgeX, py, rx * 2.1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Detached broken cobblestone fragment on the grassy shoulder
      ctx.save();
      ctx.translate(baseEdgeX, py);
      ctx.rotate((i * 0.7) % Math.PI);
      ctx.fillStyle = i % 4 === 0 ? 'rgba(120, 113, 108, 0.85)' : 'rgba(71, 85, 105, 0.85)';
      ctx.strokeStyle = 'rgba(9, 18, 14, 0.75)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(-rx, -ry, rx * 2, ry * 2, 3);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // 4. Subtle weathered arcane center trail
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.32)';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 18]);
  ctx.beginPath();
  ctx.moveTo(128, 0);
  ctx.lineTo(128, 512);
  ctx.stroke();
  ctx.setLineDash([]);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function createFlowingRiverTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 1. Clear to full transparency so edges blend 100% naturally into the grassy terrain
  ctx.clearRect(0, 0, 256, 512);

  // 2. Soft organic gradient: transparent shore -> wet grass tint -> mossy shallows -> pale green water
  const baseGrad = ctx.createLinearGradient(0, 0, 256, 0);
  baseGrad.addColorStop(0, 'rgba(10, 36, 22, 0)');           // 0% - seamless fade into grass
  baseGrad.addColorStop(0.07, 'rgba(14, 52, 32, 0.38)');    // wet shoreline grass tint
  baseGrad.addColorStop(0.18, 'rgba(21, 88, 52, 0.74)');    // mossy shallows
  baseGrad.addColorStop(0.34, 'rgba(34, 140, 84, 0.88)');   // translucent emerald water
  baseGrad.addColorStop(0.50, 'rgba(134, 239, 172, 0.96)'); // radiant pale-green center current
  baseGrad.addColorStop(0.66, 'rgba(34, 140, 84, 0.88)');   // translucent emerald water
  baseGrad.addColorStop(0.82, 'rgba(21, 88, 52, 0.74)');    // mossy shallows
  baseGrad.addColorStop(0.93, 'rgba(14, 52, 32, 0.38)');    // wet shoreline grass tint
  baseGrad.addColorStop(1, 'rgba(10, 36, 22, 0)');           // 0% - seamless fade into grass
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 256, 512);

  // 3. Shoreline organic moss patches bridging water and bank
  for (let i = 0; i < 72; i++) {
    const isLeft = i % 2 === 0;
    const mx = isLeft ? 12 + ((i * 11) % 36) : 244 - ((i * 13) % 36);
    const my = (i * 37) % 512;
    const mr = 10 + (i % 14);
    const mossGrad = ctx.createRadialGradient(mx, my, 1, mx, my, mr);
    mossGrad.addColorStop(0, i % 3 === 0 ? 'rgba(132, 204, 22, 0.52)' : 'rgba(34, 197, 94, 0.44)');
    mossGrad.addColorStop(0.6, 'rgba(20, 83, 45, 0.32)');
    mossGrad.addColorStop(1, 'rgba(10, 36, 22, 0)');
    ctx.fillStyle = mossGrad;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Soft flowing pale-green water current ribbons & gentle ripples
  for (let i = 0; i < 60; i++) {
    const x = 36 + ((i * 37) % 184);
    const y = (i * 59) % 512;
    const len = 45 + (i % 85);
    const w = 2.5 + (i % 5);
    const g = ctx.createLinearGradient(x, y, x, y + len);
    g.addColorStop(0, 'rgba(220, 252, 231, 0)');
    g.addColorStop(
      0.5,
      i % 3 === 0
        ? 'rgba(190, 242, 100, 0.52)' // Soft moss-tinted current shimmer
        : 'rgba(220, 252, 231, 0.62)' // Pale green water highlight
    );
    g.addColorStop(1, 'rgba(220, 252, 231, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - w * 0.5, y, w, len);
  }

  // 5. Delicate translucent water ripple rings along the shallows
  for (let i = 0; i < 32; i++) {
    const isLeft = i % 2 === 0;
    const fx = isLeft ? 26 + ((i * 9) % 24) : 230 - ((i * 11) % 24);
    const fy = (i * 47) % 512;
    ctx.strokeStyle = 'rgba(220, 252, 231, 0.32)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(fx, fy, 2 + (i % 3), 0, Math.PI * 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 6);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

function createRiftVortexTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);
  const cx = 256;
  const cy = 256;

  const glow = ctx.createRadialGradient(cx, cy, 16, cx, cy, 240);
  glow.addColorStop(0, 'rgba(187, 247, 208, 0.72)');
  glow.addColorStop(0.35, 'rgba(74, 222, 128, 0.48)');
  glow.addColorStop(0.7, 'rgba(21, 128, 61, 0.25)');
  glow.addColorStop(1, 'rgba(20, 83, 45, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 245, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 192, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(167, 243, 208, 0.75)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 138, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(254, 240, 138, 0.8)' : 'rgba(187, 247, 208, 0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(68, 0);
    ctx.lineTo(190, 0);
    ctx.stroke();

    ctx.fillStyle = 'rgba(250, 204, 21, 0.92)';
    ctx.beginPath();
    ctx.moveTo(162, -7);
    ctx.lineTo(174, 0);
    ctx.lineTo(162, 7);
    ctx.lineTo(150, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTreeFoliageTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 256, 0, 0);
  grad.addColorStop(0, '#3e2723');
  grad.addColorStop(0.28, '#1b5e3c');
  grad.addColorStop(0.68, '#289660');
  grad.addColorStop(1, '#6ee7b7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Leaf cluster scallops & bark striations
  for (let i = 0; i < 120; i++) {
    const x = (i * 37) % 256;
    const y = (i * 53) % 256;
    ctx.fillStyle =
      i % 3 === 0 ? 'rgba(167, 243, 208, 0.32)' : 'rgba(6, 78, 59, 0.35)';
    ctx.beginPath();
    ctx.arc(x, y, 8 + (i % 10), 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Merges a stylized tree trunk + dual crown + glowing crystal/blossom apex into ONE single BufferGeometry
 * with multi-tone vertex color gradients and UV coordinates so it never looks flat.
 */
function createSingleUnifiedTreeGeometry(): THREE.BufferGeometry {
  const parts: {
    geo: THREE.BufferGeometry;
    botColor: THREE.Color;
    topColor: THREE.Color;
  }[] = [];

  const trunk = new THREE.CylinderGeometry(0.32, 0.62, 2.1, 9);
  trunk.translate(0, 1.05, 0);
  parts.push({
    geo: trunk,
    botColor: new THREE.Color(0x160d08),
    topColor: new THREE.Color(0x3e2718),
  });

  const lowerCrown = new THREE.ConeGeometry(1.95, 2.75, 9);
  lowerCrown.translate(0, 2.45, 0);
  parts.push({
    geo: lowerCrown,
    botColor: new THREE.Color(0x062417),
    topColor: new THREE.Color(0x134e32),
  });

  const midCrown = new THREE.ConeGeometry(1.52, 2.4, 9);
  midCrown.translate(0, 3.72, 0);
  parts.push({
    geo: midCrown,
    botColor: new THREE.Color(0x0a3622),
    topColor: new THREE.Color(0x1e754a),
  });

  const upperCrown = new THREE.ConeGeometry(1.06, 2.0, 9);
  upperCrown.translate(0, 4.95, 0);
  parts.push({
    geo: upperCrown,
    botColor: new THREE.Color(0x145334),
    topColor: new THREE.Color(0x34d399),
  });

  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const temp = new THREE.Color();

  for (const part of parts) {
    part.geo.computeBoundingBox();
    const minY = part.geo.boundingBox!.min.y;
    const spanY = Math.max(0.01, part.geo.boundingBox!.max.y - minY);

    const nonIndexed = part.geo.index ? part.geo.toNonIndexed() : part.geo;
    const posAttr = nonIndexed.getAttribute('position');
    const normAttr = nonIndexed.getAttribute('normal');

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      const nx = normAttr.getX(i);
      const ny = normAttr.getY(i);

      positions.push(vx, vy, vz);
      normals.push(nx, ny, normAttr.getZ(i));

      const t = Math.min(1, Math.max(0, (vy - minY) / spanY));
      temp.copy(part.botColor).lerp(part.topColor, t);

      // Facet light contrast so each polygon side has distinct depth
      const facet = 1.0 + (nx * 0.16 + ny * 0.12);
      colors.push(
        Math.min(1, temp.r * facet),
        Math.min(1, temp.g * facet),
        Math.min(1, temp.b * facet)
      );

      const u = Math.atan2(vx, vz) / (Math.PI * 2) + 0.5;
      uvs.push(u, t);
    }
    nonIndexed.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return merged;
}

/**
 * Builds a composite 3D Jungle Wall segment using the exact same geometric & color composition
 * as the Jungle Monsters in `monsterSystem.ts` (Crag Golem Dodecahedron boulders + Box monoliths +
 * mossy emerald caps + glowing amber/aether Octahedron crystal veins + Cone horns).
 * ("buat tembok yang komposisinya sama dengan musuh di area jungle")
 */
function createMonsterCompositionWallGeometry(): THREE.BufferGeometry {
  const parts: {
    geo: THREE.BufferGeometry;
    botColor: THREE.Color;
    topColor: THREE.Color;
  }[] = [];

  // 1. Central Crag Golem Torso Boulder (DodecahedronGeometry like Golem torso)
  const centerCrag = new THREE.DodecahedronGeometry(1.75, 1);
  centerCrag.scale(1.35, 1.45, 0.95);
  centerCrag.translate(0, 1.85, 0);
  parts.push({
    geo: centerCrag,
    botColor: new THREE.Color(0x292524),
    topColor: new THREE.Color(0x86efac), // Mossy top cap matching Golem & Stalker
  });

  // 2. Monolith Stone Core Block (BoxGeometry like Golem head/chest)
  const monolithBlock = new THREE.BoxGeometry(2.2, 2.7, 1.45);
  monolithBlock.rotateY(0.18);
  monolithBlock.translate(-0.55, 1.4, 0.12);
  parts.push({
    geo: monolithBlock,
    botColor: new THREE.Color(0x1c1917),
    topColor: new THREE.Color(0x78716c),
  });

  // 3. Right Shoulder Boulder (DodecahedronGeometry like Golem arm/shoulder)
  const shoulderBoulder = new THREE.DodecahedronGeometry(1.28, 0);
  shoulderBoulder.scale(1.15, 1.35, 0.95);
  shoulderBoulder.translate(1.45, 1.35, -0.1);
  parts.push({
    geo: shoulderBoulder,
    botColor: new THREE.Color(0x292524),
    topColor: new THREE.Color(0x4ade80),
  });

  // 4. Jagged Stone Horns / Spikes (ConeGeometry like Stalker & Wolf dorsal spikes)
  const leftSpike = new THREE.ConeGeometry(0.46, 1.45, 5);
  leftSpike.rotateZ(0.22);
  leftSpike.translate(-1.25, 2.95, 0);
  parts.push({
    geo: leftSpike,
    botColor: new THREE.Color(0x44403c),
    topColor: new THREE.Color(0xd6d3d1),
  });

  const rightSpike = new THREE.ConeGeometry(0.42, 1.25, 5);
  rightSpike.rotateZ(-0.25);
  rightSpike.translate(1.2, 2.65, 0.15);
  parts.push({
    geo: rightSpike,
    botColor: new THREE.Color(0x44403c),
    topColor: new THREE.Color(0xa7f3d0),
  });

  // 5. Embedded Glowing Amber & Emerald Crystal Cores (OctahedronGeometry like Golem & Sentinel core)
  const amberCore = new THREE.OctahedronGeometry(0.58, 0);
  amberCore.scale(0.85, 1.45, 0.85);
  amberCore.rotateZ(-0.15);
  amberCore.translate(0.18, 2.15, 0.72);
  parts.push({
    geo: amberCore,
    botColor: new THREE.Color(0xf59e0b),
    topColor: new THREE.Color(0xfef08a),
  });

  const emeraldVein = new THREE.OctahedronGeometry(0.48, 0);
  emeraldVein.scale(0.8, 1.35, 0.8);
  emeraldVein.rotateZ(0.28);
  emeraldVein.translate(-0.85, 1.75, -0.68);
  parts.push({
    geo: emeraldVein,
    botColor: new THREE.Color(0x10b981),
    topColor: new THREE.Color(0xa7f3d0),
  });

  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const temp = new THREE.Color();

  for (const part of parts) {
    part.geo.computeBoundingBox();
    const minY = part.geo.boundingBox!.min.y;
    const spanY = Math.max(0.01, part.geo.boundingBox!.max.y - minY);

    const nonIndexed = part.geo.index ? part.geo.toNonIndexed() : part.geo;
    const posAttr = nonIndexed.getAttribute('position');
    const normAttr = nonIndexed.getAttribute('normal');

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      const nx = normAttr.getX(i);
      const ny = normAttr.getY(i);
      const nz = normAttr.getZ(i);

      positions.push(vx, vy, vz);
      normals.push(nx, ny, nz);

      const t = Math.min(1, Math.max(0, (vy - minY) / spanY));
      temp.copy(part.botColor).lerp(part.topColor, t);

      const facet = 1.0 + (nx * 0.18 + ny * 0.14);
      colors.push(
        Math.min(1, temp.r * facet),
        Math.min(1, temp.g * facet),
        Math.min(1, temp.b * facet)
      );

      const u = (vx + 2.5) * 0.25;
      const v = vy * 0.3;
      uvs.push(u, v);
    }
    nonIndexed.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return merged;
}

/**
 * Builds a clean, low-profile mossy river stone cluster (without flat disks)
 * to sit naturally along the riverbanks and shallow edges.
 */
function createRiverRockClusterGeometry(): THREE.BufferGeometry {
  const parts: {
    geo: THREE.BufferGeometry;
    botColor: THREE.Color;
    topColor: THREE.Color;
  }[] = [];

  // 1. Main weathered river stone with mossy top gradient
  const mainBoulder = new THREE.DodecahedronGeometry(0.82, 1);
  mainBoulder.scale(1.2, 0.62, 0.95);
  mainBoulder.translate(0, 0.25, 0);
  parts.push({
    geo: mainBoulder,
    botColor: new THREE.Color(0x292524),
    topColor: new THREE.Color(0x84cc16),
  });

  // 2. Smaller companion pebble beside it
  const sideRock = new THREE.DodecahedronGeometry(0.48, 0);
  sideRock.scale(1.1, 0.6, 0.9);
  sideRock.translate(0.68, 0.18, -0.22);
  parts.push({
    geo: sideRock,
    botColor: new THREE.Color(0x1c1917),
    topColor: new THREE.Color(0x4ade80),
  });

  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const temp = new THREE.Color();

  for (const part of parts) {
    part.geo.computeBoundingBox();
    const minY = part.geo.boundingBox!.min.y;
    const spanY = Math.max(0.01, part.geo.boundingBox!.max.y - minY);

    const nonIndexed = part.geo.index ? part.geo.toNonIndexed() : part.geo;
    const posAttr = nonIndexed.getAttribute('position');
    const normAttr = nonIndexed.getAttribute('normal');

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      const nx = normAttr.getX(i);
      const ny = normAttr.getY(i);
      const nz = normAttr.getZ(i);

      positions.push(vx, vy, vz);
      normals.push(nx, ny, nz);

      const t = Math.min(1, Math.max(0, (vy - minY) / spanY));
      temp.copy(part.botColor).lerp(part.topColor, t);

      const facet = 1.0 + (nx * 0.16 + ny * 0.14);
      colors.push(
        Math.min(1, temp.r * facet),
        Math.min(1, temp.g * facet),
        Math.min(1, temp.b * facet)
      );

      uvs.push((vx + 1.5) * 0.35, (vz + 1.5) * 0.35);
    }
    nonIndexed.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return merged;
}

function createRibbonFromCurve(
  curve: THREE.CatmullRomCurve3,
  width: number,
  segments: number,
  yOffset: number
): THREE.BufferGeometry {
  const pts = curve.getSpacedPoints(segments);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const up = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();

  for (let i = 0; i <= segments; i++) {
    const p = pts[i];
    curve.getTangent(i / segments, tangent);
    side.crossVectors(tangent, up).normalize().multiplyScalar(width * 0.5);

    // Subtle organic width undulation so road edges never look like rigid rulers
    const edgeWave = 1.0 + Math.sin(i * 0.85) * 0.065;
    const left = new THREE.Vector3(
      p.x - side.x * edgeWave,
      yOffset,
      p.z - side.z * edgeWave
    );
    const right = new THREE.Vector3(
      p.x + side.x * edgeWave,
      yOffset,
      p.z + side.z * edgeWave
    );

    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    normals.push(0, 1, 0, 0, 1, 0);
    const v = (i / segments) * 18;
    uvs.push(0, v, 1, v);

    // Subtle longitudinal shading along the ribbon
    const shade = 0.88 + Math.sin((i / segments) * Math.PI * 6) * 0.12;
    colors.push(shade, shade, shade, shade, shade, shade);

    if (i < segments) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  return geo;
}

/**
 * Creates an organic, multi-column river geometry with 7 transverse segments
 * and a smooth gradient from shoreline moss green to luminous center current.
 */
function createRiverRibbonGeometry(
  curve: THREE.CatmullRomCurve3,
  width: number,
  segments: number,
  yOffset: number
): THREE.BufferGeometry {
  const pts = curve.getSpacedPoints(segments);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const up = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();

  // 7 transverse columns across the river for smooth water depth and shore blending
  const columns = [-1.0, -0.72, -0.38, 0.0, 0.38, 0.72, 1.0];
  const colCount = columns.length;

  for (let i = 0; i <= segments; i++) {
    const p = pts[i];
    curve.getTangent(i / segments, tangent);
    side.crossVectors(tangent, up).normalize().multiplyScalar(width * 0.5);

    // Subtle natural bank meandering
    const bankMeander = 1.0 + Math.sin(i * 0.75) * 0.05 + Math.cos(i * 1.3) * 0.03;
    const vCoord = (i / segments) * 12;

    for (let c = 0; c < colCount; c++) {
      const colNorm = columns[c]; // -1.0 to 1.0
      const absCol = Math.abs(colNorm); // 0 at center, 1 at shore edge

      const posX = p.x + side.x * colNorm * bankMeander;
      const posZ = p.z + side.z * colNorm * bankMeander;
      // Slight elevation profile: shores sit flush at yOffset, center water has slight crest
      const posY = yOffset + (1.0 - absCol * 0.5) * 0.012;

      positions.push(posX, posY, posZ);
      normals.push(0, 1, 0);

      const uCoord = (colNorm + 1.0) * 0.5;
      uvs.push(uCoord, vCoord);

      // Vertex color gradient: Shore edges blend seamlessly with riverbank grass
      if (absCol > 0.85) {
        // Outer shoreline edge: dark rich wet-moss green (matches riverbank grass exactly)
        colors.push(0.08, 0.32, 0.18);
      } else if (absCol > 0.5) {
        // Shallows: vibrant river moss
        colors.push(0.12, 0.52, 0.28);
      } else if (absCol > 0.2) {
        // Mid stream: clear emerald water
        colors.push(0.24, 0.82, 0.52);
      } else {
        // Center channel: pale luminescent current
        colors.push(0.65, 0.95, 0.78);
      }
    }

    if (i < segments) {
      for (let c = 0; c < colCount - 1; c++) {
        const row1 = i * colCount + c;
        const row2 = (i + 1) * colCount + c;
        indices.push(row1, row1 + 1, row2);
        indices.push(row1 + 1, row2 + 1, row2);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  return geo;
}

export function buildLobbyStage(renderer: THREE.WebGLRenderer): LobbyStageObjects {
  const group = new THREE.Group();

  const sanctuaryStoneMat = createDetailedPbrMaterial({
    pattern: 'stone',
    primaryHex: 0x334155,
    secondaryHex: 0x1e293b,
    accentHex: 0x38bdf8,
    roughness: 0.72,
    metalness: 0.22,
  });

  const goldTrimMat = createDetailedPbrMaterial({
    pattern: 'armor',
    primaryHex: 0xf59e0b,
    secondaryHex: 0x92400e,
    accentHex: 0xfef08a,
    roughness: 0.25,
    metalness: 0.85,
  });

  const mainPlatform = createDetailedMesh(
    new THREE.CylinderGeometry(18, 22, 2.2, 24),
    sanctuaryStoneMat,
    0x64748b,
    0x94a3b8,
    0xe2e8f0
  );
  mainPlatform.position.y = -1.1;
  mainPlatform.receiveShadow = true;
  group.add(mainPlatform);

  const innerRing = createDetailedMesh(
    new THREE.CylinderGeometry(8.5, 9.2, 0.35, 24),
    sanctuaryStoneMat,
    0x94a3b8,
    0xcbd5e1,
    0xffffff
  );
  innerRing.position.y = 0.15;
  innerRing.receiveShadow = true;
  group.add(innerRing);

  const vortexTex = createRiftVortexTexture();
  const sigilRing = new THREE.Mesh(
    new THREE.PlaneGeometry(12.8, 12.8),
    new THREE.MeshBasicMaterial({
      map: vortexTex,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  sigilRing.rotation.x = -Math.PI / 2;
  sigilRing.position.y = 0.34;
  group.add(sigilRing);

  // Central Sanctuary Aether Crystal Spire with faceted crystal texture + vertex gradient
  const crystalMat = createDetailedPbrMaterial({
    pattern: 'crystal',
    primaryHex: 0x7dd3fc,
    secondaryHex: 0x0284c7,
    accentHex: 0xe0f2fe,
    emissiveHex: 0x0284c7,
    emissiveIntensity: 1.35,
    roughness: 0.14,
    metalness: 0.4,
  });
  const centralCrystal = createDetailedMesh(
    new THREE.OctahedronGeometry(1.75, 0),
    crystalMat,
    0x38bdf8,
    0xbae6fd,
    0xffffff,
    0.22
  );
  centralCrystal.position.set(0, 4.2, -5.5);
  centralCrystal.scale.set(0.85, 1.85, 0.85);
  centralCrystal.castShadow = true;
  group.add(centralCrystal);

  const floatingRings: THREE.Mesh[] = [];
  for (let i = 0; i < 2; i++) {
    const ring = createDetailedMesh(
      new THREE.TorusGeometry(2.5 + i * 0.75, 0.09, 8, 36),
      goldTrimMat,
      0xfde68a,
      0xfbbf24,
      0xffffff
    );
    ring.position.copy(centralCrystal.position);
    floatingRings.push(ring);
    group.add(ring);
  }

  // Hero Preview Pedestal (center-front at (0, 0.32, 1.5))
  const pedestalGroup = new THREE.Group();
  pedestalGroup.position.set(0, 0.32, 1.5);
  const pedBase = createDetailedMesh(
    new THREE.CylinderGeometry(2.1, 2.5, 0.45, 16),
    sanctuaryStoneMat,
    0x94a3b8,
    0xcbd5e1,
    0xffffff
  );
  pedBase.position.y = 0.22;
  pedBase.receiveShadow = true;
  pedestalGroup.add(pedBase);

  const pedRim = createDetailedMesh(
    new THREE.TorusGeometry(2.12, 0.08, 8, 32),
    goldTrimMat,
    0xfde68a,
    0xfbbf24,
    0xffffff
  );
  pedRim.rotation.x = Math.PI / 2;
  pedRim.position.y = 0.45;
  pedestalGroup.add(pedRim);
  group.add(pedestalGroup);

  const lanternMat = createDetailedPbrMaterial({
    pattern: 'crystal',
    primaryHex: 0xfef08a,
    secondaryHex: 0xf59e0b,
    accentHex: 0xffffff,
    emissiveHex: 0xf59e0b,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + 0.38;
    const dist = 12.5;
    const px = Math.cos(angle) * dist;
    const pz = Math.sin(angle) * dist;

    if (pz > 6.5 && Math.abs(px) < 7) continue;

    const colGroup = new THREE.Group();
    colGroup.position.set(px, 0, pz);

    const base = createDetailedMesh(
      new THREE.BoxGeometry(1.4, 0.8, 1.4),
      sanctuaryStoneMat,
      0x64748b,
      0x94a3b8,
      0xe2e8f0
    );
    base.position.y = 0.4;
    colGroup.add(base);

    const shaft = createDetailedMesh(
      new THREE.CylinderGeometry(0.5, 0.58, 4.5, 8),
      sanctuaryStoneMat,
      0x64748b,
      0xcbd5e1,
      0xffffff
    );
    shaft.position.y = 2.65;
    shaft.castShadow = true;
    colGroup.add(shaft);

    const brazier = createDetailedMesh(
      new THREE.OctahedronGeometry(0.45, 0),
      lanternMat,
      0xfbbf24,
      0xfef08a,
      0xffffff
    );
    brazier.position.y = 5.4;
    colGroup.add(brazier);

    group.add(colGroup);
  }

  const pCount = 90;
  const pPositions = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPositions[i * 3] = (Math.random() - 0.5) * 28;
    pPositions[i * 3 + 1] = 0.5 + Math.random() * 9;
    pPositions[i * 3 + 2] = (Math.random() - 0.5) * 28;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0x7dd3fc,
    size: 0.18,
    transparent: true,
    opacity: 0.75,
  });
  const particles = new THREE.Points(pGeo, pMat);
  group.add(particles);

  return {
    group,
    centralCrystal,
    floatingRings,
    pedestalGroup,
    particles,
  };
}

export function buildMobaArenaMap(renderer: THREE.WebGLRenderer): ArenaMapObjects {
  const group = new THREE.Group();

  // 1. Multi-Tone Textured & Bump-Mapped Dark Rainforest Ground Plane with Riverbank Blending
  const riverCurve = new THREE.CatmullRomCurve3(RIVER_CONTROL_POINTS);
  const riverSamplePoints = riverCurve.getSpacedPoints(64);

  // Exact distance calculation from any (x, z) to the true river spline
  const getDistanceToRiver = (x: number, z: number): number => {
    let minDistSq = Infinity;
    for (let j = 0; j < riverSamplePoints.length - 1; j++) {
      const p1 = riverSamplePoints[j];
      const p2 = riverSamplePoints[j + 1];
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const lenSq = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (z - p1.z) * dz) / lenSq));
      const projX = p1.x + t * dx;
      const projZ = p1.z + t * dz;
      const distSq = (x - projX) * (x - projX) + (z - projZ) * (z - projZ);
      if (distSq < minDistSq) minDistSq = distSq;
    }
    return Math.sqrt(minDistSq);
  };

  const groundTex = createDetailedBiomeGroundTexture(renderer);
  const groundGeo = new THREE.PlaneGeometry(340, 340, 80, 80);
  groundGeo.rotateX(-Math.PI / 2);

  // Smooth, organic color transition from nocturnal rainforest grass into lush riverbank and riverbed
  const gPos = groundGeo.getAttribute('position');
  const gColors = new Float32Array(gPos.count * 3);
  const cTemp = new THREE.Color();
  const cRiverBed = new THREE.Color(0x0a2416);   // Deep submerged riverbed moss
  const cRiverBank = new THREE.Color(0x155332);  // Moist saturated riverbank grass
  const cLushMeadow = new THREE.Color(0x1b5e3c); // Lush transition meadow
  const cJungleBase = new THREE.Color(0x0f291e); // Nocturnal rainforest jungle floor
  const cJungleAccent = new THREE.Color(0x14402d);

  for (let i = 0; i < gPos.count; i++) {
    const vx = gPos.getX(i);
    const vz = gPos.getZ(i);
    const dist = getDistanceToRiver(vx, vz);

    if (dist < 7.0) {
      // Directly under / along the water: deep moist riverbed & moss tone
      const t = dist / 7.0;
      cTemp.copy(cRiverBed).lerp(cRiverBank, t);
    } else if (dist < 15.0) {
      // Shoreline transition zone: moist riverbank blending into lush meadow
      const t = (dist - 7.0) / 8.0;
      cTemp.copy(cRiverBank).lerp(cLushMeadow, t);
    } else if (dist < 26.0) {
      // Meadow to jungle transition zone
      const t = (dist - 15.0) / 11.0;
      cTemp.copy(cLushMeadow).lerp(cJungleBase, t);
    } else {
      // General rainforest ground with organic subtle variation
      const noise = (Math.sin(vx * 0.08) * Math.cos(vz * 0.08) + 1.0) * 0.5;
      cTemp.copy(cJungleBase).lerp(cJungleAccent, noise);
    }

    gColors[i * 3] = cTemp.r;
    gColors[i * 3 + 1] = cTemp.g;
    gColors[i * 3 + 2] = cTemp.b;
  }
  groundGeo.setAttribute('color', new THREE.BufferAttribute(gColors, 3));

  const groundMat = new THREE.MeshStandardMaterial({
    map: groundTex,
    bumpMap: groundTex,
    bumpScale: 0.045,
    vertexColors: true,
    roughness: 0.72,
    metalness: 0.12,
  });
  const groundPlane = new THREE.Mesh(groundGeo, groundMat);
  groundPlane.receiveShadow = true;
  group.add(groundPlane);

  // 2. Translucent & Multi-Column Animated River Mesh Blending Organically into Grass
  const riverSegments = 110;
  const riverGeo = createRiverRibbonGeometry(riverCurve, 14.2, riverSegments, 0.035);
  const riverTex = createFlowingRiverTexture(renderer);
  const riverMat = new THREE.MeshStandardMaterial({
    map: riverTex,
    bumpMap: riverTex,
    bumpScale: 0.025,
    vertexColors: true,
    color: 0xffffff,
    emissive: 0x14532d,
    emissiveIntensity: 0.32,
    roughness: 0.14,
    metalness: 0.32,
    transparent: true,
    opacity: 0.90,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const riverMesh = new THREE.Mesh(riverGeo, riverMat);
  riverMesh.receiveShadow = true;
  group.add(riverMesh);

  // 3. Central Aether Rift Vortex (Single Enlarged Animated Mesh)
  const vortexTex = createRiftVortexTexture();
  const livingRiftVortex = new THREE.Mesh(
    new THREE.PlaneGeometry(25, 25),
    new THREE.MeshBasicMaterial({
      map: vortexTex,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    })
  );
  livingRiftVortex.rotation.x = -Math.PI / 2;
  livingRiftVortex.position.set(0, 0.08, 0);
  group.add(livingRiftVortex);

  // 4. Three Organic Curved Lanes with Broken/Crumbled Cobblestone Edges that Blend into Grass
  const laneTex = createDetailedLaneCobbleTexture(renderer);
  const laneMat = new THREE.MeshStandardMaterial({
    map: laneTex,
    bumpMap: laneTex,
    bumpScale: 0.055,
    vertexColors: true,
    color: 0x94a3b8,
    roughness: 0.78,
    metalness: 0.12,
    transparent: true,
    alphaTest: 0.02,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const lanes: LaneId[] = ['top', 'mid', 'bot'];
  lanes.forEach((laneId) => {
    const curve = getLaneCurve(laneId);
    const ribbonGeo = createRibbonFromCurve(curve, 8.8, 96, 0.05);
    const laneMesh = new THREE.Mesh(ribbonGeo, laneMat);
    laneMesh.receiveShadow = true;
    group.add(laneMesh);
  });

  // 5. Team Base Sanctums with Carved Stone & Rune Textures
  const baseRings: THREE.Mesh[] = [];
  const buildBasePlatform = (pos: THREE.Vector3, isAlly: boolean) => {
    const basePlat = new THREE.Group();
    basePlat.position.copy(pos);

    const sanctumMat = createDetailedPbrMaterial({
      pattern: 'stone',
      primaryHex: isAlly ? 0x1e293b : 0x311018,
      secondaryHex: isAlly ? 0x090f17 : 0x140508,
      accentHex: isAlly ? 0x10b981 : 0xef4444,
      roughness: 0.68,
      metalness: 0.28,
    });

    const stoneDisc = createDetailedMesh(
      new THREE.CylinderGeometry(14.5, 16.0, 0.38, 24),
      sanctumMat,
      0x64748b,
      0x94a3b8,
      0xe2e8f0
    );
    stoneDisc.position.y = 0.18;
    stoneDisc.receiveShadow = true;
    basePlat.add(stoneDisc);

    const auraRing = new THREE.Mesh(
      new THREE.RingGeometry(12.2, 13.4, 36),
      new THREE.MeshBasicMaterial({
        color: isAlly ? 0x10b981 : 0xef4444,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.68,
      })
    );
    auraRing.rotation.x = -Math.PI / 2;
    auraRing.position.y = 0.39;
    basePlat.add(auraRing);
    baseRings.push(auraRing);

    group.add(basePlat);
  };

  buildBasePlatform(ALLY_BASE_POS, true);
  buildBasePlatform(ENEMY_BASE_POS, false);

  // 6. Jungle Camp Stone Circles & Jungle Walls Matching Monster Composition
  const campRings: THREE.Mesh[] = [];
  const wallTransforms: { x: number; z: number; rotY: number; scale: number; tintHex: number }[] =
    [];

  JUNGLE_CAMPS.forEach((camp) => {
    const campRing = new THREE.Mesh(
      new THREE.RingGeometry(3.8, 4.5, 24),
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.48,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    campRing.rotation.x = -Math.PI / 2;
    campRing.position.set(camp.x, 0.06, camp.z);
    group.add(campRing);
    campRings.push(campRing);

    // Horseshoe alcove wall behind each Jungle Monster camp (leaves entrance facing arena center)
    const openAngle = Math.atan2(-camp.z, -camp.x);
    const backAngle = openAngle + Math.PI;
    const arcCount = 5;
    for (let w = 0; w < arcCount; w++) {
      const offsetNorm = (w / (arcCount - 1) - 0.5) * 2.15; // ~125 deg horseshoe behind monster
      const ang = backAngle + offsetNorm;
      const radius = 5.4;
      const wx = camp.x + Math.cos(ang) * radius;
      const wz = camp.z + Math.sin(ang) * radius;
      wallTransforms.push({
        x: wx,
        z: wz,
        rotY: Math.atan2(camp.x - wx, camp.z - wz),
        scale: 1.05 + (w % 2) * 0.18,
        tintHex:
          camp.variant === 'sentinel'
            ? 0x7dd3fc
            : camp.variant === 'stalker'
              ? 0x6ee7b7
              : 0xfde68a,
      });
    }
  });

  // Additional Tactical Jungle Corridor Walls (Separating Lanes & River with Monster-Composition Crags)
  const corridorRidges: { x: number; z: number; rotY: number; length: number; tintHex: number }[] =
    [
      // Ally West Jungle Ridge (between Top and Mid)
      { x: -58, z: -6, rotY: 0.45, length: 4, tintHex: 0xd6d3d1 },
      { x: -34, z: 22, rotY: 0.78, length: 3, tintHex: 0x86efac },
      // Ally South Jungle Ridge (between Mid and Bot)
      { x: -30, z: 58, rotY: -0.35, length: 4, tintHex: 0x86efac },
      { x: 6, z: 56, rotY: 0.25, length: 3, tintHex: 0xd6d3d1 },
      // Enemy North Jungle Ridge (between Top and Mid)
      { x: -6, z: -56, rotY: 0.25, length: 3, tintHex: 0xd6d3d1 },
      { x: 30, z: -58, rotY: -0.35, length: 4, tintHex: 0xfde68a },
      // Enemy East Jungle Ridge (between Mid and Bot)
      { x: 34, z: -22, rotY: 0.78, length: 3, tintHex: 0xfde68a },
      { x: 58, z: 6, rotY: 0.45, length: 4, tintHex: 0xd6d3d1 },
    ];

  corridorRidges.forEach((ridge) => {
    for (let s = 0; s < ridge.length; s++) {
      const step = (s - (ridge.length - 1) * 0.5) * 3.8;
      const wx = ridge.x + Math.cos(ridge.rotY) * step;
      const wz = ridge.z + Math.sin(ridge.rotY) * step;
      if (isPointNearLaneOrStructure(wx, wz, 6.2)) continue;
      wallTransforms.push({
        x: wx,
        z: wz,
        rotY: ridge.rotY + Math.PI * 0.5 + (s % 2) * 0.25,
        scale: 1.15 + (s % 2) * 0.22,
        tintHex: ridge.tintHex,
      });
    }
  });

  // Build InstancedMesh for the Monster-Composition Jungle Walls
  const monsterWallGeo = createMonsterCompositionWallGeometry();
  const monsterWallMat = createDetailedPbrMaterial({
    pattern: 'stone',
    primaryHex: 0x78716c,
    secondaryHex: 0x292524,
    accentHex: 0xf59e0b,
    roughness: 0.82,
    metalness: 0.16,
    flatShading: true,
  });
  const monsterWallsInst = new THREE.InstancedMesh(
    monsterWallGeo,
    monsterWallMat,
    wallTransforms.length
  );
  monsterWallsInst.castShadow = true;
  monsterWallsInst.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const tempColor = new THREE.Color();

  wallTransforms.forEach((wt, idx) => {
    dummy.position.set(wt.x, 0, wt.z);
    dummy.rotation.set(0, wt.rotY, 0);
    dummy.scale.setScalar(wt.scale);
    dummy.updateMatrix();
    monsterWallsInst.setMatrixAt(idx, dummy.matrix);
    tempColor.setHex(wt.tintHex);
    monsterWallsInst.setColorAt(idx, tempColor);
  });
  monsterWallsInst.instanceMatrix.needsUpdate = true;
  if (monsterWallsInst.instanceColor) monsterWallsInst.instanceColor.needsUpdate = true;
  monsterWallsInst.computeBoundingSphere();
  group.add(monsterWallsInst);

  // 6b. Low-Profile Mossy Riverbank Stones (tucked neatly along the river edges so the water stays clean)
  const riverRockTransforms: {
    x: number;
    z: number;
    scaleX: number;
    scaleY: number;
    scaleZ: number;
    rotY: number;
    tintHex: number;
  }[] = [];

  const riverSampleCount = 34;
  const rTangent = new THREE.Vector3();
  const rSide = new THREE.Vector3();
  const upAxis = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < riverSampleCount; i++) {
    const t = (i + 0.5) / riverSampleCount;
    const pt = riverCurve.getPointAt(t);
    riverCurve.getTangentAt(t, rTangent);
    rSide.crossVectors(rTangent, upAxis).normalize();

    const sideSign = i % 2 === 0 ? 1 : -1;
    const lateralDist = sideSign * (5.2 + (i % 3) * 0.85);
    const rx = pt.x + rSide.x * lateralDist;
    const rz = pt.z + rSide.z * lateralDist;

    if (isPointNearLaneOrStructure(rx, rz, 6.2)) continue;

    const scaleBase = 0.72 + (i % 4) * 0.14;
    const tintPalette = [0xa3e635, 0x86efac, 0x4ade80, 0xbef264];
    riverRockTransforms.push({
      x: rx,
      z: rz,
      scaleX: scaleBase * 1.05,
      scaleY: scaleBase * 0.85,
      scaleZ: scaleBase,
      rotY: (i * 1.37) % (Math.PI * 2),
      tintHex: tintPalette[i % tintPalette.length],
    });
  }

  const riverRockGeo = createRiverRockClusterGeometry();
  const riverRockMat = createDetailedPbrMaterial({
    pattern: 'stone',
    primaryHex: 0x57534e,
    secondaryHex: 0x1c1917,
    accentHex: 0x84cc16,
    roughness: 0.78,
    metalness: 0.1,
    flatShading: true,
  });
  const riverRocksInst = new THREE.InstancedMesh(
    riverRockGeo,
    riverRockMat,
    riverRockTransforms.length
  );
  riverRocksInst.castShadow = true;
  riverRocksInst.receiveShadow = true;

  riverRockTransforms.forEach((rr, idx) => {
    dummy.position.set(rr.x, 0.02, rr.z);
    dummy.rotation.set(0, rr.rotY, 0);
    dummy.scale.set(rr.scaleX, rr.scaleY, rr.scaleZ);
    dummy.updateMatrix();
    riverRocksInst.setMatrixAt(idx, dummy.matrix);
    tempColor.setHex(rr.tintHex);
    riverRocksInst.setColorAt(idx, tempColor);
  });
  riverRocksInst.instanceMatrix.needsUpdate = true;
  if (riverRocksInst.instanceColor) riverRocksInst.instanceColor.needsUpdate = true;
  riverRocksInst.computeBoundingSphere();
  group.add(riverRocksInst);

  // 7. Reflective Grass Water Puddles ("genangan air dirumput") & Dense Rainforest Trees ("hutan rimba")
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const isNearJungleWall = (x: number, z: number, minDist = 4.2) =>
    wallTransforms.some((w) => Math.hypot(w.x - x, w.z - z) < minDist);

  const puddleTransforms: { x: number; z: number; scaleX: number; scaleZ: number; rotY: number }[] =
    [];
  for (let i = 0; i < 240; i++) {
    const px = (rand() - 0.5) * (MAP_HALF_SIZE * 1.84);
    const pz = (rand() - 0.5) * (MAP_HALF_SIZE * 1.84);
    // Keep puddles on the grassy jungle clearings (away from paved lanes, walls, and bases)
    if (isPointNearLaneOrStructure(px, pz, 6.4)) continue;
    if (isNearJungleWall(px, pz, 4.5)) continue;
    if (getDistanceToRiver(px, pz) < 9.5) continue; // not inside the main river channel
    const tooClose = puddleTransforms.some((p) => Math.hypot(p.x - px, p.z - pz) < 9.5);
    if (tooClose) continue;

    if (puddleTransforms.length < 68) {
      puddleTransforms.push({
        x: px,
        z: pz,
        scaleX: 3.2 + rand() * 4.2,
        scaleZ: 2.5 + rand() * 3.4,
        rotY: rand() * Math.PI * 2,
      });
    }
  }

  const puddleTex = createGrassPuddleTexture();
  const puddleGeo = new THREE.PlaneGeometry(1, 1);
  puddleGeo.rotateX(-Math.PI / 2);
  const puddleMat = new THREE.MeshStandardMaterial({
    map: puddleTex,
    roughness: 0.05,
    metalness: 0.78,
    emissive: 0x075985,
    emissiveIntensity: 0.34,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const puddleInst = new THREE.InstancedMesh(puddleGeo, puddleMat, puddleTransforms.length);
  puddleInst.receiveShadow = true;

  puddleTransforms.forEach((pd, idx) => {
    dummy.position.set(pd.x, 0.032, pd.z);
    dummy.rotation.set(0, pd.rotY, 0);
    dummy.scale.set(pd.scaleX, 1, pd.scaleZ);
    dummy.updateMatrix();
    puddleInst.setMatrixAt(idx, dummy.matrix);
    tempColor.setHex(idx % 2 === 0 ? 0x7dd3fc : 0x6ee7b7);
    puddleInst.setColorAt(idx, tempColor);
  });
  puddleInst.instanceMatrix.needsUpdate = true;
  if (puddleInst.instanceColor) puddleInst.instanceColor.needsUpdate = true;
  group.add(puddleInst);

  // 8. Dense Rainforest Canopy ("hutan rimba") across the Expanded Map
  const treeTransforms: { x: number; z: number; scale: number; phase: number; rotY: number }[] = [];

  for (let i = 0; i < 480; i++) {
    const x = (rand() - 0.5) * (MAP_HALF_SIZE * 1.94);
    const z = (rand() - 0.5) * (MAP_HALF_SIZE * 1.94);

    if (isPointNearLaneOrStructure(x, z, 9.2)) continue;
    if (isNearJungleWall(x, z, 4.2)) continue;
    const tooClose = treeTransforms.some((t) => Math.hypot(t.x - x, t.z - z) < 9.0);
    if (tooClose) continue;

    if (treeTransforms.length < 126) {
      treeTransforms.push({
        x,
        z,
        scale: 1.95 + rand() * 0.95,
        phase: rand() * Math.PI * 2,
        rotY: rand() * Math.PI * 2,
      });
    }
  }

  for (let i = 0; i < 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    const dist = MAP_HALF_SIZE + 9;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (isPointNearLaneOrStructure(x, z, 8.5)) continue;
    treeTransforms.push({
      x,
      z,
      scale: 2.6 + (i % 3) * 0.5,
      phase: i * 0.6,
      rotY: angle,
    });
  }

  const unifiedTreeGeo = createSingleUnifiedTreeGeometry();
  const treeFoliageTex = createTreeFoliageTexture();
  const unifiedTreeMat = new THREE.MeshStandardMaterial({
    map: treeFoliageTex,
    bumpMap: treeFoliageTex,
    bumpScale: 0.045,
    vertexColors: true,
    roughness: 0.74,
    metalness: 0.08,
  });
  const swayingTreesInst = new THREE.InstancedMesh(
    unifiedTreeGeo,
    unifiedTreeMat,
    treeTransforms.length
  );
  swayingTreesInst.castShadow = true;
  swayingTreesInst.receiveShadow = true;

  treeTransforms.forEach((tr, idx) => {
    dummy.position.set(tr.x, 0, tr.z);
    dummy.rotation.set(0, tr.rotY, 0);
    dummy.scale.setScalar(tr.scale);
    dummy.updateMatrix();
    swayingTreesInst.setMatrixAt(idx, dummy.matrix);

    // Nocturnal rainforest foliage hues (deep emerald, jungle jade, moonlit teal, dark moss)
    const palette = [0x6ee7b7, 0x34d399, 0x2dd4bf, 0x38bdf8, 0x4ade80];
    tempColor.setHex(palette[idx % palette.length]);
    swayingTreesInst.setColorAt(idx, tempColor);
  });

  swayingTreesInst.instanceMatrix.needsUpdate = true;
  if (swayingTreesInst.instanceColor) swayingTreesInst.instanceColor.needsUpdate = true;
  swayingTreesInst.computeBoundingSphere();
  group.add(swayingTreesInst);

  // 9. Nocturnal Jungle Fireflies & Mist Spores
  const spCount = 160;
  const spPos = new Float32Array(spCount * 3);
  for (let i = 0; i < spCount; i++) {
    spPos[i * 3] = (rand() - 0.5) * 200;
    spPos[i * 3 + 1] = 0.8 + rand() * 5.8;
    spPos[i * 3 + 2] = (rand() - 0.5) * 200;
  }
  const spGeo = new THREE.BufferGeometry();
  spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
  const ambientParticles = new THREE.Points(
    spGeo,
    new THREE.PointsMaterial({
      color: 0xa3e635,
      size: 0.36,
      transparent: true,
      opacity: 0.78,
    })
  );
  group.add(ambientParticles);

  let treeUpdateCounter = 0;
  const update = (dt: number, elapsed: number) => {
    // Water flow with uneven speed ("air tidak mengalir sempurna" while staying clearly water)
    const flowSpeed = 0.22 + Math.sin(elapsed * 1.4) * 0.1;
    riverTex.offset.y -= dt * flowSpeed;
    riverTex.offset.x = Math.sin(elapsed * 0.65) * 0.055;
    riverMat.emissiveIntensity = 0.4 + Math.sin(elapsed * 2.1) * 0.12;
    puddleMat.emissiveIntensity = 0.32 + Math.sin(elapsed * 2.6) * 0.12;

    livingRiftVortex.rotation.z = elapsed * 0.22;
    const vortexScale = 1.0 + Math.sin(elapsed * 1.8) * 0.065;
    livingRiftVortex.scale.set(vortexScale, vortexScale, 1);
    (livingRiftVortex.material as THREE.MeshBasicMaterial).opacity =
      0.74 + Math.sin(elapsed * 2.4) * 0.16;

    // Throttle instanced tree matrix updates to every 4th frame (15 Hz) to eliminate mobile GPU bus stalls
    treeUpdateCounter++;
    if (treeUpdateCounter % 4 === 0) {
      for (let i = 0; i < treeTransforms.length; i++) {
        const tr = treeTransforms[i];
        const windSwayZ = Math.sin(elapsed * 1.45 + tr.phase) * 0.048;
        const windSwayX = Math.cos(elapsed * 1.15 + tr.phase) * 0.032;
        const breathY = tr.scale * (1 + Math.sin(elapsed * 1.8 + tr.phase) * 0.025);

        dummy.position.set(tr.x, 0, tr.z);
        dummy.rotation.set(windSwayX, tr.rotY, windSwayZ);
        dummy.scale.set(tr.scale, breathY, tr.scale);
        dummy.updateMatrix();
        swayingTreesInst.setMatrixAt(i, dummy.matrix);
      }
      swayingTreesInst.instanceMatrix.needsUpdate = true;
    }

    const ringPulse = 0.52 + Math.sin(elapsed * 2.5) * 0.18;
    for (let i = 0; i < baseRings.length; i++) {
      (baseRings[i].material as THREE.MeshBasicMaterial).opacity = ringPulse;
    }
    for (let i = 0; i < campRings.length; i++) {
      (campRings[i].material as THREE.MeshBasicMaterial).opacity =
        0.35 + Math.sin(elapsed * 2.0 + i) * 0.14;
    }

    ambientParticles.rotation.y = elapsed * 0.035;
    ambientParticles.position.y = Math.sin(elapsed * 1.2) * 0.35;
  };

  return {
    group,
    groundPlane,
    riverMesh,
    ambientParticles,
    update,
  };
}
