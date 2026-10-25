"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { SiteMode } from "@/components/mode";
import {
  auraPart,
  auraParts,
  DECK_Y,
  NATIVE_Y,
  type AuraPartId,
} from "../aura-data";
import Stage3D, { type Framing } from "./stage";

const INK = "#17171d";
const COBALT = "#2f4bf5";
const ORANGE = "#ff6538";
const LIME = "#d9f542";
const PAPER = "#fbfaf5";

const framing: Framing = {
  // Turned about 20 degrees from the deck diagonal, so the companion at the centre
  // does not hide the hardware lab standing behind it.
  pro: { position: [5.7, 7.5, 12.2], target: [0, 0.4, 0] },
  creative: { position: [-6.5, 4.2, 10.5], target: [0, 0.9, 0] },
};

function Box({
  size,
  at,
  color,
  emissive,
}: {
  size: [number, number, number];
  at: [number, number, number];
  color: string;
  emissive?: string;
}) {
  return (
    <mesh position={at} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        emissive={emissive ?? "#000000"}
        emissiveIntensity={emissive ? 0.6 : 0}
        roughness={0.7}
      />
    </mesh>
  );
}

/** Small props that make each zone readable at a glance. */
function ZoneProps({ id }: { id: AuraPartId }) {
  const blink = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (blink.current)
      blink.current.emissiveIntensity =
        0.3 + 0.7 * Math.max(0, Math.sin(clock.elapsedTime * 3));
  });
  if (id === "hardware")
    return (
      <group>
        <Box size={[1.5, 0.08, 0.8]} at={[0, 0.5, 0]} color="#d9cbb3" />
        <Box size={[0.1, 0.5, 0.1]} at={[-0.65, 0.25, -0.3]} color={INK} />
        <Box size={[0.1, 0.5, 0.1]} at={[0.65, 0.25, 0.3]} color={INK} />
        <Box size={[0.55, 0.05, 0.4]} at={[-0.2, 0.57, 0.05]} color="#1f8a53" />
        <Box size={[0.45, 0.35, 0.3]} at={[0.45, 0.72, -0.15]} color={INK} />
        <mesh position={[0.45, 0.74, 0.01]}>
          <planeGeometry args={[0.34, 0.22]} />
          <meshStandardMaterial
            ref={blink}
            color={LIME}
            emissive={LIME}
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>
    );
  if (id === "software")
    return (
      <group>
        <Box size={[1.6, 0.08, 0.75]} at={[0, 0.5, 0]} color={PAPER} />
        <Box size={[0.1, 0.5, 0.6]} at={[-0.7, 0.25, 0]} color={INK} />
        <Box size={[0.1, 0.5, 0.6]} at={[0.7, 0.25, 0]} color={INK} />
        {[-0.38, 0.38].map((x) => (
          <group key={x} position={[x, 0.85, -0.18]} rotation={[0, -x, 0]}>
            <Box size={[0.66, 0.42, 0.04]} at={[0, 0, 0]} color={INK} />
            <mesh position={[0, 0, 0.025]}>
              <planeGeometry args={[0.58, 0.34]} />
              <meshStandardMaterial
                color={COBALT}
                emissive={COBALT}
                emissiveIntensity={0.7}
              />
            </mesh>
          </group>
        ))}
      </group>
    );
  if (id === "ailab")
    return (
      <group>
        {[-0.45, 0, 0.45].map((x) => (
          <group key={x} position={[x, 0.55, 0]}>
            <Box size={[0.32, 1.1, 0.45]} at={[0, 0, 0]} color={INK} />
            {[0.3, 0.1, -0.1, -0.3].map((y) => (
              <Box
                key={y}
                size={[0.2, 0.04, 0.02]}
                at={[0, y, 0.235]}
                color={ORANGE}
                emissive={ORANGE}
              />
            ))}
          </group>
        ))}
      </group>
    );
  return (
    <group>
      <Box size={[1.7, 1.1, 0.35]} at={[0, 0.55, -0.1]} color="#d9cbb3" />
      {Array.from({ length: 9 }, (_, i) => (
        <Box
          key={i}
          size={[0.12, 0.34 + (i % 3) * 0.06, 0.26]}
          at={[-0.62 + i * 0.155, 0.38 + (i % 3) * 0.03, 0.02]}
          color={[COBALT, ORANGE, LIME, INK, "#8a5cf6"][i % 5]}
        />
      ))}
      <Box size={[1.6, 0.04, 0.3]} at={[0, 0.62, 0]} color={INK} />
      {Array.from({ length: 7 }, (_, i) => (
        <Box
          key={i}
          size={[0.13, 0.3, 0.24]}
          at={[-0.55 + i * 0.18, 0.8, 0.02]}
          color={[LIME, COBALT, ORANGE, "#8a5cf6", INK][i % 5]}
        />
      ))}
    </group>
  );
}

