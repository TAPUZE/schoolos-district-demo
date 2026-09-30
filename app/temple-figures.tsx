"use client";

import { useMemo } from "react";
import { LatheGeometry, Vector2 } from "three";
import type { Group } from "three";
import { Linen } from "./temple-surfaces";

// One world unit is 2.5 cubits (about 1.25 m), so a 1.75 m priest stands about 1.4 units tall.
export const PRIEST_HEIGHT = 1.36;
export const PRIEST_EYE_HEIGHT = 1.22;
// Ceremony props are positioned relative to the figure; these keep the old hand offsets on the smaller body.
export const PRIEST_HAND_SCALE_XZ = 0.65;
export const PRIEST_HAND_SCALE_Y = 0.72;

const WAIST = 0.8;

const SKIN = ["#b17b55", "#9c6544", "#c08c66", "#8b5b3d"];
const HAIR = ["#2a201b", "#38281f", "#463628", "#201814"];

const lathe = (points: [number, number][]) => new LatheGeometry(points.map(([radius, y]) => new Vector2(radius, y)), 40);

// Profiles run bottom to top with y relative to the waist.
const geometries: { torso?: LatheGeometry; skirt?: LatheGeometry; cap?: LatheGeometry } = {};
function getGeometries() {
  geometries.torso ??= lathe([[0.128, 0], [0.14, 0.08], [0.152, 0.17], [0.16, 0.24], [0.15, 0.285], [0.085, 0.305], [0.05, 0.322]]);
  geometries.skirt ??= lathe([[0.222, -0.73], [0.2, -0.6], [0.178, -0.45], [0.158, -0.3], [0.141, -0.15], [0.131, -0.04], [0.128, 0.005]]);
  geometries.cap ??= lathe([[0.084, 0], [0.093, 0.03], [0.09, 0.07], [0.074, 0.097], [0.03, 0.108], [0, 0.11]]);
  return geometries as Required<typeof geometries>;
}

function Skin({ color }: { color: string }) {
  return <meshStandardMaterial color={color} roughness={0.72} />;
}

function Arm({ side, garment, glow, groupRef, skin }: { side: -1 | 1; garment: string; glow: boolean; groupRef?: React.RefObject<Group | null>; skin: string }) {
  return (
    <group ref={groupRef} name={side < 0 ? "leftArm" : "rightArm"} position={[side * 0.166, 0.262, 0]}>
      <mesh castShadow><sphereGeometry args={[0.05, 14, 10]} /><Linen color={garment} emissive={glow ? "#705c2e" : "#000000"} emissiveIntensity={glow ? 0.16 : 0} /></mesh>
      <mesh position={[0, -0.135, 0]} castShadow><cylinderGeometry args={[0.055, 0.047, 0.27, 14]} /><Linen color={garment} emissive={glow ? "#705c2e" : "#000000"} emissiveIntensity={glow ? 0.16 : 0} /></mesh>
      <group position={[0, -0.27, 0]} rotation={[-0.22, 0, 0]}>
        <mesh position={[0, -0.125, 0]} castShadow><cylinderGeometry args={[0.047, 0.037, 0.26, 14]} /><Linen color={garment} emissive={glow ? "#705c2e" : "#000000"} emissiveIntensity={glow ? 0.16 : 0} /></mesh>
        <mesh position={[0, -0.29, 0.005]} scale={[0.8, 1.35, 0.55]} castShadow><sphereGeometry args={[0.032, 12, 10]} /><Skin color={skin} /></mesh>
      </group>
    </group>
  );
}

function Leg({ side, skin }: { side: -1 | 1; skin: string }) {
  return (
    <group name={side < 0 ? "leftLeg" : "rightLeg"} position={[side * 0.055, 0.75, 0]}>
      <mesh position={[0, -0.36, 0]} castShadow><capsuleGeometry args={[0.04, 0.56, 4, 10]} /><Skin color={skin} /></mesh>
      <mesh position={[0, -0.72, 0.04]} scale={[0.038, 0.028, 0.09]} castShadow><sphereGeometry args={[1, 12, 8]} /><Skin color={skin} /></mesh>
    </group>
  );
}

