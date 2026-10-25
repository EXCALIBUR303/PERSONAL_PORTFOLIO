"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { eye } from "./camera";
import { SETTINGS, type Tier } from "./quality";
import type { Rig } from "./rig";
import { Bridges } from "./scene/bridges";
import { Distant, Sheet, SUN } from "./scene/ground";
import { StudyDistrict } from "./scene/massing";
import { disposePalette, makePalette } from "./scene/palette";
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
  reduced: boolean;
  paused: boolean;
  onReady: () => void;
  onLost: () => void;
};

/** The haze the far world fades into; the page behind the canvas uses the same colour. */
export const HAZE = "#e7e9e4";

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
    const p = rig.pose;
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

/** Warm key light from the upper left, a cool fill and a rim from behind. */
function Lights({ shadows }: { shadows: false | 1024 | 2048 }) {
  const key = useMemo(() => {
    const light = new THREE.DirectionalLight("#ffead0", 3.3);
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
      <hemisphereLight args={["#eef3f8", "#e4d4bf", 0.44]} />
      <directionalLight position={[35, 20, 22]} intensity={0.28} color="#d9e3ff" />
      <directionalLight position={[8, 26, -46]} intensity={0.72} color="#fff0dc" />
    </>
  );
}

/** Soft reflections for glass, brass and painted metal, generated (nothing is downloaded). */
function Reflections() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    const { gl, scene } = get();
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = pmrem.fromScene(room, 0.04);
    scene.environment = target.texture;
    scene.environmentIntensity = 0.2;
    room.dispose();
    pmrem.dispose();
    return () => {
      scene.environment = null;
      target.dispose();
    };
  }, [get]);
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

/** Redraws once when what the world shows changes (a hover, a filter, the pause ending). */
function Redraw({ keys }: { keys: unknown[] }) {
  const invalidate = useThree((s) => s.invalidate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => invalidate(), [invalidate, ...keys]);
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
  useEffect(() => {
    const w = window as unknown as { __world?: object };
    w.__world = {
      tier,
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
  }, [gl, tier]);
  return null;
}

export default function WorldCanvas({ rig, tier, hot, selected, matching, reduced, paused, onReady, onLost }: WorldCanvasProps) {
  const settings = SETTINGS[tier];
  const palette = useMemo(() => makePalette(), []);
  useEffect(() => () => disposePalette(palette), [palette]);
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
        gl.toneMappingExposure = 1.0;
      }}
      aria-hidden="true"
      tabIndex={-1}
    >
      <fog attach="fog" args={[HAZE, 60, 180]} />
      <CameraMirror rig={rig} />
      <Lights shadows={settings.shadows} />
      {settings.reflections && <Reflections />}
      <Sheet />
      <Distant palette={palette} />
      <Studio palette={palette} active={hot === "studio" || selected === "studio"} reduced={reduced} />
      <Bridges palette={palette} />
      <Systems palette={palette} hot={hot} selected={selected} matching={matching} reduced={reduced} />
      <StudyDistrict id="algorithms" palette={palette} hot={hot} selected={selected} reduced={reduced} />
      <StudyDistrict id="intelligence" palette={palette} hot={hot} selected={selected} reduced={reduced} />
      <Redraw keys={[hot, selected, matching, paused]} />
      <ContextWatch onLost={onLost} />
      <Warmup onReady={ready} />
      <FirstFrame ready={warm} />
      <Probe tier={tier} />
    </Canvas>
  );
}
