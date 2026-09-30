export type FacadeStoneVariant = "sunlit-marble" | "restrained";
export type FacadeColumnVariant = "none" | "video-columns";
export type FacadeGoldVariant = "video-trim" | "josephus-face";
export type WildernessSignalVariant = "flags" | "elapsed" | "scarlet";

export const FACADE_STONE_VARIANTS: Record<FacadeStoneVariant, { label: string; note: string }> = {
  "sunlit-marble": {
    label: "Sunlit marble wave courses",
    note: "Alternating pale marble courses physically project and recede. Their sea-wave reading comes from raking sunlight and shadow, not blue paint.",
  },
  restrained: {
    label: "Restrained marble reading",
    note: "Near-white and light grey marble courses preserve the projecting/receding wave rhythm with minimal mineral tint.",
  },
};

export const FACADE_COLUMN_VARIANTS: Record<FacadeColumnVariant, { label: string; note: string }> = {
  none: {
    label: "No exterior columns",
    note: "The conservative view: the monumental east front is shown without unsupported freestanding Yachin/Boaz-style columns.",
  },
  "video-columns": {
    label: "Video reconstruction · Yachin/Boaz (default)",
    note: "Restores the two named exterior columns shown in the supplied physical model. Their use on the Second Temple facade is disputed and is not treated as an explicit ancient-source fact.",
  },
};

export const FACADE_GOLD_VARIANTS: Record<FacadeGoldVariant, { label: string; note: string }> = {
  "video-trim": {
    label: "Supplied model · gold trim (default)",
    note: "Uses gold at the entrance, window surrounds, upper cornice and roof crown while leaving the marble facade visible, following the supplied reconstruction images.",
  },
  "josephus-face": {
    label: "Josephus · plated outward face",
    note: "Shows broad gold plating on the outward Temple face from Josephus, War 5.222. The precise area covered is not preserved as a measured elevation.",
  },
};

export const WILDERNESS_SIGNAL_VARIANTS: Record<WildernessSignalVariant, { label: string; note: string }> = {
  flags: {
    label: "Waved cloths",
    note: "The first opinion in Mishnah Yoma 6:8: watchers wave cloths when the goat reaches the wilderness.",
  },
  elapsed: {
    label: "Elapsed travel time",
    note: "Rabbi Yehudah's opinion: the court estimates the time needed to walk three mil.",
  },
  scarlet: {
    label: "Scarlet strip at entrance",
    note: "Rabbi Yishmael's opinion: a scarlet strip at the entrance of the Hekhal turns white; the source does not say window.",
  },
};
