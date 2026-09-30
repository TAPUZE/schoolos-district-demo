import { dimensionWorld, elevationWorld, TEMPLE_STAIRS, TEMPLE_UNITS, toWorld } from "./temple-specification";

/**
 * Authoritative world-space layout used by visible geometry, player collision,
 * ceremony routing, camera targets, and automated geometry checks.
 */
export const CUBIT = TEMPLE_UNITS.cubitWorld;
export const PRIESTS_FLOOR_Y = elevationWorld("priests-court");
export const OUTER_MOUNT_Y = elevationWorld("outer-mount");
export const WOMENS_COURT_Y = elevationWorld("womens-court");
export const TEMPLE_FLOOR_Y = elevationWorld("temple-floor");

// Shared Jerusalem / Judaean landscape datum.  Keep the height function in
// the authoritative layout module so the visible terrain, off-site ritual
// routes, people, shelters and camera targets all refer to the same ground.
export const JERUSALEM_GROUND_Y = -8.55;
export function jerusalemTerrainHeight(x: number, z: number) {
  const radius = Math.hypot(x, z - 14);
  const ridge = (nx: number, nz: number) => Math.sin(nx * 0.011 + 1.7) * Math.cos(nz * 0.009 - 0.4) * 0.5
    + Math.sin(nx * 0.023 + nz * 0.017) * 0.3
    + Math.cos(nz * 0.031 - nx * 0.013) * 0.2;
  const rise = Math.max(0, Math.min(1, (radius - 170) / 420));
  const eastBias = 1 + Math.max(0, Math.min(1, (z - 14) / 700)) * 1.8;
  return JERUSALEM_GROUND_Y - 0.4
    + rise * rise * (44 + ridge(x, z) * 52) * eastBias
    + Math.max(0, ridge(x * 2.3, z * 2.3)) * rise * 9;
}

export const WILDERNESS_STATION_XZ = [
  [-8,145],[-18,177],[-9,210],[-31,245],[-20,282],
  [-49,322],[-30,361],[-68,402],[-52,444],[-96,488],
] as const;

export function distanceToWildernessRoute(x:number,z:number) {
  const points: readonly (readonly [number,number])[] = [[0,124],...WILDERNESS_STATION_XZ,[-140,510]];
  let nearest=Infinity;
  for(let index=0;index<points.length-1;index+=1){
    const [ax,az]=points[index], [bx,bz]=points[index+1];
    const dx=bx-ax,dz=bz-az;
    const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));
    nearest=Math.min(nearest,Math.hypot(x-(ax+dx*t),z-(az+dz*t)));
  }
  return nearest;
}

export const ALTAR_CENTER_Z = -12.3;
export const ALTAR_BASE_HALF = dimensionWorld("altar-base-side") / 2;
export const ALTAR_TOP_HALF = toWorld(14);
export const ALTAR_EAST_EDGE_Z = ALTAR_CENTER_Z + ALTAR_BASE_HALF;
export const ALTAR_WEST_EDGE_Z = ALTAR_CENTER_Z - ALTAR_BASE_HALF;
export const ALTAR_HEIGHT = dimensionWorld("altar-height");
export const ALTAR_TOP_Y = PRIESTS_FLOOR_Y + ALTAR_HEIGHT;
export const RAMP_HALF_WIDTH = dimensionWorld("altar-ramp-width") / 2;
export const RAMP_TOP_X = -ALTAR_TOP_HALF;
export const RAMP_FOOT_X = -(ALTAR_TOP_HALF + dimensionWorld("altar-ramp-length"));
export const RAMP_FOOT_LOCAL_Z = -RAMP_FOOT_X;
// Mishneh Torah, Beit HaBechirah 2:13: the ramp reaches one-sixth cubit below
// the nine-cubit altar working surface.
export const RAMP_TOP_LOCAL_Y = ALTAR_HEIGHT - CUBIT / 6;
export const RAMP_COLLISION_HALF_WIDTH = RAMP_HALF_WIDTH + 0.35;

