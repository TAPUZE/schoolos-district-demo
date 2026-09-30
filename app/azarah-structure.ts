import { AZARAH_ROOMS, AZARAH_WEST_Z, AZARAH_EAST_Z, CUBIT, OUTER_MOUNT_Y, PARVAH_ROOF_Y, PRIESTS_FLOOR_Y } from "./temple-layout";
import { box, carve, wallColliders } from "./temple-structure";
import type { Box, PlanCollider, WallSpec } from "./temple-structure";

/**
 * Azarah structure: perimeter wall, gatehouses with stairs down to the Mount, the six roofed chambers, the vaulted Hearth
 * hall with its four rooms, and the underground purity circuit reached from the north-west Hearth room (Middot 1:6-9).
 * Heights that the sources do not fix are interpretive and are labelled as such in the UI feature list.
 */
const P = PRIESTS_FLOOR_Y;
const M = OUTER_MOUNT_Y;
export const AZARAH_WALL_TOP = P + 6.08;
export const CHAMBER_WALL_TOP = P + 4.88;
export const CHAMBER_ROOF_Y = PARVAH_ROOF_Y;
export const CHAMBER_INNER_X = 27.0;
export const CHAMBER_OUTER_X = 35.4;
const RISE = 0.3375; // reconstructed equal risers across the current illustrative Mount datum
const STAIR_RUN = 0.5;

const wall = (spec: WallSpec): WallSpec => ({ group: "azarah", colliderY0: spec.group !== "hearth" && spec.y0 <= P + 0.01 ? M : undefined, ...spec });

/* ---------- gates ---------- */
export type Gate = { name: string; side: 1 | -1; z: number; xStart: number; half: number; hall?: boolean };
export const AZARAH_GATES: Gate[] = [
  { name: "Sparks Gate", side: 1, z: -34, xStart: 29.4, half: 2 },
  { name: "Offering Gate", side: 1, z: -40, xStart: 29.4, half: 2 },
  { name: "Kindling Gate", side: -1, z: -35, xStart: 29.4, half: 2 },
  { name: "First-Fruits Gate", side: -1, z: -41, xStart: 29.4, half: 2 },
  { name: "Water Gate", side: -1, z: -47, xStart: 29.4, half: 2 },
  { name: "Hel gate of the Hearth", side: 1, z: -52, xStart: 43.4, half: 1.5, hall: true },
];
if (AZARAH_GATES.length !== 6) throw new Error("Azarah must preserve six lateral gates; Nicanor is the seventh gate.");
export const WATER_GATE = AZARAH_GATES.find((gate) => gate.name === "Water Gate")!;
// Yoma 31a derives a minimum three-cubit water envelope above a twenty-cubit
// gate. The bath plan and roof construction are not preserved, so this datum
// remains a reviewable reconstruction rather than an architectural certainty.
// Basin floor datum: twenty cubits above the court. The modeled three-cubit
// water depth then reaches the minimum twenty-three-cubit level discussed in
// Yoma 31a; surrounding roof thickness is reconstructed separately.
export const WATER_GATE_ROOF_Y = P + 20 * CUBIT;
export const WATER_GATE_BATH_CENTER = [WATER_GATE.side * 28.2, WATER_GATE_ROOF_Y, WATER_GATE.z - 0.7] as const;
export const WATER_GATE_DRY_LANDING = [WATER_GATE.side * 28.2, P + 9.05, WATER_GATE.z + 2.15] as const;

/* ---------- Hearth hall ---------- */
export const HALL = { x0: 27.0, x1: 43.0, z0: -62.0, z1: -42.0, spring: P + 4, radius: 7.8, centerX: 34.8 };

