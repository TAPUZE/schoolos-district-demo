"use client";

import { memo, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, Instance, Instances, Sky } from "@react-three/drei";
import { BookOpen, Compass, Eye, EyeOff, GripHorizontal, Info, Layers3, Map, Minimize2, MousePointer2, Pause, PersonStanding, Play, RotateCcw, Search, SkipBack, SkipForward, Video, Volume2, VolumeX } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ACESFilmicToneMapping, BufferGeometry, CatmullRomCurve3, Color, Euler, Float32BufferAttribute, HalfFloatType, IcosahedronGeometry, Matrix4, Object3D, Quaternion, Raycaster, SRGBColorSpace, Vector3, WebGLRenderTarget } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import type { Group, InstancedMesh, Mesh, MeshStandardMaterial, PerspectiveCamera, PointLight } from "three";
import { createLeadPose } from "./camera-types";
import { SceneAudit } from "./scene-audit";
import { AZARAH_COLLIDERS, AzarahComplex, CourtInteriors, MountMasonry, SanctuaryBuilding, allPropColliders } from "./temple-architecture";
import { azarahBlocked, azarahHeightAt } from "./azarah-structure";
import { SANCTUARY_COLLIDERS, sanctuaryUpperHeightAt } from "./temple-structure";
import type { PlanCollider } from "./temple-structure";
import type { LeadPose } from "./camera-types";
import { getBeatStart, getCeremonyBeat, getConcurrentRouteState, getImmersionPhase, getRitualCounter, YOM_KIPPUR_SERVICE, YOM_KIPPUR_SERVICE_DURATION } from "./yom-kippur-ceremony";
import type { CeremonyStage } from "./yom-kippur-ceremony";
import { CEREMONY_STAGE_POINTS, FullYomKippurCeremony } from "./yom-kippur-simulation";
import { MISHNAH_YOMA_CHAPTER_TITLES, MISHNAH_YOMA_SOURCE } from "./mishnah-yoma-full";
import { MISHNAH_YOMA_COVERAGE } from "./mishnah-yoma-coverage";
import { CHAPTER_EIGHT_BY_BEAT, type ChapterEightLesson } from "./yoma-chapter-eight";
import { TEMPLE_GLOSSARY, type TempleGlossaryCategory } from "./temple-glossary";
import { FACADE_COLUMN_VARIANTS, FACADE_GOLD_VARIANTS, FACADE_STONE_VARIANTS, WILDERNESS_SIGNAL_VARIANTS, type FacadeColumnVariant, type FacadeGoldVariant, type FacadeStoneVariant, type WildernessSignalVariant } from "./research-variants";
import { TEMPLE_STAIRS, toWorld } from "./temple-specification";
import { mulberry32 } from "./temple-materials";
import { AltarFire, Bronze, BronzeLeaf, Limestone, Linen, PavingMaterial, surfaceProps, TempleCurtain, TempleOrnament } from "./temple-surfaces";
import { PRIEST_EYE_HEIGHT, PriestModel } from "./temple-figures";
import { VESSEL_MEASUREMENTS } from "./temple-vessel-specification";
import {
  ALTAR_BASE_HALF, ALTAR_CENTER_Z, ALTAR_HEIGHT, ALTAR_TOP_HALF, ALTAR_TOP_Y,
  AZARAH_EAST_Z, AZARAH_ROOMS, AZARAH_WEST_Z, CHAMBERS, CUBIT,
  ISRAEL_WEST_Z, MUSIC_ROOMS, OUTER_MOUNT_Y, PRIESTS_FLOOR_Y, PRIESTS_WEST_Z,
  RAMP_FOOT_LOCAL_Z, RAMP_HALF_WIDTH, RAMP_TOP_LOCAL_Y, RAMP_TOP_X,
  SLAUGHTER_POST_X, SLAUGHTER_RING_ROW_INSET, SLAUGHTER_RING_ZONE_NORTH_X,
  SLAUGHTER_RING_ZONE_SOUTH_X, SLAUGHTER_TABLE_X,
  TEMPLE_BODY_CENTER_Z, TEMPLE_BODY_DEPTH, TEMPLE_EAST_Z, TEMPLE_FLOOR_Y,
  TEMPLE_HEKHAL_WALL_WEST_Z, TEMPLE_HOLY_OF_HOLIES_WEST_Z, TEMPLE_HOLY_PLACE_WEST_Z,
  TEMPLE_PARTITION_WEST_Z, TEMPLE_PORCH_WALL_WEST_Z, TEMPLE_PORCH_WEST_Z,
  TEMPLE_REAR_CHAMBER_WEST_Z, TEMPLE_STEP_FOOT_Z, TEMPLE_STEP_RUNS,
  TEMPLE_TOP_Y, TEMPLE_WEST_WALL_WEST_Z, TEMPLE_WEST_Z, TEMPLE_MOUNT_NAV_BOUNDS,
  WOMENS_COURT_CENTER_Z, WOMENS_COURT_HALF_WIDTH, WOMENS_COURT_MAX_Z,
  WOMENS_COURT_MIN_Z, WOMENS_COURT_Y, resolveAltarMovement, walkableSurfaceHeightAt,
  JERUSALEM_GROUND_Y, distanceToWildernessRoute, jerusalemTerrainHeight,
  KIYOR_POSITION, MARBLE_SERVICE_TABLE_POSITION, SERVICE_TABLE_Z, SILVER_SERVICE_TABLE_POSITION,
} from "./temple-layout";

type FeatureId = "altar" | "facade" | "vessels" | "paving" | "womensCourt" | "chambers" | "mount" | "priest";
type ViewMode = "overview" | "third" | "first";
type ServiceState = "study" | "morning" | "afternoon" | "shabbat" | "yomKippur";
type FacingControl = { yaw: number; pitch: number };
type MapPosition = { x: number; z: number };

function templeLocationAt({x,z}:MapPosition): string {
  const chamber=CHAMBERS.find((room)=>Math.abs(x-room.x)<=8&&Math.abs(z-room.z)<=8);
  if(chamber)return `${chamber.name} Chamber · Women’s Court`;
  const azarahRoom=AZARAH_ROOMS.find((room)=>Math.abs(x-room.x)<=4.4&&Math.abs(z-room.z)<=5.2);
  if(azarahRoom)return azarahRoom.name;
  const musicRoom=MUSIC_ROOMS.find((room)=>Math.abs(x-room.x)<=3.1&&z>=ISRAEL_WEST_Z&&z<=AZARAH_EAST_Z);
  if(musicRoom)return musicRoom.name;
  if(Math.abs(x)<13.2&&z<=TEMPLE_HEKHAL_WALL_WEST_Z&&z>=TEMPLE_HOLY_PLACE_WEST_Z)return "Holy Place · Hekhal";
  if(Math.abs(x)<13.2&&z<TEMPLE_HOLY_PLACE_WEST_Z&&z>=TEMPLE_HOLY_OF_HOLIES_WEST_Z)return "Holy of Holies · Debir";
  if(Math.abs(x)<19.5&&z<=TEMPLE_EAST_Z&&z>=TEMPLE_PORCH_WEST_Z)return "Entrance Hall · Ulam";
  if(z>=WOMENS_COURT_MIN_Z&&z<=WOMENS_COURT_MAX_Z&&Math.abs(x)<=WOMENS_COURT_HALF_WIDTH)return "Women’s Court · Ezrat Nashim";
  if(z<WOMENS_COURT_MIN_Z&&z>=ISRAEL_WEST_Z&&Math.abs(x)<=27)return "Court of Israel · Ezrat Yisrael";
  if(z<ISRAEL_WEST_Z&&z>=AZARAH_WEST_Z&&Math.abs(x)<=27)return "Priests’ Court · Ezrat Kohanim";
  if(z>=TEMPLE_MOUNT_NAV_BOUNDS.minZ&&z<=TEMPLE_MOUNT_NAV_BOUNDS.maxZ)return "Temple Mount";
  return "Outside the Temple courts";
}

// Illustrative equinox-like Jerusalem sun path. The ancient texts preserve no
// exact observation date or angle; the control exists to test how real raking
// light behaves on the physical projecting/receding courses.
function sunStudyAt(hour: number) {
  const clamped = Math.max(6, Math.min(18, hour));
  const progress = (clamped - 6) / 12;
  const elevationDeg = 5 + Math.sin(progress * Math.PI) * 55;
  const azimuthDeg = 90 + progress * 180;
  const distance = 153;
  const azimuth = azimuthDeg * Math.PI / 180;
  const elevation = elevationDeg * Math.PI / 180;
  const position: [number, number, number] = [
    Math.cos(azimuth) * Math.cos(elevation) * distance,
    Math.sin(elevation) * distance,
    Math.sin(azimuth) * Math.cos(elevation) * distance,
  ];
  return {
    position,
    visualPosition: position.map((value) => value * 1.84) as [number, number, number],
    intensity: 1.35 + Math.sin(progress * Math.PI) * 3.15,
    color: clamped < 8.25 || clamped > 16.25 ? "#ffd19a" : "#fff0cf",
  };
}

const mishnahIdFromUrl = (url: string) => {
  const match = url.match(/Mishnah_Yoma\.(\d+)\.(\d+)/);
  return match ? `${match[1]}.${match[2]}` : null;
};

const smoothStep = (value: number) => {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
};

const ceremonyPreviewTime = (index: number) => {
  const safeIndex = Math.max(0, Math.min(YOM_KIPPUR_SERVICE.length - 1, index));
  const item = YOM_KIPPUR_SERVICE[safeIndex];
  const travelHeavy = ["walk", "depart", "handoff", "carry"].includes(item.action);
  return getBeatStart(safeIndex) + item.duration * (travelHeavy ? 0.78 : 0.58);
};

// Preserve the source-described hairline air gap between the ramp and altar.
const RAMP_ALTAR_GAP = 0.06;
const RAMP_TOP_LOCAL_Z = ALTAR_TOP_HALF + RAMP_ALTAR_GAP;

const boxCollider = (x: number, z: number, width: number, depth: number): PlanCollider => ({
  minX: x - width / 2,
  maxX: x + width / 2,
  minZ: z - depth / 2,
  maxZ: z + depth / 2,
});

const ARCHITECTURE_COLLIDERS: PlanCollider[] = [
  // Sanctuary (Middot 3:6-4:7), Azarah shell, chambers, Hearth and their furnishings come from the structure data.
  ...SANCTUARY_COLLIDERS,
  ...AZARAH_COLLIDERS,
  ...allPropColliders(),
  // Nicanor wall, with a centered opening aligned to the fifteen steps.
  boxCollider(-18.6, WOMENS_COURT_MIN_Z, 16.8, 1.2),
  boxCollider(-4.9, WOMENS_COURT_MIN_Z, 5.8, 1.2),
  boxCollider(4.9, WOMENS_COURT_MIN_Z, 5.8, 1.2),
  boxCollider(18.6, WOMENS_COURT_MIN_Z, 16.8, 1.2),
  // Women's Court boundary.
  boxCollider(-27, WOMENS_COURT_CENTER_Z, 1.2, 55), boxCollider(27, WOMENS_COURT_CENTER_Z, 1.2, 55),
  boxCollider(-14.5, WOMENS_COURT_MAX_Z, 25, 1.2), boxCollider(14.5, WOMENS_COURT_MAX_Z, 25, 1.2),
  // Four hollow 40-cubit corner chambers. Each inward wall has a doorway.
  ...CHAMBERS.flatMap(({ x, z }) => {
    const inwardX = x < 0 ? -11 : 11;
    const doorSide = x < 0 ? -1 : 1;
    return [
      boxCollider(x, z - 8, 16, 0.8), boxCollider(x, z + 8, 16, 0.8),
      boxCollider(inwardX, z - 5.1, 0.8, 5.8), boxCollider(inwardX, z + 5.1, 0.8, 5.8),
      boxCollider(x + doorSide * 8, z, 0.8, 16),
    ];
  }),
  ...MUSIC_ROOMS.flatMap(({ x }) => [
    boxCollider(x, ISRAEL_WEST_Z, 6, 0.35),
    boxCollider(x - 3, (ISRAEL_WEST_Z + AZARAH_EAST_Z) / 2, 0.35, AZARAH_EAST_Z - ISRAEL_WEST_Z),
    boxCollider(x + 3, (ISRAEL_WEST_Z + AZARAH_EAST_Z) / 2, 0.35, AZARAH_EAST_Z - ISRAEL_WEST_Z),
  ]),
];

function collidesWithArchitecture(x: number, z: number, y = 0) {
  if (azarahBlocked(x, z, y)) return true;
  const radius = 0.32;
  return ARCHITECTURE_COLLIDERS.some((wall) => {
    // Colliders that carry a vertical extent only stop visitors whose body overlaps it.
    if (wall.y0 !== undefined && wall.y1 !== undefined && (y + 1.6 <= wall.y0 || y >= wall.y1 - 0.25)) return false;
    const closestX = Math.max(wall.minX, Math.min(x, wall.maxX));
    const closestZ = Math.max(wall.minZ, Math.min(z, wall.maxZ));
    return (x - closestX) ** 2 + (z - closestZ) ** 2 < radius ** 2;
  });
}

function walkableHeightAt(x: number, z: number, y: number) {
  return azarahHeightAt(x, z, y) ?? sanctuaryUpperHeightAt(x, z, y) ?? walkableSurfaceHeightAt(x, z, y);
}

type WebMcpContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: Record<string, unknown>;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};

const FEATURES: Record<FeatureId, { name: string; source: string; grade: string; detail: string }> = {
  altar: {
    name: "Altar of burnt offering",
    source: "Mishnah Middot 3.1–4",
    grade: "C · Rabbinic dimensions",
    detail: "Shown at a 32 × 32 cubit base with stepped stages and a southern ramp. Josephus gives a conflicting 50-cubit dimension, so this is one selectable reconstruction.",
  },
  facade: {
    name: "Temple façade",
    source: "Mishnah Middot 3.6; 4 · Josephus, War 5.222–224 · Sukkah 51b · Bava Batra 4a",
    grade: "B/C · Ancient texts",
    detail: "The sanctuary follows Middot 4:3–7: a six-cubit podium, 100-cubit porch, recessed Hekhal walls, 38 side cells, the north mesibah ascent, upper chamber and measured roof build-up. Josephus places the dazzling gold on the outward front and calls the remaining exterior extremely white. Alternating pale projecting and receding courses continue around the front, sides and rear to interpret Bava Batra 4a's 'waves of the sea'; raking sunlight, rather than blue paint, makes the relief legible. Their exact tint, projection and solar response are reconstruction choices.",
  },
  vessels: {
    name: "Temple vessels",
    source: "Exodus 25, 30 · Menachot 28b · Middot 3.5–6 · Yoma 3.10; 5.2 · Shekalim 6",
    grade: "B/C · Measured texts and period testimony",
    detail: "The measured layer now includes the three gold Holy Place vessels, twelve-spout laver, Foundation Stone, slaughtering installation, thirteen service tables, daily-service utensils and thirteen collection chests. Exact counts and known dimensions follow the texts; unsized movable utensils are visibly marked as reconstructions.",
  },
  paving: {
    name: "Inner court levels",
    source: "Mishnah Middot 2.6; 5.1 · Josephus, War 5.151",
    grade: "C/D · Measured plan and reconstructed finish",
    detail: "Israel's Court and the Priests' Court are each 135 × 11 cubits. A one-cubit full-width rise and three half-cubit platform steps produce the stated 2.5-cubit elevation; the pavement pattern and instrument-room subdivision remain reconstructed.",
  },
  womensCourt: {
    name: "Women's Court",
    source: "Mishnah Middot 2.5",
    grade: "C · Rabbinic dimensions",
    detail: "A 135 × 135 cubit court with four 40-cubit corner chambers follows Middot. Fifteen physical semicircular steps now rise to the 10-by-20-cubit Nicanor opening; the elevated gallery follows the textual function while its supports and railings remain interpretive.",
  },
  chambers: {
    name: "Court chambers",
    source: "Mishnah Middot 2.5–6; 5.3–4",
    grade: "C · Rabbinic plan",
    detail: "The four measured 40 × 40 cubit Women's Court rooms are open-roofed corner courts furnished as Middot describes (hearths and pots, wood stores, an immersion pool, oil and wine stores). The six Azarah chambers stand on the Azarah terrace with walls, doors, flat roofs and parapets, packed with salt, hides, marble washing tables, logs, the cistern and wheel, and Sanhedrin benches. The vaulted Hearth hall has its four rooms, two gates and sleeping ledges, and its north-west room opens on a two-flight stair to the lit underground bath, latrine and warming fire (Middot 1:6–9). Middot names these rooms but not their sizes; dimensions, roofs, the stair form and the underground plan are reconstructed and kept separate from surveyed cavities.",
  },
  mount: {
    name: "Temple Mount platform",
    source: "Mishnah Middot 1.3; 2.1 · extant Herodian walls",
    grade: "C · Textual precinct reconstruction",
    detail: "This release visualizes Middot's 500 × 500 cubit sacred precinct as a solid platform with its five named gate positions. It is not yet the full irregular Herodian extension seen in the surviving enclosure; that archaeological outer-platform variant remains the next plan layer.",
  },
  priest: {
    name: "Priest scale figure",
    source: "Exodus 28–29 · Josephus, Antiquities 3.151–187",
    grade: "C · Text-led interpretation",
    detail: "Ordinary priests wear the four white linen garments. The High Priest's gold-vestment state adds a dark tekhelet robe, multicolored woven ephod, shoulder stones, gold chains and blue cords, a 4-by-3 breastplate and the gold forehead plate. Garment categories and connections follow Exodus 28 and later descriptions; exact dyes, gems, cut and drape remain interpretive.",
  },
};

function StableArchitectureShadows() {
  const { gl } = useThree();
  const frame = useRef(0);
  useFrame(() => {
    gl.shadowMap.autoUpdate = false;
    frame.current += 1;
    if (frame.current <= 3 || frame.current % 3 === 0) gl.shadowMap.needsUpdate = true;
  });
  useEffect(() => () => { gl.shadowMap.autoUpdate = true; }, [gl]);
  return null;
}

