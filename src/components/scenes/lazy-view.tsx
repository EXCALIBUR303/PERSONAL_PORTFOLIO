"use client";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";

/**
 * A code-split component that renders at once when its chunk is already loaded.
 * `next/dynamic` always suspends first, and React keeps a fallback on screen for
 * about 300 ms before it reveals the result, even when the code is cached. That
 * showed as a loading message every time a mode switch rebuilt a scene. Here a
 * loaded chunk is used on the first render; only a first visit shows `loading`.
 * `preload()` fetches the chunk early (for example on intent to switch mode).
 */
export function lazyView<P extends object>(
  load: () => Promise<{ default: ComponentType<P> }>,
  loading: () => ReactNode,
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
    return Loaded ? <Loaded {...props} /> : loading();
  }
  View.preload = preload;
  return View;
}
