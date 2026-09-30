export type EvidenceGrade = "explicit" | "corroborated" | "disputed" | "illustrative";

export type SourceRecord = {
  id: string;
  citation: string;
  url: string;
};

export type DimensionRecord = {
  id: string;
  label: string;
  cubits: number;
  sourceIds: string[];
  evidence: EvidenceGrade;
  note?: string;
};

export type ElevationRecord = {
  id: string;
  label: string;
  cubitsAboveIsraelCourt: number;
  sourceIds: string[];
  evidence: EvidenceGrade;
  note?: string;
};

export type StairSpecification = {
  id: string;
  label: string;
  count: number;
  riseCubits: number;
  treadCubits?: number;
  innerLandingRadiusCubits?: number;
  runPatternCubits?: readonly number[];
  sourceIds: string[];
  evidence: EvidenceGrade;
  note?: string;
};

export const TEMPLE_SOURCES: SourceRecord[] = [
  { id: "middot-2-1", citation: "Mishnah Middot 2:1", url: "https://www.sefaria.org/Mishnah_Middot.2.1?lang=bi" },
  { id: "middot-2-5", citation: "Mishnah Middot 2:5", url: "https://www.sefaria.org/Mishnah_Middot.2.5?lang=bi" },
  { id: "middot-2-6", citation: "Mishnah Middot 2:6", url: "https://www.sefaria.org/Mishnah_Middot.2.6?lang=bi" },
  { id: "middot-3-1", citation: "Mishnah Middot 3:1", url: "https://www.sefaria.org/Mishnah_Middot.3.1?lang=bi" },
  { id: "middot-3-3", citation: "Mishnah Middot 3:3", url: "https://www.sefaria.org/Mishnah_Middot.3.3?lang=bi" },
  { id: "middot-3-6", citation: "Mishnah Middot 3:6", url: "https://www.sefaria.org/Mishnah_Middot.3.6?lang=bi" },
  { id: "middot-4-6", citation: "Mishnah Middot 4:6", url: "https://www.sefaria.org/Mishnah_Middot.4.6?lang=bi" },
  { id: "middot-5-1", citation: "Mishnah Middot 5:1", url: "https://www.sefaria.org/Mishnah_Middot.5.1?lang=bi" },
];

// World scale is deliberately isolated here. Source-defined cubit ratios do not
// change if a future review selects a different physical cubit conversion.
export const TEMPLE_UNITS = {
  cubitWorld: 0.4,
  handbreadthsPerCubit: 6,
  vesselCubitHandbreadths: 5,
} as const;

export const toWorld = (cubits: number) => cubits * TEMPLE_UNITS.cubitWorld;

export const TEMPLE_DIMENSIONS: DimensionRecord[] = [
  { id: "mount-side", label: "Temple Mount side", cubits: 500, sourceIds: ["middot-2-1"], evidence: "explicit" },
  { id: "womens-court-side", label: "Women's Court side", cubits: 135, sourceIds: ["middot-2-5"], evidence: "explicit" },
  { id: "corner-chamber-side", label: "Women's Court corner chamber side", cubits: 40, sourceIds: ["middot-2-5"], evidence: "explicit" },
  { id: "azarah-east-west", label: "Azarah east-west", cubits: 187, sourceIds: ["middot-5-1"], evidence: "explicit" },
  { id: "azarah-north-south", label: "Azarah north-south", cubits: 135, sourceIds: ["middot-5-1"], evidence: "explicit" },
  { id: "israel-court-depth", label: "Israel Court depth", cubits: 11, sourceIds: ["middot-5-1"], evidence: "explicit" },
  { id: "priests-court-depth", label: "Priests' Court depth", cubits: 11, sourceIds: ["middot-5-1"], evidence: "explicit" },
  { id: "altar-base-side", label: "Outer altar base side", cubits: 32, sourceIds: ["middot-3-1"], evidence: "explicit" },
  { id: "altar-height", label: "Outer altar height", cubits: 9, sourceIds: ["middot-3-1"], evidence: "explicit" },
  { id: "altar-ramp-length", label: "Outer altar ramp length", cubits: 32, sourceIds: ["middot-3-3"], evidence: "explicit" },
  { id: "altar-ramp-width", label: "Outer altar ramp width", cubits: 16, sourceIds: ["middot-3-3"], evidence: "explicit" },
  { id: "altar-to-porch", label: "Altar to Porch", cubits: 22, sourceIds: ["middot-3-6", "middot-5-1"], evidence: "explicit" },
  { id: "sanctuary-length", label: "Sanctuary length", cubits: 100, sourceIds: ["middot-4-6", "middot-5-1"], evidence: "explicit" },
];

