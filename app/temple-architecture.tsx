"use client";

import { useEffect, useMemo } from "react";
import { Html } from "@react-three/drei";
import { BoxGeometry, CylinderGeometry, DoubleSide, ExtrudeGeometry, LatheGeometry, Path, Shape, ShapeGeometry, Vector2 } from "three";
import type { BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Bronze, BronzeLeaf, GoldPlate, Limestone, PavingMaterial, surfaceProps, TempleCurtain, Timber } from "./temple-surfaces";
import {
  AZARAH_COLLIDERS, AZARAH_GATES, AZARAH_WALLS, CHAMBER_ROOFS, GATE_BLOCKS, HALL, HEARTH_RAILS, HEARTH_ROOM_ROOFS, MOUNT_BLOCK,
  MOUNT_PLANE_HOLES, PARVAH_STAIR_STEPS, PLATFORM_BOXES, STAIR_A_STEPS, STAIR_B_STEPS, BATH, PIT, TOILET, FIRE_NOOK, YB, gateStepBoxes,
} from "./azarah-structure";
import { AZARAH_CHAMBER_PROPS, HEARTH_PROPS, WOMENS_CHAMBER_PROPS, instrumentRoom, undergroundProps } from "./temple-props";
import type { Prim, PropMat, PropSet } from "./temple-props";
import {
  MESIBAH_STEPS, SANCTUARY, SANCTUARY_SLABS, SANCTUARY_WALLS, UPPER_STAIR_STEPS, slabWithHoles, wallBoxes,
} from "./temple-structure";
import type { Box } from "./temple-structure";
import { CUBIT, OUTER_MOUNT_Y, PRIESTS_FLOOR_Y, TEMPLE_FLOOR_Y } from "./temple-layout";

export { AZARAH_COLLIDERS };

/* ---------------- geometry helpers ---------------- */
function boxesToGeometry(boxes: Box[]): BufferGeometry | null {
  const parts = boxes
    .filter((b) => b.max[0] - b.min[0] > 1e-4 && b.max[1] - b.min[1] > 1e-4 && b.max[2] - b.min[2] > 1e-4)
    .map((b) => {
      const g = new BoxGeometry(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]);
      g.translate((b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2);
      return g;
    });
  if (!parts.length) return null;
  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  return merged;
}

type SurfaceChoice = "limestone" | "paving" | "timber" | "gold" | "bronze";

function Surface({ kind, evidence, selected }: { kind: SurfaceChoice; evidence: boolean; selected: boolean }) {
  if (kind === "paving") return <PavingMaterial evidence={evidence} selected={selected} />;
  if (kind === "timber") return <Timber />;
  if (kind === "gold") return <GoldPlate />;
  if (kind === "bronze") return <Bronze />;
  return <Limestone evidence={evidence} selected={selected} />;
}

