"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  m,
  useMotionValue,
  useScroll,
  useSpring,
} from "motion/react";
import {
  ArrowUp,
  ArrowUpRight,
  Asterisk,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { profile } from "@/data/profile";
import { motionTokens } from "./motion-config";
const loadFeatures = () =>
  import("./motion-features").then((module) => module.default);
const navigation = [
  { id: "projects", name: "Worlds" },
  { id: "skills", name: "Toolkit" },
  { id: "engine", name: "Engine" },
  { id: "about", name: "About" },
  { id: "contact", name: "Contact" },
];
type GalleryState = { query: string; category: string; featuredOnly: boolean };
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
function Cursor() {
  const x = useMotionValue(-100),
    y = useMotionValue(-100),
    sx = useSpring(x, { stiffness: 180, damping: 30 }),
    sy = useSpring(y, { stiffness: 180, damping: 30 });
  useEffect(() => {
    if (
      !matchMedia("(pointer:fine) and (prefers-reduced-motion:no-preference)")
        .matches
    )
      return;
    const move = (event: PointerEvent) => {
      x.set(event.clientX - 13);
      y.set(event.clientY - 13);
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
export default function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [light, setLight] = useState(false),
    [menu, setMenu] = useState(false),
    [active, setActive] = useState("");
  const [gallery, setGallery] = useState<GalleryState>({
    query: "",
    category: "All worlds",
    featuredOnly: false,
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
    navigation.forEach((link) => {
      const element = document.getElementById(link.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [pathname]);
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
            className="portfolio-root multiverse"
            data-theme={light ? "light" : "dark"}
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
                  <button
                    className="theme-button icon-button"
                    onClick={() => setLight(!light)}
                    aria-label={`Switch to ${light ? "dark" : "light"} theme`}
                  >
                    {light ? <Moon size={18} /> : <Sun size={18} />}
                  </button>
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
            <div className="route-content" key={pathname}>
              {children}
            </div>
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
                  <span>DEVFOLIO V2 / THE PROJECT MULTIVERSE</span>
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
          </div>
        </LazyMotion>
      </MotionConfig>
    </AppContext.Provider>
  );
}
