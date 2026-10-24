export const motionTokens = {
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  duration: { fast: 0.18, normal: 0.45, reveal: 0.7 },
  spring: { type: "spring" as const, stiffness: 220, damping: 26 },
};

/**
 * Microinteraction vocabulary for component UI. The same numbers exist as CSS
 * variables in micro.css (--mi-*), so Motion and plain CSS feel identical:
 *   hover   lift a surface a few pixels
 *   press   shrink slightly while held
 *   tilt    degrees a preview follows the pointer
 *   expand  open or close a panel
 *   enter   rise-in for a group, one item after another
 */
export const micro = {
  lift: -4,
  press: 0.97,
  tilt: 3,
  expand: 0.3,
  enter: { y: 16, stagger: 0.07 },
  /** Springs for things that follow a pointer or move between positions. */
  glide: { type: "spring" as const, stiffness: 420, damping: 34 },
};
