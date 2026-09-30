export type EvidenceGrade = "explicit" | "strong-inference" | "disputed" | "artistic";
export type GarmentState = "gold" | "white" | "ordinary";
export type CeremonyAction = "assemble" | "announce" | "immerse" | "change" | "walk" | "slaughter" | "offer" | "incense" | "confess" | "lottery" | "mark" | "carry" | "sprinkle" | "mix" | "pour" | "handoff" | "depart" | "read" | "pray" | "retrieve";
export type CeremonyStage = "dawn" | "outsideBath" | "altar" | "altarRamp" | "laver" | "parvah" | "bull" | "lottery" | "altarTop" | "incensePrep" | "holyPlace" | "holyOfHolies" | "curtain" | "goldenAltar" | "scapegoat" | "eastGate" | "reading" | "exit";
export type CeremonyRole = "highPriest" | "deputy" | "familyHead" | "appointedPriest" | "dawnObserver" | "assistingPriest" | "bloodStirrer" | "incenseAttendant" | "coalAttendant" | "garmentAttendant" | "handlerA" | "handlerB" | "scapegoatEscort" | "dignitary" | "torahAttendant" | "synagogueHead" | "offeringPriest" | "burningPriest" | "levite" | "congregationPriest" | "congregationIsraelite";

export type CeremonyBeat = {
  id: string; chapter: string; title: string; summary: string; source: string; sourceUrl: string;
  evidence: EvidenceGrade; duration: number; roles: CeremonyRole[]; actors: string[];
  stage: CeremonyStage; location: string; garment: GarmentState; action: CeremonyAction;
  immersion?: number; sanctifications?: string; ritualCount?: string; variantNote?: string;
  mishnahRef: string; mishnahHebrew: string;
};

export type RitualCounter = {
  current: number;
  total: number;
  phase: string;
  spokenHebrew: string;
};

export type ImmersionPhase = {
  title: string;
  detail: string;
  immersion?: number;
  sanctification?: number;
};

export type ConcurrentTrack = {
  id: "temple" | "wilderness" | "reading" | "burning";
  label: string;
  detail: string;
  status: "ממתין" | "מתרחש עכשיו" | "הושלם";
};

export type ConcurrentRouteState = {
  title: string;
  source: string;
  tracks: readonly [ConcurrentTrack, ConcurrentTrack];
};

export const OFFSITE_WILDERNESS_SPEC = {
  shelterCount: 10,
  routeRis: 90,
  risPerMil: 7.5,
  totalMil: 12,
  source: "Mishnah Yoma 6:4–6",
  presentation: "illustrative-scale" as const,
  childFacingCliffTreatment: "distant-non-graphic" as const,
};

export function getConcurrentRouteState(beat: CeremonyBeat): ConcurrentRouteState | null {
  if (["scapegoat-handoff", "scapegoat-departs", "wilderness-stations", "scapegoat-cliff"].includes(beat.id)) {
    return {
      title: "שני מסלולים נפרדים",
      source: "משנה יומא פרק ו׳",
      tracks: [
        { id:"temple", label:"במקדש", detail:"פר ושעיר הנשרפים ממתינים להוצאה", status:"ממתין" },
        { id:"wilderness", label:"למדבר", detail:"השעיר לעזאזל ממשיך עם המוליך", status:"מתרחש עכשיו" },
      ],
    };
  }
  if (beat.id === "carcasses-removed") {
    return {
      title: "שני מסלולים נפרדים",
      source: "משנה יומא ו׳:ז׳",
      tracks: [
        { id:"temple", label:"מבית המקדש", detail:"הפר והשעיר לה׳ מוצאים לבית השריפה", status:"מתרחש עכשיו" },
        { id:"wilderness", label:"במדבר", detail:"השעיר לעזאזל נמצא במסלול אחר", status:"מתרחש עכשיו" },
      ],
    };
  }
  if (beat.id === "wilderness-signal") {
    return {
      title: "הידיעה מגיעה לעזרה",
      source: "משנה יומא ו׳:ח׳",
      tracks: [
        { id:"temple", label:"בעזרה", detail:"הכהן הגדול מקבל את הסימן", status:"מתרחש עכשיו" },
        { id:"wilderness", label:"מן המדבר", detail:"המטפחות מודיעות שהשעיר הגיע", status:"הושלם" },
      ],
    };
  }
  if (["torah-reading", "simultaneous-reading-burning"].includes(beat.id)) {
    return {
      title: "שתי פעולות בעת אחת",
      source: "משנה יומא ז׳:א׳–ב׳",
      tracks: [
        { id:"reading", label:"קריאת התורה", detail:"הכהן הגדול קורא בעזרת הנשים", status:"מתרחש עכשיו" },
        { id:"burning", label:"בית השריפה", detail:"הפר והשעיר נשרפים במקום מרוחק", status:"מתרחש עכשיו" },
      ],
    };
  }
  return null;
}

const ONE_AND_SEVEN_COUNTS = [
  "אַחַת",
  "אַחַת וְאַחַת",
  "אַחַת וּשְׁתַּיִם",
  "אַחַת וְשָׁלֹשׁ",
  "אַחַת וְאַרְבַּע",
  "אַחַת וְחָמֵשׁ",
  "אַחַת וְשֵׁשׁ",
  "אַחַת וָשֶׁבַע",
] as const;

export function getRitualCounter(beat: CeremonyBeat, progress: number): RitualCounter | null {
  if (beat.action !== "sprinkle") return null;
  const clamped = Math.max(0, Math.min(0.999999, progress));
  if (beat.id === "golden-altar-blood") {
    const current = Math.floor(clamped * 11) + 1;
    return current <= 4
      ? { current, total: 11, phase: "מתנות על ארבע קרנות מזבח הזהב", spokenHebrew: `קרן ${current} מתוך 4` }
      : { current, total: 11, phase: "שבע הזאות על טהרו של מזבח", spokenHebrew: `הזאה ${current - 4} מתוך 7` };
  }
  const current = Math.floor(clamped * ONE_AND_SEVEN_COUNTS.length) + 1;
  return {
    current,
    total: ONE_AND_SEVEN_COUNTS.length,
    phase: current === 1 ? "אחת למעלה" : "שבע למטה",
    spokenHebrew: ONE_AND_SEVEN_COUNTS[current - 1],
  };
}

const sanctificationNumbers = (value?: string) => value?.split(/\s+of\s+/i)[0].match(/\d+/g)?.map(Number) ?? [];

export function getImmersionPhase(beat: CeremonyBeat, progress: number): ImmersionPhase | null {
  const clamped = Math.max(0, Math.min(0.999999, progress));
  const sanctifications = sanctificationNumbers(beat.sanctifications);
  if (beat.immersion) {
    if (beat.immersion === 1) {
      if (clamped < 0.18) return { title:"פָּרְסוּ סָדִין שֶׁל בּוּץ", detail:"מסך פרטיות בין הכהן הגדול ובין העם", immersion:1 };
      if (clamped < 0.32) return { title:"פָּשַׁט", detail:"מסיר את בגדי החול מאחורי המסך", immersion:1 };
      if (clamped < 0.62) return { title:"יָרַד וְטָבַל", detail:"הטבילה הראשונה מתוך חמש", immersion:1 };
      if (clamped < 0.78) return { title:"עָלָה וְנִסְתַּפֵּג", detail:"עולה ומתנגב", immersion:1 };
      return { title:"מוכן לבגדי זהב", detail:"הקידוש הראשון יבוא לאחר הלבישה", immersion:1 };
    }
    const before = sanctifications[0];
    const after = sanctifications[1];
    const garment = beat.garment === "gold" ? "בגדי זהב" : "בגדי לבן";
    if (clamped < 0.16) return { title:"קִדֵּשׁ יָדָיו וְרַגְלָיו", detail:`קידוש ${before} מתוך 10 לפני הפשיטה`, immersion:beat.immersion, sanctification:before };
    if (clamped < 0.3) return { title:"פָּשַׁט", detail:"מסיר את הבגדים מאחורי מסך הפרטיות", immersion:beat.immersion };
    if (clamped < 0.62) return { title:"יָרַד וְטָבַל", detail:`הטבילה ${beat.immersion} מתוך 5`, immersion:beat.immersion };
    if (clamped < 0.76) return { title:"עָלָה וְנִסְתַּפֵּג", detail:"עולה ומתנגב", immersion:beat.immersion };
    if (clamped < 0.9) return { title:`לובש ${garment}`, detail:"הבגד הבא מוכן בידי השמשים", immersion:beat.immersion };
    return { title:"קִדֵּשׁ יָדָיו וְרַגְלָיו", detail:`קידוש ${after} מתוך 10 לאחר הלבישה`, immersion:beat.immersion, sanctification:after };
  }
  if (beat.id === "dress-gold") {
    return clamped < 0.62
      ? { title:"לובש שמונה בגדי זהב", detail:"מתכונן לעבודת התמיד של שחר" }
      : { title:"קִדֵּשׁ יָדָיו וְרַגְלָיו", detail:"קידוש 1 מתוך 10 לאחר הלבישה", sanctification:1 };
  }
  if (beat.id === "departure") {
    if (clamped < 0.16) return { title:"קִדֵּשׁ יָדָיו וְרַגְלָיו", detail:"קידוש 10 מתוך 10 בסיום העבודה", sanctification:10 };
    if (clamped < 0.42) return { title:"פָּשַׁט", detail:"מסיר את בגדי הזהב" };
    if (clamped < 0.64) return { title:"לובש בגדי עצמו", detail:"העבודה הושלמה בשלום" };
    return { title:"מלווים אותו לביתו", detail:"עושה יום טוב לאוהביו" };
  }
  return null;
}

type CeremonyBeatDraft = Omit<CeremonyBeat, "mishnahRef" | "mishnahHebrew">;
const beat = (value: CeremonyBeatDraft) => value;

