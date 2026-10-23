"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  OrbitControls,
  Outlines,
} from "@react-three/drei";
import {
  useEffect,
  useMemo,
  useRef,
  type ComponentRef,
  type MutableRefObject,
} from "react";
import * as THREE from "three";
import type { DeskMode } from "./desk-data";

export type StageVariant = "pro" | "creative";
/** Imperative handle so buttons and keys outside the canvas can drive the camera. */
export type StageApi = {
  rotate: (azimuth: number, polar: number) => void;
  zoom: (factor: number) => void;
  reset: () => void;
};

/*
 * Framing. Rather than guessing, the camera distance is solved numerically:
 * points on the pedestal rim and on a sphere around the model are projected
 * through the real camera, and the nearest distance that keeps all of them
 * inside the frame is used. This accounts for perspective and for the
 * container's aspect ratio, so the model is never clipped.
 */
const TARGET = new THREE.Vector3(0, -0.2, 0);
const VIEW_DIR = new THREE.Vector3(0.2, 0.2, 1).normalize();
const FOV = 38;
const BOUNDS = (() => {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const c = Math.cos(a),
      s = Math.sin(a);
    for (const y of [-2.05, -1.85]) {
      points.push(new THREE.Vector3(c * 2.05, y, s * 2.05));
    }
    points.push(new THREE.Vector3(c * 2.05, s * 2.05, 0));
    points.push(new THREE.Vector3(c * 2.05, 0, s * 2.05));
    points.push(new THREE.Vector3(0, c * 2.05, s * 2.05));
  }
  return points;
})();
const probe = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
const fitDistance = (aspect: number) => {
  probe.aspect = aspect;
  probe.updateProjectionMatrix();
  const point = new THREE.Vector3();
  let near = 3,
    far = 40;
  for (let i = 0; i < 24; i++) {
    const mid = (near + far) / 2;
    probe.position.copy(TARGET).addScaledVector(VIEW_DIR, mid);
    probe.lookAt(TARGET);
    probe.updateMatrixWorld();
    const fits = BOUNDS.every((p) => {
      point.copy(p).project(probe);
      return Math.abs(point.x) <= 0.94 && Math.abs(point.y) <= 0.94;
    });
    if (fits) far = mid;
    else near = mid;
  }
  return far;
};

const PALETTE = {
  pro: {
    steel: "#b9c1c6",
    dark: "#3a444c",
    ceramic: "#ece8dd",
    bar: "#9aa6ae",
    bars: "#c9ced2",
    env: "#d9d7d0",
    accent: {
      systems: "#ff6538",
      algorithms: "#2f4bf5",
      computation: "#8a5cf6",
    },
  },
  creative: {
    steel: "#ffffff",
    dark: "#17171d",
    ceramic: "#fff6dc",
    bar: "#8edbff",
    bars: "#ffffff",
    env: "#fdf6e3",
    accent: {
      systems: "#ff6538",
      algorithms: "#2f4bf5",
      computation: "#ff8fc0",
    },
  },
} as const;

type Surface = {
  color: string;
  variant: StageVariant;
  metal?: boolean;
  outline?: boolean;
};
/** Refined brushed metal in Professional, flat painted plastic with an ink outline in Creative. */
function Surface({ color, variant, metal = true, outline = false }: Surface) {
  if (variant === "creative") {
    return (
      <>
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.02} />
        {outline && <Outlines thickness={0.04} color="#17171d" />}
      </>
    );
  }
  return metal ? (
    <meshPhysicalMaterial
      color={color}
      metalness={0.82}
      roughness={0.3}
      clearcoat={0.35}
    />
  ) : (
    <meshStandardMaterial color={color} metalness={0.08} roughness={0.55} />
  );
}