/* ---------- underground ---------- */
export const YB = M - 4.05; // basement floor
export const YC = YB + 3.0; // basement ceiling
const TREAD = 0.38;
export const STAIR_A = { x0: 37.6, x1: 39.2, zTop: -57.0, treads: 11 };
export const STAIR_B = { x0: 39.6, x1: 41.2, zTop: -61.18, treads: 11 };
export const LANDING = { x0: 37.6, x1: 41.2, z0: -62.0, z1: STAIR_B.zTop };
export const CORRIDOR = { x0: 39.6, x1: 55.0, z0: -57.0, z1: -54.5 };
export const BATH = { x0: 42.0, x1: 48.0, z0: -53.7, z1: -48.0 };
export const BATH_DOOR = { x0: 44.2, x1: 45.6, z0: -54.5, z1: -53.7 };
export const PIT = { x0: 43.0, x1: 47.0, z0: -53.0, z1: -49.0, floor: -8.6 };
export const TOILET = { x0: 46.0, x1: 48.0, z0: -59.6, z1: -57.8 };
export const TOILET_DOOR = { x0: 46.6, x1: 47.8, z0: -57.8, z1: -57.0 };
export const FIRE_NOOK = { x0: 53.6, x1: 55.0, z0: -56.6, z1: -54.9 };
const B_TOP_Y = M;
const bTreadTop = (j: number) => B_TOP_Y - RISE * j;
const aTreadTop = (i: number) => P - RISE * i;
export const STAIR_A_STEPS: Box[] = Array.from({ length: STAIR_A.treads }, (_, k) => {
  const i = k + 1;
  return box(STAIR_A.x0, STAIR_A.x1, M, aTreadTop(i), STAIR_A.zTop - TREAD * i, STAIR_A.zTop - TREAD * (i - 1));
});
export const STAIR_B_STEPS: Box[] = Array.from({ length: STAIR_B.treads }, (_, k) => {
  const j = k + 1;
  return box(STAIR_B.x0, STAIR_B.x1, YB, bTreadTop(j), STAIR_B.zTop + TREAD * (j - 1), STAIR_B.zTop + TREAD * j);
});
const B_BOTTOM_Z = STAIR_B.zTop + TREAD * STAIR_B.treads;

/** Voids carved out of the Temple Mount masonry. */
export const UNDERGROUND_MOUNT_VOIDS: Box[] = [
  box(STAIR_B.x0, STAIR_B.x1, YB, M + 0.5, STAIR_B.zTop, B_BOTTOM_Z),
  box(CORRIDOR.x0, CORRIDOR.x1, YB, YC, CORRIDOR.z0, CORRIDOR.z1),
  box(BATH.x0, BATH.x1, YB, YC, BATH.z0, BATH.z1),
  box(BATH_DOOR.x0, BATH_DOOR.x1, YB, YB + 2.6, BATH_DOOR.z0, BATH_DOOR.z1),
  box(PIT.x0, PIT.x1, PIT.floor, YB, PIT.z0, PIT.z1),
  box(TOILET.x0, TOILET.x1, YB, YC, TOILET.z0, TOILET.z1),
  box(TOILET_DOOR.x0, TOILET_DOOR.x1, YB, YB + 2.6, TOILET_DOOR.z0, TOILET_DOOR.z1),
  ...[43.2, 47.6, 51.4].map((x) => box(x - 0.25, x + 0.25, YB + 1.3, YB + 1.9, CORRIDOR.z0 - 0.4, CORRIDOR.z0)),
];
export const MOUNT_BLOCK_BOX: Box = box(-100, 100, -9.05, M, -86, 114);
export const MOUNT_BLOCK: Box[] = carve([MOUNT_BLOCK_BOX], UNDERGROUND_MOUNT_VOIDS);
export const MOUNT_PLANE_HOLES = [{ x0: STAIR_B.x0, x1: STAIR_B.x1, z0: STAIR_B.zTop, z1: B_BOTTOM_Z }];