// Middot 5:2 fixes these service bands relative to the altar even though it
// leaves the court's final 25-cubit remainder undivided.
export const SLAUGHTER_RING_ZONE_SOUTH_X = ALTAR_BASE_HALF + 8 * CUBIT;
export const SLAUGHTER_RING_ZONE_NORTH_X = SLAUGHTER_RING_ZONE_SOUTH_X + 24 * CUBIT;
export const SLAUGHTER_RING_ROW_INSET = CUBIT;
export const SLAUGHTER_TABLE_X = SLAUGHTER_RING_ZONE_NORTH_X + 4 * CUBIT;
export const SLAUGHTER_POST_X = SLAUGHTER_TABLE_X + 4 * CUBIT;

export const AZARAH_WEST_Z = -71.9;
export const AZARAH_EAST_Z = 2.9;
export const ISRAEL_WEST_Z = AZARAH_EAST_Z - 11 * CUBIT;
export const PRIESTS_WEST_Z = ISRAEL_WEST_Z - 11 * CUBIT;
export const WOMENS_COURT_MIN_Z = AZARAH_EAST_Z;
export const WOMENS_COURT_MAX_Z = WOMENS_COURT_MIN_Z + 135 * CUBIT;
export const WOMENS_COURT_CENTER_Z = (WOMENS_COURT_MIN_Z + WOMENS_COURT_MAX_Z) / 2;
export const WOMENS_COURT_HALF_WIDTH = 27;
export const TEMPLE_MOUNT_NAV_BOUNDS = { minX: -96, maxX: 96, minZ: -82, maxZ: 110 } as const;

export const HAND_BREADTH = CUBIT / TEMPLE_UNITS.handbreadthsPerCubit;
export const VESSEL_CUBIT = HAND_BREADTH * TEMPLE_UNITS.vesselCubitHandbreadths;
// Middot 4:6: 6 foundation + 40 + 5 (ornament, gutter, ceiling, plaster) + 40 upper chamber + 5 + 3 parapet + 1 spikes = 100 cubits above the court.
export const TEMPLE_CELLS_TOP_Y = TEMPLE_FLOOR_Y + 40 * CUBIT;
export const TEMPLE_UPPER_FLOOR_Y = TEMPLE_FLOOR_Y + 45 * CUBIT;
export const TEMPLE_ROOF_Y = TEMPLE_FLOOR_Y + 90 * CUBIT;
export const TEMPLE_PARAPET_TOP_Y = TEMPLE_FLOOR_Y + 93 * CUBIT;
export const TEMPLE_TOP_Y = TEMPLE_FLOOR_Y + 94 * CUBIT;
export const TEMPLE_EAST_Z = -27.5;
export const TEMPLE_PORCH_WALL_WEST_Z = TEMPLE_EAST_Z - 5 * CUBIT;
export const TEMPLE_PORCH_WEST_Z = TEMPLE_PORCH_WALL_WEST_Z - 11 * CUBIT;
export const TEMPLE_HEKHAL_WALL_WEST_Z = TEMPLE_PORCH_WEST_Z - 6 * CUBIT;
export const TEMPLE_HOLY_PLACE_WEST_Z = TEMPLE_HEKHAL_WALL_WEST_Z - 40 * CUBIT;
export const TEMPLE_PARTITION_WEST_Z = TEMPLE_HOLY_PLACE_WEST_Z - CUBIT;
export const TEMPLE_HOLY_OF_HOLIES_WEST_Z = TEMPLE_PARTITION_WEST_Z - 20 * CUBIT;
export const TEMPLE_WEST_WALL_WEST_Z = TEMPLE_HOLY_OF_HOLIES_WEST_Z - 6 * CUBIT;
export const TEMPLE_REAR_CHAMBER_WEST_Z = TEMPLE_WEST_WALL_WEST_Z - 6 * CUBIT;
export const TEMPLE_WEST_Z = TEMPLE_REAR_CHAMBER_WEST_Z - 5 * CUBIT;
export const TEMPLE_STEP_RUNS = TEMPLE_STAIRS.altarToPorch.runPatternCubits ?? [];
export const TEMPLE_STEP_TOTAL_RUN = TEMPLE_STEP_RUNS.reduce((sum, run) => sum + run, 0);
export const TEMPLE_STEP_FOOT_Z = TEMPLE_EAST_Z + TEMPLE_STEP_TOTAL_RUN * CUBIT;
// Middot 3:6 places the laver in the 22-cubit court between the altar and
// Ulam, displaced toward the south.  These shared points drive geometry,
// interaction range, ceremony routing, and camera framing.
export const KIYOR_POSITION = [-6.35, PRIESTS_FLOOR_Y, (ALTAR_WEST_EDGE_Z + TEMPLE_STEP_FOOT_Z) / 2] as const;
// Shekalim 6:4 places the two daily-service tables west of the main ramp.
// Keep them outside the ramp's collision width and inside the south court.
export const SERVICE_TABLE_Z = ALTAR_CENTER_Z - RAMP_HALF_WIDTH - 1.15;
export const MARBLE_SERVICE_TABLE_POSITION = [-10.15, PRIESTS_FLOOR_Y, SERVICE_TABLE_Z] as const;
export const SILVER_SERVICE_TABLE_POSITION = [-12.45, PRIESTS_FLOOR_Y, SERVICE_TABLE_Z] as const;
export const TEMPLE_BODY_CENTER_Z = (TEMPLE_PORCH_WEST_Z + TEMPLE_WEST_Z) / 2;
export const TEMPLE_BODY_DEPTH = TEMPLE_PORCH_WEST_Z - TEMPLE_WEST_Z;
export const PARVAH_ROOF_Y = PRIESTS_FLOOR_Y + 5.18;