function Landscape() {
  const geometry = useMemo(() => {
    const size = 3000;
    const segments = 220;
    const geo = new BufferGeometry();
    const positions = new Float32Array((segments + 1) ** 2 * 3);
    const colors = new Float32Array((segments + 1) ** 2 * 3);
    const indices: number[] = [];
    const dry = [0.86, 0.76, 0.6];
    const olive = [0.5, 0.54, 0.36];
    const rock = [0.96, 0.92, 0.84];
    for (let row = 0; row <= segments; row += 1) {
      for (let col = 0; col <= segments; col += 1) {
        const x = (col / segments - 0.5) * size;
        const z = (row / segments - 0.5) * size + 14;
        const y = jerusalemTerrainHeight(x, z);
        const index = (row * (segments + 1) + col) * 3;
        positions[index] = x;
        positions[index + 1] = y;
        positions[index + 2] = z;
        const slope = Math.abs(jerusalemTerrainHeight(x + 6, z) - y) + Math.abs(jerusalemTerrainHeight(x, z + 6) - y);
        const patch = (Math.sin(x * 0.031 + z * 0.017) + Math.sin(x * 0.013 - z * 0.041) + 2) / 4;
        const greenMix = Math.max(0, Math.min(1, (y - JERUSALEM_GROUND_Y) / 40)) * 0.55 * patch + 0.12 * patch;
        const rockMix = Math.min(1, slope / 6);
        for (let channel = 0; channel < 3; channel += 1) {
          const base = dry[channel] + (olive[channel] - dry[channel]) * greenMix;
          colors[index + channel] = base + (rock[channel] - base) * rockMix;
        }
      }
    }
    for (let row = 0; row < segments; row += 1) {
      for (let col = 0; col < segments; col += 1) {
        const a = row * (segments + 1) + col;
        const b = a + 1;
        const c = a + segments + 1;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);
  const maps = useMemo(() => surfaceProps("ground"), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}><meshStandardMaterial {...maps} vertexColors color="#ffffff" roughness={1} metalness={0} /></mesh>;
}

function Vegetation() {
  const olives = useRef<InstancedMesh>(null);
  const blobs = useRef<InstancedMesh>(null);
  const canopyGeometry = useMemo(() => {
    const geo = new IcosahedronGeometry(1.8, 2);
    const positions = geo.attributes.position;
    const vertex = new Vector3();
    for (let i = 0; i < positions.count; i += 1) {
      vertex.fromBufferAttribute(positions, i);
      const bump = 1 + Math.sin(vertex.x * 3.1 + vertex.y * 2.3) * 0.09 + Math.sin(vertex.z * 4.7 - vertex.x * 1.9) * 0.07;
      vertex.multiplyScalar(bump);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
  const trunks = useRef<InstancedMesh>(null);
  const cypresses = useRef<InstancedMesh>(null);
  const placements = useMemo(() => {
    const rand = mulberry32(2024);
    const olive: { x: number; y: number; z: number; scale: number; tone: number }[] = [];
    const cypress: typeof olive = [];
    for (let attempt = 0; attempt < 2600 && olive.length + cypress.length < 900; attempt += 1) {
      const x = (rand() - 0.5) * 1300;
      const z = 14 + (rand() - 0.5) * 1300;
      if (Math.abs(x) < 132 && z > -118 && z < 146) continue;
      if (z>118&&distanceToWildernessRoute(x,z)<5.2) continue;
      const y = jerusalemTerrainHeight(x, z);
      if (Math.abs(jerusalemTerrainHeight(x + 5, z) - y) + Math.abs(jerusalemTerrainHeight(x, z + 5) - y) > 4.5) continue;
      const cluster = Math.sin(x * 0.021) * Math.cos(z * 0.017) + Math.sin(x * 0.007 + z * 0.011);
      if (cluster < -0.2 && rand() < 0.75) continue;
      const entry = { x, y, z, scale: 0.7 + rand() * 0.9, tone: rand() };
      if (rand() < 0.22) cypress.push(entry);
      else olive.push(entry);
    }
    return { olive, cypress };
  }, []);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    const tint = new Color();
    placements.olive.forEach((tree, index) => {
      dummy.position.set(tree.x, tree.y + 1.2 * tree.scale, tree.z);
      dummy.rotation.set(0, tree.tone * 6.28, 0);
      dummy.scale.setScalar(tree.scale);
      dummy.updateMatrix();
      trunks.current?.setMatrixAt(index, dummy.matrix);
      dummy.position.set(tree.x, tree.y + 3.3 * tree.scale, tree.z);
      dummy.scale.set(tree.scale * 1.5, tree.scale * 0.95, tree.scale * 1.5);
      dummy.updateMatrix();
      olives.current?.setMatrixAt(index, dummy.matrix);
      olives.current?.setColorAt(index, tint.setRGB(0.2 + tree.tone * 0.1, 0.27 + tree.tone * 0.1, 0.14 + tree.tone * 0.05, SRGBColorSpace));
      dummy.position.set(tree.x + Math.cos(tree.tone * 40) * 1.5 * tree.scale, tree.y + 3.9 * tree.scale, tree.z + Math.sin(tree.tone * 40) * 1.5 * tree.scale);
      dummy.rotation.set(0, tree.tone * 17, 0);
      dummy.scale.set(tree.scale * 1.05, tree.scale * 0.8, tree.scale * 1.05);
      dummy.updateMatrix();
      blobs.current?.setMatrixAt(index, dummy.matrix);
      blobs.current?.setColorAt(index, tint.setRGB(0.26 + tree.tone * 0.1, 0.33 + tree.tone * 0.09, 0.19 + tree.tone * 0.05, SRGBColorSpace));
    });
    placements.cypress.forEach((tree, index) => {
      dummy.position.set(tree.x, tree.y + 4.6 * tree.scale, tree.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(tree.scale, tree.scale * (0.9 + tree.tone * 0.5), tree.scale);
      dummy.updateMatrix();
      cypresses.current?.setMatrixAt(index, dummy.matrix);
      cypresses.current?.setColorAt(index, tint.setRGB(0.1 + tree.tone * 0.05, 0.2 + tree.tone * 0.06, 0.12 + tree.tone * 0.03, SRGBColorSpace));
    });
    for (const mesh of [olives.current, blobs.current, trunks.current, cypresses.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }, [placements]);

  return <group>
    <instancedMesh ref={trunks} args={[undefined, undefined, placements.olive.length]} frustumCulled={false}><cylinderGeometry args={[0.22, 0.38, 2.4, 6]} /><meshStandardMaterial color="#5a4632" roughness={1} /></instancedMesh>
    <instancedMesh ref={olives} args={[undefined, undefined, placements.olive.length]} frustumCulled={false}><primitive object={canopyGeometry} attach="geometry" /><meshStandardMaterial color="#ffffff" roughness={0.95} /></instancedMesh>
    <instancedMesh ref={blobs} args={[undefined, undefined, placements.olive.length]} frustumCulled={false}><primitive object={canopyGeometry} attach="geometry" /><meshStandardMaterial color="#ffffff" roughness={0.95} /></instancedMesh>
    <instancedMesh ref={cypresses} args={[undefined, undefined, placements.cypress.length]} frustumCulled={false}><coneGeometry args={[1.05, 9.2, 9]} /><meshStandardMaterial color="#ffffff" roughness={0.95} /></instancedMesh>
  </group>;
}

function AmbientOcclusion() {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const target = new WebGLRenderTarget(size.width, size.height, { type: HalfFloatType, samples: 4 });
    const stack = new EffectComposer(gl, target);
    const occlusion = new GTAOPass(scene, camera, size.width, size.height);
    occlusion.blendIntensity = 1;
    occlusion.updateGtaoMaterial({ radius: 2.6, distanceExponent: 1.4, thickness: 2, scale: 1.25, samples: 16, distanceFallOff: 1, screenSpaceRadius: false });
    occlusion.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
    // GTAO renders every mesh opaque in its depth pass; hide glass-like meshes so they do not cast phantom occlusion.
    const hidden: Object3D[] = [];
    const patched = occlusion as unknown as { _overrideVisibility: () => void; _restoreVisibility: () => void };
    const baseOverride = patched._overrideVisibility.bind(occlusion);
    const baseRestore = patched._restoreVisibility.bind(occlusion);
    patched._overrideVisibility = () => {
      baseOverride();
      scene.traverseVisible((object) => {
        const material = (object as Mesh).material;
        if ((object as Mesh).isMesh && material && !Array.isArray(material) && material.transparent && material.opacity < 0.95) {
          object.visible = false;
          hidden.push(object);
        }
      });
    };
    patched._restoreVisibility = () => {
      for (const object of hidden) object.visible = true;
      hidden.length = 0;
      baseRestore();
    };
    stack.addPass(new RenderPass(scene, camera));
    stack.addPass(occlusion);
    stack.addPass(new OutputPass());
    return stack;
  }, [gl, scene, camera]);
  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
  }, [composer, gl, size.width, size.height]);
  useEffect(() => () => composer.dispose(), [composer]);
  const enabled = useRef(true);
  const sampleStart = useRef(0);
  const sampleFrames = useRef(0);
  useFrame((_, delta) => {
    if (!enabled.current) {
      gl.render(scene, camera);
      return;
    }
    // Drop the occlusion pass on machines that cannot sustain ~22 fps with it.
    sampleFrames.current += 1;
    const now = performance.now();
    if (sampleStart.current === 0) sampleStart.current = now;
    if (now - sampleStart.current > 6000 && sampleFrames.current > 30) {
      const fps = (sampleFrames.current / (now - sampleStart.current)) * 1000;
      if (fps < 22) enabled.current = false;
      sampleStart.current = now;
      sampleFrames.current = 0;
    }
    composer.render(delta);
  }, 1);
  return null;
}

function StoneBlock({ position, scale, evidence, selected, onSelect }: { position: [number, number, number]; scale: [number, number, number]; evidence: boolean; selected: boolean; onSelect: () => void }) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <boxGeometry />
      <Limestone evidence={evidence} selected={selected} />
    </mesh>
  );
}

function AltarRamp({ evidence, selected, onSelect }: { evidence: boolean; selected: boolean; onSelect: () => void }) {
  const geometry = useMemo(() => {
    const ramp = new BufferGeometry();
    ramp.setAttribute("position", new Float32BufferAttribute([
      -RAMP_HALF_WIDTH, 0, RAMP_TOP_LOCAL_Z, RAMP_HALF_WIDTH, 0, RAMP_TOP_LOCAL_Z, -RAMP_HALF_WIDTH, 0, RAMP_FOOT_LOCAL_Z, RAMP_HALF_WIDTH, 0, RAMP_FOOT_LOCAL_Z,
      -RAMP_HALF_WIDTH, RAMP_TOP_LOCAL_Y, RAMP_TOP_LOCAL_Z, RAMP_HALF_WIDTH, RAMP_TOP_LOCAL_Y, RAMP_TOP_LOCAL_Z, -RAMP_HALF_WIDTH, 0.18, RAMP_FOOT_LOCAL_Z, RAMP_HALF_WIDTH, 0.18, RAMP_FOOT_LOCAL_Z,
    ], 3));
    ramp.setAttribute("uv", new Float32BufferAttribute([
      0, 0, 1, 0, 0, 1, 1, 1,
      0, 0, 1, 0, 0, 1, 1, 1,
    ], 2));
    ramp.setIndex([
      0, 2, 1, 1, 2, 3,
      4, 6, 5, 5, 6, 7,
      0, 4, 2, 2, 4, 6,
      1, 3, 5, 3, 7, 5,
      2, 6, 3, 3, 6, 7,
    ]);
    ramp.computeVertexNormals();
    return ramp;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group rotation={[0, -Math.PI / 2, 0]} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <mesh geometry={geometry} castShadow receiveShadow renderOrder={2}>
        <Limestone evidence={evidence} selected={selected} surfaceOffset />
      </mesh>
    </group>
  );
}

function AuxiliaryAltarRamp({
  name, start, end, width, evidence, selected, onSelect,
}: {
  name: string;
  start: [number, number, number];
  end: [number, number, number];
  width: number;
  evidence: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const geometry = useMemo(() => {
    const [sx, sy, sz] = start;
    const [ex, ey, ez] = end;
    const dx = ex - sx;
    const dz = ez - sz;
    const length = Math.hypot(dx, dz) || 1;
    const px = -(dz / length) * width / 2;
    const pz = (dx / length) * width / 2;
    const floor = 0.08;
    const ramp = new BufferGeometry();
    ramp.setAttribute("position", new Float32BufferAttribute([
      sx + px, sy, sz + pz, sx - px, sy, sz - pz,
      ex + px, ey, ez + pz, ex - px, ey, ez - pz,
      sx + px, floor, sz + pz, sx - px, floor, sz - pz,
      ex + px, floor, ez + pz, ex - px, floor, ez - pz,
    ], 3));
    ramp.setIndex([
      0, 2, 1, 1, 2, 3,
      4, 5, 6, 5, 7, 6,
      0, 4, 2, 2, 4, 6,
      1, 3, 5, 3, 7, 5,
      2, 6, 3, 3, 6, 7,
      0, 1, 4, 1, 5, 4,
    ]);
    ramp.computeVertexNormals();
    return ramp;
  }, [end, start, width]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh name={name} geometry={geometry} castShadow receiveShadow onClick={(event) => { event.stopPropagation(); onSelect(); }}>
    <Limestone evidence={evidence} selected={selected} surfaceOffset />
  </mesh>;
}

function Altar({ evidence, selected, onSelect, actionPulse }: { evidence: boolean; selected: boolean; onSelect: () => void; actionPulse: number }) {
  const courseBlocks = useMemo(() => {
    const blocks: Array<{ position: [number, number, number]; scale: [number, number, number] }> = [];
    for (let x = -5.1; x <= 5.1; x += 1.7) {
      blocks.push({ position: [x, 3.25, -5.58], scale: [1.55, 0.64, 0.18] });
      blocks.push({ position: [x, 3.25, 5.58], scale: [1.55, 0.64, 0.18] });
    }
    for (let z = -4.25; z <= 4.25; z += 1.7) {
      blocks.push({ position: [-5.58, 3.25, z], scale: [0.18, 0.64, 1.55] });
      blocks.push({ position: [5.58, 3.25, z], scale: [0.18, 0.64, 1.55] });
    }
    return blocks;
  }, []);

  return (
    <group position={[0, PRIESTS_FLOOR_Y, ALTAR_CENTER_Z]}>
      {/* Middot 3:1: the 32-cubit foundation omits the south-east cubit.
          Two blocks form the L-shaped foundation without faking the recess as
          a painted mark. In this world -X is south and +Z is east. */}
      <StoneBlock position={[0,0.2,-CUBIT/2]} scale={[32*CUBIT,1*CUBIT,31*CUBIT]} evidence={evidence} selected={selected} onSelect={onSelect} />
      <StoneBlock position={[CUBIT/2,0.2,ALTAR_BASE_HALF-CUBIT/2]} scale={[31*CUBIT,1*CUBIT,1*CUBIT]} evidence={evidence} selected={selected} onSelect={onSelect} />
      <StoneBlock position={[0, 1.4, 0]} scale={[30 * CUBIT, 5 * CUBIT, 30 * CUBIT]} evidence={evidence} selected={selected} onSelect={onSelect} />
      <StoneBlock position={[0, 3, 0]} scale={[28 * CUBIT, 3 * CUBIT, 28 * CUBIT]} evidence={evidence} selected={selected} onSelect={onSelect} />
      {courseBlocks.map((block, index) => (
        <mesh key={index} position={block.position} scale={block.scale} castShadow receiveShadow>
          <boxGeometry />
          <Limestone evidence={evidence} />
        </mesh>
      ))}
      <AltarRamp evidence={evidence} selected={selected} onSelect={onSelect} />
      {/* Middot 3:3 records a one-cubit revuvah on the western side of the
          ramp. Its exact closure is uncertain, so this reconstruction shows a
          recessed opening with a plain stone frame. */}
      <group name="western-ramp-revuvah" position={[-10.05,0.55,-RAMP_HALF_WIDTH-0.015]}>
        <mesh><planeGeometry args={[CUBIT,CUBIT]} /><meshStandardMaterial color="#211c18" roughness={1} side={2} /></mesh>
        {[-1,1].map((edge)=><mesh key={`revuvah-side-${edge}`} position={[edge*(CUBIT/2+0.035),0,0]} castShadow><boxGeometry args={[0.07,CUBIT+0.14,0.08]} /><Limestone evidence={evidence} /></mesh>)}
        {[-1,1].map((edge)=><mesh key={`revuvah-cap-${edge}`} position={[0,edge*(CUBIT/2+0.035),0]} castShadow><boxGeometry args={[CUBIT+0.14,0.07,0.08]} /><Limestone evidence={evidence} /></mesh>)}
      </group>
      {/* Middot 3:3: two genuinely sloped branch ramps leave the south ramp.
          West (-Z) descends to the foundation; east (+Z) reaches the sovev.
          The exact branch pitch is explicitly reconstructed. */}
      <AuxiliaryAltarRamp name="altar-west-ramp-to-foundation" start={[-10.45,2.25,-RAMP_HALF_WIDTH+0.12]} end={[-6.58,0.42,-ALTAR_BASE_HALF+0.42]} width={1.18} evidence={evidence} selected={selected} onSelect={onSelect} />
      <AuxiliaryAltarRamp name="altar-east-ramp-to-sovev" start={[-9.0,2.82,RAMP_HALF_WIDTH-0.12]} end={[-6.05,2.42,ALTAR_TOP_HALF+0.18]} width={1.18} evidence={evidence} selected={selected} onSelect={onSelect} />
      {/* Scarlet line at half height distinguishes upper and lower blood applications. */}
      {[[-5.72,0,0.035,11.5],[5.72,0,0.035,11.5],[0,-5.72,11.5,0.035],[0,5.72,11.5,0.035]].map(([x,z,w,d],index)=><mesh key={`scarlet-line-${index}`} position={[x,1.8,z]} castShadow>
        <boxGeometry args={[w,0.075,d]} /><meshStandardMaterial color="#a51f2d" roughness={0.82} />
      </mesh>)}
      {[-(ALTAR_TOP_HALF-CUBIT/2), ALTAR_TOP_HALF-CUBIT/2].flatMap((x) => [-(ALTAR_TOP_HALF-CUBIT/2), ALTAR_TOP_HALF-CUBIT/2].map((z) => (
        <mesh key={`${x}-${z}`} position={[x, 3.8, z]} castShadow>
          <boxGeometry args={[CUBIT,CUBIT,CUBIT]} />
          <Limestone evidence={evidence} />
        </mesh>
      )))}
      {/* Middot 3:1: the 28-cubit top contains a 26-cubit horn zone and,
          inside its one-cubit priest walkway, a 24-cubit fire area. They are
          coplanar working zones, so scored boundaries replace false steps. */}
      <mesh name="twenty-four-cubit-fire-area" position={[0,3.605,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={[24*CUBIT,24*CUBIT]} /><meshStandardMaterial color="#8f7b65" roughness={0.96} />
      </mesh>
      {[26*CUBIT/2,24*CUBIT/2].flatMap((half,band)=>[
        <mesh key={`zone-n-${band}`} position={[0,3.612,half]} castShadow><boxGeometry args={[half*2,0.025,0.035]} /><meshStandardMaterial color="#584c40" roughness={1} /></mesh>,
        <mesh key={`zone-s-${band}`} position={[0,3.612,-half]} castShadow><boxGeometry args={[half*2,0.025,0.035]} /><meshStandardMaterial color="#584c40" roughness={1} /></mesh>,
        <mesh key={`zone-e-${band}`} position={[half,3.612,0]} castShadow><boxGeometry args={[0.035,0.025,half*2]} /><meshStandardMaterial color="#584c40" roughness={1} /></mesh>,
        <mesh key={`zone-w-${band}`} position={[-half,3.612,0]} castShadow><boxGeometry args={[0.035,0.025,half*2]} /><meshStandardMaterial color="#584c40" roughness={1} /></mesh>,
      ])}
      {/* Two drainage apertures at the south-west foundation corner. */}
      <mesh name="south-west-drain-south-face" position={[-ALTAR_BASE_HALF-0.012,0.34,-ALTAR_BASE_HALF+CUBIT*2.2]} rotation={[0,-Math.PI/2,0]}>
        <circleGeometry args={[0.13,20]} /><meshStandardMaterial color="#29241f" roughness={1} />
      </mesh>
      <mesh name="south-west-drain-west-face" position={[-ALTAR_BASE_HALF+CUBIT*2.2,0.34,-ALTAR_BASE_HALF-0.012]}>
        <circleGeometry args={[0.13,20]} /><meshStandardMaterial color="#29241f" roughness={1} />
      </mesh>
      {[
        { position: [0, 3.28, 5.605] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },
        { position: [0, 3.28, -5.605] as [number, number, number], rotation: [0, Math.PI, 0] as [number, number, number] },
        { position: [5.605, 3.28, 0] as [number, number, number], rotation: [0, Math.PI / 2, 0] as [number, number, number] },
        { position: [-5.605, 3.28, 0] as [number, number, number], rotation: [0, -Math.PI / 2, 0] as [number, number, number] },
      ].map((stain, index) => (
        <mesh key={`soot-${index}`} position={stain.position} rotation={stain.rotation}>
          <planeGeometry args={[8.8, 0.72]} />
          <meshStandardMaterial color="#3a2b22" transparent opacity={0.19} roughness={1} depthWrite={false} />
        </mesh>
      ))}
      {/* The top is a working service surface, not a single bonfire: the large
          pile, incense-coal pile, a smaller perpetual-fire reconstruction and
          the central ash accumulation remain visually distinct. */}
      <group name="large-woodpile-east" position={[0,3.61,2.55]} scale={0.48}><AltarFire actionPulse={actionPulse} topY={0} /></group>
      <group name="incense-coal-pile-southwest" position={[-3.55,3.61,-3.55]} scale={0.22}><AltarFire actionPulse={0} topY={0} /></group>
      <group name="perpetual-fire-reconstructed" position={[3.45,3.61,-3.25]} scale={0.18}><AltarFire actionPulse={0} topY={0} /></group>
      <group name="tapuach-ash-heap" position={[0,3.64,0]}>
        <mesh castShadow receiveShadow><cylinderGeometry args={[0.78,1.02,0.34,28]} /><meshStandardMaterial color="#6d6962" roughness={1} /></mesh>
        <mesh position={[0,0.22,0]} scale={[1,0.42,1]}><sphereGeometry args={[0.72,20,12]} /><meshStandardMaterial color="#817b72" roughness={1} /></mesh>
      </group>
      {selected && <>
        <Html position={[0,4.65,2.55]} center distanceFactor={16}><button className="hotspot" onClick={onSelect}>Large woodpile · east</button></Html>
        <Html position={[-3.55,4.25,-3.55]} center distanceFactor={16}><button className="hotspot" onClick={onSelect}>Incense coals · southwest</button></Html>
        <Html position={[0,4.55,0]} center distanceFactor={16}><button className="hotspot" onClick={onSelect}>Tapuach · central ash heap</button></Html>
      </>}
      <Html position={[0, 5.5, 0]} center distanceFactor={18} occlude>
        <button className="hotspot" onClick={onSelect} aria-label="Inspect the altar">32 × 32 cubits</button>
      </Html>
    </group>
  );
}

function PriestFigure({ selected, onSelect, onInteract, onAltarAction, onActionAvailability, onPlayerMove, viewMode, figureRef, facingRef, guided, onTakeControl }: { selected: boolean; onSelect: () => void; onInteract: (feature: FeatureId) => void; onAltarAction: () => void; onActionAvailability: (available: boolean) => void; onPlayerMove: (position: MapPosition) => void; viewMode: ViewMode; figureRef: React.RefObject<Group | null>; facingRef: React.MutableRefObject<FacingControl>; guided: boolean; onTakeControl: () => void }) {
  const { camera, gl } = useThree();
  const keys = useRef(new Set<string>());
  const velocity = useRef(new Vector3());
  const control = useRef({ guided, onTakeControl });
  useEffect(() => {
    control.current = { guided, onTakeControl };
  });
  const movementForward = useMemo(() => new Vector3(), []);
  const movementRight = useMemo(() => new Vector3(), []);
  const movementVector = useMemo(() => new Vector3(), []);
  const worldUp = useMemo(() => new Vector3(0, 1, 0), []);
  const walkTime = useRef(0);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const actionWasAvailable = useRef(false);
  const lastMapUpdate = useRef(0);
  const lastReportedPosition = useRef<MapPosition | null>(null);

  useEffect(() => {
    figureRef.current?.traverse((object) => {
      if ("castShadow" in object) object.castShadow = false;
    });
  }, [figureRef]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target=event.target instanceof Element ? event.target : null;
      if(target?.closest('input,select,textarea,[contenteditable="true"],[role="dialog"]'))return;
      const movementKey = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"].includes(event.code);
      // A focused toolbar button must not swallow walking keys, but Space still activates the button.
      if(!movementKey&&target?.closest('button,a,summary'))return;
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
      if (event.code === "Space") {
        if (event.repeat || !figureRef.current) return;
        const { x, y, z } = figureRef.current.position;
        if (Math.abs(z - ALTAR_CENTER_Z) < RAMP_HALF_WIDTH && x >= RAMP_TOP_X - 0.45 && x < RAMP_TOP_X + 3.1 && y > ALTAR_TOP_Y - 0.7) {
          onInteract("altar");
          onAltarAction();
        } else {
          const altarDistance = Math.hypot(x, z - ALTAR_CENTER_Z);
          const facadeDistance = Math.hypot(x, z + 28);
          const inCornerChamber = CHAMBERS.some((room) => Math.abs(x - room.x) < 8 && Math.abs(z - room.z) < 8) || MUSIC_ROOMS.some((room) => Math.abs(x - room.x) < 3 && z >= ISRAEL_WEST_Z && z <= AZARAH_EAST_Z);
          const nearVessels = (z < TEMPLE_HEKHAL_WALL_WEST_Z && z > TEMPLE_WEST_Z) || Math.hypot(x - KIYOR_POSITION[0], z - KIYOR_POSITION[2]) < 4 || (x > 8 && x < 23 && z > ALTAR_CENTER_Z - 8 && z < ALTAR_CENTER_Z + 8) || Math.hypot(x - MARBLE_SERVICE_TABLE_POSITION[0], z - SERVICE_TABLE_Z) < 5;
          onInteract(inCornerChamber ? "chambers" : z >= WOMENS_COURT_MIN_Z ? "womensCourt" : nearVessels ? "vessels" : altarDistance < 18 ? "altar" : facadeDistance < 22 ? "facade" : "paving");
        }
        return;
      }
      keys.current.add(event.code);
      if (control.current.guided && ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) control.current.onTakeControl();
    };
    const onKeyUp = (event: KeyboardEvent) => keys.current.delete(event.code);
    const clearKeys = () => keys.current.clear();
    const onVisibilityChange = () => {
      if (document.hidden) clearKeys();
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearKeys);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearKeys();
    };
  }, [figureRef, onActionAvailability, onAltarAction, onInteract, viewMode]);

  useFrame((_, delta) => {
    const figure = figureRef.current;
    if (!figure) return;
    const dt = Math.min(delta, 0.04);
    let moving = false;

    {
      // Move relative to where the visitor is looking: the view yaw in first/third person, the lens in overview.
      const forward = movementForward;
      if (viewMode === "overview") {
        camera.getWorldDirection(forward);
        forward.y = 0;
        if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
        forward.normalize();
      } else {
        forward.set(-Math.sin(facingRef.current.yaw), 0, -Math.cos(facingRef.current.yaw));
      }
      const right = movementRight.crossVectors(forward, worldUp).normalize();
      const inputLive = !control.current.guided;
      const forwardInput = inputLive ? (keys.current.has("KeyW") || keys.current.has("ArrowUp") ? 1 : 0) - (keys.current.has("KeyS") || keys.current.has("ArrowDown") ? 1 : 0) : 0;
      const sideInput = inputLive ? (keys.current.has("KeyD") || keys.current.has("ArrowRight") ? 1 : 0) - (keys.current.has("KeyA") || keys.current.has("ArrowLeft") ? 1 : 0) : 0;
      const wanted = movementVector.copy(forward).multiplyScalar(forwardInput).addScaledVector(right, sideInput);
      const sprint = keys.current.has("ShiftLeft") || keys.current.has("ShiftRight");
      const topSpeed = sprint ? 9.5 : 5.2;
      if (wanted.lengthSq() > 0) wanted.normalize().multiplyScalar(topSpeed);
      const response = 1 - Math.exp(-dt * (wanted.lengthSq() > 0 ? 9 : 13));
      velocity.current.x += (wanted.x - velocity.current.x) * response;
      velocity.current.z += (wanted.z - velocity.current.z) * response;
      const speed = Math.hypot(velocity.current.x, velocity.current.z);
      moving = speed > 0.12;
      figure.userData.speed = speed;
      if (moving) {
        const stepX = velocity.current.x * dt;
        const stepZ = velocity.current.z * dt;
        // Keep the avatar on the complete 200 × 200 world-unit mount slab.
        const targetX = Math.max(TEMPLE_MOUNT_NAV_BOUNDS.minX, Math.min(TEMPLE_MOUNT_NAV_BOUNDS.maxX, figure.position.x + stepX));
        const targetZ = Math.max(TEMPLE_MOUNT_NAV_BOUNDS.minZ, Math.min(TEMPLE_MOUNT_NAV_BOUNDS.maxZ, figure.position.z + stepZ));
        let nextX = targetX;
        let nextZ = targetZ;
        if (collidesWithArchitecture(targetX, targetZ, figure.position.y)) {
          // Slide along the wall instead of stopping dead.
          if (!collidesWithArchitecture(targetX, figure.position.z, figure.position.y)) {
            nextZ = figure.position.z;
            velocity.current.z *= 0.4;
          } else if (!collidesWithArchitecture(figure.position.x, targetZ, figure.position.y)) {
            nextX = figure.position.x;
            velocity.current.x *= 0.4;
          } else {
            nextX = figure.position.x;
            nextZ = figure.position.z;
            velocity.current.set(0, 0, 0);
          }
        }
        const altarMovement = resolveAltarMovement(
          { x: figure.position.x, y: figure.position.y, z: figure.position.z },
          { x: nextX, y: figure.position.y, z: nextZ },
        );
        if (!altarMovement.allowed) {
          velocity.current.set(0, 0, 0);
        } else {
          figure.position.x = nextX;
          figure.position.z = nextZ;
        }
        const targetRotation = Math.atan2(velocity.current.x, velocity.current.z);
        const turnDelta = Math.atan2(Math.sin(targetRotation - figure.rotation.y), Math.cos(targetRotation - figure.rotation.y));
        figure.rotation.y += turnDelta * Math.min(1, dt * 12);
        walkTime.current += dt * (2.2 + speed * 1.15);
        figure.userData.walkPhase = walkTime.current;
      }
      // Steps and ramps are stored as discrete heights; ease into them so the view never pops.
      const surfaceY = walkableHeightAt(figure.position.x, figure.position.z, figure.position.y);
      figure.position.y = Math.abs(surfaceY - figure.position.y) > 1.5 ? surfaceY : figure.position.y + (surfaceY - figure.position.y) * (1 - Math.exp(-dt * 18));

      const actionAvailable = Math.abs(figure.position.z - ALTAR_CENTER_Z) < RAMP_HALF_WIDTH && figure.position.x >= RAMP_TOP_X - 0.45 && figure.position.x < RAMP_TOP_X + 3.1 && figure.position.y > ALTAR_TOP_Y - 0.7;
      if (actionAvailable !== actionWasAvailable.current) {
        actionWasAvailable.current = actionAvailable;
        onActionAvailability(actionAvailable);
      }
    }

    if (performance.now() - lastMapUpdate.current > 90) {
      lastMapUpdate.current = performance.now();
      gl.domElement.dataset.playerX = figure.position.x.toFixed(3);
      gl.domElement.dataset.playerY = figure.position.y.toFixed(3);
      gl.domElement.dataset.playerZ = figure.position.z.toFixed(3);
      gl.domElement.dataset.playerHeading = figure.rotation.y.toFixed(3);
      const previous = lastReportedPosition.current;
      if (!previous || Math.hypot(figure.position.x - previous.x, figure.position.z - previous.z) > 0.01) {
        const position = { x: figure.position.x, z: figure.position.z };
        lastReportedPosition.current = position;
        onPlayerMove(position);
      }
    }

    const speedNow = Math.hypot(velocity.current.x, velocity.current.z);
    const stride = moving ? Math.sin(walkTime.current) * (0.22 + Math.min(0.5, speedNow / 14)) : 0;
    if (leftArm.current) leftArm.current.rotation.x = stride;
    if (rightArm.current) rightArm.current.rotation.x = -stride;
    const leftLeg = figure.getObjectByName("leftLeg");
    const rightLeg = figure.getObjectByName("rightLeg");
    if (leftLeg) leftLeg.rotation.x = -stride * 1.1;
    if (rightLeg) rightLeg.rotation.x = stride * 1.1;
  });

  const linen = selected ? "#fff8da" : "#eee7d2";
  return (
    <group ref={figureRef} position={[0, 0, -1]} visible={viewMode !== "first" && !(guided && viewMode !== "overview")} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <PriestModel garment={linen} glow={selected} leftArmRef={leftArm} rightArmRef={rightArm} />
      {viewMode === "overview" && <Html position={[0, 1.75, 0]} center distanceFactor={12} occlude><button className="hotspot" onClick={onSelect} aria-label="Inspect the priest scale figure">Priest · scale figure</button></Html>}
    </group>
  );
}

function TempleFacade({ evidence, selected, onSelect, revealInterior = false }: { evidence: boolean; selected: boolean; onSelect: () => void; revealInterior?: boolean }) {
  const steps = useMemo(() => {
    let distance = 0;
    return TEMPLE_STEP_RUNS.map((run, index) => {
      const depth = run * CUBIT;
      const step = { top: (index + 1) * (CUBIT / 2), depth, z: TEMPLE_STEP_FOOT_Z - distance - depth / 2 };
      distance += depth;
      return step;
    });
  }, []);
  const frontWallCenterZ = (TEMPLE_EAST_Z + TEMPLE_PORCH_WALL_WEST_Z) / 2;
  return (
    <group userData={{ cameraOccluder: true }} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      {steps.map((step, index) => (
        <mesh key={`temple-step-${index}`} position={[0, PRIESTS_FLOOR_Y + step.top / 2, step.z]} castShadow receiveShadow>
          <boxGeometry args={[40, step.top, step.depth + 0.015]} /><Limestone evidence={evidence} selected={selected} />
        </mesh>
      ))}
      {!revealInterior && <Html position={[0, TEMPLE_TOP_Y + 2.1, frontWallCenterZ]} center distanceFactor={25} occlude>
        <button className="hotspot" onClick={onSelect} aria-label="Inspect the Temple facade">Temple facade</button>
      </Html>}
    </group>
  );
}

function GoldenMenorah() {
  const { heightWorld: height, branchCount, lampCount } = VESSEL_MEASUREMENTS.menorah;
  const branches = useMemo(() => Array.from({ length: branchCount }, (_, index) => {
    const lane = index - 3;
    if (lane === 0) return new CatmullRomCurve3([new Vector3(0, 0.16, 0), new Vector3(0, height * 0.58, 0), new Vector3(0, height, 0)]);
    const side = Math.sign(lane);
    const rank = Math.abs(lane);
    const startY = height * (0.23 + rank * 0.105);
    return new CatmullRomCurve3([
      new Vector3(0, startY, 0),
      new Vector3(side * rank * 0.12, startY + height * 0.07, 0),
      new Vector3(side * rank * 0.22, height * (0.64 + rank * 0.055), 0),
      new Vector3(side * rank * 0.22, height, 0),
    ]);
  }), [branchCount, height]);
  const cups = useMemo(() => [
    ...[0.3, 0.48, 0.68, 0.88].map((fraction) => [0, height * fraction, 0] as const),
    ...[-1, 1].flatMap((side) => [1, 2, 3].flatMap((rank) => [0.42, 0.67, 0.9].map((fraction) => [side * rank * 0.22, height * Math.min(0.96, fraction + rank * 0.025), 0] as const))),
  ], [height]);
  const knobs = useMemo(() => [
    ...[0.22, 0.38, 0.56, 0.74, 0.93].map((fraction) => [0, height * fraction, 0] as const),
    ...[-1, 1].flatMap((side) => [1, 2, 3].map((rank) => [side * rank * 0.22, height * (0.58 + rank * 0.075), 0] as const)),
  ], [height]);
  const flowers = useMemo(() => [
    ...[0.18, 0.52, 0.8].map((fraction) => [0, height * fraction, 0] as const),
    ...[-1, 1].flatMap((side) => [1, 2, 3].map((rank) => [side * rank * 0.22, height * (0.7 + rank * 0.065), 0] as const)),
  ], [height]);
  const gold = <meshStandardMaterial color="#d5a83e" metalness={0.9} roughness={0.17} />;
  return (
    <group>
      <group position={[-3, TEMPLE_FLOOR_Y, -47]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.055, 0]} castShadow><cylinderGeometry args={[0.27, 0.34, 0.11, 28]} />{gold}</mesh>
        <mesh position={[0, 0.14, 0]} castShadow><sphereGeometry args={[0.14, 20, 12]} />{gold}</mesh>
        {branches.map((curve, index) => <mesh key={index} castShadow><tubeGeometry args={[curve, 32, 0.028, 10, false]} />{gold}</mesh>)}
        {cups.map((position, index) => <mesh key={`cup-${index}`} position={position} rotation={[0, 0, index % 3 === 0 ? 0 : 0.15]} castShadow><cylinderGeometry args={[0.035, 0.065, 0.085, 12]} />{gold}</mesh>)}
        {knobs.map((position, index) => <mesh key={`knob-${index}`} position={position} castShadow><sphereGeometry args={[0.052, 14, 10]} />{gold}</mesh>)}
        {flowers.map((position, index) => <mesh key={`flower-${index}`} position={position} rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[0.065, 0.018, 6, 12]} />{gold}</mesh>)}
        {Array.from({ length: lampCount }, (_, index) => <group key={`lamp-${index}`} position={[(index - 3) * 0.22, height + 0.015, 0]}>
          <mesh castShadow><cylinderGeometry args={[0.078, 0.055, 0.085, 16]} />{gold}</mesh>
          <mesh position={[0, 0.064, 0]}><sphereGeometry args={[0.031, 12, 8]} /><meshStandardMaterial color="#5b3b20" emissive="#7a451e" emissiveIntensity={0.28} roughness={0.5} /></mesh>
          <mesh position={[0, 0.105, 0]}><cylinderGeometry args={[0.009,0.012,0.07,7]} /><meshStandardMaterial color="#30251b" roughness={0.95} /></mesh>
        </group>)}
      </group>
      <group name="menorah-service-steps">
        {[0, 1, 2].map((index) => {
          const stepHeight = (index + 1) * 0.12;
          return <mesh key={index} position={[-3, TEMPLE_FLOOR_Y + stepHeight / 2, -45.9-index*0.34]} castShadow receiveShadow><boxGeometry args={[1.9, stepHeight, 0.42]} /><Limestone /></mesh>;
        })}
      </group>
    </group>
  );
}

function ShowbreadTable() {
  const { lengthWorld: length, widthWorld: width, heightWorld: height, loafCount, stackCount } = VESSEL_MEASUREMENTS.showbreadTable;
  return (
    <group position={[3, TEMPLE_FLOOR_Y, -47]}>
      <mesh position={[0, height, 0]} castShadow><boxGeometry args={[width, 0.08, length]} /><meshStandardMaterial color="#c99a32" metalness={0.82} roughness={0.23} /></mesh>
      <mesh position={[0,height+0.07,0]} castShadow><boxGeometry args={[width+0.12,0.07,length+0.12]} /><meshStandardMaterial color="#d7ad42" metalness={0.88} roughness={0.18} /></mesh>
      {[-1, 1].flatMap((xSide) => [-1, 1].map((zSide) => <mesh key={`${xSide}-${zSide}`} position={[xSide * width * 0.38, height / 2, zSide * length * 0.38]} castShadow><cylinderGeometry args={[0.035, 0.045, height, 12]} /><meshStandardMaterial color="#bd8b2d" metalness={0.8} roughness={0.24} /></mesh>))}
      {[-1,1].map((x)=><group key={`pole-${x}`} position={[x*(width/2+.14),height*.42,0]}>
        <mesh rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[.035,.035,length+1.0,12]} /><meshStandardMaterial color="#d2a13b" metalness={.86} roughness={.2} /></mesh>
        {[-1,1].map((z)=><mesh key={z} position={[0,0,z*length*.34]} rotation={[Math.PI/2,0,0]} castShadow><torusGeometry args={[.085,.022,8,14]} /><meshStandardMaterial color="#d2a13b" metalness={.86} roughness={.2} /></mesh>)}
      </group>)}
      {Array.from({ length: stackCount }, (_, stack) => <group key={`stack-${stack}`} position={[0, 0, (stack === 0 ? -1 : 1) * length * 0.25]}>
        {Array.from({ length: loafCount / stackCount }, (_, level) => <group key={level} position={[0, height + 0.08 + level * 0.1, 0]}>
          <mesh><boxGeometry args={[width * 0.78, 0.025, length * 0.38]} /><meshStandardMaterial color="#c99a32" metalness={0.78} roughness={0.25} /></mesh>
          <mesh position={[0, 0.035, 0]} castShadow><boxGeometry args={[width * 0.62, 0.06, length * 0.28]} /><meshStandardMaterial color="#d7ad6a" roughness={0.86} /></mesh>
        </group>)}
      </group>)}
    </group>
  );
}