const RAW_YOM_KIPPUR_SERVICE: CeremonyBeatDraft[] = [
  beat({ id:"seven-day-separation", chapter:"Preparation", title:"Seven days of preparation", summary:"Seven days before Yom Kippur, the High Priest is separated to the Palhedrin Chamber and a substitute priest is prepared in case he becomes disqualified.", source:"Mishnah Yoma 1:1", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.1.1?lang=bi", evidence:"explicit", duration:14, roles:["highPriest","deputy","appointedPriest"], actors:["High Priest","Deputy","Substitute priest"], stage:"reading", location:"Palhedrin Chamber study setting", garment:"ordinary", action:"assemble" }),
  beat({ id:"seven-day-practice", chapter:"Preparation", title:"The High Priest rehearses the service", summary:"During the seven days he practices sprinkling blood, burning incense, tending the lamps and bringing the offering portions.", source:"Mishnah Yoma 1:2", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.1.2?lang=bi", evidence:"explicit", duration:18, roles:["highPriest","assistingPriest","incenseAttendant"], actors:["High Priest","Practice attendants"], stage:"holyPlace", location:"Court, Holy Place and outer altar", garment:"gold", action:"incense" }),
  beat({ id:"elders-rehearse-order", chapter:"Preparation", title:"The elders teach the order", summary:"Elders of the court read the order of the day with the High Priest and ask him to repeat it aloud.", source:"Mishnah Yoma 1:3", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.1.3?lang=bi", evidence:"explicit", duration:15, roles:["highPriest","appointedPriest","deputy"], actors:["High Priest","Elders of the court","Deputy"], stage:"reading", location:"Preparation chamber", garment:"ordinary", action:"read" }),
  beat({ id:"animals-pass-before", chapter:"Preparation", title:"The offerings pass before him", summary:"On Yom Kippur eve, bulls, rams and lambs pass before the High Priest at the eastern gate so he recognizes and rehearses the service.", source:"Mishnah Yoma 1:3", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.1.3?lang=bi", evidence:"explicit", duration:15, roles:["highPriest","handlerA","handlerB"], actors:["High Priest","Animal handlers"], stage:"eastGate", location:"Eastern gate", garment:"ordinary", action:"walk" }),
  beat({ id:"food-restriction", chapter:"Preparation", title:"Food is limited before night", summary:"As darkness approaches, attendants do not allow the High Priest to eat heavily, so that food will not bring on sleep.", source:"Mishnah Yoma 1:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.1.4?lang=bi", evidence:"explicit", duration:11, roles:["highPriest","garmentAttendant"], actors:["High Priest","Attendant"], stage:"reading", location:"Preparation chamber", garment:"ordinary", action:"assemble" }),
  beat({ id:"incense-oath", chapter:"Night before", title:"The elders administer the oath", summary:"The elders of the priesthood take the High Priest to the House of Avtinas and charge him not to change the prescribed incense procedure.", source:"Mishnah Yoma 1:5", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.1.5?lang=bi", evidence:"explicit", duration:16, roles:["highPriest","deputy","familyHead"], actors:["High Priest","Elders of the priesthood"], stage:"incensePrep", location:"Upper chamber of the House of Avtinas", garment:"ordinary", action:"pray" }),
  beat({ id:"night-study", chapter:"Night before", title:"Study through the night", summary:"The High Priest teaches or listens while passages from Job, Ezra, Chronicles and, in one testimony, Daniel are read before him.", source:"Mishnah Yoma 1:6", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.1.6?lang=bi", evidence:"explicit", duration:17, roles:["highPriest","appointedPriest","torahAttendant"], actors:["High Priest","Students of the sages","Reader"], stage:"reading", location:"Night study chamber", garment:"ordinary", action:"read" }),
  beat({ id:"kept-awake", chapter:"Night before", title:"Young priests keep him awake", summary:"If he begins to doze, young priests snap their fingers and ask him to stand and cool himself on the floor until the time of slaughter.", source:"Mishnah Yoma 1:7", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.1.7?lang=bi", evidence:"explicit", duration:15, roles:["highPriest","appointedPriest","assistingPriest"], actors:["High Priest","Young priests"], stage:"reading", location:"Night watch area", garment:"ordinary", action:"assemble" }),
  beat({ id:"midnight-ash-removal", chapter:"Night before", title:"The altar service begins at midnight", summary:"On Yom Kippur the removal of ashes begins at midnight, earlier than on an ordinary day, while the court fills before dawn.", source:"Mishnah Yoma 1:8", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.1.8?lang=bi", evidence:"explicit", duration:16, roles:["appointedPriest","assistingPriest","congregationPriest","congregationIsraelite"], actors:["Ash-removal priest","Assisting priests","Gathering congregation"], stage:"altarTop", location:"Outer altar", garment:"ordinary", action:"carry" }),
  beat({ id:"original-ramp-race", chapter:"Ordinary service", title:"The original race up the ramp", summary:"Originally, priests who wanted to remove the ashes raced up the ramp; the priest who gained a four-cubit lead won the task.", source:"Mishnah Yoma 2:1", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.2.1?lang=bi", evidence:"explicit", duration:16, roles:["appointedPriest","assistingPriest"], actors:["Competing priests"], stage:"altarTop", location:"Southern altar ramp", garment:"ordinary", action:"walk" }),
  beat({ id:"race-ended", chapter:"Ordinary service", title:"The dangerous race is ended", summary:"After one priest pushed another and his leg was broken, the court replaced the race with the first lottery. The event is explained without graphic depiction.", source:"Mishnah Yoma 2:2", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.2.2?lang=bi", evidence:"explicit", duration:14, roles:["appointedPriest","assistingPriest","deputy"], actors:["Competing priests","Court official"], stage:"altar", location:"Foot of the altar ramp", garment:"ordinary", action:"announce" }),
  beat({ id:"second-lottery", chapter:"Ordinary service", title:"The second lottery assigns thirteen tasks", summary:"The second lottery assigns slaughter, blood application, inner-altar and menorah service, and the priests who carry the lamb's portions, flour, griddle cakes and wine.", source:"Mishnah Yoma 2:3", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.2.3?lang=bi", evidence:"explicit", duration:17, roles:["appointedPriest"], actors:["Appointed priest","Thirteen selected priests"], stage:"altar", location:"Lottery gathering in the court", garment:"ordinary", action:"lottery" }),
  beat({ id:"third-fourth-lotteries", chapter:"Ordinary service", title:"The third and fourth lotteries", summary:"Priests new to the incense service enter the third lottery; new and experienced priests enter the fourth lottery for carrying portions from the ramp to the altar.", source:"Mishnah Yoma 2:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.2.4?lang=bi", evidence:"explicit", duration:15, roles:["appointedPriest"], actors:["Appointed priest","Lottery participants"], stage:"altar", location:"Lottery gathering in the court", garment:"ordinary", action:"lottery" }),
  beat({ id:"daily-lamb-procession", chapter:"Ordinary service", title:"The nine-carrier daily lamb procession", summary:"Nine priests carry the assigned loads: head and right hind leg; two forelegs; tail and left hind leg; breast and neck; two flanks; innards; fine flour; griddle cakes; and wine. Additional carriers bring water, wood or frankincense on the occasions listed by the Mishnah.", source:"Mishnah Yoma 2:3, 2:5", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.2.3?lang=bi", evidence:"explicit", duration:20, roles:["appointedPriest"], actors:["Nine named-load service priests","Additional carriers"], stage:"altar", location:"Marble tables, court procession and ramp", garment:"ordinary", action:"carry" }),
  beat({ id:"ram-procession", chapter:"Ordinary service", title:"Eleven carry the ram offering", summary:"Five priests carry the meat of the ram, while pairs carry the innards, fine flour and wine: eleven participants in all.", source:"Mishnah Yoma 2:6", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.2.6?lang=bi", evidence:"explicit", duration:14, roles:["appointedPriest"], actors:["Eleven service participants"], stage:"altar", location:"Court procession to the ramp", garment:"ordinary", action:"carry" }),
  beat({ id:"bull-procession", chapter:"Ordinary service", title:"Twenty-four carry the bull offering", summary:"The Mishnah assigns the bull's parts and accompanying flour and wine among twenty-four participants, while noting the rule for communal and individual offerings.", source:"Mishnah Yoma 2:7", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.2.7?lang=bi", evidence:"explicit", duration:16, roles:["appointedPriest"], actors:["Twenty-four service participants"], stage:"altar", location:"Court procession to the ramp", garment:"ordinary", action:"carry" }),
  beat({ id:"dawn", chapter:"Dawn", title:"The eastern sky is confirmed", summary:"The appointed priest sends an observer to verify that dawn has reached the east before the daily offering begins.", source:"Mishnah Yoma 3:1", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.3.1?lang=bi", evidence:"explicit", duration:10, roles:["appointedPriest","dawnObserver"], actors:["Appointed priest","Dawn observer"], stage:"dawn", location:"Eastern side of the court", garment:"ordinary", action:"announce" }),
  beat({ id:"why-confirm-dawn", chapter:"Dawn", title:"Why dawn must be confirmed", summary:"The Mishnah recalls the time moonlight was mistaken for dawn and the daily offering had to be burned. It then teaches the immersion and sanctification rules.", source:"Mishnah Yoma 3:2", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.3.2?lang=bi", evidence:"explicit", duration:15, roles:["appointedPriest","dawnObserver","highPriest"], actors:["Appointed priest","Dawn observer","High Priest"], stage:"dawn", location:"Eastern observation point", garment:"ordinary", action:"read" }),
  beat({ id:"first-immersion", chapter:"Morning service", title:"First immersion", summary:"A linen screen is spread for privacy. The High Priest removes his ordinary clothes, immerses outside the sacred court, dries and prepares to dress.", source:"Mishnah Yoma 3:3–4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.3.3-4?lang=bi", evidence:"explicit", duration:14, roles:["highPriest","garmentAttendant"], actors:["High Priest","Immersion attendants"], stage:"outsideBath", location:"Immersion place outside the Azarah", garment:"ordinary", action:"immerse", immersion:1 }),
  beat({ id:"dress-gold", chapter:"Morning service", title:"Golden garments and sanctification", summary:"Attendants bring the eight golden garments. The High Priest dresses and sanctifies his hands and feet for the regular morning service.", source:"Mishnah Yoma 3:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.3.4?lang=bi", evidence:"explicit", duration:11, roles:["highPriest","garmentAttendant"], actors:["High Priest","Garment attendants"], stage:"outsideBath", location:"Morning dressing area", garment:"gold", action:"change", sanctifications:"1 of 10" }),
  beat({ id:"morning-tamid", chapter:"Morning service", title:"Morning daily offering: slaughter through preparation", summary:"The High Priest cuts most of the lamb’s windpipe and gullet; another priest completes the slaughter while the High Priest receives and applies the blood. The teaching view then follows the restrained Tamid sequence through the hooks, division, washing on the marble tables and assignment to carriers.", source:"Mishnah Yoma 3:4; Mishnah Tamid 4:2–3", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.3.4?lang=bi", evidence:"explicit", duration:24, roles:["highPriest","assistingPriest","offeringPriest"], actors:["High Priest","Priest completing the slaughter","Offering priests","Nine portion carriers"], stage:"altar", location:"Slaughter rings, hooks, marble tables and ramp approach", garment:"gold", action:"slaughter", variantNote:"The contact sequence follows Tamid 4:2–3. The exact appearance of unsized utensils and the compressed timing of the teaching view are reconstructed." }),
  beat({ id:"morning-incense", chapter:"Morning service", title:"Morning incense and lamps", summary:"The High Priest enters the Sanctuary, burns the morning incense and tends the lamps of the menorah.", source:"Mishnah Yoma 3:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.3.4?lang=bi", evidence:"explicit", duration:14, roles:["highPriest","incenseAttendant"], actors:["High Priest","Incense attendant"], stage:"holyPlace", location:"Holy Place · incense altar and menorah", garment:"gold", action:"incense" }),
  beat({ id:"morning-completion", chapter:"Morning service", title:"Morning offering is completed", summary:"The head and limbs, the High Priest’s griddle-cake offering and the wine libation are brought to the altar.", source:"Mishnah Yoma 3:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.3.4?lang=bi", evidence:"explicit", duration:13, roles:["highPriest","offeringPriest","levite"], actors:["High Priest","Offering priests","Levites"], stage:"altarTop", location:"Outer altar", garment:"gold", action:"offer" }),
  beat({ id:"incense-order-and-warm-water", chapter:"Morning service", title:"Morning order and warmed immersion water", summary:"The morning incense comes between the blood and the limbs; the afternoon incense comes between the limbs and libations. Warm water may temper the immersion water for an elderly or delicate High Priest.", source:"Mishnah Yoma 3:5", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.3.5?lang=bi", evidence:"explicit", duration:15, roles:["highPriest","incenseAttendant","garmentAttendant"], actors:["High Priest","Incense attendant","Immersion attendant"], stage:"parvah", location:"Parvah immersion place", garment:"gold", action:"read" }),
  beat({ id:"second-immersion", chapter:"White garments", title:"Second immersion and white garments", summary:"At the Parvah immersion place the High Priest sanctifies, removes the golden garments, immerses, dries, dresses in white linen and sanctifies again.", source:"Mishnah Yoma 3:6", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.3.6?lang=bi", evidence:"explicit", duration:18, roles:["highPriest","garmentAttendant"], actors:["High Priest","Immersion and garment attendants"], stage:"parvah", location:"Roof of the Parvah Chamber", garment:"white", action:"immerse", immersion:2, sanctifications:"2–3 of 10" }),
  beat({ id:"white-garment-values", chapter:"White garments", title:"Morning and afternoon linen garments", summary:"Rabbi Meir and the Sages give different values for the morning and afternoon linen garments. The garments are public property, while the High Priest may add value from his own funds.", source:"Mishnah Yoma 3:7", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.3.7?lang=bi", evidence:"explicit", duration:15, roles:["highPriest","garmentAttendant"], actors:["High Priest","Garment attendant"], stage:"parvah", location:"Parvah dressing place", garment:"white", action:"change" }),
  beat({ id:"bull-first-confession", chapter:"Confessions and lots", title:"First confession over the bull", summary:"Standing east of his bull, facing west, the High Priest places both hands on it and confesses for himself and his household. The court responds when the divine name is heard.", source:"Mishnah Yoma 3:8", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.3.8?lang=bi", evidence:"explicit", duration:16, roles:["highPriest","deputy","congregationPriest","congregationIsraelite"], actors:["High Priest","Deputy","Priests and people in the court"], stage:"bull", location:"Between the porch and altar", garment:"white", action:"confess" }),
  beat({ id:"goat-assembly", chapter:"Confessions and lots", title:"The goats and officials assemble", summary:"Two goats stand on the east of the court, north of the altar. The deputy stands to the High Priest’s right and the head of the priestly family to his left.", source:"Mishnah Yoma 3:9", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.3.9?lang=bi", evidence:"explicit", duration:12, roles:["highPriest","deputy","familyHead","handlerA","handlerB"], actors:["High Priest","Deputy","Head of priestly family","Two animal handlers"], stage:"lottery", location:"East of the court · north of the altar", garment:"white", action:"assemble" }),
  beat({ id:"temple-benefactors", chapter:"Court vessels", title:"Temple improvements remembered for praise", summary:"Ben Katin added twelve spouts and a lowering device to the laver. Monobaz, Queen Helena and Nicanor are remembered for their contributions to the Temple.", source:"Mishnah Yoma 3:10", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.3.10?lang=bi", evidence:"explicit", duration:18, roles:["highPriest","appointedPriest"], actors:["High Priest","Temple instructor"], stage:"laver", location:"Twelve-spout laver", garment:"white", action:"read" }),
  beat({ id:"guarding-sacred-knowledge", chapter:"Court vessels", title:"Responsibility for sacred craft knowledge", summary:"The Mishnah contrasts remembered benefactors with craft families and specialists criticized for not teaching their Temple skills to others.", source:"Mishnah Yoma 3:11", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.3.11?lang=bi", evidence:"explicit", duration:17, roles:["highPriest","appointedPriest","incenseAttendant"], actors:["High Priest","Temple instructor","Incense specialist"], stage:"incensePrep", location:"Court teaching position", garment:"white", action:"read" }),
  beat({ id:"draw-lots", chapter:"Confessions and lots", title:"The two lots are drawn", summary:"The High Priest draws one lot in each hand. The deputy or family head directs him to raise the hand bearing the lot for the Lord, and he announces it.", source:"Mishnah Yoma 4:1", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.4.1?lang=bi", evidence:"explicit", duration:14, roles:["highPriest","deputy","familyHead","handlerA","handlerB"], actors:["High Priest","Deputy","Head of priestly family","Two handlers"], stage:"lottery", location:"Lottery receptacle north of the altar", garment:"white", action:"lottery" }),
  beat({ id:"mark-goats", chapter:"Confessions and lots", title:"The goats are marked and positioned", summary:"The lot for the Lord is placed on its goat. Scarlet wool distinguishes the goat for the Lord at its throat and the goat sent away at its head.", source:"Mishnah Yoma 4:1–2", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.4.1-2?lang=bi", evidence:"explicit", duration:12, roles:["highPriest","handlerA","handlerB"], actors:["High Priest","Two animal handlers"], stage:"lottery", location:"North of the altar", garment:"white", action:"mark" }),
  beat({ id:"bull-second-confession", chapter:"Bull and incense", title:"Second confession over the bull", summary:"The High Priest returns to the bull and confesses for himself, his household and the priesthood.", source:"Mishnah Yoma 4:2", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.4.2?lang=bi", evidence:"explicit", duration:16, roles:["highPriest","deputy","congregationPriest"], actors:["High Priest","Deputy","Priests in the court"], stage:"bull", location:"Between the porch and altar", garment:"white", action:"confess" }),
  beat({ id:"slaughter-bull", chapter:"Bull and incense", title:"The bull is slaughtered", summary:"The High Priest slaughters the bull, receives its blood and gives the bowl to a priest who continuously stirs it on the fourth pavement row so it will not congeal.", source:"Mishnah Yoma 4:3", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.4.3?lang=bi", evidence:"explicit", duration:16, roles:["highPriest","bloodStirrer","assistingPriest"], actors:["High Priest","Blood-stirring priest","Assisting priest"], stage:"bull", location:"Bull position and fourth pavement row", garment:"white", action:"slaughter" }),
  beat({ id:"take-coals", chapter:"Bull and incense", title:"Coals are taken from the altar", summary:"The High Priest ascends the altar, clears the upper coals aside and fills the Yom Kippur coal pan from the inner consumed coals.", source:"Mishnah Yoma 4:3–4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.4.3-4?lang=bi", evidence:"explicit", duration:14, roles:["highPriest","coalAttendant"], actors:["High Priest","Coal-pan attendant"], stage:"altarTop", location:"Top of the outer altar", garment:"white", action:"carry" }),
  beat({ id:"yom-kippur-coal-pan", chapter:"Bull and incense", title:"The special Yom Kippur coal pan", summary:"Unlike the daily two-pan transfer, the High Priest uses one lighter gold pan with a longer handle and carries it directly inside. The incense is also ground especially fine.", source:"Mishnah Yoma 4:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.4.4?lang=bi", evidence:"explicit", duration:17, roles:["highPriest","coalAttendant"], actors:["High Priest","Coal-pan attendant"], stage:"altarTop", location:"Top of the outer altar", garment:"white", action:"carry" }),
  beat({ id:"central-ramp-and-gold-pitcher", chapter:"Bull and incense", title:"The High Priest’s ramp route and gold pitcher", summary:"The High Priest ascends and descends in the center of the ramp and sanctifies his hands and feet from a gold pitcher; Rabbi Judah states these were always his privileges.", source:"Mishnah Yoma 4:5", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.4.5?lang=bi", evidence:"explicit", duration:16, roles:["highPriest","garmentAttendant"], actors:["High Priest","Attendant with gold pitcher"], stage:"altarRamp", location:"Center of the altar ramp", garment:"white", action:"walk" }),
  beat({ id:"altar-fire-arrangements", chapter:"Bull and incense", title:"The extra altar fire arrangement", summary:"The sages disagree whether an ordinary day had two, three or four fire arrangements; each opinion adds one more arrangement for Yom Kippur.", source:"Mishnah Yoma 4:6", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.4.6?lang=bi", evidence:"disputed", duration:16, roles:["highPriest","coalAttendant"], actors:["High Priest","Coal-pan attendant"], stage:"altarTop", location:"Top of the outer altar", garment:"white", action:"read", variantNote:"The model identifies the dispute rather than blending the three counts into one claimed layout." }),
  beat({ id:"prepare-incense", chapter:"Bull and incense", title:"Incense is measured into the spoon", summary:"They bring the spoon and coal pan. The High Priest takes a double handful of incense and transfers it into the spoon for the inner service.", source:"Mishnah Yoma 5:1", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.5.1?lang=bi", evidence:"explicit", duration:14, roles:["highPriest","incenseAttendant"], actors:["High Priest","Incense attendant"], stage:"incensePrep", location:"Incense preparation position in the court", garment:"white", action:"incense" }),
  beat({ id:"carry-incense", chapter:"Inner service", title:"The High Priest enters the Sanctuary", summary:"He carries the coal pan in his right hand and the incense spoon in his left and walks through the Sanctuary toward the curtains.", source:"Mishnah Yoma 5:1", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.5.1?lang=bi", evidence:"explicit", duration:16, roles:["highPriest"], actors:["High Priest"], stage:"curtain", location:"Holy Place to the inner curtains", garment:"white", action:"walk", variantNote:"Default display uses the two-curtain route described by the first opinion; Rabbi Yose describes one curtain." }),
  beat({ id:"inner-incense", chapter:"Inner service", title:"Incense fills the Holy of Holies", summary:"Inside, the High Priest places the coal pan on the Foundation Stone, heaps the incense upon the coals and waits until smoke fills the chamber.", source:"Mishnah Yoma 5:1", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.5.1?lang=bi", evidence:"explicit", duration:18, roles:["highPriest"], actors:["High Priest"], stage:"holyOfHolies", location:"Holy of Holies · Foundation Stone", garment:"white", action:"incense" }),
  beat({ id:"foundation-stone", chapter:"Inner service", title:"The Foundation Stone in the Second Temple", summary:"After the Ark was gone, the Foundation Stone stood three fingerbreadths above the floor. The High Priest placed the incense pan upon it.", source:"Mishnah Yoma 5:2", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.5.2?lang=bi", evidence:"explicit", duration:14, roles:["highPriest"], actors:["High Priest"], stage:"holyOfHolies", location:"Holy of Holies · Foundation Stone", garment:"white", action:"read" }),
  beat({ id:"backward-exit-prayer", chapter:"Inner service", title:"Backward exit and brief prayer", summary:"The High Priest leaves without turning his back toward the sacred chamber and recites a brief prayer in the outer chamber.", source:"Mishnah Yoma 5:1", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.5.1?lang=bi", evidence:"explicit", duration:13, roles:["highPriest"], actors:["High Priest"], stage:"holyPlace", location:"Outer chamber of the Sanctuary", garment:"white", action:"pray" }),
  beat({ id:"bull-blood-inside", chapter:"Blood services", title:"Bull blood inside: one and seven", summary:"The High Priest takes the bull’s blood, reenters and sprinkles once upward and seven times downward, counting every application aloud.", source:"Mishnah Yoma 5:3", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.5.3?lang=bi", evidence:"explicit", duration:18, roles:["highPriest","bloodStirrer"], actors:["High Priest","Blood-stirring priest"], stage:"holyOfHolies", location:"Holy of Holies", garment:"white", action:"sprinkle", ritualCount:"Bull blood · 1 upward + 7 downward" }),
  beat({ id:"slaughter-lord-goat", chapter:"Blood services", title:"The goat for the Lord is slaughtered", summary:"The High Priest leaves the bull’s blood on its stand, goes out, slaughters the goat selected for the Lord and receives its blood.", source:"Mishnah Yoma 5:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.5.4?lang=bi", evidence:"explicit", duration:15, roles:["highPriest","handlerA","assistingPriest"], actors:["High Priest","Animal handler","Assisting priest"], stage:"lottery", location:"Slaughtering area north of the altar", garment:"white", action:"slaughter" }),
  beat({ id:"goat-blood-inside", chapter:"Blood services", title:"Goat blood inside: one and seven", summary:"The High Priest carries the goat’s blood inside and performs the same one upward and seven downward applications.", source:"Mishnah Yoma 5:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.5.4?lang=bi", evidence:"explicit", duration:18, roles:["highPriest"], actors:["High Priest"], stage:"holyOfHolies", location:"Holy of Holies", garment:"white", action:"sprinkle", ritualCount:"Goat blood · 1 upward + 7 downward" }),
  beat({ id:"bull-blood-curtain", chapter:"Blood services", title:"Bull blood before the curtain", summary:"Facing the curtain from the Holy Place, the High Priest applies the bull’s blood once upward and seven times downward.", source:"Mishnah Yoma 5:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.5.4?lang=bi", evidence:"explicit", duration:16, roles:["highPriest"], actors:["High Priest"], stage:"curtain", location:"Holy Place · before the inner curtain", garment:"white", action:"sprinkle", ritualCount:"Bull blood · curtain · 1 + 7" }),
  beat({ id:"goat-blood-curtain", chapter:"Blood services", title:"Goat blood before the curtain", summary:"The goat’s blood is applied before the curtain in the same one-and-seven count.", source:"Mishnah Yoma 5:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.5.4?lang=bi", evidence:"explicit", duration:16, roles:["highPriest"], actors:["High Priest"], stage:"curtain", location:"Holy Place · before the inner curtain", garment:"white", action:"sprinkle", ritualCount:"Goat blood · curtain · 1 + 7" }),
  beat({ id:"mix-blood", chapter:"Blood services", title:"The bull and goat blood are mixed", summary:"The High Priest pours the bloods together and returns the mixture between the bowls so they are fully combined.", source:"Mishnah Yoma 5:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.5.4?lang=bi", evidence:"explicit", duration:11, roles:["highPriest"], actors:["High Priest"], stage:"goldenAltar", location:"Holy Place · golden altar", garment:"white", action:"mix" }),
  beat({ id:"golden-altar-blood", chapter:"Blood services", title:"Blood is applied to the golden altar", summary:"After clearing the altar’s surface, the High Priest applies blood to its four corners and sprinkles seven times on its cleared top.", source:"Mishnah Yoma 5:5–6", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.5.5-6?lang=bi", evidence:"explicit", duration:18, roles:["highPriest"], actors:["High Priest"], stage:"goldenAltar", location:"Holy Place · golden incense altar", garment:"white", action:"sprinkle", ritualCount:"Four corners + 7 on the altar top" }),
  beat({ id:"pour-remainder", chapter:"Blood services", title:"The remaining blood is poured out", summary:"The remainder is carried outside and poured at the prescribed base of the outer altar, joining the Temple drainage system.", source:"Mishnah Yoma 5:6", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.5.6?lang=bi", evidence:"explicit", duration:12, roles:["highPriest"], actors:["High Priest"], stage:"altar", location:"Outer altar base", garment:"white", action:"pour" }),
  beat({ id:"service-order-rule", chapter:"Blood services", title:"The order of the inner service is essential", summary:"The inner services must follow their prescribed order. If blood is spilled or a stage is done out of sequence, the Mishnah explains which applications must be repeated and records a dispute about where to resume.", source:"Mishnah Yoma 5:7", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.5.7?lang=bi", evidence:"disputed", duration:18, roles:["highPriest","appointedPriest"], actors:["High Priest","Temple instructor"], stage:"goldenAltar", location:"Holy Place · teaching reconstruction", garment:"white", action:"read", variantNote:"Rabbi Elazar and Rabbi Shimon say he resumes from the point at which he stopped." }),
  beat({ id:"matched-goats-rule", chapter:"Scapegoat", title:"The two goats should match", summary:"The two goats should be alike in appearance, height, value and purchase time. The Mishnah also explains how a replacement pair is selected if one dies.", source:"Mishnah Yoma 6:1", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.6.1?lang=bi", evidence:"explicit", duration:18, roles:["highPriest","handlerA","handlerB","appointedPriest"], actors:["High Priest","Two handlers","Temple instructor"], stage:"lottery", location:"The matched goats north of the altar", garment:"white", action:"read" }),
  beat({ id:"scapegoat-confession", chapter:"Scapegoat", title:"Third confession over the scapegoat", summary:"The High Priest places both hands on the goat sent away and confesses for the people of Israel; the priests and people respond.", source:"Mishnah Yoma 6:2", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.6.2?lang=bi", evidence:"explicit", duration:17, roles:["highPriest","handlerB","scapegoatEscort","congregationPriest","congregationIsraelite"], actors:["High Priest","Animal handler","Designated escort","Court congregation"], stage:"scapegoat", location:"Scapegoat position north of the altar", garment:"white", action:"confess" }),
  beat({ id:"scapegoat-handoff", chapter:"Scapegoat", title:"The scapegoat is handed to its escort", summary:"The High Priest transfers the goat to the designated escort, who takes it onto the specially prepared ramp shielding it from the crowd.", source:"Mishnah Yoma 6:3–4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.6.3-4?lang=bi", evidence:"explicit", duration:14, roles:["highPriest","handlerB","scapegoatEscort"], actors:["High Priest","Animal handler","Designated escort"], stage:"eastGate", location:"Special exit ramp toward the eastern gate", garment:"white", action:"handoff" }),
  beat({ id:"scapegoat-departs", chapter:"Scapegoat", title:"The escort leaves the Temple", summary:"The escort leads the goat eastward. The wilderness stations and cliff are shown as an off-site continuation because they lie beyond the Temple model.", source:"Mishnah Yoma 6:4–8", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.6.4-8?lang=bi", evidence:"explicit", duration:16, roles:["scapegoatEscort","handlerB","dignitary"], actors:["Designated escort","Jerusalem dignitaries at the first stage","Station attendants"], stage:"exit", location:"Eastern exit · continuation toward the wilderness", garment:"white", action:"depart" }),
  beat({ id:"wilderness-stations", chapter:"Scapegoat", title:"Food, water and escorts at every station", summary:"At each wilderness shelter they offer the escort food and water. Companions escort him from shelter to shelter, while the final companion watches from a distance.", source:"Mishnah Yoma 6:5", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.6.5?lang=bi", evidence:"explicit", duration:17, roles:["scapegoatEscort","dignitary","handlerB"], actors:["Designated escort","Station attendants","Final observer"], stage:"exit", location:"Off-site wilderness route", garment:"white", action:"handoff" }),
  beat({ id:"scapegoat-cliff", chapter:"Scapegoat", title:"The wilderness rite is completed", summary:"At the cliff the escort divides the scarlet strip, fastens half to the rock and half between the goat’s horns, and completes the rite. The child-facing view uses a distant symbolic silhouette rather than graphic imagery.", source:"Mishnah Yoma 6:6", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.6.6?lang=bi", evidence:"explicit", duration:18, roles:["scapegoatEscort"], actors:["Designated escort"], stage:"exit", location:"Off-site cliff · symbolic teaching view", garment:"white", action:"depart" }),
  beat({ id:"carcasses-removed", chapter:"Scapegoat", title:"Bull and goat are removed for burning", summary:"The bull and goat whose blood was brought inside are taken out for burning. This work proceeds while the scapegoat journey continues.", source:"Mishnah Yoma 6:7; 7:1", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.6.7?lang=bi", evidence:"explicit", duration:13, roles:["burningPriest","assistingPriest"], actors:["Carcass-removal priests","Burning-site attendants"], stage:"eastGate", location:"Court exit toward the burning place", garment:"white", action:"carry" }),
  beat({ id:"wilderness-signal", chapter:"Scapegoat", title:"The court learns that the goat arrived", summary:"The visualization follows the selected Mishnah Yoma 6:8 opinion: waved cloths, an estimate of the three-mil walking time, or a scarlet strip whitening at the Sanctuary entrance.", source:"Mishnah Yoma 6:8", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.6.8?lang=bi", evidence:"disputed", duration:17, roles:["dignitary","highPriest","appointedPriest"], actors:["Signal watchers","High Priest","Temple official"], stage:"eastGate", location:"Eastern sightline, court or Sanctuary entrance", garment:"white", action:"announce", variantNote:"The Mishnah preserves three alternatives. The selected option is shown by itself; Rabbi Yishmael says entrance of the Hekhal, not a window." }),
  beat({ id:"torah-reading", chapter:"Reading", title:"Torah reading and eight blessings", summary:"In white garments the High Priest reads the prescribed passages. The scroll passes from the synagogue attendant to its head, to the deputy and then to the High Priest; he concludes with eight blessings.", source:"Mishnah Yoma 7:1", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.7.1?lang=bi", evidence:"explicit", duration:22, roles:["highPriest","torahAttendant","synagogueHead","deputy","levite","congregationPriest","congregationIsraelite"], actors:["High Priest","Synagogue attendant","Head of synagogue","Deputy","Congregation"], stage:"reading", location:"Women’s Court / reading platform", garment:"white", action:"read" }),
  beat({ id:"simultaneous-reading-burning", chapter:"Reading", title:"Two simultaneous scenes cannot both be watched", summary:"A viewer watching the High Priest read cannot also watch the bull and goat being burned, not because either is forbidden, but because the places are far apart and the actions happen together.", source:"Mishnah Yoma 7:2", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.7.2?lang=bi", evidence:"explicit", duration:17, roles:["highPriest","burningPriest","congregationIsraelite"], actors:["High Priest","Burning-site priests","Learners choosing a viewpoint"], stage:"reading", location:"Women’s Court with off-site comparison", garment:"white", action:"read" }),
  beat({ id:"third-immersion", chapter:"Additional offerings", title:"Third immersion and return to gold", summary:"The High Priest sanctifies, removes the white linen, immerses at Parvah, dresses in the golden garments and sanctifies again.", source:"Mishnah Yoma 7:3", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.7.3?lang=bi", evidence:"explicit", duration:18, roles:["highPriest","garmentAttendant"], actors:["High Priest","Immersion and garment attendants"], stage:"parvah", location:"Roof of the Parvah Chamber", garment:"gold", action:"immerse", immersion:3, sanctifications:"4–5 of 10" }),
  beat({ id:"rams-musaf", chapter:"Additional offerings", title:"Rams and additional offerings", summary:"In gold the High Priest offers his ram, the people’s ram and the remaining additional offerings according to the selected Mishnah ordering.", source:"Mishnah Yoma 7:3", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.7.3?lang=bi", evidence:"disputed", duration:20, roles:["highPriest","offeringPriest","levite"], actors:["High Priest","Offering priests","Levites"], stage:"altarTop", location:"Outer altar", garment:"gold", action:"offer", variantNote:"Default follows Rabbi Akiva’s ordering in Yoma 7:3. The placement of several additional offerings is disputed." }),
  beat({ id:"fourth-immersion", chapter:"Vessel retrieval", title:"Fourth immersion and return to white", summary:"The High Priest sanctifies, removes the golden garments, immerses, dresses in white linen and sanctifies again for one final entry.", source:"Mishnah Yoma 7:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.7.4?lang=bi", evidence:"explicit", duration:18, roles:["highPriest","garmentAttendant"], actors:["High Priest","Immersion and garment attendants"], stage:"parvah", location:"Roof of the Parvah Chamber", garment:"white", action:"immerse", immersion:4, sanctifications:"6–7 of 10" }),
  beat({ id:"retrieve-vessels", chapter:"Vessel retrieval", title:"The spoon and coal pan are retrieved", summary:"The High Priest reenters the Holy of Holies in white linen for the sole purpose of removing the incense spoon and coal pan left there earlier.", source:"Mishnah Yoma 7:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.7.4?lang=bi", evidence:"explicit", duration:17, roles:["highPriest"], actors:["High Priest"], stage:"holyOfHolies", location:"Holy of Holies · Foundation Stone", garment:"white", action:"retrieve" }),
  beat({ id:"fifth-immersion", chapter:"Afternoon service", title:"Fifth immersion and final golden garments", summary:"The High Priest sanctifies, removes the white linen, immerses, dresses in gold for the final regular service and sanctifies again.", source:"Mishnah Yoma 7:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.7.4?lang=bi", evidence:"explicit", duration:18, roles:["highPriest","garmentAttendant"], actors:["High Priest","Immersion and garment attendants"], stage:"parvah", location:"Roof of the Parvah Chamber", garment:"gold", action:"immerse", immersion:5, sanctifications:"8–9 of 10" }),
  beat({ id:"afternoon-tamid", chapter:"Afternoon service", title:"Afternoon daily offering", summary:"In the golden garments the High Priest completes the afternoon daily offering at the outer altar.", source:"Mishnah Yoma 7:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.7.4?lang=bi", evidence:"explicit", duration:15, roles:["highPriest","assistingPriest","offeringPriest","levite"], actors:["High Priest","Daily-offering priests","Levites"], stage:"altarTop", location:"Outer altar", garment:"gold", action:"offer" }),
  beat({ id:"afternoon-incense", chapter:"Afternoon service", title:"Afternoon incense", summary:"The High Priest enters the Holy Place in the golden garments and burns the afternoon incense on the golden altar.", source:"Mishnah Yoma 7:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.7.4?lang=bi", evidence:"explicit", duration:15, roles:["highPriest","incenseAttendant"], actors:["High Priest","Incense attendant"], stage:"goldenAltar", location:"Holy Place · golden incense altar", garment:"gold", action:"incense" }),
  beat({ id:"afternoon-lamps", chapter:"Afternoon service", title:"Tending and relighting the lamps", summary:"Still in the golden garments, the High Priest completes the lamp service in the Holy Place. The teaching view now moves cup by cup, showing the wick and service tools at the actual Menorah rather than seven detached lights.", source:"Mishnah Yoma 7:4; Mishnah Tamid 6:1", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.7.4?lang=bi", evidence:"explicit", duration:20, roles:["highPriest","assistingPriest"], actors:["High Priest","Assisting priest"], stage:"holyPlace", location:"Holy Place · Menorah cups and service steps", garment:"gold", action:"offer", variantNote:"The sources establish lamp tending and kindling, but the exact visualized cup order is an explicitly labelled teaching reconstruction." }),
  beat({ id:"departure", chapter:"Completion", title:"The High Priest leaves in his own clothes", summary:"After the tenth and final sanctification he removes the golden garments, dresses in his own clothes and is escorted home, where he makes a celebration for completing the service safely.", source:"Mishnah Yoma 7:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.7.4?lang=bi", evidence:"explicit", duration:18, roles:["highPriest","deputy","garmentAttendant"], actors:["High Priest","Deputy","Attendants","Accompanying people"], stage:"exit", location:"Eastern departure from the Temple", garment:"ordinary", action:"depart", sanctifications:"10 of 10" }),
  beat({ id:"home-celebration", chapter:"Completion", title:"A celebration for completing the service safely", summary:"After leaving the sanctuary safely, the High Priest makes a day of celebration for those who love him.", source:"Mishnah Yoma 7:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.7.4?lang=bi", evidence:"explicit", duration:14, roles:["highPriest","deputy","garmentAttendant","congregationPriest","congregationIsraelite"], actors:["High Priest","Family and accompanying community"], stage:"exit", location:"Beyond the Temple Mount · homeward celebration", garment:"ordinary", action:"assemble" }),
  beat({ id:"priestly-garments-summary", chapter:"Completion", title:"Eight garments and four garments", summary:"An ordinary priest serves in tunic, trousers, headdress and sash. The High Priest adds the breastpiece, ephod, robe and frontlet; the Mishnah then discusses consulting the Urim and Tummim.", source:"Mishnah Yoma 7:5", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.7.5?lang=bi", evidence:"explicit", duration:19, roles:["highPriest","appointedPriest"], actors:["High Priest","Ordinary priest","Temple instructor"], stage:"reading", location:"Garment comparison teaching view", garment:"gold", action:"read" }),
  beat({ id:"afflictions-of-the-day", chapter:"Teaching", title:"The afflictions of Yom Kippur", summary:"The Mishnah lists eating, drinking, washing, anointing, leather footwear and marital relations, then records a dispute concerning limited exceptions.", source:"Mishnah Yoma 8:1", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.8.1?lang=bi", evidence:"explicit", duration:18, roles:["appointedPriest","congregationIsraelite"], actors:["Teacher","Learners"], stage:"reading", location:"Post-service learning circle", garment:"ordinary", action:"read" }),
  beat({ id:"food-drink-measures", chapter:"Teaching", title:"The Mishnah’s food and drink measures", summary:"The text defines separate minimum measures for eating and drinking and explains which foods or drinks combine toward their respective measures.", source:"Mishnah Yoma 8:2", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.8.2?lang=bi", evidence:"explicit", duration:17, roles:["appointedPriest","congregationIsraelite"], actors:["Teacher","Learners"], stage:"reading", location:"Post-service learning circle", garment:"ordinary", action:"read" }),
  beat({ id:"liability-categories", chapter:"Teaching", title:"Actions and liability categories", summary:"The Mishnah distinguishes acts done during one lapse of awareness and explains the status of substances not fit for ordinary eating or drinking.", source:"Mishnah Yoma 8:3", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.8.3?lang=bi", evidence:"explicit", duration:17, roles:["appointedPriest","congregationIsraelite"], actors:["Teacher","Learners"], stage:"reading", location:"Post-service learning circle", garment:"ordinary", action:"read" }),
  beat({ id:"children-and-fasting", chapter:"Teaching", title:"Children learn gradually", summary:"Children are not made to fast fully. Education begins gradually in the years before obligation so they become accustomed to the mitzvot.", source:"Mishnah Yoma 8:4", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.8.4?lang=bi", evidence:"explicit", duration:17, roles:["appointedPriest","congregationIsraelite"], actors:["Teacher","Families and learners"], stage:"reading", location:"Post-service learning circle", garment:"ordinary", action:"read" }),
  beat({ id:"health-over-fasting", chapter:"Teaching", title:"Health needs override fasting", summary:"A pregnant person overcome by a craving is fed until restored. A sick person is fed according to experts—or according to their own statement when experts are unavailable.", source:"Mishnah Yoma 8:5", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.8.5?lang=bi", evidence:"explicit", duration:18, roles:["appointedPriest","congregationIsraelite"], actors:["Teacher","Caregiver","Patient"], stage:"reading", location:"Post-service learning circle", garment:"ordinary", action:"read" }),
  beat({ id:"danger-overrides-prohibition", chapter:"Teaching", title:"Possible danger overrides prohibition", summary:"The Mishnah gives historical medical examples and states the controlling principle: possible danger to life overrides Shabbat.", source:"Mishnah Yoma 8:6", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.8.6?lang=bi", evidence:"explicit", duration:18, roles:["appointedPriest","congregationIsraelite"], actors:["Teacher","Caregiver","Learners"], stage:"reading", location:"Post-service learning circle", garment:"ordinary", action:"read" }),
  beat({ id:"rescue-from-rubble", chapter:"Teaching", title:"Rescue continues whenever life may remain", summary:"Even amid uncertainty about identity or survival, rescuers clear fallen material. If the person is found alive, rescue continues.", source:"Mishnah Yoma 8:7", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.8.7?lang=bi", evidence:"explicit", duration:18, roles:["appointedPriest","congregationIsraelite","assistingPriest"], actors:["Teacher","Rescuers","Learners"], stage:"reading", location:"Post-service learning circle", garment:"ordinary", action:"read" }),
  beat({ id:"atonement-and-repentance", chapter:"Teaching", title:"Atonement and repentance", summary:"Offerings, death and Yom Kippur atone in the ways the Mishnah defines, while repentance addresses lighter wrongs and prepares atonement for serious ones.", source:"Mishnah Yoma 8:8", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.8.8?lang=bi", evidence:"explicit", duration:19, roles:["appointedPriest","congregationPriest","congregationIsraelite"], actors:["Teacher","Priests and Israelite learners"], stage:"reading", location:"Post-service learning circle", garment:"ordinary", action:"read" }),
  beat({ id:"reconciliation-and-hope", chapter:"Teaching", title:"Reconciliation, repentance and hope", summary:"Yom Kippur does not excuse deliberate plans to sin, and wrongs between people require reconciliation. Rabbi Akiva closes with Israel’s hope in divine purification.", source:"Mishnah Yoma 8:9", sourceUrl:"https://www.sefaria.org/Mishnah_Yoma.8.9?lang=bi", evidence:"explicit", duration:24, roles:["appointedPriest","congregationPriest","congregationIsraelite"], actors:["Teacher","Priests and Israelite learners"], stage:"reading", location:"Post-service learning circle", garment:"ordinary", action:"pray" }),
];

const MISHNAH_BY_BEAT: Record<string, { mishnahRef: string; mishnahHebrew: string }> = {
  dawn:{mishnahRef:"משנה יומא ג׳:א׳",mishnahHebrew:"אָמַר לָהֶם הַמְמֻנֶּה, צְאוּ וּרְאוּ אִם הִגִּיעַ זְמַן הַשְּׁחִיטָה. אִם הִגִּיעַ, הָרוֹאֶה אוֹמֵר, בַּרְקַאי."},
  "first-immersion":{mishnahRef:"משנה יומא ג׳:ג׳–ד׳",mishnahHebrew:"חָמֵשׁ טְבִילוֹת וַעֲשָׂרָה קִדּוּשִׁין טוֹבֵל כֹּהֵן גָּדוֹל וּמְקַדֵּשׁ בּוֹ בַיּוֹם... פֵּרְסוּ סָדִין שֶׁל בּוּץ בֵּינוֹ לְבֵין הָעָם. פָּשַׁט, יָרַד וְטָבַל, עָלָה וְנִסְתַּפֵּג."},
  "dress-gold":{mishnahRef:"משנה יומא ג׳:ד׳",mishnahHebrew:"הֵבִיאוּ לוֹ בִגְדֵי זָהָב, וְלָבַשׁ וְקִדֵּשׁ יָדָיו וְרַגְלָיו."},
  "morning-tamid":{mishnahRef:"משנה יומא ג׳:ד׳",mishnahHebrew:"הֵבִיאוּ לוֹ אֶת הַתָּמִיד. קְרָצוֹ, וּמֵרַק אַחֵר שְׁחִיטָה עַל יָדוֹ. קִבֵּל אֶת הַדָּם וּזְרָקוֹ."},
  "morning-incense":{mishnahRef:"משנה יומא ג׳:ד׳",mishnahHebrew:"נִכְנַס לְהַקְטִיר קְטֹרֶת שֶׁל שַׁחַר, וּלְהֵטִיב אֶת הַנֵּרוֹת."},
  "morning-completion":{mishnahRef:"משנה יומא ג׳:ד׳",mishnahHebrew:"וּלְהַקְרִיב אֶת הָרֹאשׁ וְאֶת הָאֵבָרִים וְאֶת הַחֲבִתִּין וְאֶת הַיָּיִן."},
  "second-immersion":{mishnahRef:"משנה יומא ג׳:ו׳",mishnahHebrew:"הֱבִיאוּהוּ לְבֵית הַפַּרְוָה... יָרַד וְטָבַל, עָלָה וְנִסְתַּפֵּג. הֵבִיאוּ לוֹ בִגְדֵי לָבָן, לָבַשׁ וְקִדֵּשׁ יָדָיו וְרַגְלָיו."},
  "bull-first-confession":{mishnahRef:"משנה יומא ג׳:ח׳",mishnahHebrew:"בָּא לוֹ אֵצֶל פָּרוֹ... וְהַכֹּהֵן עוֹמֵד בַּמִּזְרָח וּפָנָיו לַמַּעֲרָב, וְסוֹמֵךְ שְׁתֵּי יָדָיו עָלָיו וּמִתְוַדֶּה."},
  "goat-assembly":{mishnahRef:"משנה יומא ג׳:ט׳",mishnahHebrew:"בָּא לוֹ לְמִזְרַח הָעֲזָרָה, לִצְפוֹן הַמִּזְבֵּחַ, הַסְּגָן מִימִינוֹ וְרֹאשׁ בֵּית אָב מִשְּׂמֹאלוֹ. וְשָׁם שְׁנֵי שְׂעִירִים."},
  "draw-lots":{mishnahRef:"משנה יומא ד׳:א׳",mishnahHebrew:"טָרַף בַּקַּלְפִּי וְהֶעֱלָה שְׁנֵי גוֹרָלוֹת. אֶחָד כָּתוּב עָלָיו לַשֵּׁם וְאֶחָד כָּתוּב עָלָיו לַעֲזָאזֵל."},
  "mark-goats":{mishnahRef:"משנה יומא ד׳:א׳–ב׳",mishnahHebrew:"נְתָנוֹ עַל שְׁנֵי הַשְּׂעִירִים וְאוֹמֵר, לַיְיָ חַטָּאת... קָשַׁר לָשׁוֹן שֶׁל זְהוֹרִית בְּרֹאשׁ שָׂעִיר הַמִּשְׁתַּלֵּחַ."},
  "bull-second-confession":{mishnahRef:"משנה יומא ד׳:ב׳",mishnahHebrew:"בָּא לוֹ אֵצֶל פָּרוֹ שְׁנִיָּה, וְסוֹמֵךְ שְׁתֵּי יָדָיו עָלָיו וּמִתְוַדֶּה."},
  "slaughter-bull":{mishnahRef:"משנה יומא ד׳:ג׳",mishnahHebrew:"שְׁחָטוֹ וְקִבֵּל בַּמִּזְרָק אֶת דָּמוֹ, וּנְתָנוֹ לְמִי שֶׁהוּא מְמָרֵס בּוֹ עַל הָרֹבֶד הָרְבִיעִי שֶׁבַּהֵיכָל, כְּדֵי שֶׁלֹּא יִקְרֹשׁ."},
  "take-coals":{mishnahRef:"משנה יומא ד׳:ג׳",mishnahHebrew:"נָטַל מַחְתָּה וְעָלָה לְרֹאשׁ הַמִּזְבֵּחַ, וּפִנָּה גֶחָלִים אֵילָךְ וְאֵילָךְ, וְחוֹתֶה מִן הַמְעֻכָּלוֹת הַפְּנִימִיּוֹת."},
  "prepare-incense":{mishnahRef:"משנה יומא ה׳:א׳",mishnahHebrew:"הוֹצִיאוּ לוֹ אֶת הַכַּף וְאֶת הַמַּחְתָּה, וְחָפַן מְלֹא חָפְנָיו וְנָתַן לְתוֹךְ הַכַּף."},
  "carry-incense":{mishnahRef:"משנה יומא ה׳:א׳",mishnahHebrew:"נָטַל אֶת הַמַּחְתָּה בִּימִינוֹ וְאֶת הַכַּף בִּשְׂמֹאלוֹ. הָיָה מְהַלֵּךְ בַּהֵיכָל, עַד שֶׁמַּגִּיעַ לְבֵין שְׁתֵּי הַפָּרֹכוֹת."},
  "inner-incense":{mishnahRef:"משנה יומא ה׳:א׳–ב׳",mishnahHebrew:"צָבַר אֶת הַקְּטֹרֶת עַל גַּבֵּי גֶחָלִים, וְנִתְמַלֵּא כָל הַבַּיִת כֻּלּוֹ עָשָׁן."},
  "backward-exit-prayer":{mishnahRef:"משנה יומא ה׳:א׳",mishnahHebrew:"יָצָא וּבָא לוֹ בְדֶרֶךְ בֵּית כְּנִיסָתוֹ, וּמִתְפַּלֵּל תְּפִלָּה קְצָרָה בַּבַּיִת הַחִיצוֹן."},
  "bull-blood-inside":{mishnahRef:"משנה יומא ה׳:ג׳",mishnahHebrew:"וְהִזָּה מִמֶּנּוּ אַחַת לְמַעְלָה וְשֶׁבַע לְמַטָּה... אַחַת, אַחַת וְאַחַת, אַחַת וּשְׁתַּיִם... אַחַת וָשֶׁבַע."},
  "slaughter-lord-goat":{mishnahRef:"משנה יומא ה׳:ד׳",mishnahHebrew:"הֵבִיאוּ לוֹ אֶת הַשָּׂעִיר, שְׁחָטוֹ וְקִבֵּל בַּמִּזְרָק אֶת דָּמוֹ."},
  "goat-blood-inside":{mishnahRef:"משנה יומא ה׳:ד׳",mishnahHebrew:"נִכְנַס לִמְקוֹם שֶׁנִּכְנַס, וְעָמַד בִּמְקוֹם שֶׁעָמַד, וְהִזָּה מִמֶּנּוּ אַחַת לְמַעְלָה וְשֶׁבַע לְמַטָּה."},
  "bull-blood-curtain":{mishnahRef:"משנה יומא ה׳:ד׳",mishnahHebrew:"נָטַל דַּם הַפָּר... וְהִזָּה מִמֶּנּוּ עַל הַפָּרֹכֶת שֶׁכְּנֶגֶד הָאָרוֹן מִבַּחוּץ, אַחַת לְמַעְלָה וְשֶׁבַע לְמַטָּה."},
  "goat-blood-curtain":{mishnahRef:"משנה יומא ה׳:ד׳",mishnahHebrew:"נָטַל דַּם הַשָּׂעִיר... וְהִזָּה מִמֶּנּוּ עַל הַפָּרֹכֶת שֶׁכְּנֶגֶד הָאָרוֹן מִבַּחוּץ, אַחַת לְמַעְלָה וְשֶׁבַע לְמַטָּה."},
  "mix-blood":{mishnahRef:"משנה יומא ה׳:ד׳",mishnahHebrew:"עֵרָה דַם הַפָּר לְתוֹךְ דַּם הַשָּׂעִיר, וְנָתַן אֶת הַמָּלֵא בָרֵיקָן."},
  "golden-altar-blood":{mishnahRef:"משנה יומא ה׳:ה׳–ו׳",mishnahHebrew:"וְיָצָא אֶל הַמִּזְבֵּחַ אֲשֶׁר לִפְנֵי יְיָ, זֶה מִזְבַּח הַזָּהָב... הִזָּה עַל טָהֳרוֹ שֶׁל מִזְבֵּחַ שֶׁבַע פְּעָמִים."},
  "pour-remainder":{mishnahRef:"משנה יומא ה׳:ו׳",mishnahHebrew:"וּשְׁיָרֵי הַדָּם הָיָה שׁוֹפֵךְ עַל יְסוֹד מַעֲרָבִי שֶׁל מִזְבֵּחַ הַחִיצוֹן."},
  "scapegoat-confession":{mishnahRef:"משנה יומא ו׳:ב׳",mishnahHebrew:"בָּא לוֹ אֵצֶל שָׂעִיר הַמִּשְׁתַּלֵּחַ וְסוֹמֵךְ שְׁתֵּי יָדָיו עָלָיו וּמִתְוַדֶּה."},
  "scapegoat-handoff":{mishnahRef:"משנה יומא ו׳:ג׳",mishnahHebrew:"מְסָרוֹ לְמִי שֶׁהָיָה מוֹלִיכוֹ. הַכֹּל כְּשֵׁרִין לְהוֹלִיכוֹ."},
  "scapegoat-departs":{mishnahRef:"משנה יומא ו׳:ד׳–ו׳",mishnahHebrew:"וְכֶבֶשׁ עָשׂוּ לוֹ... מִיַּקִּירֵי יְרוּשָׁלַיִם הָיוּ מְלַוִּין אוֹתוֹ עַד סֻכָּה הָרִאשׁוֹנָה."},
  "carcasses-removed":{mishnahRef:"משנה יומא ו׳:ז׳",mishnahHebrew:"בָּא לוֹ אֵצֶל פָּר וְשָׂעִיר הַנִּשְׂרָפִין... קְלָעָן בְּמִקְלָעוֹת, וְהוֹצִיאָן לְבֵית הַשְּׂרֵפָה."},
  "torah-reading":{mishnahRef:"משנה יומא ז׳:א׳",mishnahHebrew:"חַזַּן הַכְּנֶסֶת נוֹטֵל סֵפֶר תּוֹרָה וְנוֹתְנוֹ לְרֹאשׁ הַכְּנֶסֶת, וְרֹאשׁ הַכְּנֶסֶת נוֹתְנוֹ לַסְּגָן, וְהַסְּגָן נוֹתְנוֹ לְכֹהֵן גָּדוֹל."},
  "third-immersion":{mishnahRef:"משנה יומא ז׳:ג׳",mishnahHebrew:"קִדֵּשׁ יָדָיו וְרַגְלָיו, פָּשַׁט יָרַד וְטָבַל, עָלָה וְנִסְתַּפֵּג. הֵבִיאוּ לוֹ בִגְדֵי זָהָב, וְלָבַשׁ."},
  "rams-musaf":{mishnahRef:"משנה יומא ז׳:ג׳",mishnahHebrew:"וְיָצָא וְעָשָׂה אֶת אֵילוֹ וְאֶת אֵיל הָעָם... דִּבְרֵי רַבִּי אֱלִיעֶזֶר. רַבִּי עֲקִיבָא אוֹמֵר..."},
  "fourth-immersion":{mishnahRef:"משנה יומא ז׳:ד׳",mishnahHebrew:"קִדֵּשׁ יָדָיו וְרַגְלָיו, וּפָשַׁט וְיָרַד וְטָבַל וְעָלָה וְנִסְתַּפֵּג. הֵבִיאוּ לוֹ בִגְדֵי לָבָן, וְלָבַשׁ."},
  "retrieve-vessels":{mishnahRef:"משנה יומא ז׳:ד׳",mishnahHebrew:"נִכְנַס לְהוֹצִיא אֶת הַכַּף וְאֶת הַמַּחְתָּה."},
  "fifth-immersion":{mishnahRef:"משנה יומא ז׳:ד׳",mishnahHebrew:"קִדֵּשׁ יָדָיו וְרַגְלָיו, וּפָשַׁט וְיָרַד וְטָבָל, עָלָה וְנִסְתַּפֵּג. הֵבִיאוּ לוֹ בִגְדֵי זָהָב וְלָבַשׁ."},
  "afternoon-service":{mishnahRef:"משנה יומא ז׳:ד׳",mishnahHebrew:"וְנִכְנַס לְהַקְטִיר קְטֹרֶת שֶׁל בֵּין הָעַרְבַּיִם וּלְהֵטִיב אֶת הַנֵּרוֹת."},
  departure:{mishnahRef:"משנה יומא ז׳:ד׳",mishnahHebrew:"הֵבִיאוּ לוֹ בִגְדֵי עַצְמוֹ, וְלָבַשׁ. וּמְלַוִּין אוֹתוֹ עַד בֵּיתוֹ. וְיוֹם טוֹב הָיָה עוֹשֶׂה לְאוֹהֲבָיו."},
};

const mishnahUnitFor = (item: CeremonyBeatDraft) => {
  const match = item.sourceUrl.match(/Mishnah_Yoma\.(\d+)\.(\d+)/);
  const unit = match ? MISHNAH_YOMA_FULL.find((candidate) => candidate.id === `${match[1]}.${match[2]}`) : undefined;
  return unit ? { mishnahRef: unit.heRef, mishnahHebrew: unit.hebrew } : undefined;
};

export const YOM_KIPPUR_SERVICE: CeremonyBeat[] = RAW_YOM_KIPPUR_SERVICE.map((item) => ({ ...item, ...(MISHNAH_BY_BEAT[item.id] ?? mishnahUnitFor(item)) } as CeremonyBeat));

if (YOM_KIPPUR_SERVICE.some((item) => !item.mishnahRef || !item.mishnahHebrew)) {
  throw new Error("Every Yom Kippur ceremony beat must resolve to exact Mishnah Hebrew.");
}
if (new Set(YOM_KIPPUR_SERVICE.map((item) => item.id)).size !== YOM_KIPPUR_SERVICE.length) {
  throw new Error("Every Yom Kippur ceremony beat must have a unique ID.");
}

export const YOM_KIPPUR_SERVICE_DURATION = YOM_KIPPUR_SERVICE.reduce((total, item) => total + item.duration, 0);

export const RITUAL_COUNT_CHECKS = [
  { label: "Bull blood has eight counted applications", beatId: "bull-blood-inside", expected: 8 },
  { label: "Goat blood has eight counted applications", beatId: "goat-blood-inside", expected: 8 },
  { label: "Bull blood before the curtain has eight counted applications", beatId: "bull-blood-curtain", expected: 8 },
  { label: "Goat blood before the curtain has eight counted applications", beatId: "goat-blood-curtain", expected: 8 },
  { label: "Golden altar has four corner applications and seven top sprinklings", beatId: "golden-altar-blood", expected: 11 },
].map((check) => {
  const item = YOM_KIPPUR_SERVICE.find((beat) => beat.id === check.beatId);
  return { ...check, passed: item ? getRitualCounter(item, 0.999)?.total === check.expected : false };
});

if (RITUAL_COUNT_CHECKS.some((check) => !check.passed)) {
  throw new Error("Every counted Chapter 5 blood application must match its Mishnah-defined total.");
}

const immersionBeats = YOM_KIPPUR_SERVICE.filter((item) => item.immersion !== undefined);
const recordedSanctifications = YOM_KIPPUR_SERVICE.flatMap((item) => sanctificationNumbers(item.sanctifications));
const garmentSequence = ["dress-gold","second-immersion","third-immersion","fourth-immersion","fifth-immersion","departure"]
  .map((id) => YOM_KIPPUR_SERVICE.find((item) => item.id === id)?.garment);

export const IMMERSION_SEQUENCE_CHECKS = [
  { label:"Five immersion beats exist", passed:immersionBeats.length===5 },
  { label:"Immersion numbers are exactly 1 through 5", passed:immersionBeats.map((item)=>item.immersion).join(",")==="1,2,3,4,5" },
  { label:"First immersion is outside and the remaining four are at Parvah", passed:immersionBeats.map((item)=>item.stage).join(",")==="outsideBath,parvah,parvah,parvah,parvah" },
  { label:"Sanctifications are exactly 1 through 10", passed:recordedSanctifications.join(",")==="1,2,3,4,5,6,7,8,9,10" },
  { label:"Garments alternate gold, white, gold, white, gold, ordinary", passed:garmentSequence.join(",")==="gold,white,gold,white,gold,ordinary" },
];

if (IMMERSION_SEQUENCE_CHECKS.some((check) => !check.passed)) {
  throw new Error(`The immersion sequence is inconsistent: ${IMMERSION_SEQUENCE_CHECKS.filter((check)=>!check.passed).map((check)=>check.label).join("; ")}`);
}

const concurrentBeatIds = ["scapegoat-handoff", "scapegoat-departs", "wilderness-stations", "scapegoat-cliff", "carcasses-removed", "wilderness-signal", "torah-reading", "simultaneous-reading-burning"];
const concurrentStateFor = (id: string) => {
  const item = YOM_KIPPUR_SERVICE.find((beat) => beat.id === id);
  return item ? getConcurrentRouteState(item) : null;
};

export const CONCURRENT_ROUTE_CHECKS = [
  { label:"Every parallel Chapter 6–7 beat has two visible tracks", passed:concurrentBeatIds.every((id)=>concurrentStateFor(id)?.tracks.length===2) },
  { label:"Yoma 7:2 marks reading and burning as simultaneous", passed:concurrentStateFor("simultaneous-reading-burning")?.tracks.every((track)=>track.status==="מתרחש עכשיו")===true },
  { label:"Carcass removal names the bull and the goat for the Lord", passed:concurrentStateFor("carcasses-removed")?.tracks[0].detail.includes("הפר והשעיר לה׳")===true },
  { label:"The wilderness route remains assigned to the goat for Azazel", passed:concurrentStateFor("scapegoat-departs")?.tracks[1].detail.includes("לעזאזל")===true },
];

export const OFFSITE_SCENE_CHECKS = [
  { label:"The wilderness route contains the Mishnah's ten shelters", passed:OFFSITE_WILDERNESS_SPEC.shelterCount===10 },
  { label:"Ninety ris at seven and a half ris per mil resolves to twelve mil", passed:OFFSITE_WILDERNESS_SPEC.routeRis/OFFSITE_WILDERNESS_SPEC.risPerMil===OFFSITE_WILDERNESS_SPEC.totalMil },
  { label:"The cliff scene is required to remain non-graphic", passed:OFFSITE_WILDERNESS_SPEC.childFacingCliffTreatment==="distant-non-graphic" },
];

const chapterSevenCompletionIds = ["third-immersion","rams-musaf","fourth-immersion","retrieve-vessels","fifth-immersion","afternoon-tamid","afternoon-incense","afternoon-lamps","departure","home-celebration"];
const chapterSevenCompletionBeats = chapterSevenCompletionIds.map((id)=>YOM_KIPPUR_SERVICE.find((beat)=>beat.id===id));
export const CHAPTER_7_COMPLETION_CHECKS = [
  { label:"Chapter 7 completion beats appear in the prescribed order", passed:chapterSevenCompletionBeats.every(Boolean)&&chapterSevenCompletionIds.map((id)=>YOM_KIPPUR_SERVICE.findIndex((beat)=>beat.id===id)).every((value,index,values)=>index===0||value>values[index-1]) },
  { label:"The afternoon service moves from outer altar to incense altar to Menorah", passed:["altarTop","goldenAltar","holyPlace"].every((stage,index)=>chapterSevenCompletionBeats[5+index]?.stage===stage) },
  { label:"The final three service beats remain in golden garments", passed:chapterSevenCompletionBeats.slice(5,8).every((beat)=>beat?.garment==="gold") },
  { label:"Departure records sanctification ten and precedes the home celebration", passed:chapterSevenCompletionBeats[8]?.sanctifications==="10 of 10"&&chapterSevenCompletionBeats[9]?.id==="home-celebration" },
];

if ([...CONCURRENT_ROUTE_CHECKS,...OFFSITE_SCENE_CHECKS,...CHAPTER_7_COMPLETION_CHECKS].some((check) => !check.passed)) {
  throw new Error(`The Chapter 6–7 sequence is inconsistent: ${[...CONCURRENT_ROUTE_CHECKS,...OFFSITE_SCENE_CHECKS,...CHAPTER_7_COMPLETION_CHECKS].filter((check)=>!check.passed).map((check)=>check.label).join("; ")}`);
}

export function getCeremonyBeat(time: number) {
  const clamped = Math.max(0, Math.min(time, YOM_KIPPUR_SERVICE_DURATION - 0.001));
  let elapsed = 0;
  for (let index = 0; index < YOM_KIPPUR_SERVICE.length; index += 1) {
    const item = YOM_KIPPUR_SERVICE[index];
    if (clamped < elapsed + item.duration) return { beat:item, index, elapsed, progress:(clamped - elapsed) / item.duration };
    elapsed += item.duration;
  }
  const index = YOM_KIPPUR_SERVICE.length - 1;
  return { beat:YOM_KIPPUR_SERVICE[index], index, elapsed, progress:1 };
}

export function getBeatStart(index: number) {
  return YOM_KIPPUR_SERVICE.slice(0, Math.max(0, index)).reduce((total, item) => total + item.duration, 0);
}

export const YOM_KIPPUR_CHAPTERS = [...new Set(YOM_KIPPUR_SERVICE.map((item) => item.chapter))];
import { MISHNAH_YOMA_FULL } from "./mishnah-yoma-full";