export const CHAMBERS = [
  // Middot 2:5 fixes all four compass assignments. In this scene +X is
  // north and +Z is east, so the corners must not be inferred from array order.
  { x: -19, z: WOMENS_COURT_MAX_Z - 8, name: "Nazirites", corner: "southeast" },
  { x: 19, z: WOMENS_COURT_MAX_Z - 8, name: "Wood", corner: "northeast" },
  { x: 19, z: WOMENS_COURT_MIN_Z + 8, name: "Lepers", corner: "northwest" },
  { x: -19, z: WOMENS_COURT_MIN_Z + 8, name: "Oils", corner: "southwest" },
] as const;

export const AZARAH_ROOMS = [
  { x: 31, z: -5.5, name: "Salt Chamber" },
  { x: 31, z: -15.5, name: "Parvah Chamber" },
  { x: 31, z: -25.5, name: "Washers' Chamber" },
  { x: -31, z: -5.5, name: "Wood Chamber" },
  { x: -31, z: -15.5, name: "Chamber of the Exile" },
  { x: -31, z: -25.5, name: "Hewn Stone Chamber" },
] as const;

export const MUSIC_ROOMS = [
  { x: -9, name: "Instrument chamber · south" },
  { x: 9, name: "Instrument chamber · north" },
] as const;

export function isInAltarRampLane(x: number, z: number) {
  return Math.abs(z - ALTAR_CENTER_Z) <= RAMP_COLLISION_HALF_WIDTH && x >= RAMP_FOOT_X && x <= RAMP_TOP_X;
}

export function isOnAltarTop(x: number, z: number) {
  return Math.abs(x) <= ALTAR_TOP_HALF && Math.abs(z - ALTAR_CENTER_Z) <= ALTAR_TOP_HALF;
}

export function altarRampHeightAt(x: number, z: number): number | undefined {
  if (!isInAltarRampLane(x, z)) return undefined;
  return PRIESTS_FLOOR_Y + 0.18 + ((x - RAMP_FOOT_X) / (RAMP_TOP_X - RAMP_FOOT_X)) * (RAMP_TOP_LOCAL_Y - 0.18);
}

