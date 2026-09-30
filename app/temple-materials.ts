import { CanvasTexture, LinearMipmapLinearFilter, RepeatWrapping, SRGBColorSpace } from "three";
import type { Texture } from "three";

export type SurfaceKind = "limestone" | "paving" | "ground" | "bronze" | "gold" | "linen" | "wood";
export type SurfaceSet = { map: Texture; normalMap: Texture; roughnessMap: Texture; tile: number };

const SIZE = 1024;
const CELL = SIZE * SIZE;

// World units covered by one texture tile (1 unit = 2.5 cubits).
export const SURFACE_TILE: Record<SurfaceKind, number> = { limestone: 6.4, paving: 6.4, ground: 24, bronze: 3.2, gold: 3.2, linen: 1, wood: 3.2 };

export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const fade = (t: number) => t * t * (3 - 2 * t);

// Seamless value noise: `cellsX` x `cellsY` random lattice that wraps at the tile edge.
function valueNoise(cellsX: number, cellsY: number, seed: number) {
  const rand = mulberry32(seed);
  const lattice = new Float32Array(cellsX * cellsY);
  for (let i = 0; i < lattice.length; i += 1) lattice[i] = rand();
  const out = new Float32Array(CELL);
  for (let y = 0; y < SIZE; y += 1) {
    const fy = (y / SIZE) * cellsY;
    const y0 = Math.floor(fy);
    const ty = fade(fy - y0);
    const y1 = (y0 + 1) % cellsY;
    for (let x = 0; x < SIZE; x += 1) {
      const fx = (x / SIZE) * cellsX;
      const x0 = Math.floor(fx);
      const tx = fade(fx - x0);
      const x1 = (x0 + 1) % cellsX;
      const a = lattice[y0 * cellsX + x0] + (lattice[y0 * cellsX + x1] - lattice[y0 * cellsX + x0]) * tx;
      const b = lattice[y1 * cellsX + x0] + (lattice[y1 * cellsX + x1] - lattice[y1 * cellsX + x0]) * tx;
      out[y * SIZE + x] = a + (b - a) * ty;
    }
  }
  return out;
}

// Fractal sum of tileable noise, normalised to roughly 0..1.
function fbm(baseCells: number, octaves: number, seed: number, stretchY = 1) {
  const out = new Float32Array(CELL);
  let amplitude = 1;
  let total = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    const cells = baseCells * 2 ** octave;
    const layer = valueNoise(cells, Math.max(1, Math.round(cells * stretchY)), seed + octave * 101);
    for (let i = 0; i < CELL; i += 1) out[i] += layer[i] * amplitude;
    total += amplitude;
    amplitude *= 0.5;
  }
  for (let i = 0; i < CELL; i += 1) out[i] /= total;
  return out;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (edge0: number, edge1: number, x: number) => fade(clamp01((x - edge0) / (edge1 - edge0)));

// Splits [0, SIZE) into stones with lengths drawn from [min, max], wrapping seamlessly.
function splitRow(rand: () => number, min: number, max: number) {
  const lengths: number[] = [];
  let sum = 0;
  while (sum < SIZE) {
    const length = Math.round(min + rand() * (max - min));
    lengths.push(length);
    sum += length;
  }
  const overshoot = sum - SIZE;
  const last = lengths.length - 1;
  if (lengths[last] - overshoot >= min * 0.6) lengths[last] -= overshoot;
  else {
    lengths.pop();
    lengths[lengths.length - 1] += SIZE - lengths.reduce((a, b) => a + b, 0);
  }
  return lengths;
}

