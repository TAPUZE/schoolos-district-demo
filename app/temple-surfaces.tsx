"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instance, Instances } from "@react-three/drei";
import { AdditiveBlending, CanvasTexture, CatmullRomCurve3, Color, DoubleSide, PlaneGeometry, RepeatWrapping, ShaderMaterial, SRGBColorSpace, Vector3 } from "three";
import type { Group, PointLight } from "three";import { getSurfaceSet, mulberry32, projectWorldUv, SURFACE_TILE } from "./temple-materials";
import type { SurfaceKind } from "./temple-materials";
import {
  CUBIT, TEMPLE_BODY_CENTER_Z, TEMPLE_BODY_DEPTH, TEMPLE_EAST_Z, TEMPLE_FLOOR_Y,
  TEMPLE_PORCH_WEST_Z, TEMPLE_ROOF_Y, TEMPLE_WEST_Z,
} from "./temple-layout";
import { SANCTUARY, SANCTUARY_WALLS } from "./temple-structure";
import type { FacadeColumnVariant, FacadeGoldVariant, FacadeStoneVariant } from "./research-variants";

type Patch = Parameters<typeof projectWorldUv>[0];
const SURFACE_PATCH: Record<SurfaceKind, (shader: Patch) => void> = {
  limestone: (shader) => projectWorldUv(shader, SURFACE_TILE.limestone),
  paving: (shader) => projectWorldUv(shader, SURFACE_TILE.paving),
  ground: (shader) => projectWorldUv(shader, SURFACE_TILE.ground),
  bronze: (shader) => projectWorldUv(shader, SURFACE_TILE.bronze),
  gold: (shader) => projectWorldUv(shader, SURFACE_TILE.gold),
  linen: () => undefined,
  wood: (shader) => projectWorldUv(shader, SURFACE_TILE.wood),
};
const SURFACE_KEY: Record<SurfaceKind, () => string> = {
  limestone: () => "world-uv-limestone",
  paving: () => "world-uv-paving",
  ground: () => "world-uv-ground",
  bronze: () => "world-uv-bronze",
  gold: () => "world-uv-gold",
  linen: () => "native-uv-linen",
  wood: () => "world-uv-wood",
};

export function surfaceProps(kind: SurfaceKind) {
  const { map, normalMap, roughnessMap } = getSurfaceSet(kind);
  return { map, normalMap, roughnessMap, onBeforeCompile: SURFACE_PATCH[kind], customProgramCacheKey: SURFACE_KEY[kind] };
}

export function Limestone({ evidence = false, selected = false, surfaceOffset = false }: { evidence?: boolean; selected?: boolean; surfaceOffset?: boolean }) {
  const maps = useMemo(() => surfaceProps("limestone"), []);
  return <meshStandardMaterial {...maps} {...(evidence ? { map: null, normalMap: null, roughnessMap: null } : {})} color={evidence ? "#3298ad" : "#ffffff"} roughness={1} metalness={0} emissive={selected ? "#51340d" : "#000000"} emissiveIntensity={selected ? 0.18 : 0} polygonOffset={surfaceOffset} polygonOffsetFactor={surfaceOffset ? -1 : 0} polygonOffsetUnits={surfaceOffset ? -1 : 0} />;
}

function TintedMarble({ color }: { color: string }) {
  const maps = useMemo(() => surfaceProps("limestone"), []);
  return <meshPhysicalMaterial {...maps} color={color} roughness={0.36} metalness={0} clearcoat={0.22} clearcoatRoughness={0.28} envMapIntensity={0.82} />;
}

export function PavingMaterial({ evidence, selected }: { evidence: boolean; selected: boolean }) {
  const maps = useMemo(() => surfaceProps("paving"), []);
  return <meshStandardMaterial {...maps} {...(evidence ? { map: null, normalMap: null, roughnessMap: null } : {})} color={evidence ? "#3298ad" : "#ffffff"} roughness={1} metalness={0} emissive={selected ? "#10343a" : "#000000"} emissiveIntensity={selected ? 0.14 : 0} />;
}

// Metals only reflect the environment, so their base colour is lifted above 1 to keep them bright under the dim sky probe.
const METAL_LIFT = new Color(1.4, 1.4, 1.4);

export function Bronze() {
  const maps = useMemo(() => surfaceProps("bronze"), []);
  return <meshStandardMaterial {...maps} color={METAL_LIFT} metalness={0.92} roughness={1} />;
}

export function GoldPlate() {
  const maps = useMemo(() => surfaceProps("gold"), []);
  return <meshStandardMaterial {...maps} color={METAL_LIFT} metalness={1} roughness={0.42} envMapIntensity={1.35} />;
}

