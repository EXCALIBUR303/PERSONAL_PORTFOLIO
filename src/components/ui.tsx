"use client";
import type { ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";
import { motionTokens } from "./motion-config";
export function SectionLabel({
  number,
  children,
}: {
  number: string;
  children: ReactNode;
}) {
  return (
    <div className="section-label mono">
      <span>{number} /</span>
      {children}
    </div>
  );
}
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <m.div
      className={className}
      initial={reduced ? false : { y: 18, opacity: 1 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: reduced ? 0 : motionTokens.duration.reveal,
        ease: motionTokens.ease,
        delay: reduced ? 0 : delay,
      }}
    >
      {children}
    </m.div>
  );
}
