export type ChapterEightVisual = "afflictions" | "measures" | "categories" | "children" | "health" | "saving-life" | "rescue" | "atonement" | "reconciliation";

export type ChapterEightLesson = {
  mishnahId: `8.${number}`;
  beatId: string;
  visual: ChapterEightVisual;
  plainHebrew: string;
  englishExplanation: string;
  questionHebrew: string;
  answersHebrew: readonly [string, string, string];
  correctAnswer: 0 | 1 | 2;
  feedbackHebrew: string;
  reviewNote?: string;
};

export const CHAPTER_EIGHT_LESSONS: readonly ChapterEightLesson[] = [
  { mishnahId:"8.1", beatId:"afflictions-of-the-day", visual:"afflictions", plainHebrew:"ביום הכיפורים נמנעים מאכילה, שתייה, רחיצה, סיכה, נעילת הסנדל ותשמיש המיטה. המשנה גם מלמדת שיש מצבים מיוחדים שדורשים בירור הלכתי.", englishExplanation:"Yom Kippur includes six listed forms of abstention. The Mishnah also records limited exceptions and disagreements that require careful guidance.", questionHebrew:"איזה מן הדברים נזכר במשנה?", answersHebrew:["נעילת הסנדל","בניית סוכה","תקיעת שופר"], correctAnswer:0, feedbackHebrew:"נכון — נעילת הסנדל נמנית עם העינויים שבמשנה." },
  { mishnahId:"8.2", beatId:"food-drink-measures", visual:"measures", plainHebrew:"המשנה מגדירה שיעור נפרד לאכילה ושיעור נפרד לשתייה. מאכלים מצטרפים למאכלים ומשקים למשקים, אבל אכילה ושתייה אינן מצטרפות זו לזו.", englishExplanation:"The Mishnah defines separate minimum measures for eating and drinking. Foods combine with foods and drinks with drinks, but eating and drinking do not combine with each other.", questionHebrew:"מה אינו מצטרף יחד לפי המשנה?", answersHebrew:["שני מאכלים","שני משקים","אכילה ושתייה"], correctAnswer:2, feedbackHebrew:"נכון — לא מצרפים את שיעור האכילה לשיעור השתייה." },
  { mishnahId:"8.3", beatId:"liability-categories", visual:"categories", plainHebrew:"המשנה מסדרת פעולות שונות לקבוצות הלכתיות שונות. היא מבחינה בין אכילה ושתייה לבין שאר העינויים, ובין דבר הראוי לאכילה לדבר שאינו ראוי.", englishExplanation:"The Mishnah separates different acts into legal categories and distinguishes ordinary food and drink from substances not normally fit for consumption.", questionHebrew:"מה עושה המשנה כאן?", answersHebrew:["מערבבת את כל המקרים","מבחינה בין קטגוריות","מתארת את בניין המקדש"], correctAnswer:1, feedbackHebrew:"נכון — מטרת היחידה היא להבחין בין קטגוריות הלכתיות." },
  { mishnahId:"8.4", beatId:"children-and-fasting", visual:"children", plainHebrew:"אין מחייבים ילדים קטנים לצום יום שלם. מחנכים אותם בהדרגה, לפי גילם וכוחם, כדי שילמדו לקיים מצוות כשיגדלו.", englishExplanation:"Young children are not required to complete the full fast. They are educated gradually, according to age and ability, in preparation for future responsibility.", questionHebrew:"איך מחנכים ילדים לצום?", answersHebrew:["בהדרגה לפי היכולת","תמיד יום שלם","בלי להתחשב בגיל"], correctAnswer:0, feedbackHebrew:"נכון — החינוך נעשה בהדרגה ולפי היכולת." },
  { mishnahId:"8.5", beatId:"health-over-fasting", visual:"health", plainHebrew:"כאשר אדם זקוק לאוכל מחמת מצב בריאותי, נותנים לו לפי הצורך. המשנה מקשיבה למומחים וגם לאדם עצמו כאשר אין מומחים. למעשה פועלים לפי הוראת רופא ורב מוסמך.", englishExplanation:"When health requires food, the person is fed as needed. The Mishnah considers expert advice and the person's own report; real situations require qualified medical and halakhic guidance.", questionHebrew:"מה קודם כאשר יש צורך בריאותי?", answersHebrew:["התעלמות מהמצב","שמירה על החיים והבריאות","השלמת הצום בכל מחיר"], correctAnswer:1, feedbackHebrew:"נכון — צורך בריאותי וסכנת חיים קודמים לצום.", reviewNote:"Medical and rabbinic wording requires specialist approval before release." },
  { mishnahId:"8.6", beatId:"danger-overrides-prohibition", visual:"saving-life", plainHebrew:"המשנה מביאה דוגמאות רפואיות מן העולם העתיק ומלמדת את העיקרון: ספק סכנת נפשות דוחה את השבת. הדוגמאות אינן הוראות רפואיות לימינו.", englishExplanation:"The Mishnah gives ancient medical examples and teaches the controlling principle that even possible danger to life overrides Shabbat. The examples are not modern medical instructions.", questionHebrew:"מהו העיקרון המרכזי?", answersHebrew:["מחכים עד צאת השבת","ספק סכנה דוחה שבת","רק סכנה ודאית חשובה"], correctAnswer:1, feedbackHebrew:"נכון — גם ספק סכנה לחיים דוחה שבת.", reviewNote:"Ancient remedies must remain clearly labeled as non-medical guidance." },
  { mishnahId:"8.7", beatId:"rescue-from-rubble", visual:"rescue", plainHebrew:"כאשר יש ספק שמישהו חי מתחת למפולת, מפנים את האבנים גם בשבת. אם מצאו אותו חי ממשיכים להציל אותו.", englishExplanation:"If a person may be alive beneath fallen material, rescuers clear it even on Shabbat. If the person is found alive, rescue continues.", questionHebrew:"מה עושים כשיש ספק שמישהו חי תחת מפולת?", answersHebrew:["מחכים","ממשיכים בחיפוש ובהצלה","עוזבים את המקום"], correctAnswer:1, feedbackHebrew:"נכון — ספק חיים מחייב להמשיך בפעולת ההצלה." },
  { mishnahId:"8.8", beatId:"atonement-and-repentance", visual:"atonement", plainHebrew:"המשנה מסבירה שכפרה ותשובה פועלות בדרכים שונות לפי סוג המעשה. תשובה היא חלק מרכזי מן התיקון ואינה רק המתנה ליום הכיפורים.", englishExplanation:"The Mishnah explains that repentance and atonement work differently depending on the wrongdoing. Repentance is an active part of repair, not merely waiting for Yom Kippur.", questionHebrew:"מהו חלק מרכזי בתהליך התיקון?", answersHebrew:["תשובה","התעלמות","האשמת אחרים"], correctAnswer:0, feedbackHebrew:"נכון — תשובה היא חלק מרכזי בתהליך הכפרה והתיקון." },
  { mishnahId:"8.9", beatId:"reconciliation-and-hope", visual:"reconciliation", plainHebrew:"יום הכיפורים אינו מתיר לאדם לתכנן לחטוא ולסמוך על הכפרה. עבירות שבין אדם לחברו דורשות פיוס ותיקון עם האדם שנפגע. רבי עקיבא מסיים במסר של תקווה וטהרה.", englishExplanation:"A person cannot plan wrongdoing and rely on Yom Kippur for forgiveness. Wrongs between people require reconciliation with the person harmed; Rabbi Akiva closes with hope and purification.", questionHebrew:"מה נדרש בעבירה שבין אדם לחברו?", answersHebrew:["פיוס ותיקון עם הנפגע","להמתין בלבד","לספר לאדם אחר"], correctAnswer:0, feedbackHebrew:"נכון — צריך לפייס ולתקן את הפגיעה עם האדם שנפגע." },
] as const;

