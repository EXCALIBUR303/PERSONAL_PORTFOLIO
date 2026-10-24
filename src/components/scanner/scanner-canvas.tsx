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
  type Layout,
} from "@/lib/transition/state";
import { KINDS, assignEnds, countFor, startRun, type Particle } from "./particle-layout";

/**
 * The 3D half of the scanner transition: lit, outlined shapes that carry the
 * page's structure across, and a screen-space band along the scanners where
 * grid lines break into dots (or dots draw back into lines), with colour
 * fields blooming or contracting.
 *
 * Going to Creative, small markers sit on Professional's panel borders and
 * open grid. Each is released as a scanner passes it, arcs toward the viewer
 * and lands on a Creative block's edge in that block's colour; the assembled
 * outlines clear once the page is revealed. Coming back, the shapes on
 * Creative's blocks are gathered onto the alignment axis, lose their tumble,
 * and are placed onto Professional's panels and grid as the scanners close.
 *
 * Camera: perspective, at distance D where one unit is one screen pixel on the
 * z = 0 plane, so particles at rest line up exactly with the page. Depth is
 * only used in flight.
 *
 * Everything here is a function of `transition` (lib/transition/state.ts),
 * which GSAP moves; nothing keeps its own clock.
 */
const D = 1000;
const OUTLINE = 1.22;
/** Progress a released particle takes to land (going out). */
const RELEASE = 0.2;
/** Progress the gather onto the axis takes, and a placement (coming back). */
const GATHER = 0.15;
const SNAP = 0.07;