/* ---------- platforms (the Azarah terrace extended under the chambers and the Hearth) ---------- */
const CHAMBER_Z0 = -30.5;
const CHAMBER_Z1 = -0.5;
export const PLATFORM_BOXES: Box[] = [
  box(27, 36, M, P, CHAMBER_Z0, CHAMBER_Z1 + 0.1),
  box(-36, -27, M, P, CHAMBER_Z0, CHAMBER_Z1 + 0.1),
  ...carve([box(HALL.x0, 43.4, M, P, HALL.z0, HALL.z1)], [
    box(STAIR_A.x0, STAIR_A.x1, M, P + 1, STAIR_A.zTop - TREAD * STAIR_A.treads - 0.02, STAIR_A.zTop),
    box(LANDING.x0, LANDING.x1, M, -0.9, LANDING.z0, LANDING.z1 + 0.01),
    box(STAIR_B.x0, STAIR_B.x1, M, -0.9, STAIR_B.zTop, B_BOTTOM_Z),
  ]),
];

/* ---------- walls ---------- */
const chamberDoors = (side: 1 | -1) => AZARAH_ROOMS.filter((r) => Math.sign(r.x) === side).map((r) => ({ at: r.z, width: 3.4, height: 3.6 }));
export const AZARAH_WALLS: WallSpec[] = [
  wall({ axis: "x", fixed: AZARAH_WEST_Z + 0.6, from: -27.0, to: 27.0, y0: P - 0.05, y1: AZARAH_WALL_TOP, t: 1.2 }),
  wall({ axis: "z", fixed: 26.5, from: AZARAH_WEST_Z, to: AZARAH_EAST_Z, y0: 0, y1: AZARAH_WALL_TOP, t: 1.0, gaps: [...chamberDoors(1), ...AZARAH_GATES.filter((g) => g.side === 1 && !g.hall).map((g) => ({ at: g.z, width: g.half * 2, height: 8 })), { at: -52, width: 3, height: 3.6 }] }),
  wall({ axis: "z", fixed: -26.5, from: AZARAH_WEST_Z, to: AZARAH_EAST_Z, y0: 0, y1: AZARAH_WALL_TOP, t: 1.0, gaps: [...chamberDoors(-1), ...AZARAH_GATES.filter((g) => g.side === -1).map((g) => ({ at: g.z, width: g.half * 2, height: 8 }))] }),
];
// Chamber shells: outer wall, dividing walls, roof, parapet.
for (const s of [1, -1] as const) {
  AZARAH_WALLS.push(wall({ axis: "z", fixed: s * 35.0, from: CHAMBER_Z0, to: CHAMBER_Z1, y0: P, y1: CHAMBER_WALL_TOP, t: 0.8 }));
  for (const z of [-0.5, -10.5, -20.5, -30.5]) AZARAH_WALLS.push(wall({ axis: "x", fixed: z, from: Math.min(s * 26.5, s * 35.4), to: Math.max(s * 26.5, s * 35.4), y0: P, y1: CHAMBER_WALL_TOP, t: 0.4 }));
  AZARAH_WALLS.push(wall({ axis: "z", fixed: s * 35.2, from: CHAMBER_Z0 - 0.2, to: CHAMBER_Z1 + 0.2, y0: CHAMBER_ROOF_Y, y1: CHAMBER_ROOF_Y + 1.2, t: 0.3, group: "azarah-roof" }));
  for (const z of [CHAMBER_Z1 - 0.15, CHAMBER_Z0 + 0.15]) AZARAH_WALLS.push(wall({ axis: "x", fixed: z, from: Math.min(s * 26.6, s * 35.4), to: Math.max(s * 26.6, s * 35.4), y0: CHAMBER_ROOF_Y, y1: CHAMBER_ROOF_Y + 1.2, t: 0.3, group: "azarah-roof" }));
}
// Hearth hall: end walls, Hel gate wall, four corner rooms.
const hallGate = AZARAH_GATES.find((g) => g.hall)!;
AZARAH_WALLS.push(
  wall({ axis: "z", fixed: 43.0, from: HALL.z0, to: HALL.z1, y0: P, y1: HALL.spring, t: 0.8, gaps: [{ at: hallGate.z, width: 3, height: 3.6 }], group: "hearth" }),
  wall({ axis: "x", fixed: -61.6, from: HALL.x0, to: 43.4, y0: P, y1: HALL.spring, t: 0.8, group: "hearth" }),
  wall({ axis: "x", fixed: -42.4, from: HALL.x0, to: 43.4, y0: P, y1: HALL.spring, t: 0.8, group: "hearth" }),
);
const ROOM_H = 3.6;
export type HearthRoom = { name: string; x0: number; x1: number; z0: number; z1: number; doorX: number; doorZ: number };
export const HEARTH_ROOMS: HearthRoom[] = [
  { name: "Lamb chamber (SW)", x0: 27.0, x1: 32.6, z0: -61.2, z1: -55.6, doorX: 29.8, doorZ: -55.6 },
  { name: "Showbread makers (SE)", x0: 27.0, x1: 32.6, z0: -48.4, z1: -42.8, doorX: 29.8, doorZ: -48.4 },
  { name: "Descent to immersion (NW)", x0: 37.0, x1: 42.6, z0: -61.2, z1: -55.6, doorX: 41.9, doorZ: -55.6 },
  { name: "Altar stones / seals (NE)", x0: 37.0, x1: 42.6, z0: -48.4, z1: -42.8, doorX: 39.8, doorZ: -48.4 },
];
for (const room of HEARTH_ROOMS) {
  const innerX = room.x0 < 30 ? room.x1 : room.x0;
  AZARAH_WALLS.push(
    wall({ axis: "z", fixed: innerX, from: room.z0, to: room.z1, y0: P, y1: P + ROOM_H, t: 0.4, group: "hearth" }),
    wall({ axis: "x", fixed: room.doorZ, from: room.x0, to: room.x1, y0: P, y1: P + ROOM_H, t: 0.4, gaps: [{ at: room.doorX, width: 1.4, height: 2.6 }], group: "hearth" }),
  );
}
export const HEARTH_ROOM_ROOFS: Box[] = HEARTH_ROOMS.map((r) => box(r.x0, r.x1, P + ROOM_H, P + ROOM_H + 0.3, r.z0, r.z1));
// Rails around the top of the stair well so it cannot be entered from the side.
const railBox = (x0: number, x1: number, z0: number, z1: number): PlanCollider => ({ minX: x0, maxX: x1, minZ: z0, maxZ: z1, y0: P - 0.05, y1: P + 1.0 });
const STAIR_A_END_Z = STAIR_A.zTop - TREAD * STAIR_A.treads;
export const HEARTH_RAILS: Box[] = [
  box(STAIR_A.x0 - 0.15, STAIR_A.x0, P, P + 0.9, STAIR_A_END_Z - 0.02, STAIR_A.zTop),
  box(STAIR_A.x1, STAIR_A.x1 + 0.15, P, P + 0.9, STAIR_A_END_Z - 0.02, STAIR_A.zTop),
  box(STAIR_A.x0 - 0.15, STAIR_A.x1 + 0.15, P, P + 0.9, STAIR_A_END_Z - 0.17, STAIR_A_END_Z - 0.02),
];

