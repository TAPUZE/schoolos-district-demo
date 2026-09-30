"use client";

import {
  Accessibility,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  HandHeart,
  Languages,
  LayoutDashboard,
  Menu,
  MessageCircleMore,
  Network,
  PanelTop,
  School,
  ShieldCheck,
  Sparkles,
  TabletSmartphone,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type JourneyId = "arrival" | "classroom" | "learning" | "support" | "home";
type RoleId = "student" | "educator" | "family" | "support" | "district";

const journeySteps: Array<{ id: JourneyId; time: string; short: string; title: string; copy: string; signal: string; response: string; outcome: string }> = [
  { id: "arrival", time: "8:04", short: "Arrival", title: "The day starts with context—not assumptions.", copy: "Jordan checks in after a delayed bus. The attendance team sees the transportation note, and the family receives a confirmation in their preferred language.", signal: "Late arrival + transportation delay", response: "Excused context added automatically", outcome: "No unnecessary discipline loop" },
  { id: "classroom", time: "9:15", short: "Classroom", title: "The teacher sees what matters before the lesson begins.", copy: "A two-minute check-in shows that Jordan understands the concept but needs a visual example. The lesson view adapts without separating Jordan from classmates.", signal: "Concept ready · visual support helpful", response: "Teacher gets a ready-to-use visual scaffold", outcome: "Support inside core instruction" },
  { id: "learning", time: "11:20", short: "Learning", title: "Practice meets the learner where they are.", copy: "Jordan works through a math problem with step-by-step feedback, audio support, and the option to explain the answer in words, symbols, or a photo.", signal: "Correct strategy · explanation incomplete", response: "One targeted micro-lesson generated", outcome: "Feedback while the thinking is fresh" },
  { id: "support", time: "1:10", short: "Support", title: "The support team works from the same picture.", copy: "The counselor, special educator, and therapist can see the classroom strategy that worked—alongside only the information each role is allowed to access.", signal: "Visual scaffold improved independence", response: "Strategy connected to Jordan’s support goal", outcome: "Fewer handoff gaps between adults" },
  { id: "home", time: "3:42", short: "Home", title: "Families get a useful update, not another portal to decode.", copy: "A short mobile update explains what Jordan learned, celebrates progress, and offers one optional activity. It is translated and designed to work on a basic phone connection.", signal: "Today: persistence + equation balance", response: "Plain-language family update", outcome: "Learning continues without homework confusion" },
];

const roleViews: Record<RoleId, { eyebrow: string; title: string; copy: string; wins: string[]; preview: "student" | "teacher" | "family" | "support" | "district" }> = {
  student: { eyebrow: "Student experience", title: "A learning space that responds without labeling.", copy: "Students can choose accessible ways to learn and demonstrate understanding while staying connected to grade-level goals.", wins: ["Choice in how to learn and respond", "Immediate, encouraging feedback", "Visible goals and progress"], preview: "student" },
  educator: { eyebrow: "Educator workspace", title: "Less hunting for information. More time for teaching.", copy: "Planning, classroom signals, assignments, feedback, and support strategies come together in one calm workspace.", wins: ["Actionable morning brief", "Curriculum and scaffold builder", "Human-reviewed AI assistance"], preview: "teacher" },
  family: { eyebrow: "Family connection", title: "Communication that respects time, language, and access.", copy: "Families receive clear, mobile-first updates and can respond without navigating a maze of separate systems.", wins: ["Preferred-language communication", "SMS and low-bandwidth pathways", "Clear next steps, not school jargon"], preview: "family" },
  support: { eyebrow: "Whole-child support", title: "IEP, MTSS, counseling, and therapy—connected carefully.", copy: "Authorized team members coordinate goals, services, notes, and progress without losing the classroom context.", wins: ["Role-based information access", "Shared goal and service timeline", "Earlier, coordinated intervention"], preview: "support" },
  district: { eyebrow: "District leadership", title: "See where support is working—and where barriers remain.", copy: "Leaders can understand participation, access, service delivery, and instructional needs across schools without reducing students to a score.", wins: ["School and district patterns", "Equity and access signals", "Configurable local measures"], preview: "district" },
};

const suiteItems = [
  { icon: LayoutDashboard, title: "School & district operations", copy: "Enrollment, attendance, schedules, staffing, services, reports, and daily coordination.", detail: "Built from Yad Yisroel’s school-management workflows." },
  { icon: PanelTop, title: "Teaching & classroom", copy: "Planning, assignments, classroom views, progress checks, and differentiated materials.", detail: "A single daily workspace for educators." },
  { icon: BrainCircuit, title: "Curriculum studio", copy: "Build district-aligned units, lessons, practice, assessments, and printable materials.", detail: "Powered by FullMath, Selfware, and the book-building engine." },
  { icon: Bot, title: "AI feedback & workflows", copy: "Draft feedback, analyze student work, summarize patterns, and reduce repetitive administration.", detail: "Staff review stays in the loop." },
  { icon: HandHeart, title: "Student support", copy: "IEP goals, MTSS interventions, counseling, therapy sessions, service logs, and progress reports.", detail: "The right context for the right role." },
  { icon: MessageCircleMore, title: "Family partnership", copy: "Plain-language, multilingual, mobile-first updates, reminders, celebrations, and responses.", detail: "Designed for real family access conditions." },
] as const;

export default function Home() {
  const [journey, setJourney] = useState<JourneyId>("arrival");
  const [role, setRole] = useState<RoleId>("student");
  const [menuOpen, setMenuOpen] = useState(false);
  const activeJourney = journeySteps.find((step) => step.id === journey)!;
  const activeRole = roleViews[role];

  useEffect(() => {
    document.documentElement.classList.add("district-document");
    document.body.classList.add("district-page");
    return () => {
      document.documentElement.classList.remove("district-document");
      document.body.classList.remove("district-page");
    };
  }, []);

  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    const roles = Object.keys(roleViews) as RoleId[];
    void Promise.resolve(modelContext.registerTool({
      name: "show_school_suite_role",
      title: "Show school suite role",
      description: "Switch the visible district software demo to the selected community member’s experience.",
      inputSchema: { type: "object", properties: { role: { type: "string", enum: roles } }, required: ["role"], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input: unknown) {
        const nextRole = (input as { role?: string })?.role;
        if (!roles.includes(nextRole as RoleId)) throw new Error("Unknown role");
        setRole(nextRole as RoleId);
        document.getElementById("community")?.scrollIntoView({ behavior: "smooth" });
        return { role: nextRole, status: "shown" };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return <main className="district-site">
    <header className="district-nav">
      <a className="district-brand" href="#top" aria-label="SchoolOS home"><span><GraduationCap /></span><div><strong>SchoolOS</strong><small>Connected district learning</small></div></a>
      <nav className={menuOpen ? "open" : ""} aria-label="Primary navigation">
        <a href="#journey" onClick={() => setMenuOpen(false)}>Student journey</a>
        <a href="#community" onClick={() => setMenuOpen(false)}>Every role</a>
        <a href="#suite" onClick={() => setMenuOpen(false)}>The suite</a>
        <a href="#responsible-ai" onClick={() => setMenuOpen(false)}>Responsible AI</a>
        <a href="#possibilities" onClick={() => setMenuOpen(false)}>Built for your district</a>
      </nav>
      <a className="nav-action" href="#journey">Start the demo <ArrowRight /></a>
      <button className="mobile-menu" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
    </header>

    <section className="district-hero" id="top">
      <div className="hero-copy">
        <span className="hero-label"><Sparkles /> A connected software suite for public schools</span>
        <h1>One school day.<br />Every learner known.<br /><em>Every adult equipped.</em></h1>
        <p>SchoolOS connects instruction, student support, operations, and family partnership—so technology expands opportunity instead of adding another disconnected tool.</p>
        <div className="hero-actions"><a className="button-primary" href="#journey">Follow a student’s day <ArrowRight /></a><a className="button-secondary" href="#suite">Explore the full suite</a></div>
        <div className="hero-principles"><span><Languages /> Multilingual</span><span><Accessibility /> Accessible</span><span><TabletSmartphone /> Mobile & low-bandwidth</span><span><ShieldCheck /> Human-supervised AI</span></div>
      </div>
      <div className="hero-product" aria-label="Connected student support overview">
        <div className="product-window-bar"><span className="window-mark"><School /></span><div><strong>Roosevelt Community School</strong><small>Tuesday · Student success view</small></div><span className="live-pill">Live context</span></div>
        <div className="student-focus"><span className="student-initials">J</span><div><span>Today’s focus</span><strong>Jordan M. · Grade 7</strong><small>Strength: persistent problem-solver</small></div><span className="student-badge">On track</span></div>
        <div className="signal-grid"><div className="signal-card blue"><span>Learning</span><strong>Visual scaffold worked</strong><small>Math · 11:20 AM</small></div><div className="signal-card coral"><span>Connection</span><strong>Family update ready</strong><small>Spanish · Mobile</small></div><div className="signal-card yellow"><span>Support</span><strong>Goal progress noted</strong><small>Shared with authorized team</small></div><div className="signal-card green"><span>Student voice</span><strong>“I can show my steps”</strong><small>Reflection · Today</small></div></div>
        <div className="product-next"><CheckCircle2 /><span><strong>Next best action</strong><small>Keep the visual model in tomorrow’s warm-up.</small></span><button aria-label="Open next action"><ChevronRight /></button></div>
      </div>
    </section>

    <section className="trust-ribbon" aria-label="Platform principles"><span>Designed around people—not products</span><div><strong>Student agency</strong><strong>Teacher judgment</strong><strong>Family access</strong><strong>Whole-child support</strong><strong>District visibility</strong></div></section>

    <section className="journey-section" id="journey">
      <div className="section-heading"><span className="section-kicker">Guided district demo</span><h2>See the platform through one connected day.</h2><p>Jordan is a fictional student. The workflow shows how information can move with care—without making students or families repeat their story at every door.</p></div>
      <div className="journey-shell">
        <div className="journey-tabs" role="tablist" aria-label="Jordan's school day">{journeySteps.map((step) => <button key={step.id} role="tab" aria-selected={journey === step.id} className={journey === step.id ? "active" : ""} onClick={() => setJourney(step.id)}><time>{step.time}</time><span>{step.short}</span><i /></button>)}</div>
        <div className="journey-stage">
          <div className="journey-story"><span className="journey-time"><Clock3 /> {activeJourney.time} · {activeJourney.short}</span><h3>{activeJourney.title}</h3><p>{activeJourney.copy}</p><div className="journey-impact"><CheckCircle2 /><span><small>Why it matters</small><strong>{activeJourney.outcome}</strong></span></div></div>
          <div className="journey-flow"><div><span className="flow-icon signal"><BarChart3 /></span><small>Signal</small><strong>{activeJourney.signal}</strong></div><ArrowRight className="flow-arrow" /><div><span className="flow-icon response"><Sparkles /></span><small>Coordinated response</small><strong>{activeJourney.response}</strong></div></div>
        </div>
        <div className="journey-controls"><span>{journeySteps.findIndex((step) => step.id === journey) + 1} of {journeySteps.length}</span><button onClick={() => { const index = journeySteps.findIndex((step) => step.id === journey); setJourney(journeySteps[(index + 1) % journeySteps.length].id); }}>Next moment <ArrowRight /></button></div>
      </div>
    </section>

    <section className="community-section" id="community">
      <div className="section-heading light"><span className="section-kicker">One platform · different needs</span><h2>Technology that works for the whole school community.</h2><p>Switch perspectives to see how the same connected platform removes a different barrier for each person.</p></div>
      <div className="role-tabs" role="tablist" aria-label="Community member views">{(["student","educator","family","support","district"] as RoleId[]).map((id) => <button key={id} role="tab" aria-selected={role === id} className={role === id ? "active" : ""} onClick={() => setRole(id)}>{id === "support" ? "Support team" : id[0].toUpperCase() + id.slice(1)}</button>)}</div>
      <div className="role-stage"><div className="role-copy"><span>{activeRole.eyebrow}</span><h3>{activeRole.title}</h3><p>{activeRole.copy}</p><ul>{activeRole.wins.map((win) => <li key={win}><Check /> {win}</li>)}</ul></div><RolePreview type={activeRole.preview} /></div>
    </section>

    <section className="suite-section" id="suite">
      <div className="section-heading split"><div><span className="section-kicker">The SchoolOS suite</span><h2>One coherent foundation.<br />Six connected capabilities.</h2></div><p>Districts can begin with the highest-priority workflow and expand without rebuilding the experience around a new vendor every year.</p></div>
      <div className="suite-grid">{suiteItems.map(({ icon: Icon, title, copy, detail }, index) => <article key={title}><span className={`suite-icon suite-${index + 1}`}><Icon /></span><span className="suite-number">0{index + 1}</span><h3>{title}</h3><p>{copy}</p><small>{detail}</small></article>)}</div>
      <div className="connected-layer"><Network /><div><span>Connected data and workflow layer</span><strong>One student, one trusted story, appropriate access for every role.</strong></div><div className="layer-chips"><span>SIS</span><span>LMS</span><span>IEP / MTSS</span><span>Curriculum</span><span>Family</span><span>Analytics</span></div></div>
    </section>

    <section className="ai-section" id="responsible-ai">
      <div className="ai-demo-card"><div className="ai-card-top"><span><Bot /> SchoolOS Copilot</span><small>Teacher review required</small></div><div className="ai-prompt"><span>Teacher request</span><p>“Create a visual warm-up for balancing equations. Keep it grade-level, readable on a phone, and offer an audio option.”</p></div><div className="ai-result"><span><Sparkles /> Draft ready for review</span><div><Check /> District standard aligned</div><div><Check /> Visual and audio supports included</div><div><Check /> Student data excluded from the prompt</div></div><button>Review and edit draft <ArrowRight /></button></div>
      <div className="ai-copy"><span className="section-kicker">AI that serves educators</span><h2>Powerful assistance.<br />Clear human control.</h2><p>AI can reduce repetitive work and make personalization practical—but it should never quietly make high-stakes decisions about students.</p><div className="guardrails"><div><ShieldCheck /><span><strong>People stay accountable</strong><small>Staff review outputs before they affect instruction, services, or communication.</small></span></div><div><BookOpen /><span><strong>Sources stay visible</strong><small>Educators can inspect the standards, materials, and context behind a suggestion.</small></span></div><div><Accessibility /><span><strong>Equity is tested, not assumed</strong><small>District-defined review for language, accessibility, bias, and disparate impact.</small></span></div></div></div>
    </section>

    <section className="immersive-section">
      <div className="immersive-heading"><span className="section-kicker">A small window into what else is possible</span><h2>Curriculum can become an experience.</h2><p>Immersive learning is one optional part of the suite—not the center of it. Students can investigate places, evidence, and competing interpretations together.</p></div>
      <div className="immersive-grid"><article className="immersive-live"><div className="scene-stamp">Interactive now</div><div className="scene-art temple-art" aria-hidden="true"><Building2 /></div><div><span>Jerusalem · Second Temple</span><h3>Walk through history with the sources beside you.</h3><p>Explore architecture, vocabulary, ritual sequence, and evidence in a guided 3D model.</p><a href="/ancient">Open the curated 3D experience <ArrowRight /></a></div></article><article><span className="concept-label">Model concept</span><div className="small-scene"><strong>ROME</strong><span>Colosseum & civic life</span></div><p>Compare public space, power, engineering, and daily life through a carefully sourced reconstruction.</p></article><article><span className="concept-label">Custom to the district</span><div className="small-scene local"><strong>OUR CITY</strong><span>Neighborhood history</span></div><p>Build local-history experiences with community archives, student voices, and district curriculum.</p></article></div>
    </section>

    <section className="possibilities-section" id="possibilities">
      <div className="possibilities-copy"><span className="section-kicker">Built with your district—not dropped on it</span><h2>This suite is the starting point.</h2><p>The engines behind this demo can be configured around district priorities, existing systems, language communities, instructional frameworks, and the realities of each school.</p><div className="custom-list"><div><span>01</span><p><strong>Start with the barrier</strong>Listen to students, families, educators, and support teams before choosing the workflow.</p></div><div><span>02</span><p><strong>Build a focused pilot</strong>Connect one high-value journey and define success with the people doing the work.</p></div><div><span>03</span><p><strong>Grow a shared platform</strong>Expand the connected foundation instead of creating another patchwork of tools.</p></div></div></div>
      <div className="iceberg-card"><span className="iceberg-top">What you see today</span><div className="visible-modules"><span>School operations</span><span>Learning</span><span>Student support</span><span>Family</span></div><div className="water-line">A connected foundation</div><div className="engine-list"><span>Workflow engine</span><span>Curriculum engine</span><span>AI orchestration</span><span>Content generation</span><span>Game systems</span><span>3D experiences</span><span>Reporting</span><span>Integrations</span><span>Accessibility</span></div><small>Custom capabilities can be built on the same foundation.</small></div>
    </section>

    <footer><div className="footer-brand"><span><GraduationCap /></span><div><strong>SchoolOS</strong><small>The connected software suite for the school of tomorrow.</small></div></div><a href="#top">Return to the top <ArrowRight /></a></footer>
  </main>;
}

function RolePreview({ type }: { type: "student" | "teacher" | "family" | "support" | "district" }) {
  if (type === "student") return <div className="role-preview student-preview"><div className="preview-top"><span>My learning</span><strong>Good morning, Jordan</strong></div><div className="student-task"><span>Today’s next step</span><strong>Show how you balanced the equation</strong><div><button>Draw it</button><button>Explain it</button><button>Upload it</button></div></div><div className="student-progress"><span>Weekly goal</span><strong>3 of 4 practice moments</strong><i><b /></i></div></div>;
  if (type === "teacher") return <div className="role-preview teacher-preview"><div className="preview-top"><span>Period 2 · Math</span><strong>Classroom brief</strong></div><div className="teacher-metrics"><div><strong>18</strong><span>Ready to extend</span></div><div><strong>6</strong><span>Need a visual model</span></div><div><strong>3</strong><span>Check in first</span></div></div><div className="teacher-action"><Sparkles /><span><strong>Warm-up draft ready</strong><small>Aligned to today’s objective · review before sharing</small></span><ChevronRight /></div></div>;
  if (type === "family") return <div className="role-preview phone-preview"><div className="phone-shell"><div className="phone-bar"><span>School update</span><small>Español</small></div><div className="family-message"><span>Today · 3:42 PM</span><strong>Jordan kept working through a challenging math problem today.</strong><p>Ask: “Can you show me how you kept both sides balanced?” No worksheet needed.</p><div>Celebrate today 🎉</div></div><button>Reply to the teacher</button></div></div>;
  if (type === "support") return <div className="role-preview support-preview"><div className="preview-top"><span>Authorized team view</span><strong>Jordan’s support plan</strong></div><div className="goal-row"><span>Current goal</span><strong>Explain a problem-solving strategy independently</strong><i><b /></i><small>72% toward term target</small></div><div className="support-note"><CheckCircle2 /><span><strong>Classroom strategy connected</strong><small>Visual balance model · added today by Ms. Reed</small></span></div></div>;
  return <div className="role-preview district-preview"><div className="preview-top"><span>District learning & access</span><strong>Where should we focus support?</strong></div><div className="district-chart"><div><span>Multilingual family reach</span><i><b style={{ width: "84%" }} /></i></div><div><span>Timely service delivery</span><i><b style={{ width: "72%" }} /></i></div><div><span>Accessible materials</span><i><b style={{ width: "91%" }} /></i></div></div><div className="district-note"><BarChart3 /><span><strong>Pattern worth reviewing</strong><small>Two schools need additional translation workflow support.</small></span></div></div>;
}