const GEOMETRIES = [
  () => new THREE.BoxGeometry(1, 1, 1),
  () => new THREE.OctahedronGeometry(0.74),
  () => new THREE.TorusGeometry(0.46, 0.17, 8, 24),
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
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** One coordinate of a cubic Bezier. */
const bezier = (a: number, b: number, c: number, d: number, t: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

const BAND_VERTEX = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
/**
 * Screen-space band beside the scanners, in CSS pixels. Going to Creative it
 * lies inside the opening slit: grid lines at the scanner break into dashes and
 * then into coloured paper dots. Coming back it lies outside the closing slit:
 * dots at the scanner draw into dashes and then into the blueprint grid. Soft
 * colour fields bloom inside the slit going out and contract coming back.
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
        float a = uBlob[i].w * (1.0 - smoothstep(uBlob[i].z * 0.15, uBlob[i].z, d));
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
      float lines = max(fine * 0.55, major) * dash;

      vec2 tile = floor((px - uDots) / 22.0);
      vec2 dc = mod(px - uDots, 22.0) - 11.0;
      // Dots grow out of the lines going to Creative, and shrink into them coming back.
      float grow = uDir < 0.5 ? smoothstep(0.04, 0.5, t) : 1.0 - smoothstep(0.0, 0.45, t);
      float radius = mix(0.5, 2.3, grow);
      float dotMask = 1.0 - smoothstep(radius - 0.5, radius + 0.5, length(dc));
      float h = hash(tile);
      vec3 dotCol = h < 0.25 ? vec3(0.78, 0.95, 0.23) : h < 0.5 ? vec3(1.0, 0.56, 0.75) : h < 0.75 ? vec3(0.56, 0.86, 1.0) : vec3(0.09, 0.09, 0.11);

      float lineA;
      float dotA;
      if (uDir < 0.5) {
        lineA = lines * (1.0 - smoothstep(0.0, 0.8, t));
        dotA = dotMask * smoothstep(0.06, 0.4, t) * (1.0 - smoothstep(0.6, 1.0, t));
      } else {
        dotA = dotMask * (1.0 - smoothstep(0.0, 0.45, t));
        lineA = lines * smoothstep(0.0, 0.25, t) * (1.0 - smoothstep(0.62, 1.0, t));
        dotCol = mix(dotCol, vec3(0.09, 0.09, 0.11), 0.4);
      }
      col = over(vec4(dotCol, dotA * 0.85 * uFade), col);
      col = over(vec4(0.184, 0.294, 0.961, lineA * 0.55 * uFade), col);
    }
    if (col.a <= 0.002) discard;
    gl_FragColor = col;
  }
`;

/** Colour fields used when a page has no coloured blocks on screen. */
const FALLBACK_FIELDS = [
  { x: 0.28, y: 0.3, colour: "#c8f13b" },
  { x: 0.74, y: 0.24, colour: "#ff8fc0" },
  { x: 0.3, y: 0.76, colour: "#8edbff" },
  { x: 0.76, y: 0.72, colour: "#ff6538" },
];
type Field = { x: number; y: number; radius: number; colour: string };
/** The colour fields: behind Creative's coloured blocks (islands, the note). */
function fieldsOf(layout: Layout, W: number, H: number): Field[] {
  const coloured = layout.panels.filter((p) => p.colour).slice(0, 4);
  if (coloured.length)
    return coloured.map((p) => ({ x: p.cx, y: p.cy, radius: Math.max(p.w, p.h) * 0.6, colour: p.colour! }));
  const m = Math.min(W, H);
  return FALLBACK_FIELDS.map((f) => ({ x: f.x * W, y: f.y * H, radius: m * 0.3, colour: f.colour }));
}

type Run = {
  run: number;
  parts: Particle[];
  byKind: number[][];
  startColours: THREE.Color[];
  endColours: THREE.Color[];
  axes: THREE.Vector3[];
  /** Destinations assigned (needs the new page). */
  ended: boolean;
  fields: Field[];
};

const group = (parts: Particle[], capacity: number) => {
  const byKind: number[][] = Array.from({ length: KINDS }, () => []);
  parts.forEach((q, i) => byKind[q.kind].length < capacity && byKind[q.kind].push(i));
  return byKind;
};

function Particles({ capacity }: { capacity: number }) {
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([]);
  const outlines = useRef<(THREE.InstancedMesh | null)[]>([]);
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
      uBand: { value: 200 },
      uGrid: { value: new THREE.Vector2() },
      uDots: { value: new THREE.Vector2() },
      uBlob: { value: FALLBACK_FIELDS.map(() => new THREE.Vector4()) },
      uBlobCol: { value: FALLBACK_FIELDS.map((f) => new THREE.Color(f.colour)) },
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

    // Build the run's particles on its first frame; destinations once the new page exists.
    let run = current.current;
    if (!run || run.run !== transition.run) {
      const parts = startRun({ W, H, direction: transition.direction, oldLayout: transition.oldLayout, oldOrigin: transition.oldOrigin });
      run = {
        run: transition.run,
        parts,
        byKind: group(parts, capacity),
        startColours: parts.map((q) => new THREE.Color(q.startColour)),
        endColours: parts.map((q) => new THREE.Color(q.endColour)),
        axes: parts.map((q) => new THREE.Vector3(q.axis.x, q.axis.y, q.axis.z).normalize()),
        ended: false,
        fields: out ? [] : fieldsOf(transition.oldLayout, W, H),
      };
      current.current = run;
    }
    if (!run.ended && transition.started) {
      assignEnds(run.parts, { W, H, direction: transition.direction, newLayout: transition.newLayout, newOrigin: transition.newOrigin });
      run.byKind = group(run.parts, capacity);
      run.endColours = run.parts.map((q) => new THREE.Color(q.endColour));
      if (out) run.fields = fieldsOf(transition.newLayout, W, H);
      run.ended = true;
    }

    const C = { x: W / 2, y: H / 2 };
    const aim = within(p, "aim");
    const settle = within(p, "settle");
    cam.position.set(0, 0, D);
    cam.lookAt(0, 0, 0);

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
          // Markers light up from the centre outward as the aperture forms.
          const appear = transition.started ? backOut(clamp01((aim - q.order * 0.55) / 0.4)) : 0;
          const r = clamp01((p - q.pass) / RELEASE);
          if (r <= 0) {
            // Waiting on the grid; brightening as the scanner approaches.
            const near = smooth(q.pass - 0.05, q.pass, p);
            x = q.start.x;
            y = q.start.y;
            z = 0;
            angle = 0;
            scale = q.startSize * appear * (1 + 0.45 * near);
            mix = 0;
          } else {
            // Released: carried outward with the scanner, lifted toward the
            // viewer, then down onto its place on a Creative block.
            const e = easeOut(r);
            const dir = Math.sign(q.start.x - C.x) || 1;
            x = bezier(q.start.x, q.start.x + dir * 60, q.end.x, q.end.x, e);
            y = bezier(q.start.y, q.start.y - q.lift, q.end.y - q.lift * 0.35, q.end.y, e);
            z = bezier(0, 160, 100, 0, e);
            angle = q.spin * (1 - (1 - e) * (1 - e));
            scale = lerp(q.startSize, q.endSize, e) * (1 + 0.3 * Math.sin(Math.PI * e));
            mix = smooth(0.08, 0.5, e);
          }
          // The assembled outlines clear from the centre outward once the page is revealed.
          scale *= 1 - smooth(0.84 + 0.1 * q.order, 0.92 + 0.08 * q.order, p);
        } else {
          // Shapes appear on Creative's blocks during the cue, are gathered onto
          // the axis, and are placed onto Professional's structure as a scanner passes.
          const pop = backOut(clamp01((transition.cue - q.seed * 0.45) / 0.55));
          const fromAxis = Math.min(1, Math.abs(q.start.y - C.y) / C.y);
          const g = inOutCubic(clamp01((p - 0.04 * (1 - fromAxis)) / GATHER));
          const placed = expoOut(clamp01((p - q.pass) / SNAP));
          const sway = Math.sin(Math.PI * g) * (q.seed - 0.5) * 24;
          const gx = lerp(q.start.x, q.slot.x, g) + sway;
          const gy = lerp(q.start.y, q.slot.y, g);
          x = lerp(gx, q.end.x, placed);
          y = lerp(gy, q.end.y, placed);
          z = Math.sin(Math.PI * placed) * 60;
          angle = q.spin * (1 - g);
          scale = lerp(q.startSize * pop, q.startSize * 0.85, g);
          scale = lerp(scale, q.endSize, placed);
          mix = placed;
          scale *= 1 - smooth(0.78 + 0.14 * q.order, 0.86 + 0.13 * q.order, p);
        }
        quat.setFromAxisAngle(run.axes[index], angle);
        v.set(x - W / 2, H / 2 - y, z);
        s.setScalar(Math.max(0.0001, scale));
        m.compose(v, quat, s);
        mesh.setMatrixAt(slot, m);
        s.multiplyScalar(OUTLINE);
        m.compose(v, quat, s);
        line.setMatrixAt(slot, m);
        c.copy(run.startColours[index]).lerp(run.endColours[index], mix);
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
      u.uBand.value = W < 640 ? 130 : 200;
      const pro = out ? transition.oldOrigin : transition.newOrigin;
      const paper = out ? transition.newOrigin : transition.oldOrigin;
      u.uGrid.value.set(pro.x, pro.y);
      u.uDots.value.set(paper.x, paper.y);
      u.uFade.value = within(p, "scan") > 0 ? 1 - smooth(0.2, 0.9, settle) : 0;
      const blobs = u.uBlob.value as THREE.Vector4[];
      const colours = u.uBlobCol.value as THREE.Color[];
      blobs.forEach((blob, i) => {
        const field = run.fields[i];
        if (!field) {
          blob.set(0, 0, 0, 0);
          return;
        }
        colours[i].set(field.colour);
        if (out) {
          // Each field blooms as a scanner reaches it.
          const at = passProgress(field.x, transition.direction, W);
          blob.set(field.x, field.y, field.radius * easeOut(clamp01((p - at) / 0.24)), 0.14 * (1 - smooth(0.1, 0.95, settle)));
        } else {
          // Coming back, the fields contract toward the axis while the shapes are gathered.
          const k = easeInOut(aim);
          blob.set(field.x, lerp(field.y, C.y, k * 0.5), field.radius * (1 - k), 0.14 * Math.min(1, transition.cue * 2 + (transition.started ? 1 : 0)));
        }
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
  return <Particles key={capacity} capacity={capacity} />;
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
