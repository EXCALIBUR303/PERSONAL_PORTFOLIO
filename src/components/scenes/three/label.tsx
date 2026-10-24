"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

/** Pill-shaped text label drawn to a canvas, used as an always-readable sprite. */
function useLabel(text: string, tone = "#17171d") {
  const made = useMemo(() => {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d")!;
    const font = "700 34px Inter, system-ui, sans-serif";
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(text).width) + 36;
    c.width = w;
    c.height = 56;
    ctx.font = font;
    ctx.fillStyle = "#fffdf6";
    ctx.strokeStyle = tone;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(3, 3, w - 6, 50, 25);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = tone;
    ctx.textBaseline = "middle";
    ctx.fillText(text, 18, 30);
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    return { texture, aspect: w / 56 };
  }, [text, tone]);
  useEffect(() => () => made.texture.dispose(), [made]);
  return made;
}

export function Tag({ text, position, tone, height = 0.52 }: { text: string; position: [number, number, number]; tone?: string; height?: number }) {
  const { texture, aspect } = useLabel(text, tone);
  return (
    <sprite position={position} scale={[height * aspect, height, 1]} renderOrder={10}>
      <spriteMaterial map={texture} depthTest={false} transparent />
    </sprite>
  );
}

