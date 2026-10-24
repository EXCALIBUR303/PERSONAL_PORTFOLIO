"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  m,
  useScroll,
  useSpring,
} from "motion/react";
import { ArrowUp, ArrowUpRight, Asterisk, Menu, X } from "lucide-react";
import { profile } from "@/data/profile";
import { motionTokens } from "./motion-config";
import ModeSwitcher, { useMode } from "./mode";
import { CreativeFooter, CreativeHeader } from "./creative/creative-chrome";
const loadFeatures = () =>
  import("./motion-features").then((module) => module.default);
const navigation = [
  { id: "projects", name: "Worlds" },
  { id: "skills", name: "Toolkit" },
  { id: "about", name: "About" },
  { id: "contact", name: "Contact" },
];
const creativeNavigation = [
  { id: "map", name: "Map" },
  { id: "projects", name: "Board" },
  { id: "skills", name: "Loadout" },
  { id: "about", name: "About" },
  { id: "contact", name: "Contact" },
];
type GalleryState = {
  query: string;
  category: string;
  featuredOnly: boolean;
  collection: "All" | "College" | "Personal";
  discipline: "All" | "Software" | "Hardware";
  layout: "exhibits" | "index";
  selectedSlug: string | null;
};
type AppState = {
  gallery: GalleryState;
  setGallery: (value: GalleryState) => void;
  beginPortal: (accent: string) => void;
};
const AppContext = createContext<AppState | null>(null);
export function usePortfolioState() {
  const value = useContext(AppContext);
  if (!value) throw new Error("Portfolio state requires AppFrame");
  return value;
}
/**
 * Creative-mode cursor. The dot is written straight from the pointer event, so
 * it can never trail the mouse. Only the ring eases, and it settles in ~80 ms.
 */
const finePointerQuery =
  "(pointer:fine) and (prefers-reduced-motion:no-preference)";
