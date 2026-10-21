export const motionTokens = {
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  duration: { fast: 0.18, normal: 0.45, reveal: 0.7 },
  spring: { type: "spring" as const, stiffness: 220, damping: 26 },
};
