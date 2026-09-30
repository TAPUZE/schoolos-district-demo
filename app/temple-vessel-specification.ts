import { TEMPLE_UNITS } from "./temple-specification";

export type VesselEvidence = "explicit" | "corroborated" | "interpretive";

export type VesselSource = {
  id: string;
  citation: string;
  url: string;
};

export type VesselSpecification = {
  id: string;
  label: string;
  sourceIds: readonly string[];
  evidence: VesselEvidence;
  placement: string;
  note?: string;
};

const ARCHITECTURAL_CUBIT = TEMPLE_UNITS.cubitWorld;
const HANDBREADTH = ARCHITECTURAL_CUBIT / TEMPLE_UNITS.handbreadthsPerCubit;
const VESSEL_CUBIT = HANDBREADTH * TEMPLE_UNITS.vesselCubitHandbreadths;

export const VESSEL_SOURCES: readonly VesselSource[] = [
  { id: "exodus-25-menorah", citation: "Exodus 25:31–40", url: "https://www.sefaria.org/Exodus.25.31-40?lang=bi" },
  { id: "menachot-28b", citation: "Babylonian Talmud, Menachot 28b", url: "https://www.sefaria.org/Menachot.28b?lang=bi" },
  { id: "exodus-25-table", citation: "Exodus 25:23–30", url: "https://www.sefaria.org/Exodus.25.23-30?lang=bi" },
  { id: "menachot-98b", citation: "Babylonian Talmud, Menachot 98b", url: "https://www.sefaria.org/Menachot.98b?lang=bi" },
  { id: "exodus-30-incense", citation: "Exodus 30:1–6", url: "https://www.sefaria.org/Exodus.30.1-6?lang=bi" },
  { id: "chosen-temple-3-17", citation: "Mishneh Torah, The Chosen Temple 3:17", url: "https://www.sefaria.org/Mishneh_Torah%2C_The_Chosen_Temple.3.17?lang=bi" },
  { id: "yoma-3-10", citation: "Mishnah Yoma 3:10", url: "https://www.sefaria.org/Mishnah_Yoma.3.10?lang=bi" },
  { id: "middot-3-5", citation: "Mishnah Middot 3:5", url: "https://www.sefaria.org/Mishnah_Middot.3.5?lang=bi" },
  { id: "shekalim-6-4", citation: "Mishnah Shekalim 6:4", url: "https://www.sefaria.org/Mishnah_Shekalim.6.4?lang=bi" },
  { id: "shekalim-6-5", citation: "Mishnah Shekalim 6:5", url: "https://www.sefaria.org/Mishnah_Shekalim.6.5?lang=bi" },
] as const;

export const PRINCIPAL_VESSELS: readonly VesselSpecification[] = [
  { id: "menorah", label: "Gold Menorah", sourceIds: ["exodus-25-menorah", "menachot-28b"], evidence: "corroborated", placement: "South side of the Holy Place", note: "Height and ornament counts are enforced. Branch curvature and the east-west versus north-south orientation remain reconstruction questions; the scene currently follows the east-west opinion." },
  { id: "showbread-table", label: "Showbread Table", sourceIds: ["exodus-25-table", "menachot-98b"], evidence: "corroborated", placement: "North side of the Holy Place", note: "The scene uses Rabbi Judah's five-handbreadth vessel cubit and the east-west orientation; both are source-preserved choices rather than universal measurements." },
  { id: "incense-altar", label: "Gold Incense Altar", sourceIds: ["exodus-30-incense", "chosen-temple-3-17"], evidence: "corroborated", placement: "On the Holy Place centerline, between the Table and Menorah and slightly east (toward the entrance)" },
  { id: "laver", label: "Twelve-spout laver and lowering apparatus", sourceIds: ["yoma-3-10"], evidence: "corroborated", placement: "Between the Porch and the outer altar, drawn toward the south", note: "The twelve spouts and existence/function of the lowering device are explicit; the current wheel silhouette is interpretive." },
  { id: "slaughter-installation", label: "Slaughter rings, pillars and tables", sourceIds: ["middot-3-5", "shekalim-6-4"], evidence: "explicit", placement: "North of the outer altar", note: "Unsupplied object dimensions remain interpretive." },
  { id: "collection-chests", label: "Collection chests", sourceIds: ["shekalim-6-5"], evidence: "explicit", placement: "Temple precinct; current exact arrangement is interpretive." },
] as const;

