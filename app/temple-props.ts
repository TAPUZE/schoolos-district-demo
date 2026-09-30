import { AZARAH_EAST_Z, CHAMBERS, ISRAEL_WEST_Z, PRIESTS_FLOOR_Y, WOMENS_COURT_Y } from "./temple-layout";
import { AZARAH_ROOMS } from "./temple-layout";
import { HALL, HEARTH_ROOMS, PARVAH_STAIR } from "./azarah-structure";
import type { PlanCollider } from "./temple-structure";

/**
 * Furnishing kit for the rooms. Every prop rests on a floor or on another prop (checked by the scene audit) and every
 * bulky prop also registers a collider so visitors cannot walk through it.
 */
export type PropMat = "stone" | "wood" | "salt" | "hide" | "clay" | "bronze" | "water" | "linen" | "dark" | "straw" | "flame" | "lamb";
export type Prim = { k: "box" | "cyl" | "jar"; m: PropMat; c: [number, number, number]; s: [number, number, number]; rx?: number; ry?: number; rz?: number };
export type PropSet = { prims: Prim[]; colliders: PlanCollider[]; lights: { position: [number, number, number]; color: string; intensity: number; distance: number }[] };

const empty = (): PropSet => ({ prims: [], colliders: [], lights: [] });

class Builder {
  set = empty();
  constructor(private base: number) {}
  box(m: PropMat, cx: number, y0: number, cz: number, w: number, h: number, d: number, solid = false, ry = 0) {
    this.set.prims.push({ k: "box", m, c: [cx, this.base + y0 + h / 2, cz], s: [w, h, d], ry });
    if (solid) this.collide(cx, cz, w, d, y0, y0 + h);
  }
  cyl(m: PropMat, cx: number, y0: number, cz: number, r: number, h: number, solid = false) {
    this.set.prims.push({ k: "cyl", m, c: [cx, this.base + y0 + h / 2, cz], s: [r, h, r] });
    if (solid) this.collide(cx, cz, r * 2, r * 2, y0, y0 + h);
  }
  /** Horizontal cylinder whose axis runs along x (axis="x") or z (axis="z"). */
  log(m: PropMat, cx: number, cy: number, cz: number, r: number, length: number, axis: "x" | "z") {
    this.set.prims.push({ k: "cyl", m, c: [cx, this.base + cy, cz], s: [r, length, r], ...(axis === "z" ? { rx: Math.PI / 2 } : { rz: Math.PI / 2 }) });
  }
  jar(cx: number, y0: number, cz: number, r: number, h: number, m: PropMat = "clay") {
    this.set.prims.push({ k: "jar", m, c: [cx, this.base + y0, cz], s: [r, h, r] });
  }
  collide(cx: number, cz: number, w: number, d: number, y0: number, y1: number) {
    this.set.colliders.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2, y0: this.base + y0, y1: this.base + y1 });
  }
  light(position: [number, number, number], color: string, intensity: number, distance: number) {
    this.set.lights.push({ position, color, intensity, distance });
  }
  table(m: PropMat, cx: number, cz: number, w: number, d: number, h: number, solid = true) {
    const top = 0.12;
    this.box(m, cx, h - top, cz, w, top, d);
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) this.box(m, cx + dx * (w / 2 - 0.12), 0, cz + dz * (d / 2 - 0.12), 0.16, h - top, 0.16);
    if (solid) this.collide(cx, cz, w, d, 0, h);
  }
  logStack(cx: number, cz: number, length: number, axis: "x" | "z", rows: number, r = 0.22, m: PropMat = "wood") {
    for (let row = 0; row < rows; row += 1) {
      const count = rows - row;
      for (let i = 0; i < count; i += 1) {
        const offset = (i - (count - 1) / 2) * r * 2.05;
        const y = r + row * r * 1.8;
        if (axis === "z") this.log(m, cx + offset, y, cz, r, length, "z");
        else this.log(m, cx, y, cz + offset, r, length, "x");
      }
    }
    const span = rows * r * 2.05;
    this.collide(cx, cz, axis === "z" ? span : length, axis === "z" ? length : span, 0, rows * r * 1.8 + r);
  }
  shelf(cx: number, cz: number, w: number, d: number, y0: number, jars = 0, m: PropMat = "wood") {
    this.box(m, cx, y0, cz, w, 0.06, d);
    for (let i = 0; i < jars; i += 1) this.jar(cx - w / 2 + 0.25 + i * ((w - 0.5) / Math.max(1, jars - 1)), y0 + 0.06, cz, 0.14, 0.34);
  }
}