function IncenseAltar() {
  const { lengthWorld: size, heightWorld: height } = VESSEL_MEASUREMENTS.incenseAltar;
  return (
    <group position={[0, TEMPLE_FLOOR_Y, -45.5]}>
      <mesh position={[0, height / 2, 0]} castShadow><boxGeometry args={[size, height, size]} /><meshStandardMaterial color="#c89731" metalness={0.8} roughness={0.24} /></mesh>
      {[height*.18,height*.82].map((y)=><mesh key={y} position={[0,y,0]} castShadow><boxGeometry args={[size+0.11,0.07,size+0.11]} /><meshStandardMaterial color="#dcaf45" metalness={0.9} roughness={0.17} /></mesh>)}
      {[-1, 1].flatMap((x) => [-1, 1].map((z) => <mesh key={`${x}-${z}`} position={[x * size * 0.42, height + 0.08, z * size * 0.42]} castShadow><boxGeometry args={[0.08, 0.18, 0.08]} /><meshStandardMaterial color="#d4a53c" metalness={0.82} roughness={0.2} /></mesh>))}
      <mesh position={[0, height + 0.03, 0]}><boxGeometry args={[size * 0.82, 0.035, size * 0.82]} /><meshStandardMaterial color="#5d3b22" roughness={0.95} /></mesh>
      {[-1,1].map((x)=><group key={x} position={[x*(size/2+.08),height*.28,0]}>
        <mesh rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[.03,.03,size+0.85,10]} /><meshStandardMaterial color="#d6a63d" metalness={.88} roughness={.19} /></mesh>
        {[-1,1].map((z)=><mesh key={z} position={[0,0,z*size*.34]} rotation={[Math.PI/2,0,0]} castShadow><torusGeometry args={[.07,.018,8,12]} /><meshStandardMaterial color="#d6a63d" metalness={.88} roughness={.19} /></mesh>)}
      </group>)}
    </group>
  );
}

function TwelveSpoutLaver() {
  return (
    <group position={[...KIYOR_POSITION]} name="kiyor-between-altar-and-porch-south">
      <mesh position={[0,0.1,0]} castShadow receiveShadow><cylinderGeometry args={[0.82,0.98,0.2,28]} /><Limestone /></mesh>
      <mesh position={[0, 0.42, 0]} castShadow><cylinderGeometry args={[0.48, 0.62, 0.64, 24]} /><meshStandardMaterial color="#aa743e" metalness={0.74} roughness={0.28} /></mesh>
      <mesh position={[0, 1.02, 0]} castShadow><cylinderGeometry args={[0.92, 0.7, 0.72, 32, 1, true]} /><meshStandardMaterial color="#bd8846" metalness={0.76} roughness={0.25} side={2} /></mesh>
      <mesh position={[0, 0.68, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.68, 32]} /><meshStandardMaterial color="#26434a" metalness={0} roughness={0.04} /></mesh>
      {Array.from({ length: VESSEL_MEASUREMENTS.laver.spoutCount }, (_, index) => {
        const angle = (index / VESSEL_MEASUREMENTS.laver.spoutCount) * Math.PI * 2;
        return <group key={index} rotation={[0, -angle, 0]}><mesh position={[0.83, 0.77, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.045, 0.058, 0.38, 10]} /><meshStandardMaterial color="#bd8846" metalness={0.76} roughness={0.25} /></mesh></group>;
      })}
      {VESSEL_MEASUREMENTS.laver.hasLoweringDevice && <group name="interpretive-laver-lowering-device" position={[-1.15,0.8,0]} rotation={[0,0,Math.PI/2]}>
        <mesh castShadow><torusGeometry args={[0.48,0.06,10,28]} /><meshStandardMaterial color="#8d633d" metalness={0.38} roughness={0.58} /></mesh>
        {[0,Math.PI/2].map((angle)=><mesh key={angle} rotation={[0,0,angle]}><boxGeometry args={[0.86,0.045,0.045]} /><meshStandardMaterial color="#8d633d" metalness={0.38} roughness={0.58} /></mesh>)}
        <mesh position={[0,-0.72,0]}><cylinderGeometry args={[0.024,0.024,0.95,8]} /><meshStandardMaterial color="#6f5a45" roughness={0.86} /></mesh>
      </group>}
    </group>
  );
}

function SlaughteringInstallation() {
  const ringRowStep = (SLAUGHTER_RING_ZONE_NORTH_X - SLAUGHTER_RING_ZONE_SOUTH_X - 2 * SLAUGHTER_RING_ROW_INSET)
    / (VESSEL_MEASUREMENTS.slaughterInstallation.ringRows - 1);
  return (
    <group position={[0, PRIESTS_FLOOR_Y, 0]}>
      {Array.from({ length: VESSEL_MEASUREMENTS.slaughterInstallation.ringCount }, (_, index) => {
        const row = Math.floor(index / VESSEL_MEASUREMENTS.slaughterInstallation.ringsPerRow);
        const column = index % VESSEL_MEASUREMENTS.slaughterInstallation.ringsPerRow;
        const x = SLAUGHTER_RING_ZONE_SOUTH_X + SLAUGHTER_RING_ROW_INSET + row * ringRowStep;
        const z = ALTAR_CENTER_Z - 2 + column * 1.25;
        return <group key={`ring-${index}`} position={[x, 0.012, z]}>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.34, 0.34, 0.035, 22]} /><meshStandardMaterial color="#aaa398" roughness={0.82} metalness={0.05} /></mesh>
          <mesh position={[0,0.055,0]} rotation={[-Math.PI / 2,0,0]} castShadow><torusGeometry args={[0.24,0.035,10,24]} /><meshStandardMaterial color="#4b4944" metalness={0.74} roughness={0.34} /></mesh>
          {[-1,1].map((side)=><mesh key={side} position={[side*0.255,0.052,0]} castShadow><cylinderGeometry args={[0.045,0.045,0.09,12]} /><meshStandardMaterial color="#4b4944" metalness={0.74} roughness={0.34} /></mesh>)}
        </group>;
      })}
      {Array.from({ length: VESSEL_MEASUREMENTS.slaughterInstallation.pillarCount }, (_, index) => {
        const z = ALTAR_CENTER_Z - 6.2 + index * 1.8;
        return <group key={`pillar-${index}`} position={[SLAUGHTER_POST_X, 0, z]}>
          <mesh position={[0, 1.2, 0]} castShadow><cylinderGeometry args={[0.18, 0.23, 2.4, 12]} /><Limestone /></mesh>
          <mesh position={[0, 2.45, 0]} castShadow><boxGeometry args={[0.48, 0.18, 0.48]} /><meshStandardMaterial color="#6b4528" roughness={0.9} /></mesh>
          {Array.from({ length: VESSEL_MEASUREMENTS.slaughterInstallation.hookRowsPerPillar }, (_, hookRow) => 0.65 + hookRow * 0.55).map((y) => <mesh key={y} position={[-0.28, y, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.025, 0.025, 0.3, 8]} /><meshStandardMaterial color="#504c46" metalness={0.68} roughness={0.35} /></mesh>)}
        </group>;
      })}
      {Array.from({ length: VESSEL_MEASUREMENTS.slaughterInstallation.marbleTableCount }, (_, index) => <mesh key={`table-${index}`} position={[SLAUGHTER_TABLE_X, 0.42, ALTAR_CENTER_Z - 6.2 + index * 1.8]} castShadow receiveShadow><boxGeometry args={[1.7, 0.14, 0.8]} /><meshStandardMaterial color="#d9d1bf" roughness={0.6} metalness={0} /></mesh>)}
    </group>
  );
}