const SHELL = "#fbfaf5";
const VISOR = "#15161d";
const EYE = "#8edbff";
/** Height of the companion's neck above the deck; the head pivots here. */
const NECK_Y = 1.4;
/** The companion is modelled about 2 units tall and drawn a little larger. */
const SCALE = 1.3;
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * A small hovering android standing in for AURA's companion. Its motion is
 * predefined: an idle hover and blink, a turn towards whatever is in focus
 * (the selected part, or the hop a request has reached), a short nod when the
 * focus changes, and a scanning visor while a request is travelling.
 */
function Companion({
  focus,
  routing,
  selected,
  hovered,
  paused,
}: {
  focus: AuraPartId;
  routing: boolean;
  selected: boolean;
  hovered: boolean;
  paused: boolean;
}) {
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Group>(null);
  const hands = useRef<THREE.Group>(null);
  const nod = useRef({ focus, start: -10 });
  const goal = useMemo(() => new THREE.Vector3(...auraPart(focus).at), [focus]);

  useFrame(({ clock, camera }, delta) => {
    const t = clock.elapsedTime;
    const b = body.current;
    const h = head.current;
    if (!b || !h) return;
    if (nod.current.focus !== focus) nod.current = { focus, start: t };
    const k = paused ? 1 : 1 - Math.exp(-delta * 5);
    // Look at the camera when the companion itself is selected.
    const at = focus === "companion" ? camera.position : goal;
    const flat = Math.hypot(at.x, at.z);
    if (flat > 0.4) b.rotation.y += wrapAngle(Math.atan2(at.x, at.z) - b.rotation.y) * k;
    const pitch = THREE.MathUtils.clamp(
      Math.atan2(at.y - (DECK_Y + (NECK_Y + 0.2) * SCALE), Math.max(flat, 0.6)),
      -0.5,
      0.25,
    );
    const p = (t - nod.current.start) / 0.5;
    const dip = p >= 0 && p <= 1 && !paused ? 0.22 * Math.sin(Math.PI * p) : 0;
    h.rotation.x += (-pitch + dip - h.rotation.x) * k;
    h.rotation.z = paused ? 0 : Math.sin(t * 0.7) * 0.04;
    b.position.y = paused ? 0 : Math.sin(t * 1.6) * 0.05;

    if (eyes.current) {
      eyes.current.visible = !routing;
      eyes.current.scale.y = !paused && t % 3.8 < 0.12 ? 0.15 : 1;
    }
    if (scan.current) {
      scan.current.visible = routing;
      scan.current.children.forEach((bar, i) => {
        bar.scale.y = 0.35 + 0.65 * Math.abs(Math.sin(t * 7 + i * 0.9));
      });
    }
    // Hands drift beside the body, and come forward while a request travels.
    hands.current?.children.forEach((hand, i) => {
      const side = i === 0 ? -1 : 1;
      const lift = paused ? 0 : Math.sin(t * 1.6 + 0.8 + i * 0.5) * 0.04;
      const z = routing ? 0.26 : 0.04;
      const y = (routing ? 1.0 : 0.82) + lift;
      hand.position.x += (side * (routing ? 0.42 : 0.5) - hand.position.x) * k;
      hand.position.y += (y - hand.position.y) * k;
      hand.position.z += (z - hand.position.z) * k;
    });
  });

  const accent = selected ? ORANGE : COBALT;
  return (
    <group position={[0, DECK_Y, 0]} scale={SCALE}>
      {/* the pad it hovers over */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[0.62, 0.66, 0.06, 48]} />
        <meshStandardMaterial color={INK} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, hovered || selected ? 0.03 : 0.018, 8, 64]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
      </mesh>
      <group ref={body}>
        <mesh position={[0, 0.8, 0]} scale={[1, 1, 0.82]} castShadow>
          <capsuleGeometry args={[0.3, 0.42, 8, 24]} />
          <meshStandardMaterial color={SHELL} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.64, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.82, 1]}>
          <torusGeometry args={[0.3, 0.028, 8, 48]} />
          <meshStandardMaterial color={INK} />
        </mesh>
        <mesh position={[0, 0.92, 0.25]}>
          <circleGeometry args={[0.075, 24]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={routing ? 1.2 : 0.7}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, NECK_Y - 0.06, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 0.16, 16]} />
          <meshStandardMaterial color={INK} />
        </mesh>
        <group ref={head} position={[0, NECK_Y, 0]}>
          <RoundedBox args={[0.66, 0.48, 0.52]} radius={0.16} smoothness={4} position={[0, 0.22, 0]} castShadow>
            <meshStandardMaterial color={SHELL} roughness={0.3} />
          </RoundedBox>
          <RoundedBox args={[0.54, 0.3, 0.06]} radius={0.06} smoothness={3} position={[0, 0.22, 0.25]}>
            <meshStandardMaterial color={VISOR} roughness={0.2} metalness={0.3} />
          </RoundedBox>
          <group ref={eyes} position={[0, 0.23, 0.285]}>
            {[-0.12, 0.12].map((x) => (
              <RoundedBox key={x} args={[0.1, 0.075, 0.02]} radius={0.03} smoothness={2} position={[x, 0, 0]}>
                <meshStandardMaterial color={EYE} emissive={EYE} emissiveIntensity={1.4} toneMapped={false} />
              </RoundedBox>
            ))}
          </group>
          <group ref={scan} position={[0, 0.22, 0.285]} visible={false}>
            {[-0.16, -0.08, 0, 0.08, 0.16].map((x) => (
              <mesh key={x} position={[x, 0, 0]}>
                <boxGeometry args={[0.045, 0.16, 0.02]} />
                <meshStandardMaterial color={LIME} emissive={LIME} emissiveIntensity={1.2} toneMapped={false} />
              </mesh>
            ))}
          </group>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.35, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.1, 0.1, 0.06, 24]} />
              <meshStandardMaterial color={ORANGE} roughness={0.4} />
            </mesh>
          ))}
          <mesh position={[0.15, 0.55, -0.05]}>
            <cylinderGeometry args={[0.014, 0.014, 0.2, 8]} />
            <meshStandardMaterial color={INK} />
          </mesh>
          <mesh position={[0.15, 0.67, -0.05]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial color={ORANGE} emissive={ORANGE} emissiveIntensity={0.6} />
          </mesh>
        </group>
        <group ref={hands}>
        {[-0.5, 0.5].map((x) => (
          <group key={x} position={[x, 0.82, 0.04]}>
            <RoundedBox args={[0.15, 0.2, 0.15]} radius={0.065} smoothness={3} castShadow>
              <meshStandardMaterial color={SHELL} roughness={0.35} />
            </RoundedBox>
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.065, 0.065, 0.035, 16]} />
              <meshStandardMaterial color={INK} />
            </mesh>
          </group>
        ))}
        </group>
      </group>
    </group>
  );
}

