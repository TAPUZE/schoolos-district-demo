export type TempleGlossaryCategory = "place" | "vessel" | "garment" | "service" | "idea";

export type TempleGlossaryEntry = {
  id: string;
  hebrew: string;
  transliteration: string;
  plainHebrew: string;
  english: string;
  category: TempleGlossaryCategory;
  source: string;
};

export const TEMPLE_GLOSSARY: readonly TempleGlossaryEntry[] = [
  { id:"azarah", hebrew:"עֲזָרָה", transliteration:"Azarah", plainHebrew:"החצר הפנימית של המקדש, שבה עבדו הכוהנים.", english:"The inner Temple court where the priests performed the service.", category:"place", source:"משנה מידות ב׳:ו׳" },
  { id:"hekhal", hebrew:"הֵיכָל", transliteration:"Heikhal", plainHebrew:"החלק המרכזי המקודש של בניין המקדש.", english:"The main sacred hall of the Temple building.", category:"place", source:"משנה מידות ד׳" },
  { id:"holy-of-holies", hebrew:"קֹדֶשׁ הַקֳּדָשִׁים", transliteration:"Kodesh HaKodashim", plainHebrew:"החדר הפנימי והמקודש ביותר במקדש.", english:"The innermost and holiest chamber of the Temple.", category:"place", source:"משנה מידות ד׳:ז׳" },
  { id:"outer-altar", hebrew:"מִזְבַּח הָעוֹלָה", transliteration:"Mizbeach HaOlah", plainHebrew:"המזבח הגדול שבעזרה, שעליו הקריבו קרבנות.", english:"The large altar in the court on which offerings were brought.", category:"vessel", source:"משנה מידות ג׳" },
  { id:"golden-altar", hebrew:"מִזְבַּח הַזָּהָב", transliteration:"Mizbeach HaZahav", plainHebrew:"המזבח הקטן שבהיכל, שעליו הקטירו קטורת.", english:"The small altar in the sanctuary used for incense.", category:"vessel", source:"משנה יומא ה׳:ה׳" },
  { id:"menorah", hebrew:"מְנוֹרָה", transliteration:"Menorah", plainHebrew:"מנורת הזהב בעלת שבעת הקנים שעמדה בהיכל.", english:"The seven-branched golden lampstand in the sanctuary.", category:"vessel", source:"שמות כ״ה:ל״א–מ׳" },
  { id:"table", hebrew:"שֻׁלְחָן", transliteration:"Shulchan", plainHebrew:"שולחן הזהב שעליו הונח לחם הפנים.", english:"The golden table that held the showbread.", category:"vessel", source:"שמות כ״ה:כ״ג–ל׳" },
  { id:"laver", hebrew:"כִּיּוֹר", transliteration:"Kiyor", plainHebrew:"כלי מים לקידוש ידי הכוהנים ורגליהם.", english:"The water basin used by priests to sanctify hands and feet.", category:"vessel", source:"משנה יומא ג׳:י׳" },
  { id:"spoon", hebrew:"כַּף", transliteration:"Kaf", plainHebrew:"כלי שהכהן הגדול נשא בו את הקטורת ביום הכיפורים.", english:"The spoon used by the High Priest to carry incense on Yom Kippur.", category:"vessel", source:"משנה יומא ה׳:א׳" },
  { id:"coal-pan", hebrew:"מַחְתָּה", transliteration:"Machtah", plainHebrew:"כלי לנשיאת גחלים מן המזבח.", english:"A fire-pan used to carry hot coals from the altar.", category:"vessel", source:"משנה יומא ד׳:ג׳" },
  { id:"gold-garments", hebrew:"בִּגְדֵי זָהָב", transliteration:"Bigdei Zahav", plainHebrew:"שמונת בגדי הכהן הגדול בעבודות הרגילות.", english:"The High Priest’s eight garments for the regular services.", category:"garment", source:"משנה יומא ג׳:ד׳" },
  { id:"white-garments", hebrew:"בִּגְדֵי לָבָן", transliteration:"Bigdei Lavan", plainHebrew:"ארבעת בגדי הפשתן הלבנים לעבודות המיוחדות של יום הכיפורים.", english:"Four white linen garments for the special Yom Kippur service.", category:"garment", source:"ויקרא ט״ז:ד׳" },
  { id:"high-priest", hebrew:"כֹּהֵן גָּדוֹל", transliteration:"Kohen Gadol", plainHebrew:"הכהן שמוביל את עבודת יום הכיפורים.", english:"The High Priest who leads the Yom Kippur service.", category:"service", source:"משנה יומא" },
  { id:"sanctification", hebrew:"קִדּוּשׁ יָדַיִם וְרַגְלַיִם", transliteration:"Kiddush Yadayim VeRaglayim", plainHebrew:"רחיצת הידיים והרגליים מן הכיור לפני עבודות מסוימות.", english:"Washing hands and feet from the laver before designated services.", category:"service", source:"משנה יומא ג׳:ג׳" },
  { id:"immersion", hebrew:"טְבִילָה", transliteration:"Tevilah", plainHebrew:"טבילת כל הגוף במקווה כחלק מסדר העבודה.", english:"Full-body immersion in a ritual pool as part of the service sequence.", category:"service", source:"משנה יומא ג׳:ג׳" },
  { id:"goat-for-lord", hebrew:"שָׂעִיר לַה׳", transliteration:"Sa'ir LaShem", plainHebrew:"השעיר שהוגרל לקרבן חטאת לה׳.", english:"The goat selected by lot as the sin offering for God.", category:"service", source:"משנה יומא ד׳:א׳" },
  { id:"azazel-goat", hebrew:"שָׂעִיר לַעֲזָאזֵל", transliteration:"Sa'ir LaAzazel", plainHebrew:"השעיר שנשלח למדבר לאחר הווידוי.", english:"The goat sent to the wilderness after the confession.", category:"service", source:"משנה יומא ו׳" },
  { id:"curtain", hebrew:"פָּרֹכֶת", transliteration:"Parokhet", plainHebrew:"וילון שהבדיל בין ההיכל לקודש הקודשים.", english:"The curtain separating the sanctuary from the Holy of Holies.", category:"place", source:"משנה יומא ה׳:א׳" },
  { id:"foundation-stone", hebrew:"אֶבֶן הַשְּׁתִיָּה", transliteration:"Even HaShetiyah", plainHebrew:"אבן בקודש הקודשים שעליה הניח הכהן הגדול את המחתה.", english:"The stone in the Holy of Holies on which the High Priest placed the fire-pan.", category:"place", source:"משנה יומא ה׳:ב׳" },
  { id:"tamid", hebrew:"תָּמִיד", transliteration:"Tamid", plainHebrew:"קרבן הציבור הקבוע של הבוקר ושל בין הערביים.", english:"The regular communal offering brought morning and afternoon.", category:"service", source:"משנה יומא ג׳:ד׳; ז׳:ג׳" },
  { id:"musaf", hebrew:"מוּסָף", transliteration:"Musaf", plainHebrew:"קרבנות נוספים שמביאים ביום מיוחד, כגון יום הכיפורים.", english:"Additional offerings brought on a special day such as Yom Kippur.", category:"service", source:"במדבר כ״ט:ז׳–י״א" },
  { id:"selected-parts", hebrew:"אֵימוּרִים", transliteration:"Eimurim", plainHebrew:"החלקים מן הקרבן המוקטרים על המזבח.", english:"The designated portions of an offering burned on the altar.", category:"service", source:"משנה יומא ו׳:ז׳" },
  { id:"burning-place", hebrew:"בֵּית הַשְּׂרֵפָה", transliteration:"Beit HaSreifah", plainHebrew:"מקום מחוץ למחנה שבו נשרפו פר החטאת ושעיר החטאת.", english:"The place outside the camp where the bull and goat sin offerings were burned.", category:"place", source:"משנה יומא ו׳:ז׳" },
  { id:"scarlet-thread", hebrew:"לָשׁוֹן שֶׁל זְהוֹרִית", transliteration:"Lashon Shel Zehorit", plainHebrew:"רצועת צמר אדומה שנקשרה לשעיר המשתלח ולסלע.", english:"A strip of scarlet wool associated with the wilderness goat and rock.", category:"vessel", source:"משנה יומא ו׳:ו׳" },
  { id:"station", hebrew:"סֻכָּה", transliteration:"Sukkah", plainHebrew:"אחת מעשר תחנות הליווי בדרך למדבר.", english:"One of ten escort stations on the wilderness route.", category:"place", source:"משנה יומא ו׳:ד׳–ה׳" },
  { id:"saving-life", hebrew:"פִּקּוּחַ נֶפֶשׁ", transliteration:"Pikuach Nefesh", plainHebrew:"הצלת חיים, הדוחה איסורים כאשר יש סכנה או ספק סכנה.", english:"Saving life, which overrides prohibitions when life may be in danger.", category:"idea", source:"משנה יומא ח׳:ו׳–ז׳" },
  { id:"repentance", hebrew:"תְּשׁוּבָה", transliteration:"Teshuvah", plainHebrew:"הכרה בטעות, חרטה ושינוי הדרך.", english:"Recognizing wrongdoing, regretting it, and changing course.", category:"idea", source:"משנה יומא ח׳:ח׳–ט׳" },
  { id:"atonement", hebrew:"כַּפָּרָה", transliteration:"Kapparah", plainHebrew:"תהליך של מחילה ותיקון הקשר לאחר חטא.", english:"The process of forgiveness and repairing the relationship after wrongdoing.", category:"idea", source:"משנה יומא ח׳:ח׳–ט׳" },
  { id:"between-people", hebrew:"בֵּין אָדָם לַחֲבֵרוֹ", transliteration:"Bein Adam LaChavero", plainHebrew:"מעשים שבין אדם לאדם, הדורשים פיוס ותיקון עם הנפגע.", english:"Wrongs between people, which require reconciliation with the person harmed.", category:"idea", source:"משנה יומא ח׳:ט׳" },
] as const;

export const TEMPLE_GLOSSARY_CHECKS = [
  { label:"Glossary contains at least 25 curriculum terms", passed:TEMPLE_GLOSSARY.length>=25 },
  { label:"Glossary identifiers are unique", passed:new Set(TEMPLE_GLOSSARY.map((entry)=>entry.id)).size===TEMPLE_GLOSSARY.length },
  { label:"Every term has bilingual teaching copy and a source", passed:TEMPLE_GLOSSARY.every((entry)=>entry.hebrew&&entry.plainHebrew.length>15&&entry.english.length>15&&entry.source) },
] as const;

if(TEMPLE_GLOSSARY_CHECKS.some((check)=>!check.passed)) throw new Error("Temple glossary records are incomplete or inconsistent.");