function Head({ skin, hair, grey, highPriest, headCover }: { skin: string; hair: string; grey: boolean; highPriest: boolean; headCover: "priest" | "none" | "veil" }) {
  const hairColor = grey ? "#8d8a84" : hair;
  const y = 0.445;
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, -0.09, 0]} castShadow><cylinderGeometry args={[0.034, 0.038, 0.1, 12]} /><Skin color={skin} /></mesh>
      <mesh scale={[0.072, 0.092, 0.082]} castShadow><sphereGeometry args={[1, 24, 18]} /><Skin color={skin} /></mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.07, -0.005, -0.005]} scale={[0.35, 1, 0.8]} castShadow><sphereGeometry args={[0.02, 8, 8]} /><Skin color={skin} /></mesh>
      ))}
      <mesh position={[0, -0.012, 0.083]} rotation={[Math.PI / 2 - 0.25, 0, 0]} castShadow><coneGeometry args={[0.012, 0.03, 8]} /><Skin color={skin} /></mesh>
      {[-1, 1].map((side) => (
        <mesh key={`eye-${side}`} position={[side * 0.029, 0.014, 0.072]}><sphereGeometry args={[0.0065, 8, 6]} /><meshStandardMaterial color="#1c1410" roughness={0.4} /></mesh>
      ))}
      <mesh position={[0, 0.002, -0.012]} scale={[0.078, 0.098, 0.09]}><sphereGeometry args={[1, 24, 14, Math.PI * 0.86, Math.PI * 1.3, 0, 1.9]} /><meshStandardMaterial color={hairColor} roughness={0.95} /></mesh>
      <mesh position={[0, 0.006, -0.008]} scale={[0.077, 0.097, 0.087]}><sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, 0.85]} /><meshStandardMaterial color={hairColor} roughness={0.95} /></mesh>
      <mesh position={[0, -0.03, 0.006]} scale={[0.076, 0.095, 0.088]}><sphereGeometry args={[1, 20, 12, Math.PI * 0.12, Math.PI * 0.76, 1.85, 0.85]} /><meshStandardMaterial color={hairColor} roughness={0.95} /></mesh>
      {headCover === "none" ? null : headCover === "veil" ? (
        <group name="headCovering" position={[0, 0.015, -0.012]}>
          <mesh position={[0,0.015,0]} scale={[0.095,0.105,0.1]} castShadow><sphereGeometry args={[1,20,14,0,Math.PI*2,0,Math.PI/2]} /><Linen color="#d8c6a5" /></mesh>
          <mesh position={[0,-0.13,-0.055]} castShadow><boxGeometry args={[0.19,0.28,0.035]} /><Linen color="#d8c6a5" /></mesh>
        </group>
      ) : highPriest ? (
        // Mitre (mitznefet): a wound linen turban rather than the ordinary priest's cap.
        <group name="headCovering" position={[0, 0.045, 0]}>
          {[0, 0.036, 0.072].map((h, index) => (
            <mesh key={h} position={[0, h, 0]} rotation={[Math.PI / 2, 0, index * 0.5]} scale={[1, 0.95, 1]} castShadow><torusGeometry args={[0.088 - index * 0.004, 0.026, 10, 32]} /><Linen color="#f3eee1" /></mesh>
          ))}
          <mesh position={[0, 0.065, 0]} scale={[0.082, 0.05, 0.086]} castShadow><sphereGeometry args={[1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><Linen color="#f3eee1" /></mesh>
        </group>
      ) : (
        // Migba'at: a shallow linen cap like an inverted bowl.
        <group name="headCovering" position={[0, 0.05, 0]}>
          <mesh scale={[1, 1, 1.02]} castShadow><primitive object={getGeometries().cap} attach="geometry" /><Linen color="#f3eee1" /></mesh>
          <mesh position={[0, 0.012, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1.02, 1]}><torusGeometry args={[0.089, 0.008, 6, 32]} /><Linen color="#e2dac6" /></mesh>
        </group>
      )}
    </group>
  );
}

const STONES = ["#b8323c", "#d8b141", "#3f8b72", "#9b6ab2", "#d66c32", "#e9ded0", "#3f6faa", "#6f9d45", "#7d3d95", "#d6a93b", "#6f7e8f", "#b24b4d"];
const EPHOD_THREADS = ["#274f86", "#684286", "#a83e4a", "#e5dcc7", "#c89b35"];

