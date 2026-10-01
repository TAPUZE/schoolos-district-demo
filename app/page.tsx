"use client";

import { ArrowRight, BarChart3, BookOpen, Bot, Building2, Check, CheckCircle2, ClipboardCheck, Clock3, GraduationCap, HandHeart, Menu, MessageCircleMore, MousePointer2, Puzzle, School, ShieldCheck, Sparkles, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ModuleId = "operations" | "teaching" | "homework" | "support" | "families" | "insights";
type DayId = "arrival" | "class" | "homework" | "support" | "home";
type RoleId = "leader" | "teacher" | "student" | "family" | "support";
type LearningStep = "evidence" | "root" | "path" | "materials";

const asset = (path: string) => `${import.meta.env.BASE_URL ?? "/"}${path.replace(/^\//, "")}`;

const modules: Array<{ id: ModuleId; title: string; plain: string; detail: string; image: string; icon: typeof School }> = [
  { id: "operations", title: "School operations", plain: "Run the school day", detail: "Enrollment, attendance, schedules, staffing, services, forms, records, and reporting.", image: "/mockups/district-command-center.png", icon: Building2 },
  { id: "teaching", title: "Teaching & curriculum", plain: "Plan and teach", detail: "Standards-aligned units, lesson planning, differentiated materials, and classroom tools.", image: "/mockups/teacher-studio.png", icon: BookOpen },
  { id: "homework", title: "Homework, assessment & learning paths", plain: "Diagnose and personalize", detail: "Find recurring root-skill gaps, map the next teaching path, and generate targeted practice for each student.", image: "/mockups/student-learning-path.png", icon: ClipboardCheck },
  { id: "support", title: "Student support", plain: "Coordinate the whole child", detail: "IEP and MTSS goals, counseling, therapy, interventions, service logs, and progress notes.", image: "/mockups/student-support-hub.png", icon: HandHeart },
  { id: "families", title: "Family connection", plain: "Keep families included", detail: "Clear multilingual updates, mobile access, forms, reminders, celebrations, and two-way communication.", image: "/mockups/family-connection.png", icon: MessageCircleMore },
  { id: "insights", title: "Insights & responsible AI", plain: "See needs and reduce busywork", detail: "Dashboards, early signals, draft feedback, summaries, and district-defined human review.", image: "/mockups/insights-responsible-ai.png", icon: BarChart3 },
];

const day: Array<{ id: DayId; time: string; label: string; title: string; story: string; used: ModuleId[]; image: string; imageAlt: string }> = [
  { id: "arrival", time: "8:05 AM", label: "Arrival", title: "Attendance includes the reason, not just the timestamp.", story: "Jordan’s bus arrives late. The office records the transportation delay, the teacher sees that context, and the family gets a confirmation—without another phone call.", used: ["operations", "families"], image: "/mockups/district-command-center.png", imageAlt: "School operations view with attendance and transportation context" },
  { id: "class", time: "10:20 AM", label: "Class", title: "The teacher starts with the lesson and the support that works.", story: "The class opens today’s Grade 7 proportional-relationships lesson. Jordan receives the same grade-level goal with a visual comparison of tables, graphs, and equations already available.", used: ["teaching", "support"], image: "/mockups/teacher-studio.png", imageAlt: "Teacher lesson workspace with classroom supports" },
  { id: "homework", time: "3:15 PM", label: "Homework", title: "Homework becomes evidence for the next teaching decision.", story: "Across a data-plan table, a graph, and a percent-change problem, Jordan repeatedly uses additive reasoning where a multiplicative factor is needed. The system surfaces that pattern for the teacher to review.", used: ["homework", "teaching", "insights"], image: "/mockups/homework-evidence-review-v2.png", imageAlt: "Grade 7 homework evidence review showing a recurring multiplicative-scaling misconception" },
  { id: "support", time: "4:00 PM", label: "Support", title: "Support staff build on what happened in the classroom.", story: "Authorized staff see which representation helped Jordan distinguish constant difference from constant factor. They reinforce the same language without exposing unrelated information.", used: ["support", "insights"], image: "/mockups/student-support-hub.png", imageAlt: "Student support coordination workspace" },
  { id: "home", time: "6:30 PM", label: "At home", title: "Families see what is due and how to help—in plain language.", story: "A mobile update shows the homework status, tomorrow’s reminder, and a translated message. The family can reply from the same screen instead of learning another portal.", used: ["families", "homework"], image: "/mockups/family-connection.png", imageAlt: "Family mobile connection workspace" },
];

const roles: Record<RoleId, { label: string; title: string; copy: string; points: string[]; image: string; imageAlt: string }> = {
  leader: { label: "District & school leaders", title: "One view of operations, learning, access, and support.", copy: "Configure the measures that matter locally and understand where schools need resources—without forcing every campus into the same workflow.", points: ["District and school dashboards", "Configurable reports and permissions", "Integration with existing systems"], image: "/mockups/insights-responsible-ai.png", imageAlt: "District insight workspace" },
  teacher: { label: "Teachers", title: "One daily workspace instead of disconnected tabs.", copy: "Plan instruction, post homework, review student work, apply supports, and communicate with families from a connected workspace.", points: ["Lesson and curriculum builder", "Assignment and feedback workflow", "Human-reviewed AI assistance"], image: "/mockups/teacher-studio.png", imageAlt: "Teacher planning workspace" },
  student: { label: "Students", title: "A clear place to learn, respond, and ask for help.", copy: "Students see what is happening today, what is due next, and different accessible ways to demonstrate understanding.", points: ["Simple daily plan", "Multiple response formats", "Visible feedback and progress"], image: "/mockups/teaching-path-visual-v2.png", imageAlt: "Student teaching path with four Grade 7 activities" },
  family: { label: "Families", title: "Useful information that works on a phone.", copy: "Families receive plain-language, multilingual updates and can respond without navigating a maze of separate products.", points: ["Assignments and due dates", "Attendance and school updates", "Two-way multilingual communication"], image: "/mockups/family-connection.png", imageAlt: "Family connection workspace" },
  support: { label: "Support teams", title: "The right context for the right professional.", copy: "Counselors, therapists, special educators, and intervention teams coordinate goals and services with role-based access.", points: ["Shared goal timeline", "Service and progress records", "Classroom strategies that worked"], image: "/mockups/student-support-hub.png", imageAlt: "Student support coordination workspace" },
};

const proof = [
  { title: "Homework evidence review", tag: "HOMEWORK · PATTERN FINDING", image: "/mockups/homework-evidence-review-v2.png", alt: "Grade 7 homework review showing evidence of a multiplicative-scaling misconception", copy: "Review the work itself and see the recurring evidence behind the next instructional decision.", className: "proof-feature" },
  { title: "Auto-grading with teacher approval", tag: "ASSESSMENT · RESPONSIBLE AI", image: "/mockups/auto-grading-workspace.png", alt: "Auto-grading workspace with rubric-based feedback and required teacher approval", copy: "AI drafts a score and concept feedback from the rubric; the teacher edits and approves the final result.", className: "proof-feature" },
  { title: "Learning Studio & mini-games", tag: "CONTENT GENERATION · PLAY", image: "/mockups/learning-studio-game-v2.png", alt: "Grade 7 Learning Studio with visual lesson, worked example, and interactive practice", copy: "Generate a coherent lesson, worked example, and playable practice experience around one precise skill.", className: "proof-feature" },
  { title: "Individual teaching paths", tag: "PERSONALIZED LEARNING · NEXT STEP", image: "/mockups/teaching-path-visual-v2.png", alt: "Four-step Grade 7 teaching path for multiplicative scaling", copy: "Turn a diagnosed need into a clear sequence of age-respectful activities that reconnects to grade-level work.", className: "proof-feature" },
  { title: "Family Connection", tag: "FAMILY ACCESS · MULTILINGUAL", image: "/mockups/family-connection.png", alt: "Family connection with homework, attendance, forms, events, and multilingual messaging", copy: "Give families one friendly place for what is due, what changed, and how to respond in their language.", className: "proof-feature" },
  { title: "Immersive 3D history", tag: "OPTIONAL LEARNING EXPERIENCE · INTERACTIVE 3D", image: "/mockups/immersive-temple-3d.png", alt: "Three-dimensional reconstruction of the ancient Temple complex", copy: "Students can explore carefully curated historical environments alongside maps, primary sources, guided questions, and district curriculum.", className: "proof-immersive" },
];

const learningSteps: Array<{ id: LearningStep; number: string; label: string; title: string; copy: string; image: string; imageAlt: string }> = [
  { id: "evidence", number: "01", label: "Collect evidence", title: "Look across different Grade 7 tasks—not at one score.", copy: "A data-plan table, coordinate graph, percent-change problem, classwork, and teacher observations show when Jordan switches from multiplicative to additive reasoning.", image: "/mockups/homework-evidence-review-v2.png", imageAlt: "Grade 7 homework evidence across tables, graphs, and percent change" },
  { id: "root", number: "02", label: "Locate the root skill", title: "Find the reasoning pattern creating problems across the unit.", copy: "Jordan understands the situations, but tracks how much is added instead of the constant factor relating two quantities. That pattern appears in ratio tables, graphs, equations, and percent change.", image: "/mockups/root-skill-explorer-v2.png", imageAlt: "Root Skill Explorer locating multiplicative scaling across four Grade 7 representations" },
  { id: "path", number: "03", label: "Map the teaching path", title: "Address the need without taking Jordan out of grade-level work.", copy: "The path contrasts additive and multiplicative change, builds unit-rate reasoning, connects tables to graphs and equations, then applies the idea to a Grade 7 percent-change problem.", image: "/mockups/teaching-path-visual-v2.png", imageAlt: "Four-step Grade 7 teaching path for multiplicative scaling" },
  { id: "materials", number: "04", label: "Generate targeted materials", title: "Create age-respectful practice around the exact need.", copy: "The teacher receives an editable Grade 7 mini-lesson, data-plan example, table-graph-equation challenge, and quick check. New evidence keeps updating the path.", image: "/mockups/learning-studio-game-v2.png", imageAlt: "Grade 7 Learning Studio generating proportional-reasoning materials" },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<ModuleId[]>(["operations", "teaching", "homework"]);
  const [dayId, setDayId] = useState<DayId>("homework");
  const [role, setRole] = useState<RoleId>("leader");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [learningStep, setLearningStep] = useState<LearningStep>("root");
  const [proofIndex, setProofIndex] = useState(0);
  const activeDay = day.find((item) => item.id === dayId)!;
  const activeLearningStep = learningSteps.find((item) => item.id === learningStep)!;
  const activeProof = proof[proofIndex];
  const selectedModules = useMemo(() => modules.filter((item) => selected.includes(item.id)), [selected]);

  useEffect(() => {
    document.documentElement.classList.remove("district-document");
    document.body.classList.remove("district-page");
    document.documentElement.classList.add("suite-document");
    document.body.classList.add("suite-page");
    return () => {
      document.documentElement.classList.remove("suite-document");
      document.body.classList.remove("suite-page");
    };
  }, []);

  const toggleModule = (id: ModuleId) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return <main className="suite-site">
    <header className="suite-nav">
      <a className="suite-brand" href="#top" aria-label="SchoolOS home"><span><GraduationCap /></span><div><strong>SchoolOS</strong><small>Configurable school software</small></div></a>
      <nav className={menuOpen ? "open" : ""} aria-label="Main navigation">
        <a href="#suite" onClick={() => setMenuOpen(false)}>01 Platform</a><a href="#learning-engine" onClick={() => setMenuOpen(false)}>02 Learning engine</a><a href="#software" onClick={() => setMenuOpen(false)}>03 Platform views</a><a href="#school-day" onClick={() => setMenuOpen(false)}>04 School day</a><a href="#custom" onClick={() => setMenuOpen(false)}>05 Rollout</a>
      </nav>
      <a className="nav-cta" href="#suite">Build your suite <ArrowRight /></a>
      <button className="nav-menu" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
    </header>

    <section className="suite-hero" id="top">
      <div className="hero-message">
        <span className="eyebrow"><School /> ONE CONNECTED PLATFORM FOR K–12</span>
        <h1>Every school system,<br /><em>working as one.</em></h1>
        <p>SchoolOS connects operations, teaching, homework, individualized learning, student support, and family communication—configured around the way your district actually works.</p>
        <div className="hero-actions"><a className="primary" href="#software">See the platform <ArrowRight /></a><a className="secondary" href="#suite">Build your suite</a></div>
        <div className="hero-assurances"><span><Check /> Start with one module</span><span><Check /> Connect what you already use</span><span><Check /> Expand over time</span></div>
      </div>
      <div className="hero-product" aria-label="SchoolOS focused learning platform preview">
        <div className="hero-product-label"><span>A focused workspace for every job</span><strong>Clear next steps instead of crowded dashboards</strong></div>
        <button onClick={() => setLightbox(3)} aria-label="Enlarge individualized teaching path"><img src={asset("/mockups/teaching-path-visual-v2.png")} alt="A clear Grade 7 teaching path for multiplicative scaling" /></button>
      </div>
    </section>

    <section className="at-a-glance" aria-label="SchoolOS at a glance">
      <div><span>PLATFORM</span><strong>One connected foundation</strong><p>Shared people, permissions, data, accessibility, integrations, and reporting.</p></div>
      <div><span>CAPABILITIES</span><strong>Modules selected by the district</strong><p>Operations, teaching, homework, student support, family connection, and insight.</p></div>
      <div><span>IMPLEMENTATION</span><strong>Configured around each school system</strong><p>Start with a focused workflow, prove value, and expand on the same foundation.</p></div>
    </section>

    <section className="modules-section" id="suite">
      <div className="section-intro"><span className="section-number">01</span><span className="eyebrow"><Puzzle /> PLATFORM & MODULES</span><h2>Six connected parts. One package built around your schools.</h2><p>Select any module to see how a district can assemble its own suite.</p></div>
      <div className="module-builder">
        <div className="module-grid">{modules.map((item) => { const Icon = item.icon; const isSelected = selected.includes(item.id); return <button key={item.id} className={isSelected ? "module-card selected" : "module-card"} onClick={() => toggleModule(item.id)} aria-pressed={isSelected}><span className="module-icon"><Icon /></span><span className="module-copy"><strong>{item.title}</strong><small>{item.plain}</small></span><span className="module-check">{isSelected ? <Check /> : <span>+</span>}</span></button>; })}</div>
        <aside className="package-panel"><div className="package-heading"><span className="panel-label">YOUR EXAMPLE PACKAGE</span><strong>{selected.length} of {modules.length} added</strong></div><h3>{selected.length ? "A suite that grows with you" : "Choose your first module"}</h3><p>{selected.length ? "Click any selected item to remove it. Every module shares the same foundation." : "Select only what your schools need now. Add more later without starting over."}</p><div className="package-list">{selectedModules.map((item) => <button key={item.id} onClick={() => toggleModule(item.id)}><img src={asset(item.image)} alt="" /><span><strong>{item.title}</strong><small>{item.plain}</small></span><CheckCircle2 /></button>)}{!selected.length && <div className="empty-package"><MousePointer2 /><span>Select a module from the list</span></div>}</div><div className="package-foundation"><ShieldCheck /><span><strong>Always included</strong><small>Identity, permissions, integrations, accessibility, data, and reporting</small></span></div></aside>
      </div>
    </section>

    <section className="learning-section" id="learning-engine">
      <div className="learning-heading">
        <span className="section-number">02</span>
        <div><span className="eyebrow"><Sparkles /> INDIVIDUALIZED LEARNING ENGINE</span><h2>Diagnose the underlying difficulty. Build the next learning path.</h2><p>The goal is not to label a student by grade, course, or test score. The engine looks for the smallest recurring concept that is blocking later learning, then helps the educator address it directly.</p></div>
      </div>
      <div className="diagnostic-example">
        <div className="diagnostic-label"><span>STUDENT CASE · JORDAN, GRADE 7</span><strong>Current unit: proportional relationships</strong></div>
        <div className="not-this"><span>NOT THIS</span><strong>“Jordan is weak in Grade 7 math.”</strong><p>A broad label does not explain what to teach next.</p></div>
        <ArrowRight className="diagnostic-arrow" />
        <div className="this-instead"><span>ROOT PATTERN FOUND</span><strong>Jordan uses additive change where a multiplicative factor is required.</strong><p>The same reasoning pattern appears in ratio tables, coordinate graphs, equations, and percent-change problems.</p></div>
      </div>
      <div className="learning-workspace">
        <div className="learning-tabs" role="tablist" aria-label="Individualized learning process">{learningSteps.map((item) => <button key={item.id} role="tab" aria-selected={learningStep === item.id} className={learningStep === item.id ? "active" : ""} onClick={() => setLearningStep(item.id)}><span>{item.number}</span><strong>{item.label}</strong></button>)}</div>
        <div className="learning-detail">
          <div className="learning-explanation"><span>STEP {activeLearningStep.number}</span><h3>{activeLearningStep.title}</h3><p>{activeLearningStep.copy}</p><div className="teacher-control"><ShieldCheck /><span><strong>Educator review is required</strong><small>The system recommends and generates. The educator decides what is accurate, appropriate, and ready to assign.</small></span></div></div>
          <div className="learning-visual-panel" aria-live="polite">
            <div className="learning-visual-label"><span>{activeLearningStep.label}</span><strong>Jordan · Grade 7</strong></div>
            <img src={asset(activeLearningStep.image)} alt={activeLearningStep.imageAlt} />
          </div>
        </div>
      </div>
      <p className="learning-note"><strong>Personalized does not mean permanently categorized.</strong> The system learns which explanations, representations, pacing, and response formats help the student with this concept now. It keeps updating as new evidence appears.</p>
    </section>

    <section className="software-section" id="software">
      <div className="section-intro"><span className="section-number">03</span><span className="eyebrow"><Sparkles /> EVERY APP HAS A CLEAR JOB</span><h2>See what each part of the platform actually does.</h2><p>Every app has its own focused workspace, while the navigation, student context, permissions, and design language remain familiar across the full suite.</p></div>
      <div className="experience-browser">
        <div className="experience-menu" role="tablist" aria-label="Platform experiences">{proof.map((item, index) => <button key={item.title} role="tab" aria-selected={proofIndex === index} className={proofIndex === index ? "active" : ""} onClick={() => setProofIndex(index)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong><ArrowRight /></button>)}</div>
        <article className="experience-stage" aria-live="polite"><button className="experience-image" onClick={() => setLightbox(proofIndex)} aria-label={`Enlarge ${activeProof.title}`}><img src={asset(activeProof.image)} alt={activeProof.alt} /><span>Open full view <ArrowRight /></span></button><div className="experience-copy"><span>{activeProof.tag}</span><h3>{activeProof.title}</h3><p>{activeProof.copy}</p><button onClick={() => setLightbox(proofIndex)}>Explore this workspace <ArrowRight /></button></div></article>
      </div>
      <div className="proof-note"><ShieldCheck /><p><strong>Designed for a U.S. public-school deployment.</strong> Every view is configured to district terminology, curriculum, languages, accessibility requirements, permissions, integrations, and data policies.</p></div>
    </section>

    <section className="day-section" id="school-day">
      <div className="section-intro"><span className="section-number">04</span><span className="eyebrow"><Clock3 /> THE CONNECTED SCHOOL DAY</span><h2>Follow one student through a connected school day.</h2><p>The suite connects the work already happening across the school. Homework is part of the day—not a separate system.</p></div>
      <div className="day-tabs" role="tablist" aria-label="Student school day">{day.map((item) => <button key={item.id} role="tab" aria-selected={dayId === item.id} className={dayId === item.id ? "active" : ""} onClick={() => setDayId(item.id)}><span>{item.time}</span><strong>{item.label}</strong></button>)}</div>
      <div className="day-card"><div className="day-visual"><img src={asset(activeDay.image)} alt={activeDay.imageAlt} /><span>{activeDay.time}<strong>{activeDay.label}</strong></span></div><div className="day-story"><span>{activeDay.time} · JORDAN, GRADE 7</span><h3>{activeDay.title}</h3><p>{activeDay.story}</p><div className="day-connections"><span>CONNECTED MODULES</span>{activeDay.used.map((id) => { const item = modules.find((module) => module.id === id)!; const Icon = item.icon; return <div key={id}><Icon /><span><strong>{item.title}</strong><small>{item.plain}</small></span></div>; })}</div></div></div>
    </section>

    <section className="people-section" id="people">
      <div className="section-intro split-intro"><div><span className="eyebrow"><Users /> ONE PLATFORM · DIFFERENT JOBS</span><h2>Clear value for every person in the school community.</h2></div><p>Choose a role to see what the same connected suite makes easier.</p></div>
      <div className="role-layout"><div className="role-tabs" role="tablist" aria-label="School community roles">{(Object.keys(roles) as RoleId[]).map((id) => <button key={id} role="tab" aria-selected={role === id} className={role === id ? "active" : ""} onClick={() => setRole(id)}>{roles[id].label}<ArrowRight /></button>)}</div><div className="role-detail"><div className="role-copy"><span>{roles[role].label}</span><h3>{roles[role].title}</h3><p>{roles[role].copy}</p><div>{roles[role].points.map((point) => <strong key={point}><CheckCircle2 />{point}</strong>)}</div></div><img src={asset(roles[role].image)} alt={roles[role].imageAlt} /></div></div>
    </section>

    <section className="custom-section" id="custom"><div className="custom-copy"><span className="section-number">05</span><span className="eyebrow"><Bot /> DISTRICT ROLLOUT</span><h2>The suite is the starting point—not a limit.</h2><p>Our engines let us configure existing modules and build district-specific workflows without turning the result into another disconnected product.</p></div><div className="custom-steps"><div><span>1</span><strong>Choose the priority</strong><p>Attendance, homework, curriculum, support services, family access, or another district need.</p></div><div><span>2</span><strong>Configure the suite</strong><p>Select modules, roles, terminology, integrations, languages, accessibility, and reports.</p></div><div><span>3</span><strong>Pilot and expand</strong><p>Launch a focused workflow, measure what helps, and add more on the same foundation.</p></div></div></section>
    <section className="closing-section"><div><span>A MODULAR SCHOOL PLATFORM</span><h2>Start with what your schools need now.<br />Build toward what they need next.</h2></div><a href="#suite">Explore the suite again <ArrowRight /></a></section>
    <footer><div className="suite-brand"><span><GraduationCap /></span><div><strong>SchoolOS</strong><small>Configurable school software</small></div></div><a href="#top">Return to top <ArrowRight /></a></footer>

    {lightbox !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label={proof[lightbox].title} onClick={() => setLightbox(null)}><button className="lightbox-close" aria-label="Close full screen" onClick={() => setLightbox(null)}><X /></button><div onClick={(event) => event.stopPropagation()}><img src={asset(proof[lightbox].image)} alt={proof[lightbox].alt} /><div><span>{proof[lightbox].tag}</span><strong>{proof[lightbox].title}</strong><p>{proof[lightbox].copy}</p></div></div></div>}
  </main>;
}
