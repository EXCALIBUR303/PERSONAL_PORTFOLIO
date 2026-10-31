"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Briefcase, Sparkles, X } from "lucide-react";
import {
  prewarmPortal,
  shiftHeading,
  stayInMode,
  worldShift,
} from "@/lib/world-shift";

export type SiteMode = "pro" | "creative";
export const MODE_KEY = "portfolio-mode";
/** Set the first time the Creative hint is shown, so it never appears twice. */
export const HINT_KEY = "portfolio-creative-hint";
const HINT_TEXT =
  "Discover Creative Mode — explore my projects in an interactive 3D studio.";
const HINT_MS = 8000;

/**
 * Runs in <head> before first paint so the stored mode is already on <html>
 * when the page renders. This avoids both a hydration mismatch (React never
 * renders the stored value) and a flash of the wrong mode.
 */
export const modeBootScript = `try{var m=localStorage.getItem("${MODE_KEY}");document.documentElement.dataset.mode=m==="creative"?"creative":"pro"}catch(e){document.documentElement.dataset.mode="pro"}`;

const listeners = new Set<() => void>();
const read = (): SiteMode =>
  document.documentElement.dataset.mode === "creative" ? "creative" : "pro";
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export function useMode(): [
  SiteMode,
  (mode: SiteMode, origin?: { x: number; y: number }) => void,
] {
  const mode = useSyncExternalStore<SiteMode>(subscribe, read, () => "pro");
  const setMode = useCallback(
    (next: SiteMode, origin?: { x: number; y: number }) => {
      const root = document.documentElement;
      // Compare with where a running shift is heading, not only with the mode on the page (it changes partway in).
      if (shiftHeading() === next) return;
      if (root.dataset.mode === next && stayInMode()) return;
      const apply = () => {
        root.dataset.mode = next;
        try {
          localStorage.setItem(MODE_KEY, next);
        } catch {
          /* storage can be blocked; the mode still applies for this visit */
        }
        listeners.forEach((cb) => cb());
        const announcer = document.getElementById("mode-announcer");
        if (announcer)
          announcer.textContent =
            next === "creative" ? "Creative mode" : "Professional mode";
      };
      worldShift(next, apply, origin);
    },
    [],
  );
  return [mode, setMode];
}

/**
 * A one-time pointer to Creative Mode for a visitor who has never switched modes. "Never switched" is read from the
 * storage that already exists: a stored mode means the visitor has used the switch (or an older visit did), so no
 * second key is needed for that. One key records that the hint was shown, so it appears once per browser.
 */
function CreativeHint() {
  const [open, setOpen] = useState(false);
  const paused = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (read() !== "pro") return;
    const t = window.setTimeout(() => {
      try {
        if (
          read() !== "pro" ||
          localStorage.getItem(MODE_KEY) !== null ||
          localStorage.getItem(HINT_KEY) !== null
        )
          return;
        localStorage.setItem(HINT_KEY, "1");
      } catch {
        return; // without storage it could not be limited to once
      }
      setOpen(true);
      const announcer = document.getElementById("mode-announcer");
      if (announcer) announcer.textContent = HINT_TEXT;
    }, 1400);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!open) return;
    // The Creative option is described by the tip for as long as the tip is there.
    const creative = document.querySelector('[data-mode-option="creative"]');
    creative?.setAttribute("aria-describedby", "mode-hint");
    let left = HINT_MS;
    const tick = window.setInterval(() => {
      if (paused.current) return;
      left -= 250;
      if (left <= 0) setOpen(false);
    }, 250);
    const away = (event: Event) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" || (event.altKey && event.code === "KeyM"))
        setOpen(false);
    };
    document.addEventListener("pointerdown", away, true);
    document.addEventListener("keydown", key);
    // Whatever changes the mode (a click, the keyboard, a restored session) ends the tip.
    const unsubscribe = subscribe(() => {
      if (read() !== "pro") setOpen(false);
    });
    return () => {
      unsubscribe();
      creative?.removeAttribute("aria-describedby");
      window.clearInterval(tick);
      document.removeEventListener("pointerdown", away, true);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  if (!open) return null;
  return (
    <div
      ref={box}
      id="mode-hint"
      className="mode-hint"
      role="group"
      aria-label="Tip"
      onPointerEnter={() => (paused.current = true)}
      onPointerLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
    >
      <p>{HINT_TEXT}</p>
      <button
        type="button"
        className="mode-hint-close"
        aria-label="Dismiss tip"
        onClick={() => setOpen(false)}
      >
        <X size={13} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Segmented control. Its visual state is driven by CSS from the attribute on
 * <html> (set before paint), and aria-pressed follows after hydration, so the
 * control never shows the wrong mode while the page loads.
 */
export default function ModeSwitcher() {
  const [mode, setMode] = useMode();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable]")) return;
      if (event.altKey && event.code === "KeyM") {
        // Toggles from where a running shift is heading, so a second press turns it back.
        const next = (shiftHeading() ?? read()) === "pro" ? "creative" : "pro";
        const button = document.querySelector<HTMLElement>(
          `[data-mode-option="${next}"]`,
        );
        const box = button?.getBoundingClientRect();
        setMode(
          next,
          box && { x: box.left + box.width / 2, y: box.top + box.height / 2 },
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setMode]);
  const options: {
    id: SiteMode;
    label: string;
    short: string;
    Icon: typeof Briefcase;
  }[] = [
    { id: "pro", label: "Professional", short: "Pro", Icon: Briefcase },
    { id: "creative", label: "Creative", short: "Creative", Icon: Sparkles },
  ];
  return (
    <div className="mode-switch-wrap">
      <div
        className="mode-switcher"
        role="group"
        aria-label="Site mode (Alt+M toggles)"
        onPointerEnter={prewarmPortal}
        onFocus={prewarmPortal}
      >
        {options.map(({ id, label, short, Icon }) => (
          <button
            key={id}
            type="button"
            className="mode-option"
            data-mode-option={id}
            aria-pressed={mode === id}
            onClick={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              setMode(id, {
                x: box.left + box.width / 2,
                y: box.top + box.height / 2,
              });
            }}
          >
            <Icon size={14} aria-hidden="true" />
            <span className="mode-label">{label}</span>
            <span className="mode-short" aria-hidden="true">
              {short}
            </span>
          </button>
        ))}
      </div>
      <CreativeHint />
    </div>
  );
}