export function BronzeLeaf({ side, metal = "bronze" }: { side: number; metal?: "bronze" | "gold" }) {
  const rails = [-3.6, -2.15, -0.7, 0.75, 2.2, 3.65];
  const bosses = [-2.9, -1.45, 0, 1.45, 2.9];
  const LeafMetal = metal === "gold" ? GoldPlate : Bronze;
  return (
    <group position={[side * 0.9, 0, 0]}>
      <mesh castShadow receiveShadow><boxGeometry args={[1.8, 7.6, 0.16]} /><LeafMetal /></mesh>
      {[-1, 1].map((face) => (
        <group key={face} position={[0, 0, face * 0.09]}>
          {[-0.83, 0.83].map((x) => <mesh key={x} position={[x, 0, 0]} castShadow><boxGeometry args={[0.14, 7.6, 0.06]} /><LeafMetal /></mesh>)}
          {rails.map((y) => <mesh key={y} position={[0, y, 0]} castShadow><boxGeometry args={[1.76, 0.12, 0.06]} /><LeafMetal /></mesh>)}
          {bosses.map((y) => <mesh key={`boss-${y}`} position={[0, y, face * 0.015]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.3, 0.34, 0.09, 20]} /><LeafMetal /></mesh>)}
        </group>
      ))}
    </group>
  );
}