/* ---------- gatehouse blocks and outside stairs ---------- */
export const GATE_STEP_COUNT = 12;
export const gateStepBoxes = (gate: Gate): Box[] => Array.from({ length: GATE_STEP_COUNT }, (_, k) => {
  const x0 = gate.xStart + STAIR_RUN * k;
  const x1 = x0 + STAIR_RUN;
  return box(Math.min(gate.side * x0, gate.side * x1), Math.max(gate.side * x0, gate.side * x1), M, P - RISE * (k + 1), gate.z - gate.half, gate.z + gate.half);
});
export const GATE_BLOCKS: Box[] = AZARAH_GATES.filter((g) => !g.hall).flatMap((g) => {
  const span = (a: number, b: number): [number, number] => [Math.min(g.side * a, g.side * b), Math.max(g.side * a, g.side * b)];
  const [bx0, bx1] = span(27.0, 29.4);
  const [vx0, vx1] = span(26.0, 30.0);
  const voids = [box(vx0, vx1, P, P + 20 * CUBIT, g.z - g.half, g.z + g.half)];
  if (g.name === "Water Gate") {
    voids.push(box(-29.65, -26.75, WATER_GATE_ROOF_Y, P + 9.01, g.z - 2.35, g.z + 0.95));
  }
  return carve([box(bx0, bx1, M, P + 9, g.z - 3, g.z + 3)], voids);
});

