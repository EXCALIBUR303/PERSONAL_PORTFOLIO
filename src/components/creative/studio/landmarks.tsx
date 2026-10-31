import type { ReactNode } from "react";
import { Box, Cyl, LeftFace, Pole, Ramp, RightFace, Ring, Shadow, Slab, Sphere, TopFace, iso, poly } from "./iso";

/*
 * One landmark per project, drawn from what the project is. Each is a small
 * isometric model on its own footprint: base centre at (0, 0), about 90 units
 * across. Colour comes from the station's tone (--tone); everything else uses
 * the shared Creative paper and ink so the map reads as one place.
 */
const T = "var(--tone)";
const PAPER = "var(--c-card)";
const INK = "#2b2f45";
const LIME = "var(--c-lime)";
const ORANGE = "var(--c-orange)";
const SKY = "var(--c-sky)";
const BUTTER = "var(--c-butter)";
const PINK = "var(--c-pink)";
const PEACH = "var(--c-peach)";
const LILAC = "var(--c-lilac)";
const GRASS = "#9bd36b";

const line = { className: "iso-line" } as const;

function Car({ x, y, c, long = 13 }: { x: number; y: number; c: string; long?: number }) {
  return (
    <>
      <Box x={x} y={y} z={3} w={7} d={long} h={4} c={c} />
      <Box x={x + 0.5} y={y + 3} z={7} w={6} d={long - 7} h={3} c={PAPER} />
    </>
  );
}