export const CHAPTER_EIGHT_BY_BEAT = new Map(CHAPTER_EIGHT_LESSONS.map((lesson)=>[lesson.beatId,lesson]));
export const CHAPTER_EIGHT_BY_MISHNAH = new Map(CHAPTER_EIGHT_LESSONS.map((lesson)=>[lesson.mishnahId,lesson]));

export const CHAPTER_EIGHT_LESSON_CHECKS = [
  { label:"Chapter 8 contains exactly nine lesson records", passed:CHAPTER_EIGHT_LESSONS.length===9 },
  { label:"Every Chapter 8 Mishnah from 8.1 through 8.9 is present once", passed:CHAPTER_EIGHT_LESSONS.map((lesson)=>lesson.mishnahId).join(",")==="8.1,8.2,8.3,8.4,8.5,8.6,8.7,8.8,8.9" },
  { label:"Every lesson has plain Hebrew, English, a three-answer prompt and valid answer", passed:CHAPTER_EIGHT_LESSONS.every((lesson)=>lesson.plainHebrew.length>30&&lesson.englishExplanation.length>30&&lesson.answersHebrew.length===3&&lesson.correctAnswer>=0&&lesson.correctAnswer<3) },
  { label:"Health and ancient-remedy lessons carry specialist-review notes", passed:CHAPTER_EIGHT_LESSONS.filter((lesson)=>["8.5","8.6"].includes(lesson.mishnahId)).every((lesson)=>Boolean(lesson.reviewNote)) },
];

if(CHAPTER_EIGHT_LESSON_CHECKS.some((check)=>!check.passed)) throw new Error("Chapter 8 lesson records are incomplete or inconsistent.");
