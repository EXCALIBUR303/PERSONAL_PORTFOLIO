"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  AnimatePresence,
  MotionConfig,
  LazyMotion,
  m,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Asterisk,
  Code2,
  Database,
  Github,
  Menu,
  Moon,
  Shapes,
  Sparkles,
  Sun,
  Terminal,
  X,
} from "lucide-react";
import { profile } from "@/data/profile";
import { categories, projects, type Project } from "@/data/projects";
import HeroArt from "./hero-art";
import dynamic from "next/dynamic";
import { ProjectCard } from "./project-components";
const ProjectDialog = dynamic(() => import("./project-dialog"), { ssr: false });
import ColorLab from "./color-lab";
import Contact from "./contact";
import { SectionLabel, Reveal } from "./ui";
import { motionTokens } from "./motion-config";

const loadMotionFeatures = () =>
  import("./motion-features").then((module) => module.default);

const links = [
  { id: "about", name: "About" },
  { id: "projects", name: "Work" },
  { id: "skills", name: "Toolkit" },
  { id: "contact", name: "Contact" },
];
function Cursor() {
  const x = useMotionValue(-100),
    y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 180, damping: 30 }),
    sy = useSpring(y, { stiffness: 180, damping: 30 });
  useEffect(() => {
    if (
      !matchMedia("(pointer:fine) and (prefers-reduced-motion: no-preference)")
        .matches
    )
      return;
    const move = (e: PointerEvent) => {
      x.set(e.clientX - 13);
      y.set(e.clientY - 13);
    };
    const leave = () => {
      x.set(-100);
      y.set(-100);
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);
  return (
    <m.div
      className="cursor-aura"
      style={{ x: sx, y: sy }}
      aria-hidden="true"
    />
  );
}
export default function Portfolio() {
  const [menuOpen, setMenuOpen] = useState(false),
    [light, setLight] = useState(false),
    [active, setActive] = useState("");
  const [category, setCategory] = useState<string>("All work"),
    [selected, setSelected] = useState<Project | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -35]);
  const reduced = useReducedMotion();
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -55% 0px" },
    );
    links.forEach((link) => {
      const section = document.getElementById(link.id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    const wide = matchMedia("(min-width: 761px)");
    const resize = () => {
      if (wide.matches) setMenuOpen(false);
    };
    window.addEventListener("keydown", close);
    wide.addEventListener("change", resize);
    return () => {
      window.removeEventListener("keydown", close);
      wide.removeEventListener("change", resize);
    };
  }, [menuOpen]);
  const filtered = projects.filter(
    (project) => category === "All work" || project.category === category,
  );
  const icons = {
    code: Code2,
    shapes: Shapes,
    database: Database,
    terminal: Terminal,
  };
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{
        duration: motionTokens.duration.normal,
        ease: motionTokens.ease,
      }}
    >
      <LazyMotion features={loadMotionFeatures}>
        <div className="portfolio-root" data-theme={light ? "light" : "dark"}>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <Cursor />
          <m.div
            className="scroll-progress"
            style={{ scaleX }}
            aria-hidden="true"
          />
          <header className="site-header">
            <div className="container nav-container">
              <a
                className="wordmark"
                href="#"
                aria-label="form&function. — Back to top"
              >
                <Asterisk size={29} strokeWidth={2} />
                <span>
                  form<span className="wordmark-and">&</span>function
                  <span className="wordmark-dot">.</span>
                </span>
              </a>
              <nav className="desktop-nav" aria-label="Main navigation">
                {links.map((link) => (
                  <a
                    href={`#${link.id}`}
                    key={link.id}
                    aria-current={active === link.id ? "location" : undefined}
                  >
                    {link.name}
                    <i />
                  </a>
                ))}
              </nav>
              <div className="nav-actions">
                <button
                  className="theme-button icon-button"
                  onClick={() => setLight(!light)}
                  aria-label={`Switch to ${light ? "dark" : "light"} theme`}
                >
                  {light ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <a href="#contact" className="nav-contact">
                  Let’s talk
                  <ArrowUpRight size={16} />
                </a>
                <button
                  ref={menuButton}
                  className="mobile-menu-toggle icon-button"
                  aria-expanded={menuOpen}
                  aria-controls="mobile-navigation"
                  aria-label={
                    menuOpen ? "Close navigation menu" : "Open navigation menu"
                  }
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  {menuOpen ? <X /> : <Menu />}
                </button>
              </div>
            </div>
            <AnimatePresence>
              {menuOpen && (
                <m.nav
                  id="mobile-navigation"
                  className="mobile-nav"
                  aria-label="Mobile navigation"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  {links.map((link, i) => (
                    <a
                      key={link.id}
                      href={`#${link.id}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="mono">0{i + 1}</span>
                      {link.name}
                      <ArrowUpRight size={21} />
                    </a>
                  ))}
                </m.nav>
              )}
            </AnimatePresence>
          </header>
          <main id="main">
            <section className="hero container" aria-labelledby="hero-title">
              <div className="hero-topline mono">
                <span>
                  <i className="status-dot" />A PERSONAL SPACE ON THE INTERNET
                </span>
                <span>DESIGN MINDED. CODE DRIVEN.</span>
              </div>
              <div className="hero-layout">
                <m.div
                  className="hero-copy"
                  style={{ y: reduced ? 0 : heroY }}
                  initial={false}
                >
                  <p className="hero-intro mono">
                    HELLO, I’M <span>[ {profile.name.toUpperCase()} ]</span>
                    <span className="role-label">{profile.role}</span>
                  </p>
                  <h1 id="hero-title">
                    {profile.headline[0]}
                    <br />
                    {profile.headline[1]}
                    <br />
                    <span>
                      {profile.headline[2]}
                      <svg viewBox="0 0 500 18" aria-hidden="true">
                        <path d="M3 11C130 1 320 1 496 10" />
                      </svg>
                    </span>
                  </h1>
                  <p className="hero-description">{profile.introduction}</p>
                  <div className="hero-buttons">
                    <a href="#projects" className="button button-lime">
                      Explore my work
                      <ArrowUpRight size={19} />
                    </a>
                    <a href="#contact" className="hero-contact">
                      Say hello
                      <ArrowUpRight size={18} />
                    </a>
                  </div>
                  <div className="hero-socials">
                    {profile.socials.map((s) =>
                      s.url ? (
                        <a
                          href={s.url}
                          key={s.name}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {s.name === "GitHub" && <Github size={14} />}
                          {s.name}
                          <ArrowUpRight size={12} />
                        </a>
                      ) : (
                        <span key={s.name}>
                          {s.name}
                          <span className="social-pending"> / add link</span>
                        </span>
                      ),
                    )}
                  </div>
                </m.div>
                <HeroArt />
              </div>
              <div className="hero-bottom mono">
                <span>
                  <i className="status-dot" />
                  {profile.availability.toUpperCase()}
                </span>
                <a href="#projects">
                  SCROLL TO EXPLORE
                  <ArrowDown size={14} />
                </a>
                <span>CRAFTED WITH CARE & A LITTLE CAFFEINE</span>
              </div>
            </section>
            <div className="ticker" aria-hidden="true">
              <div>
                <span>CURIOUS BY NATURE</span>
                <Asterisk />
                <span>CREATIVE BY CHOICE</span>
                <Asterisk />
                <span>ALWAYS A WORK IN PROGRESS</span>
                <Asterisk />
                <span>CURIOUS BY NATURE</span>
                <Asterisk />
                <span>CREATIVE BY CHOICE</span>
                <Asterisk />
              </div>
            </div>
            <section id="projects" className="projects-section section-pad">
              <div className="container">
                <SectionLabel number="01">
                  SELECTED WORK & GOOD EXPERIMENTS
                </SectionLabel>
                <Reveal className="section-heading">
                  <h2>
                    A few things
                    <br />
                    I’ve <em>imagined.</em>
                  </h2>
                  <div>
                    <p>
                      Ideas made tangible.
                      <br />A collection of illustrative concepts, ready for
                      your real work.
                    </p>
                    <span className="template-note mono">
                      EDITABLE CONCEPT STUDIES / 04
                    </span>
                  </div>
                </Reveal>
                <div
                  className="project-filters"
                  role="group"
                  aria-label="Filter projects by category"
                >
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      aria-pressed={category === c}
                    >
                      {c}
                      {c === "All work" && <span>04</span>}
                    </button>
                  ))}
                </div>
                <div
                  className="project-grid"
                  aria-live="polite"
                  aria-label={`${filtered.length} projects`}
                >
                  <AnimatePresence mode="popLayout">
                    {filtered.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        index={projects.indexOf(project)}
                        onOpen={() => setSelected(project)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
                <div className="work-end mono">
                  <span>GOOD WORK IS ALWAYS A CONVERSATION.</span>
                  <a href="#contact">
                    LET’S START ONE
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            </section>
            <section id="about" className="about-section section-pad">
              <div className="container">
                <SectionLabel number="02">
                  THE HUMAN BEHIND THE PIXELS
                </SectionLabel>
                <div className="about-grid">
                  <Reveal className="about-visual">
                    <span className="about-stamp mono">
                      A LITTLE LEFT BRAIN.
                      <br />A LITTLE RIGHT BRAIN.
                    </span>
                    <div className="about-flower" aria-hidden="true">
                      {Array.from({ length: 8 }, (_, i) => (
                        <i key={i} style={{ "--petal": i } as CSSProperties} />
                      ))}
                      <span>
                        hello
                        <br />
                        there.
                      </span>
                    </div>
                    <span className="about-visual-footer mono">
                      LOGIC + INTUITION → GOOD THINGS
                    </span>
                  </Reveal>
                  <Reveal className="about-copy">
                    <h2>
                      More than
                      <br />a <em>semicolon.</em>
                    </h2>
                    <p className="about-lead">
                      Part problem solver.
                      <br />
                      Part curious human.
                    </p>
                    <p>{profile.about}</p>
                    <div className="about-facts">
                      <div>
                        <span className="mono">THE BACKGROUND</span>
                        <p>{profile.background}</p>
                      </div>
                      <div>
                        <span className="mono">CURRENTLY EXPLORING</span>
                        <p>{profile.focus}</p>
                      </div>
                    </div>
                    <div className="interest-tags">
                      {profile.interests.map((interest) => (
                        <span key={interest}>
                          <Sparkles size={12} />
                          {interest}
                        </span>
                      ))}
                    </div>
                    <span className="content-placeholder mono">
                      YOUR STORY GOES HERE · EDIT PROFILE.TS
                    </span>
                  </Reveal>
                </div>
              </div>
            </section>
            <section id="skills" className="skills-section section-pad">
              <div className="container">
                <SectionLabel number="03">
                  TOOLS FOR TURNING “WHAT IF” INTO “HERE IT IS”
                </SectionLabel>
                <Reveal className="section-heading">
                  <h2>
                    A curious mind.
                    <br />A growing <em>toolkit.</em>
                  </h2>
                  <p>
                    The tools behind the craft.
                    <br />
                    Always learning. Always making room for more.
                    <span className="skills-note">
                      Template skills — edit to match your experience.
                    </span>
                  </p>
                </Reveal>
                <div className="skills-grid">
                  {profile.skills.map((group, i) => {
                    const Icon =
                      icons[group.icon as keyof typeof icons] || Code2;
                    return (
                      <Reveal
                        key={group.title}
                        className={`skill-group skill-group-${i}`}
                        delay={i * 0.06}
                      >
                        <div className="skill-group-top">
                          <Icon size={24} strokeWidth={1.5} />
                          <span className="mono">0{i + 1}</span>
                        </div>
                        <span className="skill-subtitle mono">
                          {group.subtitle}
                        </span>
                        <h3>{group.title}</h3>
                        <div className="skill-tags">
                          {group.items.map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
                <div className="journey">
                  <div className="journey-heading">
                    <span className="eyebrow">04 / THE PATH SO FAR</span>
                    <h3>
                      Every chapter
                      <br />
                      adds something.
                    </h3>
                    <p>
                      A space for your education,
                      <br />
                      experience, and milestones.
                    </p>
                  </div>
                  <div className="timeline">
                    {profile.journey.map((item, i) => (
                      <div key={i} className="timeline-item">
                        <span className="timeline-dot" />
                        <span className="mono">{item.date}</span>
                        <h4>{item.title}</h4>
                        <b>{item.organization}</b>
                        <p>{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
            <ColorLab />
            <Contact />
          </main>
          <footer className="site-footer">
            <div className="container">
              <div className="footer-top">
                <a className="wordmark" href="#">
                  <Asterisk size={26} />
                  <span>
                    form<span className="wordmark-and">&</span>function.
                  </span>
                </a>
                <span>
                  Made of ideas, iterations, and a few happy accidents.
                </span>
                <a className="back-top" href="#">
                  Back to top
                  <ArrowUp size={16} />
                </a>
              </div>
              <div className="footer-bottom mono">
                <span>
                  © {new Date().getFullYear()} {profile.name.toUpperCase()}
                </span>
                <span>PERSONAL PORTFOLIO TEMPLATE · MAKE IT YOURS</span>
                <a href="#lab">
                  STAY CURIOUS
                  <ArrowUpRight size={12} />
                </a>
              </div>
            </div>
          </footer>
          {selected && (
            <ProjectDialog
              key={selected.id}
              project={selected}
              close={() => setSelected(null)}
            />
          )}
        </div>
      </LazyMotion>
    </MotionConfig>
  );
}