function GoldVestments() {
  const { torso, skirt } = getGeometries();
  return (
    <group name="goldVestments" position={[0, WAIST, 0]} visible={false}>
      {/* Blue robe (me'il) with alternating bells and pomegranates at the hem. */}
      <mesh scale={[1.06, 1, 1.06 * 0.8]} castShadow><primitive object={skirt} attach="geometry" /><Linen color="#234f83" /></mesh>
      {Array.from({ length: 16 }, (_, item) => {
        const angle = (item / 16) * Math.PI * 2;
        const bell = item % 2 === 0;
        return (
          <mesh key={item} position={[Math.sin(angle) * 0.232, -0.7, Math.cos(angle) * 0.232 * 0.8]}>
            {bell ? <sphereGeometry args={[0.018, 10, 8]} /> : <octahedronGeometry args={[0.02, 0]} />}
            <meshStandardMaterial color={bell ? "#cba247" : item % 4 === 1 ? "#a53c4a" : "#65417e"} metalness={bell ? 0.8 : 0.1} roughness={0.35} />
          </mesh>
        );
      })}
      <group name="goldUpper">
        <mesh scale={[1.06, 1, 1.06 * 0.68]} castShadow><primitive object={torso} attach="geometry" /><Linen color="#234f83" /></mesh>
        {/* The white linen tunic remains visible at the neck beneath the sleeveless blue robe. */}
        <mesh position={[0,0.305,0.006]} rotation={[Math.PI/2,0,0]} scale={[1,0.72,1]}><torusGeometry args={[0.066,0.012,8,28]} /><Linen color="#f1ecdf" /></mesh>
        <mesh position={[0,0.292,0.01]} rotation={[Math.PI/2,0,0]} scale={[1,0.72,1]}><torusGeometry args={[0.083,0.012,8,28]} /><Linen color="#234f83" /></mesh>
        {/* Ephod: woven apron, shoulder straps and onyx shoulder stones. */}
        <mesh position={[0, 0.055, 0.112]} castShadow><boxGeometry args={[0.21, 0.35, 0.014]} /><meshStandardMaterial color="#684286" roughness={0.72} /></mesh>
        <mesh position={[0, 0.055, -0.098]} castShadow><boxGeometry args={[0.21, 0.35, 0.014]} /><meshStandardMaterial color="#563b72" roughness={0.72} /></mesh>
        {EPHOD_THREADS.map((color,index)=><mesh key={color} position={[-0.075+index*0.037,0.055,0.121]} rotation={[0,0,index%2?0.16:-0.16]}><boxGeometry args={[0.018,0.33,0.004]} /><meshStandardMaterial color={color} metalness={index===4?0.62:0.04} roughness={index===4?0.34:0.76} /></mesh>)}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.095, 0.3, 0]}>
            <mesh castShadow><boxGeometry args={[0.068, 0.022, 0.22]} /><meshStandardMaterial color={side<0?"#6b3f7b":"#9c3f55"} roughness={0.68} /></mesh>
            <mesh position={[0, 0.014, 0.006]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.031, 0.031, 0.014, 18]} /><meshStandardMaterial color="#c99b38" metalness={0.82} roughness={0.26} /></mesh>
            <mesh position={[0, 0.023, 0.006]} rotation={[Math.PI/2, 0, 0]} scale={[1.2,0.68,1]}><sphereGeometry args={[0.021,16,10]} /><meshStandardMaterial color="#24292a" metalness={0.2} roughness={0.22} /></mesh>
          </group>
        ))}
        {/* Choshen: square breastpiece with twelve stones in four rows of three. */}
        <mesh position={[0, 0.18, 0.122]} castShadow><boxGeometry args={[0.19, 0.19, 0.012]} /><meshStandardMaterial color="#684286" roughness={0.62} /></mesh>
        <mesh position={[0, 0.18, 0.129]}><boxGeometry args={[0.176, 0.176, 0.005]} /><meshStandardMaterial color="#c59a39" metalness={0.76} roughness={0.3} wireframe /></mesh>
        {STONES.map((color, stone) => (
          <group key={stone} position={[-0.057 + (stone % 3) * 0.057, 0.238 - Math.floor(stone / 3) * 0.039, 0.135]}>
            <mesh><boxGeometry args={[0.049,0.032,0.008]} /><meshStandardMaterial color="#d0a13b" metalness={0.84} roughness={0.24} /></mesh>
            <mesh position={[0,0,0.006]} scale={[1.08,0.72,1]}><sphereGeometry args={[0.017,14,9]} /><meshStandardMaterial color={color} metalness={0.12} roughness={0.18} /></mesh>
          </group>
        ))}
        {/* Gold chains suspend the breastplate; blue cords hold its lower rings to the ephod. */}
        {[-1,1].map((side)=><group key={`chain-${side}`}>
          {Array.from({length:5},(_,link)=><mesh key={link} position={[side*(0.088-link*0.003),0.292-link*0.018,0.133]} rotation={[Math.PI/2,0,link%2?Math.PI/2:0]}><torusGeometry args={[0.009,0.0026,6,12]} /><meshStandardMaterial color="#d4a83e" metalness={0.9} roughness={0.22} /></mesh>)}
          <mesh position={[side*0.086,0.084,0.137]} rotation={[0,0,side*0.25]}><cylinderGeometry args={[0.0028,0.0028,0.105,7]} /><meshStandardMaterial color="#245b98" roughness={0.6} /></mesh>
        </group>)}
        {/* The ephod's integrated multicolored band, with a short woven end visible in front. */}
        <mesh position={[0, 0.015, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.72, 1]}><torusGeometry args={[0.139, 0.027, 8, 32]} /><meshStandardMaterial color="#684286" roughness={0.58} /></mesh>
        {EPHOD_THREADS.map((color,index)=><mesh key={`belt-${color}`} position={[-0.08+index*0.04,-0.105,0.114]} rotation={[0,0,(index-2)*0.025]}><boxGeometry args={[0.021,0.2,0.008]} /><meshStandardMaterial color={color} metalness={index===4?0.6:0.03} roughness={0.7} /></mesh>)}
        {/* Tzitz: a broad gold forehead plate tied over the linen mitre. */}
        <mesh name="frontlet" position={[0, 0.5, 0.084]} rotation={[-0.1, 0, 0]}><boxGeometry args={[0.158, 0.034, 0.009]} /><meshStandardMaterial color="#e2b64f" metalness={0.95} roughness={0.18} /></mesh>
        {[-0.045,-0.015,0.015,0.045].map((x,index)=><mesh key={`engraving-${x}`} position={[x,0.5,0.089]} rotation={[0,0,index%2?0.55:-0.55]}><boxGeometry args={[0.018,0.0025,0.001]} /><meshStandardMaterial color="#8b661f" metalness={0.8} roughness={0.3} /></mesh>)}
      </group>
    </group>
  );
}

