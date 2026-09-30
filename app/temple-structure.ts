import {
  CUBIT, TEMPLE_CELLS_TOP_Y, TEMPLE_EAST_Z, TEMPLE_FLOOR_Y, TEMPLE_HEKHAL_WALL_WEST_Z, TEMPLE_HOLY_OF_HOLIES_WEST_Z,
  TEMPLE_HOLY_PLACE_WEST_Z, TEMPLE_PARAPET_TOP_Y, TEMPLE_PARTITION_WEST_Z, TEMPLE_PORCH_WALL_WEST_Z, TEMPLE_PORCH_WEST_Z,
  TEMPLE_REAR_CHAMBER_WEST_Z, TEMPLE_ROOF_Y, TEMPLE_UPPER_FLOOR_Y, TEMPLE_WEST_WALL_WEST_Z, TEMPLE_WEST_Z,
} from "./temple-layout";

export type Vec3 = [number, number, number];
export type Box = { min: Vec3; max: Vec3 };
export type PlanCollider = { minX: number; maxX: number; minZ: number; maxZ: number; y0?: number; y1?: number };
export type Gap = { at: number; width: number; height: number; bottom?: number };
export type WallSpec = { axis: "x" | "z"; fixed: number; from: number; to: number; y0: number; y1: number; t: number; gaps?: Gap[]; group?: string; collide?: boolean; colliderY0?: number };
export type TaggedBox = Box & { group: string };

export function wallBoxes(wall: WallSpec): Box[] {
  const boxes: Box[] = [];
  const half = wall.t / 2;
  const make = (a: number, b: number, y0: number, y1: number): Box => (wall.axis === "z"
    ? { min: [wall.fixed - half, y0, a], max: [wall.fixed + half, y1, b] }
    : { min: [a, y0, wall.fixed - half], max: [b, y1, wall.fixed + half] });
  let cursor = wall.from;
  for (const gap of [...(wall.gaps ?? [])].sort((p, q) => p.at - q.at)) {
    const a = gap.at - gap.width / 2;
    const b = gap.at + gap.width / 2;
    if (a > cursor) boxes.push(make(cursor, a, wall.y0, wall.y1));
    const bottom = wall.y0 + (gap.bottom ?? 0);
    if (gap.bottom) boxes.push(make(a, b, wall.y0, bottom));
    if (bottom + gap.height < wall.y1) boxes.push(make(a, b, bottom + gap.height, wall.y1));
    cursor = b;
  }
  if (cursor < wall.to) boxes.push(make(cursor, wall.to, wall.y0, wall.y1));
  return boxes;
}

export function wallColliders(wall: WallSpec): PlanCollider[] {
  if (wall.collide === false) return [];
  const half = wall.t / 2;
  const make = (a: number, b: number): PlanCollider => (wall.axis === "z"
    ? { minX: wall.fixed - half, maxX: wall.fixed + half, minZ: a, maxZ: b, y0: wall.colliderY0 ?? wall.y0, y1: wall.y1 }
    : { minX: a, maxX: b, minZ: wall.fixed - half, maxZ: wall.fixed + half, y0: wall.colliderY0 ?? wall.y0, y1: wall.y1 });
  const out: PlanCollider[] = [];
  let cursor = wall.from;
  for (const gap of [...(wall.gaps ?? [])].sort((p, q) => p.at - q.at)) {
    const a = gap.at - gap.width / 2;
    if (a > cursor) out.push(make(cursor, a));
    cursor = gap.at + gap.width / 2;
  }
  if (cursor < wall.to) out.push(make(cursor, wall.to));
  return out;
}

// A slab with rectangular openings that share one x range (trapdoors, stair wells).
export function slabWithHoles(min: Vec3, max: Vec3, holes: { x0: number; x1: number; z0: number; z1: number }[]): Box[] {
  const boxes: Box[] = [];
  let cursor = max[2];
  for (const hole of [...holes].sort((a, b) => b.z1 - a.z1)) {
    if (cursor > hole.z1) boxes.push({ min: [min[0], min[1], hole.z1], max: [max[0], max[1], cursor] });
    if (hole.x0 > min[0]) boxes.push({ min: [min[0], min[1], hole.z0], max: [hole.x0, max[1], hole.z1] });
    if (hole.x1 < max[0]) boxes.push({ min: [hole.x1, min[1], hole.z0], max: [max[0], max[1], hole.z1] });
    cursor = hole.z0;
  }
  if (cursor > min[2]) boxes.push({ min: [min[0], min[1], min[2]], max: [max[0], max[1], cursor] });
  return boxes;
}

