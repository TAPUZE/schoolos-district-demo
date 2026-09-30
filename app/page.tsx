"use client";

import { BarChart3, BookOpen, Bot, BrainCircuit, Building2, Check, ChevronRight, ClipboardCheck, Gamepad2, GraduationCap, HeartHandshake, LibraryBig, Menu, ScanLine, School, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ModuleId = "overview" | "school" | "learning" | "grading" | "games" | "ancient" | "torah" | "library";

const modules = [
  { id: "overview", label: "Command center", icon: BarChart3 },
  { id: "school", label: "School operations", icon: School },
  { id: "learning", label: "Learning studio", icon: BrainCircuit },
  { id: "grading", label: "AI grading", icon: ScanLine },
  { id: "games", label: "Game lab", icon: Gamepad2 },
  { id: "ancient", label: "Ancient worlds 3D", icon: Building2 },
  { id: "torah", label: "Torah & sources", icon: BookOpen },
  { id: "library", label: "Content library", icon: LibraryBig },
] as const;

const productCards: Array<{ id: ModuleId; eyebrow: string; title: string; description: string; stat: string; tone: string }> = [
  { id: "school", eyebrow: "Yad Yisroel", title: "Special-education operations", description: "Students, attendance, therapy sessions, IEP goals, reports, payroll and parent access.", stat: "10 connected workflows", tone: "blue" },
  { id: "learning", eyebrow: "Selfware + FullMath", title: "Adaptive learning", description: "Lessons adjust to thinking style, skill level and Hebrew or English learning needs.", stat: "50+ math lessons", tone: "violet" },
  { id: "grading", eyebrow: "OptiMath + Matha", title: "AI homework feedback", description: "Scan handwritten work, identify the skill, award partial credit and create targeted practice.", stat: "K–12 curriculum", tone: "cyan" },
  { id: "games", eyebrow: "Bright Starts + FUN", title: "Learning through play", description: "A family kindergarten builder, English practice and classroom-ready reward loops.", stat: "42 family missions", tone: "orange" },
  { id: "ancient", eyebrow: "Home3", title: "Ancient worlds in 3D", description: "Walk through an evidence-aware Second Temple reconstruction with synchronized source learning.", stat: "Full 3D scene", tone: "gold" },
  { id: "torah", eyebrow: "Atuk + Shraga", title: "Torah source intelligence", description: "Document parsing, Hebrew text review, source alignment and guided learning tools.", stat: "Hebrew-first", tone: "green" },
];

export default function Home() {
  const [active, setActive] = useState<ModuleId>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const activeModule = modules.find((item) => item.id === active)!;
  const selectModule = (id: ModuleId) => { setActive(id); setNavOpen(false); };
  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    const validModules = modules.map((item) => item.id);
    void Promise.resolve(modelContext.registerTool({
      name: "open_school_demo_module",
      title: "Open school demo module",
      description: "Navigate the visible School Innovation Lab to a specific product demo.",
      inputSchema: { type: "object", properties: { module: { type: "string", enum: validModules } }, required: ["module"], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input: unknown) {
        const id = (input as { module?: string })?.module;
        if (!validModules.includes(id as ModuleId)) throw new Error("Unknown demo module");
        setActive(id as ModuleId); setNavOpen(false);
        return { module: id, status: "opened" };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);
  return <main className="lab-shell">
    <aside className={`lab-sidebar ${navOpen ? "open" : ""}`}>
      <div className="lab-brand"><span className="lab-brand-mark"><GraduationCap /></span><div><strong>School Lab</strong><span>Education demo suite</span></div></div>
      <nav aria-label="Demo modules">{modules.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? "active" : ""} onClick={() => selectModule(id)}><Icon /><span>{label}</span>{active === id && <ChevronRight className="nav-arrow" />}</button>)}</nav>
      <div className="sidebar-foot"><span className="status-pulse" /><div><strong>Demo environment</strong><span>Built from working projects</span></div></div>
    </aside>
    {navOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setNavOpen(false)} />}
    <section className="lab-main"><header className="lab-header"><button className="menu-button" aria-label="Open navigation" onClick={() => setNavOpen(true)}><Menu /></button><div><span className="header-kicker">Interactive portfolio</span><h1>{activeModule.label}</h1></div><div className="header-meta"><span>8 product areas</span><span className="header-avatar">YY</span></div></header>
      <div className="lab-content">{active === "overview" && <Overview onOpen={selectModule} />}{active === "school" && <SchoolOps />}{active === "learning" && <LearningStudio />}{active === "grading" && <AIGrading />}{active === "games" && <GameLab />}{active === "ancient" && <AncientWorlds />}{active === "torah" && <TorahStudio />}{active === "library" && <ContentLibrary />}</div>
    </section>
  </main>;
}

function Overview({ onOpen }: { onOpen: (id: ModuleId) => void }) {
  return <div className="overview-page"><section className="overview-lead"><div><span className="section-label">One connected education ecosystem</span><h2>From the front office to the ancient world.</h2><p>Explore the strongest school, curriculum, AI and game systems already in the project collection.</p></div><button onClick={() => onOpen("ancient")}><Building2 /> Enter the 3D experience</button></section>
    <div className="metric-row"><Metric value="8" label="product areas" detail="in one demo" /><Metric value="50+" label="math lessons" detail="Hebrew, interactive" /><Metric value="42" label="family missions" detail="game-based learning" /><Metric value="K–12" label="AI curriculum" detail="feedback + practice" /></div>
    <section className="portfolio-grid">{productCards.map((card) => <button key={card.id} className={`portfolio-card ${card.tone}`} onClick={() => onOpen(card.id)}><span className="card-top"><span>{card.eyebrow}</span><ChevronRight /></span><strong>{card.title}</strong><p>{card.description}</p><small>{card.stat}</small></button>)}</section>
    <section className="coverage-strip"><div><Sparkles /><span><strong>Also represented</strong> LMS classrooms, textbook generation, progress reporting, parent portals and teacher tools.</span></div><button onClick={() => onOpen("library")}>See the full catalog <ChevronRight /></button></section>
  </div>;
}

function Metric({ value, label, detail }: { value: string; label: string; detail: string }) { return <div className="metric"><strong>{value}</strong><div><span>{label}</span><small>{detail}</small></div></div>; }

function SchoolOps() {
  const [student, setStudent] = useState(0);
  const students = [
    { name: "Ari Cohen", grade: "Grade 4", attendance: "96%", goal: "Reading fluency", progress: 72, note: "Strong response to visual prompts" },
    { name: "Maya Levi", grade: "Grade 5", attendance: "92%", goal: "Number sense", progress: 58, note: "Use short, sequential practice" },
    { name: "Noah Stein", grade: "Grade 3", attendance: "98%", goal: "Social communication", progress: 81, note: "Ready to generalize in group work" },
  ];
  const current = students[student];
  return <div className="workspace-page"><div className="page-intro"><div><span className="section-label">Yad Yisroel</span><h2>A clear picture of every student</h2><p>Special-education operations brought into one daily workspace.</p></div><button className="primary-action"><Users /> Add student</button></div>
    <div className="ops-grid"><section className="panel student-list"><header><strong>Students</strong><span>3 active</span></header>{students.map((item, index) => <button key={item.name} className={student === index ? "selected" : ""} onClick={() => setStudent(index)}><span className="student-avatar">{item.name.split(" ").map(x => x[0]).join("")}</span><span><strong>{item.name}</strong><small>{item.grade} · {item.attendance} attendance</small></span><ChevronRight /></button>)}</section>
      <section className="panel student-detail"><header><div><span className="student-avatar large">{current.name.split(" ").map(x => x[0]).join("")}</span><div><strong>{current.name}</strong><small>{current.grade} · IEP active</small></div></div><span className="good-chip">On track</span></header><div className="goal-block"><span>Current IEP goal</span><strong>{current.goal}</strong><div className="progress-track"><i style={{ width: `${current.progress}%` }} /></div><small>{current.progress}% toward term target</small></div><div className="detail-cards"><div><ClipboardCheck /><span><small>Last session</small><strong>Today, 10:30</strong></span></div><div><HeartHandshake /><span><small>Team note</small><strong>{current.note}</strong></span></div></div></section>
      <aside className="panel today-panel"><header><strong>Today</strong><span>Tuesday</span></header><Timeline time="09:00" title="Reading support" kind="Therapy" /><Timeline time="10:30" title="Math small group" kind="Class" /><Timeline time="12:45" title="Parent check-in" kind="Meeting" /></aside></div>
  </div>;
}

function Timeline({ time, title, kind }: { time: string; title: string; kind: string }) { return <div className="timeline-item"><time>{time}</time><i /><div><strong>{title}</strong><span>{kind}</span></div></div>; }

function LearningStudio() {
  const [answer, setAnswer] = useState<number | null>(null); const correct = 2;
  return <div className="workspace-page learning-page"><div className="page-intro"><div><span className="section-label">Selfware + FullMath</span><h2>One concept, taught the way this learner thinks</h2><p>Visual, sequential and active learning cues combine in a short lesson.</p></div><span className="profile-chip"><BrainCircuit /> Visual · Sequential</span></div>
    <div className="lesson-layout"><section className="panel lesson-main"><div className="lesson-progress"><span>Linear equations</span><span>Step 3 of 5</span></div><div className="lesson-progress-line"><i /></div><div className="equation-card"><span>Balance both sides</span><strong>3x + 4 = 19</strong><p>Remove 4 from each side, then divide both sides by 3.</p><div className="balance-visual"><div><b>3x</b><em>+ 4</em></div><i /><div><b>19</b></div></div></div>
      <fieldset className="answer-set"><legend>What is x?</legend>{[3,4,5,6].map((value,index) => <button key={value} className={`${answer === index ? "chosen" : ""} ${answer !== null && index === correct ? "correct" : ""}`} onClick={() => setAnswer(index)}>{value}{answer !== null && index === correct && <Check />}</button>)}</fieldset>{answer !== null && <div className={`feedback ${answer === correct ? "success" : "try"}`}><strong>{answer === correct ? "Exactly right." : "Almost—subtract 4 first."}</strong><span>{answer === correct ? "19 − 4 = 15, then 15 ÷ 3 = 5." : "Keep the equation balanced by making the same change on both sides."}</span></div>}</section>
      <aside className="panel coach-panel"><span className="ai-orb"><Bot /></span><strong>Learning coach</strong><p>This learner benefits from visible steps and one decision at a time.</p><ul><li><Check /> Show the balance</li><li><Check /> Keep language concrete</li><li><Check /> Practice immediately</li></ul><button onClick={() => setAnswer(null)}>Reset practice</button></aside></div>
  </div>;
}

function AIGrading() {
  const [work, setWork] = useState("3x + 4 = 19\n3x = 15\nx = 5"); const [graded, setGraded] = useState(false);
  return <div className="workspace-page"><div className="page-intro"><div><span className="section-label">OptiMath + Matha Homework</span><h2>Turn student work into useful feedback</h2><p>Paste or scan a solution, then review the skill-level analysis.</p></div><span className="profile-chip"><ScanLine /> OCR-ready</span></div>
    <div className="grading-grid"><section className="panel grading-input"><header><div><strong>Student submission</strong><span>Algebra · Grade 7</span></div><button className="quiet-action"><ScanLine /> Scan page</button></header><label>Problem <span>Solve 3x + 4 = 19</span></label><label>Student work<textarea value={work} onChange={(e) => { setWork(e.target.value); setGraded(false); }} /></label><button className="grade-button" onClick={() => setGraded(true)}><Sparkles /> Analyze work</button></section>
      <section className={`panel result-panel ${graded ? "revealed" : ""}`}>{!graded ? <div className="empty-result"><span><Bot /></span><strong>Ready to analyze</strong><p>The feedback will identify the method, score each step and suggest the next practice target.</p></div> : <><header><div><span className="score-ring">9.5</span><div><strong>Strong solution</strong><small>Correct method and answer</small></div></div><span className="good-chip">95%</span></header><div className="rubric"><div><span><Check /> Isolates the variable</span><strong>4/4</strong></div><div><span><Check /> Preserves equality</span><strong>3/3</strong></div><div><span><Check /> Final answer</span><strong>2/2</strong></div><div><span>◐ Explanation</span><strong>0.5/1</strong></div></div><div className="micro-lesson"><span>Suggested feedback</span><p>Excellent algebra. Add one sentence explaining why subtracting 4 keeps both sides equal.</p></div></>}</section></div>
  </div>;
}

function GameLab() {
  const [stars, setStars] = useState(2); const [matched, setMatched] = useState(false);
  return <div className="workspace-page"><div className="page-intro"><div><span className="section-label">Bright Starts + Pre-A1 English</span><h2>Practice that feels like progress</h2><p>Small real-world missions unlock playful learning activities.</p></div><span className="profile-chip warm"><Gamepad2 /> Family mode</span></div>
    <div className="game-grid"><section className="mission-card"><div className="mission-sky"><span>★</span><span>☁</span><span>★</span></div><div className="mission-building"><div className="roof" /><div className="house"><i /><i /><b /></div><div className="garden">♣ ♣ ♣</div></div><div className="mission-copy"><span>Today’s mission</span><strong>Set the table together</strong><p>Count 5 items, name them in English, then take a photo.</p><button onClick={() => setStars(Math.min(5, stars + 1))}>{stars >= 5 ? "Mission complete!" : "Complete one step"} <ChevronRight /></button></div></section>
      <section className="panel word-game"><header><div><strong>Quick word match</strong><span>English · Pre-A1</span></div><span className="star-count">{stars} ★</span></header><div className="word-picture">🍎</div><p>Choose the matching word</p><div className="word-options">{["Apple","House","Chair"].map(word => <button key={word} className={matched && word === "Apple" ? "correct" : ""} onClick={() => setMatched(word === "Apple")}>{word}{matched && word === "Apple" && <Check />}</button>)}</div>{matched && <div className="game-success"><Sparkles /> Great match! You earned a Helping Heart.</div>}</section></div>
  </div>;
}

function AncientWorlds() {
  return <div className="workspace-page ancient-page"><div className="page-intro"><div><span className="section-label">Home3 · History learning</span><h2>Walk into the source material</h2><p>The live reconstruction connects architecture, ritual, vocabulary and primary-text study.</p></div><a className="primary-action" href="/ancient"><Building2 /> Launch full-screen 3D</a></div>
    <section className="ancient-feature"><div className="ancient-visual" aria-hidden="true"><div className="sun-disc" /><div className="temple-mini"><span className="temple-cap" /><span className="temple-front">{[1,2,3,4,5,6].map(i => <i key={i} />)}</span><span className="temple-steps" /></div><div className="ancient-floor" /></div><div className="ancient-copy"><span className="live-chip">Live interactive model</span><h3>Jerusalem · Second Temple courts</h3><p>Explore in overview, first-person or guided study mode. Inspect the altar, sanctuary, courts, vessels and chambers; then follow the Yom Kippur service alongside Mishnah Yoma.</p><div className="feature-pills"><span>3 camera modes</span><span>Evidence notes</span><span>Hebrew sources</span><span>Guided ceremony</span></div><a href="/ancient">Enter Jerusalem <ChevronRight /></a></div></section>
    <div className="world-roadmap"><div><span>Model roadmap</span><strong>One live world, more ready to develop</strong></div><WorldCard city="Rome" site="Forum & Colosseum" status="Next model" /><WorldCard city="Athens" site="Acropolis" status="Research brief" /><WorldCard city="Babylon" site="Processional Way" status="Concept" /></div>
  </div>;
}

function WorldCard({ city, site, status }: { city: string; site: string; status: string }) { return <div className="world-card"><span>{status}</span><strong>{city}</strong><small>{site}</small></div>; }

function TorahStudio() {
  const [tab, setTab] = useState<"source" | "review">("source");
  return <div className="workspace-page"><div className="page-intro"><div><span className="section-label">Atuk.ai + Shraga Torah</span><h2>Hebrew sources, structured for study</h2><p>Parse difficult documents, compare readings and turn source material into guided learning.</p></div><span className="profile-chip green"><BookOpen /> Hebrew-first</span></div>
    <div className="torah-grid"><section className="panel source-panel"><header><strong>Document workspace</strong><div><button className={tab === "source" ? "active" : ""} onClick={() => setTab("source")}>Source</button><button className={tab === "review" ? "active" : ""} onClick={() => setTab("review")}>Review</button></div></header>{tab === "source" ? <div className="hebrew-source" dir="rtl"><span>משנה יומא · פרק ה</span><p>הוציאו לו את הכף ואת המחתה, וחפן מלא חפניו קטורת סמים דקה...</p><small>Source segment identified · confidence 98%</small></div> : <div className="review-list"><div><Check /><span><strong>Text normalized</strong><small>3 abbreviations expanded</small></span></div><div><Check /><span><strong>Source aligned</strong><small>Mishnah Yoma 5:1</small></span></div><div><Bot /><span><strong>Learning note</strong><small>Explain the order of service</small></span></div></div>}</section>
      <section className="panel source-insight"><span className="ai-orb"><Bot /></span><span>Study assistant</span><h3>Why is the order important?</h3><p>The sequence connects preparation, entry and service. In the 3D model, the same sequence can be followed spatially.</p><button>Open guided explanation <ChevronRight /></button></section></div>
  </div>;
}

function ContentLibrary() {
  const items = useMemo(() => [["School management","Yad Yisroel","Students · IEP · attendance · therapy · reporting"],["Learning management","Homework LMS","Classrooms · assignments · submissions · lecturer tools"],["Adaptive learning","Selfware Education","Thinking ID · personalized lessons · learning journeys"],["Math curriculum","FullMath","50+ Hebrew lessons · exercises · graphs · progress"],["AI grading","OptiMath + Matha","OCR · partial credit · micro-lessons · mobile scanning"],["Early learning game","Bright Starts","42 missions · 6 buildable areas · family progress"],["English game","FUN","Pre-A1 practice · teacher guide · browser play"],["History in 3D","Home3","Second Temple · evidence layer · source-synced simulation"],["Torah AI","Atuk + Shraga","Hebrew parsing · model training · source review"],["Publishing","Math Book Printer","Curriculum extraction · printable textbook generation"]], []);
  return <div className="workspace-page"><div className="page-intro"><div><span className="section-label">Project inventory</span><h2>The education software collection</h2><p>A consolidated view of the working products and reusable systems found in the workspace.</p></div><span className="profile-chip"><LibraryBig /> {items.length} systems</span></div><section className="catalog-list">{items.map(([type,name,features]) => <div key={name}><span>{type}</span><strong>{name}</strong><p>{features}</p><span className="catalog-status"><i /> In workspace</span></div>)}</section></div>;
}
