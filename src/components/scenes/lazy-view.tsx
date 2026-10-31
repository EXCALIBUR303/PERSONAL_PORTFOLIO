"use client";
import { useEffect, useState, type ComponentType } from "react";
import { SceneSkeleton, SkeletonSwap, type SceneVariant } from "../skeleton/primitives";

/**
 * A code-split component that renders at once when its chunk is already loaded.
 * `next/dynamic` always suspends first, and React keeps a fallback on screen for
 * about 300 ms before it reveals the result, even when the code is cached. That
 * showed as a loading message every time a mode switch rebuilt a scene. Here a
 * loaded chunk is used on the first render; only a first visit waits.
 *
 * While the chunk loads the region holds a skeleton with the scene's footprint
 * (components/skeleton): nothing shows for the first 150 ms, so a quick load
 * shows nothing at all; a longer one shows the skeleton, which leaves with a wipe
 * the moment the scene is there. `label` names the real operation for the one
 * status line that appears after a second.
 * A `null` label draws nothing while it loads (the caller has a skeleton of its own).
 * `preload()` fetches the chunk early (for example on intent to switch mode).
 */
export function lazyView<P extends object>(
  load: () => Promise<{ default: ComponentType<P> }>,
  label: string | null,
  variant: SceneVariant = "scene",
) {
  let loaded: ComponentType<P> | null = null;
  let pending: Promise<ComponentType<P>> | null = null;
  const preload = () => {
    pending ??= load().then(
      (module) => (loaded = module.default),
      (error) => {
        pending = null;
        throw error;
      },
    );
    return pending;
  };
  function View(props: P) {
    const [Loaded, setLoaded] = useState<ComponentType<P> | null>(() => loaded);
    useEffect(() => {
      if (Loaded) return;
      let live = true;
      preload().then(
        (component) => live && setLoaded(() => component),
        () => {},
      );
      return () => {
        live = false;
      };
    }, [Loaded]);
    if (label === null) return Loaded ? <Loaded {...props} /> : null;
    return (
      <SkeletonSwap ready={!!Loaded} skeleton={<SceneSkeleton variant={variant} />} label={label}>
        {Loaded && <Loaded {...props} />}
      </SkeletonSwap>
    );
  }
  View.preload = preload;
  return View;
}