const art: Record<string, () => ReactNode> = {
  /* ---------------- Systems ---------------- */
  aura: () => (
    <>
      <Shadow x={-26} y={-26} w={52} d={52} />
      <Slab x={-26} y={-26} w={52} d={52} h={4} c={PAPER} />
      <Box x={-22} y={-22} z={4} w={14} d={14} h={9} c={SKY} />
      <Box x={8} y={-22} z={4} w={14} d={14} h={9} c={LIME} />
      <Box x={-22} y={8} z={4} w={14} d={14} h={9} c={PINK} />
      <Cyl cx={0} cy={0} r={6} z={4} h={6} c={PAPER} />
      <Sphere cx={0} cy={0} z={10} r={8} c={LILAC} />
      <Ring cx={0} cy={0} z={10} r={13} />
      <Box x={8} y={8} z={4} w={14} d={14} h={9} c={BUTTER} />
    </>
  ),
  "smart-parking-dbms": () => (
    <>
      <Shadow x={-30} y={-20} w={60} d={40} />
      <Slab x={-30} y={-20} w={60} d={40} h={3} c={PAPER} />
      <Box x={-30} y={-20} z={3} w={60} d={3} h={20} c={T} />
      <LeftFace y={-17} z={3}>
        <rect x={-26} y={11} width={52} height={5} className="iso-decal-ink" />
        <rect x={-10} y={3} width={20} height={6} className="iso-decal-paper" />
      </LeftFace>
      <TopFace z={3}>
        {[-18, -6, 6, 18].map((u) => (
          <line key={u} x1={u} y1={-14} x2={u} y2={16} {...line} />
        ))}
      </TopFace>
      <Car x={-24} y={-10} c={ORANGE} />
      <Car x={-12} y={-10} c={SKY} />
      <Car x={12} y={-10} c={LILAC} />
      <Box x={-3} y={-12} z={3} w={10} d={16} h={0.6} c={LIME} />
      <Pole x={26} y={12} z={3} h={11} c={INK} s={2.4} />
      <Box x={14} y={11} z={12} w={13} d={2.2} h={2} c={ORANGE} />
    </>
  ),
  "private-local-ai": () => (
    <>
      <Shadow x={-26} y={-24} w={52} d={48} />
      <Slab x={-26} y={-24} w={52} d={48} h={3} c={PAPER} />
      <Cyl cx={-3} cy={-3} r={17} z={3} h={22} c={T} />
      <Cyl cx={-3} cy={-3} r={11} z={25} h={3} c={INK} />
      <Cyl cx={-3} cy={-3} r={3.5} z={28} h={3} c={BUTTER} />
      <Box x={-3 - 12} y={-3 - 1.2} z={30} w={24} d={2.4} h={2} c={PAPER} />
      <Box x={11} y={9} z={3} w={14} d={10} h={2} c={PAPER} />
      <Box x={12} y={10} z={5} w={14} d={10} h={2} c={PAPER} />
      <Box x={13} y={11} z={7} w={14} d={10} h={2} c={LIME} />
    </>
  ),
  "uco-recovery-station": () => (
    <>
      <Shadow x={-26} y={-22} w={52} d={44} />
      <Slab x={-26} y={-22} w={52} d={44} h={3} c={PAPER} />
      <Box x={-12} y={-12} z={3} w={16} d={16} h={30} c={T} />
      <LeftFace y={4} z={3}>
        <rect x={-9} y={16} width={10} height={9} className="iso-decal-ink" />
        <rect x={-7.5} y={17.5} width={7} height={4} className="iso-decal-lime" />
        <rect x={-9} y={7} width={10} height={4} className="iso-decal-paper" />
      </LeftFace>
      <Box x={-13} y={-13} z={33} w={18} d={18} h={3} c={INK} />
      <Cyl cx={14} cy={8} r={8} z={3} h={14} c={LIME} />
      <Cyl cx={14} cy={8} r={8.6} z={17} h={2.4} c={PAPER} />
      <Box x={4} y={6} z={3} w={7} d={1.6} h={1.2} c={INK} />
    </>
  ),
  "green-mobility": () => (
    <>
      <Shadow x={-30} y={-20} w={60} d={40} />
      <Slab x={-30} y={-20} w={60} d={40} h={3} c={PAPER} />
      <Box x={-24} y={-6} z={3} w={36} d={14} h={9} c={T} />
      <Box x={-22} y={-5} z={12} w={32} d={12} h={1.6} c={PAPER} />
      <LeftFace y={8} z={3}>
        {[-21, -14, -7, 0, 7].map((u) => (
          <rect key={u} x={u} y={3.6} width={5} height={3.4} className="iso-decal-ink" />
        ))}
      </LeftFace>
      <Pole x={20} y={-4} z={3} h={16} c={INK} s={3} />
      <Box x={17} y={-8} z={14} w={7} d={7} h={6} c={ORANGE} />
      <Pole x={-27} y={-17} z={3} h={9} c={INK} s={1.8} />
      <Sphere cx={-27} cy={-17} z={11} r={8} c={GRASS} />
      <Sphere cx={26} cy={14} z={3} r={5} c={GRASS} />
    </>
  ),
  lifeos: () => (
    <>
      <Shadow x={-22} y={-22} w={44} d={44} />
      <Slab x={-22} y={-22} w={44} d={44} h={6} c={BUTTER} />
      <Slab x={-17} y={-17} z={6} w={34} d={34} h={6} c={PINK} />
      <Slab x={-12} y={-12} z={12} w={24} d={24} h={6} c={SKY} />
      <Cyl cx={0} cy={0} r={6} z={18} h={4} c={INK} />
      <Sphere cx={0} cy={0} z={22} r={3.4} c={LIME} />
      <TopFace z={12}>
        <rect x={-14} y={9} width={5} height={5} className="iso-decal-paper" />
        <rect x={-6} y={9} width={5} height={5} className="iso-decal-lime" />
      </TopFace>
    </>
  ),
  "burnout-backend": () => (
    <>
      <Shadow x={-12} y={-12} w={24} d={24} />
      <Slab x={-18} y={-18} w={36} d={36} h={3} c={PAPER} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Box key={i} x={-10 + (i % 2)} y={-10} z={3 + i * 8} w={20} d={20} h={7} c={i % 2 ? T : PAPER} />
      ))}
      <LeftFace y={10} z={3}>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <rect x={-8 + (i % 2)} y={i * 8 + 2.4} width={9} height={2} className="iso-decal-ink" />
            <circle cx={9 + (i % 2)} cy={i * 8 + 3.4} r={1.1} className="iso-decal-lime" />
          </g>
        ))}
      </LeftFace>
    </>
  ),
  rupeerise: () => (
    <>
      <Shadow x={-26} y={-16} w={52} d={32} />
      <Slab x={-26} y={-16} w={52} d={32} h={3} c={PAPER} />
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} x={-23 + i * 11.5} y={-12} z={3} w={11} d={24} h={6 + i * 6} c={i === 3 ? BUTTER : T} />
      ))}
      <Cyl cx={19} cy={0} r={4.6} z={27} h={2.4} c={BUTTER} />
      <Cyl cx={19} cy={0} r={4.6} z={29.4} h={2.4} c={BUTTER} />
      <Cyl cx={19} cy={0} r={4.6} z={31.8} h={2.4} c={BUTTER} />
    </>
  ),

  /* ---------------- Algorithms ---------------- */
  "mazera-ai-maze-solver": () => (
    <>
      <Shadow x={-26} y={-26} w={52} d={52} />
      <Slab x={-26} y={-26} w={52} d={52} h={3} c={PAPER} />
      {/* outer wall with a gap at the entrance, then inner walls */}
      <Box x={-26} y={-26} z={3} w={52} d={3} h={9} c={T} />
      <Box x={-26} y={-23} z={3} w={3} d={49} h={9} c={T} />
      <Box x={-10} y={-14} z={3} w={36} d={3} h={9} c={T} />
      <Box x={-10} y={-14} z={3} w={3} d={20} h={9} c={T} />
      <Box x={-10} y={3} z={3} w={22} d={3} h={9} c={T} />
      <Box x={9} y={3} z={3} w={3} d={21} h={9} c={T} />
      <Box x={-23} y={14} z={3} w={22} d={3} h={9} c={T} />
      <Box x={23} y={-23} z={3} w={3} d={49} h={9} c={T} />
      <Box x={-24} y={22} z={3} w={50} d={3} h={9} c={T} />
      <Pole x={16} y={-6} z={3} h={14} c={INK} s={1.4} />
      <Box x={16.7} y={-6.7} z={11} w={7} d={1.4} h={4} c={ORANGE} />
      <Cyl cx={-17} cy={-8} r={3.4} z={3} h={1.4} c={LIME} />
    </>
  ),
  "last-mile-daa": () => (
    <>
      <Shadow x={-30} y={-22} w={60} d={44} />
      <Slab x={-30} y={-22} w={60} d={44} h={3} c={PAPER} />
      <Box x={-26} y={-18} z={3} w={26} d={18} h={14} c={T} />
      <Ramp x={-26} y={-18} z={17} w={26} d={18} h={0.001} c={PAPER} />
      <LeftFace y={0} z={3}>
        <rect x={-24} y={0} width={9} height={8} className="iso-decal-ink" />
        <rect x={-12} y={0} width={9} height={8} className="iso-decal-ink" />
        <rect x={-23} y={9} width={20} height={2.4} className="iso-decal-paper" />
      </LeftFace>
      <Box x={4} y={8} z={3} w={16} d={8} h={7} c={ORANGE} />
      <Box x={20} y={8} z={3} w={7} d={8} h={5} c={PAPER} />
      <Box x={8} y={-14} z={3} w={5} d={5} h={5} c={BUTTER} />
      <Box x={15} y={-12} z={3} w={5} d={5} h={5} c={BUTTER} />
      <Box x={9} y={-8} z={3} w={5} d={5} h={5} c={BUTTER} />
    </>
  ),
  pathable: () => (
    <>
      <Shadow x={-30} y={-22} w={60} d={44} />
      <Slab x={-30} y={-22} w={60} d={44} h={3} c={PAPER} />
      <Box x={-8} y={-20} z={3} w={30} d={18} h={22} c={T} />
      <LeftFace y={-2} z={3}>
        <rect x={-4} y={11} width={6} height={6} className="iso-decal-ink" />
        <rect x={4} y={11} width={6} height={6} className="iso-decal-ink" />
        <rect x={12} y={11} width={6} height={6} className="iso-decal-ink" />
        <rect x={5} y={0} width={8} height={9} className="iso-decal-paper" />
      </LeftFace>
      {/* steps and a ramp reach the same door */}
      <Box x={-26} y={-2} z={3} w={6} d={10} h={4} c={PAPER} />
      <Box x={-20} y={-2} z={3} w={6} d={10} h={8} c={PAPER} />
      <Box x={-14} y={-2} z={3} w={6} d={10} h={12} c={PAPER} />
      <Ramp x={-4} y={4} z={3} w={26} d={9} h={9} c={LIME} />
      <Sphere cx={-1} cy={9} z={3} r={2.6} c={ORANGE} />
    </>
  ),
  "parkscan-swarm": () => (
    <>
      <Shadow x={-30} y={-24} w={60} d={48} />
      <Slab x={-30} y={-24} w={60} d={48} h={3} c={PAPER} />
      <TopFace z={3}>
        {[-20, -8, 4, 16].map((u) => (
          <line key={u} x1={u} y1={-18} x2={u} y2={18} {...line} />
        ))}
      </TopFace>
      <Pole x={0} y={-14} z={3} h={26} c={INK} s={3} />
      <Cyl cx={0} cy={-14} r={7} z={29} h={2.4} c={T} />
      {[
        [-22, -8],
        [-10, 4],
        [10, 6],
        [20, -6],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <Box x={x} y={y} z={3} w={7} d={7} h={5} c={LIME} />
          <Pole x={x + 3.5} y={y + 3.5} z={8} h={4} c={INK} s={1} />
        </g>
      ))}
    </>
  ),
  "football-penalty-shootout": () => (
    <>
      <Shadow x={-28} y={-24} w={56} d={48} />
      <Slab x={-28} y={-24} w={56} d={48} h={3} c={GRASS} />
      <TopFace z={3}>
        <rect x={-14} y={6} width={28} height={12} className="iso-pitch-line" />
        <circle cx={0} cy={12} r={0.9} className="iso-decal-paper" />
      </TopFace>
      <Box x={-18} y={-16} z={3} w={36} d={9} h={0.8} c={PAPER} />
      <Pole x={-18} y={-16} z={3} h={17} c={PAPER} s={2.2} />
      <Pole x={18} y={-16} z={3} h={17} c={PAPER} s={2.2} />
      <Box x={-19} y={-17.1} z={19} w={38} d={2.2} h={2.2} c={PAPER} />
      <Box x={-17} y={-22} z={3} w={34} d={1.2} h={16} c={PAPER} />
      <Sphere cx={0} cy={11} z={3} r={4.2} c={PAPER} />
    </>
  ),

  /* ---------------- Intelligence ---------------- */
  swarmmind: () => (
    <>
      <Shadow x={-26} y={-26} w={52} d={52} />
      <Slab x={-26} y={-26} w={52} d={52} h={3} c={PAPER} />
      <TopFace z={3}>
        {[-20, -10, 0, 10, 20].flatMap((u) => [
          <line key={`a${u}`} x1={u} y1={-24} x2={u} y2={24} {...line} />,
          <line key={`b${u}`} x1={-24} y1={u} x2={24} y2={u} {...line} />,
        ])}
      </TopFace>
      {[
        [-16, -14],
        [8, -18],
        [-8, 8],
        [16, 4],
      ].map(([x, y]) => (
        <Box key={`${x}${y}`} x={x} y={y} z={3} w={6} d={6} h={5} c={T} />
      ))}
      <Ring cx={-5} cy={-5} z={3} r={13} />
      <Sphere cx={14} cy={16} z={3} r={3} c={ORANGE} />
    </>
  ),
  "quadruped-rl": () => (
    <>
      <Shadow x={-22} y={-10} w={44} d={24} />
      {[
        [-14, -6],
        [-14, 4],
        [8, -6],
        [8, 4],
      ].map(([x, y]) => (
        <Box key={`${x}${y}`} x={x} y={y} w={3.4} d={3.4} h={13} c={INK} />
      ))}
      <Box x={-18} y={-8} z={12} w={32} d={16} h={11} c={T} />
      <Box x={12} y={-5} z={18} w={11} d={10} h={10} c={T} />
      <Box x={20} y={-2} z={20} w={4} d={4} h={3} c={INK} />
      <Box x={14} y={-6} z={28} w={2.4} d={2.4} h={4} c={INK} />
      <Box x={14} y={3} z={28} w={2.4} d={2.4} h={4} c={INK} />
      <Box x={-22} y={-1} z={20} w={5} d={2.2} h={2.2} c={INK} />
    </>
  ),
  "predictive-maintenance": () => (
    <>
      <Shadow x={-30} y={-20} w={60} d={40} />
      <Slab x={-30} y={-20} w={60} d={40} h={3} c={PAPER} />
      <Box x={-9} y={-16} z={3} w={4} d={26} h={16} c={INK} />
      <Cyl cx={-14} cy={-3} r={12} z={3} h={7} c={T} />
      <Cyl cx={-14} cy={-3} r={9} z={10} h={14} c={T} />
      <Cyl cx={-14} cy={-3} r={12.6} z={24} h={3} c={INK} />
      <Cyl cx={-14} cy={-3} r={8} z={27} h={0.8} c={PAPER} />
      <Box x={14} y={-14} z={3} w={14} d={2.4} h={14} c={INK} />
      <LeftFace y={-11.6} z={3}>
        <polyline points="15,4 18,8 21,5 24,10 27,7" className="iso-decal-line" />
        <rect x={15} y={1.5} width={12} height={0.8} className="iso-decal-lime" />
      </LeftFace>
      <Cyl cx={16} cy={9} r={4.4} z={3} h={8} c={SKY} />
      <Cyl cx={16} cy={9} r={3.2} z={11} h={0.6} c={PAPER} />
    </>
  ),
  nexus: () => (
    <>
      <Shadow x={-24} y={-16} w={48} d={32} />
      <Slab x={-24} y={-16} w={48} d={32} h={3} c={PAPER} />
      <Box x={-18} y={-10} z={3} w={22} d={15} h={9} c={T} />
      <Box x={6} y={-10} z={3} w={12} d={8} h={5} c={INK} />
      <Ring cx={-7} cy={-2} r={13} z={3} />
      <Pole x={14} y={6} z={3} h={14} c={INK} s={1.6} />
      <Sphere cx={14} cy={6} z={17} r={2.6} c={LIME} />
    </>
  ),
  aeris: () => (
    <>
      <Shadow x={-14} y={-14} w={28} d={28} />
      <Pole x={0} y={0} z={0} h={0.4} c={PAPER} s={0.4} />
      <Ring cx={2} cy={2} r={15} className="iso-ring iso-ring-soft" />
      {/* arms along both diagonals, rotors at the ends, all hovering */}
      <Box x={-15} y={-1.2} z={26} w={30} d={2.4} h={1.6} c={INK} />
      <Box x={-1.2} y={-15} z={26} w={2.4} d={30} h={1.6} c={INK} />
      <Cyl cx={-15} cy={0} r={6} z={27} h={0.8} c={SKY} />
      <Cyl cx={0} cy={-15} r={6} z={27} h={0.8} c={SKY} />
      <Box x={-5.5} y={-5.5} z={22} w={11} d={11} h={7} c={T} />
      <Cyl cx={15} cy={0} r={6} z={27} h={0.8} c={SKY} />
      <Cyl cx={0} cy={15} r={6} z={27} h={0.8} c={SKY} />
      <Sphere cx={0} cy={0} z={17} r={2.6} c={ORANGE} />
    </>
  ),
  "resume-screener": () => (
    <>
      <Shadow x={-26} y={-22} w={52} d={44} />
      <Slab x={-26} y={-22} w={52} d={44} h={3} c={PAPER} />
      <Box x={-20} y={-14} z={3} w={26} d={20} h={2} c={PAPER} />
      <Box x={-18} y={-12} z={5} w={26} d={20} h={2} c={PAPER} />
      <Box x={-16} y={-10} z={7} w={26} d={20} h={2} c={PAPER} />
      <TopFace z={9}>
        {[-6, -1, 4, 9].map((v) => (
          <line key={v} x1={-12} y1={v} x2={6} y2={v} className="iso-decal-line" />
        ))}
      </TopFace>
      <Box x={12} y={-4} z={3} w={3} d={14} h={18} c={T} />
      <RightFace x={15} z={3}>
        <path d="M-1 12 L7 10 L7 6 L3 3 L-1 6 Z" transform="translate(0 0)" className="iso-decal-lime" />
        <path d="M1.4 7.6 L3 9 L6 5" className="iso-decal-line" />
      </RightFace>
    </>
  ),

  /* ---------------- shared / sketches ---------------- */
  "student-burnout-ai": () => (
    <>
      <Slab x={-26} y={-20} w={52} d={40} h={3} c={PAPER} />
      <Box x={-18} y={-12} z={3} w={4} d={24} h={4} c={INK} />
      <Box x={-20} y={-14} z={7} w={3} d={28} h={26} c={T} />
      <RightFace x={-17} z={7}>
        {[2, 7, 12, 17].map((v, i) => (
          <rect key={v} x={v + 4} y={4} width={3.4} height={[7, 12, 9, 15][i]} className="iso-decal-ink" />
        ))}
      </RightFace>
      <Box x={0} y={-4} z={3} w={18} d={14} h={2.4} c={PAPER} />
      <Sphere cx={6} cy={2} z={5.4} r={3.6} c={PINK} />
    </>
  ),
  sigsmith: () => (
    <>
      <Slab x={-28} y={-20} w={56} d={40} h={3} c={PAPER} />
      <Box x={-22} y={-14} z={3} w={4} d={28} h={14} c={INK} />
      <Box x={14} y={-14} z={3} w={4} d={28} h={14} c={INK} />
      <Ramp x={-22} y={-16} z={17} w={44} d={32} h={0.001} c={PAPER} />
      <Box x={-22} y={-16} z={16} w={44} d={32} h={2} c={T} />
      <Cyl cx={-6} cy={0} r={3.4} z={18} h={14} c={PAPER} />
    </>
  ),
};

