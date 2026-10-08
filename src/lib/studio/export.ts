import { expandClip, getClip } from "./poses";
import { mirrorBox, renderFrame } from "./render";
import type { Box, ClipId, Dna, Tunes } from "./types";
import { CELL_H, CELL_W, CLIP_IDS } from "./types";

export type AtlasFrame = {
  index: number;
  col: number;
  phase: string;
  durationMs: number;
  hitActive: boolean;
  invuln: boolean;
  airborne: boolean;
  damage: number;
  hitstun: number;
  knockback: number;
  hit: Box | null;
  hurt: Box;
};

export type AtlasMeta = {
  app: "Cellwright";
  name: string;
  epithet: string;
  archetype: string;
  seed: number;
  note: string;
  facing: "right" | "left";
  cell: { w: number; h: number };
  origin: "top-left";
  clips: {
    id: ClipId;
    name: string;
    row: number;
    fps: number;
    loop: boolean;
    frames: AtlasFrame[];
  }[];
};

export function slug(name: string) {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return s || "fighter";
}

export function buildAtlas(dna: Dna, tunes: Tunes, note: string, facing: 1 | -1) {
  const rows = CLIP_IDS.map((id) => {
    const tune = tunes[id];
    const clip = expandClip(getClip(id, dna.archetype), tune);
    return { id, tune, clip };
  });
  const cols = Math.max(...rows.map((r) => r.clip.poses.length));
  const canvas = document.createElement("canvas");
  canvas.width = cols * CELL_W;
  canvas.height = rows.length * CELL_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the sheet");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const scratch = document.createElement("canvas");
  scratch.width = CELL_W;
  scratch.height = CELL_H;
  const sctx = scratch.getContext("2d");
  if (!sctx) throw new Error("Could not draw the sheet");

  const meta: AtlasMeta = {
    app: "Cellwright",
    name: dna.name,
    epithet: dna.epithet,
    archetype: dna.archetype,
    seed: dna.seed,
    note,
    facing: facing < 0 ? "left" : "right",
    cell: { w: CELL_W, h: CELL_H },
    origin: "top-left",
    clips: [],
  };

  rows.forEach((row, rowIndex) => {
    const frames: AtlasFrame[] = [];
    row.clip.poses.forEach((pose, index) => {
      const hitActive = row.clip.hitActive[index] ?? false;
      const rendered = renderFrame(dna, pose, hitActive);
      sctx.clearRect(0, 0, CELL_W, CELL_H);
      sctx.putImageData(rendered.image, 0, 0);
      ctx.save();
      const dx = index * CELL_W;
      const dy = rowIndex * CELL_H;
      ctx.translate(dx, dy);
      if (facing < 0) {
        ctx.translate(CELL_W, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(scratch, 0, 0);
      ctx.restore();
      frames.push({
        index,
        col: index,
        phase: row.clip.phases[index] ?? "recovery",
        durationMs: Math.round(1000 / row.clip.fps),
        hitActive,
        invuln: row.clip.invuln[index] ?? false,
        airborne: row.clip.airborne[index] ?? false,
        damage: hitActive ? row.tune.damage : 0,
        hitstun: hitActive ? row.tune.hitstun : 0,
        knockback: hitActive ? row.tune.knockback : 0,
        hit: rendered.contacts.hit ? mirrorBox(rendered.contacts.hit, facing) : null,
        hurt: mirrorBox(rendered.contacts.hurt, facing),
      });
    });
    meta.clips.push({
      id: row.id,
      name: row.tune.name,
      row: rowIndex,
      fps: row.clip.fps,
      loop: row.clip.loop,
      frames,
    });
  });

  return { canvas, meta };
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Empty sheet"));
    }, "image/png");
  });
}
