"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  clamp01,
  easeInOut,
  easeOut,
  passProgress,
  setLayerReady,
  slit,
  subscribeTransition,
  transition,
  within,
} from "@/lib/transition/state";
import { DRIFT, KINDS, countFor, layoutRun, type Particle } from "./particle-layout";

/**
 * The 3D half of the scanner transition: lit, outlined polyhedra that start as
 * markers on the page's own grid and fly to (or from) the Creative forms, and a
 * screen-space band along the scanners where grid lines break into dots (or
 * dots draw back into lines), with colour fields blooming or draining.
 *
 * Camera: perspective, at distance D where one unit is one screen pixel on the
 * z = 0 plane, so grid markers line up exactly with the page. The camera only
 * moves while no particle has to sit on the grid: it pulls back during the
 * settle going to Creative, and comes forward during the aim coming back.
 *
 * Everything here is a function of `transition` (lib/transition/state.ts),
 * which GSAP moves; nothing keeps its own clock.
 */
const D = 1000;
const OUTLINE = 1.2;
/** Progress a released particle takes to reach its form, and a caught one to snap to the grid. */
const RELEASE = 0.24;
const SNAP = 0.085;

const GEOMETRIES = [
  () => new THREE.BoxGeometry(1, 1, 1),
  () => new THREE.OctahedronGeometry(0.74),
  () => new THREE.TetrahedronGeometry(0.82),
  () => new THREE.TorusGeometry(0.5, 0.18, 8, 22),
];

const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const backOut = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const BAND_VERTEX = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
/**
 * Screen-space band beside the scanners, in CSS pixels. Going to Creative it
 * lies inside the opening slit: grid lines at the scanner break into dashes and
 * then into coloured paper dots. Coming back it lies outside the closing slit:
 * dots at the scanner draw into dashes and then into the blueprint grid. Soft
 * colour fields bloom inside the slit going out and drain away coming back.
 */
const BAND_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform vec2 uRes;
  uniform float uDpr;
  uniform float uL;
  uniform float uR;
  uniform float uDir;
  uniform float uFade;
  uniform float uBand;
  uniform vec2 uGrid;
  uniform vec2 uDots;
  uniform vec4 uBlob[4];
  uniform vec3 uBlobCol[4];

  float nearLine(float v, float o, float period) {
    float d = mod(v - o, period);
    return min(d, period - d);
  }
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  vec4 over(vec4 top, vec4 under) {
    float a = top.a + under.a * (1.0 - top.a);
    vec3 c = (top.rgb * top.a + under.rgb * under.a * (1.0 - top.a)) / max(a, 1e-4);
    return vec4(c, a);
  }

  void main() {
    vec2 px = gl_FragCoord.xy / uDpr;
    px.y = uRes.y - px.y;
    bool inSlit = px.x > uL && px.x < uR;
    vec4 col = vec4(0.0);

    if (inSlit) {
      for (int i = 0; i < 4; i++) {
        float d = distance(px, uBlob[i].xy);
        float a = uBlob[i].w * (1.0 - smoothstep(uBlob[i].z * 0.2, uBlob[i].z, d));
        col = over(vec4(uBlobCol[i], a), col);
      }
    }

    float t;
    bool inBand;
    if (uDir < 0.5) {
      inBand = inSlit;
      t = min(px.x - uL, uR - px.x) / uBand;
    } else {
      inBand = !inSlit;
      t = (px.x <= uL ? uL - px.x : px.x - uR) / uBand;
    }
    if (inBand && t < 1.0 && uFade > 0.0) {
      float vx = nearLine(px.x, uGrid.x, 48.0);
      float hy = nearLine(px.y, uGrid.y, 48.0);
      float fine = 1.0 - smoothstep(0.45, 1.25, min(vx, hy));
      float major = 1.0 - smoothstep(0.7, 1.7, min(nearLine(px.x, uGrid.x, 240.0), nearLine(px.y, uGrid.y, 240.0)));
      float duty = uDir < 0.5 ? 1.0 - smoothstep(0.0, 0.7, t) : smoothstep(0.0, 0.6, t);
      float along = vx < hy ? px.y - uGrid.y : px.x - uGrid.x;
      float dash = step(fract(along / 12.0), duty * 0.92 + 0.04);
      float lines = max(fine * 0.6, major) * dash;

      vec2 tile = floor((px - uDots) / 22.0);
      vec2 dc = mod(px - uDots, 22.0) - 11.0;
      float dotMask = 1.0 - smoothstep(1.4, 2.4, length(dc));
      float h = hash(tile);
      vec3 dotCol = h < 0.25 ? vec3(0.78, 0.95, 0.23) : h < 0.5 ? vec3(1.0, 0.56, 0.75) : h < 0.75 ? vec3(0.56, 0.86, 1.0) : vec3(0.09, 0.09, 0.11);

      float lineA;
      float dotA;
      if (uDir < 0.5) {
        lineA = lines * (1.0 - smoothstep(0.0, 0.8, t));
        dotA = dotMask * smoothstep(0.08, 0.45, t) * (1.0 - smoothstep(0.55, 1.0, t));
      } else {
        dotA = dotMask * (1.0 - smoothstep(0.0, 0.45, t));
        lineA = lines * smoothstep(0.0, 0.25, t) * (1.0 - smoothstep(0.62, 1.0, t));
        dotCol = mix(dotCol, vec3(0.09, 0.09, 0.11), 0.4);
      }
      col = over(vec4(dotCol, dotA * 0.85 * uFade), col);
      col = over(vec4(0.184, 0.294, 0.961, lineA * 0.7 * uFade), col);
    }
    if (col.a <= 0.002) discard;
    gl_FragColor = col;
  }