// Josephus (War 5.222-224): gold-plated front, projecting cornice, and gold spikes along the roof against birds.
export function TempleOrnament({ evidence, revealInterior, playerRef, stoneVariant, columnVariant, goldVariant }: { evidence: boolean; revealInterior: boolean; playerRef: React.RefObject<Group | null>; stoneVariant: FacadeStoneVariant; columnVariant: FacadeColumnVariant; goldVariant: FacadeGoldVariant }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    const player = playerRef.current;
    const inside = !!player && player.position.z <= TEMPLE_EAST_Z && player.position.z >= TEMPLE_WEST_Z && Math.abs(player.position.x) < 19.5;
    if (group.current) group.current.visible = !(inside || revealInterior);
  });

  const floor = TEMPLE_FLOOR_Y;
  const top = TEMPLE_ROOF_Y;
  const bodyTop = SANCTUARY.cellsTop + 1.6;
  const front = TEMPLE_EAST_Z;
  const openingTop = floor + 40 * CUBIT;
  const goldTop = top - 1.4;
  const goldBottom = floor + 1.2;
  const goldHeight = goldTop - goldBottom;
  const bodyEastZ = TEMPLE_PORCH_WEST_Z;
  const waveCourses = useMemo(() => Array.from({ length: 29 }, (_, index) => ({
    y: floor + 0.78 + index * 1.08,
    height: 1.01,
    projection: index % 2 === 0 ? 0.26 : 0.025,
    color: stoneVariant === "sunlit-marble"
      ? (index % 4 === 1 ? "#ded8c9" : index % 4 === 3 ? "#cfd2cb" : index % 4 === 2 ? "#e8e4da" : "#f4f0e5")
      : (index % 4 === 1 ? "#e0dfda" : index % 4 === 3 ? "#d4d5d0" : index % 4 === 2 ? "#e9e7e0" : "#f4f1e8"),
  })), [floor, stoneVariant]);
  const vineBranches = useMemo(() => [
    new CatmullRomCurve3([new Vector3(-5.1,floor+17.7,front+0.72),new Vector3(-2.6,floor+18.5,front+0.8),new Vector3(0,floor+18.0,front+0.84),new Vector3(2.6,floor+18.65,front+0.8),new Vector3(5.1,floor+17.8,front+0.72)]),
    new CatmullRomCurve3([new Vector3(-3.8,floor+18.1,front+0.76),new Vector3(-4.4,floor+16.3,front+0.78),new Vector3(-3.7,floor+14.5,front+0.76)]),
    new CatmullRomCurve3([new Vector3(3.8,floor+18.2,front+0.76),new Vector3(4.45,floor+16.35,front+0.78),new Vector3(3.75,floor+14.5,front+0.76)]),
  ], [floor,front]);
  const vineLeaves = useMemo(() => Array.from({length:18},(_,index)=>{
    const side=index<9?-1:1;
    const lane=index%9;
    return [side*(0.65+lane*0.48),floor+17.9+Math.sin(lane*1.35)*0.62,front+0.9] as [number,number,number];
  }), [floor,front]);
  const sanctuaryWindowZs = useMemo(() => [-41,-50,-59], []);
  const sanctuaryWindowRows = useMemo(() => [floor+11.8,floor+21.2], [floor]);

  // Gold spikes (1 cubit) along every roof parapet against birds (Middot 4:6).
  const spikes = useMemo(() => {
    const points: [number, number, number][] = [];
    for (const wall of SANCTUARY_WALLS) {
      if (wall.group !== "roof") continue;
      const length = wall.to - wall.from;
      const count = Math.max(1, Math.floor(length / 1.05));
      for (let i = 0; i < count; i += 1) {
        const along = wall.from + ((i + 0.5) * length) / count;
        points.push(wall.axis === "z" ? [wall.fixed, wall.y1 + 0.25, along] : [along, wall.y1 + 0.25, wall.fixed]);
      }
    }
    return points;
  }, []);

  return (
    <>
    {/* Keep the video-reconstruction windows independent of the removable
        ornament shell. They remain visible when the Kodesh cutaway opens. */}
    {!evidence && <group name="sanctuary-high-windows">
      {[-1,1].flatMap((side)=>sanctuaryWindowRows.flatMap((y,row)=>sanctuaryWindowZs.map((z,index)=>{
        const face=SANCTUARY.hekhalHalf+SANCTUARY.wallThickness[row===0?2:0]+0.18;
        return <group key={`sanctuary-window-${side}-${row}-${index}`} name="sanctuary-splayed-window" position={[side*face,y,z]} rotation={[0,side*Math.PI/2,0]}>
        {/* Angled reveals make the thick, reverse-splayed opening visible;
            the structural wall behind this trim contains the real void. */}
        {[-1,1].map((edge)=><mesh key={`reveal-${edge}`} position={[edge*0.91,-0.34,-0.43]} rotation={[0,edge*-0.17,0]} castShadow receiveShadow><boxGeometry args={[0.2,2.5,0.92]} /><TintedMarble color="#ddd8cc" /></mesh>)}
        <mesh position={[0,-1.48,-0.42]} rotation={[0.12,0,0]} castShadow receiveShadow><boxGeometry args={[1.84,0.18,0.94]} /><TintedMarble color="#d8d2c5" /></mesh>
        {[-1.12,1.12].map((x)=><mesh key={`jamb-${x}`} position={[x,-0.34,0]} castShadow><boxGeometry args={[0.24,2.5,0.34]} />{goldVariant==="video-trim"?<GoldPlate />:<TintedMarble color="#ddd7ca" />}</mesh>)}
        <mesh position={[0,-1.58,0]} castShadow><boxGeometry args={[2.48,0.22,0.34]} />{goldVariant==="video-trim"?<GoldPlate />:<TintedMarble color="#ddd7ca" />}</mesh>
        <mesh position={[0,0.9,0]} castShadow><torusGeometry args={[1.12,0.13,10,32,Math.PI]} />{goldVariant==="video-trim"?<GoldPlate />:<TintedMarble color="#ddd7ca" />}</mesh>
        {[-0.42,0.42].map((x)=><mesh key={x} position={[x,-0.32,0.31]}><boxGeometry args={[0.09,2.3,0.08]} /><GoldPlate /></mesh>)}
        <mesh position={[0,0.78,0.31]}><boxGeometry args={[1.36,0.09,0.08]} /><GoldPlate /></mesh>
        {row===1&&<group name="window-crown-and-chain" position={[0,-1.78,0.27]}>
          <mesh castShadow><sphereGeometry args={[0.14,16,12]} /><GoldPlate /></mesh>
          {Array.from({length:9},(_,link)=><mesh key={link} position={[0,-0.18-link*0.16,0]} rotation={[Math.PI/2,link%2?Math.PI/2:0,0]}><torusGeometry args={[0.075,0.018,6,12]} /><GoldPlate /></mesh>)}
          <mesh position={[0,-1.68,0]} castShadow><octahedronGeometry args={[0.16,0]} /><GoldPlate /></mesh>
        </group>}
      </group>;})))}
    </group>}
    <group ref={group}>
      {/* Cornice: projecting course under the roof slab on the porch, and under the cell-terrace parapet on the body. */}
      <mesh position={[0, top - 0.5, front - 0.2]} castShadow receiveShadow><boxGeometry args={[41.4, 1, 3.4]} /><Limestone evidence={evidence} /></mesh>
      {[-1, 1].map((side) => (
        <group key={`cornice-${side}`}>
          <mesh position={[side * 20.3, top - 0.5, (front + bodyEastZ) / 2]} castShadow receiveShadow><boxGeometry args={[1.6, 1, front - bodyEastZ + 0.4]} /><Limestone evidence={evidence} /></mesh>
          <mesh position={[side * 14.7, bodyTop - 0.5, TEMPLE_BODY_CENTER_Z]} castShadow receiveShadow><boxGeometry args={[1.4, 1, TEMPLE_BODY_DEPTH + 0.2]} /><Limestone evidence={evidence} /></mesh>
        </group>
      ))}
      <mesh position={[0, bodyTop - 0.5, TEMPLE_WEST_Z - 0.5]} castShadow receiveShadow><boxGeometry args={[30, 1, 1.6]} /><Limestone evidence={evidence} /></mesh>

      {/* Bava Batra 4a: differently coloured marble courses alternately project
          and recede, producing the visual rhythm compared to waves of the sea.
          Course height, tint and projection are reconstruction choices. Josephus's
          gold is kept on the east/front face instead of wrapping the whole building. */}
      {!evidence && waveCourses.map((course, index) => <group key={`wave-course-${index}`}>
        {[-1, 1].map((side) => <mesh key={`side-${side}`} position={[side * (SANCTUARY.bodyHalf + course.projection), course.y, TEMPLE_BODY_CENTER_Z]} castShadow receiveShadow>
          <boxGeometry args={[0.16, course.height, TEMPLE_BODY_DEPTH - 0.18]} />
          <TintedMarble color={course.color} />
        </mesh>)}
        <mesh position={[0, course.y, TEMPLE_WEST_Z - course.projection]} castShadow receiveShadow>
          <boxGeometry args={[SANCTUARY.bodyHalf * 2, course.height, 0.16]} />
          <TintedMarble color={course.color} />
        </mesh>
        {course.y < openingTop ? [-1,1].map((side)=><mesh key={`front-${side}`} position={[side*12,course.y,front+course.projection]} castShadow receiveShadow>
          <boxGeometry args={[16,course.height,0.16]} /><TintedMarble color={course.color} />
        </mesh>) : <mesh position={[0,course.y,front+course.projection]} castShadow receiveShadow>
          <boxGeometry args={[SANCTUARY.porchHalf*2,course.height,0.16]} /><TintedMarble color={course.color} />
        </mesh>}
      </group>)}

      {/* String courses on the front face; the lower one steps around the doorway. */}
      <mesh position={[0, floor + 26, front + 0.25]} castShadow receiveShadow><boxGeometry args={[40.4, 0.5, 0.5]} /><Limestone evidence={evidence} /></mesh>
      {[-1, 1].map((side) => <mesh key={`course-${side}`} position={[side * 12.6, floor + 13, front + 0.25]} castShadow receiveShadow><boxGeometry args={[15.2, 0.5, 0.5]} /><Limestone evidence={evidence} /></mesh>)}

      {/* Doorway jambs and lintel. */}
      {[-1, 1].map((side) => <mesh key={`jamb-${side}`} position={[side * 4.55, (floor + openingTop) / 2, front + 0.3]} castShadow receiveShadow><boxGeometry args={[1.1, openingTop - floor, 0.7]} /><Limestone evidence={evidence} /></mesh>)}
      <mesh position={[0, openingTop + 0.7, front + 0.35]} castShadow receiveShadow><boxGeometry args={[10.8, 1.4, 0.8]} /><Limestone evidence={evidence} /></mesh>
      <mesh position={[0, openingTop + 1.6, front + 0.5]} castShadow receiveShadow><boxGeometry args={[11.6, 0.5, 1.1]} /><Limestone evidence={evidence} /></mesh>

      {/* Middot 3:7: five progressively wider oak beams above the opening,
          separated by stone courses. Carving and paint remain illustrative. */}
      {!evidence && Array.from({length:5},(_,index)=>{
        const width=9.6+index*0.8;
        const y=openingTop+2.55+index*0.82;
        return <group key={`ulam-beam-${index}`}>
          <mesh position={[0,y,front+0.74]} castShadow><boxGeometry args={[width,0.34,0.5]} /><Timber color={index%2?"#72472e":"#895637"} /></mesh>
          {index<4&&<mesh position={[0,y+0.42,front+0.58]} castShadow><boxGeometry args={[width+0.38,0.32,0.62]} /><Limestone evidence={evidence} /></mesh>}
        </group>;
      })}

      {/* Video-selected reconstruction: the two monumental porch columns are
          a named visual variant because reconstructions disagree on location. */}
      {!evidence && columnVariant === "video-columns" && [-1,1].map((side)=><group key={`ulam-column-${side}`} position={[side*6.7,floor,front+0.95]}>
        <mesh position={[0,0.35,0]} castShadow><cylinderGeometry args={[0.9,1.12,0.7,32]} /><Bronze /></mesh>
        <mesh position={[0,6.9,0]} castShadow><cylinderGeometry args={[0.56,0.72,13.1,32]} /><Bronze /></mesh>
        {Array.from({length:12},(_,flute)=>{const angle=flute/12*Math.PI*2;return <mesh key={flute} position={[Math.sin(angle)*0.62,6.9,Math.cos(angle)*0.62]}><cylinderGeometry args={[0.035,0.035,12.6,8]} /><Bronze /></mesh>;})}
        <mesh position={[0,13.65,0]} castShadow><cylinderGeometry args={[1.05,0.72,0.55,28]} /><Bronze /></mesh>
        <mesh position={[0,14.05,0]} castShadow><boxGeometry args={[2.2,0.28,2.2]} /><Bronze /></mesh>
        <mesh position={[0,14.42,0]} castShadow><sphereGeometry args={[0.64,24,14]} /><Bronze /></mesh>
      </group>)}

      {/* The supplied model places a hanging golden lamp within the entrance,
          distinct from Helena's dawn-reflecting lamp above the facade. */}
      {!evidence && <group name="ulam-hanging-lamp" position={[0,floor+13.3,front-1.15]}>
        <mesh position={[0,3.2,0]} castShadow><cylinderGeometry args={[0.035,0.035,6.4,9]} /><GoldPlate /></mesh>
        <mesh castShadow><sphereGeometry args={[0.34,20,14]} /><GoldPlate /></mesh>
        {Array.from({length:6},(_,index)=>{const angle=index*Math.PI/3;return <group key={index} rotation={[0,angle,0]}>
          <mesh position={[0.62,-0.08,0]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[0.045,0.06,0.92,10]} /><GoldPlate /></mesh>
          <mesh position={[1.05,0.02,0]} castShadow><cylinderGeometry args={[0.13,0.09,0.18,14]} /><GoldPlate /></mesh>
          <pointLight position={[1.05,0.18,0]} color="#ffd27c" intensity={2.2} distance={7} decay={2} />
        </group>;})}
      </group>}

      {/* Middot 3:8: the great golden vine over the entrance. */}
      {!evidence && <group name="golden-vine">
        {vineBranches.map((curve,index)=><mesh key={`branch-${index}`} castShadow><tubeGeometry args={[curve,36,index===0?0.085:0.06,9,false]} /><GoldPlate /></mesh>)}
        {vineLeaves.map((position,index)=><mesh key={`leaf-${index}`} position={position} rotation={[0,0,(index%2?-1:1)*0.55]} scale={[1.55,0.62,0.35]} castShadow><sphereGeometry args={[0.22,14,9]} /><GoldPlate /></mesh>)}
        {[-3.1,-1.6,1.45,3.0].map((x,cluster)=><group key={`cluster-${x}`} position={[x,floor+16.9-(cluster%2)*0.45,front+1.0]}>{Array.from({length:7},(_,grape)=><mesh key={grape} position={[((grape%3)-1)*0.12,-Math.floor(grape/3)*0.15,0]} castShadow><sphereGeometry args={[0.105,12,8]} /><GoldPlate /></mesh>)}</group>)}
      </group>}

      {/* Yoma 3:10: Queen Helena's golden lamp above the entrance. */}
      {!evidence && <group name="helena-golden-lamp" position={[0,floor+21.2,front+0.92]}>
        <mesh rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[0.72,0.72,0.12,32]} /><GoldPlate /></mesh>
        {Array.from({length:12},(_,ray)=>{const angle=ray/12*Math.PI*2;return <mesh key={ray} position={[Math.sin(angle)*0.98,Math.cos(angle)*0.98,0]} rotation={[0,0,-angle]} castShadow><coneGeometry args={[0.13,0.52,8]} /><GoldPlate /></mesh>;})}
        <pointLight position={[0,0,0.5]} color="#ffd878" intensity={9} distance={16} decay={2} />
      </group>}

      {/* A woven entrance screen makes the monumental opening read as an
          occupied sacred threshold. Its weave is Josephus-based; exact hanging
          and ornament are reconstructed and therefore hidden in evidence mode. */}
      {!evidence && <TempleCurtain position={[0, floor + 7.8, front - 0.42]} width={7.65} height={15.6} opacity={0.96} />}

      {/* Josephus, War 5.222: gold-plated outward front, set inside a stone frame. */}
      {!evidence && goldVariant === "josephus-face" && [-1, 1].map((side) => (
        <group key={`gold-${side}`} position={[side * 12.3, goldBottom + goldHeight / 2, front + 0.06]}>
          <mesh castShadow receiveShadow><boxGeometry args={[13.4, goldHeight, 0.12]} /><GoldPlate /></mesh>
          {[-5.35,-2.68,0,2.68,5.35].map((x)=><mesh key={`vertical-joint-${x}`} position={[x,0,0.075]}><boxGeometry args={[0.035,goldHeight-0.18,0.025]} /><meshStandardMaterial color="#8a651a" metalness={0.86} roughness={0.35} /></mesh>)}
          {Array.from({length:8},(_,row)=>{const y=-goldHeight/2+(row+1)*goldHeight/9;return <mesh key={`horizontal-joint-${row}`} position={[0,y,0.075]}><boxGeometry args={[13.18,0.035,0.025]} /><meshStandardMaterial color="#8a651a" metalness={0.86} roughness={0.35} /></mesh>;})}
        </group>
      ))}
      {!evidence && goldVariant === "josephus-face" && <mesh position={[0, (openingTop + 2.5 + goldTop) / 2, front + 0.06]} castShadow receiveShadow><boxGeometry args={[10.4, goldTop - openingTop - 2.5, 0.12]} /><GoldPlate /></mesh>}
      {!evidence && goldVariant === "video-trim" && <>
        <mesh position={[0,openingTop+1.62,front+0.91]} castShadow><boxGeometry args={[12.1,0.32,0.22]} /><GoldPlate /></mesh>
        {[-1,1].map((side)=><mesh key={side} position={[side*4.98,floor+8,front+0.68]} castShadow><boxGeometry args={[0.24,16,0.2]} /><GoldPlate /></mesh>)}
        <mesh position={[0,top-0.12,front-6.8]} castShadow receiveShadow><boxGeometry args={[18.5,0.16,11.5]} /><GoldPlate /></mesh>
        <mesh position={[0,bodyTop-0.13,TEMPLE_BODY_CENTER_Z]} castShadow receiveShadow><boxGeometry args={[18,0.15,TEMPLE_BODY_DEPTH-1.2]} /><GoldPlate /></mesh>
      </>}
      {!evidence && <Instances limit={spikes.length} castShadow>
        <coneGeometry args={[0.06, 0.5, 6]} />
        <GoldPlate />
        {spikes.map((position, index) => <Instance key={index} position={position} />)}
      </Instances>}
    </group>
    </>
  );
}

