"use client";
import { lazyView } from "./lazy-view";
import type { SceneId } from "./catalog";


/**
 * Loads a scene's code and its 3D canvas code together, so the scene is built
 * in one step and shows no loading message once both are cached.
 */
const scene = (
  load: () => Promise<{ default: React.ComponentType; preloadCanvas: () => Promise<unknown> }>,
) =>
  lazyView(async () => {
    const loaded = await load();
    await loaded.preloadCanvas();
    return loaded;
  }, "Loading the scene");

// Each scene is its own chunk, so only the one on screen is downloaded.
export const views: Record<SceneId, ReturnType<typeof scene>> = {
  aura: scene(() => import("./aura-scene")),
  smartpark: scene(() => import("./smartpark-scene")),
  "private-ai": scene(() => import("./retrieval-scene")),
  mazera: scene(() => import("./maze-scene")),
  lastmile: scene(() => import("./lastmile-scene")),
  pathable: scene(() => import("./pathable-scene")),
  "robot-dog": scene(() => import("./dog-scene")),
  swarmmind: scene(() => import("./swarm-scene")),
  maintenance: scene(() => import("./maintenance-scene")),
  nexus: scene(() => import("./nexus-scene")),
};

/** The scene the Professional hero opens on, fetched before a switch back to it. */
export const preloadHeroScene = () => void views.aura.preload().catch(() => {});
