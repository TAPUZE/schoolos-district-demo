"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CatmullRomCurve3, Color, Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { PRIEST_HAND_SCALE_XZ, PRIEST_HAND_SCALE_Y, PriestModel } from "./temple-figures";
import { Limestone } from "./temple-surfaces";
import { PARVAH_STAIR, WATER_GATE_BATH_CENTER, WATER_GATE_DRY_LANDING } from "./azarah-structure";
import type { LeadPose } from "./camera-types";
import { getCeremonyBeat, getImmersionPhase, getRitualCounter, YOM_KIPPUR_SERVICE, type CeremonyAction, type CeremonyRole, type CeremonyStage } from "./yom-kippur-ceremony";
import { CHAPTER_EIGHT_BY_BEAT } from "./yoma-chapter-eight";
import type { WildernessSignalVariant } from "./research-variants";
import {
  ALTAR_CENTER_Z, ALTAR_RAMP_ASCENT_ROUTE, ALTAR_TOP_Y, PARVAH_ROOF_Y,
  OUTER_MOUNT_Y, PRIESTS_FLOOR_Y, TEMPLE_FLOOR_Y, TEMPLE_STAIR_ASCENT_ROUTE,
  SLAUGHTER_POST_X, SLAUGHTER_TABLE_X, TEMPLE_EAST_Z, WOMENS_COURT_Y, WOMENS_STAIR_ASCENT_ROUTE,
  KIYOR_POSITION, jerusalemTerrainHeight, WILDERNESS_STATION_XZ, walkableSurfaceHeightAt, type WorldPoint,
} from "./temple-layout";

export const CEREMONY_STAGE_POINTS: Record<CeremonyStage, [number, number, number]> = {
  dawn:[0, 0.05, 1.2], outsideBath:[...WATER_GATE_DRY_LANDING], altar:[8.7, PRIESTS_FLOOR_Y + 0.02, -10.2],
  altarRamp:[(ALTAR_RAMP_ASCENT_ROUTE[0][0]+ALTAR_RAMP_ASCENT_ROUTE[1][0])/2,(ALTAR_RAMP_ASCENT_ROUTE[0][1]+ALTAR_RAMP_ASCENT_ROUTE[1][1])/2,ALTAR_CENTER_Z], laver:[KIYOR_POSITION[0],KIYOR_POSITION[1]+0.02,KIYOR_POSITION[2]],
  parvah:[31, PARVAH_ROOF_Y + 0.05, -19], bull:[7.8, PRIESTS_FLOOR_Y + 0.02, -22], lottery:[10.5, PRIESTS_FLOOR_Y + 0.02, -4.2],
  altarTop:[0, ALTAR_TOP_Y + 0.04, ALTAR_CENTER_Z], incensePrep:[22, PRIESTS_FLOOR_Y + 0.02, -27], holyPlace:[0, TEMPLE_FLOOR_Y + 0.02, -46.5],
  holyOfHolies:[0, TEMPLE_FLOOR_Y + 0.02, -56.7], curtain:[0, TEMPLE_FLOOR_Y + 0.02, -54.2], goldenAltar:[0, TEMPLE_FLOOR_Y + 0.02, -46.5],
  scapegoat:[12, PRIESTS_FLOOR_Y + 0.02, -4], eastGate:[0, 0.05, 2.5], reading:[0, WOMENS_COURT_Y + 0.05, 18], exit:[0, OUTER_MOUNT_Y + 0.05, 124],
};

const wildernessGroundPoint = (x:number,z:number,lift=0.08) => new Vector3(x,jerusalemTerrainHeight(x,z)+lift,z);
const WILDERNESS_TABLEAU_POINT = wildernessGroundPoint(-44,315,2.4);
// A continuous, distance-compressed eastward corridor.  Unlike the old
// detached cone tableau, these points sit directly on the same 3 km terrain
// mesh that forms the mountain skyline behind the Temple.
const WILDERNESS_STATIONS = [
  ...WILDERNESS_STATION_XZ.map(([x,z])=>wildernessGroundPoint(x,z)),
];
const WILDERNESS_CLIFF_POINT = wildernessGroundPoint(-140,510,5.2);
const WILDERNESS_ROUTE = [new Vector3(...CEREMONY_STAGE_POINTS.exit), ...WILDERNESS_STATIONS];
const WILDERNESS_ROAD_CURVE = new CatmullRomCurve3([...WILDERNESS_ROUTE,WILDERNESS_CLIFF_POINT].map((point)=>point.clone().add(new Vector3(0,0.12,0))),false,"centripetal",0.28);
const BURNING_TABLEAU_POINT = new Vector3(15, OUTER_MOUNT_Y + 0.04, 126);
type CrowdPosition = { x:number; y:number; z:number; heading:number; scale:number };

// The crowd is not ambient decoration. Each formation represents a named
// event and a permitted place: Israelite witnesses remain in the narrow Court
// of Israel for the confessions, while listeners form an arc around the Torah
// reading in the Women's Court.
const ISRAEL_COURT_WITNESSES: CrowdPosition[] = [7,6,5].flatMap((count,row)=>
  Array.from({length:count},(_,column)=>({
    x:(column-(count-1)/2)*(row===0?3.15:3.45)+(row===1?0.45:-0.2),
    y:0,
    z:2.12-row*1.18-Math.abs(column-(count-1)/2)*0.055,
    heading:Math.PI,
    scale:0.88+((row*7+column)*13%6)*0.025,
  })),
);
const TORAH_READING_LISTENERS: CrowdPosition[] = [10,8].flatMap((count,row)=>
  Array.from({length:count},(_,column)=>{
    const angle=-1.08+(column/Math.max(1,count-1))*2.16;
    const radius=6.4+row*2.1;
    return {
      x:Math.sin(angle)*radius,
      y:WOMENS_COURT_Y,
      z:18+Math.cos(angle)*radius,
      heading:Math.atan2(-Math.sin(angle)*radius,-Math.cos(angle)*radius),
      scale:0.88+((row*11+column)*17%5)*0.028,
    };
  }),
);
const MAX_CROWD_SIZE=Math.max(ISRAEL_COURT_WITNESSES.length,TORAH_READING_LISTENERS.length);

function crowdFormationForBeat(beatId:string): CrowdPosition[] {
  if(["midnight-ash-removal","bull-first-confession","bull-second-confession","scapegoat-confession"].includes(beatId)) return ISRAEL_COURT_WITNESSES;
  if(["torah-reading","simultaneous-reading-burning"].includes(beatId)) return TORAH_READING_LISTENERS;
  return [];
}

const CROWD_GARMENTS = ["#e8e0d2", "#d3c4aa", "#b89a78", "#c9b596", "#eee7da", "#a98a67"];

const ROLE_LABELS: Record<CeremonyRole, string> = {
  highPriest:"High Priest", deputy:"Deputy", familyHead:"Priestly-family head", appointedPriest:"Appointed priest", dawnObserver:"Dawn observer",
  assistingPriest:"Assisting priest", bloodStirrer:"Blood stirrer", incenseAttendant:"Incense attendant",
  coalAttendant:"Coal-pan attendant", garmentAttendant:"Garment attendant", handlerA:"Animal handler",
  handlerB:"Animal handler", scapegoatEscort:"Scapegoat escort", dignitary:"Jerusalem dignitary", torahAttendant:"Torah attendant", synagogueHead:"Head of synagogue",
  offeringPriest:"Offering priest", burningPriest:"Removal priest", levite:"Levite", congregationPriest:"Priestly congregation", congregationIsraelite:"Israelite congregation",
};

const ROLES = Object.keys(ROLE_LABELS) as CeremonyRole[];
const SERVICE_INDEX_BY_ID = new Map(YOM_KIPPUR_SERVICE.map((item, index) => [item.id, index]));

// Yoma 4:3 calls the blood-stirring station the fourth roved outside the
// Hekhal. Its exact identification is disputed. This prototype selects the
// fourth broad pavement level of the porch approach and labels that choice in
// the research plan; the station uses the measured stair surface rather than
// a free-floating Y coordinate.
const fourthRovedRouteIndex = Math.min(TEMPLE_STAIR_ASCENT_ROUTE.length - 2, 8);
const fourthRovedA = TEMPLE_STAIR_ASCENT_ROUTE[fourthRovedRouteIndex];
const fourthRovedB = TEMPLE_STAIR_ASCENT_ROUTE[fourthRovedRouteIndex + 1];
const FOURTH_ROVED_STATION = new Vector3(2.2, fourthRovedA[1] + 0.02, (fourthRovedA[2] + fourthRovedB[2]) / 2);
const ALTAR_RAMP_FOOT_STATION = new Vector3(...ALTAR_RAMP_ASCENT_ROUTE[0]);

const ROLE_STATIONS: Partial<Record<string, Partial<Record<CeremonyRole, Vector3>>>> = {
  "slaughter-bull": {
    highPriest: new Vector3(7.8, PRIESTS_FLOOR_Y + 0.02, -23.7),
    assistingPriest: new Vector3(9.25, PRIESTS_FLOOR_Y + 0.02, -22.85),
    bloodStirrer: FOURTH_ROVED_STATION,
  },
  "afternoon-lamps": {
    highPriest: new Vector3(-1.9,TEMPLE_FLOOR_Y+0.02,-47),
    assistingPriest: new Vector3(-0.7,TEMPLE_FLOOR_Y+0.02,-46.25),
  },
  "take-coals": {
    highPriest: new Vector3(0, ALTAR_TOP_Y + 0.04, ALTAR_CENTER_Z),
    coalAttendant: ALTAR_RAMP_FOOT_STATION.clone().add(new Vector3(-1.2, 0, 1.1)),
  },
  "yom-kippur-coal-pan": {
    highPriest: new Vector3(0, ALTAR_TOP_Y + 0.04, ALTAR_CENTER_Z),
    coalAttendant: ALTAR_RAMP_FOOT_STATION.clone().add(new Vector3(-1.2, 0, 1.1)),
  },
};
const SERVICE_PARTICIPANT_COUNT: Readonly<Record<string, number>> = {
  "second-lottery": 13,
  "morning-tamid": 9,
  "daily-lamb-procession": 9,
  "ram-procession": 11,
  "bull-procession": 24,
  departure: 8,
  "home-celebration": 8,
};
const isBeatRange = (index: number, firstId: string, lastId: string) => {
  const first = SERVICE_INDEX_BY_ID.get(firstId);
  const last = SERVICE_INDEX_BY_ID.get(lastId);
  return first !== undefined && last !== undefined && index >= first && index <= last;
};
const ROLE_OFFSETS: Record<CeremonyRole, [number, number, number]> = {
  highPriest:[0,0,0], deputy:[-1.35,0,0.35], familyHead:[1.35,0,0.35], appointedPriest:[-1.8,0,1.2], dawnObserver:[1.8,0,1.2],
  assistingPriest:[1.4,0,1], bloodStirrer:[-1.6,0,-0.2], incenseAttendant:[1.2,0,0.8],
  coalAttendant:[-1.2,0,0.9], garmentAttendant:[1.4,0,0.6], handlerA:[-2,0,1.4], handlerB:[2,0,1.4],
  scapegoatEscort:[1.4,0,1.8], dignitary:[-1.8,0,2.2], torahAttendant:[-1.3,0,1], synagogueHead:[1.3,0,1], offeringPriest:[1.7,0,1.3],
  burningPriest:[-1.7,0,1.3], levite:[2.3,0,2], congregationPriest:[-3.1,0,2.6], congregationIsraelite:[3.1,0,2.6],
};

const WAITING_POINTS: Record<CeremonyRole, [number, number, number]> = {
  highPriest:[0,0.05,1], deputy:[-4,0.05,-1], familyHead:[4,0.05,-1], appointedPriest:[-7,0.05,1], dawnObserver:[7,0.05,1],
  assistingPriest:[-9,PRIESTS_FLOOR_Y+0.02,-3], bloodStirrer:[-11,PRIESTS_FLOOR_Y+0.02,-5], incenseAttendant:[16,PRIESTS_FLOOR_Y+0.02,-28],
  coalAttendant:[-12,PRIESTS_FLOOR_Y+0.02,-2], garmentAttendant:[24,PRIESTS_FLOOR_Y+0.02,-14], handlerA:[13,PRIESTS_FLOOR_Y+0.02,-1], handlerB:[16,PRIESTS_FLOOR_Y+0.02,-1],
  scapegoatEscort:[4,0.05,1], dignitary:[8,WOMENS_COURT_Y+0.05,20], torahAttendant:[-5,WOMENS_COURT_Y+0.05,12], synagogueHead:[5,WOMENS_COURT_Y+0.05,12], offeringPriest:[-13,PRIESTS_FLOOR_Y+0.02,-8],
  burningPriest:[20,PRIESTS_FLOOR_Y+0.02,-2], levite:[-8,0.05,1], congregationPriest:[-5,0.05,1.8], congregationIsraelite:[5,0.05,1.8],
};

function rolePosition(index: number, role: CeremonyRole) {
  for (let cursor = index; cursor >= 0; cursor -= 1) {
    const item = YOM_KIPPUR_SERVICE[cursor];
    if (!item.roles.includes(role)) continue;
    const namedStation = ROLE_STATIONS[item.id]?.[role];
    if (namedStation) return namedStation.clone();
    const point = CEREMONY_STAGE_POINTS[item.stage];
    const offset = ROLE_OFFSETS[role];
    const position = new Vector3(point[0] + offset[0], point[1] + offset[1], point[2] + offset[2]);
    if (item.stage !== "outsideBath" && item.stage !== "parvah") {
      position.y = walkableSurfaceHeightAt(position.x, position.z, position.y) + 0.02;
    }
    return position;
  }
  return new Vector3(...WAITING_POINTS[role]);
}

function roleStage(index: number, role: CeremonyRole): CeremonyStage | undefined {
  for (let cursor=index; cursor>=0; cursor-=1) if (YOM_KIPPUR_SERVICE[cursor].roles.includes(role)) return YOM_KIPPUR_SERVICE[cursor].stage;
  return undefined;
}

function positionAlong(points: Vector3[], value: number) {
  if (points.length<2) return points[0].clone();
  const lengths=points.slice(1).map((point,index)=>point.distanceTo(points[index]));
  const total=lengths.reduce((sum,length)=>sum+length,0);
  let remaining=Math.max(0,Math.min(1,value))*total;
  for(let index=0;index<lengths.length;index+=1){
    if(remaining<=lengths[index]||index===lengths.length-1){
      return points[index].clone().lerp(points[index+1],lengths[index]===0?1:remaining/lengths[index]);
    }
    remaining-=lengths[index];
  }
  return points[points.length-1].clone();
}

