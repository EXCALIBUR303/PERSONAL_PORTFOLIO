"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { eye } from "./camera";
import { SETTINGS, type Tier } from "./quality";
import type { Rig } from "./rig";
import { Bridges } from "./scene/bridges";
import { CHART, Grounding, Sheet, SUN } from "./scene/ground";
import { StudyDistrict } from "./scene/massing";
import { markShadows, takeShadows } from "./scene/motion";
import { disposePalette, makePalette, type Palette } from "./scene/palette";
import { Studio } from "./scene/studio";
import { Systems } from "./scene/systems";

/*
 * The studio world's WebGL layer: architecture, light and atmosphere only.
 * Every control, label and description is HTML laid over it (world-stage.tsx).
 * It draws on demand: a frame is rendered when the camera rig moves, when a
 * landmark reacts, or when something changes, and never while the world is
 * hidden behind an open exhibit.
 */
export type WorldCanvasProps = {
  rig: Rig;
  tier: Tier;
  hot: string | null;
  selected: string | null;
  matching: Set<string>;
  visited: string[];
  reduced: boolean;
  paused: boolean;
  onReady: () => void;
  onLost: () => void;
};

/** The haze the far world fades into; the page behind the canvas uses the same colour. */
export const HAZE = CHART.edge;

/** Copies the rig's pose into the camera every frame; the rig is the camera's only owner. */
function CameraMirror({ rig }: { rig: Rig }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const driver = { request: () => invalidate() };
    rig.attach(driver);
    return () => rig.detach(driver);
  }, [rig, invalidate]);
  useFrame((state) => {
    const moving = rig.step(performance.now());
    const p = rig.shown;
    const camera = state.camera as THREE.PerspectiveCamera;
    const [x, y, z] = eye(p);
    camera.position.set(x, y, z);
    camera.lookAt(p.target[0], p.target[1], p.target[2]);
    if (camera.fov !== p.fov) {
      camera.fov = p.fov;
      camera.updateProjectionMatrix();
    }
    // Fog follows the camera distance, so the far world fades the same way at every zoom.
    const fog = state.scene.fog as THREE.Fog | null;
    if (fog) {
      fog.near = p.dist * 1.25;
      fog.far = p.dist * 3.4 + 30;
    }
    if (moving) state.invalidate();
  }, -1);
  return null;
}

/** Late-afternoon key light from the upper left (40 degrees up), a cool fill from the right and a rim from behind. */
function Lights({ shadows }: { shadows: false | 1024 | 2048 }) {
  const key = useMemo(() => {
    const light = new THREE.DirectionalLight("#ffdcb2", 3.6);
    light.position.copy(SUN).multiplyScalar(70);
    light.castShadow = !!shadows;
    if (shadows) {
      light.shadow.mapSize.set(shadows, shadows);
      const c = light.shadow.camera;
      c.left = -24;
      c.right = 24;
      c.top = 24;
      c.bottom = -24;
      c.near = 40;
      c.far = 105;
      light.shadow.bias = -0.0004;
      light.shadow.normalBias = 0.02;
      light.shadow.radius = 3;
      light.shadow.intensity = 1;
    }
    return light;
  }, [shadows]);
  useEffect(() => () => key.dispose(), [key]);
  return (
    <>
      <primitive object={key} />
      <hemisphereLight args={["#d6e4f4", "#c7b399", 0.34]} />
      <directionalLight position={[35, 20, 22]} intensity={0.42} color="#bdd2f0" />
      <directionalLight position={[8, 26, -46]} intensity={0.6} color="#fff0dc" />
    </>
  );
}

/**
 * Soft reflections for glass, brass and painted metal, generated (nothing is downloaded). The scene's
 * environment lights everything faintly; glass and metal take the same map directly, which lets each
 * choose its own strength, so they shine while plaster and card stay matte.
 */
function Reflections({ palette }: { palette: Palette }) {
  const get = useThree((s) => s.get);
  useEffect(() => {
    const { gl, scene } = get();
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.24;
    const shiny = [palette.glass, palette.glassDark, palette.glassClear, palette.steel, palette.brass, palette.roof];
    for (const m of shiny) {
      m.envMap = target.texture;
      m.needsUpdate = true;
    }
    room.dispose();
    pmrem.dispose();
    return () => {
      for (const m of shiny) m.envMap = null;
      scene.environment = null;
      target.dispose();
    };
  }, [get, palette]);
  return null;
}

/**
 * Compiles the shaders without blocking before the first frame (as the
 * exhibit scenes do), then starts the loop. A driver that never reports back
 * still starts after a few seconds, so the world cannot stay blank.
 */
function Warmup({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let live = true;
    const done = () => live && onReady();
    const backstop = window.setTimeout(done, 4000);
    if (typeof gl.compileAsync === "function") gl.compileAsync(scene, camera).then(done, done);
    else done();
    return () => {
      live = false;
      window.clearTimeout(backstop);
    };
  }, [gl, scene, camera, onReady]);
  return null;
}

function FirstFrame({ ready }: { ready: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!ready) return;
    const id = requestAnimationFrame(() => invalidate());
    return () => cancelAnimationFrame(id);
  }, [ready, invalidate]);
  return null;
}