function DailyServiceTables({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  const serviceVessels = useMemo(() => Array.from({ length: VESSEL_MEASUREMENTS.serviceTables.dailyServiceVesselCount }, (_, index) => {
    const column = index % 31;
    const row = Math.floor(index / 31);
    return [-0.72 + column * 0.048, 0.58, -0.22 + row * 0.19] as [number, number, number];
  }), []);
  return (
    <group onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      {/* Two tables west of the ramp: marble for limbs, silver for the daily service vessels. */}
      {[{position:MARBLE_SERVICE_TABLE_POSITION,metal:false},{position:SILVER_SERVICE_TABLE_POSITION,metal:true}].map(({position,metal})=><group key={position[0]} position={[...position]} name={metal?"silver-service-table":"marble-limb-table"}>
        <mesh position={[0,0.62,0]} castShadow receiveShadow><boxGeometry args={[1.95,0.18,1.02]} /><meshStandardMaterial color={metal?"#c7c5bf":"#d8d0c0"} roughness={metal?.24:.58} metalness={metal?.76:.06} /></mesh>
        {[-1,1].flatMap((sx)=>[-1,1].map((sz)=><mesh key={`${sx}-${sz}`} position={[sx*.78,.31,sz*.35]} castShadow><cylinderGeometry args={[.07,.09,.62,10]} /><meshStandardMaterial color={metal?"#b9b7b1":"#b7aa94"} roughness={metal?.3:.66} metalness={metal?.68:.05} /></mesh>))}
      </group>)}
      <group position={[...SILVER_SERVICE_TABLE_POSITION]}>
        <Instances limit={VESSEL_MEASUREMENTS.serviceTables.dailyServiceVesselCount} range={VESSEL_MEASUREMENTS.serviceTables.dailyServiceVesselCount}>
          <cylinderGeometry args={[0.018, 0.027, 0.07, 8]} />
          <meshStandardMaterial color="#d5cfc0" metalness={0.74} roughness={0.26} />
          {serviceVessels.map((position, index) => <Instance key={index} position={position} />)}
        </Instances>
      </group>

      {/* Named vessels carried in the daily service: teni, kuz, firepan, dish and spoon. */}
      <group position={[...SILVER_SERVICE_TABLE_POSITION]}>
        <mesh position={[-0.52, 0.61, 0]} castShadow><cylinderGeometry args={[0.16, 0.12, 0.1, 18]} /><meshStandardMaterial color="#c79b39" metalness={0.78} roughness={0.24} /></mesh>
        <mesh position={[-0.18, 0.68, 0]} castShadow><cylinderGeometry args={[0.08, 0.13, 0.28, 16]} /><meshStandardMaterial color="#c79b39" metalness={0.78} roughness={0.24} /></mesh>
        <mesh position={[0.22, 0.59, 0]} castShadow><cylinderGeometry args={[0.17, 0.14, 0.07, 18]} /><meshStandardMaterial color="#b8b4ad" metalness={0.7} roughness={0.3} /></mesh>
        <mesh position={[0.52, 0.58, -0.06]} castShadow><cylinderGeometry args={[0.13, 0.11, 0.055, 18]} /><meshStandardMaterial color="#c79b39" metalness={0.78} roughness={0.24} /></mesh>
        <mesh position={[0.48, 0.61, 0.16]} rotation={[0, 0, Math.PI / 2]} castShadow><capsuleGeometry args={[0.022, 0.28, 4, 8]} /><meshStandardMaterial color="#c79b39" metalness={0.78} roughness={0.24} /></mesh>
      </group>

      {/* The two entrance-hall tables for incoming and outgoing Showbread. */}
      <mesh position={[-5, TEMPLE_FLOOR_Y + 0.45, -32.1]} castShadow receiveShadow><boxGeometry args={[1.25, 0.14, 0.75]} /><meshStandardMaterial color="#cbc6ba" roughness={0.56} metalness={0.08} /></mesh>
      <mesh position={[5, TEMPLE_FLOOR_Y + 0.45, -32.1]} castShadow receiveShadow><boxGeometry args={[1.25, 0.14, 0.75]} /><meshStandardMaterial color="#c99931" metalness={0.8} roughness={0.22} /></mesh>
      {/* Large copper pesakhter used for ash and for covering coals or impurity on Shabbat. */}
      <group position={[SILVER_SERVICE_TABLE_POSITION[0]-3.05, PRIESTS_FLOOR_Y, SERVICE_TABLE_Z]}>
        <mesh position={[0, 0.28, 0]} castShadow><cylinderGeometry args={[0.46, 0.62, 0.56, 20]} /><meshStandardMaterial color="#8d5835" metalness={0.6} roughness={0.4} /></mesh>
        {[-1, 1].map((side) => <mesh key={side} position={[side * 0.58, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.15, 0.025, 8, 16, Math.PI]} /><meshStandardMaterial color="#8d5835" metalness={0.6} roughness={0.4} /></mesh>)}
      </group>
      {selected && <>
        <Html position={[MARBLE_SERVICE_TABLE_POSITION[0], PRIESTS_FLOOR_Y + 1.35, SERVICE_TABLE_Z]} center distanceFactor={13}><button className="hotspot" onClick={onSelect}>Marble table · sacrificial portions</button></Html>
        <Html position={[SILVER_SERVICE_TABLE_POSITION[0], PRIESTS_FLOOR_Y + 1.45, SERVICE_TABLE_Z]} center distanceFactor={13}><button className="hotspot" onClick={onSelect}>Silver table · service vessels</button></Html>
        <Html position={[0, TEMPLE_FLOOR_Y + 1.25, -32.1]} center distanceFactor={12}><button className="hotspot" onClick={onSelect}>Showbread staging tables</button></Html>
        <Html position={[SILVER_SERVICE_TABLE_POSITION[0]-3.05, PRIESTS_FLOOR_Y + 1.1, SERVICE_TABLE_Z]} center distanceFactor={12}><button className="hotspot" onClick={onSelect}>Pesakhter · ash vessel</button></Html>
      </>}
    </group>
  );
}

function CollectionChests({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  const depositNeck = useMemo(() => new CatmullRomCurve3([
    new Vector3(0, 0, 0), new Vector3(0, 0.2, 0), new Vector3(0.04, 0.38, 0), new Vector3(0.16, 0.52, 0),
  ]), []);
  const labels = ["New shekels", "Old shekels", "Bird pairs", "Burnt-offering birds", "Wood", "Frankincense", "Gold", ...Array.from({ length: VESSEL_MEASUREMENTS.collectionChests.freewillCount }, (_, index) => `Freewill ${index + 1}`)];
  return (
    <group name="thirteen-shofar-collection-chests" onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      {/* Shekalim 6:1,5 fixes the count, horn-like form and inscriptions, but
          not the material, dimensions or floor plan. These read as treasury
          chests beneath the gallery rather than pawn-like freestanding cones. */}
      {[WOMENS_COURT_MAX_Z - 6.5, WOMENS_COURT_MAX_Z - 10.2].map((z, row) => <mesh key={`treasury-bank-${row}`} position={[0, WOMENS_COURT_Y + 0.055, z]} receiveShadow>
        <boxGeometry args={[20.6, 0.11, 1.42]} /><meshStandardMaterial color="#b9ad96" roughness={0.9} />
      </mesh>)}
      {labels.map((label, index) => {
        const firstRow = index < 7;
        const column = firstRow ? index : index - 7;
        const x = firstRow ? -9 + column * 3 : -7.5 + column * 3;
        const z = firstRow ? WOMENS_COURT_MAX_Z - 6.5 : WOMENS_COURT_MAX_Z - 10.2;
        return <group key={label} position={[x, WOMENS_COURT_Y, z]}>
          <mesh name="broad-locked-chest" position={[0, 0.42, 0]} castShadow receiveShadow><boxGeometry args={[1.02, 0.72, 0.78]} /><meshStandardMaterial color="#6b452c" metalness={0.06} roughness={0.82} /></mesh>
          <mesh position={[0, 0.8, 0]} castShadow><boxGeometry args={[1.08, 0.1, 0.84]} /><meshStandardMaterial color="#8a6038" roughness={0.75} /></mesh>
          {[-0.39, 0.39].map((band) => <mesh key={band} position={[band, 0.42, -0.405]} castShadow><boxGeometry args={[0.075, 0.72, 0.035]} /><meshStandardMaterial color="#9b7136" metalness={0.62} roughness={0.34} /></mesh>)}
          <mesh position={[0, 0.89, 0]} castShadow><cylinderGeometry args={[0.13, 0.26, 0.22, 16]} /><meshStandardMaterial color="#9a6d38" metalness={0.5} roughness={0.42} /></mesh>
          <mesh position={[0, 0.98, 0]}><tubeGeometry args={[depositNeck, 18, 0.085, 10, false]} /><meshStandardMaterial color="#9a6d38" metalness={0.5} roughness={0.42} /></mesh>
          <mesh position={[0.16, 1.505, 0]} rotation={[0, 0, -0.72]} castShadow><boxGeometry args={[0.34, 0.1, 0.24]} /><meshStandardMaterial color="#9a6d38" metalness={0.5} roughness={0.4} /></mesh>
          <mesh position={[0.16, 1.56, 0]} rotation={[-Math.PI / 2, 0, -0.72]}><planeGeometry args={[0.16, 0.035]} /><meshBasicMaterial color="#23180f" /></mesh>
          <mesh name={`inscription-${label}`} position={[0, 0.47, -0.412]}><boxGeometry args={[0.62, 0.22, 0.025]} /><meshStandardMaterial color="#d2b35f" metalness={0.54} roughness={0.35} /></mesh>
        </group>;
      })}
      <Html position={[0, WOMENS_COURT_Y + 2.05, WOMENS_COURT_MAX_Z - 8.3]} center distanceFactor={17}><button className="hotspot" onClick={onSelect}>13 shofar collection chests · labeled funds · form reconstructed</button></Html>
      {selected && <Html position={[0, WOMENS_COURT_Y + 1.2, WOMENS_COURT_MAX_Z - 11.4]} center distanceFactor={14}><button className="hotspot" onClick={onSelect}>New/old shekels · birds · wood · frankincense · gold · six freewill</button></Html>}
    </group>
  );
}

function CeremonyPriest({ groupRef, label, accent = "#eee7d2", leftArmRef, rightArmRef }: { groupRef: React.RefObject<Group | null>; label: string; accent?: string; leftArmRef?: React.RefObject<Group | null>; rightArmRef?: React.RefObject<Group | null> }) {
  return <group ref={groupRef}>
    <mesh position={[0, 0.7, 0]} castShadow><coneGeometry args={[0.48, 1.35, 18]} /><Linen color={accent} /></mesh>
    {[-0.18, 0.18].map((x) => <mesh key={x} position={[x, 0.17, 0]} castShadow><capsuleGeometry args={[0.075, 0.28, 5, 10]} /><meshStandardMaterial color="#8d5b3f" roughness={0.85} /></mesh>)}
    <mesh position={[0, 1.18, 0]} castShadow><cylinderGeometry args={[0.3, 0.4, 0.65, 18]} /><Linen color={accent} /></mesh>
    {[-1, 1].map((side) => <group key={side} ref={side < 0 ? leftArmRef : rightArmRef} position={[side * 0.34, 1.35, 0]}>
      <mesh position={[side * 0.07, -0.25, 0]} rotation={[0, 0, side * -0.12]} castShadow><capsuleGeometry args={[0.075, 0.48, 5, 10]} /><Linen color={accent} /></mesh>
      <mesh position={[side * 0.12, -0.57, 0]} castShadow><sphereGeometry args={[0.09, 12, 10]} /><meshStandardMaterial color="#9b6545" roughness={0.82} /></mesh>
    </group>)}
    <mesh position={[0, 1.68, 0]} castShadow><sphereGeometry args={[0.21, 18, 14]} /><meshStandardMaterial color="#9b6545" roughness={0.8} /></mesh>
    <mesh position={[0, 1.88, 0]} castShadow><cylinderGeometry args={[0.19, 0.23, 0.28, 18]} /><meshStandardMaterial color={accent} roughness={0.88} /></mesh>
    <Html position={[0, 2.35, 0]} center distanceFactor={16}><div className="ceremony-actor-label">{label}</div></Html>
  </group>;
}

function CeremonyGoat({ groupRef, label, markerRef }: { groupRef: React.RefObject<Group | null>; label: string; markerRef: React.RefObject<Group | null> }) {
  return <group ref={groupRef}>
    <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><capsuleGeometry args={[0.28, 0.72, 8, 16]} /><meshStandardMaterial color="#e5ded0" roughness={0.96} /></mesh>
    <mesh position={[0, 0.78, 0.62]} rotation={[-0.22, 0, 0]} castShadow><capsuleGeometry args={[0.2, 0.28, 7, 14]} /><meshStandardMaterial color="#e5ded0" roughness={0.96} /></mesh>
    {[-0.2, 0.2].flatMap((x) => [-0.28, 0.28].map((z) => <mesh key={`${x}-${z}`} position={[x, 0.23, z]} castShadow><capsuleGeometry args={[0.055, 0.35, 4, 8]} /><meshStandardMaterial color="#c9c0af" roughness={1} /></mesh>))}
    {[-0.13, 0.13].map((x) => <mesh key={x} position={[x, 1.08, 0.69]} rotation={[0.25, 0, x < 0 ? -0.35 : 0.35]} castShadow><coneGeometry args={[0.055, 0.28, 8]} /><meshStandardMaterial color="#9b8768" roughness={0.86} /></mesh>)}
    <group ref={markerRef} visible={false} position={[0, 0.92, 0.58]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh><torusGeometry args={[0.22, 0.045, 8, 24]} /><meshStandardMaterial color="#a51f2d" emissive="#6d0712" emissiveIntensity={0.22} roughness={0.8} /></mesh>
    </group>
    <Html position={[0, 1.65, 0]} center distanceFactor={16}><div className="ceremony-animal-label">{label}</div></Html>
  </group>;
}

function GoatLotteryCeremony({ timeRef }: { timeRef: React.MutableRefObject<number> }) {
  const highPriest = useRef<Group>(null);
  const deputy = useRef<Group>(null);
  const familyHead = useRef<Group>(null);
  const handlerLeft = useRef<Group>(null);
  const handlerRight = useRef<Group>(null);
  const goatLord = useRef<Group>(null);
  const goatAzazel = useRef<Group>(null);
  const lordMarker = useRef<Group>(null);
  const azazelMarker = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftLot = useRef<Group>(null);
  const rightLot = useRef<Group>(null);
  const urn = useRef<Group>(null);

  useFrame(({ clock }) => {
    const time = timeRef.current;
    const { index, progress } = getCeremonyBeat(time);
    const arrival = Math.max(0, Math.min(1, time / 7));
    const easedArrival = arrival * arrival * (3 - 2 * arrival);
    const actors: Array<[React.RefObject<Group | null>, [number, number], [number, number]]> = [
      [highPriest, [10.5, 2.5], [10.5, -4.1]],
      [deputy, [8.8, 3.5], [8.7, -4]],
      [familyHead, [12.2, 3.5], [12.3, -4]],
      [handlerLeft, [7.2, 4.5], [8.2, -0.7]],
      [handlerRight, [13.8, 4.5], [12.8, -0.7]],
      [goatLord, [8.4, 5.8], [9, -1]],
      [goatAzazel, [12.6, 5.8], [12, -1]],
    ];
    actors.forEach(([ref, from, to]) => {
      if (!ref.current) return;
      ref.current.position.set(from[0] + (to[0] - from[0]) * easedArrival, PRIESTS_FLOOR_Y, from[1] + (to[1] - from[1]) * easedArrival);
      ref.current.rotation.y = Math.PI;
    });

    const draw = index === 3 ? Math.sin(progress * Math.PI / 2) : index > 3 ? 1 : 0;
    const place = index === 5 ? progress : index > 5 ? 1 : 0;
    if (leftArm.current) leftArm.current.rotation.x = -draw * 1.52 + place * 0.95;
    if (rightArm.current) rightArm.current.rotation.x = -draw * 1.52 + place * 0.95;
    if (leftArm.current) leftArm.current.rotation.z = -0.18 - draw * 0.28;
    if (rightArm.current) rightArm.current.rotation.z = 0.18 + draw * 0.28;

    const handY = 2.25;
    const leftTarget = [9, 1.08, -1] as const;
    const rightTarget = [12, 1.08, -1] as const;
    if (leftLot.current) {
      leftLot.current.visible = index >= 3;
      leftLot.current.position.set(10.02 + (leftTarget[0] - 10.02) * place, PRIESTS_FLOOR_Y + handY + (leftTarget[1] - handY) * place, -3.95 + (leftTarget[2] + 3.95) * place);
      leftLot.current.rotation.y = clock.elapsedTime * 0.12;
    }
    if (rightLot.current) {
      rightLot.current.visible = index >= 3;
      rightLot.current.position.set(10.98 + (rightTarget[0] - 10.98) * place, PRIESTS_FLOOR_Y + handY + (rightTarget[1] - handY) * place, -3.95 + (rightTarget[2] + 3.95) * place);
      rightLot.current.rotation.y = -clock.elapsedTime * 0.12;
    }
    if (lordMarker.current) lordMarker.current.visible = index >= 6;
    if (azazelMarker.current) azazelMarker.current.visible = index >= 6;
    if (urn.current) urn.current.rotation.y = index === 2 ? Math.sin(progress * Math.PI * 4) * 0.06 : 0;
    if (goatLord.current) goatLord.current.rotation.y = Math.PI + Math.sin(clock.elapsedTime * 1.7) * 0.035;
    if (goatAzazel.current) goatAzazel.current.rotation.y = Math.PI + Math.sin(clock.elapsedTime * 1.45 + 1.3) * 0.04;
  });

  return <group>
    <CeremonyPriest groupRef={highPriest} label="High Priest" accent="#f3eee1" leftArmRef={leftArm} rightArmRef={rightArm} />
    <CeremonyPriest groupRef={deputy} label="Deputy" />
    <CeremonyPriest groupRef={familyHead} label="Priestly family head" />
    <CeremonyPriest groupRef={handlerLeft} label="Animal handler" accent="#ded5bd" />
    <CeremonyPriest groupRef={handlerRight} label="Animal handler" accent="#ded5bd" />
    <CeremonyGoat groupRef={goatLord} markerRef={lordMarker} label="Goat for the Lord" />
    <CeremonyGoat groupRef={goatAzazel} markerRef={azazelMarker} label="Goat for Azazel" />
    <group ref={urn} position={[10.5, PRIESTS_FLOOR_Y, -2.55]}>
      <mesh position={[0, 0.52, 0]} castShadow><cylinderGeometry args={[0.38, 0.5, 0.72, 12]} /><meshStandardMaterial color="#7b5a35" roughness={0.7} metalness={0.12} /></mesh>
      <mesh position={[0, 0.91, 0]}><torusGeometry args={[0.4, 0.045, 8, 24]} /><meshStandardMaterial color="#c99b38" metalness={0.72} roughness={0.28} /></mesh>
      <Html position={[0, 1.45, 0]} center distanceFactor={16}><div className="ceremony-prop-label">Lottery urn · reconstructed form</div></Html>
    </group>
    <group ref={leftLot} visible={false}><mesh castShadow><boxGeometry args={[0.35, 0.07, 0.58]} /><meshStandardMaterial color="#d5ad4d" metalness={0.72} roughness={0.26} /></mesh><Html position={[0, 0.28, 0]} center distanceFactor={12}><div className="lot-label">For the Lord</div></Html></group>
    <group ref={rightLot} visible={false}><mesh castShadow><boxGeometry args={[0.35, 0.07, 0.58]} /><meshStandardMaterial color="#d5ad4d" metalness={0.72} roughness={0.26} /></mesh><Html position={[0, 0.28, 0]} center distanceFactor={12}><div className="lot-label">For Azazel</div></Html></group>
  </group>;
}

function ServiceStateOverlay({ serviceState }: { serviceState: ServiceState }) {
  if (serviceState === "study") return null;
  const routes: Record<Exclude<ServiceState, "study">, { label: string; color: string; points: [number, number, number][] }> = {
    morning: { label: "Morning Tamid", color: "#e8bd5f", points: [[SILVER_SERVICE_TABLE_POSITION[0], PRIESTS_FLOOR_Y + 0.06, SERVICE_TABLE_Z], [KIYOR_POSITION[0], PRIESTS_FLOOR_Y + 0.06, KIYOR_POSITION[2]], [0, ALTAR_TOP_Y + 0.08, ALTAR_CENTER_Z], [0, TEMPLE_FLOOR_Y + 0.05, -46.5]] },
    afternoon: { label: "Afternoon Tamid", color: "#d88954", points: [[SILVER_SERVICE_TABLE_POSITION[0], PRIESTS_FLOOR_Y + 0.06, SERVICE_TABLE_Z], [0, ALTAR_TOP_Y + 0.08, ALTAR_CENTER_Z], [0, TEMPLE_FLOOR_Y + 0.05, -46.5]] },
    shabbat: { label: "Shabbat showbread", color: "#9ed3d0", points: [[-5, TEMPLE_FLOOR_Y + 0.52, -32.1], [5, TEMPLE_FLOOR_Y + 0.52, -32.1], [0, TEMPLE_FLOOR_Y + 0.08, -46.5]] },
    yomKippur: { label: "Yom Kippur route", color: "#d8d3ef", points: [[KIYOR_POSITION[0], PRIESTS_FLOOR_Y + 0.06, KIYOR_POSITION[2]], [0, TEMPLE_FLOOR_Y + 0.05, -46.5], [0, TEMPLE_FLOOR_Y + 0.08, -56.7]] },
  };
  const route = routes[serviceState];
  return <group>
    <Html position={[0, 8.4, -37]} center distanceFactor={19}><div className="service-label" style={{ borderColor: route.color }}>{route.label}</div></Html>
  </group>;
}

function TempleVessels({ selected, onSelect, viewMode, serviceState }: { selected: boolean; onSelect: () => void; viewMode: ViewMode; serviceState: ServiceState }) {
  const groundSurface = useMemo(() => surfaceProps("ground"), []);
  const selectFromHotspot = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onSelect();
  };
  const stopHotspotPointer = (event: React.PointerEvent<HTMLButtonElement>) => event.stopPropagation();
  return (
    <group onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <GoldenMenorah />
      <ShowbreadTable />
      <IncenseAltar />
      <TwelveSpoutLaver />
      <SlaughteringInstallation />
      <DailyServiceTables selected={selected} onSelect={onSelect} />
      <CollectionChests selected={selected} onSelect={onSelect} />
      <ServiceStateOverlay serviceState={serviceState} />
      <mesh position={[0, TEMPLE_FLOOR_Y + 0.035, -56.7]} scale={[1.5, 0.07, 1.15]} receiveShadow><dodecahedronGeometry args={[1, 1]} /><meshStandardMaterial {...groundSurface} color="#d9ccb2" roughness={1} /></mesh>
      {(viewMode === "overview" || selected) && <>
        <Html position={[0, TEMPLE_FLOOR_Y + 1.65, -46.5]} center distanceFactor={14}><button className="hotspot" onPointerDown={stopHotspotPointer} onClick={selectFromHotspot}>Menorah · Table · Incense Altar</button></Html>
        {selected && <Html position={[-3, TEMPLE_FLOOR_Y + 2.15, -47]} center distanceFactor={11}><button className="hotspot" onPointerDown={stopHotspotPointer} onClick={selectFromHotspot}>Menorah · 18 handbreadths · south</button></Html>}
        <Html position={[KIYOR_POSITION[0], PRIESTS_FLOOR_Y + 2.05, KIYOR_POSITION[2]]} center distanceFactor={15}><button className="hotspot" onPointerDown={stopHotspotPointer} onClick={selectFromHotspot}>Kiyor · altar–Ulam court · 12 spouts</button></Html>
        <Html position={[0, TEMPLE_FLOOR_Y + 0.55, -56.7]} center distanceFactor={12}><button className="hotspot" onPointerDown={stopHotspotPointer} onClick={selectFromHotspot}>Foundation Stone · no Ark</button></Html>
      </>}
    </group>
  );
}

function HollowChamber({ x, z, name, evidence, selected, onSelect, viewMode }: { x: number; z: number; name: string; evidence: boolean; selected: boolean; onSelect: () => void; viewMode: ViewMode }) {
  const innerX = x < 0 ? -11 : 11;
  const outerX = x < 0 ? -27 : 27;
  return (
    <group onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <mesh position={[x, WOMENS_COURT_Y + 0.06, z]} receiveShadow><boxGeometry args={[15.2, 0.12, 15.2]} /><PavingMaterial evidence={evidence} selected={selected} /></mesh>
      {[z - 8, z + 8].map((wallZ) => <mesh key={wallZ} position={[x, WOMENS_COURT_Y + 3, wallZ]} castShadow receiveShadow><boxGeometry args={[16, 6, 0.8]} /><Limestone evidence={evidence} selected={selected} /></mesh>)}
      <mesh position={[outerX, WOMENS_COURT_Y + 3, z]} castShadow receiveShadow><boxGeometry args={[0.8, 6, 16]} /><Limestone evidence={evidence} selected={selected} /></mesh>
      {[z - 5.1, z + 5.1].map((wallZ) => <mesh key={`door-${wallZ}`} position={[innerX, WOMENS_COURT_Y + 3, wallZ]} castShadow receiveShadow><boxGeometry args={[0.8, 6, 5.8]} /><Limestone evidence={evidence} selected={selected} /></mesh>)}
      <mesh position={[innerX, WOMENS_COURT_Y + 5.45, z]} castShadow><boxGeometry args={[0.85, 1.1, 4.5]} /><Limestone evidence={evidence} /></mesh>
      {viewMode === "overview" && <Html position={[x, WOMENS_COURT_Y + 0.4, z]} center distanceFactor={13}><button className="hotspot" onClick={onSelect}>{name}</button></Html>}
    </group>
  );
}

function TeachingMusician({ index, position, cymbals = false }: { index: number; position: [number,number,number]; cymbals?: boolean }) {
  return <group position={position} rotation={[0,Math.PI,0]} scale={0.92}>
    <PriestModel garment="#e9dfcc" variant={index+9} blob={false} headCover="none" />
    {cymbals ? <>{[-1,1].map((side)=><mesh key={side} position={[side*0.2,0.83,0.25]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[0.16,0.16,0.025,24]} /><Bronze /></mesh>)}</> : <group position={[0,0.78,0.25]} rotation={[0,0,-0.15]}>
      <mesh><torusGeometry args={[0.27,0.035,10,30,Math.PI*1.45]} /><meshStandardMaterial color="#86552f" roughness={0.76} /></mesh>
      {Array.from({length:5},(_,string)=><mesh key={string} position={[-0.12+string*0.06,0,0]}><boxGeometry args={[0.006,0.48,0.006]} /><meshStandardMaterial color="#d5ba77" roughness={0.5} /></mesh>)}
    </group>}
  </group>;
}

function InstrumentStorage({ side }: { side:number }) {
  return <group name="levitical-instrument-storage" position={[0,WOMENS_COURT_Y+0.02,0.55]} rotation={[0,side<0?0:Math.PI,0]}>
    {/* Middot 2:6 names harps, lyres, cymbals and other instruments. The rack
        form and exact arrangement are explicitly reconstructed fit-out. */}
    <group name="reconstructed-dry-rack" position={[0,0.92,0.42]}>
      {[-1.9,1.9].map((x)=><mesh key={x} position={[x,0,0]} castShadow><boxGeometry args={[0.12,1.75,0.32]} /><meshStandardMaterial color="#70482c" roughness={0.9} /></mesh>)}
      {[0,0.78].map((y)=><mesh key={y} position={[0,y-0.38,0]} castShadow><boxGeometry args={[3.9,0.1,0.34]} /><meshStandardMaterial color="#795033" roughness={0.88} /></mesh>)}
    </group>
    {[-1.25,0,1.25].map((x,index)=><group key={`lyre-${index}`} position={[x,0.83,0.18]} rotation={[0,0,index%2?0.05:-0.07]}>
      <mesh rotation={[0,0,-0.1]}><torusGeometry args={[0.34,0.045,10,30,Math.PI*1.42]} /><meshStandardMaterial color="#875632" roughness={0.8} /></mesh>
      {Array.from({length:5},(_,string)=><mesh key={string} position={[-0.15+string*0.075,0,0]}><boxGeometry args={[0.008,0.57,0.008]} /><meshStandardMaterial color="#d1b46f" roughness={0.58} /></mesh>)}
    </group>)}
    <group name="stored-cymbals" position={[1.5,0.2,-0.15]}>
      {[0,0.08,0.16].map((y,index)=><mesh key={y} position={[0,y,0]} rotation={[Math.PI/2,0,index*0.12]} castShadow><cylinderGeometry args={[0.27,0.27,0.035,28]} /><Bronze /></mesh>)}
    </group>
    <mesh name="instrument-case" position={[-1.35,0.18,-0.2]} castShadow><boxGeometry args={[1.25,0.34,0.58]} /><meshStandardMaterial color="#60432f" roughness={0.94} /></mesh>
    <mesh position={[-1.35,0.37,-0.2]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[0.8,0.24]} /><meshStandardMaterial color="#ccb77f" roughness={0.92} /></mesh>
  </group>;
}

function CourtPopulation({ serviceState }: { serviceState: ServiceState }) {
  if (serviceState === "yomKippur") return null;
  const showFestivalTableau = serviceState === "study";
  const stairInnerRadius=toWorld(TEMPLE_STAIRS.womensToIsrael.innerLandingRadiusCubits??0);
  const stepMusicianSlots = [-3.6,-2.4,-1.2,0,1.2,2.4,3.6].map((x,index)=>{
    const stepIndex=[4,5,6,7,6,5,4][index];
    const radius=stairInnerRadius+toWorld((TEMPLE_STAIRS.womensToIsrael.count-stepIndex)*(TEMPLE_STAIRS.womensToIsrael.treadCubits??0.5));
    const height=toWorld((stepIndex+1)*TEMPLE_STAIRS.womensToIsrael.riseCubits);
    const z=WOMENS_COURT_MIN_Z+Math.sqrt(Math.max(0,radius*radius-x*x))-0.12;
    return [x,WOMENS_COURT_Y+height+0.02,z] as [number,number,number];
  });
  return <group name="video-grounded-court-population">
    {/* Middot 2:5 places women on the gallery and men below. This restrained
        study tableau uses the gallery and the named Levitical stair station;
        it deliberately avoids decorative people scattered across the floor. */}
    {showFestivalTableau && Array.from({length:8},(_,index)=>{
      const side=index<4?-1:1, lane=index%4;
      return <group key={`woman-${index}`} position={[side*24,WOMENS_COURT_Y+3.42,WOMENS_COURT_MIN_Z+20+lane*6]} rotation={[0,side<0?Math.PI/2:-Math.PI/2,0]}>
        <PriestModel garment={index%2?"#b28a68":"#8f6f59"} variant={index+18} blob={false} headCover="veil" />
      </group>;
    })}
    {showFestivalTableau && stepMusicianSlots.map((position,index)=><TeachingMusician key={`step-musician-${index}`} index={index} cymbals={index===5} position={position} />)}
    {!showFestivalTableau && Array.from({length:6},(_,index)=><TeachingMusician key={`platform-musician-${index}`} index={index} cymbals={index===4} position={[-5+index*2,PRIESTS_FLOOR_Y+0.04,ISRAEL_WEST_Z-0.7]} />)}
  </group>;
}

function WomensCourt({ evidence, selected, chambersSelected, onSelect, onSelectChambers, viewMode, serviceState }: { evidence: boolean; selected: boolean; chambersSelected: boolean; onSelect: () => void; onSelectChambers: () => void; viewMode: ViewMode; serviceState: ServiceState }) {
  const steps = useMemo(() => Array.from({ length: TEMPLE_STAIRS.womensToIsrael.count }, (_, index) => ({
    radius: toWorld((TEMPLE_STAIRS.womensToIsrael.innerLandingRadiusCubits ?? 0) + (TEMPLE_STAIRS.womensToIsrael.count - index) * (TEMPLE_STAIRS.womensToIsrael.treadCubits ?? 0.5)),
    height: toWorld((index + 1) * TEMPLE_STAIRS.womensToIsrael.riseCubits),
  })), []);
  const galleryColumns = useMemo(() => Array.from({ length: 5 }, (_, index) => WOMENS_COURT_MIN_Z + 9 + index * 9).filter((z) => z > WOMENS_COURT_MIN_Z + 16.6 && z < WOMENS_COURT_MAX_Z - 16.6), []);
  return (
    <group userData={{ cameraOccluder: true }}>
      <mesh position={[0, WOMENS_COURT_Y + 0.015, WOMENS_COURT_CENTER_Z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={(event) => { event.stopPropagation(); onSelect(); }}><planeGeometry args={[54, 54]} /><PavingMaterial evidence={evidence} selected={selected} /></mesh>
      {steps.map((step, index) => <group key={index} name={`nicanor-step-${index+1}`}>
        <mesh position={[0, WOMENS_COURT_Y + step.height / 2, WOMENS_COURT_MIN_Z]} castShadow receiveShadow>
          <cylinderGeometry args={[step.radius, step.radius, step.height, 96, 1, false, -Math.PI / 2, Math.PI]} />
          <Limestone evidence={evidence} selected={selected} />
        </mesh>
        <mesh position={[0,WOMENS_COURT_Y+step.height+0.012,WOMENS_COURT_MIN_Z]} rotation={[-Math.PI/2,0,Math.PI/2]}>
          <torusGeometry args={[Math.max(0.04,step.radius-0.035),0.025,6,64,Math.PI]} />
          <meshStandardMaterial color="#b7ae9d" roughness={0.92} />
        </mesh>
      </group>)}

      {/* Nicanor Gate: a 10-cubit opening and 20-cubit clear height, with open bronze leaves. */}
      {[[-18.6, 16.8], [-4.9, 5.8], [4.9, 5.8], [18.6, 16.8]].map(([x, width]) => <mesh key={`nicanor-${x}`} position={[x, (WOMENS_COURT_Y + 8) / 2, WOMENS_COURT_MIN_Z]} castShadow receiveShadow><boxGeometry args={[width, 8 - WOMENS_COURT_Y, 1.2]} /><Limestone evidence={evidence} selected={selected} /></mesh>)}
      {[-9, 9].map((x) => <mesh key={`instrument-lintel-${x}`} position={[x, 3.7, WOMENS_COURT_MIN_Z]} castShadow receiveShadow><boxGeometry args={[2.4, 8.6, 1.2]} /><Limestone evidence={evidence} selected={selected} /></mesh>)}
      <mesh position={[0, 8.55, WOMENS_COURT_MIN_Z]} castShadow receiveShadow><boxGeometry args={[5.2, 1.1, 1.4]} /><Limestone evidence={evidence} /></mesh>
      {[-1, 1].map((side) => <group name="nicanor-bronze-door" key={`nicanor-door-${side}`} position={[side * 2.1, 3.8, WOMENS_COURT_MIN_Z + 0.1]} rotation={[0, side * -1.22, 0]}>
        <BronzeLeaf side={side} />
      </group>)}

      {[-27, 27].map((x) => <mesh key={`court-side-${x}`} position={[x, WOMENS_COURT_Y + 3, WOMENS_COURT_CENTER_Z]} castShadow receiveShadow><boxGeometry args={[1.2, 6, 55]} /><Limestone evidence={evidence} /></mesh>)}
      {[-14.5, 14.5].map((x) => <mesh key={`court-east-${x}`} position={[x, WOMENS_COURT_Y + 4, WOMENS_COURT_MAX_Z]} castShadow receiveShadow><boxGeometry args={[25, 8, 1.2]} /><Limestone evidence={evidence} /></mesh>)}
      <mesh position={[0, WOMENS_COURT_Y + 8.55, WOMENS_COURT_MAX_Z]} castShadow receiveShadow><boxGeometry args={[5.2, 1.1, 1.4]} /><Limestone evidence={evidence} /></mesh>
      {[-1, 1].map((side) => <group name="gold-plated-court-door" key={`east-door-${side}`} position={[side * 2.1, WOMENS_COURT_Y + 3.8, WOMENS_COURT_MAX_Z - 0.1]} rotation={[0, side * 1.22, 0]}>
        <BronzeLeaf side={side} metal="gold" />
      </group>)}

      {/* Middot's later gallery: an elevated perimeter level so women viewed above and men below. */}
      {[-24, 24].map((x) => <group key={`gallery-side-${x}`}>
        <mesh position={[x, WOMENS_COURT_Y + 3.25, WOMENS_COURT_CENTER_Z]} castShadow receiveShadow><boxGeometry args={[5, 0.28, 21.4]} /><Limestone evidence={evidence} selected={selected} /></mesh>
        <mesh position={[x > 0 ? 21.65 : -21.65, WOMENS_COURT_Y + 4.05, WOMENS_COURT_CENTER_Z]} castShadow receiveShadow><boxGeometry args={[0.3, 1.45, 21.4]} /><Limestone /></mesh>
        {galleryColumns.map((z) => <mesh key={`${x}-${z}`} position={[x, WOMENS_COURT_Y + 1.55, z]} castShadow receiveShadow><cylinderGeometry args={[0.2, 0.24, 3.1, 14]} /><Limestone evidence={evidence} /></mesh>)}
      </group>)}
      <mesh position={[0, WOMENS_COURT_Y + 3.25, WOMENS_COURT_MAX_Z - 2.5]} castShadow receiveShadow><boxGeometry args={[21, 0.28, 5]} /><Limestone evidence={evidence} selected={selected} /></mesh>
      <mesh position={[0, WOMENS_COURT_Y + 4.05, WOMENS_COURT_MAX_Z - 5.15]} castShadow receiveShadow><boxGeometry args={[21, 1.45, 0.3]} /><Limestone /></mesh>

      {CHAMBERS.map((room) => <HollowChamber key={room.name} {...room} evidence={evidence} selected={chambersSelected} onSelect={onSelectChambers} viewMode={viewMode} />)}
      <CourtPopulation serviceState={serviceState} />
      <Html position={[0, WOMENS_COURT_Y + 1.1, WOMENS_COURT_CENTER_Z]} center distanceFactor={22}><button className="hotspot" onClick={onSelect}>135 × 135 cubits</button></Html>
    </group>
  );
}

function IsraelPriestsCourt({ evidence, selected, onSelect, viewMode }: { evidence: boolean; selected: boolean; onSelect: () => void; viewMode: ViewMode }) {
  const raisedEastZ = ISRAEL_WEST_Z - 2 * CUBIT;
  const raisedDepth = raisedEastZ - AZARAH_WEST_Z;
  const terraces = [
    { east: ISRAEL_WEST_Z, west: ISRAEL_WEST_Z - CUBIT, top: CUBIT },
    { east: ISRAEL_WEST_Z - CUBIT, west: ISRAEL_WEST_Z - CUBIT * 1.5, top: CUBIT * 1.5 },
    { east: ISRAEL_WEST_Z - CUBIT * 1.5, west: ISRAEL_WEST_Z - CUBIT * 2, top: CUBIT * 2 },
  ];
  return <group onClick={(event) => { event.stopPropagation(); onSelect(); }}>
    <mesh position={[0, PRIESTS_FLOOR_Y / 2, AZARAH_WEST_Z + raisedDepth / 2]} castShadow receiveShadow>
      <boxGeometry args={[54, PRIESTS_FLOOR_Y, raisedDepth]} /><PavingMaterial evidence={evidence} selected={selected} />
    </mesh>
    {terraces.map((terrace, index) => <mesh key={terrace.top} position={[0, terrace.top / 2, (terrace.east + terrace.west) / 2]} castShadow receiveShadow>
      <boxGeometry args={[54, terrace.top, terrace.east - terrace.west + 0.015]} /><Limestone evidence={evidence} selected={selected} />
    </mesh>)}
    <mesh position={[0, 0.025, ISRAEL_WEST_Z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
      <planeGeometry args={[54, 0.12]} /><meshBasicMaterial color="#d1b15d" transparent opacity={0.85} depthWrite={false} />
    </mesh>

    {MUSIC_ROOMS.map((room) => <group key={room.name}>
      <mesh position={[room.x, WOMENS_COURT_Y + 0.06, (ISRAEL_WEST_Z + AZARAH_EAST_Z) / 2]} receiveShadow><boxGeometry args={[5.65, 0.12, AZARAH_EAST_Z - ISRAEL_WEST_Z - 0.2]} /><PavingMaterial evidence={evidence} selected={selected} /></mesh>
      <mesh position={[room.x, (WOMENS_COURT_Y - 0.2) / 2, ISRAEL_WEST_Z]} castShadow receiveShadow><boxGeometry args={[6, Math.abs(WOMENS_COURT_Y) - 0.2, 0.35]} /><Limestone evidence={evidence} selected={selected} /></mesh>
      {[-3, 3].map((offset) => <mesh key={offset} position={[room.x + offset, (WOMENS_COURT_Y - 0.2) / 2, (ISRAEL_WEST_Z + AZARAH_EAST_Z) / 2]} castShadow receiveShadow><boxGeometry args={[0.35, Math.abs(WOMENS_COURT_Y) - 0.2, AZARAH_EAST_Z - ISRAEL_WEST_Z]} /><Limestone evidence={evidence} selected={selected} /></mesh>)}
      <group position={[room.x,0,0]}><InstrumentStorage side={room.x} /></group>
      {viewMode === "overview" && <Html position={[room.x, WOMENS_COURT_Y + 1.35, 1]} center distanceFactor={13}><button className="hotspot chamber-label" onClick={onSelect}>{room.name}</button></Html>}
    </group>)}

    {selected && <>
      <Html position={[20, 0.55, 0.7]} center distanceFactor={15}><button className="hotspot" onClick={onSelect}>Israel · 135 × 11 cubits</button></Html>
      <Html position={[20, PRIESTS_FLOOR_Y + 0.55, -3.8]} center distanceFactor={15}><button className="hotspot" onClick={onSelect}>Priests · 135 × 11 cubits</button></Html>
      <Html position={[0, PRIESTS_FLOOR_Y + 1.05, ISRAEL_WEST_Z - 0.7]} center distanceFactor={14}><button className="hotspot" onClick={onSelect}>Levitical platform · 1 + 3 steps</button></Html>
    </>}
  </group>;
}

function AzarahPlan({ evidence, selected, onSelect, viewMode }: { evidence: boolean; selected: boolean; onSelect: () => void; viewMode: ViewMode }) {
  const divisions = [
    { z: AZARAH_WEST_Z, label: "West boundary" },
    { z: TEMPLE_WEST_Z, label: "11 cubits behind" },
    { z: TEMPLE_EAST_Z, label: "Temple · 100 cubits" },
    { z: TEMPLE_EAST_Z + 22 * CUBIT, label: "22 cubits" },
    { z: TEMPLE_EAST_Z + 54 * CUBIT, label: "Altar · 32 cubits" },
    { z: TEMPLE_EAST_Z + 65 * CUBIT, label: "Priests · 11 cubits" },
    { z: AZARAH_EAST_Z, label: "Israel · 11 cubits" },
  ];
  return <group userData={{ cameraOccluder: true }} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
    {divisions.map(({ z, label }, index) => <group key={label}>
      <mesh position={[0, 0.045, z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
        <planeGeometry args={[54, index === 0 || index === divisions.length - 1 ? 0.14 : 0.07]} />
        <meshBasicMaterial color={evidence ? "#d3aa4e" : "#8e8065"} transparent opacity={selected ? 0.9 : 0.48} depthWrite={false} />
      </mesh>
      {selected && index > 0 && <Html position={[25.2, 0.35, z - 0.25]} center distanceFactor={19}><span className="plan-label">{label}</span></Html>}
    </group>)}
    {AZARAH_ROOMS.map((room) => <group key={room.name}>
      {viewMode === "overview" && <Html position={[room.x, PRIESTS_FLOOR_Y + 7.4, room.z]} center distanceFactor={14}><button className="hotspot chamber-label" onClick={onSelect}>{room.name}</button></Html>}
    </group>)}
    {selected && <Html position={[0, 1.1, -8]} center distanceFactor={20}><button className="hotspot" onClick={onSelect}>Azarah · 187 × 135 cubits</button></Html>}
  </group>;
}

function TempleMountPlatform({ evidence, selected, onSelect }: { evidence: boolean; selected: boolean; onSelect: () => void }) {
  const wallBottom = OUTER_MOUNT_Y;
  const wallHeight = 7.4;
  const wallY = wallBottom + wallHeight / 2;
  const wallLintelY = wallBottom + wallHeight + 0.5;
  return (
    <group userData={{ cameraOccluder: true }} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <MountMasonry evidence={evidence} selected={selected} />

      {/* East Shushan and west Kiphonus walls: one centered opening on each side. */}
      {[-86, 114].flatMap((z) => [-55, 55].map((x) => <mesh key={`${z}-${x}`} position={[x, wallY, z]} castShadow receiveShadow><boxGeometry args={[90, wallHeight, 2]} /><Limestone evidence={evidence} selected={selected} /></mesh>))}
      {[-86, 114].map((z) => <mesh key={`lintel-${z}`} position={[0, wallLintelY, z]} castShadow receiveShadow><boxGeometry args={[20, 1, 2.3]} /><Limestone evidence={evidence} /></mesh>)}

      {/* North Tadi wall with one gate. */}
      {[-40, 68].map((z) => <mesh key={`north-${z}`} position={[100, wallY, z]} castShadow receiveShadow><boxGeometry args={[2, wallHeight, 92]} /><Limestone evidence={evidence} selected={selected} /></mesh>)}
      <mesh position={[100, wallLintelY, 14]} castShadow receiveShadow><boxGeometry args={[2.3, 1, 16]} /><Limestone evidence={evidence} /></mesh>

      {/* South wall with the two Huldah gates. */}
      {[{ z: -55, d: 62 }, { z: 14, d: 52 }, { z: 83, d: 62 }].map((section) => <mesh key={`south-${section.z}`} position={[-100, wallY, section.z]} castShadow receiveShadow><boxGeometry args={[2, wallHeight, section.d]} /><Limestone evidence={evidence} selected={selected} /></mesh>)}
      {[-18, 46].map((z) => <mesh key={`hulda-${z}`} position={[-100, wallLintelY, z]} castShadow receiveShadow><boxGeometry args={[2.3, 1, 12]} /><Limestone evidence={evidence} /></mesh>)}

      {[-7.2, -5.9, -4.6, -3.3].flatMap((y) => [
        <mesh key={`course-east-${y}`} position={[0, y, 114.03]}><boxGeometry args={[200, 0.09, 0.08]} /><meshStandardMaterial color="#786b59" roughness={1} /></mesh>,
        <mesh key={`course-south-${y}`} position={[-100.03, y, 14]}><boxGeometry args={[0.08, 0.09, 200]} /><meshStandardMaterial color="#786b59" roughness={1} /></mesh>,
      ])}
      <Html position={[72, 1.4, 82]} center distanceFactor={34}><button className="hotspot" onClick={onSelect}>Temple Mount · 500 × 500 cubits</button></Html>
    </group>
  );
}

function Courtyard({ evidence, selected, onSelect }: { evidence: boolean; selected: boolean; onSelect: () => void }) {
  const xJoints = useMemo(() => Array.from({ length: 11 }, (_, i) => -25 + i * 5), []);
  const zJoints = useMemo(() => Array.from({ length: 15 }, (_, i) => AZARAH_WEST_Z + 2.4 + i * 5), []);
  const centerZ = (AZARAH_WEST_Z + AZARAH_EAST_Z) / 2;
  const westernBaseCenterZ = (AZARAH_WEST_Z + ISRAEL_WEST_Z) / 2;
  return (
    <group onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <mesh position={[0, OUTER_MOUNT_Y / 2, westernBaseCenterZ]} castShadow receiveShadow><boxGeometry args={[54, Math.abs(OUTER_MOUNT_Y), ISRAEL_WEST_Z - AZARAH_WEST_Z]} /><PavingMaterial evidence={evidence} selected={selected} /></mesh>
      <mesh position={[0, -0.1, (ISRAEL_WEST_Z + AZARAH_EAST_Z) / 2]} castShadow receiveShadow><boxGeometry args={[54, 0.2, AZARAH_EAST_Z - ISRAEL_WEST_Z]} /><PavingMaterial evidence={evidence} selected={selected} /></mesh>
      {xJoints.map((x) => <mesh key={`x-${x}`} position={[x, 0.012, centerZ]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.045, AZARAH_EAST_Z - AZARAH_WEST_Z - 0.3]} /><meshBasicMaterial color="#675f50" transparent opacity={0.28} /></mesh>)}
      {zJoints.map((z) => <mesh key={`z-${z}`} position={[0, 0.014, z]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}><planeGeometry args={[0.045, 53.6]} /><meshBasicMaterial color="#675f50" transparent opacity={0.24} /></mesh>)}
    </group>
  );
}

function Colonnade() {
  return <group position={[0, OUTER_MOUNT_Y, 0]}>{[-1, 1].flatMap((side) => [-70, -54, -38, -22, -6, 10, 26, 42, 58, 74, 90, 106].map((z) => (
    <group key={`${side}-${z}`} position={[side * 52, 0, z]}>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow><cylinderGeometry args={[1.2, 1.5, 0.5, 24]} /><Limestone /></mesh>
      <mesh position={[0, 6.75, 0]} castShadow receiveShadow><cylinderGeometry args={[0.78, 0.95, 12.5, 24]} /><Limestone /></mesh>
      <mesh position={[0, 13.2, 0]} castShadow receiveShadow><boxGeometry args={[2.5, 0.65, 2.5]} /><Limestone /></mesh>
    </group>
  )))}
    {[-1, 1].map((side) => <mesh key={`beam-${side}`} position={[side * 52, 14, 18]} castShadow receiveShadow><boxGeometry args={[2.3, 1.25, 188]} /><Limestone /></mesh>)}
  </group>;
}

function CourtEnclosure() {
  return (
    <group position={[0, OUTER_MOUNT_Y, 0]} userData={{ cameraOccluder: true }}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 60.5, 0, 14]}>
          <mesh position={[0, 3.5, 0]} castShadow receiveShadow><boxGeometry args={[2.2, 7, 196]} /><Limestone /></mesh>
          <mesh position={[-side * 2.5, 7.3, 0]} castShadow receiveShadow><boxGeometry args={[7, 0.65, 196]} /><Limestone /></mesh>
        </group>
      ))}
      {[-28, 28].map((x) => (
        <mesh key={`west-${x}`} position={[x, 4, -84]} castShadow receiveShadow><boxGeometry args={[32, 8, 2.2]} /><Limestone /></mesh>
      ))}
      <mesh position={[0, 7.6, -84]} castShadow receiveShadow><boxGeometry args={[24, 1.1, 2.5]} /><Limestone /></mesh>
      {[-28, 28].map((x) => (
        <mesh key={`east-${x}`} position={[x, 4, 112]} castShadow receiveShadow><boxGeometry args={[32, 8, 2.2]} /><Limestone /></mesh>
      ))}
      <mesh position={[0, 7.6, 112]} castShadow receiveShadow><boxGeometry args={[24, 1.1, 2.5]} /><Limestone /></mesh>
    </group>
  );
}

const wrapAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));
const clampNumber = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const damp = (current: number, target: number, rate: number, dt: number) => current + (target - current) * (1 - Math.exp(-rate * dt));
const dampAngle = (current: number, target: number, rate: number, dt: number) => current + wrapAngle(target - current) * (1 - Math.exp(-rate * dt));
const easeInOut = (value: number) => (value < 0.5 ? 4 * value * value * value : 1 - (-2 * value + 2) ** 3 / 2);