/* ---------- chamber roofs ---------- */
export const PARVAH = AZARAH_ROOMS.find((r) => r.name === "Parvah Chamber")!;
export const WASHERS = AZARAH_ROOMS.find((r) => r.name === "Washers' Chamber")!;
// Middot 5:3 explicitly starts the winding ascent in the Washers' Chamber and
// ends it on Parvah's roof. Its precise turns are reconstructed here, but its
// room of origin is not optional.
export const PARVAH_STAIR = { x0: 33.2, x1: 34.6, zBottom: WASHERS.z + 4.4, run: 0.7, treads: 12 };
const parvahTop = (k: number) => P + ((CHAMBER_ROOF_Y - P) * k) / PARVAH_STAIR.treads;
export const PARVAH_STAIR_STEPS: Box[] = Array.from({ length: PARVAH_STAIR.treads }, (_, i) => {
  const k = i + 1;
  return box(PARVAH_STAIR.x0, PARVAH_STAIR.x1, P, parvahTop(k), PARVAH_STAIR.zBottom - PARVAH_STAIR.run * k, PARVAH_STAIR.zBottom - PARVAH_STAIR.run * (k - 1));
});
const PARVAH_HOLE = box(PARVAH_STAIR.x0, PARVAH_STAIR.x1, CHAMBER_ROOF_Y - 0.6, CHAMBER_ROOF_Y + 0.1, PARVAH_STAIR.zBottom - PARVAH_STAIR.run * PARVAH_STAIR.treads, PARVAH_STAIR.zBottom - PARVAH_STAIR.run * 6);
export const CHAMBER_ROOFS: Box[] = [
  ...carve([box(27.0, 35.4, CHAMBER_WALL_TOP, CHAMBER_ROOF_Y, CHAMBER_Z0, CHAMBER_Z1)], [PARVAH_HOLE]),
  box(-35.4, -27.0, CHAMBER_WALL_TOP, CHAMBER_ROOF_Y, CHAMBER_Z0, CHAMBER_Z1),
];

const parvahStairStartsInWashers = PARVAH_STAIR.zBottom <= WASHERS.z + 5 && PARVAH_STAIR.zBottom >= WASHERS.z - 5;
if (!parvahStairStartsInWashers) throw new Error("Parvah roof stair must begin in the Washers' Chamber (Middot 5:3).");