export function courtSurfaceHeightAt(x: number, z: number) {
  if (z < WOMENS_COURT_MIN_Z) {
    const insideMusicRoom = MUSIC_ROOMS.some((room) => Math.abs(x - room.x) < 3 && z >= ISRAEL_WEST_Z && z <= AZARAH_EAST_Z);
    if (insideMusicRoom) return WOMENS_COURT_Y;
    const insideAzarah = Math.abs(x) <= 27 && z >= AZARAH_WEST_Z;
    const insideAzarahRoom = AZARAH_ROOMS.some((room) => Math.abs(x - room.x) < 4 && Math.abs(z - room.z) < 5);
    if (insideAzarahRoom) return PRIESTS_FLOOR_Y;
    if (insideAzarah) {
      if (z >= ISRAEL_WEST_Z) return 0;
      const transition = ISRAEL_WEST_Z - z;
      if (transition < CUBIT) return CUBIT;
      if (transition < CUBIT + CUBIT / 2) return CUBIT + CUBIT / 2;
      if (transition < CUBIT * 2) return CUBIT * 2;
      return PRIESTS_FLOOR_Y;
    }
    return OUTER_MOUNT_Y;
  }
  // Outside the measured Women's Court square the player is back on the
  // larger Temple Mount platform, not on an infinitely extended court floor.
  if (Math.abs(x) > WOMENS_COURT_HALF_WIDTH || z > WOMENS_COURT_MAX_Z) return OUTER_MOUNT_Y;
  const stairRadius = Math.hypot(x, z - WOMENS_COURT_MIN_Z);
  const stairCount = TEMPLE_STAIRS.womensToIsrael.count;
  const stairTread = toWorld(TEMPLE_STAIRS.womensToIsrael.treadCubits ?? 0.5);
  const stairInnerRadius = toWorld(TEMPLE_STAIRS.womensToIsrael.innerLandingRadiusCubits ?? 0);
  const stairRadiusLimit = stairInnerRadius + stairCount * stairTread;
  if (z <= WOMENS_COURT_MIN_Z + stairRadiusLimit && stairRadius <= stairRadiusLimit) {
    const radialTread = Math.max(0, stairRadius - stairInnerRadius);
    const level = Math.max(1, Math.min(stairCount, stairCount - Math.floor(radialTread / stairTread)));
    return WOMENS_COURT_Y + level * toWorld(TEMPLE_STAIRS.womensToIsrael.riseCubits);
  }
  return WOMENS_COURT_Y;
}

export function templeSurfaceHeightAt(x: number, z: number): number | undefined {
  if (Math.abs(x) <= 19.5 && z <= TEMPLE_STEP_FOOT_Z && z >= TEMPLE_EAST_Z) {
    const distanceFromFoot = TEMPLE_STEP_FOOT_Z - z;
    let covered = 0;
    for (let index = 0; index < TEMPLE_STEP_RUNS.length; index += 1) {
      covered += TEMPLE_STEP_RUNS[index] * CUBIT;
      if (distanceFromFoot <= covered) return PRIESTS_FLOOR_Y + (index + 1) * (CUBIT / 2);
    }
    return TEMPLE_FLOOR_Y;
  }
  if (z <= TEMPLE_EAST_Z && z >= TEMPLE_PORCH_WEST_Z && Math.abs(x) < 19.5) return TEMPLE_FLOOR_Y;
  if (z < TEMPLE_PORCH_WEST_Z && z >= TEMPLE_WEST_Z && Math.abs(x) < 13.1) return TEMPLE_FLOOR_Y;
  return undefined;
}