export const VESSEL_MEASUREMENTS = {
  selectedCubitTradition: "rabbi-judah-five-handbreadth-vessel-cubit",
  menorah: {
    heightHandbreadths: 18,
    heightWorld: 18 * HANDBREADTH,
    branchCount: 7,
    lampCount: 7,
    cupCount: 22,
    knobCount: 11,
    flowerCount: 9,
  },
  showbreadTable: {
    lengthVesselCubits: 2,
    widthVesselCubits: 1,
    heightVesselCubits: 1.5,
    lengthWorld: 2 * VESSEL_CUBIT,
    widthWorld: VESSEL_CUBIT,
    heightWorld: 1.5 * VESSEL_CUBIT,
    loafCount: 12,
    stackCount: 2,
  },
  incenseAltar: {
    lengthVesselCubits: 1,
    widthVesselCubits: 1,
    heightVesselCubits: 2,
    lengthWorld: VESSEL_CUBIT,
    widthWorld: VESSEL_CUBIT,
    heightWorld: 2 * VESSEL_CUBIT,
  },
  laver: { spoutCount: 12, hasLoweringDevice: true },
  slaughterInstallation: { ringCount: 24, ringRows: 6, ringsPerRow: 4, pillarCount: 8, hookRowsPerPillar: 3, marbleTableCount: 8 },
  serviceTables: { totalCount: 13, westOfRampCount: 2, porchCount: 2, interiorCount: 1, slaughterTableCount: 8, dailyServiceVesselCount: 93 },
  collectionChests: { totalCount: 13, namedFundCount: 7, freewillCount: 6 },
} as const;

const nearlyEqual = (left: number, right: number) => Math.abs(left - right) < 0.000001;
const checks = [
  { label: "Menorah height", pass: nearlyEqual(VESSEL_MEASUREMENTS.menorah.heightWorld, 18 * HANDBREADTH) },
  { label: "Menorah ornaments", pass: VESSEL_MEASUREMENTS.menorah.cupCount === 22 && VESSEL_MEASUREMENTS.menorah.knobCount === 11 && VESSEL_MEASUREMENTS.menorah.flowerCount === 9 },
  { label: "Menorah lamps", pass: VESSEL_MEASUREMENTS.menorah.lampCount === 7 },
  { label: "Showbread Table dimensions", pass: nearlyEqual(VESSEL_MEASUREMENTS.showbreadTable.lengthWorld, 2 * VESSEL_CUBIT) && nearlyEqual(VESSEL_MEASUREMENTS.showbreadTable.widthWorld, VESSEL_CUBIT) && nearlyEqual(VESSEL_MEASUREMENTS.showbreadTable.heightWorld, 1.5 * VESSEL_CUBIT) },
  { label: "Showbread loaves", pass: VESSEL_MEASUREMENTS.showbreadTable.loafCount === 12 && VESSEL_MEASUREMENTS.showbreadTable.stackCount === 2 },
  { label: "Incense Altar dimensions", pass: nearlyEqual(VESSEL_MEASUREMENTS.incenseAltar.lengthWorld, VESSEL_CUBIT) && nearlyEqual(VESSEL_MEASUREMENTS.incenseAltar.heightWorld, 2 * VESSEL_CUBIT) },
  { label: "Laver spouts", pass: VESSEL_MEASUREMENTS.laver.spoutCount === 12 },
  { label: "Laver lowering device", pass: VESSEL_MEASUREMENTS.laver.hasLoweringDevice === true },
  { label: "Slaughter installation", pass: VESSEL_MEASUREMENTS.slaughterInstallation.ringCount === 24 && VESSEL_MEASUREMENTS.slaughterInstallation.ringRows * VESSEL_MEASUREMENTS.slaughterInstallation.ringsPerRow === 24 && VESSEL_MEASUREMENTS.slaughterInstallation.pillarCount === 8 },
  { label: "Temple service tables", pass: VESSEL_MEASUREMENTS.serviceTables.slaughterTableCount + VESSEL_MEASUREMENTS.serviceTables.westOfRampCount + VESSEL_MEASUREMENTS.serviceTables.porchCount + VESSEL_MEASUREMENTS.serviceTables.interiorCount === VESSEL_MEASUREMENTS.serviceTables.totalCount },
  { label: "Collection chests", pass: VESSEL_MEASUREMENTS.collectionChests.namedFundCount + VESSEL_MEASUREMENTS.collectionChests.freewillCount === VESSEL_MEASUREMENTS.collectionChests.totalCount },
] as const;

export const TEMPLE_VESSEL_AUDIT = checks.map((check) => ({ ...check }));

const failedCheck = TEMPLE_VESSEL_AUDIT.find((check) => !check.pass);
if (failedCheck) throw new Error(`Temple vessel audit failed: ${failedCheck.label}`);