function positionAlongWildernessStops(value:number){
  const scaled=Math.max(0,Math.min(0.9999,value))*WILDERNESS_STATIONS.length;
  const stationIndex=Math.min(WILDERNESS_STATIONS.length-1,Math.floor(scaled));
  const local=scaled-stationIndex;
  const previous=stationIndex===0?WILDERNESS_ROUTE[0]:WILDERNESS_STATIONS[stationIndex-1];
  const station=WILDERNESS_STATIONS[stationIndex];
  // Roughly the final quarter of every leg is a visible rest/hand-off pause at
  // its staffed booth, instead of an uninterrupted schematic glide.
  return previous.clone().lerp(station,smooth(Math.min(1,local/0.74)));
}

function appendWorldRoute(points: Vector3[], route: readonly WorldPoint[], reverse = false) {
  const ordered = reverse ? [...route].reverse() : route;
  ordered.forEach((point) => points.push(new Vector3(...point)));
}

const PARVAH_STAIR_MID_X = (PARVAH_STAIR.x0 + PARVAH_STAIR.x1) / 2;
// Door in the Azarah wall, across the chamber to the foot of its stair, up to the roof where the immersion place stands.
const PARVAH_ROUTE = [
  new Vector3(27, PRIESTS_FLOOR_Y + 0.05, -25.5),
  new Vector3(32.4, PRIESTS_FLOOR_Y + 0.05, -25.5),
  new Vector3(PARVAH_STAIR_MID_X, PRIESTS_FLOOR_Y + 0.05, PARVAH_STAIR.zBottom - 0.15),
  new Vector3(PARVAH_STAIR_MID_X, PARVAH_ROOF_Y + 0.05, PARVAH_STAIR.zBottom - PARVAH_STAIR.run * PARVAH_STAIR.treads + 0.2),
  new Vector3(31, PARVAH_ROOF_Y + 0.05, -19),
];

function ceremonyRoute(from: Vector3, to: Vector3, fromStage: CeremonyStage | undefined, toStage: CeremonyStage | undefined, value: number) {
  const points=[from.clone()];
  const fromInside=from.z<-28, toInside=to.z<-28;
  const fromWomensCourt=from.z>3, toWomensCourt=to.z>3;

  // Every elevated ritual location has one approved circulation route. These
  // waypoints keep actors on the visible ramp, stairs, and openings instead of
  // interpolating through masonry or stepping vertically onto a platform.
  if(fromStage==="altarTop"&&toStage==="altarRamp") {
    points.push(new Vector3(...ALTAR_RAMP_ASCENT_ROUTE[1]),new Vector3(...CEREMONY_STAGE_POINTS.altarRamp));
  } else if(fromStage==="altarTop") appendWorldRoute(points,ALTAR_RAMP_ASCENT_ROUTE,true);
  if(fromStage==="parvah") points.push(...[...PARVAH_ROUTE].reverse().map((point)=>point.clone()));
  if(fromInside&&!toInside) appendWorldRoute(points,TEMPLE_STAIR_ASCENT_ROUTE,true);
  if(fromWomensCourt&&!toWomensCourt) appendWorldRoute(points,WOMENS_STAIR_ASCENT_ROUTE);
  if(!fromWomensCourt&&toWomensCourt) appendWorldRoute(points,WOMENS_STAIR_ASCENT_ROUTE,true);
  if(!fromInside&&toInside) appendWorldRoute(points,TEMPLE_STAIR_ASCENT_ROUTE);
  if(toStage==="altarRamp"&&fromStage!=="altarTop") {
    points.push(new Vector3(...ALTAR_RAMP_ASCENT_ROUTE[0]),new Vector3(...CEREMONY_STAGE_POINTS.altarRamp));
  }
  if(toStage==="altarTop"&&fromStage==="altarRamp") points.push(new Vector3(...ALTAR_RAMP_ASCENT_ROUTE[1]));
  else if(toStage==="altarTop") appendWorldRoute(points,ALTAR_RAMP_ASCENT_ROUTE);
  if(toStage==="parvah") points.push(...PARVAH_ROUTE.map((point)=>point.clone()));
  points.push(to.clone());
  return positionAlong(points,value);
}

const handOffset = (x: number, y: number, z: number) => new Vector3(x * PRIEST_HAND_SCALE_XZ, y * PRIEST_HAND_SCALE_Y, z * PRIEST_HAND_SCALE_XZ);

function smooth(value: number) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function RitualPriest({ role, setRef, setLabelRef, highPriest = false }: { role: CeremonyRole; setRef: (role: CeremonyRole, node: Group | null) => void; setLabelRef: (role: CeremonyRole, node: HTMLDivElement | null) => void; highPriest?: boolean }) {
  return <group ref={(node) => setRef(role, node)}>
    <PriestModel highPriest={highPriest} vestments={highPriest} variant={ROLES.indexOf(role)} />
    {(highPriest || role === "deputy" || role === "familyHead") && <Html position={[0,1.75,0]} center distanceFactor={16} occlude><div ref={(node)=>{setLabelRef(role,node);}} className={highPriest ? "ceremony-actor-label primary" : "ceremony-actor-label"} hidden>{ROLE_LABELS[role]}</div></Html>}
  </group>;
}

function SteppedImmersionPool() {
  const basinWidth = 2.8;
  const basinLength = 3.2;
  const waterHeight = 1.2;
  return <group name="reconstructed-stepped-immersion-pool">
    {/* The texts fix location and minimum water volume, not this rectangular
        outline, stair width, rim profile, inlet or drain. */}
    <mesh position={[0,0.08,0]} castShadow receiveShadow><boxGeometry args={[basinWidth,0.16,basinLength]} /><Limestone /></mesh>
    {[-1,1].map((side)=><mesh key={`long-${side}`} position={[side*(basinWidth/2-0.11),0.68,0]} castShadow receiveShadow><boxGeometry args={[0.22,1.36,basinLength]} /><Limestone /></mesh>)}
    <mesh position={[0,0.68,-(basinLength/2-0.11)]} castShadow receiveShadow><boxGeometry args={[basinWidth,1.36,0.22]} /><Limestone /></mesh>
    {Array.from({length:4},(_,index)=>{
      const stepHeight=(index+1)*0.24;
      return <mesh key={`step-${index}`} position={[0,stepHeight/2,basinLength/2-0.35-index*0.34]} castShadow receiveShadow><boxGeometry args={[basinWidth-0.44,stepHeight,0.68]} /><Limestone /></mesh>;
    })}
    <mesh position={[0,waterHeight, -0.18]} rotation={[-Math.PI/2,0,0]} renderOrder={2}><planeGeometry args={[basinWidth-0.48,basinLength-0.8]} /><meshStandardMaterial color="#2a6572" roughness={0.05} metalness={0.08} transparent opacity={0.82} depthWrite={false} /></mesh>
  </group>;
}

function Goat({ setRef, setLabelRef, azazel = false }: { setRef: (node: Group | null) => void; setLabelRef: (node: HTMLDivElement | null) => void; azazel?: boolean }) {
  return <group ref={setRef} scale={0.68}>
    <mesh position={[0,0.55,0]} rotation={[0,0,Math.PI/2]} castShadow><capsuleGeometry args={[0.28,0.72,8,16]} /><meshStandardMaterial color="#e5ded0" roughness={0.96} /></mesh>
    <mesh position={[0,0.78,0.62]} rotation={[-0.22,0,0]} castShadow><capsuleGeometry args={[0.2,0.28,7,14]} /><meshStandardMaterial color="#e5ded0" roughness={0.96} /></mesh>
    {[-0.2,0.2].flatMap((x)=>[-0.28,0.28].map((z)=><mesh key={`${x}-${z}`} position={[x,0.23,z]} castShadow><capsuleGeometry args={[0.055,0.35,4,8]} /><meshStandardMaterial color="#c9c0af" roughness={1} /></mesh>))}
    {[-0.12,0.12].map((x)=><mesh key={`horn-${x}`} position={[x,1.02,0.72]} rotation={[0.55,0,x<0?-0.32:0.32]} castShadow><coneGeometry args={[0.045,0.28,10]} /><meshStandardMaterial color="#8d806d" roughness={0.82} /></mesh>)}
    {[-0.2,0.2].map((x)=><mesh key={`ear-${x}`} position={[x,0.91,0.69]} rotation={[Math.PI/2,0,x<0?-0.7:0.7]} castShadow><coneGeometry args={[0.09,0.25,3]} /><meshStandardMaterial color="#d6cdbd" roughness={0.94} /></mesh>)}
    <mesh position={[0,0.62,0.87]} rotation={[0.16,0,Math.PI]} castShadow><coneGeometry args={[0.07,0.26,10]} /><meshStandardMaterial color="#cfc6b6" roughness={0.98} /></mesh>
    <mesh position={[0,0.69,-0.58]} rotation={[0.8,0,0]} castShadow><coneGeometry args={[0.075,0.3,10]} /><meshStandardMaterial color="#d9d1c2" roughness={0.96} /></mesh>
    <mesh name="scarlet" visible={false} position={[0,azazel?1.02:0.88,0.58]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[azazel?0.18:0.22,0.045,8,24]} /><meshStandardMaterial color="#a51f2d" emissive="#6d0712" emissiveIntensity={0.2} /></mesh>
    <group name="roleLabel" visible={false}><Html position={[0,1.45,0]} center distanceFactor={13}><div ref={setLabelRef} className={azazel?"ceremony-animal-label azazel":"ceremony-animal-label lord"} hidden>{azazel?"לעזאזל · For Azazel":"לה׳ · For the Lord"}</div></Html></group>
  </group>;
}

function Animal({ setRef, kind }: { setRef: (node: Group | null) => void; kind: "bull" | "lamb" | "ram" }) {
  const scale = kind === "bull" ? 1.1 : kind === "ram" ? 0.6 : 0.42;
  const color = kind === "bull" ? "#6f4934" : "#ddd5c5";
  return <group ref={setRef} scale={scale}>
    <mesh position={[0,0.62,0]} rotation={[0,0,Math.PI/2]} castShadow><capsuleGeometry args={[0.34,0.95,8,16]} /><meshStandardMaterial color={color} roughness={0.96} /></mesh>
    <mesh position={[0,0.84,0.72]} castShadow><capsuleGeometry args={[0.24,0.32,7,14]} /><meshStandardMaterial color={color} roughness={0.96} /></mesh>
    {[-0.25,0.25].flatMap((x)=>[-0.34,0.34].map((z)=><mesh key={`${x}-${z}`} position={[x,0.27,z]}><capsuleGeometry args={[0.06,0.42,4,8]} /><meshStandardMaterial color={color} roughness={1} /></mesh>))}
    {kind==="ram"&&[-0.22,0.22].map((x)=><mesh key={x} position={[x,1.05,0.72]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[0.2,0.045,8,18,Math.PI*1.55]} /><meshStandardMaterial color="#8d806d" roughness={0.86} /></mesh>)}
  </group>;
}

