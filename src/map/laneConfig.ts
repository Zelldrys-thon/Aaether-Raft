import * as THREE from 'three';
import { LaneId } from '../types/game';

export const MAP_HALF_SIZE = 104;

export const ALLY_BASE_POS = new THREE.Vector3(-78, 0, 78);
export const ENEMY_BASE_POS = new THREE.Vector3(78, 0, -78);

export const ALLY_FOUNTAIN_POS = new THREE.Vector3(-87, 0, 87);
export const ENEMY_FOUNTAIN_POS = new THREE.Vector3(87, 0, -87);

// Organic curved 3-lane control points (Top, Mid, Bottom) across the expanded 208x208 arena
export const LANE_CONTROL_POINTS: Record<LaneId, THREE.Vector3[]> = {
  top: [
    new THREE.Vector3(-78, 0, 78),
    new THREE.Vector3(-81, 0, 46),
    new THREE.Vector3(-75, 0, 12),
    new THREE.Vector3(-80, 0, -26),
    new THREE.Vector3(-70, 0, -61),
    new THREE.Vector3(-49, 0, -75),
    new THREE.Vector3(-14, 0, -80),
    new THREE.Vector3(23, 0, -75),
    new THREE.Vector3(52, 0, -80),
    new THREE.Vector3(78, 0, -78),
  ],
  mid: [
    new THREE.Vector3(-78, 0, 78),
    new THREE.Vector3(-55, 0, 58),
    new THREE.Vector3(-35, 0, 29),
    new THREE.Vector3(-12, 0, 14),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(14, 0, -12),
    new THREE.Vector3(32, 0, -35),
    new THREE.Vector3(56, 0, -55),
    new THREE.Vector3(78, 0, -78),
  ],
  bot: [
    new THREE.Vector3(-78, 0, 78),
    new THREE.Vector3(-49, 0, 80),
    new THREE.Vector3(-17, 0, 75),
    new THREE.Vector3(20, 0, 80),
    new THREE.Vector3(52, 0, 70),
    new THREE.Vector3(72, 0, 49),
    new THREE.Vector3(80, 0, 14),
    new THREE.Vector3(75, 0, -23),
    new THREE.Vector3(81, 0, -51),
    new THREE.Vector3(78, 0, -78),
  ],
};

// River runs diagonally from Top-Left (-95, -87) through (0,0) to Bottom-Right (95, 87)
export const RIVER_CONTROL_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(-95, 0, -87),
  new THREE.Vector3(-55, 0, -46),
  new THREE.Vector3(-23, 0, -26),
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(26, 0, 22),
  new THREE.Vector3(52, 0, 49),
  new THREE.Vector3(95, 0, 87),
];

export function getLaneCurve(lane: LaneId): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(LANE_CONTROL_POINTS[lane], false, 'catmullrom', 0.5);
}

export function getLaneWaypoints(lane: LaneId, count = 22): THREE.Vector3[] {
  const curve = getLaneCurve(lane);
  return curve.getPoints(count);
}

export interface TowerSpawnConfig {
  id: string;
  name: string;
  lane: LaneId;
  team: 'ally' | 'enemy';
  x: number;
  z: number;
}

export function getInitialTowers(): TowerSpawnConfig[] {
  const towers: TowerSpawnConfig[] = [];
  const lanes: LaneId[] = ['top', 'mid', 'bot'];

  lanes.forEach((lane) => {
    const curve = getLaneCurve(lane);
    // 2 towers per lane per team (Outer Tier 1 & Inner Tier 2) for clean pacing
    const allyT1 = curve.getPointAt(0.34);
    const allyT2 = curve.getPointAt(0.17);
    const enemyT1 = curve.getPointAt(0.66);
    const enemyT2 = curve.getPointAt(0.83);

    towers.push(
      {
        id: `tower_ally_${lane}_1`,
        name: `Ally ${lane.toUpperCase()} Outer Tower`,
        lane,
        team: 'ally',
        x: allyT1.x,
        z: allyT1.z,
      },
      {
        id: `tower_ally_${lane}_2`,
        name: `Ally ${lane.toUpperCase()} Inner Tower`,
        lane,
        team: 'ally',
        x: allyT2.x,
        z: allyT2.z,
      },
      {
        id: `tower_enemy_${lane}_1`,
        name: `Enemy ${lane.toUpperCase()} Outer Tower`,
        lane,
        team: 'enemy',
        x: enemyT1.x,
        z: enemyT1.z,
      },
      {
        id: `tower_enemy_${lane}_2`,
        name: `Enemy ${lane.toUpperCase()} Inner Tower`,
        lane,
        team: 'enemy',
        x: enemyT2.x,
        z: enemyT2.z,
      }
    );
  });

  return towers;
}

export interface JungleCampConfig {
  id: string;
  name: string;
  variant: 'golem' | 'stalker' | 'wolf' | 'sentinel';
  x: number;
  z: number;
  scale: number;
  maxHp: number;
  damage: number;
}

export const JUNGLE_CAMPS: JungleCampConfig[] = [
  {
    id: 'camp_ally_west',
    name: 'Elder Crag Golem',
    variant: 'golem',
    x: -49,
    z: 14,
    scale: 1.3,
    maxHp: 920,
    damage: 46,
  },
  {
    id: 'camp_ally_south',
    name: 'Sylvan Moss Stalker',
    variant: 'stalker',
    x: -12,
    z: 46,
    scale: 1.1,
    maxHp: 680,
    damage: 38,
  },
  {
    id: 'camp_river_west',
    name: 'Aether Rift Sentinel',
    variant: 'sentinel',
    x: -32,
    z: -32,
    scale: 1.45,
    maxHp: 1350,
    damage: 62,
  },
  {
    id: 'camp_enemy_north',
    name: 'Crimson Timber Wolf',
    variant: 'wolf',
    x: 12,
    z: -46,
    scale: 1.1,
    maxHp: 680,
    damage: 40,
  },
  {
    id: 'camp_enemy_east',
    name: 'Obsidian Golem',
    variant: 'golem',
    x: 49,
    z: -14,
    scale: 1.3,
    maxHp: 920,
    damage: 46,
  },
  {
    id: 'camp_river_east',
    name: 'Runic Abyss Guardian',
    variant: 'sentinel',
    x: 32,
    z: 32,
    scale: 1.45,
    maxHp: 1350,
    damage: 62,
  },
];

// Helper to check distance to any lane or river or base so trees/rocks never block lanes
export function isPointNearLaneOrStructure(x: number, z: number, minClearing = 7.4): boolean {
  const pt = new THREE.Vector3(x, 0, z);
  if (pt.distanceTo(ALLY_BASE_POS) < 18 || pt.distanceTo(ENEMY_BASE_POS) < 18) return true;

  for (const camp of JUNGLE_CAMPS) {
    if (Math.hypot(x - camp.x, z - camp.z) < 7.2) return true;
  }

  const lanes: LaneId[] = ['top', 'mid', 'bot'];
  for (const lane of lanes) {
    const pts = getLaneWaypoints(lane, 48);
    for (const lp of pts) {
      if (pt.distanceTo(lp) < minClearing) return true;
    }
  }

  const riverCurve = new THREE.CatmullRomCurve3(RIVER_CONTROL_POINTS);
  const riverPts = riverCurve.getPoints(48);
  for (const rp of riverPts) {
    if (pt.distanceTo(rp) < minClearing * 0.85) return true;
  }

  return false;
}
