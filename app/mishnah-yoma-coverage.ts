import { MISHNAH_YOMA_FULL, type MishnahYomaUnit } from "./mishnah-yoma-full";
import { YOM_KIPPUR_SERVICE } from "./yom-kippur-ceremony";
import { CHAPTER_EIGHT_BY_MISHNAH } from "./yoma-chapter-eight";
import { YOMA_EXPLANATION_BY_MISHNAH } from "./yoma-learner-explanations";

export type CoverageMode = "animated-action" | "contextual-demonstration" | "teaching-interlude";
export type ImplementationState = "planned" | "prototype" | "production";
export type ReviewState = "pending" | "in-review" | "approved" | "changes-requested";

export type MishnahCoverageRecord = MishnahYomaUnit & {
  coverageMode: CoverageMode;
  phase: string;
  prototypeBeatIds: string[];
  implementation: ImplementationState;
  technicalQa: ReviewState;
  contentReview: ReviewState;
  rabbinicReview: ReviewState;
  plainHebrew: string;
  englishExplanation: string;
  comprehension?: { questionHebrew: string; answersHebrew: readonly [string,string,string]; correctAnswer: 0|1|2; feedbackHebrew: string };
};

const TEACHING_INTERLUDES = new Set([
  "1.1",
  "3.2", "3.5", "3.7", "3.11",
  "4.4", "4.6",
  "5.7",
  "7.2", "7.5",
  "8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8", "8.9",
]);

const CONTEXTUAL_DEMONSTRATIONS = new Set([
  "1.3", "1.4",
  "2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7",
  "3.10",
  "4.5",
  "5.2",
  "6.1", "6.5", "6.8",
]);

const PHASE_BY_CHAPTER: Record<number, string> = {
  1: "Seven-day preparation and Yom Kippur night",
  2: "Ordinary Temple service and lotteries",
  3: "Dawn, morning service, immersions, garments, and first confession",
  4: "Lots, second confession, bull, coals, and altar procedure",
  5: "Inner incense and blood services",
  6: "Scapegoat, wilderness journey, and concurrent burning",
  7: "Torah reading and completion of the day's service",
  8: "Affliction, safety, repentance, and atonement",
};

const mishnahIdFromSourceUrl = (url: string) => {
  const match = url.match(/Mishnah_Yoma\.(\d+)\.(\d+)/);
  return match ? `${match[1]}.${match[2]}` : null;
};

const mishnahIdsFromSource = (source: string) => {
  if (!source.includes("Mishnah Yoma")) return [];

  const ids: string[] = [];
  for (const match of source.matchAll(/(\d+):(\d+)(?:\s*[–-]\s*(?:(\d+):)?(\d+))?/g)) {
    const startChapter = Number(match[1]);
    const startMishnah = Number(match[2]);
    const endChapter = Number(match[3] ?? match[1]);
    const endMishnah = Number(match[4] ?? match[2]);

    if (startChapter === endChapter) {
      for (let mishnah = startMishnah; mishnah <= endMishnah; mishnah += 1) {
        ids.push(`${startChapter}.${mishnah}`);
      }
    } else {
      ids.push(`${startChapter}.${startMishnah}`, `${endChapter}.${endMishnah}`);
    }
  }
  return ids;
};

const prototypeBeatsByMishnah = new Map<string, string[]>();
for (const beat of YOM_KIPPUR_SERVICE) {
  const sourceIds = mishnahIdsFromSource(beat.source);
  const urlId = mishnahIdFromSourceUrl(beat.sourceUrl);
  const mishnahIds = sourceIds.length > 0 ? sourceIds : urlId ? [urlId] : [];

  for (const mishnahId of new Set(mishnahIds)) {
    const ids = prototypeBeatsByMishnah.get(mishnahId) ?? [];
    ids.push(beat.id);
    prototypeBeatsByMishnah.set(mishnahId, ids);
  }
}

const coverageModeFor = (id: string): CoverageMode => {
  if (TEACHING_INTERLUDES.has(id)) return "teaching-interlude";
  if (CONTEXTUAL_DEMONSTRATIONS.has(id)) return "contextual-demonstration";
  return "animated-action";
};

export const MISHNAH_YOMA_COVERAGE: MishnahCoverageRecord[] = MISHNAH_YOMA_FULL.map((unit) => {
  const prototypeBeatIds = prototypeBeatsByMishnah.get(unit.id) ?? [];
  const chapterEightLesson = CHAPTER_EIGHT_BY_MISHNAH.get(unit.id as `8.${number}`);
  const learnerExplanation = chapterEightLesson ?? YOMA_EXPLANATION_BY_MISHNAH.get(unit.id);
  if (!learnerExplanation) throw new Error(`Missing learner explanation for Mishnah Yoma ${unit.id}.`);
  return {
    ...unit,
    coverageMode: coverageModeFor(unit.id),
    phase: PHASE_BY_CHAPTER[unit.chapter],
    prototypeBeatIds,
    implementation: prototypeBeatIds.length > 0 ? "prototype" : "planned",
    technicalQa: "pending",
    contentReview: "pending",
    rabbinicReview: "pending",
    plainHebrew:learnerExplanation.plainHebrew,
    englishExplanation:learnerExplanation.englishExplanation,
    ...(chapterEightLesson ? {
      comprehension:{
        questionHebrew:chapterEightLesson.questionHebrew,
        answersHebrew:chapterEightLesson.answersHebrew,
        correctAnswer:chapterEightLesson.correctAnswer,
        feedbackHebrew:chapterEightLesson.feedbackHebrew,
      },
    } : {}),
  };
});

if (MISHNAH_YOMA_COVERAGE.length !== 61) {
  throw new Error(`Mishnah Yoma coverage ledger must contain 61 units; found ${MISHNAH_YOMA_COVERAGE.length}.`);
}

export const MISHNAH_YOMA_COVERAGE_CHECKS = [
  { label:"Coverage ledger contains exactly 61 Mishnah units", passed:MISHNAH_YOMA_COVERAGE.length===61 },
  { label:"Every Mishnah has plain Hebrew and English learner copy", passed:MISHNAH_YOMA_COVERAGE.every((unit)=>unit.plainHebrew.length>35&&unit.englishExplanation.length>35) },
  { label:"Every Mishnah has at least one prototype beat", passed:MISHNAH_YOMA_COVERAGE.every((unit)=>unit.prototypeBeatIds.length>0) },
] as const;

// Readiness checks are surfaced as data rather than crashing the entire 3D
// experience. Structural corruption (wrong unit count or missing learner copy)
// still throws above, while an unfinished prototype beat remains a valid
// `planned` coverage state.
export const MISHNAH_YOMA_COVERAGE_IS_COMPLETE = MISHNAH_YOMA_COVERAGE_CHECKS.every(
  (check) => check.passed,
);

export const MISHNAH_YOMA_COVERAGE_SUMMARY = MISHNAH_YOMA_COVERAGE.reduce(
  (summary, unit) => {
    summary.total += 1;
    summary[unit.coverageMode] += 1;
    summary[unit.implementation] += 1;
    return summary;
  },
  {
    total: 0,
    "animated-action": 0,
    "contextual-demonstration": 0,
    "teaching-interlude": 0,
    planned: 0,
    prototype: 0,
    production: 0,
  } as Record<CoverageMode | ImplementationState | "total", number>,
);