export function PriestModel({ garment = "#f3eee1", highPriest = false, glow = false, vestments = false, variant = 0, leftArmRef, rightArmRef, blob = true, headCover = "priest" }: {
  garment?: string;
  highPriest?: boolean;
  glow?: boolean;
  vestments?: boolean;
  variant?: number;
  leftArmRef?: React.RefObject<Group | null>;
  rightArmRef?: React.RefObject<Group | null>;
  blob?: boolean;
  headCover?: "priest" | "none" | "veil";
}) {
  const { torso, skirt } = useMemo(getGeometries, []);
  const skin = SKIN[variant % SKIN.length];
  const hair = HAIR[variant % HAIR.length];
  const emissive = glow ? "#705c2e" : "#000000";
  const emissiveIntensity = glow ? 0.16 : 0;
  return (
    <>
      {blob && <mesh position={[0, 0.012, 0.03]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.34, 24]} /><meshBasicMaterial color="#403a32" transparent opacity={0.24} /></mesh>}
      <Leg side={-1} skin={skin} />
      <Leg side={1} skin={skin} />
      <mesh name="robe" position={[0, WAIST, 0]} scale={[1, 1, 0.8]} castShadow><primitive object={skirt} attach="geometry" /><Linen color={garment} emissive={emissive} emissiveIntensity={emissiveIntensity} /></mesh>
      <mesh position={[0, 0.077, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.8, 1]}><torusGeometry args={[0.224, 0.007, 6, 40]} /><Linen color="#dcd3bb" /></mesh>
      <group name="torso" position={[0, WAIST, 0]}>
        <mesh name="torsoBody" scale={[1, 1, 0.68]} castShadow><primitive object={torso} attach="geometry" /><Linen color={garment} emissive={emissive} emissiveIntensity={emissiveIntensity} /></mesh>
        <group name="linenSash">
          {[0.012, 0.05].map((y, index) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.72, 1]}><torusGeometry args={[0.135 + index * 0.004, 0.02, 8, 32]} /><Linen color={highPriest ? "#eee7d8" : "#ddd4c2"} /></mesh>
          ))}
          {!highPriest && <mesh position={[0, 0.031, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.72, 1]}><torusGeometry args={[0.138, 0.004, 6, 32]} /><meshStandardMaterial color="#5d718e" roughness={0.8} /></mesh>}
          <mesh position={[0.06, -0.09, 0.098]} rotation={[0.06, 0, 0.08]} castShadow><boxGeometry args={[0.05, 0.19, 0.01]} /><Linen color="#ddd4c2" /></mesh>
        </group>
        <Arm side={-1} garment={garment} glow={glow} groupRef={leftArmRef} skin={skin} />
        <Arm side={1} garment={garment} glow={glow} groupRef={rightArmRef} skin={skin} />
        <Head skin={skin} hair={hair} grey={highPriest} highPriest={highPriest} headCover={headCover} />
      </group>
      {vestments && <GoldVestments />}
    </>
  );
}