export const TEMPLE_ELEVATIONS: ElevationRecord[] = [
  { id: "outer-mount", label: "Outer Mount presentation surface", cubitsAboveIsraelCourt: -7.625, sourceIds: [], evidence: "illustrative", note: "Current visual support datum; replace after the Mount circulation study." },
  { id: "womens-court", label: "Women's Court", cubitsAboveIsraelCourt: -7.5, sourceIds: ["middot-2-5"], evidence: "corroborated", note: "Fifteen half-cubit rises establish the selected level relationship." },
  { id: "israel-court", label: "Israel Court", cubitsAboveIsraelCourt: 0, sourceIds: ["middot-2-6"], evidence: "explicit" },
  { id: "priests-court", label: "Priests' Court", cubitsAboveIsraelCourt: 2.5, sourceIds: ["middot-2-6"], evidence: "explicit" },
  { id: "temple-floor", label: "Temple floor", cubitsAboveIsraelCourt: 8.5, sourceIds: ["middot-3-6"], evidence: "explicit", note: "Twelve half-cubit rises above the priests' level." },
  { id: "altar-top", label: "Outer altar top", cubitsAboveIsraelCourt: 11.5, sourceIds: ["middot-3-1", "middot-2-6"], evidence: "explicit" },
];

export const TEMPLE_STAIRS: Record<"womensToIsrael" | "altarToPorch", StairSpecification> = {
  womensToIsrael: {
    id: "womens-to-israel",
    label: "Women's Court to Israel Court",
    count: 15,
    riseCubits: 0.5,
    treadCubits: 0.5,
    innerLandingRadiusCubits: 5,
    sourceIds: ["middot-2-5"],
    evidence: "corroborated",
    note: "The Mishnah specifies fifteen semicircular steps; half-cubit rise/tread follows the selected Maimonidean reconstruction. The five-cubit inner radius is a geometric reconstruction that keeps the upper landing as wide as the standard ten-cubit Nicanor opening instead of collapsing to a point.",
  },
  altarToPorch: {
    id: "altar-to-porch",
    label: "Altar to Porch",
    count: 12,
    riseCubits: 0.5,
    runPatternCubits: [1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 4],
    sourceIds: ["middot-3-6"],
    evidence: "explicit",
    note: "The run pattern stores the stated one-cubit treads and broader landings; its placement is checked against the separate 22-cubit altar-to-Porch dimension.",
  },
};

export const elevationWorld = (id: ElevationRecord["id"]) => {
  const elevation = TEMPLE_ELEVATIONS.find((item) => item.id === id);
  if (!elevation) throw new Error(`Unknown Temple elevation: ${id}`);
  return toWorld(elevation.cubitsAboveIsraelCourt);
};

export const dimensionWorld = (id: DimensionRecord["id"]) => {
  const dimension = TEMPLE_DIMENSIONS.find((item) => item.id === id);
  if (!dimension) throw new Error(`Unknown Temple dimension: ${id}`);
  return toWorld(dimension.cubits);
};

const womensRise = TEMPLE_STAIRS.womensToIsrael.count * TEMPLE_STAIRS.womensToIsrael.riseCubits;
const womensLevelDifference = Math.abs(
  (TEMPLE_ELEVATIONS.find((item) => item.id === "womens-court")?.cubitsAboveIsraelCourt ?? Number.NaN)
  - (TEMPLE_ELEVATIONS.find((item) => item.id === "israel-court")?.cubitsAboveIsraelCourt ?? Number.NaN),
);
if (Math.abs(womensRise - womensLevelDifference) > 0.0001) {
  throw new Error(`Women's Court stairs rise ${womensRise} cubits but the elevation difference is ${womensLevelDifference}.`);
}

const porchRuns = TEMPLE_STAIRS.altarToPorch.runPatternCubits ?? [];
if (porchRuns.length !== TEMPLE_STAIRS.altarToPorch.count) {
  throw new Error(`Altar-to-Porch stair specification requires ${TEMPLE_STAIRS.altarToPorch.count} runs; found ${porchRuns.length}.`);
}
const porchRunTotal = porchRuns.reduce((sum, run) => sum + run, 0);
const altarToPorch = TEMPLE_DIMENSIONS.find((item) => item.id === "altar-to-porch")?.cubits ?? Number.NaN;
if (porchRunTotal > altarToPorch) {
  throw new Error(`Altar-to-Porch stair runs occupy ${porchRunTotal} cubits inside a ${altarToPorch}-cubit separation.`);
}