function useFinePointer() {
  return useSyncExternalStore(
    (notify) => {
      const query = matchMedia(finePointerQuery);
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => matchMedia(finePointerQuery).matches,
    () => false,
  );
}
function Cursor() {
  const [mode] = useMode();
  const finePointer = useFinePointer();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [grow, setGrow] = useState(false);
  const active = mode === "creative" && finePointer;
  useEffect(() => {
    if (!active) return;
    document.documentElement.classList.add("has-cursor");
    let raf = 0;
    let x = -100,
      y = -100,
      rx = -100,
      ry = -100,
      seen = false;
    const tick = () => {
      rx += (x - rx) * 0.35;
      ry += (y - ry) * 0.35;
      if (ring.current)
        ring.current.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      if (!seen) {
        seen = true;
        rx = x;
        ry = y;
        dot.current?.removeAttribute("hidden");
        ring.current?.removeAttribute("hidden");
      }
      if (dot.current)
        dot.current.style.transform = `translate3d(${x}px,${y}px,0)`;
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-cursor], a, button, summary, select, input, textarea, label",
      );
      setGrow(Boolean(target));
      setLabel(target?.dataset.cursor ?? "");
    };
    const leave = () => {
      dot.current?.setAttribute("hidden", "");
      ring.current?.setAttribute("hidden", "");
      seen = false;
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, [active]);
  if (!active) return null;
  return (
    <>
      <div ref={ring} className="cursor-ring" hidden aria-hidden="true">
        <span className={grow ? "is-grown" : undefined}>{label}</span>
      </div>
      <div ref={dot} className="cursor-dot" hidden aria-hidden="true" />
    </>
  );
}
export default function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mode] = useMode();
  const creative = mode === "creative";
  const [menu, setMenu] = useState(false),
    [active, setActive] = useState("");
  const [gallery, setGallery] = useState<GalleryState>({
    query: "",
    category: "All worlds",
    featuredOnly: false,
    collection: "All",
    discipline: "All",
    layout: "exhibits",
    selectedSlug: null,
  });
  const [portal, setPortal] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    button = useRef<HTMLButtonElement>(null),
    lastPath = useRef(pathname);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  function beginPortal(accent: string) {
    setPortal(accent);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPortal(null), 550);
  }
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    // Lets CSS hold back first paint of Creative until React has swapped in its own tree.
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document.documentElement.dataset.ready = "1";
      }),
    );
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      const frame = requestAnimationFrame(() =>
        document
          .querySelector<HTMLHeadingElement>("h1")
          ?.focus({ preventScroll: true }),
      );
      return () => cancelAnimationFrame(frame);
    }
  }, [pathname]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        }),
      { rootMargin: "-20% 0px -55% 0px" },
    );
    (creative ? creativeNavigation : navigation).forEach((link) => {
      const element = document.getElementById(link.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
    // Re-attach when the mode swaps the sections for their other presentation.
  }, [pathname, creative]);
  useEffect(() => {
    if (!menu) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        button.current?.focus();
      }
    };
    const wide = matchMedia("(min-width:761px)");
    const resize = () => {
      if (wide.matches) setMenu(false);
    };
    window.addEventListener("keydown", key);
    wide.addEventListener("change", resize);
    return () => {
      window.removeEventListener("keydown", key);
      wide.removeEventListener("change", resize);
    };
  }, [menu]);
  return (
    <AppContext.Provider value={{ gallery, setGallery, beginPortal }}>
      <MotionConfig
        reducedMotion="user"
        transition={{
          duration: motionTokens.duration.normal,
          ease: motionTokens.ease,
        }}
      >
        <LazyMotion features={loadFeatures}>
          <div
            className="portfolio-root multiverse engineering-universe"
            data-theme="light"
          >
            <a className="skip-link" href="#main">
              Skip to content
            </a>
            <Cursor />
            <m.div
              className="scroll-progress"
              style={{ scaleX }}
              aria-hidden="true"
            />
            {portal && (
              <div
                className="route-portal"
                style={{
                  background: `radial-gradient(ellipse at 70% 35%, ${portal}45, transparent 65%)`,
                }}
                aria-hidden="true"
              />
            )}
            {creative ? (
              <CreativeHeader
                navigation={creativeNavigation}
                pathname={pathname}
                active={active}
                menu={menu}
                setMenu={setMenu}
                buttonRef={button}
              />
            ) : (
              <header className="site-header">
                <div className="container nav-container">
                  <Link
                    href="/"
                    className="wordmark"
                    aria-label="form&function. — Home"
                  >
                    <Asterisk size={29} />
                    <span>
                      form<span className="wordmark-and">&</span>function
                      <span className="wordmark-dot">.</span>
                    </span>
                  </Link>
                  <nav className="desktop-nav" aria-label="Main navigation">
                    {navigation.map((link) => (
                      <Link
                        key={link.id}
                        href={`/#${link.id}`}
                        aria-current={
                          pathname.startsWith("/projects/")
                            ? link.id === "projects"
                              ? "page"
                              : undefined
                            : active === link.id
                              ? "location"
                              : undefined
                        }
                      >
                        {link.name}
                        <i />
                      </Link>
                    ))}
                  </nav>
                  <div className="nav-actions">
                    <ModeSwitcher />
                    <Link href="/#contact" className="nav-contact">
                      Let’s talk
                      <ArrowUpRight size={16} />
                    </Link>
                    <button
                      ref={button}
                      className="mobile-menu-toggle icon-button"
                      aria-expanded={menu}
                      aria-controls="mobile-navigation"
                      aria-label={
                        menu ? "Close navigation menu" : "Open navigation menu"
                      }
                      onClick={() => setMenu(!menu)}
                    >
                      {menu ? <X /> : <Menu />}
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {menu && (
                    <m.nav
                      id="mobile-navigation"
                      className="mobile-nav"
                      aria-label="Mobile navigation"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      {navigation.map((link, i) => (
                        <Link
                          key={link.id}
                          href={`/#${link.id}`}
                          onClick={() => setMenu(false)}
                        >
                          <span className="mono">0{i + 1}</span>
                          {link.name}
                          <ArrowUpRight size={21} />
                        </Link>
                      ))}
                    </m.nav>
                  )}
                </AnimatePresence>
              </header>
            )}
            <div className="route-content" key={pathname}>
              {children}
            </div>
            {creative ? (
              <CreativeFooter />
            ) : (
              <footer className="site-footer">
                <div className="container">
                  <div className="footer-top">
                    <Link href="/" className="wordmark">
                      <Asterisk size={26} />
                      <span>
                        form<span className="wordmark-and">&</span>function.
                      </span>
                    </Link>
                    <span>
                      Different questions. Connected worlds. Always curious.
                    </span>
                    <a className="back-top" href="#main">
                      Back to top
                      <ArrowUp size={16} />
                    </a>
                  </div>
                  <div className="footer-bottom mono">
                    <span>
                      © {new Date().getFullYear()} {profile.name.toUpperCase()}
                    </span>
                    <span>DEVFOLIO V3 / THE ENGINEERING UNIVERSE</span>
                    <a
                      href="https://github.com/EXCALIBUR303"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GITHUB
                      <ArrowUpRight size={12} />
                    </a>
                  </div>
                </div>
              </footer>
            )}
          </div>
        </LazyMotion>
      </MotionConfig>
    </AppContext.Provider>
  );
}