/* ------------------------------------------------------------------ */
/* Sanctuary (Middot 4:3-7): every dimension below is a cubit count.   */
/* ------------------------------------------------------------------ */

const F = TEMPLE_FLOOR_Y;
export const SANCTUARY = {
  floor: F,
  tierHeight: (40 * CUBIT) / 3,
  cellsTop: TEMPLE_CELLS_TOP_Y,
  upperFloor: TEMPLE_UPPER_FLOOR_Y,
  roof: TEMPLE_ROOF_Y,
  parapetTop: TEMPLE_PARAPET_TOP_Y,
  hekhalHalf: 10 * CUBIT,
  // Hekhal wall is 6 cubits at the lowest cell, recessed a cubit per story so the cells widen 5 -> 6 -> 7 (1 Kings 6:6).
  wallThickness: [6 * CUBIT, 5 * CUBIT, 4 * CUBIT],
  cellWidth: [5 * CUBIT, 6 * CUBIT, 7 * CUBIT],
  cellInner: 10 * CUBIT + 11 * CUBIT,
  cellWallOuter: 10 * CUBIT + 27 * CUBIT,
  mesibahOuter: 10 * CUBIT + 30 * CUBIT,
  bodyHalf: 35 * CUBIT,
  porchHalf: 50 * CUBIT,
  zEast: TEMPLE_EAST_Z,
  zPorchWall: TEMPLE_PORCH_WALL_WEST_Z,
  zPorchIn: TEMPLE_PORCH_WEST_Z,
  zHekhalWall: TEMPLE_HEKHAL_WALL_WEST_Z,
  zHolyWest: TEMPLE_HOLY_PLACE_WEST_Z,
  zPartition: TEMPLE_PARTITION_WEST_Z,
  zHolyOfHoliesWest: TEMPLE_HOLY_OF_HOLIES_WEST_Z,
  zWestWall: TEMPLE_WEST_WALL_WEST_Z,
  zRear: TEMPLE_REAR_CHAMBER_WEST_Z,
  zWest: TEMPLE_WEST_Z,
} as const;

const S = SANCTUARY;
const tierY = [F, F + S.tierHeight, F + 2 * S.tierHeight, S.cellsTop] as const;
const faceX = (tier: number) => S.hekhalHalf + S.wallThickness[tier];
const CELL_EDGE = S.hekhalHalf + 11 * CUBIT; // inner face of the outer cell wall (8.4)
const ROW = (S.zHekhalWall - S.zWestWall) / 5; // north/south cells: five per story

const sides = [1, -1] as const;
const SANCTUARY_WINDOW_ZS = [-41, -50, -59] as const;
const SANCTUARY_WINDOW_WIDTH = 1.65;
const SANCTUARY_WINDOW_HEIGHT = 3.35;
const LOWER_WINDOW_CENTER_Y = F + 11.8;
const UPPER_WINDOW_CENTER_Y = F + 21.2;

export const SANCTUARY_WALLS: WallSpec[] = [];
const wall = (spec: WallSpec) => SANCTUARY_WALLS.push({ group: "core", ...spec });

