/**
 * How much the studio world draws. The tier is a first guess from the device;
 * the canvas lowers it once it can see the real renderer (a software renderer
 * is always "low"). `?world=low|medium|high|2d` overrides it for testing, and
 * "2d" shows the illustrated SVG map instead of the 3D world.
 */
export type Tier = "high" | "medium" | "low";

export type Settings = {
  /** Device pixel ratio range for the canvas. */
  dpr: [number, number];
  /** Shadow map size, or false for baked contact shadows only. */
  shadows: false | 1024 | 2048;
  antialias: boolean;
  /** Soft studio reflections from a generated environment. */
  reflections: boolean;
  /** Small props: trees, lamps, parked cars. */
  detail: boolean;
};

export const SETTINGS: Record<Tier, Settings> = {
  high: { dpr: [1, 2], shadows: 2048, antialias: true, reflections: true, detail: true },
  medium: { dpr: [1, 1.5], shadows: 1024, antialias: true, reflections: true, detail: true },
  low: { dpr: [1, 1], shadows: false, antialias: true, reflections: false, detail: false },
};

export type Override = Tier | "2d" | null;

export function readOverride(): Override {
  try {
    const value = new URLSearchParams(window.location.search).get("world");
    if (value === "low" || value === "medium" || value === "high" || value === "2d") return value;
  } catch {
    // No override.
  }
  return null;
}

/** A guess before any WebGL context exists. */
export function guessTier(): Tier {
  const override = readOverride();
  if (override && override !== "2d") return override;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 8;
  const small = Math.min(screen.width, screen.height) < 600;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (nav.connection?.saveData || cores <= 2 || memory <= 2) return "low";
  if ((coarse && small) || cores <= 4 || memory <= 4) return "medium";
  return "high";
}

/** The renderer's own name, when the browser shares it. */
export function rendererName(gl: WebGLRenderingContext | WebGL2RenderingContext): string {
  try {
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    return String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  } catch {
    return "";
  }
}

/** A software renderer draws on the CPU: keep it to the cheapest tier. */
export const isSoftware = (name: string) => /swiftshader|llvmpipe|software|basic render/i.test(name);