const VIEW_FOV: Record<ViewMode, number> = { overview: 40, third: 56, first: 74 };
const THIRD_DEFAULT_DISTANCE = 4.2;
const DEFAULT_ORBIT = { yaw: 0.71, pitch: 0.47, dist: 254 };

const FOCUS_SHOTS: Partial<Record<FeatureId, { target: [number, number, number]; camera: [number, number, number] }>> = {
  altar: { target: [-2.5, ALTAR_TOP_Y * 0.58, ALTAR_CENTER_Z - 2], camera: [-27, 16, 15] },
  facade: { target: [0, TEMPLE_FLOOR_Y + 8, TEMPLE_EAST_Z - 2], camera: [34, 24, 18] },
  vessels: { target: [-1.2, TEMPLE_FLOOR_Y + 0.8, -47], camera: [10.5, TEMPLE_FLOOR_Y + 6.8, -40] },
  paving: { target: [0, PRIESTS_FLOOR_Y, -8], camera: [44, 38, 46] },
  womensCourt: { target: [0, WOMENS_COURT_Y, WOMENS_COURT_CENTER_Z], camera: [38, 27, WOMENS_COURT_CENTER_Z + 42] },
  chambers: { target: [0, WOMENS_COURT_Y + 1, WOMENS_COURT_CENTER_Z], camera: [40, 23, WOMENS_COURT_CENTER_Z + 34] },
  mount: { target: [0, OUTER_MOUNT_Y, 14], camera: [116, 92, 142] },
};

const OVERVIEW_PRESETS = {
  home: FOCUS_SHOTS.mount!,
  womensCourt: { target: [0, WOMENS_COURT_Y + 1.2, WOMENS_COURT_CENTER_Z] as [number,number,number], camera: [44,24,WOMENS_COURT_CENTER_Z+34] as [number,number,number] },
  nicanor: { target: [0,2.5,WOMENS_COURT_MIN_Z] as [number,number,number], camera: [25,14,WOMENS_COURT_MIN_Z+24] as [number,number,number] },
  azarah: { target: [-2.5,PRIESTS_FLOOR_Y+1.8,-16] as [number,number,number], camera: [-39,30,17] as [number,number,number] },
  facade: FOCUS_SHOTS.facade!,
  sanctuary: { target: [0, TEMPLE_FLOOR_Y + 8, TEMPLE_EAST_Z - 5] as [number, number, number], camera: [47, 32, 38] as [number, number, number] },
  sideCells: { target: [0, TEMPLE_FLOOR_Y + 10, -48] as [number, number, number], camera: [39, 27, -72] as [number, number, number] },
  hearth: { target: [35, PRIESTS_FLOOR_Y + 2, -52] as [number, number, number], camera: [62, 23, -26] as [number, number, number] },
  vessels: FOCUS_SHOTS.vessels!,
  wilderness: { target: [-44, 3, 315] as [number, number, number], camera: [116, 83, 510] as [number, number, number] },
};

const OVERVIEW_LABELS: Record<keyof typeof OVERVIEW_PRESETS,string> = {
  home: "Temple Mount · whole-site view",
  womensCourt: "Women’s Court · Ezrat Nashim",
  nicanor: "Nicanor Gate · fifteen semicircular steps",
  azarah: "Azarah · service court",
  facade: "Ulam · eastern façade",
  sanctuary: "Sanctuary · Ulam, Hekhal and side cells",
  sideCells: "Kodesh cutaway · 38 cells and maintenance route",
  hearth: "Azarah chambers · Hearth complex",
  vessels: "Holy Place · Menorah, table and incense altar",
  wilderness: "Yom Kippur goat route · wilderness stations",
};

const CEREMONY_STAGE_ANGLES: Partial<Record<CeremonyStage, number>> = { dawn: 0.72, outsideBath: -0.82, altar: 0.62, altarRamp: 0.82, laver: -0.74, parvah: -1.05, bull: 0.5, lottery: -0.68, altarTop: 1.08, incensePrep: -0.48, holyPlace: 1.08, curtain: 1.0, goldenAltar: 1.12, holyOfHolies: 1.02, scapegoat: -0.72, eastGate: 0.58, reading: -0.55, exit: 0.78 };

/**
 * One camera for every mode. Each mode (overview, third, first) can be driven by the
 * ceremony ("auto") or by the visitor ("manual"); dragging and scrolling always adjust
 * the current view, and every change of mode or control blends smoothly.
 */