export function BoxCluster({ boxes, kind = "limestone", evidence = false, selected = false, castShadow = true, receiveShadow = true }: { boxes: Box[]; kind?: SurfaceChoice; evidence?: boolean; selected?: boolean; castShadow?: boolean; receiveShadow?: boolean }) {
  const geometry = useMemo(() => boxesToGeometry(boxes), [boxes]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return <mesh geometry={geometry} castShadow={castShadow} receiveShadow={receiveShadow}><Surface kind={kind} evidence={evidence} selected={selected} /></mesh>;
}

const wallBoxCache = new Map<object, Box[]>();
const boxesOfWall = (wall: (typeof SANCTUARY_WALLS)[number]) => {
  let boxes = wallBoxCache.get(wall);
  if (!boxes) { boxes = wallBoxes(wall); wallBoxCache.set(wall, boxes); }
  return boxes;
};

function WallSet({ walls, filter, evidence, selected, kind = "limestone" }: { walls: (typeof SANCTUARY_WALLS); filter?: (group: string) => boolean; evidence: boolean; selected: boolean; kind?: SurfaceChoice }) {
  return <>{walls.map((wall, index) => (!filter || filter(wall.group ?? "core")) ? <BoxCluster key={index} boxes={boxesOfWall(wall)} kind={kind} evidence={evidence} selected={selected} /> : null)}</>;
}

/* ---------------- props ---------------- */
function jarGeometry(r: number, h: number) {
  const profile = [[0.001, 0], [0.55, 0], [0.9, 0.16], [1, 0.42], [0.86, 0.74], [0.5, 0.9], [0.56, 0.96], [0.72, 1]].map(([x, y]) => new Vector2(x * r, y * h));
  return new LatheGeometry(profile, 14);
}

function primGeometry(p: Prim): BufferGeometry {
  const g = p.k === "box" ? new BoxGeometry(...p.s) : p.k === "cyl" ? new CylinderGeometry(p.s[0], p.s[0], p.s[1], 14) : jarGeometry(p.s[0], p.s[1]);
  if (p.rx) g.rotateX(p.rx);
  if (p.ry) g.rotateY(p.ry);
  if (p.rz) g.rotateZ(p.rz);
  g.translate(p.c[0], p.c[1], p.c[2]);
  return g;
}

function PropMaterial({ m }: { m: PropMat }) {
  switch (m) {
    case "stone": return <Limestone />;
    case "wood": return <Timber color="#d9c3a0" />;
    case "bronze": return <Bronze />;
    case "salt": return <meshStandardMaterial color="#f3efe3" roughness={0.95} />;
    case "hide": return <meshStandardMaterial color="#8a5b3a" roughness={0.95} />;
    case "clay": return <meshStandardMaterial color="#b6764a" roughness={0.9} side={DoubleSide} />;
    case "water": return <meshStandardMaterial color="#3d8296" roughness={0.06} metalness={0.15} transparent opacity={0.82} />;
    case "linen": return <meshStandardMaterial color="#eae2cb" roughness={1} />;
    case "dark": return <meshStandardMaterial color="#2a2520" roughness={1} />;
    case "straw": return <meshStandardMaterial color="#c9ab5e" roughness={1} />;
    case "lamb": return <meshStandardMaterial color="#e2dac4" roughness={1} />;
    case "flame": return <meshStandardMaterial color="#ff8a2e" emissive="#ff6a12" emissiveIntensity={1.3} roughness={0.6} />;
  }
}

function PropCluster({ prims, mat }: { prims: Prim[]; mat: PropMat }) {
  const geometry = useMemo(() => {
    const parts = prims.filter((p) => p.m === mat).map(primGeometry);
    if (!parts.length) return null;
    const merged = mergeGeometries(parts, false);
    parts.forEach((part) => part.dispose());
    return merged;
  }, [prims, mat]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return <mesh geometry={geometry} castShadow={mat !== "water" && mat !== "flame"} receiveShadow><PropMaterial m={mat} /></mesh>;
}

const PROP_MATS: PropMat[] = ["stone", "wood", "bronze", "salt", "hide", "clay", "water", "linen", "dark", "straw", "flame", "lamb"];

export function PropSetView({ set }: { set: PropSet }) {
  return <>
    {PROP_MATS.map((m) => <PropCluster key={m} prims={set.prims} mat={m} />)}
    {set.lights.map((light, index) => <pointLight key={index} position={light.position} color={light.color} intensity={light.intensity} distance={light.distance} decay={2} />)}
  </>;
}

/* ---------------- Sanctuary ---------------- */
const S = SANCTUARY;
const F = TEMPLE_FLOOR_Y;
const HIDDEN_ON_REVEAL = new Set(["north", "upper-north", "north-roof", "roof", "upper"]);
const PORCH_FLOOR: Box[] = [
  { min: [-S.porchHalf, F - 0.16, S.zPorchIn], max: [S.porchHalf, F, S.zEast] },
  { min: [-S.bodyHalf, F - 0.16, S.zWest], max: [S.bodyHalf, F, S.zPorchIn] },
];
const goldLining = (side: 1 | -1): Box[] => {
  const x0 = Math.min(side * (S.hekhalHalf - 0.05), side * S.hekhalHalf);
  const x1 = Math.max(side * (S.hekhalHalf - 0.05), side * S.hekhalHalf);
  return [
    { min: [x0, F + 0.2, S.zHolyWest + 0.05], max: [x1, F + 15.8, S.zHekhalWall - 0.05] },
    { min: [x0, F + 0.2, S.zHolyOfHoliesWest + 0.05], max: [x1, F + 15.8, S.zPartition - 0.05] },
  ];
};
const GOLD_NORTH = goldLining(1);
const GOLD_SOUTH = goldLining(-1);
const GOLD_CROSS: Box[] = [
  { min: [2.05, F + 0.2, S.zHekhalWall - 0.05], max: [S.hekhalHalf - 0.05, F + 15.8, S.zHekhalWall - 0.001] },
  { min: [-S.hekhalHalf + 0.05, F + 0.2, S.zHekhalWall - 0.05], max: [-2.05, F + 15.8, S.zHekhalWall - 0.001] },
  { min: [-2.05, F + 8.2, S.zHekhalWall - 0.05], max: [2.05, F + 15.8, S.zHekhalWall - 0.001] },
  { min: [-S.hekhalHalf + 0.05, F + 0.2, S.zHolyOfHoliesWest + 0.001], max: [S.hekhalHalf - 0.05, F + 15.8, S.zHolyOfHoliesWest + 0.05] },
];
const CEILING_HOLES = [{ x0: -0.6, x1: 0.6, z0: -55.6, z1: -54.4 }, { x0: -0.6, x1: 0.6, z0: -58.6, z1: -57.4 }];
const CEILING_BOARDS: Box[] = slabWithHoles([-S.hekhalHalf + 0.05, S.cellsTop - 0.1, S.zHolyOfHoliesWest + 0.05], [S.hekhalHalf - 0.05, S.cellsTop, S.zHekhalWall - 0.05], CEILING_HOLES);
const CEILING_BEAMS: Box[] = Array.from({ length: 11 }, (_, i) => {
  const z = S.zHekhalWall - 1.2 - i * 2.2;
  return { min: [-S.hekhalHalf + 0.05, S.cellsTop - 0.55, z - 0.22], max: [S.hekhalHalf - 0.05, S.cellsTop - 0.1, z + 0.22] } as Box;
});
const GOLD_LOWER_CEILING: Box[] = [{
  min: [-S.hekhalHalf+0.08,S.cellsTop-0.64,S.zHolyOfHoliesWest+0.08],
  max: [S.hekhalHalf-0.08,S.cellsTop-0.56,S.zHekhalWall-0.08],
}];
const GOLD_UPPER_CEILING: Box[] = [{
  min: [-S.hekhalHalf+0.08,S.roof-0.52,S.zWestWall+0.08],
  max: [S.hekhalHalf-0.08,S.roof-0.44,S.zHekhalWall-0.08],
}];
const UPPER_COLUMNS = [-1.4, 1.4].map((dz) => ({ x: -(S.hekhalHalf + S.wallThickness[0]) - 0.35, z: -45 + dz }));
const HEKHAL_WICKET_X = (S.hekhalHalf + S.wallThickness[0] + S.hekhalHalf + 11 * CUBIT) / 2;

function CedarLadder({ position, height = 5.2 }: { position: [number, number, number]; height?: number }) {
  const rungs = Math.max(5, Math.floor(height / 0.48));
  return <group position={position} name="cedar-maintenance-ladder">
    {[-0.36,0.36].map((x)=><mesh key={x} position={[x,height/2,0]} castShadow><cylinderGeometry args={[0.075,0.09,height,10]} /><Timber color="#9a6840" /></mesh>)}
    {Array.from({length:rungs},(_,index)=><mesh key={index} position={[0,0.28+index*(height-0.56)/Math.max(1,rungs-1),0]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[0.055,0.055,0.82,9]} /><Timber color="#a87347" /></mesh>)}
  </group>;
}

function MaintenanceRepairAccess() {
  const boxY = F + 9.2;
  return <group name="kodesh-maintenance-access">
    {/* Two cedar ladders and two open trapdoors follow the supplied model's
        maintenance sequence. Exact joinery and placement are interpretive. */}
    <CedarLadder position={[-(S.hekhalHalf+S.wallThickness[0])-1.15,S.cellsTop,-43.9]} height={S.upperFloor-S.cellsTop} />
    <CedarLadder position={[-(S.hekhalHalf+S.wallThickness[0])-1.15,S.cellsTop,-46.1]} height={S.upperFloor-S.cellsTop} />
    {[-55,-58].map((z)=><group key={z}>
      <mesh position={[0,S.upperFloor+0.08,z-0.82]} rotation={[-0.78,0,0]} castShadow><boxGeometry args={[1.22,0.12,1.4]} /><Timber color="#805331" /></mesh>
      {[-0.46,0.46].map((x)=><mesh key={x} position={[x,(S.upperFloor+boxY)/2,z]} castShadow><cylinderGeometry args={[0.022,0.022,S.upperFloor-boxY,7]} /><meshStandardMaterial color="#6e563e" roughness={1} /></mesh>)}
    </group>)}
    {/* Three-sided box keeps the worker oriented toward the repair surface and
        prevents casual viewing into the Holy of Holies. */}
    <group name="suspended-three-sided-repair-box" position={[0,boxY,-56.5]}>
      <mesh position={[0,-0.78,0]} castShadow><boxGeometry args={[1.5,0.14,1.35]} /><Timber color="#8c5d37" /></mesh>
      {[-0.69,0.69].map((x)=><mesh key={x} position={[x,0,0]} castShadow><boxGeometry args={[0.12,1.7,1.35]} /><Timber color="#8c5d37" /></mesh>)}
      <mesh position={[0,0,-0.62]} castShadow><boxGeometry args={[1.5,1.7,0.12]} /><Timber color="#8c5d37" /></mesh>
    </group>
  </group>;
}

export function SanctuaryBuilding({ evidence, selected, onSelect, revealInterior }: { evidence: boolean; selected: boolean; onSelect: () => void; revealInterior: boolean }) {
  const visible = (group: string) => !revealInterior || !HIDDEN_ON_REVEAL.has(group);
  return (
    <group userData={{ cameraOccluder: true }} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <WallSet walls={SANCTUARY_WALLS} filter={visible} evidence={evidence} selected={selected} />
      {SANCTUARY_SLABS.map((slab, index) => visible(slab.group) ? <BoxCluster key={`slab-${index}`} boxes={[slab]} evidence={evidence} selected={selected} /> : null)}
      <BoxCluster boxes={PORCH_FLOOR} kind="paving" evidence={evidence} selected={selected} castShadow={false} />
      {visible("north") && <BoxCluster boxes={MESIBAH_STEPS} evidence={evidence} selected={selected} />}
      {visible("upper") && <BoxCluster boxes={UPPER_STAIR_STEPS} kind="timber" evidence={evidence} selected={selected} />}
      {!evidence && <>
        {visible("north") && <BoxCluster boxes={GOLD_NORTH} kind="gold" castShadow={false} />}
        <BoxCluster boxes={GOLD_SOUTH} kind="gold" castShadow={false} />
        <BoxCluster boxes={GOLD_CROSS} kind="gold" castShadow={false} />
        <BoxCluster boxes={GOLD_LOWER_CEILING} kind="gold" castShadow={false} />
        <BoxCluster boxes={GOLD_UPPER_CEILING} kind="gold" castShadow={false} />
      </>}
      {visible("upper") && <>
        <BoxCluster boxes={CEILING_BOARDS} kind="timber" castShadow={false} />
        <BoxCluster boxes={CEILING_BEAMS} kind="timber" />
        {UPPER_COLUMNS.map((column, index) => <mesh key={`column-${index}`} position={[column.x, S.cellsTop + 2.6, column.z]} castShadow><cylinderGeometry args={[0.16, 0.18, 5.2, 14]} /><Timber /></mesh>)}
        <mesh position={[UPPER_COLUMNS[0].x, S.cellsTop + 5.35, -45]} castShadow><boxGeometry args={[0.4, 0.3, 3.2]} /><Timber /></mesh>
        <mesh position={[0.0, S.upperFloor + 0.28, -52.6]} castShadow><cylinderGeometry args={[0.42, 0.34, 0.56, 14]} /><Timber /></mesh>
      </>}
      {!evidence && <>
        {/* The upper chamber repeats the lower sacred boundary directly above
            the double-curtain line; floor bands make that alignment readable. */}
        <TempleCurtain position={[0,(S.upperFloor+S.roof)/2,S.zPartition]} width={7.95} height={S.roof-S.upperFloor-0.8} opacity={revealInterior ? 0.68 : 0.96} />
        {[-0.32,0,0.32].map((dz,index)=><mesh key={`upper-boundary-${index}`} position={[0,S.upperFloor+0.05,S.zPartition+dz]} receiveShadow>
          <boxGeometry args={[S.hekhalHalf*2-0.4,0.08,0.18]} />
          <meshStandardMaterial color={index===1?"#c89a2b":"#315e78"} roughness={0.62} metalness={index===1?0.45:0.05} />
        </mesh>)}
        {revealInterior && <MaintenanceRepairAccess />}
      </>}
      {/* Gold door leaves, folded back inside the Hekhal doorway. */}
      {[-1, 1].map((side) => <mesh key={`door-${side}`} position={[side * 3.0, F + 4.0, S.zHekhalWall - 0.1]} castShadow><boxGeometry args={[1.9, 8, 0.1]} /><GoldPlate /></mesh>)}
      {!evidence && <group name="hekhal-side-wickets">
        {/* Middot 4:1-2: the northern wicket is the working side entrance;
            its southern counterpart remains visibly closed. */}
        {[1,-1].map((side)=><group key={`wicket-frame-${side}`} position={[side*HEKHAL_WICKET_X,F+1.4,S.zHekhalWall-0.18]}>
          {[-0.68,0.68].map((x)=><mesh key={x} position={[x,0,0]} castShadow><boxGeometry args={[0.16,2.95,0.24]} /><GoldPlate /></mesh>)}
          <mesh position={[0,1.42,0]} castShadow><boxGeometry args={[1.5,0.16,0.24]} /><GoldPlate /></mesh>
        </group>)}
        <mesh name="north-wicket-open-leaf" position={[HEKHAL_WICKET_X+0.58,F+1.35,S.zHekhalWall-0.72]} rotation={[0,-1.12,0]} castShadow><boxGeometry args={[1.08,2.7,0.12]} /><GoldPlate /></mesh>
        <mesh name="south-wicket-sealed-leaf" position={[-HEKHAL_WICKET_X,F+1.35,S.zHekhalWall-0.3]} castShadow><boxGeometry args={[1.12,2.7,0.12]} /><GoldPlate /></mesh>
      </group>}
      {!evidence && <group name="gold-framed-hekhal-threshold" position={[0,0,S.zHekhalWall-0.16]}>
        {[-1,1].map((side)=><group key={side} position={[side*2.28,F+4,0]}>
          <mesh castShadow><boxGeometry args={[0.34,8.15,0.24]} /><GoldPlate /></mesh>
          {Array.from({length:7},(_,index)=><mesh key={index} position={[0,-3.45+index*1.15,0.14]} rotation={[Math.PI/2,0,0]} castShadow><torusGeometry args={[0.12,0.035,7,12]} /><GoldPlate /></mesh>)}
        </group>)}
        <mesh position={[0,F+8.03,0]} castShadow><boxGeometry args={[4.9,0.38,0.28]} /><GoldPlate /></mesh>
        <mesh position={[0,F+8.1,0.08]}><torusGeometry args={[2.28,0.2,12,52,Math.PI]} /><GoldPlate /></mesh>
        <TempleCurtain position={[0,F+4.02,-0.13]} width={4.15} height={7.85} opacity={revealInterior?0.38:0.96} />
      </group>}
      <group name="double-parochet-yoma-route">
        {/* Yoma 5:1: the outer/eastern curtain opens at the south end; the
            inner/western curtain opens at the north end, creating a real
            one-cubit route between them rather than two overlapping planes. */}
        <TempleCurtain position={[0.45, F + 7.7, S.zHolyWest - 0.06]} width={7.05} height={15.4} opacity={revealInterior ? 0.5 : 1} />
        <TempleCurtain position={[-0.45, F + 7.7, S.zPartition + 0.06]} width={7.05} height={15.4} opacity={revealInterior ? 0.5 : 1} />
        <mesh position={[0,F+15.48,(S.zHolyWest+S.zPartition)/2]} castShadow><boxGeometry args={[8.2,0.18,S.zHolyWest-S.zPartition+0.24]} /><GoldPlate /></mesh>
      </group>
      <pointLight position={[0, F + 7, -44]} intensity={110} distance={42} decay={2} color="#ffcf8a" />
      <pointLight position={[0, F + 5, -57]} intensity={50} distance={28} decay={2} color="#e6b86d" />
      <Html position={[0, F + 1.3, -44]} center distanceFactor={18} occlude><button className="hotspot" onClick={onSelect}>Holy Place · enterable</button></Html>
      <Html position={[0, F + 1.3, -57]} center distanceFactor={16} occlude><button className="hotspot" onClick={onSelect}>Holy of Holies</button></Html>
      {revealInterior&&<Html position={[0,F+9.2,(S.zHolyWest+S.zPartition)/2]} center distanceFactor={13}><button className="hotspot" onClick={onSelect}>Two parokhot · south entry, north exit</button></Html>}
      {revealInterior&&<Html position={[0,S.upperFloor+2.1,-52.5]} center distanceFactor={18}><button className="hotspot" onClick={onSelect}>Upper chamber · boundary above Holy of Holies</button></Html>}
    </group>
  );
}

/* ---------------- Azarah ---------------- */
const P = PRIESTS_FLOOR_Y;
const HALL_LENGTH = HALL.z1 - HALL.z0;

function useGableGeometry() {
  return useMemo(() => {
    const shape = new Shape();
    shape.absarc(0, HALL.spring - P, HALL.radius, 0, Math.PI, false);
    shape.lineTo(HALL.radius, HALL.spring - P);
    return new ExtrudeGeometry(shape, { depth: 0.8, bevelEnabled: false });
  }, []);
}

const chamberProps: PropSet[] = Object.values(AZARAH_CHAMBER_PROPS);

export function AzarahComplex({ evidence, selected, onSelect }: { evidence: boolean; selected: boolean; onSelect: () => void }) {
  const gable = useGableGeometry();
  const gateSteps = useMemo(() => AZARAH_GATES.map((gate) => gateStepBoxes(gate)), []);
  return (
    <group userData={{ cameraOccluder: true }} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <BoxCluster boxes={PLATFORM_BOXES} kind="paving" evidence={evidence} selected={selected} />
      <WallSet walls={AZARAH_WALLS} evidence={evidence} selected={selected} />
      <BoxCluster boxes={GATE_BLOCKS} evidence={evidence} selected={selected} />
      {gateSteps.map((steps, index) => <BoxCluster key={`gate-steps-${index}`} boxes={steps} evidence={evidence} selected={selected} />)}
      {/* Six lateral gates plus Nicanor form the seven-gate system. The lateral
          leaves are gold-plated; Nicanor alone retains its bronze/copper visual
          distinction. Panel ornament remains illustrative. */}
      {AZARAH_GATES.filter((gate) => !gate.hall).map((gate) => (
        <group key={`gate-leaves-${gate.name}`} position={[gate.side * 26.9, P + 3.8, gate.z]} rotation={[0, Math.PI / 2, 0]}>
          <BronzeLeaf side={-1} metal="gold" />
          <BronzeLeaf side={1} metal="gold" />
        </group>
      ))}
      {AZARAH_GATES.filter((gate) => gate.hall).map((gate) => (
        <group key={`gate-leaves-${gate.name}`} position={[gate.side * 43.3, OUTER_MOUNT_Y + 1.8, gate.z]} rotation={[0, Math.PI / 2, 0]} scale={[0.82, 0.47, 0.82]}>
          <BronzeLeaf side={-1} metal="gold" />
          <BronzeLeaf side={1} metal="gold" />
        </group>
      ))}
      <BoxCluster boxes={CHAMBER_ROOFS} evidence={evidence} selected={selected} />
      <BoxCluster boxes={PARVAH_STAIR_STEPS} kind="timber" />
      <BoxCluster boxes={HEARTH_ROOM_ROOFS} evidence={evidence} selected={selected} />
      <BoxCluster boxes={HEARTH_RAILS} kind="timber" />
      {/* Vaulted Hearth hall: barrel vault and two arched gables. */}
      <mesh position={[HALL.centerX, HALL.spring, (HALL.z0 + HALL.z1) / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[HALL.radius, HALL.radius, HALL_LENGTH, 40, 1, true, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial {...limestoneProps(evidence)} side={DoubleSide} />
      </mesh>
      {[HALL.z0, HALL.z1 - 0.8 + 0.001].map((z, index) => <mesh key={`gable-${index}`} geometry={gable} position={[HALL.centerX, P, z]} castShadow receiveShadow><Limestone evidence={evidence} /></mesh>)}
      <PropSetView set={HEARTH_PROPS} />
      {chamberProps.map((set, index) => <PropSetView key={index} set={set} />)}
    </group>
  );
}

function limestoneProps(evidence: boolean) {
  const maps = surfaceProps("limestone");
  return evidence ? { onBeforeCompile: maps.onBeforeCompile, customProgramCacheKey: maps.customProgramCacheKey, color: "#3298ad", roughness: 1 } : { ...maps, color: "#ffffff", roughness: 1 };
}

/* ---------------- Mount masonry with the underground circuit ---------------- */
const UNDERGROUND = undergroundProps(YB, BATH, PIT, TOILET, FIRE_NOOK);

export function MountMasonry({ evidence, selected }: { evidence: boolean; selected: boolean }) {
  const planeGeometry = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-99, -99); shape.lineTo(99, -99); shape.lineTo(99, 99); shape.lineTo(-99, 99); shape.lineTo(-99, -99);
    for (const hole of MOUNT_PLANE_HOLES) {
      const path = new Path();
      // Plane rotated flat: shape y maps to -(z - 14).
      const y0 = -(hole.z1 - 14);
      const y1 = -(hole.z0 - 14);
      path.moveTo(hole.x0, y0); path.lineTo(hole.x0, y1); path.lineTo(hole.x1, y1); path.lineTo(hole.x1, y0); path.lineTo(hole.x0, y0);
      shape.holes.push(path);
    }
    return new ShapeGeometry(shape);
  }, []);
  useEffect(() => () => planeGeometry.dispose(), [planeGeometry]);
  return <>
    <BoxCluster boxes={MOUNT_BLOCK} evidence={evidence} selected={selected} />
    <mesh geometry={planeGeometry} position={[0, OUTER_MOUNT_Y + 0.02, 14]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><PavingMaterial evidence={evidence} selected={selected} /></mesh>
    <BoxCluster boxes={STAIR_A_STEPS} evidence={evidence} selected={selected} />
    <BoxCluster boxes={STAIR_B_STEPS} evidence={evidence} selected={selected} />
    <PropSetView set={UNDERGROUND} />
  </>;
}

/* ---------------- Women's Court chambers and instrument rooms ---------------- */
const INSTRUMENT_STRINGS = instrumentRoom(-9, "strings");
const INSTRUMENT_BRASS = instrumentRoom(9, "brass");

export function CourtInteriors() {
  return <>
    {WOMENS_CHAMBER_PROPS.map((set, index) => <PropSetView key={index} set={set} />)}
    <PropSetView set={INSTRUMENT_STRINGS} />
    <PropSetView set={INSTRUMENT_BRASS} />
  </>;
}

export function allPropColliders() {
  return [...chamberProps, HEARTH_PROPS, UNDERGROUND, ...WOMENS_CHAMBER_PROPS, INSTRUMENT_STRINGS, INSTRUMENT_BRASS].flatMap((set) => set.colliders);
}
