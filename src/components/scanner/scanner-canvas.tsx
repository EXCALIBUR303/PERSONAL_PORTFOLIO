"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  TIMINGS,
  apertureRadius,
  scanFraction,
  clamp01,
  easeInOut,
  easeOut,
  passProgress,
  setLayerReady,
  slit,
  subscribeProgress,
  subscribeTransition,
  transition,
  within,
  type Layout,
} from "@/lib/transition/state";
import { QUALITY } from "@/lib/transition/quality";
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
/** Progress a placement onto the grid takes (coming back). */
const SNAP = 0.07;

const Z_AXIS = new THREE.Vector3(0, 0, 1);
/** How deep (behind the screen) a tile goes while it is inside the tunnel. */
const TUNNEL_Z = -520;
/** Progress a tile takes to lift off the page before it dives. */
const LIFT = 0.04;
/** What a tile shrinks to as it enters the mouth of the tunnel. */
const MOUTH_SCALE = 0.22;
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
    () => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new THREE.Vector3(), s: new THREE.Vector3(), c: new THREE.Color(), lay: new THREE.Quaternion() }),
    [],
  );

  const setDpr = useThree((st) => st.setDpr);
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
      // The pixel ratio follows the run's quality tier, once at the start of a run and only if it changed.
      const wanted = Math.min(window.devicePixelRatio || 1, QUALITY[transition.tier].dprCap);
      if (Math.abs(gl.getPixelRatio() - wanted) > 0.01) setDpr(wanted);
      const parts = startRun({
        W,
        H,
        direction: transition.direction,
        oldLayout: transition.oldLayout,
        oldOrigin: transition.oldOrigin,
        regions: transition.regions,
        anchor: transition.anchor,
        fragments: QUALITY[transition.tier].fragments,
      });
      run = {
        run: transition.run,
        parts,
        byKind: group(parts, capacity),
        // A flat tile of paper is lit like a surface, so it is lifted to read as paper rather than grey.
        startColours: parts.map((q) => new THREE.Color(q.startColour).multiplyScalar(q.plate ? 1.5 : 1)),
        endColours: parts.map((q) => new THREE.Color(q.endColour)),
        axes: parts.map((q) => new THREE.Vector3(q.axis.x, q.axis.y, q.axis.z).normalize()),
        ended: false,
        fields: out ? [] : fieldsOf(transition.oldLayout, W, H),
      };
      current.current = run;
    }
    if (!run.ended && transition.started) {
      assignEnds(run.parts, {
        W,
        H,
        direction: transition.direction,
        newLayout: transition.newLayout,
        newOrigin: transition.newOrigin,
        anchor: transition.anchor,
      });
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

    const { m, q: quat, v, s, c, lay } = scratch;
    const edges = QUALITY[transition.tier].outlines;
    for (let k = 0; k < KINDS; k++) {
      const mesh = meshes.current[k];
      const line = outlines.current[k];
      if (!mesh || !line) continue;
      const list = run.byKind[k];
      mesh.count = list.length;
      line.count = edges ? list.length : 0;
      list.forEach((index, slot) => {
        const q = run.parts[index];
        let x: number;
        let y: number;
        let z: number;
        let angle: number;
        // The size of the shape along its three axes (before the outline), and how far it has settled onto its outline.
        let sx: number;
        let sy: number;
        let sz: number;
        let mix: number;
        let land = 0;
        // Turn about the z axis (a dash lying along an outline or a row), applied after the tumble.
        let rot = 0;
        let flat = false;
        if (out) {
          if (q.plate) {
            // A tile cut from a Professional region. It lifts off the page the moment its piece of the snapshot is cut away,
            // dives into the mouth of the tunnel (small and deep), and comes out along the line to where it lands.
            const a0 = q.pass + LIFT;
            const avail = Math.max(0.12, 0.9 - a0);
            const i1 = a0 + avail * 0.46;
            const e1 = a0 + avail;
            const lift = smooth(q.pass, a0, p);
            const u = inOutCubic(clamp01((p - a0) / (i1 - a0)));
            const w = easeOut(clamp01((p - i1) / (e1 - i1)));
            const thick = Math.max(3, Math.min(q.startW, q.startH) * 0.07);
            const landL = q.endSize * q.endStretch;
            const landT = q.endSize * (q.endStretch > 1 ? 0.3 : 1);
            if (p < q.pass) {
              // Still part of the page: the real snapshot shows it.
              x = q.start.x;
              y = q.start.y;
              z = 0;
              sx = sy = sz = 0.0001;
            } else if (p < a0) {
              x = q.start.x;
              y = q.start.y - 14 * lift;
              z = 70 * lift;
              sx = q.startW * (1 + 0.04 * lift);
              sy = q.startH * (1 + 0.04 * lift);
              sz = thick;
            } else if (p < i1) {
              x = lerp(q.start.x, q.mouth.x, u);
              y = lerp(q.start.y - 14, q.mouth.y, u) - Math.sin(Math.PI * u) * q.lift * 0.4;
              z = lerp(70, TUNNEL_Z, u);
              const k = lerp(1, MOUTH_SCALE, u);
              sx = q.startW * k;
              sy = q.startH * k;
              sz = thick * k;
            } else {
              x = lerp(q.mouth.x, q.end.x, w);
              y = lerp(q.mouth.y, q.end.y, w) - Math.sin(Math.PI * w) * q.lift * 0.3;
              z = lerp(TUNNEL_Z, 0, w);
              sx = lerp(q.startW * MOUTH_SCALE, landL, w);
              sy = lerp(q.startH * MOUTH_SCALE, landT, w);
              sz = lerp(thick * MOUTH_SCALE, landT, w);
              land = smooth(0.55, 1, w);
            }
            // A small turn as it lifts, more in the tunnel, none by the time it lands.
            angle = q.spin * (0.15 * lift + 0.9 * u) * (1 - w);
            mix = p > i1 ? smooth(0, 0.7, w) : 0;
            flat = true;
          } else {
            // Markers light up from the centre outward as the aperture forms.
            const appear = transition.started ? backOut(clamp01((aim - q.order * 0.55) / 0.4)) : 0;
            const r = clamp01((p - q.pass) / RELEASE);
            let scale: number;
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
              land = smooth(0.55, 1, e);
            }
            sx = sy = sz = scale;
          }
          // The assembled outlines clear from the centre outward once the page is revealed.
          const clear = 1 - smooth(0.84 + 0.1 * q.order, 0.92 + 0.08 * q.order, p);
          sx *= clear;
          sy *= clear;
          sz *= clear;
        } else {
          // Coming back. Fragments pop out of the world's islands and stations during the cue, gather on a ring around
          // the anchor (collect), travel to the baselines of the Professional text (align), and are set as type when a
          // bracket passes: a row's ticks drop onto the line and give way to the real text; the rest are placed on the
          // page's grid as the bracket closes.
          const collect = TIMINGS["to-pro"].beats.collect;
          const pop = backOut(clamp01((transition.cue - q.seed * 0.45) / 0.55));
          const c1End = collect[0] + q.order * 0.12 + 0.2;
          const c1 = inOutCubic(clamp01((p - collect[0] - q.order * 0.12) / 0.2));
          const arc = Math.sin(Math.PI * c1);
          const bx = lerp(q.start.x, q.slot.x, c1) + (q.seed - 0.5) * 28 * arc;
          const by = lerp(q.start.y, q.slot.y, c1) - q.lift * 0.25 * arc;
          // A depth below 1 means the fragment is inside the aperture: smaller and further away.
          let inside = 0;
          let g: number;
          if (q.row) {
            // From the ring a tick goes in through the aperture (the anchor), then out along the line to its row.
            const t1 = q.arrive;
            const t0 = Math.max(c1End, t1 - 0.22);
            const u = clamp01((p - t0) / Math.max(0.04, t1 - t0));
            const into = inOutCubic(clamp01(u / 0.45));
            const out2 = easeOut(clamp01((u - 0.45) / 0.55));
            const px = lerp(bx, transition.anchor.x, into);
            const py = lerp(by, transition.anchor.y, into);
            x = lerp(px, q.end.x, out2);
            y = lerp(py, q.end.y, out2);
            inside = into * (1 - out2);
            g = out2;
          } else {
            g = expoOut(clamp01((p - q.pass) / SNAP));
            x = lerp(bx, q.end.x, g);
            y = lerp(by, q.end.y, g);
          }
          z = q.lift * 0.45 * arc * (1 - inside) - 220 * inside + Math.sin(Math.PI * g) * (q.row ? 0 : 60);
          // The tumble damps to nothing by the time it reaches the ring.
          angle = q.spin * (1 - c1);
          // A dash lies along its island's outline, then along the ring, then flat on its row.
          const ringTangent = Math.atan2(q.slot.y - transition.anchor.y, q.slot.x - transition.anchor.x) + Math.PI / 2;
          const startRot = -q.startAngle;
          const toRing = -ringTangent;
          rot = lerp(startRot, toRing + Math.round((startRot - toRing) / Math.PI) * Math.PI, c1);
          rot = lerp(rot, q.row ? 0 : toRing, g);
          const stretch = lerp(lerp(q.startStretch, Math.max(1.6, q.startStretch * 0.7), c1), q.endStretch, g);
          const dash = smooth(1, 2.5, stretch);
          let scale = lerp(q.startSize * pop, q.startSize * 0.9, c1);
          scale = lerp(scale, q.endSize, g) * (1 - 0.55 * inside);
          // A row's tick drops two pixels onto the line and goes as the bracket reaches it; the rest clear at the end.
          const set = q.row ? smooth(q.pass, q.pass + 0.05, p) : 0;
          y += 2 * set;
          scale *= 1 - set;
          if (!q.row) scale *= 1 - smooth(0.78 + 0.14 * q.order, 0.86 + 0.13 * q.order, p);
          sx = scale * stretch;
          // A row's tick is a rule about 3 px thick, so it reads at a glance; other dashes stay finer.
          sy = scale * lerp(1, q.row ? 0.42 : 0.3, dash);
          sz = sy;
          mix = g;
        }
        quat.setFromAxisAngle(run.axes[index], angle);
        if (rot) quat.multiply(lay.setFromAxisAngle(Z_AXIS, rot));
        if (land > 0 && q.endStretch > 1) {
          quat.slerp(lay.setFromAxisAngle(Z_AXIS, -q.endAngle), land);
          if (!flat) {
            const f = sx;
            sx = f * lerp(1, q.endStretch, land);
            sy = f * lerp(1, 0.3, land);
            sz = sy;
          }
        }
        s.set(Math.max(0.0001, sx), Math.max(0.0001, sy), Math.max(0.0001, sz));
        v.set(x - W / 2, H / 2 - y, z);
        m.compose(v, quat, s);
        mesh.setMatrixAt(slot, m);
        if (edges) {
          // A thin ink edge around flat tiles (a uniform grow would swell them); fragments grow by a ratio.
          if (flat) s.set(sx + 2.4, sy + 2.4, sz + 2.4);
          else s.multiplyScalar(OUTLINE);
          m.compose(v, quat, s);
          line.setMatrixAt(slot, m);
        }
        c.copy(run.startColours[index]).lerp(run.endColours[index], mix);
        mesh.setColorAt(slot, c);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (edges) line.instanceMatrix.needsUpdate = true;
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

/**
 * The dimension of the aperture: octagonal frames behind it, at depth, that
 * rush past the viewer as the scanners part, so the opening reads as a space
 * to move through rather than a flat ring. Only going to Creative has them
 * (coming back is flat, aligned precision). One merged set of line segments;
 * each frame's position and fade is a function of `progress`.
 *
 * Frames sit at z = 0, -140, ... and are pulled toward the viewer; a frame at
 * z shows at radius r * D / (D - z), so the screen radius grows as it nears.
 */
const FRAME_GAP = 140;
function DepthFrames() {
  const count = useThree((s) => (s.size.width < 640 ? 3 : 5));
  const ref = useRef<THREE.LineSegments>(null);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 8 * 2 * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 8 * 2 * 4), 4));
    return g;
  }, [count]);
  const material = useMemo(
    () => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthTest: false, depthWrite: false }),
    [],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  useFrame(({ size }) => {
    const line = ref.current;
    if (!line) return;
    const shown = Math.min(count, QUALITY[transition.tier].frames);
    const out = transition.running && transition.direction === "to-creative" && transition.started && shown > 0;
    line.visible = out;
    if (!out) return;
    geometry.setDrawRange(0, shown * 16);
    const W = size.width;
    const H = size.height;
    const p = transition.progress;
    const R = apertureRadius(W, H) * 1.16;
    const half = Math.hypot(W, H) / 2;
    const pull = D * 0.86 * easeInOut(scanFraction(p)) * (W < 640 ? 0.8 : 1);
    const appear = smooth(0, 0.16, p);
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const col = geometry.getAttribute("color") as THREE.BufferAttribute;
    for (let k = 0; k < shown; k++) {
      const z = -k * FRAME_GAP + pull;
      const shown = z < D - 120 ? R * (D / (D - z)) : Infinity;
      const base = 0.72 - 0.1 * k;
      const alpha = z < D - 120 ? base * appear * (1 - smooth(half * 0.85, half * 1.4, shown)) : 0;
      for (let i = 0; i < 8; i++) {
        const a0 = Math.PI / 8 + (i * Math.PI) / 4;
        const a1 = a0 + Math.PI / 4;
        const v = (k * 8 + i) * 2;
        pos.setXYZ(v, R * Math.cos(a0), R * Math.sin(a0), z);
        pos.setXYZ(v + 1, R * Math.cos(a1), R * Math.sin(a1), z);
        col.setXYZW(v, 0.09, 0.09, 0.11, alpha);
        col.setXYZW(v + 1, 0.09, 0.09, 0.11, alpha);
      }
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });
  return <lineSegments ref={ref} args={[geometry, material]} frustumCulled={false} renderOrder={-0.5} visible={false} />;
}

/**
 * Draws one frame each time the master timeline moves, from inside that same
 * update. The canvas has no loop of its own (`frameloop="never"`), so a run has
 * one frame callback chain, GSAP's, and the particles are always drawn with the
 * progress the page has just been painted with (no second requestAnimationFrame
 * that could run first and lag the scanner by a frame).
 */
function Drive() {
  const advance = useThree((s) => s.advance);
  useEffect(
    () =>
      subscribeProgress(() => {
        if (transition.running && transition.style === "scanner") advance(performance.now() / 1000);
      }),
    [advance],
  );
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
      frameloop="never"
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
      <DepthFrames />
      <Drive />
      <ClearWhenIdle running={running} />
    </Canvas>
  );
}