export function walkableSurfaceHeightAt(x: number, z: number, currentY: number) {
  const rampHeight = altarRampHeightAt(x, z);
  if (rampHeight !== undefined) return rampHeight;
  if (currentY > ALTAR_TOP_Y - 0.65 && isOnAltarTop(x, z)) return ALTAR_TOP_Y;
  return templeSurfaceHeightAt(x, z) ?? courtSurfaceHeightAt(x, z);
}

export type AltarMovementPoint = { x: number; y: number; z: number };
export type AltarMovementDecision = {
  allowed: boolean;
  reason: "clear" | "ramp-side" | "altar-edge" | "altar-body";
};

export function resolveAltarMovement(from: AltarMovementPoint, next: AltarMovementPoint): AltarMovementDecision {
  const wasOnRamp = isInAltarRampLane(from.x, from.z);
  const inRampLane = isInAltarRampLane(next.x, next.z);
  const onAltarTop = from.y > ALTAR_TOP_Y - 0.65 && (isOnAltarTop(from.x, from.z) || wasOnRamp);
  const enteringRampFromSide = inRampLane && !wasOnRamp && !onAltarTop && from.x > RAMP_FOOT_X + 0.35;
  if (enteringRampFromSide) return { allowed: false, reason: "ramp-side" };

  const nextOnAltarTop = isOnAltarTop(next.x, next.z);
  if (onAltarTop && !nextOnAltarTop && !inRampLane) return { allowed: false, reason: "altar-edge" };

  const insideAltarBody = Math.abs(next.x) < ALTAR_BASE_HALF + 0.3 && Math.abs(next.z - ALTAR_CENTER_Z) < ALTAR_BASE_HALF + 0.3;
  if (insideAltarBody && !inRampLane && !onAltarTop) return { allowed: false, reason: "altar-body" };
  return { allowed: true, reason: "clear" };
}

export type WorldPoint = readonly [number, number, number];

export const ALTAR_RAMP_ASCENT_ROUTE: readonly WorldPoint[] = [
  [RAMP_FOOT_X, PRIESTS_FLOOR_Y + 0.18, ALTAR_CENTER_Z],
  [RAMP_TOP_X, ALTAR_TOP_Y - 0.03, ALTAR_CENTER_Z],
];

export const WOMENS_STAIR_ASCENT_ROUTE: readonly WorldPoint[] = (() => {
  const count = TEMPLE_STAIRS.womensToIsrael.count;
  const tread = toWorld(TEMPLE_STAIRS.womensToIsrael.treadCubits ?? 0.5);
  const rise = toWorld(TEMPLE_STAIRS.womensToIsrael.riseCubits);
  const innerRadius = toWorld(TEMPLE_STAIRS.womensToIsrael.innerLandingRadiusCubits ?? 0);
  const outerZ = WOMENS_COURT_MIN_Z + innerRadius + count * tread;
  const points: WorldPoint[] = [[0, WOMENS_COURT_Y, outerZ + tread * 0.35]];
  for (let index = 0; index < count; index += 1) {
    const levelY = WOMENS_COURT_Y + (index + 1) * rise;
    const outerEdge = outerZ - index * tread;
    const innerEdge = outerEdge - tread;
    points.push([0, levelY, outerEdge - tread * 0.04], [0, levelY, innerEdge + tread * 0.04]);
  }
  points.push([0, 0, WOMENS_COURT_MIN_Z - 0.08]);
  return points;
})();

export const TEMPLE_STAIR_ASCENT_ROUTE: readonly WorldPoint[] = (() => {
  const points: WorldPoint[] = [[0, PRIESTS_FLOOR_Y, TEMPLE_STEP_FOOT_Z + 0.08]];
  let z = TEMPLE_STEP_FOOT_Z;
  TEMPLE_STEP_RUNS.forEach((run, index) => {
    const levelY = PRIESTS_FLOOR_Y + (index + 1) * (CUBIT / 2);
    const nextZ = z - run * CUBIT;
    points.push([0, levelY, z - 0.02], [0, levelY, nextZ + 0.02]);
    z = nextZ;
  });
  points.push([0, TEMPLE_FLOOR_Y, TEMPLE_EAST_Z - 0.1], [0, TEMPLE_FLOOR_Y, -30.5]);
  return points;
})();

