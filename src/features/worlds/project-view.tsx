"use client";
import type { ComponentProps } from "react";
import { useMode } from "@/components/mode";
import ProjectWorld from "./project-world";
import CreativeProjectWorld from "./creative-project";

/** One route, two presentations. Both receive the same project record. */
export default function ProjectView(
  props: ComponentProps<typeof ProjectWorld>,
) {
  const [mode] = useMode();
  return mode === "creative" ? (
    <CreativeProjectWorld {...props} />
  ) : (
    <ProjectWorld {...props} />
  );
}
