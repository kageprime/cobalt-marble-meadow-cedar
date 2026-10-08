import type { ArchetypeId, ClipId, Dna, MoveTune, Tunes } from "./types";
import { ARCHETYPES, CLIP_IDS } from "./types";

type Swatch = {
  skin: string;
  cloth: string;
  cloth2: string;
  metal: string;
  accent: string;
  eye: string;
};

const PALETTES: Record<ArchetypeId, Swatch[]> = {
  knight: [
    { skin: "#e4b48c", cloth: "#243044", cloth2: "#8f2d2a", metal: "#d5d8e0", accent: "#e24b2a", eye: "#1a120c" },
    { skin: "#c98962", cloth: "#2a3330", cloth2: "#1e4a38", metal: "#c6b48a", accent: "#d7a15c", eye: "#1c140f" },
    { skin: "#f0d2b0", cloth: "#4a2c3a", cloth2: "#1c1a24", metal: "#e6e1d6", accent: "#c9a227", eye: "#241418" },
  ],
  duelist: [
    { skin: "#f0c7a4", cloth: "#1d2c38", cloth2: "#c4553a", metal: "#e7e2d8", accent: "#e24b2a", eye: "#14202a" },
    { skin: "#e8b892", cloth: "#2b2430", cloth2: "#d6c07a", metal: "#f4efe6", accent: "#8e3a4a", eye: "#1a1216" },
    { skin: "#c98668", cloth: "#16342e", cloth2: "#efe6d4", metal: "#d9d3c6", accent: "#d4652f", eye: "#10211c" },
  ],
  mage: [
    { skin: "#e7c3a2", cloth: "#2a2148", cloth2: "#6d4a8a", metal: "#c8c2d4", accent: "#7fd0c4", eye: "#d7fff4" },
    { skin: "#f1d0b4", cloth: "#3a241c", cloth2: "#a33b24", metal: "#e6d3b0", accent: "#f0a05a", eye: "#2a160f" },
    { skin: "#d7b08e", cloth: "#1c3044", cloth2: "#d8deea", metal: "#b9c4d4", accent: "#e24b2a", eye: "#d6ecff" },
  ],
  ranger: [
    { skin: "#d9a882", cloth: "#3d4a32", cloth2: "#6a5338", metal: "#c2b8a2", accent: "#d7a15c", eye: "#1c2414" },
    { skin: "#e6b896", cloth: "#3a322c", cloth2: "#8d3d32", metal: "#ddd4c4", accent: "#e7d7b0", eye: "#241810" },
    { skin: "#c98b6a", cloth: "#243028", cloth2: "#1a1e18", metal: "#b7c0b0", accent: "#c9d48a", eye: "#101810" },
  ],
  bruiser: [
    { skin: "#c47a52", cloth: "#3a2a28", cloth2: "#1a1a1c", metal: "#b8b2a8", accent: "#e24b2a", eye: "#1a100c" },
    { skin: "#e0a888", cloth: "#2c3338", cloth2: "#5c6a72", metal: "#d5dbe0", accent: "#8fd0d8", eye: "#14181c" },
    { skin: "#a86b48", cloth: "#4a2e24", cloth2: "#d8c4a4", metal: "#c8b090", accent: "#f0c14a", eye: "#1c100c" },
  ],
  automaton: [
    { skin: "#8a9298", cloth: "#2c3438", cloth2: "#1a1e22", metal: "#d5dadf", accent: "#e24b2a", eye: "#ffb089" },
    { skin: "#b7a48a", cloth: "#3a3428", cloth2: "#1e1a14", metal: "#efe6d2", accent: "#7fd0c4", eye: "#d8fff6" },
    { skin: "#6e7680", cloth: "#242830", cloth2: "#3e4a62", metal: "#c5ccd6", accent: "#f2d15a", eye: "#fff1b8" },
  ],
  wraith: [
    { skin: "#c8d0d4", cloth: "#1c2430", cloth2: "#3a4658", metal: "#dfe6ea", accent: "#9ee7d8", eye: "#d8fff6" },
    { skin: "#d8c8c4", cloth: "#2a1c24", cloth2: "#4a3040", metal: "#e6d8d4", accent: "#e24b2a", eye: "#ffd0c4" },
    { skin: "#b7c4b8", cloth: "#1a2420", cloth2: "#2e4038", metal: "#d5e0d8", accent: "#d6e38a", eye: "#f4ffd0" },
  ],
  beast: [
    { skin: "#c4844c", cloth: "#3a2c22", cloth2: "#1e1814", metal: "#e6d2b4", accent: "#e24b2a", eye: "#f0d48a" },
    { skin: "#8a8f86", cloth: "#2a302c", cloth2: "#141816", metal: "#d5d8d2", accent: "#9ee7d8", eye: "#e8ffe8" },
    { skin: "#d8b48a", cloth: "#4a3828", cloth2: "#2a2018", metal: "#f0e2cc", accent: "#c9a05a", eye: "#2a1c10" },
  ],
};