/* ---------- Azarah chambers (local coordinates: u outward from the inner door wall, v along the room) ---------- */
function azarahChamber(name: string): PropSet {
  const room = AZARAH_ROOMS.find((r) => r.name === name)!;
  const s = Math.sign(room.x);
  const b = new Builder(PRIESTS_FLOOR_Y);
  const X = (u: number) => s * (27.2 + u);
  const Z = (v: number) => room.z + v;
  switch (name) {
    case "Salt Chamber":
      for (const v of [-3.2, 0, 3.2]) {
        b.box("wood", X(6.9), 0, Z(v), 1.0, 0.8, 2.6, true);
        b.box("salt", X(6.9), 0.8, Z(v), 0.86, 0.1, 2.4);
      }
      for (const [u, v] of [[3.0, -4.2], [3.7, -4.2], [3.0, -3.5], [3.7, -3.5], [3.35, -3.85]] as const) b.cyl("linen", X(u), 0, Z(v), 0.27, 0.62);
      b.collide(X(3.35), Z(-3.85), 1.5, 1.4, 0, 0.62);
      b.table("stone", X(4.6), Z(1.6), 2.2, 1.2, 0.9);
      for (let i = 0; i < 7; i += 1) b.box("hide", X(4.6), 0.9 + i * 0.05, Z(1.6), 1.6, 0.05, 1.0);
      for (let i = 0; i < 8; i += 1) b.box("hide", X(3.4), i * 0.06, Z(3.9), 1.5, 0.06, 1.0);
      b.collide(X(3.4), Z(3.9), 1.5, 1.0, 0, 0.5);
      b.shelf(X(4.2), Z(4.55), 4.4, 0.35, 0.95, 8);
      b.shelf(X(4.2), Z(4.55), 4.4, 0.35, 1.75, 8);
      for (const u of [2.1, 6.3]) b.box("wood", X(u), 0, Z(4.55), 0.1, 1.75, 0.1);
      break;
    case "Parvah Chamber":
      for (const v of [-3.0, 3.0]) {
        b.box("stone", X(3.3), 0, Z(v), 1.7, 0.75, 1.7, true);
        b.box("water", X(3.3), 0.62, Z(v), 1.4, 0.04, 1.4);
        b.box("hide", X(3.3) - s * 0.3, 0.6, Z(v), 0.7, 0.05, 1.2);
      }
      b.box("wood", X(4.95), 0, Z(-4.6), 0.14, 2.0, 0.14);
      b.box("wood", X(4.95), 0, Z(4.6), 0.14, 2.0, 0.14);
      b.log("wood", X(4.95), 2.0, Z(0), 0.06, 9.2, "z");
      for (const v of [-3.6, -2.0, -0.4, 1.3, 3.0]) b.box("hide", X(4.95), 0.9, Z(v), 0.05, 1.1, 1.0);
      b.collide(X(4.95), Z(0), 0.3, 9.2, 0, 0.4);
      b.jar(X(1.3), 0, Z(-4.2), 0.3, 0.7);
      break;
    case "Washers' Chamber":
      for (const [u, v] of [[3.3, -3.0], [3.3, 3.0], [5.4, 0]] as const) {
        b.table("stone", X(u), Z(v), 1.3, 2.2, 0.9);
        b.cyl("bronze", X(u), 0.9, Z(v), 0.45, 0.22);
      }
      b.cyl("wood", X(6.9), 0, Z(3.9), 0.5, 0.9, true);
      b.cyl("water", X(6.9), 0.86, Z(3.9), 0.44, 0.03);
      b.box("wood", X(7.25), 1.9, Z(0), 0.1, 0.2, 4.4);
      for (let i = 0; i < 6; i += 1) b.box("dark", X(7.1), 1.7, Z(-2.0 + i * 0.8), 0.08, 0.3, 0.05);
      b.box("stone", X(2.0), 0, Z(-4.3), 1.6, 0.55, 0.7, true);
      break;
    case "Wood Chamber":
      b.logStack(X(6.3), Z(-2.5), 3.8, "z", 5);
      b.logStack(X(6.3), Z(2.6), 3.8, "z", 5);
      b.logStack(X(4.0), Z(-3.9), 2.6, "x", 4);
      for (let i = 0; i < 14; i += 1) b.log("wood", X(2.6 + (i % 4) * 0.12), 0.1 + Math.floor(i / 4) * 0.19, Z(4.0 + (i % 3) * 0.02), 0.09, 1.3, "x");
      b.collide(X(3.0), Z(4.0), 1.5, 0.5, 0, 0.8);
      b.table("wood", X(3.8), Z(1.8), 1.8, 1.0, 0.85);
      b.cyl("wood", X(3.8), 0.85, Z(1.8), 0.28, 0.18);
      break;
    case "Chamber of the Exile":
      b.cyl("stone", X(4.4), 0, Z(0), 1.05, 0.85, true);
      b.cyl("dark", X(4.4), 0.85, Z(0), 0.78, 0.02);
      for (const v of [-1.6, 1.6]) b.box("wood", X(4.4), 0, Z(v), 0.22, 2.6, 0.22);
      b.log("wood", X(4.4), 2.4, Z(0), 0.06, 3.4, "z");
      b.log("wood", X(4.4), 2.4, Z(0), 0.7, 0.14, "z");
      for (const a of [0, 1, 2, 3]) b.set.prims.push({ k: "box", m: "wood", c: [X(4.4), PRIESTS_FLOOR_Y + 2.4, Z(0)], s: [0.06, 1.4, 0.06], rx: (a * Math.PI) / 4 });
      b.box("dark", X(4.4) + s * 0.72, 1.1, Z(0), 0.02, 1.3, 0.02);
      b.cyl("clay", X(4.4) + s * 0.72, 0.85, Z(0), 0.18, 0.3);
      for (let i = 0; i < 3; i += 1) b.cyl("bronze", X(6.9), i * 0.32, Z(-3.6 + i * 0.05), 0.5 - i * 0.05, 0.3);
      b.collide(X(6.9), Z(-3.6), 1.1, 1.1, 0, 0.9);
      b.box("wood", X(2.3), 0, Z(3.9), 1.8, 0.5, 0.6, true);
      break;
    case "Hewn Stone Chamber":
      b.box("stone", X(6.9), 0, Z(0), 0.6, 0.55, 8.0, true);
      b.box("stone", X(6.2), 0, Z(0), 0.6, 0.45, 7.0, true);
      for (const v of [-4.4, 4.4]) b.box("stone", X(4.8), 0, Z(v), 4.0, 0.45, 0.5, true);
      b.box("wood", X(7.15), 0, Z(0), 0.5, 1.15, 0.9, true);
      b.box("wood", X(7.3), 0.55, Z(0), 0.08, 0.9, 0.9);
      b.table("wood", X(3.6), Z(0), 1.0, 1.6, 0.85);
      for (const v of [-0.4, 0.3]) b.log("linen", X(3.6), 0.95, Z(v), 0.05, 0.6, "x");
      break;
  }
  return b.set;
}