function CameraRig({ viewMode, inspectionFocus, playerRef, facingRef, serviceState, ceremonyFollow, ceremonyFocusRef, ceremonyTimeRef, leadPoseRef, hideLeadRef, pivotRef, onManualInput, cameraGestureUntilRef }: { viewMode: ViewMode; inspectionFocus: FeatureId | null; playerRef: React.RefObject<Group | null>; facingRef: React.MutableRefObject<FacingControl>; serviceState: ServiceState; ceremonyFollow: boolean; ceremonyFocusRef: React.MutableRefObject<Vector3>; ceremonyTimeRef: React.MutableRefObject<number>; leadPoseRef: React.MutableRefObject<LeadPose>; hideLeadRef: React.MutableRefObject<boolean>; pivotRef: React.MutableRefObject<Vector3>; onManualInput: () => void; cameraGestureUntilRef: React.MutableRefObject<number> }) {
  const { camera, gl, scene } = useThree();
  const perspective = camera as PerspectiveCamera;
  const guided = serviceState === "yomKippur" && ceremonyFollow;
  const live = useRef({ viewMode, guided, onManualInput });
  useEffect(() => {
    live.current = { viewMode, guided, onManualInput };
  });

  const lookEuler = useMemo(() => new Euler(0, 0, 0, "YXZ"), []);
  const desired = useMemo(() => new Vector3(), []);
  const ceremonyCamera = useMemo(() => new Vector3(), []);
  const subject = useMemo(() => new Vector3(), []);
  const offsetDirection = useMemo(() => new Vector3(), []);
  const rayDirection = useMemo(() => new Vector3(), []);
  const resolvedCamera = useMemo(() => new Vector3(), []);
  const cameraCandidate = useMemo(() => new Vector3(), []);
  const occlusionFallback = useMemo(() => new Vector3(), []);
  const cameraUp = useMemo(() => new Vector3(0, 1, 0), []);
  const cameraRay = useMemo(() => new Raycaster(), []);
  const lookMatrix = useMemo(() => new Matrix4(), []);
  const cameraOccluders = useRef<Object3D[]>([]);
  const lastOccluderScan = useRef(0);
  const diagnosticFrames = useRef(0);
  const diagnosticWindowStart = useRef(0);

  const orbit = useRef({
    target: new Vector3(0, 4, -1), yaw: DEFAULT_ORBIT.yaw, pitch: DEFAULT_ORBIT.pitch, dist: DEFAULT_ORBIT.dist,
    gTarget: new Vector3(0, 4, -1), gYaw: DEFAULT_ORBIT.yaw, gPitch: DEFAULT_ORBIT.pitch, gDist: DEFAULT_ORBIT.dist,
  });
  const view = useRef({ pos: new Vector3(), target: new Vector3() });
  const autoOffset = useRef({ yaw: 0, pitch: 0, zoom: 1 });
  const third = useRef({ goal: THIRD_DEFAULT_DISTANCE, shown: THIRD_DEFAULT_DISTANCE, pivot: new Vector3(), ready: false });
  const first = useRef({ fovOffset: 0, eyeY: 0, ready: false });
  const smoothHeading = useRef(0);
  const headingReady = useRef(false);
  const transition = useRef({ t: 1, duration: 1, pos: new Vector3(), quat: new Quaternion(), fov: 43 });
  const pose = useMemo(() => ({ pos: new Vector3(), quat: new Quaternion(), fov: 43 }), []);
  const lastKey = useRef("");
  const heldKeys = useRef(new Set<string>());
  const wasGuided = useRef(guided);
  const orbitCommanded = useRef(false);

  // Development-only inspection hooks for scripted verification.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const target = window as unknown as Record<string, unknown>;
    target.__templeCam = (x: number, y: number, z: number, yaw: number, pitch: number, dist: number) => {
      const o = orbit.current;
      o.gTarget.set(x, y, z); o.target.set(x, y, z);
      o.gYaw = o.yaw = yaw; o.gPitch = o.pitch = pitch; o.gDist = o.dist = dist;
    };
    target.__templePlayer = (x: number, z: number, y?: number) => {
      const player = playerRef.current;
      if (!player) return;
      player.position.set(x, y ?? walkableHeightAt(x, z, 0), z);
    };
    target.__templeFace = (yaw: number, pitch = 0) => { facingRef.current.yaw = yaw; facingRef.current.pitch = pitch; };
    return () => { delete target.__templeCam; delete target.__templePlayer; delete target.__templeFace; };
  }, [playerRef, facingRef]);
  const refreshCameraOccluders = () => {
    const now = performance.now();
    if (cameraOccluders.current.length > 0 && now - lastOccluderScan.current < 2000) return;
    const roots: Object3D[] = [];
    scene.traverse((object) => {
      if (!object.userData.cameraOccluder) return;
      let ancestor = object.parent;
      while (ancestor) {
        if (ancestor.userData.cameraOccluder) return;
        ancestor = ancestor.parent;
      }
      roots.push(object);
    });
    cameraOccluders.current = roots;
    lastOccluderScan.current = now;
  };

  const resolveLineOfSight = (lookAt: Vector3, wanted: Vector3) => {
    refreshCameraOccluders();
    const wantedDistance = wanted.distanceTo(lookAt);
    resolvedCamera.copy(wanted);
    if (wantedDistance < 0.2) return { position: resolvedCamera, blocked: false };

    const minimumSubjectDistance = Math.min(8, wantedDistance * 0.45);
    let bestClearance = 0;
    const angles = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI];
    for (const angle of angles) {
      cameraCandidate.copy(wanted).sub(lookAt).applyAxisAngle(cameraUp, angle).add(lookAt);
      rayDirection.copy(cameraCandidate).sub(lookAt);
      const candidateDistance = rayDirection.length();
      rayDirection.multiplyScalar(1 / candidateDistance);
      cameraRay.set(lookAt, rayDirection);
      cameraRay.near = 0.28;
      cameraRay.far = candidateDistance;
      const obstruction = cameraRay.intersectObjects(cameraOccluders.current, true)[0];
      if (!obstruction) {
        resolvedCamera.copy(cameraCandidate);
        return { position: resolvedCamera, blocked: angle !== 0 };
      }
      const clearance = obstruction.distance - 0.48;
      if (clearance > bestClearance) {
        bestClearance = clearance;
        occlusionFallback.copy(lookAt).addScaledVector(rayDirection, Math.max(0.72, clearance));
      }
    }

    // Never solve an obstruction by creating an extreme body close-up. If all
    // normal angles are blocked, prefer the clearest usable angle and then a
    // high contextual fallback rather than placing the lens inside the action.
    if (bestClearance >= minimumSubjectDistance) {
      resolvedCamera.copy(occlusionFallback);
    } else {
      resolvedCamera.copy(lookAt);
      resolvedCamera.x += minimumSubjectDistance;
      resolvedCamera.y += Math.max(10, wantedDistance * 0.5);
      resolvedCamera.z += minimumSubjectDistance;
    }
    return { position: resolvedCamera, blocked: true };
  };

  // Distance a third-person boom can extend before it would poke through architecture.
  const clearBoomDistance = (pivot: Vector3, direction: Vector3, wanted: number) => {
    refreshCameraOccluders();
    cameraRay.set(pivot, direction);
    cameraRay.near = 0.2;
    cameraRay.far = wanted + 0.35;
    const hit = cameraRay.intersectObjects(cameraOccluders.current, true)[0];
    return hit ? Math.max(0.75, Math.min(wanted, hit.distance - 0.35)) : wanted;
  };

  const seedOrbit = (position: Vector3, target: Vector3) => {
    const o = orbit.current;
    const dx = position.x - target.x;
    const dy = position.y - target.y;
    const dz = position.z - target.z;
    const dist = Math.max(4, Math.hypot(dx, dy, dz));
    o.target.copy(target);
    o.gTarget.copy(target);
    o.yaw = o.gYaw = Math.atan2(dx, dz);
    o.pitch = o.gPitch = clampNumber(Math.asin(clampNumber(dy / dist, -1, 1)), 0.08, 1.5);
    o.dist = o.gDist = clampNumber(dist, 5, 330);
  };

  const dropPlayerNear = (x: number, z: number) => {
    const player = playerRef.current;
    if (!player) return;
    for (let ring = 0; ring <= 6; ring += 1.5) {
      for (let step = 0; step < (ring === 0 ? 1 : 8); step += 1) {
        const angle = (step / 8) * Math.PI * 2;
        const candidateX = clampNumber(x + Math.sin(angle) * ring, TEMPLE_MOUNT_NAV_BOUNDS.minX, TEMPLE_MOUNT_NAV_BOUNDS.maxX);
        const candidateZ = clampNumber(z + Math.cos(angle) * ring, TEMPLE_MOUNT_NAV_BOUNDS.minZ, TEMPLE_MOUNT_NAV_BOUNDS.maxZ);
        const floorY = walkableHeightAt(candidateX, candidateZ, 0);
        if (collidesWithArchitecture(candidateX, candidateZ, floorY)) continue;
        if (!resolveAltarMovement({ x: candidateX, y: 0, z: candidateZ }, { x: candidateX, y: 0, z: candidateZ }).allowed) continue;
        player.position.set(candidateX, floorY, candidateZ);
        return;
      }
    }
  };

  useEffect(() => {
    if (viewMode !== "overview" || guided || !inspectionFocus) return;
    const shot = FOCUS_SHOTS[inspectionFocus];
    if (!shot) return;
    const o = orbit.current;
    const dx = shot.camera[0] - shot.target[0];
    const dy = shot.camera[1] - shot.target[1];
    const dz = shot.camera[2] - shot.target[2];
    const dist = Math.hypot(dx, dy, dz);
    o.gTarget.set(...shot.target);
    o.gDist = dist;
    o.gYaw = Math.atan2(dx, dz);
    o.gPitch = Math.asin(dy / dist);
  }, [guided, inspectionFocus, viewMode]);

  // Taking control from the guided camera puts the visitor at the performer's spot, facing the same way.
  useEffect(() => {
    const wasAuto = wasGuided.current;
    wasGuided.current = guided;
    if (!wasAuto || guided || viewMode === "overview") return;
    const player = playerRef.current;
    const lead = leadPoseRef.current;
    if (!player) return;
    const forwardX = Math.sin(lead.heading);
    const forwardZ = Math.cos(lead.heading);
    dropPlayerNear(lead.position.x - forwardX * 1.1, lead.position.z - forwardZ * 1.1);
    player.rotation.y = lead.heading;
    facingRef.current.yaw = wrapAngle(lead.heading + Math.PI) + autoOffset.current.yaw;
    facingRef.current.pitch = clampNumber(-0.06 + autoOffset.current.pitch, -1.2, 1.2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guided, viewMode]);

  useEffect(() => {
    const element = gl.domElement;
    element.style.touchAction = "none";
    const pointers = new globalThis.Map<number, { x: number; y: number }>();
    let travelled = 0;
    let dragButton = 0;
    let pinchDistance = 0;

    const takeManualOverview = () => {
      if (live.current.viewMode !== "overview" || !live.current.guided) return;
      seedOrbit(view.current.pos, view.current.target);
      autoOffset.current = { yaw: 0, pitch: 0, zoom: 1 };
      // The current camera pose already matches the newly seeded orbit. A second
      // auto-to-manual camera blend changes the apparent distance while the user
      // is dragging, which feels like an unwanted zoom.
      transition.current.t = 1;
      live.current.guided = false;
      live.current.onManualInput();
    };

    const publishInputMode = () => {
      const locked = document.pointerLockElement === element;
      element.dataset.cameraInputMode = locked ? "pointer-lock" : live.current.viewMode === "overview" ? "orbit" : "free";
    };

    const look = (dx: number, dy: number, pan: boolean) => {
      const { viewMode: mode, guided: isGuided } = live.current;
      const off = autoOffset.current;
      if (mode === "overview") {
        takeManualOverview();
        const o = orbit.current;
        if (pan) {
          const scale = o.gDist * 0.0016;
          const rightX = Math.cos(o.gYaw);
          const rightZ = -Math.sin(o.gYaw);
          o.gTarget.x = clampNumber(o.gTarget.x - rightX * dx * scale - Math.sin(o.gYaw) * dy * scale, -160, 160);
          o.gTarget.z = clampNumber(o.gTarget.z - rightZ * dx * scale - Math.cos(o.gYaw) * dy * scale, -170, 190);
        } else {
          o.gYaw -= dx * 0.005;
          o.gPitch = clampNumber(o.gPitch + dy * 0.004, 0.08, 1.5);
        }
        return;
      }
      if (isGuided) {
        off.yaw -= dx * 0.0028;
        off.pitch = clampNumber(off.pitch - dy * 0.0022, -0.8, 0.8);
      } else {
        facingRef.current.yaw -= dx * 0.0026;
        facingRef.current.pitch = clampNumber(facingRef.current.pitch - dy * 0.0022, -1.2, 1.2);
      }
    };

    const zoomBy = (factor: number, amount: number) => {
      const { viewMode: mode } = live.current;
      if (mode === "overview") {
        takeManualOverview();
        orbit.current.gDist = clampNumber(orbit.current.gDist * factor, 5, 330);
      } else if (mode === "third") {
        third.current.goal = clampNumber(third.current.goal * factor, 1.3, 12);
      } else {
        first.current.fovOffset = clampNumber(first.current.fovOffset + amount * 0.02, -30, 12);
      }
    };

    const resetView = () => {
      const { viewMode: mode, guided: isGuided } = live.current;
      autoOffset.current = { yaw: 0, pitch: 0, zoom: 1 };
      third.current.goal = THIRD_DEFAULT_DISTANCE;
      first.current.fovOffset = 0;
      if (mode === "overview" && !isGuided) {
        const o = orbit.current;
        const shot = OVERVIEW_PRESETS.home;
        const target = new Vector3(...shot.target);
        const cameraPosition = new Vector3(...shot.camera);
        const delta = cameraPosition.sub(target);
        o.gTarget.copy(target);
        o.gDist = delta.length();
        o.gYaw = Math.atan2(delta.x, delta.z);
        o.gPitch = Math.asin(delta.y / o.gDist);
      }
    };

    const beginGesture = () => {
      cameraGestureUntilRef.current = Number.POSITIVE_INFINITY;
    };
    const endGesture = () => {
      cameraGestureUntilRef.current = performance.now() + 240;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (document.pointerLockElement === element) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // Capture is a nicety; dragging still works without it.
      }
      if (pointers.size === 1) {
        travelled = 0;
        dragButton = event.button;
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
        travelled = 99;
        beginGesture();
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (document.pointerLockElement === element) return;
      const previous = pointers.get(event.pointerId);
      if (!previous) return;
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDistance > 0 && distance > 0) zoomBy(pinchDistance / distance, (pinchDistance - distance) * 2);
        pinchDistance = distance;
        return;
      }
      travelled += Math.abs(dx) + Math.abs(dy);
      if (travelled < 4) return;
      beginGesture();
      look(dx, dy, dragButton === 2 || dragButton === 1 || event.shiftKey);
    };

    const onPointerUp = (event: PointerEvent) => {
      const wasTap = pointers.size === 1 && travelled < 4;
      pointers.delete(event.pointerId);
      try {
        element.releasePointerCapture(event.pointerId);
      } catch {
        // Already released.
      }
      if (travelled >= 4) endGesture();
      const { viewMode: mode, guided: isGuided } = live.current;
      if (wasTap && event.button === 0 && event.pointerType === "mouse" && mode !== "overview" && !isGuided && document.pointerLockElement !== element) {
        try {
          void Promise.resolve(element.requestPointerLock()).catch(() => undefined);
        } catch {
          // Embedded previews can refuse pointer lock; drag-to-look keeps working.
        }
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== element) return;
      look(event.movementX, event.movementY, false);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
      const amount = clampNumber(event.deltaY * unit, -120, 120);
      zoomBy(Math.exp(amount * 0.00078), amount);
    };

    const onCameraCommand = (event: Event) => {
      const detail = (event as CustomEvent<{ target: [number, number, number]; camera: [number, number, number] }>).detail;
      if (!detail || live.current.viewMode !== "overview") return;
      takeManualOverview();
      const target = new Vector3(...detail.target);
      const cameraPosition = new Vector3(...detail.camera);
      const dx = cameraPosition.x - target.x;
      const dy = cameraPosition.y - target.y;
      const dz = cameraPosition.z - target.z;
      const dist = Math.hypot(dx, dy, dz);
      const o = orbit.current;
      o.gTarget.copy(target);
      o.gDist = clampNumber(dist, 5, 330);
      o.gYaw = Math.atan2(dx, dz);
      o.gPitch = clampNumber(Math.asin(dy / dist), 0.08, 1.5);
      orbitCommanded.current = true;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('input,select,textarea,[contenteditable="true"]')) return;
      heldKeys.current.add(event.code);
      if (event.code === "KeyR") resetView();
    };
    const onKeyUp = (event: KeyboardEvent) => heldKeys.current.delete(event.code);
    const onBlur = () => heldKeys.current.clear();
    const preventMenu = (event: Event) => event.preventDefault();

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerUp);
    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("dblclick", resetView);
    element.addEventListener("contextmenu", preventMenu);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("pointerlockchange", publishInputMode);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("temple-camera-command", onCameraCommand);
    publishInputMode();
    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerUp);
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("dblclick", resetView);
      element.removeEventListener("contextmenu", preventMenu);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", publishInputMode);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("temple-camera-command", onCameraCommand);
      if (document.pointerLockElement === element) document.exitPointerLock();
      element.dataset.cameraInputMode = "free";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl.domElement]);

  // Leaving a first/third-person view frees the mouse so overview and menus stay usable.
  useEffect(() => {
    if (viewMode === "overview" && document.pointerLockElement === gl.domElement) document.exitPointerLock();
    gl.domElement.dataset.cameraInputMode = document.pointerLockElement === gl.domElement ? "pointer-lock" : viewMode === "overview" ? "orbit" : "free";
  }, [gl.domElement, viewMode]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const diagnosticNow = performance.now();
    if (diagnosticWindowStart.current === 0) diagnosticWindowStart.current = diagnosticNow;
    diagnosticFrames.current += 1;
    if (diagnosticNow - diagnosticWindowStart.current >= 1000) {
      const elapsedSeconds = (diagnosticNow - diagnosticWindowStart.current) / 1000;
      gl.domElement.dataset.rendererFps = String(Math.round(diagnosticFrames.current / elapsedSeconds));
      gl.domElement.dataset.cameraMode = viewMode;
      gl.domElement.dataset.cameraFollow = String(guided);
      gl.domElement.dataset.cameraControl = guided ? "auto" : "manual";
      gl.domElement.dataset.cameraX = camera.position.x.toFixed(3);
      gl.domElement.dataset.cameraY = camera.position.y.toFixed(3);
      gl.domElement.dataset.cameraZ = camera.position.z.toFixed(3);
      gl.domElement.dataset.cameraYaw = facingRef.current.yaw.toFixed(3);
      gl.domElement.dataset.cameraPitch = facingRef.current.pitch.toFixed(3);
      gl.domElement.dataset.pointerLocked = String(document.pointerLockElement === gl.domElement);
      diagnosticFrames.current = 0;
      diagnosticWindowStart.current = diagnosticNow;
    }
    const player = playerRef.current;
    if (!player) return;

    const mode = viewMode;
    const focus = ceremonyFocusRef.current;
    const lead = leadPoseRef.current;
    const off = autoOffset.current;
    const o = orbit.current;
    const tr = transition.current;
    hideLeadRef.current = guided && mode === "first";

    // Any change of view or control blends from the pose the lens holds right now.
    const key = `${mode}:${guided ? "auto" : "manual"}`;
    if (key !== lastKey.current) {
      const firstFrame = lastKey.current === "";
      const previousMode = lastKey.current.split(":")[0] as ViewMode;
      lastKey.current = key;
      const takingManualOverview = mode === "overview" && previousMode === "overview" && !guided;
      if (!firstFrame && !takingManualOverview) {
        tr.pos.copy(camera.position);
        tr.quat.copy(camera.quaternion);
        tr.fov = perspective.fov;
        tr.t = 0;
        tr.duration = previousMode === mode ? 0.85 : 1.2;
      } else {
        tr.t = 1;
        perspective.fov = VIEW_FOV[mode];
        perspective.updateProjectionMatrix();
      }
      if (guided) autoOffset.current = { yaw: 0, pitch: 0, zoom: 1 };
      headingReady.current = false;
      third.current.ready = false;
      first.current.ready = false;
      const cameraYaw = Math.atan2(camera.matrixWorld.elements[8], camera.matrixWorld.elements[10]);
      if (mode === "overview") {
        if (guided) {
          view.current.pos.copy(camera.position);
          view.current.target.set(focus.x, focus.y + 1.2, focus.z);
        } else if (previousMode === "overview" && !firstFrame) {
          // A named overview command has already populated the orbit goal.
          // Preserve it while auto-follow switches off; otherwise the same
          // state change overwrites the requested location with the player.
          if (!orbitCommanded.current) seedOrbit(view.current.pos, view.current.target);
        } else {
          const anchor = subject.set(player.position.x, Math.max(3, player.position.y + 2), player.position.z);
          o.target.copy(anchor);
          o.gTarget.copy(anchor);
          o.yaw = o.gYaw = firstFrame ? DEFAULT_ORBIT.yaw : cameraYaw;
          o.pitch = o.gPitch = 0.55;
          o.dist = o.gDist = firstFrame ? DEFAULT_ORBIT.dist : 90;
          view.current.pos.copy(camera.position);
          view.current.target.copy(anchor);
        }
      } else if (!guided && previousMode === "overview" && !firstFrame) {
        // Drop into the scene where the overview was looking, facing the way the lens faced.
        if (Math.hypot(o.target.x - player.position.x, o.target.z - player.position.z) > 6) dropPlayerNear(o.target.x, o.target.z);
        facingRef.current.yaw = cameraYaw;
        facingRef.current.pitch = -0.08;
      }
      orbitCommanded.current = false;
    }

    if (heldKeys.current.has("KeyQ") || heldKeys.current.has("KeyE")) {
      const turn = ((heldKeys.current.has("KeyQ") ? 1 : 0) - (heldKeys.current.has("KeyE") ? 1 : 0)) * dt * 1.4;
      if (mode === "overview") {
        if (guided) off.yaw += turn;
        else o.gYaw += turn;
      }
    }

    if (guided) {
      const headingRate = mode === "first" ? 4.5 : 3;
      if (!headingReady.current) {
        smoothHeading.current = lead.heading;
        headingReady.current = true;
      } else {
        smoothHeading.current = dampAngle(smoothHeading.current, lead.heading, lead.hasActor ? headingRate : 1, dt);
      }
    }

    if (mode === "overview") {
      if (guided) {
        const shot = getCeremonyBeat(ceremonyTimeRef.current);
        desired.set(focus.x, focus.y + 1.2, focus.z);
        const inside = ["holyPlace", "curtain", "goldenAltar", "holyOfHolies"].includes(shot.beat.stage);
        const travelWindow = ["walk", "depart", "handoff", "carry"].includes(shot.beat.action) ? 0.68 : 0.34;
        const actionFocus = smoothStep(Math.max(0, (shot.progress - travelWindow) / Math.max(0.01, 1 - travelWindow)));
        const angle = (CEREMONY_STAGE_ANGLES[shot.beat.stage] ?? 0.55) + (shot.progress - 0.5) * (inside ? 0.34 : 0.55);
        const interiorContextDistance = shot.beat.stage === "holyOfHolies" ? 17 : 21;
        const distance = inside ? interiorContextDistance - actionFocus * 4.5 : 38 - actionFocus * 14;
        const height = inside ? 12.5 - actionFocus * 2.2 : 25 - actionFocus * 8;
        const yaw = angle + off.yaw;
        const pitch = clampNumber(Math.atan2(height, distance) + off.pitch, 0.12, 1.45);
        const dist = clampNumber(Math.hypot(distance, height) * off.zoom, 3.5, 220);
        ceremonyCamera.set(desired.x + Math.sin(yaw) * Math.cos(pitch) * dist, desired.y + Math.sin(pitch) * dist, desired.z + Math.cos(yaw) * Math.cos(pitch) * dist);
        const safeShot = resolveLineOfSight(desired, ceremonyCamera);
        const blend = 1 - Math.exp(-dt * (safeShot.blocked ? 10 : 2.6));
        view.current.target.lerp(desired, blend);
        view.current.pos.lerp(safeShot.position, blend);
      } else {
        if (!inspectionFocus || (player.userData.speed ?? 0) > 0.3) {
          const speed = player.userData.speed ?? 0;
          if (speed > 0.3) {
            o.gTarget.x = damp(o.gTarget.x, player.position.x, 3.2, dt);
            o.gTarget.z = damp(o.gTarget.z, player.position.z, 3.2, dt);
            o.gTarget.y = damp(o.gTarget.y, Math.max(3, player.position.y + 2), 3.2, dt);
          }
        }
        o.yaw = dampAngle(o.yaw, o.gYaw, 10, dt);
        o.pitch = damp(o.pitch, o.gPitch, 10, dt);
        o.dist = damp(o.dist, o.gDist, 8, dt);
        o.target.x = damp(o.target.x, o.gTarget.x, 9, dt);
        o.target.y = damp(o.target.y, o.gTarget.y, 9, dt);
        o.target.z = damp(o.target.z, o.gTarget.z, 9, dt);
        view.current.target.copy(o.target);
        view.current.pos.set(
          o.target.x + Math.sin(o.yaw) * Math.cos(o.pitch) * o.dist,
          o.target.y + Math.sin(o.pitch) * o.dist,
          o.target.z + Math.cos(o.yaw) * Math.cos(o.pitch) * o.dist,
        );
      }
      pose.pos.copy(view.current.pos);
      lookMatrix.lookAt(pose.pos, view.current.target, cameraUp);
      pose.quat.setFromRotationMatrix(lookMatrix);
      pose.fov = VIEW_FOV.overview;
    } else if (mode === "third") {
      const t = third.current;
      let cameraYaw: number;
      let lookPitch: number;
      if (guided) {
        subject.copy(lead.position);
        cameraYaw = smoothHeading.current + Math.PI + 0.32 + off.yaw;
        lookPitch = -0.02 + off.pitch;
      } else {
        subject.copy(player.position);
        cameraYaw = facingRef.current.yaw;
        lookPitch = facingRef.current.pitch;
      }
      subject.y += 1;
      if (!t.ready) {
        t.pivot.copy(subject);
        t.shown = t.goal;
        t.ready = true;
      } else {
        const rate = guided ? 5 : 18;
        t.pivot.x = damp(t.pivot.x, subject.x, rate, dt);
        t.pivot.y = damp(t.pivot.y, subject.y, 10, dt);
        t.pivot.z = damp(t.pivot.z, subject.z, rate, dt);
      }
      const elevation = clampNumber(0.24 - lookPitch * 0.85, -0.08, 1.25);
      offsetDirection.set(Math.sin(cameraYaw) * Math.cos(elevation), Math.sin(elevation), Math.cos(cameraYaw) * Math.cos(elevation));
      const allowed = clearBoomDistance(t.pivot, offsetDirection, t.goal);
      t.shown = allowed < t.shown ? damp(t.shown, allowed, 28, dt) : damp(t.shown, allowed, 4, dt);
      pose.pos.copy(t.pivot).addScaledVector(offsetDirection, t.shown);
      desired.copy(t.pivot);
      desired.y += 0.12;
      lookMatrix.lookAt(pose.pos, desired, cameraUp);
      pose.quat.setFromRotationMatrix(lookMatrix);
      pose.fov = VIEW_FOV.third;
      pivotRef.current.copy(t.pivot);
    } else {
      const f = first.current;
      let eyeYaw: number;
      let eyePitch: number;
      if (guided) {
        subject.copy(lead.position);
        eyeYaw = smoothHeading.current + Math.PI + off.yaw;
        eyePitch = -0.1 + off.pitch;
      } else {
        subject.copy(player.position);
        eyeYaw = facingRef.current.yaw;
        eyePitch = facingRef.current.pitch;
      }
      const targetEyeY = subject.y + PRIEST_EYE_HEIGHT;
      f.eyeY = f.ready ? damp(f.eyeY, targetEyeY, 20, dt) : targetEyeY;
      f.ready = true;
      const speed = guided ? 0 : (player.userData.speed ?? 0);
      const bob = Math.sin((player.userData.walkPhase ?? 0) * 2) * 0.016 * Math.min(1, speed / 6);
      pose.pos.set(subject.x, f.eyeY + bob, subject.z);
      pose.quat.setFromEuler(lookEuler.set(eyePitch, eyeYaw, 0));
      pose.fov = VIEW_FOV.first + f.fovOffset;
      pivotRef.current.copy(pose.pos);
    }

    if (tr.t < 1) {
      tr.t = Math.min(1, tr.t + dt / tr.duration);
      const eased = easeInOut(tr.t);
      camera.position.lerpVectors(tr.pos, pose.pos, eased);
      camera.quaternion.slerpQuaternions(tr.quat, pose.quat, eased);
      perspective.fov = tr.fov + (pose.fov - tr.fov) * eased;
      perspective.updateProjectionMatrix();
    } else {
      camera.position.copy(pose.pos);
      camera.quaternion.copy(pose.quat);
      const nextFov = damp(perspective.fov, pose.fov, 8, dt);
      if (Math.abs(nextFov - perspective.fov) > 0.004) {
        perspective.fov = nextFov;
        perspective.updateProjectionMatrix();
      }
    }
  });

  return null;
}

