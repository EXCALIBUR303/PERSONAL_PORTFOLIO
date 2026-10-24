"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
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
  pro: { position: [9.5, 7.5, 9.5], target: [0, 0.4, 0] },
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

function Companion({ selected }: { selected: boolean }) {
  const core = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (core.current) {
      core.current.rotation.y = t * 0.6;
      core.current.position.y = Math.sin(t * 1.6) * 0.12;
    }
    if (ring.current) ring.current.rotation.z = t * 0.9;
  });
  return (
    <group position={auraPart("companion").at}>
      <mesh ref={core} castShadow>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color={selected ? ORANGE : COBALT}
          flatShading
          roughness={0.35}
        />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[0.72, 0.025, 8, 64]} />
        <meshStandardMaterial color={INK} />
      </mesh>
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

function Selectable({
  id,
  selected,
  onSelect,
  children,
}: {
  id: AuraPartId;
  selected: AuraPartId;
  onSelect: (id: AuraPartId) => void;
  children: React.ReactNode;
}) {
  const part = auraPart(id);
  return (
    <group
      position={id === "companion" ? [0, 0, 0] : part.at}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(id);
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      {children}
      {id !== "companion" && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.95, selected === id ? 1.12 : 1.0, 48]} />
            <meshBasicMaterial color={selected === id ? ORANGE : INK} />
          </mesh>
        </>
      )}
    </group>
  );
}

/** Where each part's label sits in the scene. */
const labelPoint = (id: AuraPartId) => {
  const part = auraPart(id);
  const [x, y, z] = part.at;
  if (id === "bridge") return new THREE.Vector3(0.75, y, 0);
  if (id === "companion") return new THREE.Vector3(x, y + 0.85, z);
  return new THREE.Vector3(x, y + (part.layer === "native" ? 1.0 : 1.55), z);
};

/** Projects label points to the screen and moves the DOM labels to them. */
type PlaceLabel = (id: string, x: number, y: number, visible: boolean) => void;
function LabelTracker({ place }: { place: PlaceLabel }) {
  const points = useMemo(() => auraParts.map((p) => [p.id, labelPoint(p.id)] as const), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    for (const [id, point] of points) {
      v.copy(point).project(camera);
      place(id, ((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height, v.z < 1);
    }
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
  labels,
  placeLabel,
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
  labels: (id: string, node: HTMLSpanElement | null) => void;
  placeLabel: PlaceLabel;
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
      label="3D model of AURA: four studio zones and a companion on a top deck, joined by a bridge column to Swift services on a lower deck. Use the buttons beside it to select parts."
      fallback={fallback}
      overlay={
        <div className="s3-labels" aria-hidden="true">
          {auraParts.map((p) => (
            <span
              key={p.id}
              className="s3-label"
              data-active={selected === p.id || undefined}
              ref={(node) => labels(p.id, node)}
            >
              {p.label}
            </span>
          ))}
        </div>
      }
    >
      <LabelTracker place={placeLabel} />
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
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelect("bridge");
        }}
      >
        <mesh position={[0, (DECK_Y + NATIVE_Y) / 2 - 0.1, 0]}>
          <cylinderGeometry args={[0.3, 0.3, DECK_Y - NATIVE_Y - 0.2, 24, 1, true]} />
          <meshStandardMaterial
            color={selected === "bridge" ? ORANGE : COBALT}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>

      </group>
      {!paused && <Idle />}
      {zones.map((zone) => (
        <group key={zone.id}>
          <Line from={anchor(zone.id)} to={anchor("bridge")} color={INK} />
          <Selectable id={zone.id} selected={selected} onSelect={onSelect}>
            <ZoneProps id={zone.id} />
          </Selectable>
        </group>
      ))}
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelect("companion");
        }}
      >
        <Companion selected={selected === "companion"} />
      </group>
      <Selectable id="router" selected={selected} onSelect={onSelect}>
        <Box size={[0.9, 0.5, 0.9]} at={[0, 0.25, 0]} color={INK} />
      </Selectable>
      {services.map((service) => (
        <group key={service.id}>
          <Line from={anchor("router")} to={anchor(service.id)} color={INK} />
          <Selectable id={service.id} selected={selected} onSelect={onSelect}>
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