export const AZARAH_CHAMBER_PROPS: Record<string, PropSet> = Object.fromEntries(AZARAH_ROOMS.map((r) => [r.name, azarahChamber(r.name)]));

/* ---------- Hearth hall ---------- */
function hearthHall(): PropSet {
  const b = new Builder(PRIESTS_FLOOR_Y);
  // Stone sleeping ledges along both long walls, broken at the two gates.
  b.box("stone", 27.75, 0, -52, 1.5, 0.5, 6.8, true);
  for (const z of [-54.5, -49.5]) b.box("stone", 41.85, 0, z, 1.5, 0.5, 2.0, true);
  for (const [x, z] of [[27.75, -54.2], [27.75, -49.8]] as const) b.box("linen", x, 0.5, z, 1.1, 0.08, 1.6);
  // Hearth: raised stone block with fire, wood beside it.
  b.box("stone", 34.8, 0, -52, 1.8, 0.9, 1.8, true);
  b.box("dark", 34.8, 0.9, -52, 1.3, 0.06, 1.3);
  b.box("flame", 34.8, 0.96, -52, 0.5, 0.5, 0.5);
  b.light([34.8, PRIESTS_FLOOR_Y + 1.8, -52], "#ff9a45", 14, 24);
  b.logStack(34.8, -49.4, 1.6, "x", 3, 0.16);
  // Marble key slab with its ring, set into the floor.
  b.box("stone", 33.3, 0, -54.5, 1.0, 0.06, 1.0);
  b.cyl("bronze", 33.3, 0.06, -54.5, 0.18, 0.05);
  // Hanging lamp stands.
  for (const [x, z] of [[33.4, -48.9], [36.2, -48.9], [33.4, -55.3], [36.2, -55.3]] as const) {
    b.cyl("bronze", x, 0, z, 0.16, 1.7);
    b.cyl("flame", x, 1.7, z, 0.09, 0.14);
  }
  // Lamb chamber (SW): pen rails, straw, trough and lambs.
  const lamb = HEARTH_ROOMS[0];
  b.box("straw", (lamb.x0 + lamb.x1) / 2, 0, (lamb.z0 + lamb.z1) / 2, 4.6, 0.05, 4.6);
  b.box("wood", 28.7, 0, -60.8, 2.4, 0.5, 0.5, true);
  b.box("water", 28.7, 0.5, -60.8, 2.2, 0.02, 0.4);
  for (const [x, z] of [[28.8, -58.5], [30.3, -59.6], [30.9, -57.9]] as const) {
    b.box("lamb", x, 0.3, z, 0.8, 0.42, 0.4);
    b.box("lamb", x + 0.5, 0.5, z, 0.28, 0.3, 0.26);
    for (const dx of [-0.28, 0.28]) for (const dz of [-0.14, 0.14]) b.box("dark", x + dx, 0, z + dz, 0.07, 0.3, 0.07);
    b.collide(x, z, 1.0, 0.5, 0, 0.8);
  }
  // Showbread makers (SE): oven, kneading trough, racks and flour.
  b.cyl("stone", 29.8, 0, -44.0, 0.9, 0.7, true);
  b.cyl("dark", 29.8, 0.7, -44.0, 0.55, 0.03);
  b.box("flame", 29.8, 0.72, -44.0, 0.3, 0.2, 0.3);
  b.light([29.8, PRIESTS_FLOOR_Y + 1.2, -44], "#ff9a45", 6, 8);
  b.table("wood", 31.3, -46.0, 2.0, 1.0, 0.85);
  for (let i = 0; i < 4; i += 1) b.box("wood", 30.7 + i * 0.5, 0.85, -46.0, 0.4, 0.05, 0.6);
  b.shelf(27.6, -44.6, 0.5, 3.2, 1.0);
  b.shelf(27.6, -44.6, 0.5, 3.2, 1.8);
  for (const y of [1.0, 1.8]) for (let i = 0; i < 5; i += 1) b.box("straw", 27.6, y + 0.06, -43.4 - i * 0.5, 0.4, 0.06, 0.4);
  for (const [x, z] of [[31.8, -43.6], [31.8, -44.4], [31.4, -44.0]] as const) b.cyl("linen", x, 0, z, 0.26, 0.6, true);
  // Altar stones / seals (NE): stone stack, seal chests.
  for (const [x, y0, z, w, h, d] of [[38.2, 0, -45.4, 1.2, 0.5, 0.9], [39.6, 0, -45.0, 1.0, 0.45, 0.8], [38.8, 0.5, -44.3, 1.3, 0.4, 0.9], [39.4, 0.45, -45.0, 0.9, 0.35, 0.7]] as const) b.box("stone", x, y0, z, w, h, d);
  b.collide(39.0, -44.9, 3.0, 2.0, 0, 1.0);
  b.box("wood", 41.2, 0, -44.0, 1.4, 0.7, 0.8, true);
  b.shelf(42.3, -44.6, 0.4, 2.4, 1.2);
  // Descent room (NW): bench and lamp.
  b.box("stone", 41.2, 0, -59.6, 2.0, 0.45, 0.6, true);
  b.light([39.5, PRIESTS_FLOOR_Y + 2.4, -59.0], "#ffc27a", 4, 8);
  return b.set;
}
export const HEARTH_PROPS = hearthHall();
export { HALL };