`;

const BLOBS = [
  { x: 0.28, y: 0.3, colour: "#c8f13b" },
  { x: 0.74, y: 0.24, colour: "#ff8fc0" },
  { x: 0.3, y: 0.76, colour: "#8edbff" },
  { x: 0.76, y: 0.72, colour: "#ff6538" },
];

type Run = {
  run: number;
  parts: Particle[];
  byKind: number[][];
  gridColours: THREE.Color[];
  formColours: THREE.Color[];
  axes: THREE.Vector3[];
  homesFixed: boolean;
};

function Field({ capacity }: { capacity: number }) {
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([]);
  const outlines = useRef<(THREE.InstancedMesh | null)[]>([]);
  const group = useRef<THREE.Group>(null);
  const band = useRef<THREE.ShaderMaterial>(null);
  const current = useRef<Run | null>(null);
  const geometries = useMemo(() => GEOMETRIES.map((make) => make()), []);
  const solid = useMemo(() => new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.5, metalness: 0 }), []);
  const ink = useMemo(() => new THREE.MeshBasicMaterial({ color: "#17171d", side: THREE.BackSide }), []);
  const uniforms = useMemo(
    () => ({
      uRes: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: 1 },
      uL: { value: 0 },
      uR: { value: 0 },
      uDir: { value: 0 },
      uFade: { value: 0 },
      uBand: { value: 240 },
      uGrid: { value: new THREE.Vector2() },
      uDots: { value: new THREE.Vector2() },
      uBlob: { value: BLOBS.map(() => new THREE.Vector4()) },
      uBlobCol: { value: BLOBS.map((b) => new THREE.Color(b.colour)) },
    }),
    [],
  );
  useEffect(
    () => () => {
      geometries.forEach((g) => g.dispose());
      solid.dispose();
      ink.dispose();
    },
    [geometries, solid, ink],
  );
  // Give every mesh its per-instance colour buffer now, before the warm-up
  // compile: created later, on the first run, it would force a recompile.
  useLayoutEffect(() => {
    const white = new THREE.Color("#ffffff");
    meshes.current.forEach((mesh) => {
      if (!mesh) return;
      for (let i = 0; i < capacity; i++) mesh.setColorAt(i, white);
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [capacity]);
  // Scratch objects, reused every frame.
  const scratch = useMemo(
    () => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new THREE.Vector3(), s: new THREE.Vector3(), c: new THREE.Color() }),
    [],
  );

  useFrame(({ camera, size, gl }) => {
    const cam = camera as THREE.PerspectiveCamera;
    const W = size.width;
    const H = size.height;
    const fov = THREE.MathUtils.radToDeg(2 * Math.atan(H / 2 / D));
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    if (!transition.running) return;
    const out = transition.direction === "to-creative";
    const p = transition.progress;

    // Build the run's particles once, on its first frame.
    let run = current.current;
    if (!run || run.run !== transition.run) {
      const parts = layoutRun({ W, H, D, direction: transition.direction, origin: out ? transition.oldOrigin : transition.newOrigin });
      const byKind: number[][] = Array.from({ length: KINDS }, () => []);
      parts.forEach((q, i) => byKind[q.kind].length < capacity && byKind[q.kind].push(i));
      run = {
        run: transition.run,
        parts,
        byKind,
        gridColours: parts.map((q) => new THREE.Color(q.gridColour)),
        formColours: parts.map((q) => new THREE.Color(q.formColour)),
        axes: parts.map((q) => new THREE.Vector3(q.axis.x, q.axis.y, q.axis.z).normalize()),
        homesFixed: out,
      };
      current.current = run;
    }
    // Coming back, the new page's grid is only known once it has rendered.
    if (!run.homesFixed && transition.started) {
      const homes = layoutRun({ W, H, D, direction: transition.direction, origin: transition.newOrigin });
      run.parts.forEach((q, i) => {
        q.grid = homes[i].grid;
      });
      run.homesFixed = true;
    }

    const C = { x: W / 2, y: H / 2 };
    const maxDist = Math.hypot(C.x, C.y);
    const aim = within(p, "aim");
    const settle = within(p, "settle");

    // Camera and the field's turn give the forms depth while nothing needs to sit on the grid.
    const dolly = out ? 0.07 * easeInOut(settle) : 0.08 * (1 - easeInOut(aim));
    cam.position.set(0, 0, D * (1 + dolly));
    cam.lookAt(0, 0, 0);
    if (group.current) {
      group.current.rotation.y = out ? 0.14 * easeInOut(settle) : -0.12 * (1 - easeInOut(aim));
      group.current.rotation.x = out ? -0.05 * easeInOut(settle) : 0.04 * (1 - easeInOut(aim));
    }

    const { m, q: quat, v, s, c } = scratch;
    for (let k = 0; k < KINDS; k++) {
      const mesh = meshes.current[k];
      const line = outlines.current[k];
      if (!mesh || !line) continue;
      const list = run.byKind[k];
      mesh.count = list.length;
      line.count = list.length;
      list.forEach((index, slot) => {
        const q = run.parts[index];
        let x: number;
        let y: number;
        let z: number;
        let angle: number;
        let scale: number;
        let mix: number;
        if (out) {
          const d = Math.hypot(q.grid.x - C.x, q.grid.y - C.y) / maxDist;
          const appear = transition.started ? backOut(clamp01((aim - d * 0.6) / 0.3)) : 0;
          const r = clamp01((p - q.pass) / RELEASE);
          const e = easeOut(r);
          // Quadratic Bézier from the grid marker to the form place, lifted and pushed outward.
          const kx = (q.grid.x + q.form.x) / 2 + (q.grid.x - C.x) * 0.18;
          const ky = Math.min(q.grid.y, q.form.y) - q.lift;
          const kz = 140 + q.lift * 0.5;
          const a = (1 - e) * (1 - e);
          const b = 2 * (1 - e) * e;
          const cc = e * e;
          x = a * q.grid.x + b * kx + cc * q.form.x;
          y = a * q.grid.y + b * ky + cc * q.form.y + Math.sin((settle * 2 + q.seed) * Math.PI * 2) * 4 * e;
          z = a * 0 + b * kz + cc * q.form.z;
          angle = q.spin * e + Math.max(0, p - q.pass) * q.spin * 0.8;
          scale = r <= 0 ? q.gridSize * appear : lerp(q.gridSize, q.formSize, e) * (1 + 0.45 * Math.sin(Math.PI * e));
          mix = smooth(0.05, 0.45, e);
          scale *= 1 - smooth(0.35 + q.seed * 0.35, 0.97, settle);
        } else {
          const pop = backOut(clamp01((transition.cue - q.seed * 0.4) / 0.6));
          const drift = DRIFT * easeInOut(aim);
          const dx = q.form.x + (C.x - q.form.x) * drift;
          const dy = q.form.y + (C.y - q.form.y) * drift;
          const dz = q.form.z * (1 - drift);
          const tumble = q.seed * 6 + q.spin * (0.35 + 0.5 * easeOut(aim));
          const r = clamp01((p - q.pass) / SNAP);
          const e = expoOut(r);
          x = lerp(dx, q.grid.x, e);
          y = lerp(dy, q.grid.y, e);
          z = lerp(dz, 0, e);
          angle = tumble * (1 - e);
          scale = lerp(q.formSize * pop, q.gridSize, e);
          mix = 1 - e;
          const d = Math.hypot(q.grid.x - C.x, q.grid.y - C.y) / maxDist;
          scale *= 1 - smooth(0.15 + d * 0.5, 0.72 + d * 0.26, settle);
        }
        quat.setFromAxisAngle(run.axes[index], angle);
        v.set(x - W / 2, H / 2 - y, z);
        s.setScalar(Math.max(0.0001, scale));
        m.compose(v, quat, s);
        mesh.setMatrixAt(slot, m);
        s.multiplyScalar(OUTLINE);
        m.compose(v, quat, s);
        line.setMatrixAt(slot, m);
        c.copy(run.gridColours[index]).lerp(run.formColours[index], mix);
        mesh.setColorAt(slot, c);
      });
      mesh.instanceMatrix.needsUpdate = true;
      line.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    // The band and the colour fields.
    const u = band.current?.uniforms;
    if (u) {
      const { l, r } = slit(W, p);
      u.uRes.value.set(W, H);
      u.uDpr.value = gl.getPixelRatio();
      u.uL.value = l;
      u.uR.value = r;
      u.uDir.value = out ? 0 : 1;
      u.uBand.value = W < 640 ? 150 : 240;
      const pro = out ? transition.oldOrigin : transition.newOrigin;
      const paper = out ? transition.newOrigin : transition.oldOrigin;
      u.uGrid.value.set(pro.x, pro.y);
      u.uDots.value.set(paper.x, paper.y);
      u.uFade.value = within(p, "scan") > 0 ? 1 - smooth(0.2, 0.9, settle) : 0;
      const m0 = Math.min(W, H);
      BLOBS.forEach((b, i) => {
        const bx = b.x * W;
        const by = b.y * H;
        const at = passProgress(bx, transition.direction, W);
        const radius = out
          ? m0 * 0.3 * easeOut(clamp01((p - at) / 0.26))
          : m0 * 0.3 * (1 - easeOut(clamp01((p - at) / 0.16)));
        const alpha = out ? 0.15 * (1 - smooth(0.1, 0.95, settle)) : 0.15 * Math.min(1, transition.cue * 2 + (transition.started ? 1 : 0));
        (u.uBlob.value as THREE.Vector4[])[i].set(bx, by, radius, alpha);
      });
    }
  });

  return (
    <>
      <mesh frustumCulled={false} renderOrder={-1}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={band}
          vertexShader={BAND_VERTEX}
          fragmentShader={BAND_FRAGMENT}
          uniforms={uniforms}
          transparent
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <group ref={group}>
        {geometries.map((geometry, k) => (
          <group key={k}>
            <instancedMesh
              ref={(el) => {
                outlines.current[k] = el;
              }}
              args={[geometry, ink, capacity]}
              frustumCulled={false}
            />
            <instancedMesh
              ref={(el) => {
                meshes.current[k] = el;
              }}
              args={[geometry, solid, capacity]}
              frustumCulled={false}
            />
          </group>
        ))}
      </group>
    </>
  );
}

/** Compiles the shaders before the first run, then tells the controller. */
function Warmup() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    gl.compile(scene, camera);
    setLayerReady("particles", true);
    return () => setLayerReady("particles", false);
  }, [gl, scene, camera]);
  return null;
}

/** Clears the last run's frame so a later snapshot never shows stale particles. */
function ClearWhenIdle({ running }: { running: boolean }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    if (!running) gl.clear();
  }, [running, gl]);
  return null;
}

function Scene() {
  const width = useThree((s) => s.size.width);
  const capacity = countFor(width);
  return <Field key={capacity} capacity={capacity} />;
}

const isRunning = () => transition.running && transition.style === "scanner";

export default function ScannerCanvas() {
  const running = useSyncExternalStore(subscribeTransition, isRunning, () => false);
  return (
    <Canvas
      frameloop={running ? "always" : "never"}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, D], near: 10, far: 5000, fov: 50 }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", () => setLayerReady("particles", false));
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <hemisphereLight args={["#ffffff", "#d9d2c3", 1.25]} />
      <directionalLight position={[-400, 800, 1000]} intensity={1.7} />
      <Scene />
      <Warmup />
      <ClearWhenIdle running={running} />
    </Canvas>
  );
}
