"use client";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cameraOffset, END_Z, portal, REST_Z, setPortalReady, subscribePortal } from "@/lib/world-shift";

/**
 * The 3D half of the portal ride. One world unit is 100 screen pixels at the
 * camera's resting distance, and the field of view is set from the window
 * height, so the ring drawn here sits exactly on the circle the CSS cuts into
 * the page. All motion comes from the shared `portal` state that GSAP tweens;
 * this component only reads it.
 */
const PX = 100;
/** Depths of the tunnel rings behind the portal mouth. */
const DEPTHS = [0, -2.2, -4.4, -6.6, -8.8];

const creative = {
  colors: ["#ff6538", "#c8f13b", "#ff8fc0", "#8edbff", "#17171d"],
  tube: 0.075,
};
const pro = {
  colors: ["#2f4bf5", "#17171d", "#2f4bf5", "#17171d", "#2f4bf5"],
  tube: 0.024,
};

const basic = (color: string) =>
  new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: true, depthWrite: false });

/**
 * Rings fade as the camera reaches them, instead of filling the screen, and
 * all of them fade over the last stretch of the dive so the ride ends softly.
 */
function fadeByDistance(mats: THREE.MeshBasicMaterial[]) {
  const end = THREE.MathUtils.clamp((portal.camZ - END_Z) / 5, 0, 1);
  DEPTHS.forEach((z, i) => {
    const d = portal.camZ - z;
    mats[i].opacity = THREE.MathUtils.clamp((d - 0.3) / 1.4, 0, 1) * end;
  });
}

function Rig() {
  useFrame(({ camera, size }) => {
    const cam = camera as THREE.PerspectiveCamera;
    const fov = THREE.MathUtils.radToDeg(2 * Math.atan(size.height / 2 / PX / REST_Z));
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    const offset = cameraOffset(size.width, size.height);
    cam.position.set(offset.x / PX, -offset.y / PX, portal.camZ);
  });
  return null;
}

/** Playful rings in the Creative palette, slightly tilted, dotted at the mouth. */
function CreativeRings() {
  const torus = useMemo(() => new THREE.TorusGeometry(1, creative.tube, 12, 96), []);
  const dot = useMemo(() => new THREE.SphereGeometry(0.045, 10, 10), []);
  const mats = useMemo(() => creative.colors.map(basic), []);
  const dotMats = useMemo(() => creative.colors.slice(1, 4).map(basic), []);
  useFrame(() => {
    fadeByDistance(mats);
    dotMats.forEach((m) => (m.opacity = mats[0].opacity));
  });
  useEffect(
    () => () => {
      torus.dispose();
      dot.dispose();
      mats.forEach((m) => m.dispose());
      dotMats.forEach((m) => m.dispose());
    },
    [torus, dot, mats, dotMats],
  );
  return (
    <>
      {DEPTHS.map((z, i) => (
        <mesh
          key={z}
          geometry={torus}
          material={mats[i]}
          position={[0, 0, z]}
          rotation={[i ? (i % 2 ? 0.12 : -0.1) : 0, i ? (i % 2 ? -0.08 : 0.1) : 0, i * 0.4]}
          scale={1 + i * 0.04}
        />
      ))}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return <mesh key={i} geometry={dot} material={dotMats[i % 3]} position={[Math.cos(a) * 1.16, Math.sin(a) * 1.16, 0.02]} />;
      })}
    </>
  );
}

/** Technical rings: thin cobalt and ink circles with dial ticks. */
function ProRings() {
  const torus = useMemo(() => new THREE.TorusGeometry(1, pro.tube, 8, 128), []);
  const tick = useMemo(() => new THREE.BoxGeometry(0.012, 0.09, 0.012), []);
  const mats = useMemo(() => pro.colors.map(basic), []);
  useFrame(() => fadeByDistance(mats));
  useEffect(
    () => () => {
      torus.dispose();
      tick.dispose();
      mats.forEach((m) => m.dispose());
    },
    [torus, tick, mats],
  );
  return (
    <>
      {DEPTHS.map((z, i) => (
        <group key={z} position={[0, 0, z]}>
          <mesh geometry={torus} material={mats[i]} />
          {i < 3 &&
            Array.from({ length: 36 }, (_, k) => {
              const a = (k / 36) * Math.PI * 2;
              return (
                <mesh
                  key={k}
                  geometry={tick}
                  material={mats[i]}
                  position={[Math.cos(a) * 1.09, Math.sin(a) * 1.09, 0]}
                  rotation={[0, 0, a - Math.PI / 2]}
                  scale={k % 3 ? 1 : 1.8}
                />
              );
            })}
        </group>
      ))}
    </>
  );
}

function Rings({ next }: { next: "pro" | "creative" }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  useFrame(({ size }) => {
    const g = group.current;
    if (!g) return;
    const r = portal.ringR / PX;
    g.visible = r > 0.001;
    g.position.set((portal.ox - size.width / 2) / PX, -(portal.oy - size.height / 2) / PX, 0);
    g.scale.setScalar(Math.max(r, 0.001));
    if (spin.current) spin.current.rotation.z = portal.t * (next === "creative" ? 1.6 : -0.7);
  });
  return (
    <group ref={group} visible={false}>
      <group ref={spin}>{next === "creative" ? <CreativeRings /> : <ProRings />}</group>
    </group>
  );
}

/** Compiles the ring shaders before the first ride, then reports ready. */
function Warmup() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    // compile() skips hidden objects, and the rings stay hidden until a ride.
    const hidden: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
    });
    gl.compile(scene, camera);
    hidden.forEach((o) => (o.visible = false));
    setPortalReady(true);
    return () => setPortalReady(false);
  }, [gl, scene, camera]);
  return null;
}

/** Clears the last ride's frame so a later snapshot never shows stale rings. */
function ClearWhenIdle({ running }: { running: boolean }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    if (!running) gl.clear();
  }, [running, gl]);
  return null;
}

export default function PortalCanvas() {
  const running = useSyncExternalStore(subscribePortal, () => portal.running, () => false);
  const next = useSyncExternalStore(subscribePortal, () => portal.next, () => "creative" as const);
  return (
    <Canvas
      frameloop={running ? "always" : "never"}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, REST_Z], near: 0.05, far: 60, fov: 50 }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", () => setPortalReady(false));
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Rig />
      <Rings next={next} />
      <Warmup />
      <ClearWhenIdle running={running} />
    </Canvas>
  );
}