// Porch: 100 cubits wide, front wall 5 cubits thick with the 20 x 40 cubit opening; two knife-store wings at the ends.
wall({ axis: "x", fixed: (S.zEast + S.zPorchWall) / 2, from: -S.porchHalf, to: S.porchHalf, y0: F, y1: S.roof, t: S.zEast - S.zPorchWall, gaps: [{ at: 0, width: 20 * CUBIT, height: 40 * CUBIT }] });
for (const s of sides) {
  wall({ axis: "z", fixed: s * (S.porchHalf - 0.4), from: S.zPorchIn - 0.8, to: S.zPorchWall, y0: F, y1: S.roof, t: 0.8 });
  wall({ axis: "z", fixed: s * S.bodyHalf, from: S.zPorchIn, to: S.zPorchWall, y0: F, y1: S.roof, t: 0.8, gaps: [{ at: (S.zPorchWall + S.zPorchIn) / 2, width: 1.4, height: 3.2 }] });
  wall({ axis: "x", fixed: S.zPorchIn - 0.4, from: Math.min(s * S.bodyHalf, s * S.porchHalf), to: Math.max(s * S.bodyHalf, s * S.porchHalf), y0: F, y1: S.roof, t: 0.8 });
}

// Wall between Porch and Hekhal (6 cubits): tower part with the 10 x 20 cubit doorway, cell-height wings with the north wicket.
wall({ axis: "x", fixed: (S.zPorchIn + S.zHekhalWall) / 2, from: -faceX(0), to: faceX(0), y0: F, y1: S.roof, t: S.zPorchIn - S.zHekhalWall, gaps: [{ at: 0, width: 10 * CUBIT, height: 20 * CUBIT }] });
wall({ axis: "x", fixed: (S.zPorchIn + S.zHekhalWall) / 2, from: faceX(0), to: S.bodyHalf, y0: F, y1: S.roof, t: S.zPorchIn - S.zHekhalWall, gaps: [{ at: (faceX(0) + CELL_EDGE) / 2, width: 1.2, height: 2.8 }], group: "north" });
wall({ axis: "x", fixed: (S.zPorchIn + S.zHekhalWall) / 2, from: -S.bodyHalf, to: -faceX(0), y0: F, y1: S.cellsTop, t: S.zPorchIn - S.zHekhalWall });
wall({ axis: "x", fixed: (S.zPorchIn + S.zHekhalWall) / 2, from: -S.bodyHalf, to: -faceX(0), y0: S.cellsTop, y1: S.roof, t: S.zPorchIn - S.zHekhalWall, group: "upper" });

// Hekhal and Holy of Holies side walls, recessing one cubit per story, then the upper-chamber walls.
for (const s of sides) {
  const group = s > 0 ? "north" : "core";
  const northDoor: Gap[] = s > 0 ? [{ at: S.zHekhalWall - 2.2, width: 1.2, height: 2.8 }] : [];
  for (let tier = 0; tier < 3; tier += 1) {
    const lowerWindows: Gap[] = tier === 2 ? SANCTUARY_WINDOW_ZS.map((at) => ({
      at,
      width: SANCTUARY_WINDOW_WIDTH,
      height: SANCTUARY_WINDOW_HEIGHT,
      bottom: LOWER_WINDOW_CENTER_Y - SANCTUARY_WINDOW_HEIGHT / 2 - tierY[tier],
    })) : [];
    wall({ axis: "z", fixed: s * (S.hekhalHalf + S.wallThickness[tier] / 2), from: S.zWestWall, to: S.zHekhalWall, y0: tierY[tier], y1: tierY[tier + 1], t: S.wallThickness[tier], gaps: [...(tier === 0 ? northDoor : []), ...lowerWindows], group });
  }
  const upperGate: Gap[] = s < 0 ? [{ at: -45, width: 1.2, height: 3.2, bottom: S.upperFloor - S.cellsTop }] : [];
  const upperWindows: Gap[] = SANCTUARY_WINDOW_ZS.map((at) => ({
    at,
    width: SANCTUARY_WINDOW_WIDTH,
    height: SANCTUARY_WINDOW_HEIGHT,
    bottom: UPPER_WINDOW_CENTER_Y - SANCTUARY_WINDOW_HEIGHT / 2 - S.cellsTop,
  }));
  wall({ axis: "z", fixed: s * (S.hekhalHalf + S.wallThickness[0] / 2), from: S.zWestWall, to: S.zHekhalWall, y0: S.cellsTop, y1: S.roof, t: S.wallThickness[0], gaps: [...upperGate, ...upperWindows], group: s > 0 ? "upper-north" : "upper" });
}
wall({ axis: "x", fixed: (S.zHolyOfHoliesWest + S.zWestWall) / 2, from: -faceX(0), to: faceX(0), y0: F, y1: S.roof, t: S.zHolyOfHoliesWest - S.zWestWall });