/* ---------- Underground circuit ---------- */
export function undergroundProps(YB: number, bath: { x0: number; x1: number; z0: number; z1: number }, pit: { x0: number; x1: number; z0: number; z1: number; floor: number }, toilet: { x0: number; x1: number; z0: number; z1: number }, fire: { x0: number; x1: number; z0: number; z1: number }): PropSet {
  const b = new Builder(YB);
  // Pool: water surface, steps down into the bath.
  b.box("water", (pit.x0 + pit.x1) / 2, pit.floor - YB + 1.05, (pit.z0 + pit.z1) / 2, pit.x1 - pit.x0 - 0.05, 0.03, pit.z1 - pit.z0 - 0.05);
  for (const n of [0, 1]) b.box("stone", pit.x0 + 0.3 + n * 0.5, pit.floor - YB, (pit.z0 + pit.z1) / 2, 0.5, 0.4 + n * 0.5, 1.4);
  b.box("stone", (bath.x0 + bath.x1) / 2, 0, bath.z1 - 0.45, 4.0, 0.45, 0.6, true);
  b.box("wood", bath.x1 - 0.5, 0, bath.z0 + 0.5, 0.06, 1.6, 0.9);
  // Latrine seat over a drain.
  b.box("stone", (toilet.x0 + toilet.x1) / 2, 0, toilet.z1 - 0.5, 1.3, 0.5, 0.7, true);
  b.box("dark", (toilet.x0 + toilet.x1) / 2, 0.5, toilet.z1 - 0.5, 0.4, 0.02, 0.4);
  // Warming fire at the end of the passage.
  b.box("stone", (fire.x0 + fire.x1) / 2, 0, (fire.z0 + fire.z1) / 2, fire.x1 - fire.x0, 0.5, fire.z1 - fire.z0, true);
  b.box("flame", (fire.x0 + fire.x1) / 2, 0.5, (fire.z0 + fire.z1) / 2, 0.6, 0.5, 0.6);
  b.light([(fire.x0 + fire.x1) / 2 - 0.6, YB + 1.6, (fire.z0 + fire.z1) / 2], "#ff9a45", 10, 14);
  // Lamp niches along the passage.
  for (const x of [43.2, 47.6, 51.4]) {
    b.box("flame", x, 1.4, -57.25, 0.12, 0.2, 0.12);
    b.light([x, YB + 1.8, -56.6], "#ffc27a", 3, 8);
  }
  b.light([40.4, YB + 1.8, -59.0], "#ffc27a", 3, 8);
  b.light([(bath.x0 + bath.x1) / 2, YB + 2.4, (bath.z0 + bath.z1) / 2], "#ffc27a", 5, 10);
  return b.set;
}

