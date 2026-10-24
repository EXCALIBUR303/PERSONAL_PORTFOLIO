"use client";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { Briefcase, Sparkles } from "lucide-react";
import { worldShift } from "@/lib/world-shift";

export type SiteMode = "pro" | "creative";
export const MODE_KEY = "portfolio-mode";

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
      if (root.dataset.mode === next) return;
      const apply = () => {
        root.dataset.mode = next;
        try {
          localStorage.setItem(MODE_KEY, next);
        } catch {
          /* storage can be blocked; the mode still applies for this visit */
        }
        listeners.forEach((cb) => cb());
      };
      worldShift(next, apply, origin);
    },
    [],
  );
  return [mode, setMode];
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
        const next = read() === "pro" ? "creative" : "pro";
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
  const options: { id: SiteMode; label: string; Icon: typeof Briefcase }[] = [
    { id: "pro", label: "Professional", Icon: Briefcase },
    { id: "creative", label: "Creative", Icon: Sparkles },
  ];
  return (
    <div
      className="mode-switcher"
      role="group"
      aria-label="Site mode (Alt+M toggles)"
    >
      {options.map(({ id, label, Icon }) => (
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
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