function Line({ from, to, color }: { from: THREE.Vector3; to: THREE.Vector3; color: string }) {
  const geometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([from, to]),
    [from, to],
  );
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} />
    </lineSegments>
  );
}

const anchor = (id: AuraPartId) => {
  const [x, y, z] = auraPart(id).at;
  if (id === "companion") return new THREE.Vector3(0, DECK_Y + 0.05, 0);
  if (id === "bridge") return new THREE.Vector3(0, DECK_Y, 0);
  return new THREE.Vector3(x, y + 0.05, z);
};
/** Where a hop sits when a packet travels through it. */
const hopPoint = (id: AuraPartId, leg: "down" | "up") =>
  id === "bridge"
    ? new THREE.Vector3(0, leg === "down" ? DECK_Y : NATIVE_Y + 0.4, 0)
    : anchor(id);

/** Background pulses on the documented links, plus the visitor's request. */
function Traffic({
  route,
  runId,
  onHop,
}: {
  route: AuraPartId[];
  runId: number;
  onHop: (index: number) => void;
}) {
  const packet = useRef<THREE.Mesh>(null);
  const state = useRef({ run: -1, t: 0, hop: -1 });
  const points = useMemo(() => {
    const half = Math.floor(route.length / 2);
    const out: THREE.Vector3[] = [];
    route.forEach((id, i) => {
      const leg = i <= half ? "down" : "up";
      if (id === "bridge") {
        const top = hopPoint("bridge", "down");
        const bottom = hopPoint("bridge", "up");
        out.push(...(leg === "down" ? [top, bottom] : [bottom, top]));
      } else out.push(hopPoint(id, leg));
    });
    return out;
  }, [route]);
  // index of each point in `route`, so hops can be reported as they happen
  const pointHop = useMemo(() => {
    const map: number[] = [];
    route.forEach((id, i) => {
      if (id === "bridge") map.push(i, i);
      else map.push(i);
    });
    return map;
  }, [route]);

  useFrame((_, delta) => {
    const s = state.current;
    const mesh = packet.current;
    if (!mesh) return;
    if (s.run !== runId) {
      s.run = runId;
      s.t = 0;
      s.hop = -1;
    }
    if (runId === 0 || points.length < 2) {
      mesh.visible = false;
      return;
    }
    s.t = Math.min(s.t + delta * 1.6, points.length - 1);
    const i = Math.min(Math.floor(s.t), points.length - 2);
    mesh.visible = s.t < points.length - 1;
    mesh.position.lerpVectors(points[i], points[i + 1], s.t - i);
    const reached = pointHop[Math.floor(s.t)];
    if (reached !== s.hop) {
      s.hop = reached;
      onHop(reached);
    }
  });
  return (
    <mesh ref={packet} visible={false}>
      <sphereGeometry args={[0.16, 16, 16]} />
      <meshStandardMaterial color={ORANGE} emissive={ORANGE} emissiveIntensity={0.8} />
    </mesh>
  );
}