/* ---------- Women's Court corner chambers ---------- */
function womensChamber(index: number): PropSet {
  const room = CHAMBERS[index];
  const b = new Builder(WOMENS_COURT_Y + 0.12);
  const s = Math.sign(room.x);
  const nearNicanor = index < 2;
  const t = nearNicanor ? 1 : -1; // toward the room's far z wall
  const X = (a: number) => room.x + s * a;
  const Z = (a: number) => room.z + a;
  switch (room.name) {
    case "Nazirites":
      for (const v of [-3.6, 3.6]) {
        b.box("stone", X(5.6), 0, Z(v), 1.8, 0.6, 1.4, true);
        b.cyl("clay", X(5.6), 0.6, Z(v), 0.38, 0.5);
        b.box("dark", X(5.6) - 1.0 * s, 0, Z(v), 0.5, 0.06, 0.5);
      }
      b.box("flame", X(5.6), 0.6, Z(-3.6), 0.28, 0.24, 0.28);
      b.light([X(5.6), WOMENS_COURT_Y + 1.6, Z(-3.6)], "#ff9a45", 5, 8);
      b.logStack(X(4.0), Z(6.9), 3.0, "x", 3, 0.17);
      for (const v of [-6.2, 6.2]) b.box("wood", X(1.5), 0, Z(v), 1.7, 0.45, 0.5, true);
      b.table("wood", X(2.2), Z(0.5), 2.2, 1.0, 0.9);
      b.cyl("linen", X(2.2), 0.9, Z(0.5), 0.2, 0.16);
      break;
    case "Wood":
      b.logStack(X(6.1), Z(-3.6), 4.2, "z", 6, 0.24);
      b.logStack(X(6.1), Z(3.6), 4.2, "z", 6, 0.24);
      b.logStack(X(1.5), Z(7.0 * t), 4.0, "x", 5, 0.22);
      b.table("wood", X(2.8), Z(-1.0), 2.6, 1.2, 0.9);
      b.cyl("wood", X(2.4), 0.9, Z(-1.0), 0.3, 0.3);
      b.box("stone", X(2.0), 0, Z(-6.5 * t), 1.6, 0.5, 0.6, true);
      break;
    case "Lepers":
      for (const [w, d, a, z] of [[5.6, 0.5, 3.4, -2.2], [5.6, 0.5, 3.4, 2.2], [0.5, 4.9, 0.85, 0], [0.5, 4.9, 5.95, 0]] as const) b.box("stone", X(a), 0, Z(z), w, 0.9, d, true);
      b.box("dark", X(3.4), 0, Z(0), 4.8, 0.05, 3.8);
      b.box("water", X(3.4), 0.62, Z(0), 4.8, 0.03, 3.8);
      for (const z of [-4.4, 4.4]) b.box("stone", X(3.4), 0, Z(z), 2.0, 0.4, 0.8, true);
      b.box("wood", X(6.9), 0, Z(5.5 * t), 0.6, 1.8, 2.4, true);
      b.box("linen", X(6.55), 1.0, Z(5.5 * t), 0.05, 0.7, 1.6);
      break;
    case "Oils":
      for (const row of [0, 1]) for (let i = 0; i < 13; i += 1) b.jar(X(6.9 - row * 1.15), 0, Z(-6.6 + i * 1.1), 0.34, 0.85);
      for (const row of [0, 1]) for (let i = 0; i < 4; i += 1) b.jar(X(4.3 - row * 1.15 - i * 1.1), 0, Z(7.0 * t), 0.34, 0.85);
      b.collide(X(6.4), Z(0), 2.8, 14.2, 0, 0.9);
      b.collide(X(2.9), Z(7.0 * t), 4.4, 2.8, 0, 0.9);
      b.shelf(X(6.9), Z(-6.8 * t), 0.5, 1.4, 1.2, 0);
      b.table("stone", X(2.4), Z(-2.5), 2.6, 1.3, 0.9);
      b.cyl("bronze", X(2.4), 0.9, Z(-2.5), 0.3, 0.22);
      b.jar(X(2.4) + s * 0.6, 0.9, Z(-2.5), 0.16, 0.36);
      for (const z of [1.8, 3.4]) b.jar(X(1.4), 0, Z(z), 0.55, 1.4);
      b.collide(X(1.4), Z(2.6), 1.2, 3.2, 0, 1.4);
      break;
  }
  return b.set;
}
export const WOMENS_CHAMBER_PROPS: PropSet[] = CHAMBERS.map((_, i) => womensChamber(i));