/* ---------- colliders ---------- */
const boxCollider = (b: Box): PlanCollider => ({ minX: b.min[0], maxX: b.max[0], minZ: b.min[2], maxZ: b.max[2], y0: b.min[1], y1: b.max[1] });
export const AZARAH_COLLIDERS: PlanCollider[] = [
  ...AZARAH_WALLS.flatMap(wallColliders),
  ...AZARAH_GATES.filter((g) => !g.hall).flatMap((g) => [
    boxCollider(box(Math.min(g.side * 27.0, g.side * 29.4), Math.max(g.side * 27.0, g.side * 29.4), M, P + 9, g.z - 3, g.z - g.half)),
    boxCollider(box(Math.min(g.side * 27.0, g.side * 29.4), Math.max(g.side * 27.0, g.side * 29.4), M, P + 9, g.z + g.half, g.z + 3)),
  ]),
  railBox(STAIR_A.x0 - 0.15, STAIR_A.x0, STAIR_A_END_Z - 0.17, STAIR_A.zTop),
  railBox(STAIR_A.x1, STAIR_A.x1 + 0.15, STAIR_A_END_Z - 0.17, STAIR_A.zTop),
  railBox(STAIR_A.x0 - 0.15, STAIR_A.x1 + 0.15, STAIR_A_END_Z - 0.17, STAIR_A_END_Z - 0.02),
  // Hall fitments: sleeping ledges, fire, key slab.
  // Edges of the raised platforms, felt only by visitors walking on the Mount below them.
  { minX: 36.0, maxX: 36.1, minZ: CHAMBER_Z0 - 0.1, maxZ: CHAMBER_Z1 + 0.1, y0: M, y1: P },
  { minX: -36.1, maxX: -36.0, minZ: CHAMBER_Z0 - 0.1, maxZ: CHAMBER_Z1 + 0.1, y0: M, y1: P },
  { minX: 26.9, maxX: 36.1, minZ: CHAMBER_Z0 - 0.1, maxZ: CHAMBER_Z0, y0: M, y1: P },
  { minX: -36.1, maxX: -26.9, minZ: CHAMBER_Z0 - 0.1, maxZ: CHAMBER_Z0, y0: M, y1: P },
  { minX: 26.9, maxX: 36.1, minZ: CHAMBER_Z1 + 0.1, maxZ: CHAMBER_Z1 + 0.2, y0: M, y1: P },
  { minX: -36.1, maxX: -26.9, minZ: CHAMBER_Z1 + 0.1, maxZ: CHAMBER_Z1 + 0.2, y0: M, y1: P },
  { minX: 43.4, maxX: 43.5, minZ: HALL.z0, maxZ: -53.5, y0: M, y1: P },
  { minX: 43.4, maxX: 43.5, minZ: -50.5, maxZ: HALL.z1, y0: M, y1: P },
  { minX: 26.9, maxX: 43.5, minZ: HALL.z0 - 0.1, maxZ: HALL.z0, y0: M, y1: P },
  { minX: 26.9, maxX: 43.5, minZ: HALL.z1, maxZ: HALL.z1 + 0.1, y0: M, y1: P },
  // Parvah stair well (closed by the roof except above the top six treads).
  { minX: PARVAH_STAIR.x1, maxX: PARVAH_STAIR.x1 + 0.2, minZ: PARVAH_STAIR.zBottom - PARVAH_STAIR.run * PARVAH_STAIR.treads, maxZ: PARVAH_STAIR.zBottom - PARVAH_STAIR.run * 6, y0: CHAMBER_ROOF_Y, y1: CHAMBER_ROOF_Y + 1 },
];

/* ---------- walkable surfaces ---------- */
const inRect = (r: { x0: number; x1: number; z0: number; z1: number }, x: number, z: number, inset = 0) => x >= r.x0 + inset && x <= r.x1 - inset && z >= r.z0 + inset && z <= r.z1 - inset;

/** True when the point is inside a walkable part of the underground / stair-well complex. */
function undergroundOpen(x: number, z: number, y: number): boolean {
  const stairZ0 = STAIR_A.zTop - TREAD * STAIR_A.treads;
  const shaftBand = inRect({ x0: 37.0, x1: 41.8, z0: -62.4, z1: -56.8 }, x, z);
  if (y > -3.5) {
    if (!shaftBand || y > P - 0.55) return true;
    return inRect({ x0: STAIR_A.x0, x1: STAIR_A.x1, z0: stairZ0, z1: STAIR_A.zTop + 0.2 }, x, z, 0.15)
      || inRect(LANDING, x, z, 0.15)
      || inRect({ x0: STAIR_B.x0, x1: STAIR_B.x1, z0: STAIR_B.zTop, z1: B_BOTTOM_Z }, x, z, 0.15);
  }
  const inPit = inRect(PIT, x, z, -0.2);
  if (inPit) return false;
  return inRect({ x0: STAIR_B.x0, x1: STAIR_B.x1, z0: STAIR_B.zTop, z1: B_BOTTOM_Z }, x, z, 0.15)
    || inRect(CORRIDOR, x, z, 0.3)
    || inRect(BATH, x, z, 0.3)
    || inRect(BATH_DOOR, x, z, 0.1)
    || inRect(TOILET, x, z, 0.3)
    || inRect(TOILET_DOOR, x, z, 0.1);
}