// Cell block, mesibah / water-descent bay and outer walls (70 cubits overall).
for (const s of sides) {
  const group = s > 0 ? "north" : "core";
  wall({ axis: "z", fixed: s * (CELL_EDGE + 1.0), from: S.zWestWall, to: S.zHekhalWall, y0: F, y1: S.cellsTop, t: 5 * CUBIT, gaps: s > 0 ? [{ at: S.zHekhalWall - 2.2, width: 1.2, height: 2.8 }] : [], group });
  wall({ axis: "z", fixed: s * (S.bodyHalf - 1.0), from: S.zWest, to: S.zHekhalWall, y0: F, y1: S.cellsTop + 4 * CUBIT, t: 5 * CUBIT, group });
}
wall({ axis: "x", fixed: (S.zRear + S.zWest) / 2, from: -S.bodyHalf, to: S.bodyHalf, y0: F, y1: S.cellsTop + 4 * CUBIT, t: S.zRear - S.zWest });
// Closing wall at the west end of each north/south cell row.
for (const s of sides) wall({ axis: "x", fixed: S.zWestWall, from: Math.min(s * faceX(0), s * CELL_EDGE), to: Math.max(s * faceX(0), s * CELL_EDGE), y0: F, y1: S.cellsTop, t: 0.4 });

// Cell partitions: five per story on the north and south, three (two on the top story) on the west; each has a door to its neighbour.
for (const s of sides) {
  const group = s > 0 ? "north" : "core";
  for (let tier = 0; tier < 3; tier += 1) {
    const face = faceX(tier);
    for (let j = 1; j < 5; j += 1) {
      wall({ axis: "x", fixed: S.zHekhalWall - ROW * j, from: Math.min(s * face, s * CELL_EDGE), to: Math.max(s * face, s * CELL_EDGE), y0: tierY[tier] + (tier === 0 ? 0 : 0.4), y1: tierY[tier + 1] - 0.4, t: 0.4, gaps: [{ at: s * (face + CELL_EDGE) / 2, width: 0.9, height: 2.2 }], group });
    }
  }
}
for (let tier = 0; tier < 3; tier += 1) {
  const cuts = tier < 2 ? [-S.bodyHalf / 3, S.bodyHalf / 3] : [0];
  for (const x of cuts) wall({ axis: "z", fixed: x, from: S.zRear, to: S.zWestWall, y0: tierY[tier] + (tier === 0 ? 0 : 0.4), y1: tierY[tier + 1] - 0.4, t: 0.4, gaps: [{ at: (S.zRear + S.zWestWall) / 2, width: 0.9, height: 2.2 }], group: "core", collide: false });
}

// Parapets (Deuteronomy 22:8): every roof people walk on, 3 cubits on the Sanctuary roof and 4 on the cell terraces.
const parapet = (spec: WallSpec) => SANCTUARY_WALLS.push({ group: "roof", collide: false, ...spec });
parapet({ axis: "x", fixed: S.zEast - 0.3, from: -S.porchHalf, to: S.porchHalf, y0: S.roof, y1: S.parapetTop, t: 0.6 });
for (const s of sides) {
  parapet({ axis: "z", fixed: s * (S.porchHalf - 0.2), from: S.zHekhalWall, to: S.zEast, y0: S.roof, y1: S.parapetTop, t: 0.4 });
  parapet({ axis: "x", fixed: S.zHekhalWall + 0.2, from: Math.min(s * faceX(0), s * S.porchHalf), to: Math.max(s * faceX(0), s * S.porchHalf), y0: S.roof, y1: S.parapetTop, t: 0.4 });
  parapet({ axis: "z", fixed: s * (faceX(0) - 0.2), from: S.zWestWall, to: S.zHekhalWall, y0: S.roof, y1: S.parapetTop, t: 0.4 });
}
parapet({ axis: "x", fixed: S.zWestWall + 0.2, from: -faceX(0), to: faceX(0), y0: S.roof, y1: S.parapetTop, t: 0.4 });

