import { useLayoutEffect, useRef } from "react";
import { paintCell } from "@/lib/studio/render";
import type { Dna, Pose } from "@/lib/studio/types";
import { CELL_H, CELL_W } from "@/lib/studio/types";

export function SpriteView({
  dna,
  pose,
  hitActive,
  className = "h-16 w-auto",
}: {
  dna: Dna;
  pose: Pose;
  hitActive: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    paintCell(canvas, dna, pose, { hitActive, facing: 1 });
  }, [dna, pose, hitActive]);
  return (
    <canvas
      ref={ref}
      width={CELL_W}
      height={CELL_H}
      aria-hidden
      className={`pixel ${className}`}
    />
  );
}