/** The landmark for a station. A project without hand-drawn art still gets a plain block. */
export function landmarkArt(slug: string): ReactNode {
  const draw = art[slug];
  return draw ? draw() : <Box x={-14} y={-14} w={28} d={28} h={18} c={T} />;
}

/** Ground pad that shows how a station is entered, by its shape alone. */
export function Pad({ tier }: { tier: "exhibit" | "briefing" | "blueprint" }) {
  if (tier === "briefing") return null;
  const r = 38;
  return (
    <g className={`iso-pad iso-pad-${tier}`}>
      <Ring cx={0} cy={0} r={r / 1.2247} className="iso-pad-ring" />
      {tier === "exhibit" && <Ring cx={0} cy={0} r={r / 1.2247 - 5} className="iso-pad-inner" />}
    </g>
  );
}

/* ---------------- campus pieces ---------------- */

/** The Studio: a small two-storey building with a long window and a pennant. */
export function StudioBuilding() {
  return (
    <>
      <Shadow x={-28} y={-22} w={56} d={44} />
      <Slab x={-30} y={-24} w={60} d={48} h={3} c={PAPER} />
      <Box x={-22} y={-16} z={3} w={44} d={30} h={22} c={BUTTER} />
      <Box x={-14} y={-10} z={25} w={28} d={20} h={13} c={PEACH} />
      <Box x={-24} y={-18} z={38} w={48} d={34} h={0.01} c={PAPER} />
      <Box x={-26} y={-18} z={25} w={52} d={4} h={2.4} c={PAPER} />
      <LeftFace y={14} z={3}>
        {[-18, -9, 0, 9].map((u) => (
          <rect key={u} x={u} y={11} width={6} height={7} className="iso-decal-ink" />
        ))}
        <rect x={-20} y={0} width={9} height={10} className="iso-decal-paper" />
        <rect x={14} y={0} width={9} height={10} className="iso-decal-paper" />
      </LeftFace>
      <LeftFace y={10} z={25}>
        {[-10, -2, 6].map((u) => (
          <rect key={u} x={u} y={4} width={5} height={5} className="iso-decal-ink" />
        ))}
      </LeftFace>
      <Pole x={0} y={0} z={38} h={13} c={INK} s={1.4} />
      <Box x={0.6} y={-0.6} z={46} w={8} d={1.4} h={4.4} c={ORANGE} />
    </>
  );
}

/** A district plaza marker: a round pad with a pennant in the district's colour. */
export function HubFlag({ color }: { color: string }) {
  return (
    <>
      <Cyl cx={0} cy={0} r={9} h={2.4} c={PAPER} />
      <Pole x={0} y={0} z={2.4} h={20} c={INK} s={1.4} />
      <Box x={0.6} y={-0.7} z={16} w={9} d={1.4} h={5} c={color} />
    </>
  );
}

/** The entrance gate, where the visitor starts. */
export function Gate() {
  return (
    <>
      <Shadow x={-18} y={-4} w={36} d={8} />
      <Pole x={-14} y={0} h={22} c={INK} s={3.2} />
      <Pole x={14} y={0} h={22} c={INK} s={3.2} />
      <Box x={-16} y={-1.8} z={20} w={32} d={3.6} h={4} c={ORANGE} />
    </>
  );
}

/* re-exports used by the plate artwork */
export { iso, poly };