/* Slabs, floors, roofs, ceiling beams. */
export const SANCTUARY_SLABS: TaggedBox[] = [];
const slab = (min: Vec3, max: Vec3, group = "core") => SANCTUARY_SLABS.push({ min, max, group });

// Foundation (6 cubits) and floor.
slab([-S.porchHalf, 1.0, S.zPorchIn], [S.porchHalf, F - 0.16, S.zEast]);
slab([-S.bodyHalf, 1.0, S.zWest], [S.bodyHalf, F - 0.16, S.zPorchIn]);
// Cell floors and roofs.
for (const s of sides) {
  const group = s > 0 ? "north" : "core";
  for (let tier = 1; tier < 3; tier += 1) {
    const face = faceX(tier);
    slab([Math.min(s * face, s * CELL_EDGE), tierY[tier] - 0.4, S.zWestWall], [Math.max(s * face, s * CELL_EDGE), tierY[tier], S.zHekhalWall], group);
  }
  slab([Math.min(s * faceX(2), s * (s > 0 ? CELL_EDGE + 2.0 : S.bodyHalf)), S.cellsTop - 0.4, S.zWest], [Math.max(s * faceX(2), s * (s > 0 ? CELL_EDGE + 2.0 : S.bodyHalf)), S.cellsTop, S.zHekhalWall], s > 0 ? "north-roof" : "terrace");
}
for (let tier = 1; tier < 3; tier += 1) slab([-S.bodyHalf, tierY[tier] - 0.4, S.zRear], [S.bodyHalf, tierY[tier], S.zWestWall], "core");
slab([-S.bodyHalf, S.cellsTop - 0.4, S.zWest], [S.bodyHalf, S.cellsTop, S.zWestWall], "terrace");
// Hekhal ceiling / upper-chamber floor (1 cubit ornament + 2 gutter + 1 ceiling + 1 plaster), with two trapdoors above the Holy of Holies.
for (const box of slabWithHoles([-faceX(0), S.cellsTop, S.zWestWall], [faceX(0), S.upperFloor, S.zHekhalWall], [{ x0: -0.6, x1: 0.6, z0: -55.6, z1: -54.4 }, { x0: -0.6, x1: 0.6, z0: -58.6, z1: -57.4 }])) SANCTUARY_SLABS.push({ ...box, group: "upper" });
// Roofs: Porch and upper chamber at the 90-cubit datum.
slab([-S.porchHalf, S.roof - 0.4, S.zHekhalWall], [S.porchHalf, S.roof, S.zEast], "roof");
slab([-faceX(0), S.roof - 0.4, S.zWestWall], [faceX(0), S.roof, S.zHekhalWall], "roof");

/* Solid colliders derived from the wall specs (each keeps its vertical extent so upper levels stay walkable). */
export const SANCTUARY_COLLIDERS: PlanCollider[] = SANCTUARY_WALLS.filter((w) => w.collide !== false).flatMap(wallColliders);

/* Mesibah: the northern ascent to the cell terrace, modelled as a solid stair filling the 4-cubit channel between the cell wall and the outer wall. */
export const MESIBAH = { x0: CELL_EDGE + 2.0, x1: S.bodyHalf - 2.0, zStart: S.zHekhalWall - 3.3, zEnd: S.zWestWall, treads: 52 };
export const MESIBAH_TREAD = (MESIBAH.zStart - MESIBAH.zEnd) / MESIBAH.treads;
export const MESIBAH_STEPS: Box[] = Array.from({ length: MESIBAH.treads }, (_, i) => ({
  min: [MESIBAH.x0, F, MESIBAH.zStart - MESIBAH_TREAD * (i + 1)],
  max: [MESIBAH.x1, F + ((S.cellsTop - F) * (i + 1)) / MESIBAH.treads, MESIBAH.zStart - MESIBAH_TREAD * i],
}));