/* ---------- Instrument rooms under the Israelites' court ---------- */
export function instrumentRoom(x: number, kind: "strings" | "brass"): PropSet {
  const b = new Builder(WOMENS_COURT_Y + 0.12);
  const zBack = ISRAEL_WEST_Z + 0.5;
  const zMid = (ISRAEL_WEST_Z + AZARAH_EAST_Z) / 2;
  for (const y of [0.7, 1.5]) b.shelf(x, zBack, 5.2, 0.5, y);
  for (const px of [-2.5, 0, 2.5]) b.box("wood", x + px, 0, zBack, 0.1, 1.5, 0.1);
  if (kind === "strings") {
    for (let i = 0; i < 5; i += 1) {
      const cx = x - 2.2 + i * 1.1;
      b.box("wood", cx, 0.76, zBack, 0.32, 0.5, 0.1);
      b.box("wood", cx - 0.14, 1.26, zBack, 0.04, 0.5, 0.04);
      b.box("wood", cx + 0.14, 1.26, zBack, 0.04, 0.5, 0.04);
      b.box("wood", cx, 1.72, zBack, 0.36, 0.04, 0.04);
    }
    for (let i = 0; i < 4; i += 1) {
      const cx = x - 1.6 + i * 1.1;
      b.box("wood", cx, 1.56, zBack, 0.14, 0.9, 0.3);
      b.box("wood", cx - 0.05, 2.36, zBack, 0.05, 0.25, 0.05);
    }
    for (const sx of [-2.5, 2.5]) {
      b.box("wood", x + sx, 0, zMid, 0.5, 1.3, 0.16, true);
      b.box("wood", x + sx, 1.3, zMid, 0.62, 0.05, 0.05);
    }
  } else {
    for (let i = 0; i < 4; i += 1) for (let n = 0; n < 3; n += 1) b.cyl("bronze", x - 2.0 + i * 1.2, 0.76 + n * 0.03, zBack - 0.05, 0.22, 0.02);
    for (let i = 0; i < 6; i += 1) b.log("wood", x - 2.2 + i * 0.5, 1.56, zBack, 0.04, 0.9, "z");
    for (let i = 0; i < 4; i += 1) b.log("bronze", x - 1.6 + i * 1.0, 1.9, zBack, 0.05, 0.85, "z");
    for (const sx of [-2.5, 2.5]) b.box("wood", x + sx, 0, zMid, 0.5, 0.9, 0.5, true);
  }
  return b.set;
}
export { PARVAH_STAIR };