const FIRST = [
  "Mara", "Vesper", "Cas", "Ivo", "Nim", "Sable", "Quill", "Orin", "Bran", "Lark",
  "Hex", "Pell", "Wren", "Tor", "Ash", "Nyx", "Cade", "Rio", "Sol", "Vetch",
];
const LAST = [
  "Voss", "Kade", "Marrow", "Quinn", "Hale", "Pike", "Dorn", "Ash", "Bell", "Moss",
  "Vale", "Crowe", "Thorn", "Myre", "Locke", "Reed", "Sable", "Wick",
];
const EPITHETS = [
  "the Red Ledger",
  "the Quiet Mile",
  "the Last Lamp",
  "the Unspent",
  "the Third Bell",
  "the Salt Hymn",
  "the Broken Oath",
  "the Hollow Crown",
  "the Short Fuse",
  "the Paper Saint",
  "the Low Gate",
  "the Even Hand",
  "the Cold Gallery",
  "the Second Mouth",
  "the Dry Season",
];

const NOTES: Record<ArchetypeId, string[]> = {
  knight: [
    "Short tells, then the whole blade. Recovery is the price of the oath.",
    "Plants the front foot and spends the rest of the bar on steel.",
  ],
  duelist: [
    "Lives in the gap between startup and someone else's active frames.",
    "The point arrives before the shoulder does.",
  ],
  mage: [
    "The body barely moves. The hitbox does not share that restraint.",
    "Casts late, recovers later, and expects you to respect both.",
  ],
  ranger: [
    "Draws on the back foot. The arrow is the active frame.",
    "Keeps the string quiet until the last cell.",
  ],
  bruiser: [
    "Crouches like the floor owes them money, then leaves it.",
    "Uppercut trades space for a pile of hitstun.",
  ],
  automaton: [
    "The cannon arm does not telegraph so much as announce.",
    "Segments lock, then the whole limb becomes a hitbox.",
  ],
  wraith: [
    "Rises through the swing. The hurtbox follows a moment late.",
    "Cloth leads, steel follows, feet are a rumor.",
  ],
  beast: [
    "Two swipes, no apology, a tail that lies about the hurtbox.",
    "Closes with the shoulder and finishes with the claws.",
  ],
};

const MOVE_NAMES: Record<ArchetypeId, Partial<Record<ClipId, string>>> = {
  knight: { dash: "Shield Rush", jab: "Pommel", heavy: "Oath Arc", special: "Citadel Break", block: "Tower", hurt: "Stagger", ko: "Curtain" },
  duelist: { dash: "Slip", jab: "Needle", heavy: "Ribbon", special: "Quiet Mile", block: "Parry", hurt: "Touch", ko: "Curtain" },
  mage: { dash: "Step Aside", jab: "Spark", heavy: "Bell Toll", special: "Held Star", block: "Ward", hurt: "Backlash", ko: "Snuff" },
  ranger: { dash: "Brush", jab: "Nick", heavy: "Wide Draw", special: "Long Pin", block: "Guard", hurt: "Flinch", ko: "Drop" },
  bruiser: { dash: "Shoulder", jab: "Jab", heavy: "Cleaver", special: "Roof", block: "Shell", hurt: "Rocked", ko: "Down" },
  automaton: { dash: "Rail", jab: "Stamp", heavy: "Press", special: "Vent", block: "Plate", hurt: "Fault", ko: "Shutdown" },
  wraith: { dash: "Skim", jab: "Snag", heavy: "Hem", special: "Rising Hem", block: "Shroud", hurt: "Tear", ko: "Unwind" },
  beast: { dash: "Pounce", jab: "Snap", heavy: "Rake", special: "Twice", block: "Bristle", hurt: "Yelp", ko: "Sprawl" },
};