function Rig({
  resetKey,
  apiRef,
}: {
  resetKey: number;
  apiRef: MutableRefObject<StageApi | null>;
}) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera, size, invalidate } = useThree();
  const distance = useMemo(
    () => fitDistance(size.width / Math.max(size.height, 1)),
    [size.width, size.height],
  );
  useEffect(() => {
    const place = () => {
      camera.position.copy(TARGET).addScaledVector(VIEW_DIR, distance);
      camera.lookAt(TARGET);
      controls.current?.update();
      invalidate();
    };
    place();
    const orbit = (azimuth: number, polar: number) => {
      const offset = camera.position.clone().sub(TARGET);
      const s = new THREE.Spherical().setFromVector3(offset);
      s.theta += azimuth;
      s.phi = THREE.MathUtils.clamp(s.phi + polar, 0.45, Math.PI * 0.6);
      offset.setFromSpherical(s);
      camera.position.copy(TARGET).add(offset);
      controls.current?.update();
      invalidate();
    };
    const dolly = (factor: number) => {
      const offset = camera.position.clone().sub(TARGET);
      offset.setLength(
        THREE.MathUtils.clamp(
          offset.length() * factor,
          distance * 0.6,
          distance * 1.3,
        ),
      );
      camera.position.copy(TARGET).add(offset);
      controls.current?.update();
      invalidate();
    };
    apiRef.current = { rotate: orbit, zoom: dolly, reset: place };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, camera, distance, invalidate, resetKey]);
  return (
    <OrbitControls
      ref={controls}
      target={TARGET}
      enableDamping={false}
      enablePan={false}
      // The wheel belongs to the page. Zoom is available from the buttons and +/-.
      enableZoom={false}
      minDistance={distance * 0.6}
      maxDistance={distance * 1.3}
      minPolarAngle={0.45}
      maxPolarAngle={Math.PI * 0.6}
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
    />
  );
}