function Idle() {
  const dots = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = dots.current;
    if (!g) return;
    g.children.forEach((child, i) => {
      const t = (clock.elapsedTime * 0.35 + i / g.children.length) % 1;
      child.position.y = DECK_Y - t * (DECK_Y - NATIVE_Y - 0.4);
      (child as THREE.Mesh).scale.setScalar(0.6 + 0.4 * Math.sin(t * Math.PI));
    });
  });
  return (
    <group ref={dots}>
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial color={LIME} emissive={LIME} emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

type Hover = (id: AuraPartId | null) => void;
/** Pointer handlers shared by every clickable part of the studio. */
const pickHandlers = (id: AuraPartId, onSelect: (id: AuraPartId) => void, onHover: Hover) => ({
  onClick: (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    onSelect(id);
  },
  onPointerOver: (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    document.body.style.cursor = "pointer";
    onHover(id);
  },
  onPointerOut: () => {
    document.body.style.cursor = "";
    onHover(null);
  },
});

function Selectable({
  id,
  selected,
  hovered,
  onSelect,
  onHover,
  children,
}: {
  id: AuraPartId;
  selected: AuraPartId;
  hovered: AuraPartId | null;
  onSelect: (id: AuraPartId) => void;
  onHover: Hover;
  children: React.ReactNode;
}) {
  const on = selected === id;
  return (
    <group position={auraPart(id).at} {...pickHandlers(id, onSelect, onHover)}>
      {children}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.95, on ? 1.12 : hovered === id ? 1.06 : 1.0, 48]} />
        <meshBasicMaterial color={on ? ORANGE : hovered === id ? COBALT : INK} />
      </mesh>
    </group>
  );
}

/** The point on each part that its annotation line points at. */
const labelPoint = (id: AuraPartId) => {
  const part = auraPart(id);
  const [x, y, z] = part.at;
  if (id === "bridge") return new THREE.Vector3(0.3, y, 0);
  if (id === "companion") return new THREE.Vector3(0, DECK_Y + 2.05 * SCALE, 0);
  return new THREE.Vector3(x, y + (part.layer === "native" ? 0.6 : 1.15), z);
};

export type LabelPoint = {
  id: AuraPartId;
  x: number;
  y: number;
  visible: boolean;
  /** Something solid sits between the camera and the point. */
  occluded: boolean;
};
type PlaceLabels = (points: LabelPoint[], width: number, height: number, canvas: HTMLElement) => void;

/** Visible, opaque meshes hide what is behind them; lines and glass do not. */
function isSolid(object: THREE.Object3D) {
  const mesh = object as THREE.Mesh;
  if (!mesh.isMesh) return false;
  const material = mesh.material as THREE.Material;
  if (material.transparent) return false;
  for (let o: THREE.Object3D | null = object; o; o = o.parent) if (!o.visible) return false;
  return true;
}

/**
 * Projects every annotation point to the screen once per rendered frame, and
 * every fourth frame checks whether the point is hidden behind the model.
 */