function toCanvas(fill: (data: Uint8ClampedArray) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  const image = ctx.createImageData(SIZE, SIZE);
  fill(image.data);
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function finish(texture: CanvasTexture, srgb: boolean) {
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = 16;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  if (srgb) texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function heightToSet(height: Float32Array, color: Float32Array, rough: Float32Array, normalStrength: number, tile: number): SurfaceSet {
  const colorCanvas = toCanvas((data) => {
    for (let i = 0; i < CELL; i += 1) {
      data[i * 4] = color[i * 3];
      data[i * 4 + 1] = color[i * 3 + 1];
      data[i * 4 + 2] = color[i * 3 + 2];
      data[i * 4 + 3] = 255;
    }
  });
  const normalCanvas = toCanvas((data) => {
    for (let y = 0; y < SIZE; y += 1) {
      const up = ((y + SIZE - 1) % SIZE) * SIZE;
      const down = ((y + 1) % SIZE) * SIZE;
      for (let x = 0; x < SIZE; x += 1) {
        const left = (x + SIZE - 1) % SIZE;
        const right = (x + 1) % SIZE;
        const nx = -(height[y * SIZE + right] - height[y * SIZE + left]) * normalStrength;
        const ny = (height[down + x] - height[up + x]) * normalStrength;
        const inv = 1 / Math.hypot(nx, ny, 1);
        const o = (y * SIZE + x) * 4;
        data[o] = (nx * inv * 0.5 + 0.5) * 255;
        data[o + 1] = (ny * inv * 0.5 + 0.5) * 255;
        data[o + 2] = (inv * 0.5 + 0.5) * 255;
        data[o + 3] = 255;
      }
    }
  });
  const roughCanvas = toCanvas((data) => {
    for (let i = 0; i < CELL; i += 1) {
      const g = clamp01(rough[i]) * 255;
      data[i * 4] = g;
      data[i * 4 + 1] = g;
      data[i * 4 + 2] = g;
      data[i * 4 + 3] = 255;
    }
  });
  return {
    map: finish(new CanvasTexture(colorCanvas), true),
    normalMap: finish(new CanvasTexture(normalCanvas), false),
    roughnessMap: finish(new CanvasTexture(roughCanvas), false),
    tile,
  };
}

// Herodian ashlar: drafted margins around a slightly projecting boss, fine joints, warm cream Jerusalem limestone.
function buildLimestone(): SurfaceSet {
  const rand = mulberry32(1948);
  const grain = fbm(64, 4, 11);
  const pits = fbm(160, 2, 23);
  const blotch = fbm(5, 4, 37);
  const streak = fbm(48, 3, 53, 0.06);
  const height = new Float32Array(CELL);
  const color = new Float32Array(CELL * 3);
  const rough = new Float32Array(CELL);
  const courses = 8;
  const courseHeight = SIZE / courses;
  const joint = 2;
  const margin = 11;

  for (let course = 0; course < courses; course += 1) {
    const y0 = course * courseHeight;
    const lengths = splitRow(rand, 230, 470);
    let x0 = Math.floor(rand() * SIZE);
    for (const length of lengths) {
      const tone = (rand() - 0.5) * 0.15;
      const warm = (rand() - 0.5) * 9;
      const bulge = 0.05 + rand() * 0.1;
      for (let v = 0; v < courseHeight; v += 1) {
        for (let u = 0; u < length; u += 1) {
          const x = (x0 + u) % SIZE;
          const i = (y0 + v) * SIZE + x;
          const edge = Math.min(u, length - 1 - u, v, courseHeight - 1 - v);
          const g = grain[i];
          let h: number;
          let shade = 1 + tone;
          let r = 0.86;
          if (edge < joint) {
            h = -1;
            shade *= 0.5;
            r = 1;
          } else if (edge < joint + margin) {
            const t = (edge - joint) / margin;
            h = -0.34 + t * 0.06 + (g - 0.5) * 0.05;
            shade *= 0.96 + t * 0.02;
            r = 0.9;
          } else {
            const cu = (u / length) * 2 - 1;
            const cv = (v / courseHeight) * 2 - 1;
            const dome = (1 - cu * cu) * (1 - cv * cv);
            h = bulge * dome + (g - 0.5) * 0.14 - (pits[i] > 0.7 ? (pits[i] - 0.7) * 0.9 : 0);
            shade *= 0.97 + (g - 0.5) * 0.17;
          }
          const stain = 0.87 + blotch[i] * 0.2 - smooth(0.55, 0.85, streak[i]) * 0.05;
          shade *= stain;
          height[i] = h;
          color[i * 3] = clamp01((0.86 + warm / 255) * shade) * 255;
          color[i * 3 + 1] = clamp01((0.73 + warm / 340) * shade) * 255;
          color[i * 3 + 2] = clamp01((0.62 - warm / 300) * shade) * 255;
          rough[i] = r - (g - 0.5) * 0.1;
        }
      }
      x0 = (x0 + length) % SIZE;
    }
  }
  return heightToSet(height, color, rough, 4.2, SURFACE_TILE.limestone);
}

// Large dressed pavers with thin joints, worn slightly smoother by foot traffic.
function buildPaving(): SurfaceSet {
  const rand = mulberry32(70);
  const grain = fbm(96, 4, 71);
  const wear = fbm(6, 4, 83);
  const blotch = fbm(4, 4, 97);
  const height = new Float32Array(CELL);
  const color = new Float32Array(CELL * 3);
  const rough = new Float32Array(CELL);
  const rowHeights = [160, 96, 128, 192, 96, 128, 128, 96];
  const joint = 3;
  let y0 = 0;
  for (const rowHeight of rowHeights) {
    const lengths = splitRow(rand, 210, 400);
    let x0 = Math.floor(rand() * SIZE);
    for (const length of lengths) {
      const tone = (rand() - 0.5) * 0.14;
      const warm = (rand() - 0.5) * 8;
      const tilt = (rand() - 0.5) * 0.06;
      for (let v = 0; v < rowHeight; v += 1) {
        for (let u = 0; u < length; u += 1) {
          const x = (x0 + u) % SIZE;
          const i = (y0 + v) * SIZE + x;
          const edge = Math.min(u, length - 1 - u, v, rowHeight - 1 - v);
          const g = grain[i];
          let h: number;
          let shade = 1 + tone;
          let r: number;
          if (edge < joint) {
            h = -1;
            shade *= 0.62;
            r = 1;
          } else {
            const arris = smooth(joint, joint + 5, edge);
            h = -0.22 * (1 - arris) + tilt * (u / length) + (g - 0.5) * 0.12;
            shade *= 0.96 + (g - 0.5) * 0.12 + (1 - arris) * -0.05;
            r = 0.86 - smooth(0.45, 0.8, wear[i]) * 0.26;
          }
          shade *= 0.88 + blotch[i] * 0.2;
          height[i] = h;
          color[i * 3] = clamp01((0.82 + warm / 255) * shade) * 255;
          color[i * 3 + 1] = clamp01((0.695 + warm / 340) * shade) * 255;
          color[i * 3 + 2] = clamp01((0.55 - warm / 300) * shade) * 255;
          rough[i] = r - (g - 0.5) * 0.08;
        }
      }
      x0 = (x0 + length) % SIZE;
    }
    y0 += rowHeight;
  }
  return heightToSet(height, color, rough, 4, SURFACE_TILE.paving);
}

// Dry Judean hillside: pale earth, scattered limestone chips and low scrub tone.
function buildGround(): SurfaceSet {
  const rand = mulberry32(3);
  const coarse = fbm(6, 5, 131);
  const fine = fbm(128, 3, 149);
  const scrub = fbm(14, 4, 167);
  const height = new Float32Array(CELL);
  const color = new Float32Array(CELL * 3);
  const rough = new Float32Array(CELL);
  const stones: { x: number; y: number; r: number; tone: number }[] = [];
  for (let n = 0; n < 900; n += 1) stones.push({ x: rand() * SIZE, y: rand() * SIZE, r: 3 + rand() * 9, tone: 0.75 + rand() * 0.35 });
  const chip = new Float32Array(CELL);
  const chipTone = new Float32Array(CELL).fill(1);
  for (const stone of stones) {
    const reach = Math.ceil(stone.r);
    for (let dy = -reach; dy <= reach; dy += 1) {
      for (let dx = -reach; dx <= reach; dx += 1) {
        const d = Math.hypot(dx, dy) / stone.r;
        if (d >= 1) continue;
        const i = ((Math.floor(stone.y) + dy + SIZE) % SIZE) * SIZE + ((Math.floor(stone.x) + dx + SIZE) % SIZE);
        const dome = Math.sqrt(1 - d * d);
        if (dome > chip[i]) {
          chip[i] = dome;
          chipTone[i] = stone.tone;
        }
      }
    }
  }
  for (let i = 0; i < CELL; i += 1) {
    const c = coarse[i];
    const s = scrub[i];
    const f = fine[i];
    height[i] = chip[i] * 0.9 + (f - 0.5) * 0.5 + (c - 0.5) * 0.4;
    const dry = 0.64 + c * 0.26;
    const green = smooth(0.52, 0.78, s) * 0.5;
    let r = (0.62 + (f - 0.5) * 0.12) * dry;
    let g = (0.565 + (f - 0.5) * 0.11) * dry + green * 0.06;
    let b = (0.46 + (f - 0.5) * 0.09) * dry - green * 0.06;
    if (chip[i] > 0) {
      const t = chipTone[i] * (0.8 + chip[i] * 0.14);
      r = 0.8 * t;
      g = 0.74 * t;
      b = 0.6 * t;
    }
    color[i * 3] = clamp01(r) * 255;
    color[i * 3 + 1] = clamp01(g) * 255;
    color[i * 3 + 2] = clamp01(b) * 255;
    rough[i] = 0.96 - chip[i] * 0.1;
  }
  return heightToSet(height, color, rough, 3, SURFACE_TILE.ground);
}

// Cast bronze: fine hammered relief, uneven polish and green patina in the recesses.
function buildBronze(): SurfaceSet {
  const fine = fbm(96, 3, 211);
  const dents = fbm(14, 4, 223);
  const patina = fbm(8, 5, 239);
  const wipe = fbm(40, 3, 251);
  const height = new Float32Array(CELL);
  const color = new Float32Array(CELL * 3);
  const rough = new Float32Array(CELL);
  for (let i = 0; i < CELL; i += 1) {
    const h = (fine[i] - 0.5) * 0.35 + (dents[i] - 0.5) * 0.9;
    height[i] = h;
    const worn = smooth(0.42, 0.62, wipe[i]);
    const green = smooth(0.72, 0.9, patina[i]) * (1 - worn * 0.8) * (h < 0 ? 0.5 : 0.15);
    const tone = 0.92 + (fine[i] - 0.5) * 0.16 + worn * 0.06;
    const r = 0.78 * tone * (1 - green * 0.4);
    const g = 0.52 * tone * (1 + green * 0.2);
    const b = 0.26 * tone * (1 + green * 0.5);
    color[i * 3] = clamp01(r) * 255;
    color[i * 3 + 1] = clamp01(g) * 255;
    color[i * 3 + 2] = clamp01(b) * 255;
    rough[i] = 0.26 + (1 - worn) * 0.2 + green * 0.2;
  }
  return heightToSet(height, color, rough, 2.4, SURFACE_TILE.bronze);
}

// Beaten gold plates riveted to a wooden core: 2 x 4 plates per tile, dark seams, hammered dimpling.
function buildGold(): SurfaceSet {
  const rand = mulberry32(777);
  const fine = fbm(80, 3, 301);
  const dents = fbm(12, 4, 313);
  const height = new Float32Array(CELL);
  const color = new Float32Array(CELL * 3);
  const rough = new Float32Array(CELL);
  const plateW = 512;
  const plateH = 256;
  const seam = 3;
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      const tone = 1 + (rand() - 0.5) * 0.12;
      const x0 = col * plateW;
      const y0 = row * plateH;
      for (let v = 0; v < plateH; v += 1) {
        for (let u = 0; u < plateW; u += 1) {
          const i = (y0 + v) * SIZE + x0 + u;
          const edge = Math.min(u, plateW - 1 - u, v, plateH - 1 - v);
          let h = (fine[i] - 0.5) * 0.2 + (dents[i] - 0.5) * 0.55;
          let shade = tone * (0.94 + fine[i] * 0.12);
          let r = 0.26 + (dents[i] - 0.5) * 0.14;
          if (edge < seam) {
            h = -1;
            shade *= 0.32;
            r = 0.8;
          } else {
            h += smooth(seam, seam + 9, edge) * 0.0 - (1 - smooth(seam, seam + 9, edge)) * 0.25;
            for (const [ru, rv] of [[22, 22], [plateW - 23, 22], [22, plateH - 23], [plateW - 23, plateH - 23]]) {
              const d = Math.hypot(u - ru, v - rv);
              if (d < 7) {
                h += Math.sqrt(1 - (d / 7) ** 2) * 0.6;
                shade *= 1.04;
              }
            }
          }
          height[i] = h;
          color[i * 3] = clamp01(0.96 * shade) * 255;
          color[i * 3 + 1] = clamp01(0.66 * shade) * 255;
          color[i * 3 + 2] = clamp01(0.24 * shade) * 255;
          rough[i] = r;
        }
      }
    }
  }
  return heightToSet(height, color, rough, 4.5, SURFACE_TILE.gold);
}