const flameVertex = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const flameFragment = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
uniform float uSeed;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
void main(){
  float y = vUv.y;
  float turbulence = fbm(vec2(vUv.x * 3.0 + uSeed, y * 2.2 - uTime * 1.5));
  float x = vUv.x - 0.5 + (turbulence - 0.5) * 0.55 * y;
  float width = mix(0.36, 0.03, pow(y, 0.75));
  float body = smoothstep(1.0, 0.15, abs(x) / width);
  float tongues = fbm(vec2(vUv.x * 6.0 + uSeed * 2.0, y * 3.5 - uTime * 2.6));
  float cut = smoothstep(0.98, 0.55 + tongues * 0.35, y);
  float intensity = clamp(body * cut * (0.55 + tongues * 1.1), 0.0, 1.0);
  vec3 edge = vec3(0.9, 0.16, 0.02);
  vec3 mid = vec3(1.0, 0.52, 0.08);
  vec3 core = vec3(1.0, 0.9, 0.55);
  vec3 col = mix(edge, mid, smoothstep(0.12, 0.5, intensity));
  col = mix(col, core, smoothstep(0.55, 0.95, intensity));
  gl_FragColor = vec4(col * 1.7, intensity);
}`;

function FlameSheet({ position, size, seed, speed = 1 }: { position: [number, number, number]; size: [number, number]; seed: number; speed?: number }) {
  const group = useRef<Group>(null);
  const world = useMemo(() => new Vector3(), []);
  const material = useMemo(() => new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSeed: { value: seed } },
    vertexShader: flameVertex,
    fragmentShader: flameFragment,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    opacity: 0.9,
  }), [seed]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame(({ clock, camera }) => {
    material.uniforms.uTime.value = clock.elapsedTime * speed + seed;
    const node = group.current;
    if (!node) return;
    node.getWorldPosition(world);
    node.rotation.y = Math.atan2(camera.position.x - world.x, camera.position.z - world.z);
  });
  return (
    <group ref={group} position={position}>
      <mesh position={[0, size[1] / 2, 0]} renderOrder={5}>
        <planeGeometry args={size} />
        <primitive object={material} attach="material" />
      </mesh>
    </group>
  );
}

function useEmberTextures() {
  return useMemo(() => {
    const make = (draw: (ctx: CanvasRenderingContext2D, size: number) => void) => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (ctx) draw(ctx, size);
      const texture = new CanvasTexture(canvas);
      texture.colorSpace = SRGBColorSpace;
      return texture;
    };
    const soot = make((ctx, size) => {
      const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.08, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, "rgba(22,15,11,0.9)");
      gradient.addColorStop(0.55, "rgba(30,22,16,0.55)");
      gradient.addColorStop(1, "rgba(30,22,16,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    });
    const rand = mulberry32(5);
    const coals = make((ctx, size) => {
      const mask = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size / 2);
      mask.addColorStop(0, "rgba(255,255,255,1)");
      mask.addColorStop(0.7, "rgba(255,255,255,0.85)");
      mask.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = "#1a0c06";
      ctx.fillRect(0, 0, size, size);
      for (let n = 0; n < 220; n += 1) {
        const x = rand() * size;
        const y = rand() * size;
        const r = 3 + rand() * 14;
        const heat = rand();
        ctx.fillStyle = heat > 0.55 ? `rgba(255,${Math.round(110 + heat * 110)},40,${0.35 + rand() * 0.5})` : `rgba(${Math.round(150 + heat * 100)},40,8,0.55)`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = mask;
      ctx.fillRect(0, 0, size, size);
    });
    return { soot, coals };
  }, []);
}

// Altar fire: crossed billboard flames over a log pile and glowing coal bed, replacing the flat orange disc.
export function AltarFire({ actionPulse, topY }: { actionPulse: number; topY: number }) {
  const flames = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const pulseStart = useRef(0);
  const { soot, coals } = useEmberTextures();
  const logs = useMemo(() => {
    const rand = mulberry32(31);
    return Array.from({ length: 16 }, (_, index) => {
      const layer = Math.floor(index / 5);
      const angle = (index % 5) * (Math.PI / 5) + layer * 0.55 + rand() * 0.3;
      return { angle, y: 0.12 + layer * 0.26, radius: 0.07 + rand() * 0.03, length: 1.9 - layer * 0.35 + rand() * 0.3, offset: [(rand() - 0.5) * 0.8, (rand() - 0.5) * 0.8] as [number, number] };
    });
  }, []);

  useEffect(() => {
    if (actionPulse > 0) pulseStart.current = performance.now();
  }, [actionPulse]);

  useFrame(({ clock }) => {
    const naturalFlicker = 1 + Math.sin(clock.elapsedTime * 8.5) * 0.06 + Math.sin(clock.elapsedTime * 13.1) * 0.04;
    const elapsed = performance.now() - pulseStart.current;
    const actionBoost = actionPulse > 0 && elapsed < 1400 ? Math.sin((elapsed / 1400) * Math.PI) * 0.75 : 0;
    if (flames.current) flames.current.scale.set(0.7 * (1 + actionBoost * 0.35), 0.7 * (naturalFlicker + actionBoost), 0.7 * (1 + actionBoost * 0.35));
    if (light.current) light.current.intensity = 18 + naturalFlicker * 2 + actionBoost * 34;
  });

  return (
    <group position={[0, topY, 0]}>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[11, 11]} /><meshStandardMaterial map={soot} transparent roughness={1} depthWrite={false} polygonOffset polygonOffsetFactor={-2} opacity={0.9} /></mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[6.4, 6.4]} /><meshStandardMaterial map={coals} emissiveMap={coals} emissive="#ff6a1a" emissiveIntensity={1.6} color="#2a1208" transparent roughness={1} depthWrite={false} polygonOffset polygonOffsetFactor={-3} opacity={0.9} /></mesh>
      {logs.map((log, index) => (
        <mesh key={index} position={[log.offset[0], log.y, log.offset[1]]} rotation={[0, log.angle, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[log.radius, log.radius * 1.15, log.length, 8]} />
          <meshStandardMaterial color="#2b1d15" emissive="#7c2a0a" emissiveIntensity={0.55} roughness={0.95} />
        </mesh>
      ))}
      <group ref={flames}>
        <FlameSheet position={[-0.9, 0.35, 0.3]} size={[2.5, 3.9]} seed={1.3} />
        <FlameSheet position={[0.8, 0.35, -0.2]} size={[2.3, 3.4]} seed={4.7} speed={1.1} />
        <FlameSheet position={[0.1, 0.35, 0.9]} size={[2.1, 3.0]} seed={8.1} speed={0.9} />
        <FlameSheet position={[-0.2, 0.35, -0.9]} size={[2.6, 4.4]} seed={11.9} speed={1.05} />
        <FlameSheet position={[1.5, 0.3, 0.9]} size={[1.6, 2.2]} seed={15.2} speed={1.2} />
        <FlameSheet position={[-1.6, 0.3, -0.8]} size={[1.7, 2.4]} seed={19.6} speed={0.95} />
        <pointLight ref={light} position={[0, 2.2, 0]} intensity={18} distance={24} decay={2} color="#ff9d45" />
      </group>
    </group>
  );
}

// Woven Babylonian curtain (Josephus, War 5.212): blue, linen, scarlet and purple warp bands, hung in folds.
export function TempleCurtain({ position, width, height, opacity }: { position: [number, number, number]; width: number; height: number; opacity: number }) {
  const geometry = useMemo(() => {
    const cloth = new PlaneGeometry(width, height, 72, 1);
    const positions = cloth.attributes.position;
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      positions.setZ(i, Math.sin(x * 3.1) * 0.17 + Math.sin(x * 7.3 + 1.1) * 0.05);
    }
    cloth.computeVertexNormals();
    return cloth;
  }, [height, width]);
  const map = useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const rand = mulberry32(12);
      ctx.fillStyle = "#641923";
      ctx.fillRect(0,0,size,size);
      // Dense woven field: scarlet ground with blue/purple rosettes and pale
      // linen/gold outlines. It evokes the supplied model without treating its
      // exact floral drawing as preserved archaeological evidence.
      for(let row=0;row<9;row+=1)for(let column=0;column<8;column+=1){
        const x=34+column*64+(row%2)*31;
        const y=30+row*58;
        const radius=12+rand()*4;
        ctx.save();ctx.translate(x,y);ctx.rotate((row+column)*0.42);
        for(let petal=0;petal<8;petal+=1){
          ctx.rotate(Math.PI/4);
          ctx.beginPath();ctx.ellipse(0,-radius*0.72,radius*0.28,radius*0.72,0,0,Math.PI*2);
          ctx.fillStyle=petal%2?"#28376c":"#55235f";ctx.fill();
          ctx.strokeStyle="#d5a54a";ctx.lineWidth=1.4;ctx.stroke();
        }
        ctx.beginPath();ctx.arc(0,0,radius*0.3,0,Math.PI*2);ctx.fillStyle="#d8c9a3";ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle="#d4a74f";ctx.lineWidth=8;ctx.strokeRect(8,8,size-16,size-16);
      ctx.strokeStyle="#24366e";ctx.lineWidth=5;ctx.strokeRect(19,19,size-38,size-38);
      for(let y=0;y<size;y+=2){ctx.fillStyle=`rgba(${rand()>.5?"255,236,200":"25,9,19"},${.025+rand()*.045})`;ctx.fillRect(0,y,size,1);}
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1,1);
    texture.anisotropy = 8;
    return texture;
  }, [height, width]);
  return (
    <group position={position} name="woven-parochet">
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial map={map} roughness={0.9} side={DoubleSide} transparent opacity={opacity} depthWrite={opacity > 0.95} />
      </mesh>
      <mesh position={[0,height/2+0.16,0]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[0.075,0.075,width+0.65,14]} /><GoldPlate /></mesh>
      {Array.from({length:Math.max(5,Math.floor(width/.62))},(_,index)=>{
        const count=Math.max(5,Math.floor(width/.62));
        const x=-width/2+(index+.5)*width/count;
        return <mesh key={index} position={[x,height/2+0.02,0]} rotation={[Math.PI/2,0,0]} castShadow><torusGeometry args={[0.09,0.025,8,14]} /><GoldPlate /></mesh>;
      })}
      {Array.from({length:Math.max(4,Math.floor(width/.8))},(_,index)=>{
        const count=Math.max(4,Math.floor(width/.8));
        const x=-width/2+(index+.5)*width/count;
        return <mesh key={`weight-${index}`} position={[x,-height/2-.09,0]} castShadow><sphereGeometry args={[0.075,12,8]} /><GoldPlate /></mesh>;
      })}
    </group>
  );
}

export function Timber({ color = "#ffffff" }: { color?: string }) {
  const maps = useMemo(() => surfaceProps("wood"), []);
  return <meshStandardMaterial {...maps} color={color} roughness={1} metalness={0} />;
}

export function Linen({ color = "#ffffff", emissive = "#000000", emissiveIntensity = 0 }: { color?: string; emissive?: string; emissiveIntensity?: number }) {
  const maps = useMemo(() => {
    const { map, normalMap, roughnessMap } = getSurfaceSet("linen");
    return { map, normalMap, roughnessMap };
  }, []);
  return <meshStandardMaterial {...maps} color={color} roughness={1} emissive={emissive} emissiveIntensity={emissiveIntensity} />;
}