/** Redraws once when what the world shows changes (a hover, a filter, a build step, the pause ending). */
function Redraw({ keys }: { keys: unknown[] }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    markShadows();
    invalidate();
    // The keys are the things that change what is drawn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidate, ...keys]);
  return null;
}

/** Shadows are redrawn at most about 30 times a second: a moving car's shadow does not need more. */
const SHADOW_INTERVAL = 30;

/**
 * A caster smaller than a few shadow-map texels leaves a speck nobody can see, but costs a draw call
 * in the shadow pass all the same. Meshes are checked once, as they appear, because landmarks build in steps.
 */
const SHADOW_SPAN = 48;
const MIN_CAST_TEXELS = 5;

function trimCasters(scene: THREE.Scene, size: number, seen: WeakSet<THREE.Object3D>) {
  const floor = (SHADOW_SPAN / size) * MIN_CAST_TEXELS;
  const scale = new THREE.Vector3();
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.castShadow || seen.has(m) || (m as THREE.InstancedMesh).isInstancedMesh) return;
    seen.add(m);
    m.geometry.computeBoundingSphere();
    m.getWorldScale(scale);
    if ((m.geometry.boundingSphere?.radius ?? 0) * Math.max(scale.x, scale.y, scale.z) < floor) m.castShadow = false;
  });
}

/** Draws the shadow map only on frames where something that casts a shadow has moved. */
function ShadowUpdates({ size }: { size: number }) {
  const last = useRef(0);
  const seen = useRef(new WeakSet<THREE.Object3D>());
  useFrame((state) => {
    if (!takeShadows()) return;
    const now = performance.now();
    if (now - last.current < SHADOW_INTERVAL) {
      // Too soon: keep the change pending and draw one more frame, so the last move is never left out.
      markShadows();
      state.invalidate();
      return;
    }
    last.current = now;
    trimCasters(state.scene, size, seen.current);
    state.gl.shadowMap.needsUpdate = true;
  }, -2);
  return null;
}

function ContextWatch({ onLost }: { onLost: () => void }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const el = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onLost();
    };
    el.addEventListener("webglcontextlost", lost);
    return () => el.removeEventListener("webglcontextlost", lost);
  }, [gl, onLost]);
  return null;
}

/** Exposes renderer counters for the performance checks (read by the test scripts). */
function Probe({ tier }: { tier: Tier }) {
  const gl = useThree((s) => s.gl);
  const get = useThree((s) => s.get);
  useEffect(() => {
    const w = window as unknown as { __world?: object };
    w.__world = {
      tier,
      /** One frame without the shadow pass and one with it, to separate the scene's cost from the shadows'. */
      split: () => {
        const { scene, camera } = get();
        const read = () => ({ calls: gl.info.render.calls, triangles: gl.info.render.triangles });
        gl.shadowMap.needsUpdate = false;
        gl.render(scene, camera);
        const scene_ = read();
        gl.shadowMap.needsUpdate = true;
        gl.render(scene, camera);
        const both = read();
        return { scene: scene_, withShadows: both };
      },
      /**
       * Back-to-back frames with the GPU drained after each (a one-pixel read waits for it), so the cost of a frame is measured without the
       * display's refresh rate in the way: milliseconds per frame without and with the shadow pass.
       */
      bench: (frames = 40) => {
        const { scene, camera } = get();
        const ctx = gl.getContext();
        const pixel = new Uint8Array(4);
        const drain = () => ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, pixel);
        const run = (shadows: boolean) => {
          gl.shadowMap.needsUpdate = shadows;
          gl.render(scene, camera);
          drain();
          const times: number[] = [];
          for (let i = 0; i < frames; i++) {
            gl.shadowMap.needsUpdate = shadows;
            const t0 = performance.now();
            gl.render(scene, camera);
            drain();
            times.push(performance.now() - t0);
          }
          times.sort((a, b) => a - b);
          const mean = times.reduce((a, c) => a + c, 0) / times.length;
          return { mean: +mean.toFixed(2), p95: +times[Math.floor(times.length * 0.95)].toFixed(2), max: +times[times.length - 1].toFixed(2) };
        };
        return { scene: run(false), withShadows: run(true), dpr: gl.getPixelRatio() };
      },
      /** Meshes that cast a shadow (or every visible mesh), biggest first, to see where the calls and triangles go. */
      casters: (all = false) => {
        const owner = (o: THREE.Object3D) => {
          for (let n: THREE.Object3D | null = o; n; n = n.parent) if (n.name) return n.name;
          return "";
        };
        const out: { of: string; x: number; y: number; z: number; tris: number; inst: number; r: number }[] = [];
        get().scene.traverse((o) => {
          const m = o as THREE.Mesh;
          if (!m.isMesh || (!all && !m.castShadow) || !m.visible) return;
          const g = m.geometry;
          const inst = (m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1;
          g.computeBoundingSphere();
          const tris = (g.index ? g.index.count : g.attributes.position.count) / 3;
          const p = m.getWorldPosition(new THREE.Vector3());
          out.push({ of: owner(m), x: +p.x.toFixed(1), y: +p.y.toFixed(1), z: +p.z.toFixed(1), tris: Math.round(tris * inst), inst, r: +(g.boundingSphere?.radius ?? 0).toFixed(2) });
        });
        return out.sort((a, b) => b.tris - a.tris);
      },
      info: () => ({
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        programs: gl.info.programs?.length ?? 0,
        dpr: gl.getPixelRatio(),
      }),
    };
    return () => {
      delete w.__world;
    };
  }, [gl, get, tier]);
  return null;
}

