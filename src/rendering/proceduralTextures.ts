import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();

export type SurfacePatternType =
  | 'armor'
  | 'cloth'
  | 'leather'
  | 'stone'
  | 'crystal'
  | 'organic'
  | 'blade';

/**
 * Generates and caches rich procedural hand-painted style CanvasTextures so no 3D object looks flat or plain.
 */
export function getDetailedSurfaceTexture(
  pattern: SurfacePatternType,
  primaryHex: number,
  secondaryHex: number,
  accentHex: number
): THREE.CanvasTexture {
  const key = `${pattern}_${primaryHex.toString(16)}_${secondaryHex.toString(16)}_${accentHex.toString(16)}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const c1 = new THREE.Color(primaryHex);
  const c2 = new THREE.Color(secondaryHex);
  const c3 = new THREE.Color(accentHex);

  const toRgb = (c: THREE.Color, alpha = 1) =>
    `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${alpha})`;

  // Base vertical gradient so every UV-mapped surface has natural tonal richness
  const baseGrad = ctx.createLinearGradient(0, 0, 0, 256);
  baseGrad.addColorStop(0, toRgb(c1.clone().multiplyScalar(1.22)));
  baseGrad.addColorStop(0.5, toRgb(c1));
  baseGrad.addColorStop(1, toRgb(c2.clone().multiplyScalar(0.78)));
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 256, 256);

  if (pattern === 'armor') {
    // Metallic armor plates, panel seams, brushed highlights, and rivets
    ctx.strokeStyle = toRgb(c2.clone().multiplyScalar(0.55), 0.85);
    ctx.lineWidth = 4;
    for (let y = 32; y < 256; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y + (y % 128 === 0 ? 12 : -12));
      ctx.stroke();

      // Bright bevel highlight right below seam
      ctx.strokeStyle = toRgb(c1.clone().lerp(new THREE.Color(0xffffff), 0.38), 0.65);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y + 3);
      ctx.lineTo(256, y + (y % 128 === 0 ? 15 : -9));
      ctx.stroke();
      ctx.strokeStyle = toRgb(c2.clone().multiplyScalar(0.55), 0.85);
      ctx.lineWidth = 4;
    }

    // Diagonal brushed metal sheen & battle wear
    for (let i = 0; i < 48; i++) {
      const x = (i * 37) % 256;
      const y = (i * 53) % 256;
      ctx.strokeStyle =
        i % 3 === 0
          ? toRgb(c1.clone().lerp(new THREE.Color(0xffffff), 0.35), 0.28)
          : toRgb(c2.clone().multiplyScalar(0.65), 0.25);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 22, y + 14);
      ctx.stroke();
    }

    // Glowing accent filigree trim stripe & rivets
    ctx.fillStyle = toRgb(c3, 0.85);
    ctx.fillRect(0, 118, 256, 8);
    ctx.fillRect(118, 0, 10, 256);

    for (let x = 24; x < 256; x += 48) {
      for (let y = 24; y < 256; y += 64) {
        ctx.fillStyle = toRgb(c3.clone().lerp(new THREE.Color(0xffffff), 0.4), 0.9);
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (pattern === 'cloth') {
    // Rich woven cloth texture with ornate embroidered rune borders
    ctx.strokeStyle = toRgb(c2.clone().lerp(new THREE.Color(0xffffff), 0.15), 0.18);
    ctx.lineWidth = 1;
    for (let i = 0; i < 256; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }

    // Drape fold shading
    for (let x = 0; x < 256; x += 42) {
      const foldGrad = ctx.createLinearGradient(x, 0, x + 42, 0);
      foldGrad.addColorStop(0, toRgb(c2.clone().multiplyScalar(0.6), 0.38));
      foldGrad.addColorStop(0.5, toRgb(c1.clone().lerp(new THREE.Color(0xffffff), 0.25), 0.28));
      foldGrad.addColorStop(1, toRgb(c2.clone().multiplyScalar(0.6), 0.38));
      ctx.fillStyle = foldGrad;
      ctx.fillRect(x, 0, 42, 256);
    }

    // Embroidered geometric trim bands
    ctx.fillStyle = toRgb(c3, 0.92);
    ctx.fillRect(0, 196, 256, 12);
    ctx.fillRect(0, 224, 256, 6);

    ctx.strokeStyle = toRgb(c3.clone().lerp(new THREE.Color(0xffffff), 0.35), 0.9);
    ctx.lineWidth = 2.5;
    for (let x = 16; x < 256; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x - 10, 180);
      ctx.lineTo(x, 164);
      ctx.lineTo(x + 10, 180);
      ctx.lineTo(x, 192);
      ctx.closePath();
      ctx.stroke();
    }
  } else if (pattern === 'leather') {
    // Tooled leather grain, cross-stitching, and straps
    for (let i = 0; i < 90; i++) {
      const x = (i * 29) % 256;
      const y = (i * 47) % 256;
      ctx.fillStyle =
        i % 2 === 0
          ? toRgb(c1.clone().multiplyScalar(1.18), 0.25)
          : toRgb(c2.clone().multiplyScalar(0.72), 0.25);
      ctx.beginPath();
      ctx.arc(x, y, 6 + (i % 9), 0, Math.PI * 2);
      ctx.fill();
    }

    // Cross-strapped belt bands
    ctx.fillStyle = toRgb(c2.clone().multiplyScalar(0.62), 0.9);
    ctx.fillRect(0, 80, 256, 22);
    ctx.fillRect(0, 168, 256, 22);

    // Bright stitching & metallic studs
    ctx.strokeStyle = toRgb(c3.clone().lerp(new THREE.Color(0xfef08a), 0.4), 0.85);
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 84);
    ctx.lineTo(256, 84);
    ctx.moveTo(0, 98);
    ctx.lineTo(256, 98);
    ctx.moveTo(0, 172);
    ctx.lineTo(256, 172);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (pattern === 'stone') {
    // Carved ancient stone blocks, deep cracks, weathered speckles, and glowing rune veins
    for (let i = 0; i < 110; i++) {
      const x = (i * 43) % 256;
      const y = (i * 71) % 256;
      const r = 4 + (i % 14);
      ctx.fillStyle =
        i % 3 === 0
          ? toRgb(c1.clone().lerp(new THREE.Color(0xffffff), 0.2), 0.3)
          : toRgb(c2.clone().multiplyScalar(0.65), 0.35);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Carved block masonry & jagged cracks
    ctx.strokeStyle = toRgb(c2.clone().multiplyScalar(0.42), 0.9);
    ctx.lineWidth = 3.5;
    for (let y = 48; y < 256; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(85, y + 6);
      ctx.lineTo(170, y - 5);
      ctx.lineTo(256, y + 3);
      ctx.stroke();
    }

    // Glowing energy rune veins inside stone fissures
    ctx.strokeStyle = toRgb(c3, 0.92);
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const sx = 28 + i * 48;
      ctx.beginPath();
      ctx.moveTo(sx, 16);
      ctx.lineTo(sx + 14, 92);
      ctx.lineTo(sx - 10, 168);
      ctx.lineTo(sx + 8, 240);
      ctx.stroke();
    }
  } else if (pattern === 'crystal') {
    // Faceted crystal planes with internal glowing energy veins
    for (let i = 0; i < 18; i++) {
      const x = (i * 37) % 220;
      const y = (i * 59) % 220;
      ctx.fillStyle =
        i % 2 === 0
          ? toRgb(c1.clone().lerp(new THREE.Color(0xffffff), 0.45), 0.38)
          : toRgb(c3, 0.35);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 45, y + 12);
      ctx.lineTo(x + 24, y + 58);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = toRgb(new THREE.Color(0xffffff), 0.85);
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const x = (i * 31) % 256;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo((x + 64) % 256, 256);
      ctx.stroke();
    }
  } else if (pattern === 'blade') {
    // Damascus / energy-etched weapon blade with bright fuller & glowing edge
    const bladeGrad = ctx.createLinearGradient(0, 0, 256, 0);
    bladeGrad.addColorStop(0, toRgb(c3.clone().lerp(new THREE.Color(0xffffff), 0.45)));
    bladeGrad.addColorStop(0.22, toRgb(c1.clone().lerp(new THREE.Color(0xffffff), 0.35)));
    bladeGrad.addColorStop(0.5, toRgb(c2.clone().multiplyScalar(0.55)));
    bladeGrad.addColorStop(0.78, toRgb(c1.clone().lerp(new THREE.Color(0xffffff), 0.35)));
    bladeGrad.addColorStop(1, toRgb(c3.clone().lerp(new THREE.Color(0xffffff), 0.45)));
    ctx.fillStyle = bladeGrad;
    ctx.fillRect(0, 0, 256, 256);

    // Center glowing rune fuller
    ctx.strokeStyle = toRgb(c3, 0.95);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(128, 0);
    ctx.lineTo(128, 256);
    ctx.stroke();

    // Chevron energy etchings along blade
    ctx.lineWidth = 2.5;
    for (let y = 24; y < 256; y += 36) {
      ctx.beginPath();
      ctx.moveTo(72, y + 14);
      ctx.lineTo(128, y);
      ctx.lineTo(184, y + 14);
      ctx.stroke();
    }
  } else {
    // 'organic': Beast fur, scales, or ancient forest bark striations + primal markings
    for (let y = 0; y < 256; y += 10) {
      ctx.strokeStyle =
        y % 20 === 0
          ? toRgb(c2.clone().multiplyScalar(0.65), 0.55)
          : toRgb(c1.clone().multiplyScalar(1.22), 0.45);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(85, y + 12, 170, y - 12, 256, y);
      ctx.stroke();
    }

    // Glowing primal markings
    ctx.strokeStyle = toRgb(c3, 0.88);
    ctx.lineWidth = 3.5;
    for (let y = 40; y < 230; y += 64) {
      ctx.beginPath();
      ctx.moveTo(48, y);
      ctx.lineTo(128, y + 22);
      ctx.lineTo(208, y);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  textureCache.set(key, tex);
  return tex;
}

/**
 * Applies rich multi-tone vertex color gradients and facet variation to any BufferGeometry
 * so even polyhedra (Dodecahedron, Octahedron, Cone, Box, Cylinder) have 3-tone shading & accent rims.
 */
export function applyRichVertexColors(
  geo: THREE.BufferGeometry,
  bottomHex: number,
  midHex: number,
  topHex: number,
  facetContrast = 0.14
): THREE.BufferGeometry {
  geo.computeBoundingBox();
  geo.computeVertexNormals();

  const bbox = geo.boundingBox!;
  const minY = bbox.min.y;
  const spanY = Math.max(0.001, bbox.max.y - minY);

  const posAttr = geo.getAttribute('position');
  const normAttr = geo.getAttribute('normal');
  const count = posAttr.count;

  const cBot = new THREE.Color(bottomHex);
  const cMid = new THREE.Color(midHex);
  const cTop = new THREE.Color(topHex);
  const temp = new THREE.Color();

  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const nx = normAttr ? normAttr.getX(i) : 0;
    const ny = normAttr ? normAttr.getY(i) : 1;
    const nz = normAttr ? normAttr.getZ(i) : 0;

    // Normalized height 0..1
    const t = Math.min(1, Math.max(0, (y - minY) / spanY));
    if (t < 0.5) {
      temp.copy(cBot).lerp(cMid, t * 2);
    } else {
      temp.copy(cMid).lerp(cTop, (t - 0.5) * 2);
    }

    // Facet directional shading & subtle organic variation so adjacent polygons pop
    const facetShift =
      1.0 + (nx * 0.45 + ny * 0.35 - nz * 0.25 + Math.sin(x * 7.3 + z * 5.7) * 0.25) * facetContrast;
    colors[i * 3] = Math.min(1, Math.max(0, temp.r * facetShift));
    colors[i * 3 + 1] = Math.min(1, Math.max(0, temp.g * facetShift));
    colors[i * 3 + 2] = Math.min(1, Math.max(0, temp.b * facetShift));
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Ensure UVs exist even on polyhedra so procedural textures map cleanly
  if (!geo.getAttribute('uv')) {
    const uvs = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      const u = Math.atan2(x, z) / (Math.PI * 2) + 0.5;
      const v = (y - minY) / spanY;
      uvs[i * 2] = u;
      uvs[i * 2 + 1] = v;
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  }

  return geo;
}

/**
 * Creates a richly textured and bump-mapped PBR material with vertex color support.
 */
export function createDetailedPbrMaterial(options: {
  pattern: SurfacePatternType;
  primaryHex: number;
  secondaryHex: number;
  accentHex: number;
  roughness?: number;
  metalness?: number;
  emissiveHex?: number;
  emissiveIntensity?: number;
  flatShading?: boolean;
  bumpScale?: number;
}): THREE.MeshStandardMaterial {
  const tex = getDetailedSurfaceTexture(
    options.pattern,
    options.primaryHex,
    options.secondaryHex,
    options.accentHex
  );

  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: tex,
    bumpMap: tex,
    bumpScale: options.bumpScale ?? 0.035,
    vertexColors: true,
    roughness: options.roughness ?? 0.55,
    metalness: options.metalness ?? 0.3,
    emissive: options.emissiveHex ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    flatShading: options.flatShading ?? false,
  });
}

/**
 * Convenience helper to create a detailed mesh with both rich vertex color gradients AND a procedural texture map.
 */
export function createDetailedMesh(
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  bottomHex = 0xb8c4d4,
  midHex = 0xe2e8f0,
  topHex = 0xffffff,
  facetContrast = 0.14
): THREE.Mesh {
  applyRichVertexColors(geo, bottomHex, midHex, topHex, facetContrast);
  return new THREE.Mesh(geo, mat);
}