/**
 * Third-person games keep the player readable by cutting only the renderers
 * caught between the camera and the avatar. Collision and room geometry stay
 * untouched, and every renderer is restored before the next visibility test.
 */
function ThirdPersonInteriorCutaway({ viewMode, pivotRef }: { viewMode: ViewMode; pivotRef: React.RefObject<Vector3> }) {
  const { camera, gl, scene } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const direction = useMemo(() => new Vector3(), []);
  const eye = useMemo(() => new Vector3(), []);
  const hidden = useRef<Mesh[]>([]);

  const restore = useCallback(() => {
    for (const mesh of hidden.current) mesh.visible = true;
    hidden.current = [];
    gl.domElement.dataset.cameraCutawayCount = "0";
  }, [gl.domElement]);

  useEffect(() => restore, [restore]);

  useFrame(() => {
    restore();
    const pivot = pivotRef.current;
    if (viewMode !== "third" || !pivot) return;

    eye.copy(pivot);
    direction.copy(camera.position).sub(eye);
    const distance = direction.length();
    if (distance < 0.4) return;

    ray.set(eye, direction.multiplyScalar(1 / distance));
    ray.near = 0.18;
    ray.far = Math.max(0.18, distance - 0.3);
    const seen = new Set<Mesh>();
    for (const hit of ray.intersectObjects(scene.children, true)) {
      const mesh = hit.object as Mesh;
      let ancestor: Object3D | null = mesh;
      let isArchitecture = false;
      while (ancestor) {
        if (ancestor.userData.cameraOccluder) {
          isArchitecture = true;
          break;
        }
        ancestor = ancestor.parent;
      }
      if (!isArchitecture || seen.has(mesh)) continue;
      seen.add(mesh);
      mesh.visible = false;
      hidden.current.push(mesh);
    }
    gl.domElement.dataset.cameraCutawayCount = String(hidden.current.length);
  });

  return null;
}

function RuntimeHealthMonitor() {
  const { gl }=useThree();
  const frameSamples=useRef<number[]>([]);
  const sampleWindowStart=useRef(0);
  const longFrames=useRef(0);
  const lowestFps=useRef(Number.POSITIVE_INFINITY);

  useEffect(()=>{
    const canvas=gl.domElement;
    canvas.dataset.webglContext="active";
    canvas.dataset.webglContextLosses=canvas.dataset.webglContextLosses??"0";
    const onLost=()=>{
      canvas.dataset.webglContext="lost";
      canvas.dataset.webglContextLosses=String(Number(canvas.dataset.webglContextLosses??0)+1);
    };
    const onRestored=()=>{canvas.dataset.webglContext="restored";};
    canvas.addEventListener("webglcontextlost",onLost);
    canvas.addEventListener("webglcontextrestored",onRestored);
    return()=>{
      canvas.removeEventListener("webglcontextlost",onLost);
      canvas.removeEventListener("webglcontextrestored",onRestored);
    };
  },[gl.domElement]);

  useFrame((_,delta)=>{
    const now=performance.now();
    if(sampleWindowStart.current===0)sampleWindowStart.current=now;
    const frameMs=Math.min(1000,delta*1000);
    frameSamples.current.push(frameMs);
    if(frameSamples.current.length>240)frameSamples.current.shift();
    if(frameMs>50)longFrames.current+=1;
    if(now-sampleWindowStart.current<2000||frameSamples.current.length<2)return;
    const sorted=[...frameSamples.current].sort((a,b)=>a-b);
    const averageMs=sorted.reduce((sum,value)=>sum+value,0)/sorted.length;
    const fps=averageMs>0?1000/averageMs:0;
    const p95=sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))];
    lowestFps.current=Math.min(lowestFps.current,fps);
    const canvas=gl.domElement;
    canvas.dataset.rendererAverageFps=fps.toFixed(1);
    canvas.dataset.rendererLowestFps=lowestFps.current.toFixed(1);
    canvas.dataset.rendererP95FrameMs=p95.toFixed(1);
    canvas.dataset.rendererLongFrames=String(longFrames.current);
    canvas.dataset.rendererSampleCount=String(Number(canvas.dataset.rendererSampleCount??0)+sorted.length);
    canvas.dataset.rendererDrawCalls=String(gl.info.render.calls);
    canvas.dataset.rendererTriangles=String(gl.info.render.triangles);
    canvas.dataset.rendererHealth=fps>=24&&p95<=50?"healthy":"degraded";
    frameSamples.current=[];
    sampleWindowStart.current=now;
  });
  return null;
}

const TempleScene = memo(function TempleScene({ evidence, selected, inspectionFocus, onSelect, viewMode, serviceState, ceremonyStage, ceremonyTimeRef, ceremonyFollow, actionPulse, stoneVariant, columnVariant, goldVariant, signalVariant, solarHour, showWilderness, onAltarAction, onActionAvailability, onPlayerMove, onManualCameraInput }: { evidence: boolean; selected: FeatureId; inspectionFocus: FeatureId | null; onSelect: (feature: FeatureId) => void; viewMode: ViewMode; serviceState: ServiceState; ceremonyStage?: CeremonyStage; ceremonyTimeRef: React.MutableRefObject<number>; ceremonyFollow: boolean; actionPulse: number; stoneVariant: FacadeStoneVariant; columnVariant: FacadeColumnVariant; goldVariant: FacadeGoldVariant; signalVariant: WildernessSignalVariant; solarHour: number; showWilderness: boolean; onAltarAction: () => void; onActionAvailability: (available: boolean) => void; onPlayerMove: (position: MapPosition) => void; onManualCameraInput: () => void }) {
  const sceneRenderCount=useRef(0);
  sceneRenderCount.current+=1;
  const playerRef = useRef<Group>(null);
  const leadPoseRef = useRef<LeadPose>(createLeadPose());
  const hideLeadRef = useRef(false);
  const pivotRef = useRef(new Vector3());
  const guidedCamera = serviceState === "yomKippur" && ceremonyFollow;
  const facingRef = useRef<FacingControl>({ yaw: -0.68, pitch: -0.08 });
  const cameraGestureUntilRef = useRef(0);
  const ceremonyFocusRef = useRef(new Vector3(...CEREMONY_STAGE_POINTS.dawn));
  const ceremonyInside = ceremonyStage === "holyPlace" || ceremonyStage === "curtain" || ceremonyStage === "goldenAltar" || ceremonyStage === "holyOfHolies";
  const sunStudy = useMemo(() => sunStudyAt(solarHour), [solarHour]);
  const selectFeature = useCallback((feature: FeatureId) => {
    if (performance.now() <= cameraGestureUntilRef.current) return;
    onSelect(feature);
  }, [onSelect]);
  return (
    <Canvas data-scene-react-renders={sceneRenderCount.current} shadows="percentage" dpr={[1, 1.5]} camera={{ position: [38, 28, 54], fov: 43, near: 0.1, far: 4000 }} gl={{ antialias: true, powerPreference: "high-performance", toneMapping: ACESFilmicToneMapping, toneMappingExposure: 0.8 }}>
      <fogExp2 attach="fog" args={["#c9d3d2", 0.00085]} />
      <hemisphereLight args={["#eef3f5", "#b79c74", 0.2]} />
      <ambientLight intensity={0.18} color="#f5dfba" />
      <directionalLight position={sunStudy.position} intensity={sunStudy.intensity} color={sunStudy.color} castShadow shadow-mapSize={[4096, 4096]} shadow-bias={-0.00005} shadow-normalBias={0.035} shadow-radius={2.2} shadow-camera-near={12} shadow-camera-far={310} shadow-camera-left={-112} shadow-camera-right={112} shadow-camera-top={118} shadow-camera-bottom={-112} />
      <Suspense fallback={null}>
        <StableArchitectureShadows />
        <Sky distance={450000} sunPosition={sunStudy.position} turbidity={2.7} rayleigh={1.35} mieCoefficient={0.0035} mieDirectionalG={0.82} />
        <mesh position={sunStudy.visualPosition} renderOrder={-1}>
          <sphereGeometry args={[2.2,24,16]} />
          <meshBasicMaterial color="#fff4cf" toneMapped={false} fog={false} />
        </mesh>
        <mesh position={sunStudy.visualPosition} scale={2.8} renderOrder={-2}>
          <sphereGeometry args={[2.2,20,14]} />
          <meshBasicMaterial color="#ffd784" transparent opacity={0.11} depthWrite={false} toneMapped={false} fog={false} />
        </mesh>
        <Environment key={`sun-${solarHour}`} resolution={256} frames={1} environmentIntensity={0.58}><Sky distance={450000} sunPosition={sunStudy.position} turbidity={4.5} rayleigh={0.35} mieCoefficient={0.012} mieDirectionalG={0.88} /></Environment>
        <Landscape />
        <Vegetation />
        <TempleMountPlatform evidence={evidence} selected={selected === "mount"} onSelect={() => selectFeature("mount")} />
        <Courtyard evidence={evidence} selected={selected === "paving"} onSelect={() => selectFeature("paving")} />
        <AzarahPlan evidence={evidence} selected={selected === "paving" || selected === "chambers"} onSelect={() => selectFeature("chambers")} viewMode={viewMode} />
        <AzarahComplex evidence={evidence} selected={selected === "chambers"} onSelect={() => selectFeature("chambers")} />
        <CourtInteriors />
        <IsraelPriestsCourt evidence={evidence} selected={selected === "paving" || selected === "vessels"} onSelect={() => selectFeature("paving")} viewMode={viewMode} />
        <TempleFacade evidence={evidence} selected={selected === "facade"} onSelect={() => selectFeature("facade")} revealInterior={ceremonyInside} />
        <SanctuaryBuilding evidence={evidence} selected={selected === "facade"} onSelect={() => selectFeature("facade")} revealInterior={selected === "vessels" || ceremonyInside} />
        <TempleOrnament evidence={evidence} revealInterior={selected === "vessels" || ceremonyInside} playerRef={playerRef} stoneVariant={stoneVariant} columnVariant={columnVariant} goldVariant={goldVariant} />
        <TempleVessels selected={selected === "vessels"} onSelect={() => selectFeature("vessels")} viewMode={viewMode} serviceState={serviceState} />
        {serviceState === "yomKippur" && <FullYomKippurCeremony timeRef={ceremonyTimeRef} focusRef={ceremonyFocusRef} leadPoseRef={leadPoseRef} hideLeadRef={hideLeadRef} signalVariant={signalVariant} showWilderness={showWilderness} />}
        <Altar evidence={evidence} selected={selected === "altar"} onSelect={() => selectFeature("altar")} actionPulse={actionPulse} />
        <WomensCourt evidence={evidence} selected={selected === "womensCourt"} chambersSelected={selected === "chambers"} onSelect={() => selectFeature("womensCourt")} onSelectChambers={() => selectFeature("chambers")} viewMode={viewMode} serviceState={serviceState} />
        <PriestFigure selected={selected === "priest"} onSelect={() => selectFeature("priest")} onInteract={selectFeature} onAltarAction={onAltarAction} onActionAvailability={onActionAvailability} onPlayerMove={onPlayerMove} viewMode={viewMode} figureRef={playerRef} facingRef={facingRef} guided={guidedCamera} onTakeControl={onManualCameraInput} />
        <Colonnade /><CourtEnclosure />
      </Suspense>
      <CameraRig viewMode={viewMode} inspectionFocus={inspectionFocus} playerRef={playerRef} facingRef={facingRef} serviceState={serviceState} ceremonyFollow={ceremonyFollow} ceremonyFocusRef={ceremonyFocusRef} ceremonyTimeRef={ceremonyTimeRef} leadPoseRef={leadPoseRef} hideLeadRef={hideLeadRef} pivotRef={pivotRef} onManualInput={onManualCameraInput} cameraGestureUntilRef={cameraGestureUntilRef} />
      <ThirdPersonInteriorCutaway viewMode={viewMode} pivotRef={pivotRef} />
      <RuntimeHealthMonitor />
      <SceneAudit />
      <AmbientOcclusion />
    </Canvas>
  );
});