const easeOutBack = (x: number) => {
  const c1 = 1.4,
    c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

function ObjectScene({
  animated,
  mode,
  variant,
}: {
  animated: boolean;
  mode: DeskMode;
  variant: StageVariant;
}) {
  const root = useRef<THREE.Group>(null);
  const object = useRef<THREE.Group>(null);
  const born = useRef(0);
  const { invalidate, clock } = useThree();
  const p = PALETTE[variant];
  const accent = p.accent[mode];
  const creative = variant === "creative";
  useEffect(() => {
    born.current = clock.elapsedTime;
    invalidate();
    if (!animated) return;
    const timer = window.setInterval(invalidate, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [animated, mode, variant, invalidate, clock]);
  useFrame(({ clock: c }, delta) => {
    if (!root.current || !object.current) return;
    if (!animated) {
      object.current.scale.setScalar(1);
      return;
    }
    root.current.rotation.y += Math.min(delta, 0.05) * 0.2;
    // A short pop when the lens changes, so the selection visibly lands.
    const k = Math.min((c.elapsedTime - born.current) / 0.55, 1);
    object.current.scale.setScalar(0.55 + 0.45 * easeOutBack(k));
    object.current.position.y = Math.sin(c.elapsedTime * 0.6) * 0.05;
  });
  return (
    <>
      <ambientLight intensity={creative ? 0.9 : 0.4} />
      <directionalLight
        castShadow
        position={[3.5, 7, 5]}
        intensity={creative ? 2.2 : 3}
        color="#fff3e2"
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0008}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <Environment resolution={128} frames={1}>
        <color attach="background" args={[p.env]} />
        <Lightformer position={[0, 5, 2]} scale={[8, 3, 1]} intensity={2.4} />
        <Lightformer
          position={[-5, 1, 2]}
          scale={[2, 6, 1]}
          intensity={2}
          color="#cfe3f2"
        />
        <Lightformer
          position={[5, -1, 1]}
          scale={[3, 3, 1]}
          intensity={2}
          color="#ffd2a8"
        />
      </Environment>
      <group ref={root} rotation={[0, -0.5, 0]}>
        <group ref={object} rotation={[0.08, 0, -0.06]}>
          {mode === "computation" ? (
            <mesh castShadow rotation={[0.25, 0.15, 0]}>
              <torusKnotGeometry args={[1.1, 0.36, 160, 24, 2, 3]} />
              <Surface color={accent} variant={variant} outline />
            </mesh>
          ) : mode === "systems" ? (
            <group rotation={[0.2, 0, 0.35]}>
              <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.75, 0.12, 16, 80]} />
                <Surface color={p.steel} variant={variant} outline />
              </mesh>
              <mesh castShadow rotation={[0.6, 0.4, 0.3]}>
                <torusGeometry args={[1.45, 0.19, 16, 80]} />
                <Surface color={accent} variant={variant} outline />
              </mesh>
              <mesh castShadow rotation={[0.1, 1.2, 0.3]}>
                <torusGeometry args={[1.12, 0.09, 12, 70]} />
                <Surface
                  color={creative ? "#d9f542" : p.steel}
                  variant={variant}
                  outline
                />
              </mesh>
              <mesh castShadow>
                <icosahedronGeometry args={[0.62, 1]} />
                <Surface color={p.dark} variant={variant} outline />
              </mesh>
              {[0, 1, 2, 3].map((i) => (
                <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
                  <mesh castShadow position={[1.75, 0, 0]}>
                    <boxGeometry args={[0.34, 0.4, 0.28]} />
                    <Surface color={p.dark} variant={variant} outline />
                  </mesh>
                </group>
              ))}
            </group>
          ) : (
            <group rotation={[0.25, 0.3, 0.06]}>
              {Array.from({ length: 25 }, (_, i) => {
                const x = ((i % 5) - 2) * 0.54,
                  z = (Math.floor(i / 5) - 2) * 0.54,
                  h = ((i * 7) % 5) * 0.2 + 0.18,
                  lit = [0, 5, 10, 11, 12, 17, 22, 23, 24].includes(i);
                return (
                  <mesh key={i} castShadow position={[x, h / 2 - 0.55, z]}>
                    <boxGeometry args={[0.43, h, 0.43]} />
                    <Surface
                      color={lit ? accent : p.bars}
                      variant={variant}
                      metal={false}
                    />
                  </mesh>
                );
              })}
              <mesh position={[0, -0.66, 0]} receiveShadow>
                <boxGeometry args={[3, 0.14, 3]} />
                <Surface color={p.dark} variant={variant} outline />
              </mesh>
            </group>
          )}
        </group>
        <mesh position={[0, -1.95, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.95, 2.05, 0.2, 72]} />
          <Surface color={p.ceramic} variant={variant} metal={false} outline />
        </mesh>
        <mesh position={[0, -1.845, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.62, 1.8, 72]} />
          <meshStandardMaterial color={accent} roughness={0.5} />
        </mesh>
      </group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.06, 0]}
        receiveShadow
      >
        <planeGeometry args={[30, 30]} />
        <shadowMaterial transparent opacity={creative ? 0.28 : 0.2} />
      </mesh>
    </>
  );
}

export default function Sculpture({
  animated,
  onReady,
  onError,
  mode = "systems",
  variant = "pro",
  resetKey = 0,
  maxDpr = 2,
  apiRef,
}: {
  animated: boolean;
  onReady: () => void;
  onError: () => void;
  mode?: DeskMode;
  variant?: StageVariant;
  resetKey?: number;
  maxDpr?: number;
  apiRef: MutableRefObject<StageApi | null>;
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 1.5, 8], fov: FOV, near: 0.5, far: 40 }}
      dpr={[1, maxDpr]}
      frameloop="demand"
      // Size from layout (offsetWidth/Height), not getBoundingClientRect: the
      // Creative stage is tilted, and a rotated box would inflate the canvas.
      resize={{ offsetSize: true, scroll: false }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          onError();
        });
        onReady();
      }}
      aria-hidden="true"
    >
      <ObjectScene animated={animated} mode={mode} variant={variant} />
      <Rig resetKey={resetKey} apiRef={apiRef} />
    </Canvas>
  );
}
