import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isHex } from "./color";
import type { ArchetypeId, Dna, MoveTune, Tunes } from "./types";
import { ARCHETYPES } from "./types";
import { defaultTunes } from "./dna";

const Input = z.object({
  vibe: z.string().max(400).optional(),
});

export type CommissionPayload = {
  dna: Dna;
  tunes: Tunes;
  note: string;
};

export type CommissionResponse = { ok: true; payload: CommissionPayload } | { ok: false; error: string };

const Move = z.object({
  name: z.string().min(1).max(40),
  damage: z.number(),
  hitstun: z.number(),
  knockback: z.number(),
});

const Output = z.object({
  name: z.string().min(1).max(48),
  epithet: z.string().min(1).max(48),
  archetype: z.enum(ARCHETYPES),
  note: z.string().min(1).max(220),
  colors: z.object({
    skin: z.string(),
    cloth: z.string(),
    cloth2: z.string(),
    metal: z.string(),
    accent: z.string(),
    eye: z.string(),
  }),
  bulk: z.number(),
  height: z.number(),
  weaponScale: z.number(),
  cape: z.boolean(),
  helm: z.boolean(),
  horns: z.boolean(),
  moves: z.object({
    jab: Move,
    heavy: Move,
    special: Move,
  }),
});

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function clampInt(n: number, min: number, max: number) {
  return Math.round(clamp(n, min, max));
}

function swatch(value: string, fallback: string) {
  return isHex(value) ? value.toLowerCase() : fallback;
}

export const commissionFighter = createServerFn({ method: "POST" })
  .validator(Input)
  .handler(async ({ data }): Promise<CommissionResponse> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "The desk is offline in this sitting." };

    const vibe = (data.vibe ?? "").trim();
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.9,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You commission original fighters for Cellwright, a sprite and moveset desk. Reply with JSON only. " +
              "Fields: name (2-3 words), epithet (starts with 'the '), archetype (knight|duelist|mage|ranger|bruiser|automaton|wraith|beast), " +
              "note (one sentence, under 180 characters, about timing and how they fight), " +
              "colors {skin, cloth, cloth2, metal, accent, eye} as #RRGGBB, saturated enough to separate cloth from metal, no neon rainbow, " +
              "bulk, height, weaponScale as numbers from 0 to 1, cape, helm, horns as booleans, " +
              "moves.jab, moves.heavy, moves.special each with name, damage, hitstun, knockback. " +
              "Jab damage 4-12, hitstun 8-18, knockback 1-6. Heavy damage 12-24, hitstun 16-30, knockback 4-12. " +
              "Special damage 16-32, hitstun 18-36, knockback 6-16. Invent an original fighter. No existing game characters.",
          },
          {
            role: "user",
            content: vibe ? `Vibe: ${vibe}` : "Surprise the desk. No vibe was given.",
          },
        ],
      }),
    });

    if (!res.ok) return { ok: false, error: `The desk could not answer (${res.status}).` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content ?? "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end < start) return { ok: false, error: "The desk sent back an unreadable note." };

    let parsed: unknown;
    try {
      parsed = JSON.parse(text.slice(start, end + 1));
    } catch {
      return { ok: false, error: "The desk sent back an unreadable note." };
    }
    const check = Output.safeParse(parsed);
    if (!check.success) return { ok: false, error: "The commission was missing pieces. Try again." };

    const row = check.data;
    const archetype = row.archetype as ArchetypeId;
    const base = defaultTunes(archetype);
    const fallback = {
      skin: "#e4b48c",
      cloth: "#243044",
      cloth2: "#8f2d2a",
      metal: "#d5d8e0",
      accent: "#e24b2a",
      eye: "#1a120c",
    };
    const colors = {
      skin: swatch(row.colors.skin, fallback.skin),
      cloth: swatch(row.colors.cloth, fallback.cloth),
      cloth2: swatch(row.colors.cloth2, fallback.cloth2),
      metal: swatch(row.colors.metal, fallback.metal),
      accent: swatch(row.colors.accent, fallback.accent),
      eye: swatch(row.colors.eye, fallback.eye),
    };
    const seed = (Math.floor(Math.random() * 0xffffffff) ^ Date.now()) >>> 0;
    const dna: Dna = {
      seed,
      name: row.name.replace(/\s+/g, " ").trim(),
      epithet: row.epithet.replace(/\s+/g, " ").trim(),
      archetype,
      ...colors,
      bulk: clamp(row.bulk, 0, 1),
      height: clamp(row.height, 0, 1),
      weaponScale: clamp(row.weaponScale, 0, 1),
      cape: row.cape,
      helm: row.helm,
      horns: row.horns,
    };

    const tune = (move: z.infer<typeof Move>, limits: { d: [number, number]; h: [number, number]; k: [number, number] }): Pick<MoveTune, "name" | "damage" | "hitstun" | "knockback"> => ({
      name: move.name.replace(/\s+/g, " ").trim(),
      damage: clampInt(move.damage, limits.d[0], limits.d[1]),
      hitstun: clampInt(move.hitstun, limits.h[0], limits.h[1]),
      knockback: clampInt(move.knockback, limits.k[0], limits.k[1]),
    });

    const tunes: Tunes = {
      ...base,
      jab: { ...base.jab, ...tune(row.moves.jab, { d: [4, 12], h: [8, 18], k: [1, 6] }) },
      heavy: { ...base.heavy, ...tune(row.moves.heavy, { d: [12, 24], h: [16, 30], k: [4, 12] }) },
      special: { ...base.special, ...tune(row.moves.special, { d: [16, 32], h: [18, 36], k: [6, 16] }) },
    };

    return { ok: true, payload: { dna, tunes, note: row.note.trim() } };
  });