/** Steps of the build: the world is assembled over several idle moments, not in one long task. */
const BUILD_STEPS = 4;
function useBuildSteps() {
  const [built, setBuilt] = useState(1);
  useEffect(() => {
    if (built >= BUILD_STEPS) return;
    const idle = typeof window.requestIdleCallback === "function";
    const next = () => setBuilt((b) => b + 1);
    const id = idle ? window.requestIdleCallback(next, { timeout: 250 }) : globalThis.setTimeout(next, 30);
    return () => (idle ? window.cancelIdleCallback(id as number) : globalThis.clearTimeout(id));
  }, [built]);
  return built;
}

/**
 * Lowers the pixel ratio if camera moves run slowly on this device, once
 * enough moving frames have been seen to judge. It never raises it again.
 * "Slowly" is relative to the display: the refresh interval is read from the
 * fastest steady gap between frames (16.7 ms at 60 Hz, 8.3 ms at 120 Hz), and
 * the pixel ratio drops when frames average more than 1.55 intervals. On a
 * 60 Hz display that is the old 26 ms limit; on a 120 Hz display it is about
 * 13 ms, so a screen that can show 120 frames a second is not left at 45.
 */
function Adapt({ floor }: { floor: number }) {
  const sample = useRef({ last: 0, gaps: [] as number[] });
  useFrame((state) => {
    const now = performance.now();
    const s = sample.current;
    const gap = now - s.last;
    s.last = now;
    // Only consecutive frames say anything about the frame rate.
    if (gap > 70 || gap < 4) return;
    s.gaps.push(gap);
    if (s.gaps.length < 45) return;
    const sorted = [...s.gaps].sort((a, b) => a - b);
    const mean = s.gaps.reduce((a, c) => a + c, 0) / s.gaps.length;
    s.gaps.length = 0;
    // 144 Hz at the fastest, 60 Hz at the slowest: a display below 60 Hz is judged as if it were 60.
    const refresh = Math.min(16.7, Math.max(6.9, sorted[Math.floor(sorted.length * 0.1)]));
    const dpr = state.viewport.dpr;
    if (mean > refresh * 1.55 && dpr > floor) state.setDpr(Math.max(floor, Math.round(dpr * 0.75 * 100) / 100));
  });
  return null;
}

export default function WorldCanvas({ rig, tier, hot, selected, matching, visited, reduced, paused, onReady, onLost }: WorldCanvasProps) {
  const settings = SETTINGS[tier];
  const palette = useMemo(() => makePalette(), []);
  useEffect(() => () => disposePalette(palette), [palette]);
  const built = useBuildSteps();
  const [warm, setWarm] = useState(false);
  const ready = useCallback(() => {
    setWarm(true);
    onReady();
  }, [onReady]);
  return (
    <Canvas
      className="w-canvas"
      frameloop={warm && !paused ? "demand" : "never"}
      dpr={settings.dpr}
      shadows={settings.shadows ? { enabled: true, type: THREE.PCFShadowMap } : false}
      gl={{ antialias: settings.antialias, alpha: true, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 26, near: 0.5, far: 520, position: [0, 40, 60] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 0.95;
        gl.shadowMap.autoUpdate = false;
        gl.shadowMap.needsUpdate = true;
      }}
      aria-hidden="true"
      tabIndex={-1}
    >
      <fog attach="fog" args={[HAZE, 60, 180]} />
      <CameraMirror rig={rig} />
      <Lights shadows={settings.shadows} />
      {settings.reflections && <Reflections palette={palette} />}
      <Sheet />
      <Grounding />
      <Studio palette={palette} active={hot === "studio" || selected === "studio"} selected={selected === "studio"} reduced={reduced} visited={visited} />
      <Bridges palette={palette} dark={hot === "private-local-ai" || selected === "private-local-ai"} reduced={reduced} />
      {built > 1 && <Systems palette={palette} hot={hot} selected={selected} matching={matching} reduced={reduced} />}
      {built > 2 && <StudyDistrict id="algorithms" palette={palette} hot={hot} selected={selected} matching={matching} reduced={reduced} />}
      {built > 3 && <StudyDistrict id="intelligence" palette={palette} hot={hot} selected={selected} matching={matching} reduced={reduced} />}
      <Redraw keys={[hot, selected, matching, paused, built]} />
      {settings.shadows && <ShadowUpdates size={settings.shadows} />}
      <ContextWatch onLost={onLost} />
      {built >= BUILD_STEPS && <Warmup onReady={ready} />}
      <FirstFrame ready={warm} />
      {warm && <Adapt floor={1} />}
      <Probe tier={tier} />
    </Canvas>
  );
}