/* Cedar-lined stair from the cell terrace to the upper-chamber door on the south side. */
export const UPPER_STAIR = { xFar: -(S.hekhalHalf + S.wallThickness[0]) - 3.0, xNear: -(S.hekhalHalf + S.wallThickness[0]), z: -45, half: 0.8, treads: 5 };
export const UPPER_STAIR_STEPS: Box[] = Array.from({ length: UPPER_STAIR.treads }, (_, i) => {
  const run = (UPPER_STAIR.xNear - UPPER_STAIR.xFar) / UPPER_STAIR.treads;
  return {
    min: [UPPER_STAIR.xFar + run * i, S.cellsTop, UPPER_STAIR.z - UPPER_STAIR.half],
    max: [UPPER_STAIR.xNear, S.cellsTop + ((S.upperFloor - S.cellsTop) * (i + 1)) / UPPER_STAIR.treads, UPPER_STAIR.z + UPPER_STAIR.half],
  };
});
const TRAPDOORS = [{ z0: -55.6, z1: -54.4 }, { z0: -58.6, z1: -57.4 }];
SANCTUARY_COLLIDERS.push(...TRAPDOORS.map((h) => ({ minX: -0.6, maxX: 0.6, minZ: h.z0, maxZ: h.z1, y0: S.upperFloor - 0.6, y1: S.upperFloor + 1 })));

/** Walkable height of the upper levels (mesibah, terrace, upper chamber). Undefined when the point is not part of them. */
export function sanctuaryUpperHeightAt(x: number, z: number, currentY: number): number | undefined {
  if (z > S.zHekhalWall - 0.001 || z < S.zWest) return undefined;
  if (x >= MESIBAH.x0 && x <= MESIBAH.x1 && z <= MESIBAH.zStart) {
    const step = Math.min(MESIBAH.treads, Math.max(1, Math.floor((MESIBAH.zStart - z) / MESIBAH_TREAD) + 1));
    const ramp = F + ((S.cellsTop - F) * step) / MESIBAH.treads;
    if (currentY < S.cellsTop - 1.2 || z > S.zWestWall) return ramp;
  }
  if (currentY < S.cellsTop - 1.2) return undefined;
  if (Math.abs(x) < S.hekhalHalf && z >= S.zWestWall) return S.upperFloor;
  if (x >= UPPER_STAIR.xFar && x <= UPPER_STAIR.xNear && Math.abs(z - UPPER_STAIR.z) <= UPPER_STAIR.half) {
    const run = (UPPER_STAIR.xNear - UPPER_STAIR.xFar) / UPPER_STAIR.treads;
    const idx = Math.min(UPPER_STAIR.treads, Math.floor((x - UPPER_STAIR.xFar) / run) + 1);
    return S.cellsTop + ((S.upperFloor - S.cellsTop) * idx) / UPPER_STAIR.treads;
  }
  if (Math.abs(x) <= S.bodyHalf) return S.cellsTop;
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Solid-geometry helpers: carve voids (stairwells, tunnels, rooms) out of solid masses.  */
/* ------------------------------------------------------------------ */

export function subtractBox(solid: Box, hole: Box): Box[] {
  const overlaps = [0, 1, 2].every((i) => hole.min[i] < solid.max[i] - 1e-6 && hole.max[i] > solid.min[i] + 1e-6);
  if (!overlaps) return [solid];
  const out: Box[] = [];
  const rest: Box = { min: [...solid.min], max: [...solid.max] };
  for (const axis of [0, 2, 1] as const) {
    if (hole.min[axis] > rest.min[axis] + 1e-6) {
      const piece: Box = { min: [...rest.min], max: [...rest.max] };
      piece.max[axis] = hole.min[axis];
      out.push(piece);
      rest.min[axis] = hole.min[axis];
    }
    if (hole.max[axis] < rest.max[axis] - 1e-6) {
      const piece: Box = { min: [...rest.min], max: [...rest.max] };
      piece.min[axis] = hole.max[axis];
      out.push(piece);
      rest.max[axis] = hole.max[axis];
    }
  }
  return out;
}

export function carve(solids: Box[], voids: Box[]): Box[] {
  return voids.reduce((current, hole) => current.flatMap((solid) => subtractBox(solid, hole)), solids);
}

export const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Box => ({ min: [x0, y0, z0], max: [x1, y1, z1] });
