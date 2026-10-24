"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  Component,
  useEffect,
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import * as THREE from "three";
import type { SiteMode } from "@/components/mode";
import { subscribeTransition, transition } from "@/lib/transition/state";

/**
 * A point the camera can follow. A scene writes the live position into
 * `current` (or null to stop); the rig drifts the orbit target after it and
 * carries the camera along, so the visitor can still drag around it.
 */
export type FollowTarget = { current: THREE.Vector3 | null };

export type Framing = Record<
  SiteMode,
  { position: [number, number, number]; target: [number, number, number] }
>;

type Controls = { target: THREE.Vector3; update: () => void };

/**
 * Moves the camera to the framing for the current mode (or back to it after a
 * reset). It eases over about 0.7 s and then hands control back to the orbit
 * controls, so a visitor who drags is never fought.
 */
function CameraRig({
  framing,
  mode,
  resetKey,
  follow,
}: {
  framing: Framing;
  mode: SiteMode;
  resetKey: number;
  follow?: FollowTarget;
}) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as Controls | null;
  const invalidate = useThree((s) => s.invalidate);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const goal = useRef<{ p: THREE.Vector3; t: THREE.Vector3 } | null>(null);
  const first = useRef(true);

  useEffect(() => {
    const { position, target } = framing[mode];
    const t = new THREE.Vector3(...target);
    // Framings are composed for a 16:10 stage; narrower stages pull back.
    const fit = Math.pow(Math.min(1.8, Math.max(1, 1.6 / aspect)), 0.85);
    const p = new THREE.Vector3(...position).sub(t).multiplyScalar(fit).add(t);
    if (first.current) {
      first.current = false;
      camera.position.copy(p);
      controls?.target.copy(t);
      controls?.update();
      camera.lookAt(t);
      invalidate();
      return;
    }
    goal.current = { p, t };
    invalidate();
  }, [mode, resetKey, framing, camera, controls, invalidate, aspect]);

  const lead = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    const g = goal.current;
    const f = follow?.current;
    if (f && controls && !g) {
      // Carry target and camera by the same step so the view direction holds.
      lead.current.copy(f).sub(controls.target).multiplyScalar(1 - Math.exp(-delta * 3));
      controls.target.add(lead.current);
      camera.position.add(lead.current);
      controls.update();
      invalidate();
    }
    if (!g) return;
    const k = 1 - Math.exp(-delta * 7);
    camera.position.lerp(g.p, k);
    if (controls) {
      controls.target.lerp(g.t, k);
      controls.update();
    } else camera.lookAt(g.t);
    if (camera.position.distanceTo(g.p) < 0.01) goal.current = null;
    invalidate();
  });
  return null;
}

/** True while a mode transition is running. */
function useTransitionRunning() {
  return useSyncExternalStore(
    subscribeTransition,
    () => transition.running,
    () => false,
  );
}

/**
 * Compiles the scene's shaders without blocking, then tells the stage it can
 * start rendering. A new WebGL canvas that compiles on its first frame holds
 * the browser up for about a second, which showed during a mode transition as
 * a stalled run. The canvas mounts at once with its loop off; this waits for
 * the programs to be ready (the browser links them in parallel), so the first
 * frame is cheap. If compiling is not available, fails, or never reports back
 * (a lost context, an odd driver), the stage renders anyway after a few
 * seconds, as it always did, so a scene can never stay blank.
 */
const WARMUP_LIMIT_MS = 4000;
function Warmup({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let live = true;
    const done = () => live && onReady();
    const backstop = window.setTimeout(done, WARMUP_LIMIT_MS);
    if (typeof gl.compileAsync === "function") gl.compileAsync(scene, camera).then(done, done);
    else done();
    return () => {
      live = false;
      window.clearTimeout(backstop);
    };
  }, [gl, scene, camera, onReady]);
  return null;
}

/** Draws the first frame once the loop is on, since an on-demand loop would wait for a change. */
function FirstFrame({ ready }: { ready: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!ready) return;
    const id = requestAnimationFrame(() => invalidate());
    return () => cancelAnimationFrame(id);
  }, [ready, invalidate]);
  return null;
}

class Boundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * One React Three Fiber canvas with the shared camera rig, lighting and orbit
 * controls. It renders continuously only while it is on screen and not
 * paused; otherwise it renders on demand, so an idle hero costs nothing.
 */
export default function Stage3D({
  children,
  framing,
  mode,
  paused,
  resetKey,
  label,
  fallback,
  distance = [6, 30],
  autoRotate = false,
  overlay,
  busy = false,
  follow,
}: {
  children: ReactNode;
  framing: Framing;
  mode: SiteMode;
  paused: boolean;
  resetKey: number;
  label: string;
  fallback: ReactNode;
  distance?: [number, number];
  autoRotate?: boolean;
  overlay?: ReactNode;
  /** A visitor-started action that must keep rendering even while paused. */
  busy?: boolean;
  /** Optional moving point for the camera to follow (see FollowTarget). */
  follow?: FollowTarget;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const live = visible && (!paused || busy);
  // The canvas mounts at once, with its loop off, and starts once its shaders
  // are compiled: a mode switch no longer waits on, or stalls for, a new scene.
  const [warm, setWarm] = useState(false);
  const onWarm = useCallback(() => setWarm(true), []);
  const running = useTransitionRunning();
  const go = warm;
  return (
    <div ref={box} className="s3-stage" data-warm={go} role="img" aria-label={label}>
      <Boundary fallback={fallback}>
        <Canvas
          frameloop={!go ? "never" : live ? "always" : "demand"}
          dpr={[1, 1.75]}
          shadows
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
          camera={{ fov: 38, near: 0.1, far: 120, position: [10, 10, 10] }}
        >
          <hemisphereLight args={["#ffffff", "#c9c3b4", 1.1]} />
          <directionalLight
            position={[6, 12, 5]}
            intensity={1.6}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-12}
            shadow-camera-right={12}
            shadow-camera-top={12}
            shadow-camera-bottom={-12}
          />
          <OrbitControls
            makeDefault
            enablePan={false}
            enableDamping
            minDistance={distance[0]}
            maxDistance={distance[1]}
            maxPolarAngle={Math.PI * 0.47}
            autoRotate={autoRotate && visible && !paused}
            autoRotateSpeed={0.5}
          />
          <CameraRig framing={framing} mode={mode} resetKey={resetKey} follow={follow} />
          {children}
          <Warmup onReady={onWarm} />
          <FirstFrame ready={go} />
        </Canvas>
        {overlay}
        {!warm && !running && <div className="s3-wait mono">Preparing the 3D view…</div>}
      </Boundary>
    </div>
  );
}