// Fine linen with soft vertical drapery folds; uses the mesh's own UVs (garments move, so no world projection).
function buildLinen(): SurfaceSet {
  const wobble = fbm(6, 3, 401);
  const slub = fbm(90, 2, 419, 0.3);
  const height = new Float32Array(CELL);
  const color = new Float32Array(CELL * 3);
  const rough = new Float32Array(CELL);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const i = y * SIZE + x;
      const fold = Math.sin((x / SIZE) * Math.PI * 2 * 12 + wobble[i] * 5) * 0.5 + Math.sin((x / SIZE) * Math.PI * 2 * 5 + wobble[i] * 3) * 0.5;
      const weave = Math.sin(x * 1.9) * Math.sin(y * 1.9) * 0.05 + (slub[i] - 0.5) * 0.08;
      height[i] = fold * 0.7 + weave;
      const valley = 0.84 + (fold * 0.5 + 0.5) * 0.16;
      const shade = valley * (0.97 + (slub[i] - 0.5) * 0.06);
      color[i * 3] = clamp01(0.94 * shade) * 255;
      color[i * 3 + 1] = clamp01(0.9 * shade) * 255;
      color[i * 3 + 2] = clamp01(0.8 * shade) * 255;
      rough[i] = 0.9;
    }
  }
  return heightToSet(height, color, rough, 2.2, SURFACE_TILE.linen);
}