function ServiceParticipant({ index }: { index: number }) {
  const tamidLoads = ["Head + right hind leg","Two forelegs","Tail + left hind leg","Breast + neck","Two flanks","Innards","Fine flour","Griddle cakes","Wine"];
  const load=tamidLoads[index];
  return <group name={`service-participant-${index}`} visible={false}>
    <PriestModel variant={index + 1} blob={false} />
    <mesh name="participant-tray" position={[0,0.72,0.26]} castShadow><boxGeometry args={[0.42,0.035,0.28]} /><meshStandardMaterial color="#b58a3b" metalness={0.35} roughness={0.42} /></mesh>
    {load&&<group name="tamid-payload" visible={false} position={[0,0.78,0.26]}>
      {index<6?<>
        <mesh rotation={[0,index*.22,Math.PI/2]} castShadow><capsuleGeometry args={[0.075+(index%2)*0.018,0.2+(index%3)*0.055,5,9]} /><meshStandardMaterial color={index%2?"#a05d4e":"#b66d58"} roughness={0.84} /></mesh>
        {[0,1,2,4].includes(index)&&<mesh position={[0.13,0.025,-0.04]} rotation={[0,-index*.18,Math.PI/2]} castShadow><capsuleGeometry args={[0.055,0.15,5,9]} /><meshStandardMaterial color="#9e584a" roughness={0.86} /></mesh>}
      </>:index===6?<group><mesh castShadow><cylinderGeometry args={[0.14,0.18,0.11,16]} /><meshStandardMaterial color="#c39a3b" metalness={0.55} roughness={0.34} /></mesh><mesh position={[0,0.065,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[0.13,16]} /><meshStandardMaterial color="#e8d9ad" roughness={1} /></mesh></group>:index===7?<group>{[0,1,2].map((cake)=><mesh key={cake} position={[0,cake*.045,0]} castShadow><cylinderGeometry args={[0.13,0.14,0.035,16]} /><meshStandardMaterial color="#bd8650" roughness={0.9} /></mesh>)}</group>:<group><mesh castShadow><cylinderGeometry args={[0.11,0.16,0.28,16]} /><meshStandardMaterial color="#ad8247" roughness={0.74} /></mesh><mesh position={[0,0.16,0]}><cylinderGeometry args={[0.055,0.07,0.08,12]} /><meshStandardMaterial color="#8b603c" roughness={0.8} /></mesh></group>}
    </group>}
    {load&&<group name="tamid-load-label" visible={false}><Html position={[0,2.25,0]} center distanceFactor={16}><div className="ceremony-actor-label">{index+1}. {load}</div></Html></group>}
  </group>;
}

function CourtyardWorshipper({ index, setRef }: { index: number; setRef: (index: number, node: Group | null) => void }) {
  return <group ref={(node)=>setRef(index,node)} name={`courtyard-worshipper-${index}`} visible={false}>
    <PriestModel garment={CROWD_GARMENTS[index % CROWD_GARMENTS.length]} variant={index + 2} blob={false} headCover="none" />
  </group>;
}

function applyGesture(group: Group, action: CeremonyAction, active: boolean, progress: number, walking: boolean, clock: number) {
  applyGestureBase(group, action, active, progress, walking, clock);
  const torso = group.getObjectByName("torso");
  const goldUpper = group.getObjectByName("goldUpper");
  if (torso && goldUpper) goldUpper.rotation.copy(torso.rotation);
}

function applyGestureBase(group: Group, action: CeremonyAction, active: boolean, progress: number, walking: boolean, clock: number) {
  const leftArm = group.getObjectByName("leftArm") as Group | undefined;
  const rightArm = group.getObjectByName("rightArm") as Group | undefined;
  const leftLeg = group.getObjectByName("leftLeg") as Mesh | undefined;
  const rightLeg = group.getObjectByName("rightLeg") as Mesh | undefined;
  const torso = group.getObjectByName("torso") as Mesh | undefined;
  const robe = group.getObjectByName("robe") as Mesh | undefined;
  const stride = walking ? Math.sin(clock * 9) * 0.55 : 0;
  if (leftLeg) leftLeg.rotation.x = stride;
  if (rightLeg) rightLeg.rotation.x = -stride;
  if (!leftArm || !rightArm) return;
  leftArm.rotation.set(walking ? -stride : 0,0,0.12);
  rightArm.rotation.set(walking ? stride : 0,0,-0.12);
  if (torso) torso.rotation.set(0,0,0);
  if (robe) robe.rotation.set(0,0,0);
  if (!active || walking) return;
  const pulse = action==="sprinkle"?Math.max(0,Math.sin(progress*Math.PI*8)):Math.sin(Math.min(1,progress)*Math.PI);
  if (action === "confess") { leftArm.rotation.x=-1.22; rightArm.rotation.x=-1.22; leftArm.rotation.z=-0.28; rightArm.rotation.z=0.28; if(torso)torso.rotation.x=-0.12; }
  else if (action === "lottery") { const draw=smooth(Math.min(1,progress*1.8)); leftArm.rotation.x=-0.35-draw*1.45; rightArm.rotation.x=-0.35-draw*1.45; leftArm.rotation.z=-0.38; rightArm.rotation.z=0.38; if(torso)torso.rotation.x=0.18*(1-draw); }
  else if (action === "slaughter") { leftArm.rotation.x=-1.25-0.35*pulse; rightArm.rotation.x=-1.65+0.45*pulse; leftArm.rotation.z=-0.18; rightArm.rotation.z=0.2; if(torso)torso.rotation.x=0.42; if(robe)robe.rotation.x=0.12; }
  else if (action === "sprinkle") { rightArm.rotation.x=-0.45-pulse*1.85; rightArm.rotation.z=-0.2; leftArm.rotation.x=-0.92; leftArm.rotation.z=0.25; if(torso)torso.rotation.x=-0.08*pulse; }
  else if (action === "incense") { leftArm.rotation.x=-1.3+0.18*pulse; rightArm.rotation.x=-1.45-0.16*pulse; leftArm.rotation.z=-0.22; rightArm.rotation.z=0.22; }
  else if (action === "offer") { leftArm.rotation.x=-0.8-1.0*pulse; rightArm.rotation.x=-0.8-1.0*pulse; leftArm.rotation.z=-0.32; rightArm.rotation.z=0.32; }
  else if (action === "pour" || action === "mix") { leftArm.rotation.x=-1.25; rightArm.rotation.x=-0.65-0.75*pulse; leftArm.rotation.z=-0.25; rightArm.rotation.z=0.28; if(torso)torso.rotation.z=-0.12*pulse; }
  else if (action === "change") { leftArm.rotation.x=-1.4*pulse; rightArm.rotation.x=-1.4*pulse; leftArm.rotation.z=-0.6; rightArm.rotation.z=0.6; }
  else if (action === "announce") { rightArm.rotation.x=-1.1-0.45*pulse; rightArm.rotation.z=-0.42; leftArm.rotation.x=-0.28; if(torso)torso.rotation.y=-0.12*pulse; }
  else if (action === "assemble") { leftArm.rotation.x=-0.55-0.2*pulse; rightArm.rotation.x=-0.55-0.2*pulse; leftArm.rotation.z=-0.24; rightArm.rotation.z=0.24; }
  else if (action === "mark") { leftArm.rotation.x=-0.9; rightArm.rotation.x=-1.4-0.28*pulse; rightArm.rotation.z=-0.2; if(torso)torso.rotation.x=0.14; }
  else if (action === "immerse") { leftArm.rotation.x=-0.7; rightArm.rotation.x=-0.7; leftArm.rotation.z=-0.3; rightArm.rotation.z=0.3; }
  else if (["retrieve","carry","handoff"].includes(action)) { leftArm.rotation.x=-1.05-0.22*pulse; rightArm.rotation.x=-1.2+0.18*pulse; leftArm.rotation.z=-0.18; rightArm.rotation.z=0.18; }
  else if (action === "read") { leftArm.rotation.x=-1.15; rightArm.rotation.x=-1.15; leftArm.rotation.z=-0.3; rightArm.rotation.z=0.3; }
  else if (action === "pray") { leftArm.rotation.x=-0.72; rightArm.rotation.x=-0.72; leftArm.rotation.z=0.32; rightArm.rotation.z=-0.32; }
}

export function FullYomKippurCeremony({ timeRef, focusRef, leadPoseRef, hideLeadRef, signalVariant, showWilderness = false }: { timeRef: React.MutableRefObject<number>; focusRef: React.MutableRefObject<Vector3>; leadPoseRef?: React.MutableRefObject<LeadPose>; hideLeadRef?: React.MutableRefObject<boolean>; signalVariant: WildernessSignalVariant; showWilderness?: boolean }) {
  const actors = useRef<Partial<Record<CeremonyRole,Group|null>>>({});
  const actorLabels = useRef<Partial<Record<CeremonyRole,HTMLDivElement|null>>>({});
  const goatLord = useRef<Group|null>(null), goatAzazel = useRef<Group|null>(null), bull = useRef<Group|null>(null), lamb = useRef<Group|null>(null), ramA = useRef<Group|null>(null), ramB = useRef<Group|null>(null);
  const goatLordLabel = useRef<HTMLDivElement|null>(null), goatAzazelLabel = useRef<HTMLDivElement|null>(null), parvahLabel = useRef<HTMLDivElement|null>(null);
  const smoke = useRef<Group|null>(null), bullBloodBowl = useRef<Group|null>(null), goatBloodBowl = useRef<Group|null>(null), coalPan = useRef<Group|null>(null), incenseSpoon = useRef<Group|null>(null), lotteryUrn = useRef<Group|null>(null), ritualKnife = useRef<Group|null>(null), ritualSpray = useRef<Group|null>(null), torah = useRef<Group|null>(null), serviceParticipants = useRef<Group|null>(null);
  const bloodFlow = useRef<Group|null>(null), preparedPortions = useRef<Group|null>(null), lampTools = useRef<Group|null>(null), preparationTools = useRef<Group|null>(null), washStream = useRef<Group|null>(null), preparationLabel = useRef<HTMLDivElement|null>(null);
  const bloodStands = useRef<Group|null>(null), curtainBloodMarks = useRef<Group|null>(null), goldenAltarMarks = useRef<Group|null>(null), remainderStream = useRef<Group|null>(null), incenseGranules = useRef<Group|null>(null), coalEmbers = useRef<Group|null>(null);
  const ashPan = useRef<Group|null>(null), goldPitcher = useRef<Group|null>(null), linenTowel = useRef<Group|null>(null), outsideScreen = useRef<Group|null>(null), parvahScreen = useRef<Group|null>(null), teachingTablet = useRef<Group|null>(null), signalFlags = useRef<Group|null>(null), cliffScarlet = useRef<Group|null>(null), wildernessTableau = useRef<Group|null>(null), burningTableau = useRef<Group|null>(null), menorahServiceLights = useRef<Group|null>(null), homeCelebration = useRef<Group|null>(null), chapterEightTableaux = useRef<Group|null>(null);
  const crowdPeople = useRef<Array<Group|null>>([]), crowdLabel = useRef<HTMLDivElement|null>(null);
  const sanctuarySignal = useRef<Group|null>(null), sanctuarySignalMaterial = useRef<MeshStandardMaterial|null>(null), sanctuarySignalLabel = useRef<HTMLDivElement|null>(null), cliffSignalMaterial = useRef<MeshStandardMaterial|null>(null), cliffGoatSignalMaterial = useRef<MeshStandardMaterial|null>(null), elapsedSignal = useRef<Group|null>(null), elapsedSignalLabel = useRef<HTMLDivElement|null>(null), menorahServiceLabel = useRef<HTMLDivElement|null>(null);
  const wildernessLabel = useRef<HTMLDivElement|null>(null), burningLabel = useRef<HTMLDivElement|null>(null);
  const scarletColor = useMemo(() => new Color("#a51f2d"), []), forgivenColor = useMemo(() => new Color("#f3eee1"), []);
  const lastTelemetryUpdate = useRef(0);
  const goldColor = useMemo(()=>new Color("#f3eee1"),[]), whiteColor = useMemo(()=>new Color("#f3eee1"),[]), ordinaryColor = useMemo(()=>new Color("#9a7652"),[]);

  useFrame(({clock,gl})=>{
    const {beat,index,progress}=getCeremonyBeat(timeRef.current);
    const chapterEightLesson=CHAPTER_EIGHT_BY_BEAT.get(beat.id);
    const immersionPhase=getImmersionPhase(beat,progress);
    const previousBeat=YOM_KIPPUR_SERVICE[Math.max(0,index-1)];
    const nextBeat=YOM_KIPPUR_SERVICE[Math.min(YOM_KIPPUR_SERVICE.length-1,index+1)];
    const destination = new Vector3(...CEREMONY_STAGE_POINTS[beat.stage]);
    let displayedHighPriestGarment=beat.garment;
    const leadRoleEarly=beat.roles.includes("highPriest")?"highPriest":beat.roles[0];
    const travelWindow = ["walk","depart","handoff","carry"].includes(beat.action)?0.68:0.34;
    const travel = smooth(progress/travelWindow);
    ROLES.forEach((role)=>{
      const group=actors.current[role]; if(!group)return;
      const involved=beat.roles.includes(role)||(progress<0.35&&previousBeat.roles.includes(role))||(progress>0.65&&nextBeat.roles.includes(role));
      group.visible=involved&&!(hideLeadRef?.current&&role===leadRoleEarly);
      if(actorLabels.current[role]) actorLabels.current[role]!.hidden=!involved;
      if(!involved)return;
      const from=rolePosition(Math.max(0,index-1),role);
      const remoteBurning=beat.id==="simultaneous-reading-burning"&&role==="burningPriest";
      const to=remoteBurning
        ? BURNING_TABLEAU_POINT.clone().add(new Vector3(0,0,1.1))
        : rolePosition(index,role);
      const fromStage=roleStage(Math.max(0,index-1),role), toStage=roleStage(index,role);
      const routeAt=(value:number)=>remoteBurning
        ? positionAlong([from,new Vector3(0,OUTER_MOUNT_Y+0.05,106),new Vector3(0,OUTER_MOUNT_Y+0.05,116),to],value)
        : ceremonyRoute(from,to,fromStage,toStage,value);
      const routePosition=routeAt(travel);
      const routeAhead=routeAt(Math.min(1,travel+0.012));
      group.position.copy(routePosition);
      const moving=from.distanceTo(to)>0.2&&travel<0.995;
      if(moving&&routeAhead.distanceToSquared(routePosition)>0.000001) group.rotation.y=Math.atan2(routeAhead.x-routePosition.x,routeAhead.z-routePosition.z);
      else if(beat.stage==="bull"||beat.stage==="holyPlace"||beat.stage==="curtain"||beat.stage==="holyOfHolies") group.rotation.y=Math.PI;
      else group.rotation.y=0;
      const highPriestLeads=beat.roles.includes("highPriest");
      const bloodStirring=beat.id==="slaughter-bull"&&role==="bloodStirrer"&&progress>0.5;
      const active=beat.roles.includes(role)&&(!highPriestLeads||role==="highPriest"||(beat.action==="handoff"&&role==="scapegoatEscort")||bloodStirring);
      applyGesture(group,bloodStirring?"mix":beat.action,active,progress,moving,clock.elapsedTime+ROLES.indexOf(role)*0.37);
      if(role==="highPriest"){
        if(beat.action==="immerse"&&(beat.stage==="outsideBath"||beat.stage==="parvah")){
          const center=beat.stage==="outsideBath"
            ? new Vector3(WATER_GATE_BATH_CENTER[0],WATER_GATE_BATH_CENTER[1]+1.22,WATER_GATE_BATH_CENTER[2])
            : new Vector3(31,PARVAH_ROOF_Y+1.22,-15.5);
          const enter=progress<0.34?smooth((progress-0.18)/0.16):progress<0.68?1:1-smooth((progress-0.68)/0.18);
          group.position.lerp(center,Math.max(0,Math.min(1,enter)));
          if(progress>0.36&&progress<0.64) group.position.y-=Math.sin(((progress-0.36)/0.28)*Math.PI)*0.72;
        }
        const previousGarment=YOM_KIPPUR_SERVICE[Math.max(0,index-1)].garment;
        const displayedGarment=beat.action==="immerse"&&progress<0.62?previousGarment:beat.garment;
        displayedHighPriestGarment=displayedGarment;
        const targetColor=displayedGarment==="gold"?goldColor:displayedGarment==="white"?whiteColor:ordinaryColor;
        ["robe","torsoBody"].forEach((name)=>{const mesh=group.getObjectByName(name) as Mesh|undefined; const material=mesh?.material as MeshStandardMaterial|undefined; material?.color.lerp(targetColor,0.14);});
        const gold=group.getObjectByName("goldVestments"); if(gold)gold.visible=displayedGarment==="gold";
        const linenSash=group.getObjectByName("linenSash"); if(linenSash)linenSash.visible=displayedGarment!=="gold";
      }
    });

    // The camera follows the actual lead performer, not the static stage marker.
    // This keeps walking transitions, ramps and room entries centered in frame.
    const leadRole = beat.roles.includes("highPriest") ? "highPriest" : beat.roles[0];
    const leadActor = leadRole ? actors.current[leadRole] : null;
    const participantCount=SERVICE_PARTICIPANT_COUNT[beat.id]??0;
    const participantRows=Math.max(1,Math.ceil(participantCount/6));
    const participantTravel=beat.action==="carry"?smooth(progress/0.68):1;
    const participantFocus=participantCount>0
      ? new Vector3(destination.x,destination.y+0.8,destination.z+5-(participantRows-1)*0.775-participantTravel*4.5)
      : undefined;
    const usesSpecialFocus=["carcasses-removed","wilderness-stations","scapegoat-cliff","wilderness-signal","simultaneous-reading-burning"].includes(beat.id)||Boolean(chapterEightLesson);
    if(!usesSpecialFocus) focusRef.current.lerp(participantFocus??leadActor?.position??destination,0.14);
    const telemetryNow = performance.now();
    if (telemetryNow - lastTelemetryUpdate.current >= 250) {
      lastTelemetryUpdate.current = telemetryNow;
      gl.domElement.dataset.ceremonyBeat = beat.id;
      gl.domElement.dataset.ceremonyLeadRole = leadRole ?? "none";
      gl.domElement.dataset.ceremonyLeadX = (leadActor?.position.x ?? destination.x).toFixed(3);
      gl.domElement.dataset.ceremonyLeadY = (leadActor?.position.y ?? destination.y).toFixed(3);
      gl.domElement.dataset.ceremonyLeadZ = (leadActor?.position.z ?? destination.z).toFixed(3);
      gl.domElement.dataset.ceremonyGoatLordState = beat.id === "carcasses-removed" ? "carcass-removal" : isBeatRange(index,"goat-assembly","slaughter-lord-goat") ? "temple-service" : "hidden";
      gl.domElement.dataset.ceremonyGoatAzazelState = ["scapegoat-departs","wilderness-stations","scapegoat-cliff","carcasses-removed"].includes(beat.id) ? "wilderness-offsite" : isBeatRange(index,"goat-assembly","scapegoat-handoff") ? "temple-service" : "hidden";
      gl.domElement.dataset.ceremonyBullState = beat.id === "carcasses-removed" ? "carcass-removal" : isBeatRange(index,"bull-first-confession","slaughter-bull") ? "temple-service" : "hidden";
    }

    const lotteryPoint=new Vector3(...CEREMONY_STAGE_POINTS.lottery);
    const scapegoatPoint=new Vector3(...CEREMONY_STAGE_POINTS.scapegoat);
    const eastPoint=new Vector3(...CEREMONY_STAGE_POINTS.eastGate);
    const exitPoint=new Vector3(...CEREMONY_STAGE_POINTS.exit);
    const wildernessVisible=["scapegoat-departs","wilderness-stations","scapegoat-cliff"].includes(beat.id)||(beat.id==="wilderness-signal"&&signalVariant==="scarlet");
    const burningVisible=["carcasses-removed","torah-reading","simultaneous-reading-burning"].includes(beat.id);
    if(wildernessTableau.current){
      // Keep the landscape available to the explicit "Goat route" overview
      // even when playback is at another Mishnah; animation actors and labels
      // remain beat-scoped.
      wildernessTableau.current.visible=wildernessVisible||showWilderness;
    }
    if(wildernessLabel.current) wildernessLabel.current.hidden=!wildernessVisible;
    if(burningTableau.current){
      burningTableau.current.visible=burningVisible;
      const smokeGroup=burningTableau.current.getObjectByName("burning-smoke");
      if(smokeGroup){smokeGroup.rotation.y=clock.elapsedTime*0.12; smokeGroup.children.forEach((cloud,cloudIndex)=>{cloud.position.y=1.4+cloudIndex*0.42+Math.sin(clock.elapsedTime*1.2+cloudIndex)*0.12;});}
    }
    if(burningLabel.current) burningLabel.current.hidden=!burningVisible;
    if(serviceParticipants.current){
      serviceParticipants.current.children.forEach((participant,participantIndex)=>{
        const tamidCarriers=beat.id==="morning-tamid"&&progress>0.72;
        participant.visible=participantIndex<participantCount&&(beat.id!=="morning-tamid"||tamidCarriers);
        if(!participant.visible)return;
        const row=Math.floor(participantIndex/2),column=participantIndex%2;
        if(tamidCarriers){
          const carrierProgress=smooth((progress-0.72)/0.28),lane=participantIndex%3,rank=Math.floor(participantIndex/3);
          participant.position.set(SLAUGHTER_TABLE_X-2.45+lane*0.92,PRIESTS_FLOOR_Y,ALTAR_CENTER_Z-1.1+rank*1.12-carrierProgress*2.8);
        }else if(beat.action==="lottery"){
          const arcIndex=participantIndex%8,ring=Math.floor(participantIndex/8);
          const angle=-1.12+arcIndex*(2.24/Math.max(1,Math.min(7,participantCount-1)));
          const radius=3.25+ring*1.3;
          participant.position.set(destination.x+Math.sin(angle)*radius,destination.y,destination.z+Math.cos(angle)*radius);
          participant.rotation.y=angle+Math.PI;
        }else{
          const laneSide=column===0?-1:1;
          participant.position.set(destination.x+laneSide*(0.75+(row%2)*0.12),destination.y,destination.z+4.8-row*1.05-participantTravel*4.5);
          participant.rotation.y=Math.PI;
        }
        participant.position.y=walkableSurfaceHeightAt(participant.position.x,participant.position.z,participant.position.y)+0.02;
        if(beat.action!=="lottery") participant.rotation.y=Math.PI;
        participant.position.y+=Math.abs(Math.sin(clock.elapsedTime*7+participantIndex*0.65))*0.025;
        const tray=participant.getObjectByName("participant-tray"); if(tray)tray.visible=beat.action==="carry"||tamidCarriers;
        const tamidLoad=["morning-tamid","daily-lamb-procession"].includes(beat.id)&&participantIndex<9;
        const payload=participant.getObjectByName("tamid-payload"); if(payload)payload.visible=tamidLoad;
        const loadLabel=participant.getObjectByName("tamid-load-label"); if(loadLabel)loadLabel.visible=tamidLoad;
      });
    }
    const crowdBow = beat.action === "confess"
      ? smooth(Math.min(1, progress / 0.28)) * (1 - smooth(Math.max(0, (progress - 0.72) / 0.2)))
      : 0;
    const crowdFormation=crowdFormationForBeat(beat.id);
    crowdPeople.current.forEach((worshipper,personIndex) => {
      if(!worshipper)return;
      const person=crowdFormation[personIndex];
      worshipper.visible=Boolean(person);
      if(!person)return;
      const stagger = Math.min(1, Math.max(0, crowdBow * 1.22 - (personIndex % 6) * 0.035));
      applyGestureBase(worshipper,"pray",stagger>0.02,stagger,false,clock.elapsedTime+personIndex*0.17);
      worshipper.position.set(person.x,person.y+stagger*0.04,person.z-stagger*0.32);
      worshipper.rotation.set(-stagger*1.12,person.heading,0);
      worshipper.scale.setScalar(person.scale);
    });
    if(crowdLabel.current) crowdLabel.current.hidden = crowdBow < 0.2;
    const markVisible=isBeatRange(index,"mark-goats","scapegoat-cliff");
    if(goatLord.current){
      const carcassRemoval=beat.id==="carcasses-removed";
      goatLord.current.visible=isBeatRange(index,"goat-assembly","slaughter-lord-goat")||carcassRemoval;
      const lordStart=lotteryPoint.clone().add(new Vector3(-1.3,0,2));
      const lordEnd=eastPoint.clone().add(new Vector3(1.15,0,0.7));
      goatLord.current.position.copy(carcassRemoval?lordStart.lerp(lordEnd,smooth(progress)):lordStart);
      goatLord.current.rotation.y=carcassRemoval?0:Math.PI+Math.sin(clock.elapsedTime*1.4)*0.04;
      goatLord.current.rotation.z=beat.id==="slaughter-lord-goat"?smooth(progress)*Math.PI/2:carcassRemoval?Math.PI/2:0;
      const scarlet=goatLord.current.getObjectByName("scarlet");if(scarlet)scarlet.visible=markVisible;
      const label=goatLord.current.getObjectByName("roleLabel");if(label)label.visible=markVisible;
      if(goatLordLabel.current) goatLordLabel.current.hidden=!(goatLord.current.visible&&markVisible);
    }
    if(goatAzazel.current){
      goatAzazel.current.visible=isBeatRange(index,"goat-assembly","carcasses-removed");
      let p=lotteryPoint.clone().add(new Vector3(1.3,0,2));
      if(beat.id==="matched-goats-rule")p=lotteryPoint.clone().add(new Vector3(1.3,0,2));
      if(beat.id==="scapegoat-confession")p=scapegoatPoint.clone().add(new Vector3(0,0,1.5));
      if(beat.id==="scapegoat-handoff")p=scapegoatPoint.clone().add(new Vector3(0,0,1.5)).lerp(eastPoint,smooth(progress));
      if(beat.id==="scapegoat-departs")p=eastPoint.clone().lerp(exitPoint,smooth(progress));
      if(beat.id==="wilderness-stations")p=positionAlongWildernessStops(progress);
      if(beat.id==="scapegoat-cliff")p=WILDERNESS_STATIONS.at(-1)!.clone().lerp(WILDERNESS_CLIFF_POINT,smooth(Math.min(1,progress/0.66)));
      if(beat.id==="carcasses-removed")p=exitPoint;
      goatAzazel.current.position.copy(p);
      if(beat.id==="wilderness-stations"||beat.id==="scapegoat-cliff"){
        const ahead=beat.id==="wilderness-stations"?positionAlongWildernessStops(Math.min(1,progress+0.015)):WILDERNESS_CLIFF_POINT;
        goatAzazel.current.rotation.y=Math.atan2(ahead.x-p.x,ahead.z-p.z);
      }else goatAzazel.current.rotation.y=0;
      if(beat.id==="scapegoat-cliff"&&progress>0.72) goatAzazel.current.visible=false;
      const scarlet=goatAzazel.current.getObjectByName("scarlet");if(scarlet)scarlet.visible=markVisible;
      const label=goatAzazel.current.getObjectByName("roleLabel");if(label)label.visible=markVisible;
      if(goatAzazelLabel.current) goatAzazelLabel.current.hidden=!(goatAzazel.current.visible&&markVisible);
    }
    if(goatAzazel.current&&beat.id==="wilderness-stations"){
      const stationOffsets: Partial<Record<CeremonyRole,Vector3>> = {
        scapegoatEscort:new Vector3(-1.15,0,0.9),
        dignitary:new Vector3(1.2,0,1.05),
        handlerB:new Vector3(0.15,0,1.7),
      };
      Object.entries(stationOffsets).forEach(([role,offset])=>actors.current[role as CeremonyRole]?.position.copy(goatAzazel.current!.position).add(offset));
    }
    if(goatAzazel.current&&beat.id==="scapegoat-cliff"){
      actors.current.scapegoatEscort?.position.copy(goatAzazel.current.position).add(new Vector3(-1.3,0,0.8));
    }
    if(bull.current){
      const preparation=beat.id==="animals-pass-before";
      const procession=beat.id==="bull-procession";
      const carcassRemoval=beat.id==="carcasses-removed";
      bull.current.visible=preparation||procession||isBeatRange(index,"bull-first-confession","carcasses-removed");
      const bullStart=new Vector3(7.8,PRIESTS_FLOOR_Y+0.02,-23.7);
      const bullEnd=eastPoint.clone().add(new Vector3(-1.15,0,-0.7));
      if(preparation) bull.current.position.set(eastPoint.x+2.5,eastPoint.y,eastPoint.z+2);
      else bull.current.position.copy(carcassRemoval?bullStart.lerp(bullEnd,smooth(progress)):bullStart);
      bull.current.rotation.y=preparation?Math.PI:-Math.PI/2;
      bull.current.rotation.z=beat.id==="slaughter-bull"?smooth(progress)*Math.PI/2:(SERVICE_INDEX_BY_ID.get("slaughter-bull")??Infinity)<index&&!preparation&&!procession?Math.PI/2:0;
    }
    if(beat.id==="carcasses-removed"&&bull.current&&goatLord.current){
      focusRef.current.lerp(bull.current.position.clone().lerp(goatLord.current.position,0.5).add(new Vector3(0,0.7,0)),0.2);
    }
    if(beat.id==="wilderness-stations"||beat.id==="scapegoat-cliff"){
      focusRef.current.lerp(goatAzazel.current?.position??WILDERNESS_TABLEAU_POINT,0.2);
    }
    if(beat.id==="simultaneous-reading-burning"){
      const cut=smooth((progress-0.42)/0.16);
      const readingFocus=destination.clone().add(new Vector3(0,0.9,0));
      const burningFocus=BURNING_TABLEAU_POINT.clone().add(new Vector3(0,0.9,0));
      focusRef.current.lerp(readingFocus.lerp(burningFocus,cut),0.18);
    }
    if(lamb.current){
      const presentation=beat.id==="animals-pass-before", procession=["daily-lamb-procession","ram-procession"].includes(beat.id);
      const afternoon=beat.id==="afternoon-tamid";
      const morning=beat.id==="morning-tamid";
      lamb.current.visible=presentation||procession||(morning&&progress<0.64)||afternoon;
      if(morning&&progress>=0.42){
        const rise=smooth((progress-0.42)/0.14);
        lamb.current.position.set(7.2,PRIESTS_FLOOR_Y+0.02,-9).lerp(new Vector3(SLAUGHTER_POST_X,PRIESTS_FLOOR_Y+2.05,ALTAR_CENTER_Z-3.5),rise);
        lamb.current.rotation.z=Math.PI/2+rise*Math.PI/2;
      }else{
        lamb.current.position.set(presentation?eastPoint.x-2.5:afternoon?1.9:7.2,presentation?eastPoint.y:afternoon?ALTAR_TOP_Y+0.04:PRIESTS_FLOOR_Y+0.02,presentation?eastPoint.z+2:afternoon?ALTAR_CENTER_Z-0.8:-9);
        lamb.current.rotation.z=["morning-tamid","afternoon-tamid"].includes(beat.id)?smooth(progress)*Math.PI/2:0;
      }
    }
    [ramA.current,ramB.current].forEach((ram,ramIndex)=>{
      if(!ram)return;
      ram.visible=beat.id==="rams-musaf";
      if(!ram.visible)return;
      const rampRoute=ALTAR_RAMP_ASCENT_ROUTE.map((point)=>new Vector3(...point));
      const p=positionAlong(rampRoute,smooth(Math.min(1,progress/0.58)));
      ram.position.copy(p).add(new Vector3(ramIndex===0?-1.15:1.15,0,ramIndex===0?-0.5:0.5));
      ram.rotation.y=Math.PI;
      ram.rotation.z=progress>0.68?smooth((progress-0.68)/0.2)*Math.PI/2:0;
    });
    if(beat.id==="morning-incense"){
      const moveToMenorah=smooth((progress-0.44)/0.16);
      actors.current.highPriest?.position.set(0,TEMPLE_FLOOR_Y+0.02,-46).lerp(new Vector3(-1.9,TEMPLE_FLOOR_Y+0.02,-47),moveToMenorah);
      actors.current.incenseAttendant?.position.set(1.25,TEMPLE_FLOOR_Y+0.02,-45.8).lerp(new Vector3(-0.7,TEMPLE_FLOOR_Y+0.02,-46.25),moveToMenorah);
    }
    if(smoke.current){
      const incenseBeat=["inner-incense","morning-incense","afternoon-incense"].includes(beat.id);
      smoke.current.visible=incenseBeat&&progress>0.3;
      if(smoke.current.visible){
        const source=beat.id==="inner-incense"
          ? new Vector3(0,TEMPLE_FLOOR_Y+0.62,-56.7)
          : new Vector3(0,TEMPLE_FLOOR_Y+0.92,-46.5);
        smoke.current.position.copy(source);
        smoke.current.scale.setScalar(0.45+smooth((progress-0.3)/0.7)*2.55);
        smoke.current.rotation.y=clock.elapsedTime*0.15;
      }
    }
    if(menorahServiceLights.current){
      const lampService=beat.id==="afternoon-lamps"||(beat.id==="morning-incense"&&progress>0.48);
      menorahServiceLights.current.visible=lampService;
      if(menorahServiceLabel.current) menorahServiceLabel.current.hidden=!lampService;
      if(lampService){
        const activeLamp=Math.min(6,Math.floor(progress*7));
        menorahServiceLights.current.children.filter((child)=>child.name.startsWith("service-lamp")).forEach((lamp,lampIndex)=>{
          const lit=beat.id==="afternoon-lamps"?lampIndex<=activeLamp:lampIndex>=activeLamp;
          lamp.visible=lit;
          lamp.scale.setScalar(lampIndex===activeLamp?1.25:0.88+0.14*Math.sin(clock.elapsedTime*6+lampIndex));
        });
        if(menorahServiceLabel.current){
          const heading=menorahServiceLabel.current.querySelector("strong");
          if(heading) heading.textContent=beat.id==="afternoon-lamps"?`Relighting lamp ${activeLamp+1} of 7`:`Tending lamp ${activeLamp+1} of 7`;
        }
        const activeCup=new Vector3(-3,TEMPLE_FLOOR_Y+1.34,-47+(activeLamp-3)*0.22);
        focusRef.current.lerp(activeCup,0.2);
        gl.domElement.dataset.ceremonyMenorahLamp=`${activeLamp+1}/7`;
        gl.domElement.dataset.ceremonyMenorahAction=beat.id==="afternoon-lamps"?"relight":"trim-clean-oil";
      }else{
        gl.domElement.dataset.ceremonyMenorahLamp="";
        gl.domElement.dataset.ceremonyMenorahAction="none";
      }
    }else{
      gl.domElement.dataset.ceremonyMenorahLamp="";
      gl.domElement.dataset.ceremonyMenorahAction="none";
    }
    if(homeCelebration.current){homeCelebration.current.visible=beat.id==="home-celebration"; if(homeCelebration.current.visible){homeCelebration.current.children.forEach((item,itemIndex)=>{if(item.name==="celebration-lamp")item.scale.setScalar(0.88+0.13*Math.sin(clock.elapsedTime*5+itemIndex));});}}
    if(chapterEightTableaux.current){
      chapterEightTableaux.current.children.forEach((scene)=>{scene.visible=scene.name===beat.id; if(scene.visible)scene.rotation.y=Math.sin(clock.elapsedTime*0.45)*0.035;});
      if(chapterEightLesson) focusRef.current.lerp(destination.clone().add(new Vector3(-2.4,0.8,0)),0.18);
    }
    const highPriestPosition=actors.current.highPriest?.position??destination;
    if(outsideScreen.current) outsideScreen.current.visible=beat.id==="first-immersion";
    if(parvahScreen.current) parvahScreen.current.visible=beat.action==="immerse"&&beat.stage==="parvah";
    if(parvahLabel.current) parvahLabel.current.hidden=!(beat.action==="immerse"&&beat.stage==="parvah");
    const bullBowlVisible=["morning-tamid","slaughter-bull","slaughter-lord-goat","bull-blood-inside","goat-blood-inside","bull-blood-curtain","goat-blood-curtain","mix-blood","golden-altar-blood","pour-remainder"].includes(beat.id);
    const goatBowlVisible=["slaughter-lord-goat","goat-blood-inside","bull-blood-curtain","goat-blood-curtain","mix-blood"].includes(beat.id);
    const standA=new Vector3(-1.15,TEMPLE_FLOOR_Y+0.94,-43.8), standB=new Vector3(1.15,TEMPLE_FLOOR_Y+0.94,-43.8);
    if(bloodStands.current) bloodStands.current.visible=isBeatRange(index,"slaughter-lord-goat","mix-blood");
    if(bullBloodBowl.current){
      bullBloodBowl.current.visible=bullBowlVisible;
      if(beat.id==="slaughter-bull"){
        const receiver=actors.current.highPriest?.position.clone().add(handOffset(-0.42,0.72,-0.36))??destination.clone();
        const stirrer=actors.current.bloodStirrer?.position.clone().add(handOffset(-0.42,1.18,-0.22))??receiver;
        const transfer=smooth((progress-0.42)/0.28);
        bullBloodBowl.current.position.copy(receiver).lerp(stirrer,transfer);
        bullBloodBowl.current.rotation.y=transfer*Math.PI*0.35+Math.sin(clock.elapsedTime*7)*0.08*smooth((progress-0.68)/0.12);
      }else if(["slaughter-lord-goat","goat-blood-inside","goat-blood-curtain"].includes(beat.id)){
        bullBloodBowl.current.position.copy(standB);
      }else{
        bullBloodBowl.current.position.copy(actors.current.highPriest?.position??destination).add(handOffset(-0.48,1.18,-0.22));
      }
      bullBloodBowl.current.rotation.z=(beat.action==="pour"||beat.action==="mix")?-0.8*smooth(progress):0;
    }
    if(bloodFlow.current){
      const flowing=beat.id==="slaughter-bull"&&progress>0.22&&progress<0.44;
      bloodFlow.current.visible=flowing;
      if(flowing){
        const bowlPosition=bullBloodBowl.current?.position??highPriestPosition;
        bloodFlow.current.position.copy(bowlPosition).add(new Vector3(0,0.46,0));
        bloodFlow.current.scale.y=0.65+0.18*Math.sin(clock.elapsedTime*16);
      }
    }
    if(goatBloodBowl.current){
      goatBloodBowl.current.visible=goatBowlVisible;
      if(["bull-blood-inside","bull-blood-curtain"].includes(beat.id)) goatBloodBowl.current.position.copy(standA);
      else goatBloodBowl.current.position.copy(highPriestPosition).add(handOffset(beat.id==="mix-blood"?0.5:-0.48,1.18,-0.22));
      goatBloodBowl.current.rotation.z=beat.id==="mix-blood"?0.8*smooth(progress):0;
    }
    const coalPanVisible=["take-coals","yom-kippur-coal-pan","prepare-incense","carry-incense","inner-incense","foundation-stone","retrieve-vessels"].includes(beat.id);
    if(coalPan.current){
      coalPan.current.visible=coalPanVisible;
      const hand=highPriestPosition.clone().add(handOffset(0.5,1.08,-0.25));
      const resting=new Vector3(0,TEMPLE_FLOOR_Y+0.55,-56.7);
      if(beat.id==="inner-incense") coalPan.current.position.copy(hand).lerp(resting,smooth((progress-0.08)/0.22));
      else coalPan.current.position.copy(beat.id==="retrieve-vessels"?resting.lerp(hand,smooth((progress-0.3)/0.45)):hand);
      coalPan.current.rotation.z=beat.action==="incense"?-0.32*smooth(progress):0;
    }
    if(incenseSpoon.current){
      incenseSpoon.current.visible=["prepare-incense","carry-incense","inner-incense","retrieve-vessels","afternoon-incense"].includes(beat.id);
      const hand=highPriestPosition.clone().add(handOffset(-0.5,1.12,-0.24));
      const resting=new Vector3(-0.45,TEMPLE_FLOOR_Y+0.58,-56.55);
      incenseSpoon.current.position.copy(beat.id==="retrieve-vessels"?resting.lerp(hand,smooth((progress-0.34)/0.44)):hand);
      incenseSpoon.current.rotation.z=beat.id==="inner-incense"?0.7*smooth(progress):0;
    }
    if(coalEmbers.current){
      coalEmbers.current.visible=["take-coals","yom-kippur-coal-pan","prepare-incense","carry-incense","inner-incense"].includes(beat.id);
      if(coalEmbers.current.visible){coalEmbers.current.position.copy(coalPan.current?.position??highPriestPosition);coalEmbers.current.position.y+=0.075;coalEmbers.current.rotation.y=clock.elapsedTime*0.4;}
    }
    if(incenseGranules.current){
      const depositing=beat.id==="inner-incense"&&progress>0.2;
      incenseGranules.current.visible=depositing;
      if(depositing){const spoon=incenseSpoon.current?.position??highPriestPosition;const pan=new Vector3(0,TEMPLE_FLOOR_Y+0.64,-56.7);incenseGranules.current.position.copy(spoon).lerp(pan,smooth((progress-0.2)/0.35));incenseGranules.current.rotation.y=clock.elapsedTime*1.4;}
    }
    if(preparedPortions.current){
      const preparing=beat.id==="morning-tamid"&&progress>0.64;
      const carrying=["morning-completion","daily-lamb-procession"].includes(beat.id);
      preparedPortions.current.visible=preparing||carrying;
      if(preparedPortions.current.visible){
        const tablePosition=new Vector3(SLAUGHTER_TABLE_X,PRIESTS_FLOOR_Y+0.58,ALTAR_CENTER_Z-3.5);
        const carrier=actors.current.offeringPriest?.position.clone().add(new Vector3(0,0.78,-0.1))??tablePosition;
        const tamidTransfer=beat.id==="morning-tamid"?smooth((progress-0.82)/0.15):0;
        const firstCarrier=new Vector3(SLAUGHTER_TABLE_X-2.8,PRIESTS_FLOOR_Y+0.78,ALTAR_CENTER_Z-3.25);
        preparedPortions.current.position.copy(tablePosition).lerp(beat.id==="morning-tamid"?firstCarrier:carrier,beat.id==="morning-tamid"?tamidTransfer:carrying?smooth(progress/0.42):0);
      }
    }
    if(preparationTools.current){
      const preparing=beat.id==="morning-tamid"&&progress>=0.42&&progress<0.88;
      preparationTools.current.visible=preparing;
      if(preparing){
        preparationTools.current.position.set(SLAUGHTER_TABLE_X,PRIESTS_FLOOR_Y,ALTAR_CENTER_Z-3.5);
        const washing=progress>=0.64;
        const basin=preparationTools.current.getObjectByName("washing-basin"); if(basin)basin.visible=washing;
        const jug=preparationTools.current.getObjectByName("washing-jug"); if(jug){jug.visible=washing;jug.rotation.z=-0.2-0.75*smooth((progress-0.64)/0.18);}
        if(washStream.current){washStream.current.visible=washing&&progress<0.82;washStream.current.scale.y=0.45+0.4*Math.sin(clock.elapsedTime*9);}
        if(preparationLabel.current){
          preparationLabel.current.hidden=false;
          const phase=progress<0.56?"Suspend at the hooks":progress<0.64?"Flay and divide":progress<0.82?"Wash portions at the marble tables":"Assign portions to nine carriers";
          const heading=preparationLabel.current.querySelector("strong");
          if(heading) heading.textContent=phase;
        }
      }
    }
    if(preparationLabel.current&&!(beat.id==="morning-tamid"&&progress>=0.42&&progress<0.88)) preparationLabel.current.hidden=true;
    if(beat.id==="morning-tamid"){
      const prepFocus=progress<0.42
        ? new Vector3(7.2,PRIESTS_FLOOR_Y+0.75,-9)
        : progress<0.64
          ? new Vector3(SLAUGHTER_POST_X,PRIESTS_FLOOR_Y+1.35,ALTAR_CENTER_Z-3.5)
          : progress<0.82
            ? new Vector3(SLAUGHTER_TABLE_X,PRIESTS_FLOOR_Y+0.7,ALTAR_CENTER_Z-3.5)
            : new Vector3(SLAUGHTER_TABLE_X-0.4,PRIESTS_FLOOR_Y+0.9,ALTAR_CENTER_Z-3.2);
      focusRef.current.lerp(prepFocus,0.18);
      gl.domElement.dataset.ceremonyPreparationPhase=progress<0.22?"slaughter":progress<0.42?"blood-service":progress<0.56?"hooks":progress<0.64?"flaying-division":progress<0.82?"washing":progress<0.94?"nine-carriers":"altar-procession";
    }else gl.domElement.dataset.ceremonyPreparationPhase="none";
    if(lampTools.current){
      lampTools.current.visible=beat.id==="afternoon-lamps"||(beat.id==="morning-incense"&&progress>0.48);
      if(lampTools.current.visible){
        const activeLamp=Math.min(6,Math.floor(progress*7));
        const activeCup=new Vector3(-3,TEMPLE_FLOOR_Y+1.34,-47+(activeLamp-3)*0.22);
        lampTools.current.position.copy(highPriestPosition).add(handOffset(-0.46,1.04,-0.3)).lerp(activeCup,0.72);
        lampTools.current.rotation.z=-0.2+Math.sin(progress*Math.PI*8)*0.16;
      }
    }
    if(lotteryUrn.current){lotteryUrn.current.visible=beat.id==="goat-assembly"||beat.id==="draw-lots"||beat.id==="mark-goats"; lotteryUrn.current.position.copy(lotteryPoint).add(new Vector3(0,0,0.5)); const lid=lotteryUrn.current.getObjectByName("lotA"); if(lid){lid.position.y=beat.id==="draw-lots"?0.72+smooth(progress)*0.75:0.72; lid.position.x=beat.id==="draw-lots"?-0.18-smooth(progress)*0.32:-0.18;} const lotB=lotteryUrn.current.getObjectByName("lotB"); if(lotB){lotB.position.y=beat.id==="draw-lots"?0.72+smooth(progress)*0.75:0.72; lotB.position.x=beat.id==="draw-lots"?0.18+smooth(progress)*0.32:0.18;}}
    if(ritualKnife.current){ritualKnife.current.visible=beat.action==="slaughter"; ritualKnife.current.position.copy(highPriestPosition).add(handOffset(0.48,0.82,-0.35)); ritualKnife.current.rotation.set(0.2,0,-0.75+Math.sin(progress*Math.PI)*0.7);}
    if(ashPan.current){
      const visible=["midnight-ash-removal","original-ramp-race"].includes(beat.id);
      ashPan.current.visible=visible;
      if(visible){const holder=actors.current.appointedPriest??leadActor; ashPan.current.position.copy(holder?.position??destination).add(handOffset(0.48,0.9,-0.32)); ashPan.current.rotation.z=-0.28-0.34*Math.sin(progress*Math.PI);}
    }
    if(goldPitcher.current){
      goldPitcher.current.visible=beat.id==="central-ramp-and-gold-pitcher"||immersionPhase?.sanctification!==undefined;
      if(goldPitcher.current.visible){const attendant=actors.current.garmentAttendant; goldPitcher.current.position.copy(attendant?.position??highPriestPosition).lerp(highPriestPosition,0.42).add(handOffset(0,1.12,-0.36)); goldPitcher.current.rotation.z=-0.32*smooth(progress);}
    }
    if(linenTowel.current){
      linenTowel.current.visible=immersionPhase?.title==="עָלָה וְנִסְתַּפֵּג";
      if(linenTowel.current.visible){const attendant=actors.current.garmentAttendant; linenTowel.current.position.copy(attendant?.position??highPriestPosition).lerp(highPriestPosition,0.55).add(handOffset(0,1.15,-0.42)); linenTowel.current.rotation.set(-0.3,0,0.08*Math.sin(progress*Math.PI*8));}
    }
    if(teachingTablet.current){
      teachingTablet.current.visible=beat.action==="read"&&beat.id!=="torah-reading";
      if(teachingTablet.current.visible){teachingTablet.current.position.copy(leadActor?.position??destination).add(handOffset(0,1.24,-0.46)); teachingTablet.current.rotation.set(-0.42,0,0);}
    }
    if(signalFlags.current){
      signalFlags.current.visible=beat.id==="wilderness-signal"&&signalVariant==="flags";
      if(signalFlags.current.visible){const signaler=actors.current.dignitary; signalFlags.current.position.copy(signaler?.position??destination).add(new Vector3(0,0.25,0)); signalFlags.current.children.forEach((flag,flagIndex)=>{flag.rotation.z=(flagIndex===0?-1:1)*(0.22+Math.sin(clock.elapsedTime*5+flagIndex)*0.5);});}
    }
    if(sanctuarySignal.current){
      sanctuarySignal.current.visible=beat.id==="wilderness-signal"&&signalVariant==="scarlet";
      const whitening=smooth(Math.max(0,(progress-0.42)/0.38));
      sanctuarySignalMaterial.current?.color.copy(scarletColor).lerp(forgivenColor,whitening);
      if(sanctuarySignalLabel.current) sanctuarySignalLabel.current.hidden=!sanctuarySignal.current.visible;
      if(sanctuarySignal.current.visible){
        sanctuarySignal.current.scale.y=0.96+Math.sin(clock.elapsedTime*2.2)*0.025;
        const doorwayFocus=progress<0.56?WILDERNESS_CLIFF_POINT.clone().add(new Vector3(0,1.4,0)):new Vector3(3.9,TEMPLE_FLOOR_Y+5.2,TEMPLE_EAST_Z+0.2);
        focusRef.current.lerp(doorwayFocus,0.16);
      }
    }
    if(cliffSignalMaterial.current){
      const whitening=beat.id==="wilderness-signal"&&signalVariant==="scarlet"?smooth(Math.max(0,(progress-0.18)/0.34)):0;
      cliffSignalMaterial.current.color.copy(scarletColor).lerp(forgivenColor,whitening);
      cliffGoatSignalMaterial.current?.color.copy(scarletColor).lerp(forgivenColor,whitening);
    }
    if(elapsedSignal.current){
      elapsedSignal.current.visible=beat.id==="wilderness-signal"&&signalVariant==="elapsed";
      if(elapsedSignalLabel.current) elapsedSignalLabel.current.hidden=!elapsedSignal.current.visible;
      if(elapsedSignal.current.visible){
        const official=actors.current.dignitary;
        elapsedSignal.current.position.copy(official?.position??destination).add(new Vector3(0,0.18,0));
        elapsedSignal.current.children.filter((child)=>child.name.startsWith("mil-marker")).forEach((marker,index)=>{
          marker.scale.setScalar(index<=Math.floor(progress*3)?1.08:0.78);
        });
        focusRef.current.lerp(elapsedSignal.current.position.clone().add(new Vector3(0,1.1,0)),0.16);
      }
    }
    if(beat.id==="wilderness-signal"&&signalVariant==="flags"){
      focusRef.current.lerp(new Vector3(...CEREMONY_STAGE_POINTS.eastGate).add(new Vector3(0,1.1,0)),0.16);
    }
    if(cliffScarlet.current){
      cliffScarlet.current.visible=beat.id==="scapegoat-cliff"||(beat.id==="wilderness-signal"&&signalVariant==="scarlet");
      if(cliffScarlet.current.visible){cliffScarlet.current.position.copy(WILDERNESS_CLIFF_POINT).add(new Vector3(0,1.1,0)); const tied=beat.id==="wilderness-signal"?1:smooth(Math.min(1,progress/0.58)); const rockHalf=cliffScarlet.current.getObjectByName("rock-half"); const goatHalf=cliffScarlet.current.getObjectByName("goat-half"); if(rockHalf)rockHalf.scale.x=0.25+0.75*tied; if(goatHalf){goatHalf.position.x=0.2+1.25*tied; goatHalf.rotation.z=-0.4*tied;}}
    }
    const ritualCounter=getRitualCounter(beat,progress);
    if(ritualSpray.current){
      ritualSpray.current.visible=ritualCounter!==null;
      if(ritualCounter){
        const start=highPriestPosition.clone().add(handOffset(0.5,1.05,-0.28));
        let target=destination.clone().add(new Vector3(0,0.95,-1.15));
        if(beat.id==="golden-altar-blood"){
          const corners=[[-0.62,1.05,-0.58],[0.62,1.05,-0.58],[0.62,1.05,0.58],[-0.62,1.05,0.58]] as const;
          const corner=corners[Math.min(3,ritualCounter.current-1)];
          target=ritualCounter.current<=4
            ? new Vector3(corner[0],TEMPLE_FLOOR_Y+corner[1],-46.5+corner[2])
            : new Vector3((ritualCounter.current-8)*0.12,TEMPLE_FLOOR_Y+1.08,-46.5);
        }
        const pulse=(progress*ritualCounter.total)%1;
        ritualSpray.current.children.forEach((drop,dropIndex)=>{
          const along=Math.max(0,Math.min(1,pulse+dropIndex*0.14));
          drop.visible=along>0&&along<1;
          drop.position.copy(start).lerp(target,along);
          drop.scale.setScalar(0.58+Math.sin(along*Math.PI)*0.42);
        });
      }
    }
    if(curtainBloodMarks.current){
      const curtainBeat=["bull-blood-curtain","goat-blood-curtain"].includes(beat.id);
      curtainBloodMarks.current.visible=curtainBeat;
      const count=curtainBeat&&ritualCounter?ritualCounter.current:0;
      curtainBloodMarks.current.children.forEach((mark,markIndex)=>{mark.visible=markIndex<count;});
    }
    if(goldenAltarMarks.current){
      const altarBeat=beat.id==="golden-altar-blood";
      goldenAltarMarks.current.visible=altarBeat;
      const count=altarBeat&&ritualCounter?ritualCounter.current:0;
      goldenAltarMarks.current.children.forEach((mark,markIndex)=>{mark.visible=markIndex<count;});
    }
    if(remainderStream.current){
      const pouring=beat.id==="pour-remainder"&&progress>0.28;
      remainderStream.current.visible=pouring;
      if(pouring){remainderStream.current.position.set(0,PRIESTS_FLOOR_Y+0.78,ALTAR_CENTER_Z-4.78);remainderStream.current.scale.y=0.45+0.55*smooth((progress-0.28)/0.3);}
    }
    if(torah.current){
      torah.current.visible=beat.id==="torah-reading";
      if(beat.id==="torah-reading"){
        const chain=[actors.current.torahAttendant,actors.current.synagogueHead,actors.current.deputy,actors.current.highPriest].filter(Boolean) as Group[];
        const scaled=Math.min(0.999,progress)*chain.length, holderIndex=Math.min(chain.length-1,Math.floor(scaled));
        const nextIndex=Math.min(chain.length-1,holderIndex+1), handoff=smooth((scaled-holderIndex)*1.7);
        torah.current.position.copy(chain[holderIndex].position).lerp(chain[nextIndex].position,handoff).add(handOffset(0,1.25,-0.38));
      }
    }
    if(leadPoseRef){
      const leadPose=leadPoseRef.current;
      leadPose.position.copy(focusRef.current);
      if(leadActor&&!usesSpecialFocus&&!participantFocus){leadPose.heading=leadActor.rotation.y;leadPose.hasActor=true;}else leadPose.hasActor=false;
    }
    gl.domElement.dataset.ceremonyProps = [
      ashPan.current?.visible ? "ash-pan" : "",
      goldPitcher.current?.visible ? "gold-pitcher" : "",
      linenTowel.current?.visible ? "linen-towel" : "",
      outsideScreen.current?.visible||parvahScreen.current?.visible ? "linen-privacy-screen" : "",
      teachingTablet.current?.visible ? "teaching-tablet" : "",
      signalFlags.current?.visible ? "signal-flags" : "",
      elapsedSignal.current?.visible ? "elapsed-three-mil" : "",
      sanctuarySignal.current?.visible ? "sanctuary-scarlet-signal" : "",
      cliffScarlet.current?.visible ? "scarlet-halves" : "",
      ritualKnife.current?.visible ? "ritual-knife" : "",
      bullBloodBowl.current?.visible ? "bull-blood-bowl" : "",
      goatBloodBowl.current?.visible ? "goat-blood-bowl" : "",
      bloodStands.current?.visible ? "golden-blood-bowl-stands" : "",
      coalPan.current?.visible ? "coal-pan" : "",
      incenseSpoon.current?.visible ? "incense-spoon" : "",
      incenseGranules.current?.visible ? "incense-granules" : "",
      goldenAltarMarks.current?.visible ? "golden-altar-blood-marks" : "",
      remainderStream.current?.visible ? "outer-altar-remainder" : "",
      torah.current?.visible ? "torah-scroll" : "",
      ramA.current?.visible&&ramB.current?.visible ? "two-rams" : "",
      lamb.current?.visible&&beat.id==="afternoon-tamid" ? "afternoon-lamb" : "",
      menorahServiceLights.current?.visible ? "menorah-lamp-service" : "",
      homeCelebration.current?.visible ? "home-celebration" : "",
      chapterEightLesson ? `chapter8-${chapterEightLesson.visual}` : "",
    ].filter(Boolean).join(",");
    gl.domElement.dataset.ceremonySignalVariant=signalVariant;
    gl.domElement.dataset.ceremonyRitualStep=ritualCounter?.spokenHebrew??"";
    gl.domElement.dataset.ceremonyRitualCount=ritualCounter?`${ritualCounter.current}/${ritualCounter.total}`:"";
    gl.domElement.dataset.ceremonyImmersion=immersionPhase?.immersion?`${immersionPhase.immersion}/5`:"";
    gl.domElement.dataset.ceremonySanctification=immersionPhase?.sanctification?`${immersionPhase.sanctification}/10`:"";
    gl.domElement.dataset.ceremonyImmersionPhase=immersionPhase?.title??"";
    gl.domElement.dataset.ceremonyGarment=displayedHighPriestGarment;
    gl.domElement.dataset.ceremonyOffsiteSet=wildernessVisible?beat.id==="scapegoat-cliff"?"wilderness-cliff":"wilderness-stations":burningVisible?"burning-place":"none";
    gl.domElement.dataset.ceremonyGuidedShot=beat.id==="simultaneous-reading-burning"?(progress<0.42?"torah-reading":progress<0.58?"transition":"burning-place"):beat.stage;
    gl.domElement.dataset.chapterEightVisual=chapterEightLesson?.visual??"none";
  });

  return <group>
    {ROLES.map((role)=><RitualPriest key={role} role={role} highPriest={role==="highPriest"} setRef={(key,node)=>{actors.current[key]=node;}} setLabelRef={(key,node)=>{actorLabels.current[key]=node;}} />)}
    <Goat setRef={(node)=>{goatLord.current=node;}} setLabelRef={(node)=>{goatLordLabel.current=node;}} /><Goat azazel setRef={(node)=>{goatAzazel.current=node;}} setLabelRef={(node)=>{goatAzazelLabel.current=node;}} />
    <Animal kind="bull" setRef={(node)=>{bull.current=node;}} /><Animal kind="lamb" setRef={(node)=>{lamb.current=node;}} />
    <Animal kind="ram" setRef={(node)=>{ramA.current=node;}} /><Animal kind="ram" setRef={(node)=>{ramB.current=node;}} />
    <group ref={serviceParticipants}>{Array.from({length:24},(_,index)=><ServiceParticipant key={index} index={index} />)}</group>
    <group name="yom-kippur-courtyard-crowd">
      {Array.from({length:MAX_CROWD_SIZE},(_,index)=><CourtyardWorshipper key={index} index={index} setRef={(key,node)=>{crowdPeople.current[key]=node;}} />)}
      <Html position={[0,WOMENS_COURT_Y+3.1,13]} center distanceFactor={22}><div ref={crowdLabel} className="ceremony-offsite-label" hidden><strong>הכהנים והעם כורעים ומשתחווים</strong><span>תגובת המשנה; הכריעה מפורשת ברמב״ם עבודת יוה״כ ב׳:ז׳</span></div></Html>
    </group>
    <group ref={menorahServiceLights} visible={false} position={[-3,TEMPLE_FLOOR_Y+1.34,-47]}>
      {Array.from({length:7},(_,lamp)=><group name={`service-lamp-${lamp}`} key={lamp} position={[0,0,(lamp-3)*0.22]}>
        <mesh><sphereGeometry args={[0.068,12,8]} /><meshStandardMaterial color="#ffd26b" emissive="#ff8a28" emissiveIntensity={3.4} /></mesh>
        <mesh position={[0,-0.07,0]}><cylinderGeometry args={[0.008,0.011,0.09,7]} /><meshStandardMaterial color="#34261a" roughness={0.95} /></mesh>
      </group>)}
      <Html position={[0,1.15,0]} center distanceFactor={13}><div ref={menorahServiceLabel} className="ceremony-offsite-label" hidden><strong>Menorah service</strong><span>Cup-by-cup teaching order · exact order remains interpretive</span></div></Html>
    </group>
    <group ref={homeCelebration} visible={false} position={[0,OUTER_MOUNT_Y+0.03,126]}>
      <mesh position={[0,-0.02,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[6.6,40]} /><meshStandardMaterial color="#8c6d4c" roughness={1} /></mesh>
      <mesh position={[0,0.52,0]} castShadow><cylinderGeometry args={[1.7,1.85,0.36,28]} /><meshStandardMaterial color="#725035" roughness={0.9} /></mesh>
      <mesh position={[0,0.73,0]} castShadow><cylinderGeometry args={[1.58,1.68,0.12,28]} /><meshStandardMaterial color="#c39a56" roughness={0.82} /></mesh>
      {Array.from({length:8},(_,lamp)=>{const angle=lamp/8*Math.PI*2;return <group key={lamp} position={[Math.sin(angle)*4.1,0.1,Math.cos(angle)*4.1]}>
        <mesh position={[0,0.42,0]}><cylinderGeometry args={[0.035,0.05,0.8,9]} /><meshStandardMaterial color="#6f4d32" roughness={0.9} /></mesh>
        <mesh name="celebration-lamp" position={[0,0.9,0]}><sphereGeometry args={[0.1,12,8]} /><meshStandardMaterial color="#ffd073" emissive="#ff922e" emissiveIntensity={2.6} /></mesh>
      </group>;})}
    </group>
    <group ref={chapterEightTableaux} position={[0,WOMENS_COURT_Y+0.04,18]}>
      <group name="afflictions-of-the-day" visible={false} position={[-5,0,0]}>
        {Array.from({length:6},(_,item)=>{const angle=item/6*Math.PI*2;return <group key={item} position={[Math.sin(angle)*2.25,0,Math.cos(angle)*2.25]}>
          <PriestModel garment={CROWD_GARMENTS[item]} variant={item+4} blob={false} />
        </group>;})}
      </group>
      <group name="food-drink-measures" visible={false} position={[-5,0,0]}>
        <mesh position={[0,0.65,0]}><boxGeometry args={[3.8,0.12,0.28]} /><meshStandardMaterial color="#a77b3e" roughness={0.74} /></mesh>
        <mesh position={[0,0.3,0]}><cylinderGeometry args={[0.09,0.13,0.65,12]} /><meshStandardMaterial color="#806044" roughness={0.82} /></mesh>
        <mesh position={[-1.45,0.82,0]}><sphereGeometry args={[0.42,18,12]} /><meshStandardMaterial color="#6f4930" roughness={0.9} /></mesh>
        <group position={[1.45,0.88,0]}><mesh><cylinderGeometry args={[0.34,0.28,0.55,18]} /><meshStandardMaterial color="#b99451" roughness={0.68} /></mesh><mesh position={[0,0.22,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[0.25,18]} /><meshStandardMaterial color="#668a96" roughness={0.32} /></mesh></group>
      </group>
      <group name="liability-categories" visible={false} position={[-5,0,0]}>
        {[-1.8,0,1.8].map((x,group)=><group key={x} position={[x,0,0]}>
          <mesh position={[0,0.03,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[0.82,0.94,30]} /><meshBasicMaterial color={["#d6b45c","#77aaa8","#a78ac0"][group]} /></mesh>
          {Array.from({length:group+2},(_,token)=><mesh key={token} position={[(token-(group+1)/2)*0.34,0.28,0]}><boxGeometry args={[0.24,0.45,0.24]} /><meshStandardMaterial color={["#d6b45c","#77aaa8","#a78ac0"][group]} roughness={0.78} /></mesh>)}
        </group>)}
      </group>
      <group name="children-and-fasting" visible={false} position={[-5,0,0]}>
        {[0,1,2].map((level)=><group key={level} position={[(level-1)*1.7,0,0]}>
          <group scale={0.62+level*0.15}><PriestModel garment={CROWD_GARMENTS[level+1]} variant={level+8} blob={false} /></group>
        </group>)}
      </group>
      <group name="health-over-fasting" visible={false} position={[-5,0,0]}>
        <group position={[-0.85,0,0]} rotation={[0,0,-0.08]}><PriestModel garment="#c8b394" variant={5} blob={false} /></group>
        <group position={[0.9,0,0]} rotation={[0,-0.55,0]}><PriestModel garment="#eee7da" variant={9} blob={false} /></group>
        <group position={[0.15,0.72,0.28]}>
          <mesh castShadow><cylinderGeometry args={[0.18,0.13,0.22,18]} /><meshStandardMaterial color="#b28a4b" roughness={0.62} /></mesh>
          <mesh position={[0,0.13,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[0.13,18]} /><meshStandardMaterial color="#805c32" roughness={0.8} /></mesh>
        </group>
      </group>
      <group name="danger-overrides-prohibition" visible={false} position={[-5,0,0]}>
        <mesh position={[0,0.055,0]} receiveShadow><boxGeometry args={[4.1,0.1,2.3]} /><meshStandardMaterial color="#76594b" roughness={0.96} /></mesh>
        <group position={[-0.7,0.12,0]} rotation={[0,0,-Math.PI/2]} scale={0.92}><PriestModel garment="#d9d1c4" variant={4} blob={false} /></group>
        <group position={[1.05,0,0.25]} rotation={[0,-0.55,0]}><PriestModel garment="#eee7db" variant={8} blob={false} /></group>
        <mesh position={[0.55,0.35,-0.55]} castShadow><cylinderGeometry args={[0.22,0.17,0.42,18]} /><meshStandardMaterial color="#ad8247" roughness={0.72} /></mesh>
      </group>
      <group name="rescue-from-rubble" visible={false} position={[-5,0,0]}>
        {Array.from({length:9},(_,stone)=><mesh key={stone} position={[(stone%3-1)*0.9,0.28+Math.floor(stone/3)*0.48,(stone%2)*0.45]} rotation={[stone*.13,stone*.2,stone*.07]}><boxGeometry args={[0.95,0.52,0.68]} /><meshStandardMaterial color="#756958" roughness={1} /></mesh>)}
        <group position={[-0.3,0.12,-0.72]} rotation={[0,0,Math.PI/2]} scale={0.82}><PriestModel garment="#e7dfd2" variant={6} blob={false} /></group>
        <mesh position={[0,1.75,0]} rotation={[0,0,0.2]}><boxGeometry args={[4.2,0.18,0.3]} /><meshStandardMaterial color="#d5ad54" roughness={0.72} /></mesh>
      </group>
      <group name="atonement-and-repentance" visible={false} position={[-5,0,0]}>
        <group position={[0,0.08,0]} rotation={[-0.82,0,0]}><PriestModel garment="#eee6d5" variant={5} blob={false} /></group>
        <group position={[0,0.2,-1.35]} rotation={[-0.32,0,0]}>
          <mesh castShadow><boxGeometry args={[0.95,0.08,0.62]} /><meshStandardMaterial color="#795635" roughness={0.82} /></mesh>
          <mesh position={[0,0.07,0]}><boxGeometry args={[0.78,0.035,0.5]} /><meshStandardMaterial color="#d4bd82" roughness={0.9} /></mesh>
        </group>
      </group>
      <group name="reconciliation-and-hope" visible={false} position={[-5,0,0]}>
        {[-1.45,1.45].map((x)=><group key={x} position={[x,0,0]}>
          <PriestModel garment={x<0?"#d9d1c4":"#eee7db"} variant={x<0?3:7} blob={false} />
        </group>)}
        <mesh position={[0,0.55,0]}><boxGeometry args={[2.3,0.18,0.46]} /><meshStandardMaterial color="#d6ad55" roughness={0.7} /></mesh>
      </group>
    </group>
    <group ref={wildernessTableau} visible={false}>
      <mesh name="wilderness-mountain-road" castShadow receiveShadow>
        <tubeGeometry args={[WILDERNESS_ROAD_CURVE,160,0.36,8,false]} />
        <meshStandardMaterial color="#b29567" roughness={1} />
      </mesh>
      {WILDERNESS_STATIONS.map((point,station)=><group key={station} position={point} rotation={[0,station%2?0.4:-0.3,0]}>
        <mesh position={[0,0.85,0]} castShadow><boxGeometry args={[1.7,1.45,1.45]} /><meshStandardMaterial color={station%2?"#ad895e":"#b99668"} roughness={0.98} /></mesh>
        <mesh position={[0,1.75,0]} rotation={[0,Math.PI/4,0]} castShadow><coneGeometry args={[1.42,0.65,4]} /><meshStandardMaterial color="#7b6248" roughness={1} /></mesh>
        <mesh position={[0,0.7,-0.74]}><boxGeometry args={[0.72,1.2,0.08]} /><meshStandardMaterial color="#4e3b2c" roughness={1} /></mesh>
        <mesh position={[0.72,0.32,0.85]}><boxGeometry args={[1.05,0.12,0.55]} /><meshStandardMaterial color="#725438" roughness={1} /></mesh>
        <mesh position={[0.95,0.62,0.86]} castShadow><cylinderGeometry args={[0.16,0.2,0.58,12]} /><meshStandardMaterial color="#a76e45" roughness={0.92} /></mesh>
        <group position={[-1.05,0,0.7]} scale={0.72}><PriestModel garment={station%2?"#d8d0bf":"#bda987"} variant={station+1} blob={false} /></group>
        <Html position={[0,2.25,0]} center distanceFactor={28}><div className="route-station-label">{station+1}</div></Html>
      </group>)}
      <group position={WILDERNESS_CLIFF_POINT}>
        <mesh position={[0,-4.1,0]} rotation={[0,0.3,0]} castShadow receiveShadow><dodecahedronGeometry args={[4.25,1]} /><meshStandardMaterial color="#5f5141" roughness={1} /></mesh>
        <mesh position={[0,-6.2,4.2]} rotation={[-0.2,0.25,0.08]} castShadow><dodecahedronGeometry args={[4.8,1]} /><meshStandardMaterial color="#4f4438" roughness={1} /></mesh>
      </group>
      <Html position={[-44,jerusalemTerrainHeight(-44,315)+12,315]} center distanceFactor={68}><div ref={wildernessLabel} className="ceremony-offsite-label" hidden><strong>עשר סוכות בדרך למדבר</strong><span>מסלול הררי רציף · המרחק דחוס להמחשה · משנה יומא ו׳:ד׳–ו׳</span></div></Html>
    </group>
    <group ref={burningTableau} visible={false} position={[BURNING_TABLEAU_POINT.x,BURNING_TABLEAU_POINT.y,BURNING_TABLEAU_POINT.z]}>
      <mesh position={[0,-0.025,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><circleGeometry args={[6.8,44]} /><meshStandardMaterial color="#76634e" roughness={1} /></mesh>
      <mesh position={[0,0.02,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[3.3,5.8,44]} /><meshStandardMaterial color="#4c4035" roughness={1} /></mesh>
      {[-1.15,1.15].map((x)=><group key={x} position={[x,0.34,0]} rotation={[0,0,Math.PI/2]}>
        <mesh castShadow><capsuleGeometry args={[0.42,1.45,8,18]} /><meshStandardMaterial color="#b8a98f" roughness={0.98} /></mesh>
        <mesh position={[0,0,-0.43]}><boxGeometry args={[0.62,1.75,0.06]} /><meshStandardMaterial color="#85735d" roughness={1} /></mesh>
      </group>)}
      <mesh position={[0,0.18,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[2.05,36]} /><meshStandardMaterial color="#ba5b28" emissive="#8b2d13" emissiveIntensity={0.55} roughness={0.8} /></mesh>
      <group name="burning-smoke">{[0,1,2,3,4].map((cloud)=><mesh key={cloud} position={[(cloud-2)*0.3,1.4+cloud*0.42,0]}><sphereGeometry args={[0.58+cloud*0.12,14,10]} /><meshStandardMaterial color="#786f65" transparent opacity={0.2} depthWrite={false} /></mesh>)}</group>
      <Html position={[0,3.8,-3.3]} center distanceFactor={24}><div ref={burningLabel} className="ceremony-offsite-label" hidden><strong>בית השריפה</strong><span>מיקום חוץ־מקדשי סכמטי · משנה יומא ו׳:ז׳; ז׳:ב׳</span></div></Html>
    </group>
    <group position={WATER_GATE_BATH_CENTER}>
      <SteppedImmersionPool />
      <Html position={[0,2.2,0]} center distanceFactor={20}><div className="ceremony-prop-label">First immersion · Water Gate roof · reconstructed section</div></Html>
    </group>
    <group position={CEREMONY_STAGE_POINTS.outsideBath}>
      <group ref={outsideScreen} visible={false} position={[0,1.45,0]}><mesh><boxGeometry args={[4,2.8,0.07]} /><meshStandardMaterial color="#efe9dc" roughness={0.92} side={2} /></mesh>{[-2.05,2.05].map((x)=><mesh key={x} position={[x,0,0]}><cylinderGeometry args={[0.045,0.055,3.05,10]} /><meshStandardMaterial color="#75543a" roughness={0.85} /></mesh>)}</group>
    </group>
    <group position={[31,PARVAH_ROOF_Y,-15.5]}>
      <SteppedImmersionPool />
      <Html position={[0,3,0]} center distanceFactor={20}><div ref={parvahLabel} className="ceremony-prop-label" hidden>Parvah immersion place</div></Html>
    </group>
    <group position={CEREMONY_STAGE_POINTS.parvah}>
      <group ref={parvahScreen} visible={false} position={[0,1.45,0]}><mesh><boxGeometry args={[4,2.8,0.07]} /><meshStandardMaterial color="#efe9dc" roughness={0.92} side={2} /></mesh>{[-2.05,2.05].map((x)=><mesh key={x} position={[x,0,0]}><cylinderGeometry args={[0.045,0.055,3.05,10]} /><meshStandardMaterial color="#75543a" roughness={0.85} /></mesh>)}</group>
    </group>
    <group ref={smoke} visible={false}>{[0,1,2,3].map((item)=><mesh key={item} position={[(item-1.5)*0.25,item*0.32,0]}><sphereGeometry args={[0.5+item*0.12,14,10]} /><meshStandardMaterial color="#d7d1c1" transparent opacity={0.16} depthWrite={false} /></mesh>)}</group>
    <group ref={bullBloodBowl} visible={false} scale={0.55}><mesh><cylinderGeometry args={[0.26,0.34,0.16,20]} /><meshStandardMaterial color="#b99235" metalness={0.72} roughness={0.28} /></mesh><mesh position={[0,0.085,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[0.245,20]} /><meshStandardMaterial color="#6d1720" roughness={0.55} /></mesh></group>
    <group ref={goatBloodBowl} visible={false} scale={0.55}><mesh><cylinderGeometry args={[0.26,0.34,0.16,20]} /><meshStandardMaterial color="#c3a04a" metalness={0.72} roughness={0.28} /></mesh><mesh position={[0,0.085,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[0.245,20]} /><meshStandardMaterial color="#7b2028" roughness={0.55} /></mesh></group>
    <group ref={bloodStands} visible={false}>
      {[-1.15,1.15].map((x)=><group key={x} position={[x,TEMPLE_FLOOR_Y,-43.8]}><mesh position={[0,0.45,0]} castShadow><cylinderGeometry args={[0.18,0.28,0.9,18]} /><meshStandardMaterial color="#c79b38" metalness={0.78} roughness={0.3} /></mesh><mesh position={[0,0.92,0]} castShadow><cylinderGeometry args={[0.42,0.34,0.08,20]} /><meshStandardMaterial color="#d3a846" metalness={0.8} roughness={0.26} /></mesh></group>)}
    </group>
    <group ref={coalPan} visible={false} scale={0.6}><mesh><cylinderGeometry args={[0.24,0.32,0.14,20]} /><meshStandardMaterial color="#b88a2f" metalness={0.72} roughness={0.28} /></mesh><mesh position={[0.45,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[0.035,0.035,0.7,10]} /><meshStandardMaterial color="#b88a2f" metalness={0.72} roughness={0.28} /></mesh></group>
    <group ref={coalEmbers} visible={false}>{Array.from({length:9},(_,ember)=>{const angle=ember/9*Math.PI*2;return <mesh key={ember} position={[Math.sin(angle)*0.1,(ember%3)*0.025,Math.cos(angle)*0.1]}><dodecahedronGeometry args={[0.045+(ember%2)*0.015,0]} /><meshStandardMaterial color="#f06a28" emissive="#ff3d0a" emissiveIntensity={2.1} roughness={0.8} /></mesh>;})}</group>
    <group ref={incenseSpoon} visible={false} scale={0.6}><mesh><sphereGeometry args={[0.2,18,12,0,Math.PI*2,0,Math.PI/2]} /><meshStandardMaterial color="#c39a3b" metalness={0.68} roughness={0.3} /></mesh><mesh position={[0.36,0.02,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[0.025,0.035,0.62,10]} /><meshStandardMaterial color="#c39a3b" metalness={0.68} roughness={0.3} /></mesh></group>
    <group ref={incenseGranules} visible={false}>{Array.from({length:18},(_,grain)=>{const angle=grain/18*Math.PI*2;return <mesh key={grain} position={[Math.sin(angle)*0.11,(grain%4)*0.018,Math.cos(angle)*0.11]}><sphereGeometry args={[0.022,7,5]} /><meshStandardMaterial color="#8b5d32" roughness={0.94} /></mesh>;})}</group>
    <group ref={lotteryUrn} visible={false} scale={0.8}><mesh position={[0,0.42,0]}><cylinderGeometry args={[0.48,0.38,0.72,20]} /><meshStandardMaterial color="#8e6337" roughness={0.72} /></mesh>{[-0.18,0.18].map((x,item)=><mesh key={x} name={item===0?"lotA":"lotB"} position={[x,0.72,0]}><boxGeometry args={[0.22,0.06,0.32]} /><meshStandardMaterial color={item===0?"#d3ae4f":"#cfc8b6"} metalness={item===0?0.55:0.08} roughness={0.35} /></mesh>)}</group>
    <group ref={ritualKnife} visible={false}><mesh rotation={[0,0,Math.PI/2]}><boxGeometry args={[0.06,0.5,0.025]} /><meshStandardMaterial color="#b9bcc0" metalness={0.72} roughness={0.24} /></mesh><mesh position={[0,-0.31,0]}><boxGeometry args={[0.1,0.18,0.06]} /><meshStandardMaterial color="#6f492d" roughness={0.72} /></mesh></group>
    <group ref={bloodFlow} visible={false}>
      <mesh position={[0,-0.2,0]}><cylinderGeometry args={[0.018,0.035,0.48,8]} /><meshStandardMaterial color="#68131b" roughness={0.56} /></mesh>
      <mesh position={[0,-0.48,0]}><sphereGeometry args={[0.045,10,8]} /><meshStandardMaterial color="#7b2028" roughness={0.5} /></mesh>
    </group>
    <group ref={preparedPortions} visible={false}>
      {[[-0.5,0,0],[-0.18,0.03,-0.13],[0.17,0.02,0.1],[0.48,0,-0.08]].map((position,index)=><mesh key={index} position={position as [number,number,number]} rotation={[0,index*0.45,Math.PI/2]} castShadow><capsuleGeometry args={[0.12+index*0.012,0.32+index*0.07,5,10]} /><meshStandardMaterial color={index%2?"#9f5748":"#b66d58"} roughness={0.82} /></mesh>)}
    </group>
    <group ref={preparationTools} visible={false}>
      <mesh name="washing-basin" visible={false} position={[0,0.48,0]} castShadow><cylinderGeometry args={[0.48,0.58,0.2,24]} /><meshStandardMaterial color="#d7d0c2" roughness={0.62} /></mesh>
      <mesh name="washing-jug" visible={false} position={[-0.72,0.9,0]} rotation={[0,0,-0.2]} castShadow><cylinderGeometry args={[0.16,0.22,0.48,18]} /><meshStandardMaterial color="#a9814f" roughness={0.78} /></mesh>
      <group ref={washStream} visible={false} position={[-0.51,0.62,0]}><mesh position={[0,-0.22,0]}><cylinderGeometry args={[0.014,0.025,0.46,8]} /><meshStandardMaterial color="#8db9c2" transparent opacity={0.7} roughness={0.18} /></mesh></group>
      <mesh position={[0.72,0.62,0]} rotation={[0,0,Math.PI/2]} castShadow><boxGeometry args={[0.045,0.48,0.025]} /><meshStandardMaterial color="#b9bcc0" metalness={0.7} roughness={0.25} /></mesh>
      <mesh position={[0.72,0.34,0]} castShadow><boxGeometry args={[0.1,0.18,0.06]} /><meshStandardMaterial color="#6f492d" roughness={0.72} /></mesh>
      <Html position={[0,1.85,0]} center distanceFactor={15}><div ref={preparationLabel} className="ceremony-offsite-label" hidden><strong>Preparation</strong><span>Hooks and marble tables · Mishnah Tamid 4:2–3</span></div></Html>
    </group>
    <group ref={lampTools} visible={false}>
      <mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[0.018,0.022,0.62,8]} /><meshStandardMaterial color="#b58a35" metalness={0.74} roughness={0.3} /></mesh>
      <mesh position={[0.35,0,0]}><sphereGeometry args={[0.075,12,8]} /><meshStandardMaterial color="#ded5bf" roughness={0.94} /></mesh>
      <mesh position={[-0.35,0,0]}><cylinderGeometry args={[0.065,0.085,0.12,12]} /><meshStandardMaterial color="#c69b3c" metalness={0.78} roughness={0.26} /></mesh>
    </group>
    <group ref={ashPan} visible={false} scale={0.6}><mesh><cylinderGeometry args={[0.22,0.3,0.16,18]} /><meshStandardMaterial color="#9c663b" metalness={0.55} roughness={0.42} /></mesh><mesh position={[0.42,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[0.03,0.035,0.66,10]} /><meshStandardMaterial color="#8b5733" metalness={0.5} roughness={0.46} /></mesh><mesh position={[0,0.1,0]}><sphereGeometry args={[0.19,12,8]} /><meshStandardMaterial color="#4b4037" roughness={1} /></mesh></group>
    <group ref={goldPitcher} visible={false} scale={0.7}><mesh><cylinderGeometry args={[0.17,0.25,0.52,20]} /><meshStandardMaterial color="#d2a33e" metalness={0.84} roughness={0.22} /></mesh><mesh position={[0.27,0.08,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[0.16,0.025,8,18,Math.PI]} /><meshStandardMaterial color="#d2a33e" metalness={0.84} roughness={0.22} /></mesh><mesh position={[-0.19,0.2,0]} rotation={[0,0,-0.45]}><coneGeometry args={[0.08,0.24,12]} /><meshStandardMaterial color="#d2a33e" metalness={0.84} roughness={0.22} /></mesh></group>
    <group ref={linenTowel} visible={false}><mesh><boxGeometry args={[0.88,0.58,0.035]} /><meshStandardMaterial color="#eee8dc" roughness={0.98} side={2} /></mesh><mesh position={[0,0.18,-0.021]}><boxGeometry args={[0.72,0.02,0.008]} /><meshBasicMaterial color="#d6cdbd" /></mesh><mesh position={[0,-0.18,-0.021]}><boxGeometry args={[0.72,0.02,0.008]} /><meshBasicMaterial color="#d6cdbd" /></mesh></group>
    <group ref={teachingTablet} visible={false}><mesh><boxGeometry args={[0.72,0.48,0.035]} /><meshStandardMaterial color="#d9c89f" roughness={0.88} /></mesh>{[-0.14,0,0.14].map((y)=><mesh key={y} position={[0,y,-0.022]}><boxGeometry args={[0.5,0.018,0.012]} /><meshBasicMaterial color="#584a3a" /></mesh>)}</group>
    <group ref={signalFlags} visible={false}>{[-1,1].map((side)=><group key={side} position={[side*0.38,1.15,0]}><mesh position={[0,0.42,0]}><cylinderGeometry args={[0.018,0.022,0.9,8]} /><meshStandardMaterial color="#765035" roughness={0.84} /></mesh><mesh position={[side*0.16,0.68,0]}><planeGeometry args={[0.34,0.28]} /><meshStandardMaterial color="#ece6d7" side={2} roughness={0.95} /></mesh></group>)}</group>
    <group ref={elapsedSignal} visible={false}>
      {[-0.52,0,0.52].map((x,index)=><group key={x} name={`mil-marker-${index}`} position={[x,1.18,0]}>
        <mesh castShadow><cylinderGeometry args={[0.14,0.18,0.12,16]} /><meshStandardMaterial color={index===0?"#d9b45d":"#d8d0be"} roughness={0.82} /></mesh>
        <mesh position={[0,0.13,0]} castShadow><boxGeometry args={[0.05,0.18,0.05]} /><meshStandardMaterial color="#73543b" roughness={0.9} /></mesh>
      </group>)}
      <Html position={[0,1.72,0]} center distanceFactor={14}><div ref={elapsedSignalLabel} className="ceremony-offsite-label" hidden><strong>חישוב זמן ההליכה</strong><span>שלושה מילין · דעת רבי יהודה · משנה יומא ו׳:ח׳</span></div></Html>
    </group>
    <group ref={sanctuarySignal} visible={false} position={[4.12,TEMPLE_FLOOR_Y+4.8,TEMPLE_EAST_Z+0.72]}>
      <mesh position={[0,-1.5,0]} castShadow><boxGeometry args={[0.16,3.2,0.08]} /><meshStandardMaterial ref={sanctuarySignalMaterial} color="#a51f2d" roughness={0.78} /></mesh>
      <Html position={[0.3,0.55,0]} center distanceFactor={15}><div ref={sanctuarySignalLabel} className="ceremony-offsite-label" hidden><strong>לשון של זהורית בפתח ההיכל</strong><span>אות חלופי לדעת רבי ישמעאל · משנה יומא ו׳:ח׳</span></div></Html>
    </group>
    <group ref={cliffScarlet} visible={false}><mesh name="rock-half" position={[-0.35,0,0]}><boxGeometry args={[2.4,0.13,0.16]} /><meshStandardMaterial ref={cliffSignalMaterial} color="#a51f2d" roughness={0.72} emissive="#5d0d17" emissiveIntensity={0.18} /></mesh><mesh name="goat-half" position={[0.2,0,0]}><boxGeometry args={[1.6,0.1,0.13]} /><meshStandardMaterial ref={cliffGoatSignalMaterial} color="#a51f2d" roughness={0.72} /></mesh><mesh position={[-0.82,-0.38,0.18]}><dodecahedronGeometry args={[0.52,0]} /><meshStandardMaterial color="#665746" roughness={1} /></mesh></group>
    <group ref={ritualSpray} visible={false}>{Array.from({length:4},(_,drop)=><mesh key={drop}><sphereGeometry args={[0.045,10,8]} /><meshStandardMaterial color="#7b2028" roughness={0.48} emissive="#3d070b" emissiveIntensity={0.18} /></mesh>)}</group>
    <group ref={curtainBloodMarks} visible={false} position={[0,TEMPLE_FLOOR_Y+2.05,-54.08]}>{Array.from({length:8},(_,mark)=><mesh key={mark} position={[(mark%2?0.12:-0.12)+(mark-3.5)*0.025,mark===0?0.72:0.48-mark*0.14,0]}><sphereGeometry args={[0.055+(mark%3)*0.008,10,7]} /><meshStandardMaterial color="#741923" roughness={0.62} /></mesh>)}</group>
    <group ref={goldenAltarMarks} visible={false}>
      {[[-0.62,1.05,-47.08],[0.62,1.05,-47.08],[0.62,1.05,-45.92],[-0.62,1.05,-45.92],[-0.25,1.09,-46.5],[-0.16,1.09,-46.5],[-0.08,1.09,-46.5],[0,1.09,-46.5],[0.08,1.09,-46.5],[0.16,1.09,-46.5],[0.25,1.09,-46.5]].map((position,mark)=><mesh key={mark} position={[position[0],TEMPLE_FLOOR_Y+position[1],position[2]]}><sphereGeometry args={[mark<4?0.07:0.045,10,7]} /><meshStandardMaterial color="#721720" roughness={0.6} /></mesh>)}
    </group>
    <group ref={remainderStream} visible={false}><mesh position={[0,-0.28,0]}><cylinderGeometry args={[0.025,0.055,0.65,9]} /><meshStandardMaterial color="#68131b" roughness={0.58} /></mesh><mesh position={[0,-0.62,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[0.2,18]} /><meshStandardMaterial color="#5c1118" roughness={0.7} /></mesh></group>
    <group ref={torah} visible={false}><mesh position={[-0.25,0,0]}><cylinderGeometry args={[0.05,0.05,0.9,12]} /><meshStandardMaterial color="#8f6238" /></mesh><mesh position={[0.25,0,0]}><cylinderGeometry args={[0.05,0.05,0.9,12]} /><meshStandardMaterial color="#8f6238" /></mesh><mesh rotation={[0,Math.PI/2,0]}><cylinderGeometry args={[0.34,0.34,0.5,18,1,true]} /><meshStandardMaterial color="#e6d7b8" side={2} roughness={0.9} /></mesh></group>
  </group>;
}