const BASE_NAMES: Record<ClipId, string> = {
  idle: "Breath",
  walk: "Advance",
  dash: "Dash",
  jump: "Rise",
  jab: "Light",
  heavy: "Heavy",
  special: "Special",
  hurt: "Hurt",
  block: "Block",
  ko: "Fall",
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)]!;
}

export function defaultTunes(archetype: ArchetypeId): Tunes {
  const names = MOVE_NAMES[archetype];
  const combat: Partial<Record<ClipId, Pick<MoveTune, "damage" | "hitstun" | "knockback">>> = {
    jab: { damage: 7, hitstun: 12, knockback: 3 },
    heavy: { damage: 16, hitstun: 22, knockback: 7 },
    special: { damage: 22, hitstun: 26, knockback: 9 },
  };
  const tunes = {} as Tunes;
  for (const id of CLIP_IDS) {
    const c = combat[id];
    tunes[id] = {
      name: names[id] ?? BASE_NAMES[id],
      damage: c?.damage ?? 0,
      hitstun: c?.hitstun ?? 0,
      knockback: c?.knockback ?? 0,
      windup: 0,
      recoverPad: 0,
    };
  }
  return tunes;
}

export function describeFighter(dna: Dna): string {
  const line = NOTES[dna.archetype][dna.seed % NOTES[dna.archetype].length]!;
  return `${dna.name}, ${dna.epithet}. ${line}`;
}

export function makeDna(seed: number, force?: ArchetypeId): Dna {
  const rng = mulberry32(seed);
  const archetype = force ?? pick(rng, ARCHETYPES);
  const swatch = pick(rng, PALETTES[archetype]);
  const first = pick(rng, FIRST);
  const last = pick(rng, LAST);
  const capeBase: Record<ArchetypeId, number> = {
    knight: 0.85,
    duelist: 0.15,
    mage: 0.35,
    ranger: 0.55,
    bruiser: 0.1,
    automaton: 0.05,
    wraith: 0.95,
    beast: 0.05,
  };
  const helmBase: Record<ArchetypeId, number> = {
    knight: 0.9,
    duelist: 0.2,
    mage: 0.15,
    ranger: 0.7,
    bruiser: 0.05,
    automaton: 1,
    wraith: 0.2,
    beast: 0,
  };
  return {
    seed: seed >>> 0,
    name: `${first} ${last}`,
    epithet: pick(rng, EPITHETS),
    archetype,
    ...swatch,
    bulk: clamp01(0.35 + rng() * 0.5),
    height: clamp01(0.35 + rng() * 0.5),
    weaponScale: clamp01(0.4 + rng() * 0.5),
    cape: rng() < capeBase[archetype],
    helm: rng() < helmBase[archetype],
    horns: archetype === "beast" || archetype === "wraith" ? rng() < 0.55 : rng() < 0.12,
  };
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, Math.round(n * 100) / 100));
}

export const BOOT_DNA: Dna = {
  seed: 0xc3117e,
  name: "Mara Voss",
  epithet: "the Red Ledger",
  archetype: "knight",
  skin: "#e4b48c",
  cloth: "#243044",
  cloth2: "#8f2d2a",
  metal: "#d5d8e0",
  accent: "#e24b2a",
  eye: "#1a120c",
  bulk: 0.62,
  height: 0.58,
  weaponScale: 0.74,
  cape: true,
  helm: true,
  horns: false,
};

export function rerollColors(dna: Dna, salt: number): Dna {
  const swatch = PALETTES[dna.archetype][Math.abs(salt) % PALETTES[dna.archetype].length]!;
  return { ...dna, ...swatch, seed: (dna.seed ^ salt) >>> 0 };
}
