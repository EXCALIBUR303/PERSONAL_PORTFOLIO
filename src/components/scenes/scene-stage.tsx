"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Box } from "lucide-react";
import {
  accentOf,
  categories,
  sceneById,
  scenesIn,
  type CategoryId,
  type SceneId,
} from "./catalog";
import { views } from "./registry";

/** One scene with a plain statement of what it is and why it is here. */
export function SceneStage({ id }: { id: SceneId }) {
  const scene = sceneById(id);
  const View = views[id];
  return (
    <div
      className="lz"
      data-scene={id}
      style={{ "--station-accent": accentOf(scene.category) } as React.CSSProperties}
    >
      <header className="lz-head">
        <span className="lz-badge">{scene.badge}</span>
        <h2>{scene.title}</h2>
      </header>
      <View />
      <div className="lz-caption">
        <p>
          <b>What you are seeing.</b> {scene.seeing}
        </p>
        <p>
          <b>Why it is here.</b> {scene.why}
        </p>
        <Link href={`/projects/${scene.slug}/`} prefetch={false}>
          Open {scene.project}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/**
 * The visitor's category and scene, kept while they look at the other mode: a
 * mode switch rebuilds the hero, and it should come back where they left it.
 */
export const heroMemory: { category: CategoryId; chosen: Record<CategoryId, SceneId> } = {
  category: "systems",
  chosen: { systems: "aura", algorithms: "mazera", intelligence: "robot-dog" },
};

/** Category tabs, a scene picker inside each, and the chosen scene. */
export default function HeroScenes({
  onCategoryChange,
}: {
  onCategoryChange?: (category: CategoryId) => void;
}) {
  const [category, setCategory] = useState<CategoryId>(() => heroMemory.category);
  const [chosen, setChosen] = useState<Record<CategoryId, SceneId>>(() => heroMemory.chosen);
  const id = chosen[category];
  return (
    <div className="lz-explorer">
      <div className="hx-lenses" role="group" aria-label="Project category">
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={category === item.id}
            onClick={() => {
              setCategory(item.id);
              heroMemory.category = item.id;
              onCategoryChange?.(item.id);
            }}
            style={{ "--lens-accent": item.accent } as React.CSSProperties}
          >
            <item.icon size={17} aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </div>
      <div className="s3-picker" role="group" aria-label="Scene">
        <span className="mono">Scene</span>
        {scenesIn(category).map((scene) => (
          <button
            key={scene.id}
            type="button"
            aria-pressed={id === scene.id}
            onClick={() => {
              const next = { ...chosen, [category]: scene.id };
              heroMemory.chosen = next;
              setChosen(next);
            }}
          >
            {scene.is3d && <Box size={13} aria-hidden="true" />}
            {scene.name}
            {scene.is3d && <span className="sr-only"> (3D)</span>}
          </button>
        ))}
      </div>
      <SceneStage key={id} id={id} />
    </div>
  );
}