// Cedar/oak timber: long grain running along the projected u axis, darker growth rings and a few knots.
function buildWood(): SurfaceSet {
  const grain = fbm(2, 3, 501, 40);
  const fine = fbm(3, 2, 517, 90);
  const blotch = fbm(4, 3, 523);
  const height = new Float32Array(CELL);
  const color = new Float32Array(CELL * 3);
  const rough = new Float32Array(CELL);
  for (let i = 0; i < CELL; i += 1) {
    const ring = Math.sin((grain[i] * 26 + blotch[i] * 3) * Math.PI);
    const tone = 0.78 + ring * 0.09 + (fine[i] - 0.5) * 0.14 + (blotch[i] - 0.5) * 0.12;
    height[i] = ring * 0.08 + (fine[i] - 0.5) * 0.12;
    color[i * 3] = clamp01(0.62 * tone) * 255;
    color[i * 3 + 1] = clamp01(0.4 * tone) * 255;
    color[i * 3 + 2] = clamp01(0.23 * tone) * 255;
    rough[i] = 0.72 + (fine[i] - 0.5) * 0.12;
  }
  return heightToSet(height, color, rough, 2.2, SURFACE_TILE.wood);
}

const cache: Partial<Record<SurfaceKind, SurfaceSet>> = {};

export function getSurfaceSet(kind: SurfaceKind): SurfaceSet {
  const cached = cache[kind];
  if (cached) return cached;
  const built = kind === "limestone" ? buildLimestone() : kind === "paving" ? buildPaving() : kind === "bronze" ? buildBronze() : kind === "gold" ? buildGold() : kind === "linen" ? buildLinen() : kind === "wood" ? buildWood() : buildGround();
  cache[kind] = built;
  return built;
}

/**
 * Replaces per-face UVs with world-space projection along the dominant normal axis so texel density
 * stays constant on boxes of any size (three.js otherwise stretches one tile across every face).
 */
export function projectWorldUv(shader: { vertexShader: string; fragmentShader: string }, tile: number) {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vTpPos;\nvarying vec3 vTpNrm;")
    .replace("#include <project_vertex>", "#include <project_vertex>\nvTpPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvTpNrm = mat3(modelMatrix) * objectNormal;");
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vTpPos;\nvarying vec3 vTpNrm;\nvec2 tpUv;")
    .replace("#include <uv_pars_fragment>", "#include <uv_pars_fragment>\n#define vMapUv tpUv\n#define vNormalMapUv tpUv\n#define vRoughnessMapUv tpUv")
    .replace("void main() {", `void main() {\n  {\n    vec3 tpN = abs(vTpNrm);\n    vec3 tpP = vTpPos / ${tile.toFixed(3)};\n    tpUv = (tpN.y >= tpN.x && tpN.y >= tpN.z) ? tpP.xz : (tpN.x >= tpN.z ? vec2(tpP.z, tpP.y) : vec2(tpP.x, tpP.y));\n  }`);
}