export function azarahBlocked(x: number, z: number, y: number): boolean {
  return !undergroundOpen(x, z, y);
}

export function gateStairHeightAt(x: number, z: number): number | undefined {
  for (const gate of AZARAH_GATES) {
    if (Math.abs(z - gate.z) > gate.half) continue;
    const distance = (x * gate.side) - gate.xStart;
    if (distance < 0 || distance > STAIR_RUN * GATE_STEP_COUNT) continue;
    const k = Math.min(GATE_STEP_COUNT, Math.floor(distance / STAIR_RUN) + 1);
    return P - RISE * k;
  }
  return undefined;
}

/** Surface height for Azarah-specific features, or undefined to fall back to the court heights. */
export function azarahHeightAt(x: number, z: number, y: number): number | undefined {
  // Underground and stair well.
  if (y < P - 0.4) {
    if (inRect({ x0: STAIR_B.x0, x1: STAIR_B.x1, z0: STAIR_B.zTop, z1: B_BOTTOM_Z }, x, z) && y < -0.5) {
      const j = Math.min(12, Math.max(1, Math.floor((z - STAIR_B.zTop) / TREAD) + 1));
      return j >= 12 ? YB : bTreadTop(j);
    }
    if (inRect(LANDING, x, z) && y < -0.5) return M;
    if (y < -3.5 && (inRect(CORRIDOR, x, z) || inRect(BATH, x, z) || inRect(BATH_DOOR, x, z) || inRect(TOILET, x, z) || inRect(TOILET_DOOR, x, z))) return YB;
  }
  if (inRect({ x0: STAIR_A.x0, x1: STAIR_A.x1, z0: STAIR_A.zTop - TREAD * STAIR_A.treads, z1: STAIR_A.zTop }, x, z) && y > -3.3) {
    const i = Math.min(STAIR_A.treads, Math.max(1, Math.floor((STAIR_A.zTop - z) / TREAD) + 1));
    return aTreadTop(i);
  }
  // Chamber roofs and the Parvah stair.
  const onChamberRow = z >= CHAMBER_Z0 && z <= CHAMBER_Z1 && Math.abs(x) >= CHAMBER_INNER_X && Math.abs(x) <= CHAMBER_OUTER_X;
  if (onChamberRow) {
    if (x > 0 && x >= PARVAH_STAIR.x0 && x <= PARVAH_STAIR.x1 && z <= PARVAH_STAIR.zBottom && z >= PARVAH_STAIR.zBottom - PARVAH_STAIR.run * PARVAH_STAIR.treads) {
      const k = Math.min(PARVAH_STAIR.treads, Math.max(1, Math.floor((PARVAH_STAIR.zBottom - z) / PARVAH_STAIR.run) + 1));
      const beneathRoof = z > PARVAH_STAIR.zBottom - PARVAH_STAIR.run * 6;
      if (!(beneathRoof && y > CHAMBER_WALL_TOP - 0.6)) return parvahTop(k);
    }
    if (y > CHAMBER_WALL_TOP - 0.7) return CHAMBER_ROOF_Y;
    return P;
  }
  // Gate stairs.
  const stair = gateStairHeightAt(x, z);
  if (stair !== undefined) return stair;
  // Hearth hall floor.
  if (x >= HALL.x0 && x <= 43.4 && z >= HALL.z0 && z <= HALL.z1) return P;
  return undefined;
}