function RitualProgressBadge({ timeRef }: { timeRef: React.MutableRefObject<number> }) {
  const badgeRef = useRef<HTMLElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const spokenRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;
    let lastValue = "";
    const update = () => {
      const current = getCeremonyBeat(timeRef.current);
      const counter = getRitualCounter(current.beat, current.progress);
      const immersion = getImmersionPhase(current.beat, current.progress);
      const value = counter ? `${current.beat.id}:count:${counter.current}` : immersion ? `${current.beat.id}:phase:${immersion.title}:${immersion.sanctification??0}` : "";
      if (value !== lastValue) {
        lastValue = value;
        if (badgeRef.current) badgeRef.current.hidden = !counter&&!immersion;
        if (phaseRef.current && spokenRef.current && progressRef.current) {
          if(counter){
            phaseRef.current.textContent = counter.phase;
            spokenRef.current.textContent = counter.spokenHebrew;
            progressRef.current.textContent = `${counter.current} / ${counter.total}`;
            progressRef.current.style.direction="ltr";
          } else if(immersion){
            phaseRef.current.textContent = immersion.immersion ? `טבילה ${immersion.immersion} מתוך 5` : "עשרה קידושין";
            spokenRef.current.textContent = immersion.title;
            progressRef.current.textContent = immersion.detail;
            progressRef.current.style.direction="rtl";
          }
        }
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [timeRef]);

  return <aside ref={badgeRef} className="ritual-count-badge" aria-live="polite" aria-atomic="true" dir="rtl" lang="he" hidden>
    <span ref={phaseRef} />
    <strong ref={spokenRef} />
    <small ref={progressRef} />
  </aside>;
}

function ConcurrentRouteBadge({ beat }: { beat: (typeof YOM_KIPPUR_SERVICE)[number] }) {
  const state = getConcurrentRouteState(beat);
  if (!state) return null;
  return <aside className="parallel-event-badge" aria-label="פעולות מקבילות" dir="rtl" lang="he" data-concurrent-beat={beat.id}>
    <header><strong>{state.title}</strong><small>{state.source}</small></header>
    <div className="parallel-track-list">
      {state.tracks.map((track) => <div key={track.id} className={`parallel-track ${track.status === "מתרחש עכשיו" ? "active" : track.status === "הושלם" ? "complete" : "waiting"}`} data-track={track.id} data-status={track.status}>
        <span className="parallel-track-line" aria-hidden="true" />
        <div><strong>{track.label}</strong><p>{track.detail}</p><small>{track.status}</small></div>
      </div>)}
    </div>
  </aside>;
}

function ChapterEightLessonCard({ lesson }: { lesson: ChapterEightLesson }) {
  const [answer,setAnswer]=useState<number|null>(null);
  const correct=answer===lesson.correctAnswer;
  return <aside className="chapter-eight-card" dir="rtl" lang="he" aria-label="הסבר ובדיקת הבנה לפרק ח">
    <header><span>לומדים משנה {lesson.mishnahId.replace("8.","ח׳:")}</span><strong>במילים פשוטות</strong></header>
    <p>{lesson.plainHebrew}</p>
    <details><summary>English explanation</summary><p dir="ltr" lang="en">{lesson.englishExplanation}</p></details>
    <fieldset>
      <legend>{lesson.questionHebrew}</legend>
      <div className="lesson-answers">{lesson.answersHebrew.map((option,index)=><button key={option} type="button" className={answer===index?(correct?"correct":"incorrect"):""} onClick={()=>setAnswer(index)} aria-pressed={answer===index}>{option}</button>)}</div>
    </fieldset>
    {answer!==null&&<div className={`lesson-feedback ${correct?"correct":"incorrect"}`} role="status">{correct?lesson.feedbackHebrew:"כמעט. נסו שוב וקראו את ההסבר הפשוט."}</div>}
  </aside>;
}

const GLOSSARY_CATEGORY_LABELS: Record<TempleGlossaryCategory,string> = {
  place:"מקומות",
  vessel:"כלים",
  garment:"בגדים",
  service:"עבודה",
  idea:"רעיונות",
};

function TempleGlossaryDialog() {
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState("");
  const normalizeSearch=(value:string)=>value.normalize("NFD").replace(/[\u0591-\u05c7]/g,"").toLocaleLowerCase("he").trim();
  const normalized=normalizeSearch(query);
  const results=useMemo(()=>TEMPLE_GLOSSARY.filter((entry)=>!normalized||[
    entry.hebrew,entry.transliteration,entry.plainHebrew,entry.english,entry.source,
  ].some((value)=>normalizeSearch(value).includes(normalized))),[normalized]);
  return <Dialog open={open} onOpenChange={(nextOpen)=>{setOpen(nextOpen);if(!nextOpen)setQuery("");}}>
    <DialogTrigger asChild><button type="button" aria-label="פתח מילון מונחים" title="מילון מונחים"><BookOpen aria-hidden="true" /></button></DialogTrigger>
    <DialogContent className="temple-glossary-dialog" dir="rtl" lang="he" showCloseButton={false}>
      <DialogHeader>
        <div className="glossary-heading"><DialogTitle>מילון המקדש</DialogTitle><button type="button" className="glossary-close" onClick={()=>setOpen(false)}>סגירה</button></div>
        <DialogDescription>מונחים קצרים בעברית ובאנגלית. ההגדרות הן עזר לימודי וממתינות לביקורת מומחים.</DialogDescription>
      </DialogHeader>
      <label className="glossary-search"><Search aria-hidden="true" /><span className="sr-only">חיפוש במילון</span><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="חיפוש מונח…" /></label>
      <p className="glossary-result-count" role="status">{results.length} מונחים</p>
      <div className="glossary-list" tabIndex={0} aria-label="תוצאות מילון">
        {results.map((entry)=><article key={entry.id} className="glossary-entry">
          <header><div><strong>{entry.hebrew}</strong><span dir="ltr" lang="en">{entry.transliteration}</span></div><small>{GLOSSARY_CATEGORY_LABELS[entry.category]}</small></header>
          <p>{entry.plainHebrew}</p>
          <p dir="ltr" lang="en">{entry.english}</p>
          <footer>{entry.source}</footer>
        </article>)}
        {results.length===0&&<p className="glossary-empty">לא נמצאו מונחים. נסו חיפוש אחר.</p>}
      </div>
    </DialogContent>
  </Dialog>;
}

function controlHint(viewMode: ViewMode, guided: boolean) {
  if (guided) {
    return viewMode === "overview"
      ? "Auto camera · drag or scroll once to take stable manual control"
      : viewMode === "third"
        ? "Following the priest · drag to swing the camera · scroll to zoom · press WASD to step in"
        : "Seeing through the priest's eyes · drag to look around · scroll to zoom · press WASD to step in";
  }
  return viewMode === "overview"
    ? "Drag: orbit · Shift/right-drag: pan · wheel: smooth zoom · R/double-click: home"
    : "Click to capture the mouse · WASD walk · Shift sprint · scroll zoom · Space interacts · Esc releases";
}

export default function TempleExperience() {
  const [selected, setSelected] = useState<FeatureId>("altar");
  const [inspectionFocus, setInspectionFocus] = useState<FeatureId | null>(null);
  const [evidence, setEvidence] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [serviceState, setServiceState] = useState<ServiceState>("yomKippur");
  const [stoneVariant,setStoneVariant]=useState<FacadeStoneVariant>("sunlit-marble");
  const [solarHour,setSolarHour]=useState(8);
  const [columnVariant,setColumnVariant]=useState<FacadeColumnVariant>("video-columns");
  const [goldVariant,setGoldVariant]=useState<FacadeGoldVariant>("video-trim");
  const [signalVariant,setSignalVariant]=useState<WildernessSignalVariant>("scarlet");
  const ceremonyTimeRef = useRef(0);
  const ceremonyAccumulatorRef = useRef(0);
  const ceremonyTimelineRef = useRef<HTMLInputElement>(null);
  const renderedCeremonyBeatRef = useRef(0);
  const [ceremonyTime, setCeremonyTimeState] = useState(0);
  const [ceremonyPlaying, setCeremonyPlaying] = useState(false);
  const [ceremonySpeed, setCeremonySpeed] = useState(1);
  const [ceremonyFollow, setCeremonyFollow] = useState(true);
  const [mishnahIndex, setMishnahIndex] = useState(() => MISHNAH_YOMA_COVERAGE.findIndex((unit) => unit.id === "3.1"));
  const [readerFollowing, setReaderFollowing] = useState(true);
  const [narrating, setNarrating] = useState(false);
  const [overlaysHidden,setOverlaysHidden]=useState(false);
  const [mishnahMinimized,setMishnahMinimized]=useState(false);
  const [mishnahPosition,setMishnahPosition]=useState<{left:number;top:number}|null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mishnahPanelRef=useRef<HTMLElement|null>(null);
  const mishnahDragRef=useRef<{pointerId:number;startX:number;startY:number;left:number;top:number}|null>(null);
  const mapPlayerRef = useRef<HTMLSpanElement>(null);
  const [actionAvailable, setActionAvailable] = useState(false);
  const [actionPulse, setActionPulse] = useState(0);
  const [actionMessage, setActionMessage] = useState("");
  const [currentLocation,setCurrentLocation]=useState("Court of Israel · Ezrat Yisrael");
  const [wildernessInspection,setWildernessInspection]=useState(false);
  const feature = FEATURES[selected];
  const ceremony = getCeremonyBeat(ceremonyTime);
  const chapterEightLesson = CHAPTER_EIGHT_BY_BEAT.get(ceremony.beat.id);
  const mishnahUnit = MISHNAH_YOMA_COVERAGE[Math.max(0, mishnahIndex)];
  const mishnahTreatmentLabel = mishnahUnit.prototypeBeatIds.length > 0
    ? "המחשה פעילה · אבטיפוס"
    : mishnahUnit.coverageMode === "teaching-interlude"
      ? "יחידת לימוד · בפיתוח"
      : "המחשה מתוכננת · טרם נבנתה";
  const setCeremonyTime = useCallback((time: number) => {
    const next = Math.max(0, Math.min(YOM_KIPPUR_SERVICE_DURATION, time));
    ceremonyTimeRef.current = next;
    ceremonyAccumulatorRef.current = 0;
    renderedCeremonyBeatRef.current = getCeremonyBeat(next).index;
    setCeremonyTimeState(next);
  }, []);
  const changeService = useCallback((service: ServiceState) => {
    setServiceState(service);
    if (service === "yomKippur") {
      if (ceremonyTimeRef.current >= YOM_KIPPUR_SERVICE_DURATION) setCeremonyTime(0);
      setInspectionFocus(null);
      setCeremonyFollow(true);
      setCeremonyPlaying(true);
    } else {
      setCeremonyPlaying(false);
    }
  }, [setCeremonyTime]);
  const moveCeremonyBeat = useCallback((direction: -1 | 1) => {
    const current = getCeremonyBeat(ceremonyTimeRef.current);
    const nextIndex = Math.max(0, Math.min(YOM_KIPPUR_SERVICE.length - 1, current.index + direction));
    setReaderFollowing(true);
    setInspectionFocus(null);
    setCeremonyTime(ceremonyPreviewTime(nextIndex));
  }, [setCeremonyTime]);
  const openMishnah = useCallback((index: number) => {
    const nextIndex = Math.max(0, Math.min(MISHNAH_YOMA_COVERAGE.length - 1, index));
    const unit = MISHNAH_YOMA_COVERAGE[nextIndex];
    setMishnahIndex(nextIndex);
    setReaderFollowing(false);
    setCeremonyPlaying(false);
    setInspectionFocus(null);
    const beatIndex = YOM_KIPPUR_SERVICE.findIndex((beat) => mishnahIdFromUrl(beat.sourceUrl) === unit.id);
    if (beatIndex >= 0) setCeremonyTime(ceremonyPreviewTime(beatIndex));
  }, [setCeremonyTime]);
  const chooseViewMode = useCallback((mode: ViewMode) => {
    // Switching camera type keeps the current control (auto or manual); the rig blends between them.
    setInspectionFocus(null);
    setViewMode(mode);
  }, []);
  const handleAltarAction = useCallback(() => {
    setActionPulse((pulse) => pulse + 1);
    setActionMessage("Altar fire tended · interaction demonstration");
  }, []);
  const handlePlayerMove = useCallback((position: MapPosition) => {
    setInspectionFocus(null);
    setCurrentLocation(templeLocationAt(position));
    const marker = mapPlayerRef.current;
    if (!marker) return;
    marker.style.left = `${Math.max(3, Math.min(97, ((position.z + 76) / 136) * 100))}%`;
    marker.style.top = `${Math.max(3, Math.min(97, (1 - (position.x + 30) / 60) * 100))}%`;
  }, []);
  const handleManualCameraInput = useCallback(() => {
    setCeremonyFollow(false);
    setInspectionFocus(null);
  }, []);
  const handleSelectFeature = useCallback((feature: FeatureId) => {
    setSelected(feature);
    if (viewMode !== "overview") return;
    setCeremonyFollow(false);
    setInspectionFocus(feature);
  }, [viewMode]);
  const focusOverview = useCallback((preset: keyof typeof OVERVIEW_PRESETS) => {
    setViewMode("overview");
    setCeremonyFollow(false);
    setInspectionFocus(null);
    setWildernessInspection(preset==="wilderness");
    if(preset==="sideCells"||preset==="vessels")setSelected("vessels");
    else if(preset==="facade"||preset==="sanctuary")setSelected("facade");
    setCurrentLocation(OVERVIEW_LABELS[preset]);
    const shot = OVERVIEW_PRESETS[preset];
    window.dispatchEvent(new CustomEvent("temple-camera-command", { detail: shot }));
  }, []);

  const beginMishnahDrag=useCallback((event:React.PointerEvent<HTMLElement>)=>{
    if((event.target as HTMLElement).closest("button,a"))return;
    const panel=mishnahPanelRef.current;
    if(!panel)return;
    const rect=panel.getBoundingClientRect();
    mishnahDragRef.current={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,left:rect.left,top:rect.top};
    event.currentTarget.setPointerCapture(event.pointerId);
  },[]);
  const moveMishnahPanel=useCallback((event:React.PointerEvent<HTMLElement>)=>{
    const drag=mishnahDragRef.current;
    if(!drag||drag.pointerId!==event.pointerId)return;
    const panel=mishnahPanelRef.current;
    const width=panel?.offsetWidth??320;
    const height=panel?.offsetHeight??64;
    const left=Math.max(0,Math.min(window.innerWidth-Math.min(120,width),drag.left+event.clientX-drag.startX));
    const top=Math.max(0,Math.min(window.innerHeight-Math.min(48,height),drag.top+event.clientY-drag.startY));
    setMishnahPosition({left,top});
  },[]);
  const endMishnahDrag=useCallback((event:React.PointerEvent<HTMLElement>)=>{
    if(mishnahDragRef.current?.pointerId!==event.pointerId)return;
    mishnahDragRef.current=null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  },[]);

  const toggleNarration = useCallback(() => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    window.speechSynthesis.cancel();
    if (narrating) {
      speechRef.current=null;
      setNarrating(false);
      return;
    }
    const text=`${mishnahUnit.hebrew}. במילים פשוטות: ${mishnahUnit.plainHebrew}`;
    const utterance=new SpeechSynthesisUtterance(text);
    const hebrewVoice=window.speechSynthesis.getVoices().find((voice)=>voice.lang.toLowerCase().startsWith("he"));
    utterance.lang="he-IL";
    utterance.rate=.86;
    if(hebrewVoice)utterance.voice=hebrewVoice;
    utterance.onend=()=>{speechRef.current=null;setNarrating(false);};
    utterance.onerror=()=>{speechRef.current=null;setNarrating(false);};
    speechRef.current=utterance;
    setCeremonyPlaying(false);
    setNarrating(true);
    window.speechSynthesis.speak(utterance);
  },[mishnahUnit.hebrew,mishnahUnit.plainHebrew,narrating]);

  useEffect(() => {
    if (!actionMessage) return;
    const timeout = window.setTimeout(() => setActionMessage(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [actionMessage]);

  useEffect(() => {
    if (!readerFollowing) return;
    const unitId = mishnahIdFromUrl(ceremony.beat.sourceUrl);
    const index = MISHNAH_YOMA_COVERAGE.findIndex((unit) => unit.id === unitId);
    if (index >= 0) setMishnahIndex(index);
  }, [ceremony.index, ceremony.beat.sourceUrl, readerFollowing]);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    speechRef.current=null;
    setNarrating(false);
  },[mishnahUnit.id,serviceState]);

  useEffect(()=>()=>window.speechSynthesis?.cancel(),[]);

  useEffect(() => {
    if (serviceState !== "yomKippur" || !ceremonyPlaying) return;
    let frame = 0;
    let last = performance.now();
    let lastTimelineUpdate = last;
    const fixedStep = 1 / 30;
    const tick = (now: number) => {
      const delta = Math.min(0.2, Math.max(0, (now - last) / 1000)) * ceremonySpeed;
      last = now;
      ceremonyAccumulatorRef.current += delta;
      while (ceremonyAccumulatorRef.current >= fixedStep) {
        ceremonyTimeRef.current = Math.min(YOM_KIPPUR_SERVICE_DURATION, ceremonyTimeRef.current + fixedStep);
        ceremonyAccumulatorRef.current -= fixedStep;
      }
      // The Three.js ceremony reads time directly from the ref every frame.
      // Update the range control imperatively and rerender React only when the
      // Mishnah/ritual beat changes; rebuilding the UI continuously starves WebGL.
      if (now - lastTimelineUpdate > 100 && ceremonyTimelineRef.current) {
        lastTimelineUpdate = now;
        ceremonyTimelineRef.current.value = String(ceremonyTimeRef.current);
      }
      const renderedBeat = getCeremonyBeat(ceremonyTimeRef.current).index;
      if (renderedBeat !== renderedCeremonyBeatRef.current || ceremonyTimeRef.current >= YOM_KIPPUR_SERVICE_DURATION) {
        renderedCeremonyBeatRef.current = renderedBeat;
        setCeremonyTimeState(ceremonyTimeRef.current);
      }
      if (ceremonyTimeRef.current >= YOM_KIPPUR_SERVICE_DURATION) {
        setCeremonyPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ceremonyPlaying, ceremonySpeed, serviceState]);

  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: WebMcpContext }).modelContext;
    if (!modelContext?.registerTool) return;

    const lifecycle = new AbortController();
    const reportRegistrationError = (error: unknown) => console.warn("WebMCP registration failed", error);

    void Promise.resolve(modelContext.registerTool({
      name: "select_temple_structure",
      title: "Select a Temple structure",
      description: "Select the altar, Temple facade, or courtyard paving and show its evidence note.",
      inputSchema: {
        type: "object",
        properties: { structure: { type: "string", enum: ["altar", "facade", "vessels", "paving", "womensCourt", "chambers", "mount", "priest"] } },
        required: ["structure"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const structure = (input as { structure?: unknown })?.structure;
        if (structure !== "altar" && structure !== "facade" && structure !== "vessels" && structure !== "paving" && structure !== "womensCourt" && structure !== "chambers" && structure !== "mount" && structure !== "priest") {
          throw new Error("structure must name a visible Temple feature");
        }
        handleSelectFeature(structure);
        return { selectedStructure: structure };
      },
    }, { signal: lifecycle.signal })).catch(reportRegistrationError);

    void Promise.resolve(modelContext.registerTool({
      name: "set_evidence_overlay",
      title: "Set evidence overlay",
      description: "Turn the color-coded evidence overlay on or off in the visible 3D study.",
      inputSchema: {
        type: "object",
        properties: { enabled: { type: "boolean" } },
        required: ["enabled"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const enabled = (input as { enabled?: unknown })?.enabled;
        if (typeof enabled !== "boolean") throw new Error("enabled must be a boolean");
        setEvidence(enabled);
        return { evidenceOverlay: enabled };
      },
    }, { signal: lifecycle.signal })).catch(reportRegistrationError);

    void Promise.resolve(modelContext.registerTool({
      name: "set_temple_view_mode",
      title: "Set Temple view mode",
      description: "Switch the visible 3D study between overview, third-person, and first-person navigation.",
      inputSchema: {
        type: "object",
        properties: { mode: { type: "string", enum: ["overview", "third", "first"] } },
        required: ["mode"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const mode = (input as { mode?: unknown })?.mode;
        if (mode !== "overview" && mode !== "third" && mode !== "first") throw new Error("mode must be overview, third, or first");
        setViewMode(mode);
        return { viewMode: mode };
      },
    }, { signal: lifecycle.signal })).catch(reportRegistrationError);

    void Promise.resolve(modelContext.registerTool({
      name: "set_service_state",
      title: "Set Temple service state",
      description: "Show the study plan or a sourced route for the morning Tamid, afternoon Tamid, Shabbat showbread, or Yom Kippur.",
      inputSchema: {
        type: "object",
        properties: { service: { type: "string", enum: ["study", "morning", "afternoon", "shabbat", "yomKippur"] } },
        required: ["service"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const service = (input as { service?: unknown })?.service;
        if (service !== "study" && service !== "morning" && service !== "afternoon" && service !== "shabbat" && service !== "yomKippur") throw new Error("service must name an available service state");
        changeService(service);
        return { serviceState: service };
      },
    }, { signal: lifecycle.signal })).catch(reportRegistrationError);

    return () => lifecycle.abort();
  }, [changeService, handleSelectFeature]);

  return (
    <main className={`experience-shell ${serviceState === "yomKippur" ? "yom-kippur-active" : ""} ${overlaysHidden ? "overlays-hidden" : ""}`}>
      <section className="scene" aria-label="Interactive Second Temple courtyard reconstruction"><TempleScene evidence={evidence} selected={selected} inspectionFocus={inspectionFocus} onSelect={handleSelectFeature} viewMode={viewMode} serviceState={serviceState} ceremonyStage={serviceState === "yomKippur" ? ceremony.beat.stage : undefined} ceremonyTimeRef={ceremonyTimeRef} ceremonyFollow={ceremonyFollow} actionPulse={actionPulse} stoneVariant={stoneVariant} columnVariant={columnVariant} goldVariant={goldVariant} signalVariant={signalVariant} solarHour={solarHour} showWilderness={wildernessInspection} onAltarAction={handleAltarAction} onActionAvailability={setActionAvailable} onPlayerMove={handlePlayerMove} onManualCameraInput={handleManualCameraInput} /></section>
      <button type="button" className="overlay-visibility-toggle" onClick={()=>setOverlaysHidden((hidden)=>!hidden)} aria-pressed={overlaysHidden} aria-label={overlaysHidden?"הצג את לוחות המידע":"הסתר את כל לוחות המידע"} title={overlaysHidden?"Show overlays":"Hide overlays"}>{overlaysHidden?<Eye aria-hidden="true"/>:<EyeOff aria-hidden="true"/>}<span>{overlaysHidden?"Show panels":"Clear view"}</span></button>
      <header className="topbar">
        <div className="brand-mark"><Compass aria-hidden="true" /></div>
        <div><p className="eyebrow">Jerusalem · c. 30–60 CE</p><h1>Second Temple study</h1></div>
        <span className="prototype-tag">Prototype 01</span>
      </header>
      <nav className="view-modes" aria-label="Camera view">
        <button type="button" aria-pressed={viewMode === "overview"} className={viewMode === "overview" ? "active" : ""} onClick={() => chooseViewMode("overview")}><Map aria-hidden="true" /><span>Overview</span></button>
        <button type="button" aria-pressed={viewMode === "third"} className={viewMode === "third" ? "active" : ""} onClick={() => chooseViewMode("third")}><PersonStanding aria-hidden="true" /><span>Third person</span></button>
        <button type="button" aria-pressed={viewMode === "first"} className={viewMode === "first" ? "active" : ""} onClick={() => chooseViewMode("first")}><Eye aria-hidden="true" /><span>First person</span></button>
        {serviceState === "yomKippur" && <button type="button" aria-pressed={ceremonyFollow} className={ceremonyFollow ? "active" : ""} onClick={() => setCeremonyFollow((follow) => !follow)} title={ceremonyFollow ? "Guided camera follows the service. Click to take manual control." : "Manual control. Click to let the camera follow the service."}><Video aria-hidden="true" /><span>{ceremonyFollow ? "Auto camera" : "Manual"}</span></button>}
      </nav>
      <div className="service-control">
        <label htmlFor="service-state">Service state</label>
        <select id="service-state" value={serviceState} onChange={(event) => changeService(event.target.value as ServiceState)}>
          <option value="study">Study view</option>
          <option value="morning">Morning Tamid</option>
          <option value="afternoon">Afternoon Tamid</option>
          <option value="shabbat">Shabbat showbread</option>
          <option value="yomKippur">Yom Kippur</option>
        </select>
      </div>
      <div className="location-badge" role="status" aria-live="polite"><Compass aria-hidden="true" /><span>Current area</span><strong>{currentLocation}</strong></div>
      <details className="interpretation-control">
        <summary>Research variants</summary>
        <label htmlFor="solar-hour">Sun study time</label>
        <div className="sun-time-control">
          <input id="solar-hour" type="range" min="6" max="18" step="0.25" value={solarHour} onChange={(event)=>setSolarHour(Number(event.target.value))} />
          <output htmlFor="solar-hour">{`${String(Math.floor(solarHour)).padStart(2,"0")}:${String(Math.round((solarHour%1)*60)).padStart(2,"0")}`}</output>
        </div>
        <p>Illustrative Jerusalem daylight study: move the sun to inspect how raking light changes the projecting marble courses. It does not claim a recoverable exact ancient date or angle.</p>
        <label htmlFor="facade-stone-variant">Facade stone reading</label>
        <select id="facade-stone-variant" value={stoneVariant} onChange={(event)=>setStoneVariant(event.target.value as FacadeStoneVariant)}>
          {(Object.entries(FACADE_STONE_VARIANTS) as [FacadeStoneVariant,{label:string;note:string}][]).map(([value,variant])=><option key={value} value={value}>{variant.label}</option>)}
        </select>
        <p>{FACADE_STONE_VARIANTS[stoneVariant].note} <a href="https://www.sefaria.org/Bava_Batra.4a?with=all" target="_blank" rel="noreferrer">Source</a></p>
        <label htmlFor="facade-column-variant">Exterior porch columns</label>
        <select id="facade-column-variant" value={columnVariant} onChange={(event)=>setColumnVariant(event.target.value as FacadeColumnVariant)}>
          {(Object.entries(FACADE_COLUMN_VARIANTS) as [FacadeColumnVariant,{label:string;note:string}][]).map(([value,variant])=><option key={value} value={value}>{variant.label}</option>)}
        </select>
        <p>{FACADE_COLUMN_VARIANTS[columnVariant].note}</p>
        <label htmlFor="facade-gold-variant">Facade gold reading</label>
        <select id="facade-gold-variant" value={goldVariant} onChange={(event)=>setGoldVariant(event.target.value as FacadeGoldVariant)}>
          {(Object.entries(FACADE_GOLD_VARIANTS) as [FacadeGoldVariant,{label:string;note:string}][]).map(([value,variant])=><option key={value} value={value}>{variant.label}</option>)}
        </select>
        <p>{FACADE_GOLD_VARIANTS[goldVariant].note}</p>
        {serviceState==="yomKippur"&&<>
          <label htmlFor="wilderness-signal-variant">Yoma 6:8 notification</label>
          <select id="wilderness-signal-variant" value={signalVariant} onChange={(event)=>setSignalVariant(event.target.value as WildernessSignalVariant)}>
            {(Object.entries(WILDERNESS_SIGNAL_VARIANTS) as [WildernessSignalVariant,{label:string;note:string}][]).map(([value,variant])=><option key={value} value={value}>{variant.label}</option>)}
          </select>
          <p>{WILDERNESS_SIGNAL_VARIANTS[signalVariant].note} <a href="https://www.sefaria.org/Mishnah_Yoma.6.8?lang=bi" target="_blank" rel="noreferrer">Source</a></p>
        </>}
      </details>
      {viewMode === "overview" && <nav className="overview-tools" aria-label="Overview locations">
        <span>Go to</span>
        <button type="button" onClick={() => focusOverview("home")} title="Show the whole Temple Mount"><RotateCcw aria-hidden="true" />Whole site</button>
        <button type="button" onClick={() => focusOverview("womensCourt")}>Women&apos;s Court</button>
        <button type="button" onClick={() => focusOverview("nicanor")}>Nicanor &amp; steps</button>
        <button type="button" onClick={() => focusOverview("azarah")}>Mizbeach · Kiyor · tables</button>
        <button type="button" onClick={() => focusOverview("facade")}>Ulam facade</button>
        <button type="button" onClick={() => focusOverview("sanctuary")}>Sanctuary</button>
        <button type="button" onClick={() => focusOverview("sideCells")}>Kodesh cutaway · 38 cells</button>
        <button type="button" onClick={() => focusOverview("hearth")}>Chambers &amp; Hearth</button>
        <button type="button" onClick={() => focusOverview("vessels")}>Vessels &amp; tables</button>
        {serviceState === "yomKippur" && <button type="button" onClick={() => focusOverview("wilderness")}>Goat route</button>}
      </nav>}
      {serviceState !== "yomKippur" && <aside className="evidence-panel" aria-live="polite">
        <div className="panel-heading"><div className="feature-icon"><Info aria-hidden="true" /></div><div><p className="eyebrow">Selected structure</p><h2>{feature.name}</h2></div></div>
        <p className="feature-detail">{feature.detail}</p>
        <dl className="source-list"><div><dt>Source</dt><dd>{feature.source}</dd></div><div><dt>Confidence</dt><dd>{feature.grade}</dd></div></dl>
        <div className="evidence-toggle"><div><span><Layers3 aria-hidden="true" /> Evidence overlay</span><small>Blue: comparative · gold: textual · amber: reconstructed</small></div><Switch checked={evidence} onCheckedChange={setEvidence} aria-label="Toggle evidence overlay" /></div>
      </aside>}
      {serviceState !== "yomKippur" && <aside className="mini-map" aria-label="Courtyard minimap">
        <span className="map-north">N</span>
        <span className="map-temple">Temple</span>
        <span className="map-altar">Altar</span>
        <span className="map-ramp" />
        <span className="map-womens">Women&apos;s Court</span>
        <span ref={mapPlayerRef} className="map-player" style={{ left: "55.1%", top: "50%" }} />
      </aside>}
      {actionAvailable && <div className="action-prompt"><kbd>Space</kbd><span>Tend the altar fire</span></div>}
      {actionMessage && <div className="action-message" role="status">{actionMessage}</div>}
      <div className={serviceState === "yomKippur" ? "controls-hint floating" : "controls-hint"}><MousePointer2 aria-hidden="true" /><span>{controlHint(viewMode, serviceState === "yomKippur" && ceremonyFollow)}</span></div>
      {serviceState === "yomKippur" && <>
        <RitualProgressBadge timeRef={ceremonyTimeRef} />
        <ConcurrentRouteBadge beat={ceremony.beat} />
        {chapterEightLesson&&<ChapterEightLessonCard key={chapterEightLesson.beatId} lesson={chapterEightLesson} />}
        <section ref={mishnahPanelRef} className={`mishnah-overlay ${mishnahMinimized?"minimized":""}`} style={mishnahPosition?{left:mishnahPosition.left,top:mishnahPosition.top,bottom:"auto"}:undefined} aria-label="משנה יומא המלאה" dir="rtl" lang="he">
          <header onPointerDown={beginMishnahDrag} onPointerMove={moveMishnahPanel} onPointerUp={endMishnahDrag} onPointerCancel={endMishnahDrag}>
            <GripHorizontal className="mishnah-drag-handle" aria-hidden="true" />
            <div>
              <span>משנה יומא · פרק {MISHNAH_YOMA_CHAPTER_TITLES[mishnahUnit.chapter - 1]}</span>
              <strong>{mishnahUnit.heRef}</strong>
            </div>
            <div className="mishnah-header-actions">
              <button type="button" className={narrating?"active":""} onClick={toggleNarration} aria-pressed={narrating} title={narrating?"הפסק הקראה":"הקראה בעברית"}>{narrating?<VolumeX aria-hidden="true"/>:<Volume2 aria-hidden="true"/>}<span>{narrating?"עצור":"הקראה"}</span></button>
              <span className="mishnah-count">{mishnahIndex + 1} / {MISHNAH_YOMA_COVERAGE.length}</span>
              <button type="button" onClick={()=>setMishnahMinimized((minimized)=>!minimized)} aria-label={mishnahMinimized?"הרחב את חלון המשנה":"מזער את חלון המשנה"} title={mishnahMinimized?"הרחב":"מזער"}><Minimize2 aria-hidden="true" /></button>
            </div>
          </header>
          <blockquote>{mishnahUnit.hebrew}</blockquote>
          <details key={mishnahUnit.id} className="mishnah-explanation">
            <summary>במילים פשוטות</summary>
            <p>{mishnahUnit.plainHebrew}</p>
            <details className="mishnah-english">
              <summary>English explanation</summary>
              <p dir="ltr" lang="en">{mishnahUnit.englishExplanation}</p>
            </details>
          </details>
          <div className="mishnah-unit-controls">
            <button type="button" onClick={() => openMishnah(mishnahIndex - 1)} disabled={mishnahIndex === 0}>המשנה הקודמת</button>
            <button type="button" className={readerFollowing ? "active" : ""} onClick={() => {
              setReaderFollowing(true);
              const unitId = mishnahIdFromUrl(ceremony.beat.sourceUrl);
              const index = MISHNAH_YOMA_COVERAGE.findIndex((unit) => unit.id === unitId);
              if (index >= 0) setMishnahIndex(index);
            }}>{readerFollowing ? "עוקב אחר ההמחשה" : "חזור להמחשה"}</button>
            <button type="button" onClick={() => openMishnah(mishnahIndex + 1)} disabled={mishnahIndex === MISHNAH_YOMA_COVERAGE.length - 1}>המשנה הבאה</button>
          </div>
          <nav className="mishnah-chapters" aria-label="פרקי מסכת יומא">
            {MISHNAH_YOMA_CHAPTER_TITLES.map((title, chapterIndex) => {
              const chapter = chapterIndex + 1;
              const firstIndex = MISHNAH_YOMA_COVERAGE.findIndex((unit) => unit.chapter === chapter);
              return <button key={title} type="button" aria-current={mishnahUnit.chapter === chapter ? "page" : undefined} className={mishnahUnit.chapter === chapter ? "active" : ""} onClick={() => openMishnah(firstIndex)} title={title}>{chapter}</button>;
            })}
          </nav>
          <footer>
            <a href={mishnahUnit.sourceUrl} target="_blank" rel="noreferrer"><BookOpen aria-hidden="true" />למשנה בספריא</a>
            <span className={`mishnah-treatment ${mishnahUnit.prototypeBeatIds.length > 0 ? "prototype" : "planned"}`}>{mishnahTreatmentLabel}</span>
            <span>{MISHNAH_YOMA_SOURCE.versionTitle} · {MISHNAH_YOMA_SOURCE.license}</span>
          </footer>
        </section>
        <div className="ceremony-control-strip" aria-label="בקרת המחשת עבודת יום הכיפורים">
          <button type="button" onClick={() => { setCeremonyPlaying(false); setReaderFollowing(true); setCeremonyFollow(true); setCeremonyTime(0); }} aria-label="התחלה מחדש"><RotateCcw aria-hidden="true" /></button>
          <button type="button" onClick={() => moveCeremonyBeat(-1)} aria-label="הפעולה הקודמת"><SkipBack aria-hidden="true" /></button>
          <button type="button" className="ceremony-play" onClick={() => {
            if (ceremonyTimeRef.current >= YOM_KIPPUR_SERVICE_DURATION) setCeremonyTime(0);
            setReaderFollowing(true);
            setCeremonyPlaying((playing) => !playing);
          }} aria-label={ceremonyPlaying ? "השהה" : "נגן"}>{ceremonyPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}</button>
          <button type="button" onClick={() => moveCeremonyBeat(1)} aria-label="הפעולה הבאה"><SkipForward aria-hidden="true" /></button>
          <button type="button" className={ceremonyFollow ? "active" : ""} onClick={() => setCeremonyFollow((follow) => !follow)} aria-pressed={ceremonyFollow} aria-label="עקוב במצלמה"><Eye aria-hidden="true" /></button>
          <button type="button" className={narrating ? "active" : ""} onClick={toggleNarration} aria-pressed={narrating} aria-label={narrating ? "הפסק הקראת המשנה" : "הקרא את המשנה"} title={narrating ? "הפסק הקראה" : "הקרא את המשנה"}>{narrating ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}</button>
          <TempleGlossaryDialog />
          <div className="ceremony-view-switch" aria-label="מצב מצלמה">
            <button type="button" aria-pressed={viewMode === "overview"} aria-label="מבט על" className={viewMode === "overview" ? "active" : ""} onClick={() => chooseViewMode("overview")} title="מבט על"><Map aria-hidden="true" /></button>
            <button type="button" aria-pressed={viewMode === "third"} aria-label="מעקב" className={viewMode === "third" ? "active" : ""} onClick={() => chooseViewMode("third")} title="מעקב"><PersonStanding aria-hidden="true" /></button>
            <button type="button" aria-pressed={viewMode === "first"} aria-label="מבט קרוב" className={viewMode === "first" ? "active" : ""} onClick={() => chooseViewMode("first")} title="מבט קרוב"><Eye aria-hidden="true" /></button>
          </div>
          <input ref={ceremonyTimelineRef} type="range" min={0} max={YOM_KIPPUR_SERVICE_DURATION} step={0.1} value={ceremonyTime} onChange={(event) => setCeremonyTime(Number(event.target.value))} aria-label="מיקום בהמחשה" />
          <select value={ceremonySpeed} onChange={(event) => setCeremonySpeed(Number(event.target.value))} aria-label="מהירות"><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select>
        </div>
      </>}
      <nav className={`feature-nav ${serviceState === "yomKippur" ? "ceremony-open" : ""}`} aria-label="Structures">{(Object.keys(FEATURES) as FeatureId[]).map((id) => <button key={id} type="button" className={selected === id ? "active" : ""} onClick={() => handleSelectFeature(id)}>{FEATURES[id].name.replace(" of burnt offering", "")}</button>)}</nav>
    </main>
  );
}