function LabelTracker({ place }: { place: PlaceLabels }) {
  const world = useMemo(() => auraParts.map((p) => labelPoint(p.id)), []);
  const out = useMemo<LabelPoint[]>(
    () => auraParts.map((p) => ({ id: p.id, x: 0, y: 0, visible: false, occluded: false })),
    [],
  );
  const v = useMemo(() => new THREE.Vector3(), []);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const frame = useRef(0);
  useFrame(({ camera, size, gl, scene }) => {
    const check = frame.current++ % 4 === 0;
    world.forEach((point, i) => {
      const o = out[i];
      if (check) {
        v.copy(point).sub(camera.position);
        const distance = v.length();
        ray.set(camera.position, v.normalize());
        ray.far = distance - 0.15;
        o.occluded = ray.intersectObjects(scene.children, true).some((hit) => isSolid(hit.object));
      }
      v.copy(point).project(camera);
      o.x = ((v.x + 1) / 2) * size.width;
      o.y = ((1 - v.y) / 2) * size.height;
      o.visible = v.z < 1;
    });
    place(out, size.width, size.height, gl.domElement);
  });
  return null;
}

export default function AuraCanvas({
  mode,
  paused,
  resetKey,
  selected,
  onSelect,
  route,
  runId,
  onHop,
  fallback,
  hovered,
  onHover,
  focus,
  overlay,
  placeLabels,
  busy,
}: {
  mode: SiteMode;
  paused: boolean;
  resetKey: number;
  selected: AuraPartId;
  onSelect: (id: AuraPartId) => void;
  route: AuraPartId[];
  runId: number;
  onHop: (index: number) => void;
  fallback: React.ReactNode;
  hovered: AuraPartId | null;
  onHover: Hover;
  /** What the companion looks at: the selected part, or a request's current hop. */
  focus: AuraPartId;
  overlay: React.ReactNode;
  placeLabels: PlaceLabels;
  busy: boolean;
}) {
  const services = auraParts.filter((p) => p.layer === "native" && p.id !== "router");
  const zones = auraParts.filter((p) => p.layer === "web" && p.id !== "companion");
  return (
    <Stage3D
      framing={framing}
      mode={mode}
      paused={paused}
      resetKey={resetKey}
      distance={[7, 22]}
      autoRotate
      busy={busy}
      label="3D model of AURA: four studio zones and a companion android on a top deck, joined by a bridge column to Swift services on a lower deck. Use the buttons beside it to select parts."
      fallback={fallback}
      overlay={overlay}
    >
      <LabelTracker place={placeLabels} />
      {/* web layer deck */}
      <mesh position={[0, DECK_Y - 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[4.4, 4.4, 0.2, 64]} />
        <meshStandardMaterial color={PAPER} />
      </mesh>
      <mesh position={[0, DECK_Y - 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.4, 0.04, 8, 96]} />
        <meshStandardMaterial color={mode === "creative" ? ORANGE : COBALT} />
      </mesh>
      {/* native layer deck */}
      <mesh position={[0, NATIVE_Y - 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[3.9, 3.9, 0.2, 6]} />
        <meshStandardMaterial color="#e7e2d6" />
      </mesh>
      {/* bridge column */}
      <group {...pickHandlers("bridge", onSelect, onHover)}>
        <mesh position={[0, (DECK_Y + NATIVE_Y) / 2 - 0.1, 0]}>
          <cylinderGeometry args={[0.3, 0.3, DECK_Y - NATIVE_Y - 0.2, 24, 1, true]} />
          <meshStandardMaterial
            color={selected === "bridge" ? ORANGE : COBALT}
            transparent
            opacity={hovered === "bridge" ? 0.55 : 0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      {!paused && <Idle />}
      {zones.map((zone) => (
        <group key={zone.id}>
          <Line from={anchor(zone.id)} to={anchor("bridge")} color={INK} />
          <Selectable id={zone.id} selected={selected} hovered={hovered} onSelect={onSelect} onHover={onHover}>
            <ZoneProps id={zone.id} />
          </Selectable>
        </group>
      ))}
      <group {...pickHandlers("companion", onSelect, onHover)}>
        <Companion
          focus={focus}
          routing={busy}
          selected={selected === "companion"}
          hovered={hovered === "companion"}
          paused={paused}
        />
      </group>
      <Selectable id="router" selected={selected} hovered={hovered} onSelect={onSelect} onHover={onHover}>
        <Box size={[0.9, 0.5, 0.9]} at={[0, 0.25, 0]} color={INK} />
      </Selectable>
      {services.map((service) => (
        <group key={service.id}>
          <Line from={anchor("router")} to={anchor(service.id)} color={INK} />
          <Selectable id={service.id} selected={selected} hovered={hovered} onSelect={onSelect} onHover={onHover}>
            <Box
              size={[0.8, 0.55, 0.8]}
              at={[0, 0.28, 0]}
              color={service.id === "github" ? COBALT : service.id === "ai" ? ORANGE : LIME}
            />
          </Selectable>
        </group>
      ))}
      <Traffic route={route} runId={runId} onHop={onHop} />
    </Stage3D>
  );
}