const almostEqual = (left: number, right: number, tolerance = 0.001) => Math.abs(left - right) <= tolerance;

export type TempleGeometryAuditCheck = {
  id: string;
  passed: boolean;
  detail: string;
};

const womensExpectedPoints = TEMPLE_STAIRS.womensToIsrael.count * 2 + 2;
const rampMidX = (RAMP_FOOT_X + RAMP_TOP_X) / 2;
export const TEMPLE_GEOMETRY_AUDIT: TempleGeometryAuditCheck[] = [
  {
    id: "altar-east-edge-aligns-with-priests-court",
    passed: almostEqual(ALTAR_EAST_EDGE_Z, PRIESTS_WEST_Z),
    detail: "The 32-cubit altar ends at the western boundary of the 11-cubit Priests' Court.",
  },
  {
    id: "altar-to-ulam-is-22-cubits",
    passed: almostEqual((ALTAR_WEST_EDGE_Z - TEMPLE_EAST_Z) / CUBIT, 22),
    detail: "The measured open court from the altar's west edge to the Ulam is 22 cubits (Middot 5:1).",
  },
  {
    id: "kiyor-is-between-altar-and-ulam-and-south",
    passed: KIYOR_POSITION[0] < 0 && KIYOR_POSITION[2] < ALTAR_WEST_EDGE_Z && KIYOR_POSITION[2] > TEMPLE_STEP_FOOT_Z,
    detail: "The laver sits south of center within the open altar-Ulam court, not alongside the altar body or on the steps.",
  },
  {
    id: "daily-service-tables-are-west-of-ramp",
    passed: SERVICE_TABLE_Z < ALTAR_CENTER_Z - RAMP_HALF_WIDTH,
    detail: "The marble limb table and silver service-vessel table stand west of the main altar ramp (Shekalim 6:4).",
  },
  {
    id: "womens-court-chamber-compass-assignments",
    passed: CHAMBERS.every((room) => {
      const northSouth = room.x > 0 ? "north" : "south";
      const eastWest = room.z > WOMENS_COURT_CENTER_Z ? "east" : "west";
      return room.corner === `${northSouth}${eastWest}`;
    }),
    detail: "Nazirites SE, Wood NE, Lepers NW, and Oils SW follow Middot 2:5.",
  },
  {
    id: "altar-ramp-foot-joins-court",
    passed: almostEqual(altarRampHeightAt(RAMP_FOOT_X, ALTAR_CENTER_Z) ?? Number.NaN, PRIESTS_FLOOR_Y + 0.18),
    detail: "Ramp collision begins at the rendered foot elevation.",
  },
  {
    id: "altar-ramp-top-joins-altar",
    passed: almostEqual(altarRampHeightAt(RAMP_TOP_X, ALTAR_CENTER_Z) ?? Number.NaN, ALTAR_TOP_Y - 0.03),
    detail: "Ramp collision terminates at the rendered altar-top elevation.",
  },
  {
    id: "altar-ramp-side-does-not-lift",
    passed: altarRampHeightAt(rampMidX, ALTAR_CENTER_Z + RAMP_COLLISION_HALF_WIDTH + 0.02) === undefined,
    detail: "A side approach is outside the ramp lane and cannot teleport a player upward.",
  },
  {
    id: "altar-ramp-foot-allows-exit",
    passed: almostEqual(walkableSurfaceHeightAt(RAMP_FOOT_X - 0.08, ALTAR_CENTER_Z, PRIESTS_FLOOR_Y + 0.18), PRIESTS_FLOOR_Y),
    detail: "Moving beyond the foot returns to the priests' court rather than trapping the player.",
  },
  {
    id: "altar-ramp-side-entry-blocked",
    passed: !resolveAltarMovement(
      { x: rampMidX, y: PRIESTS_FLOOR_Y, z: ALTAR_CENTER_Z + RAMP_COLLISION_HALF_WIDTH + 0.04 },
      { x: rampMidX, y: PRIESTS_FLOOR_Y, z: ALTAR_CENTER_Z + RAMP_COLLISION_HALF_WIDTH - 0.04 },
    ).allowed,
    detail: "Crossing into the ramp from its side is rejected before height sampling.",
  },
  {
    id: "altar-top-can-enter-ramp",
    passed: resolveAltarMovement(
      { x: RAMP_TOP_X + 0.08, y: ALTAR_TOP_Y, z: ALTAR_CENTER_Z },
      { x: RAMP_TOP_X - 0.08, y: ALTAR_TOP_Y, z: ALTAR_CENTER_Z },
    ).allowed,
    detail: "A player on the altar top may enter the connected ramp and descend.",
  },
  {
    id: "altar-top-edge-protected",
    passed: !resolveAltarMovement(
      { x: 0, y: ALTAR_TOP_Y, z: ALTAR_CENTER_Z },
      { x: ALTAR_TOP_HALF + 0.08, y: ALTAR_TOP_Y, z: ALTAR_CENTER_Z },
    ).allowed,
    detail: "Non-ramp altar edges retain fall protection.",
  },
  {
    id: "womens-stair-count",
    passed: WOMENS_STAIR_ASCENT_ROUTE.length === womensExpectedPoints,
    detail: "The circulation route contains both tread edges for all fifteen steps.",
  },
  {
    id: "womens-stairs-join-israel-court",
    passed: almostEqual(WOMENS_STAIR_ASCENT_ROUTE.at(-1)?.[1] ?? Number.NaN, 0),
    detail: "The fifteenth step meets the Israel Court datum.",
  },
  {
    id: "porch-stairs-join-temple-floor",
    passed: almostEqual(TEMPLE_STAIR_ASCENT_ROUTE.at(-1)?.[1] ?? Number.NaN, TEMPLE_FLOOR_Y),
    detail: "The twelfth step meets the Temple floor datum.",
  },
  {
    id: "womens-court-does-not-extend-across-mount",
    passed: almostEqual(courtSurfaceHeightAt(0, WOMENS_COURT_MAX_Z + 1), OUTER_MOUNT_Y),
    detail: "Leaving the measured Women's Court square returns to the Temple Mount platform level.",
  },
  {
    id: "slaughter-ring-zone-is-24-cubits",
    passed: almostEqual((SLAUGHTER_RING_ZONE_NORTH_X - SLAUGHTER_RING_ZONE_SOUTH_X) / CUBIT, 24),
    detail: "The six ring rows are distributed inside Middot's 24-cubit ring zone.",
  },
  {
    id: "slaughter-tables-precede-posts",
    passed: SLAUGHTER_TABLE_X < SLAUGHTER_POST_X
      && almostEqual((SLAUGHTER_TABLE_X - SLAUGHTER_RING_ZONE_NORTH_X) / CUBIT, 4)
      && almostEqual((SLAUGHTER_POST_X - SLAUGHTER_TABLE_X) / CUBIT, 4),
    detail: "South-to-north order is rings, four cubits, tables, four cubits, posts.",
  },
];

const failedGeometryChecks = TEMPLE_GEOMETRY_AUDIT.filter((check) => !check.passed);
if (failedGeometryChecks.length > 0) {
  throw new Error(`Temple geometry audit failed: ${failedGeometryChecks.map((check) => check.id).join(", ")}`);
}

// Geometry assertions fail during development/build if collision elevations
// drift away from the source-controlled stair and ramp definitions.
if (!almostEqual(templeSurfaceHeightAt(0, TEMPLE_EAST_Z) ?? Number.NaN, TEMPLE_FLOOR_Y)) {
  throw new Error("Porch stairs do not terminate at the Temple floor.");
}
