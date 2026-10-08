export const CELL_W = 96;
export const CELL_H = 112;
export const GROUND_Y = 100;
export const ORIGIN_X = 40;

export const ARCHETYPES = [
  "knight",
  "duelist",
  "mage",
  "ranger",
  "bruiser",
  "automaton",
  "wraith",
  "beast",
] as const;

export type ArchetypeId = (typeof ARCHETYPES)[number];

export const CLIP_IDS = [
  "idle",
  "walk",
  "dash",
  "jump",
  "jab",
  "heavy",
  "special",
  "hurt",
  "block",
  "ko",
] as const;

export type ClipId = (typeof CLIP_IDS)[number];

export type Phase = "startup" | "active" | "recovery" | "loop";

export type Fx = "none" | "dust" | "slash" | "spark" | "shock" | "block";

export type Pose = {
  x: number;
  /** Extra lift in pixels. Positive leaves the ground. */
  lift: number;
  torso: number;
  head: number;
  thighF: number;
  shinF: number;
  thighB: number;
  shinB: number;
  armF: number;
  forearmF: number;
  armB: number;
  forearmB: number;
  /** Absolute weapon angle. 0 is down, positive swings toward the facing side. */
  weapon: number;
  squash: number;
  sway: number;
  fx: Fx;
};

export type Box = { x: number; y: number; w: number; h: number };

export type Dna = {
  seed: number;
  name: string;
  epithet: string;
  archetype: ArchetypeId;
  skin: string;
  cloth: string;
  cloth2: string;
  metal: string;
  accent: string;
  eye: string;
  /** 0 slim, 1 massive. */
  bulk: number;
  /** 0 short, 1 tall. */
  height: number;
  /** 0 short weapon, 1 long. */
  weaponScale: number;
  cape: boolean;
  helm: boolean;
  horns: boolean;
};

export type MoveTune = {
  name: string;
  damage: number;
  hitstun: number;
  knockback: number;
  /** Extra copies of the first pose, marked startup. */
  windup: number;
  /** Extra copies of the last pose, marked recovery. */
  recoverPad: number;
};

export type Tunes = Record<ClipId, MoveTune>;

export type ClipDef = {
  id: ClipId;
  fps: number;
  loop: boolean;
  poses: Pose[];
  phases: Phase[];
  hitActive: boolean[];
  invuln: boolean[];
  airborne: boolean[];
};

export type ShelfEntry = {
  id: string;
  savedAt: number;
  dna: Dna;
  tunes: Tunes;
  note: string;
};

export type FrameContacts = {
  hurt: Box;
  hit: Box | null;
};

export const ARCHETYPE_LABEL: Record<ArchetypeId, string> = {
  knight: "Knight",
  duelist: "Duelist",
  mage: "Mage",
  ranger: "Ranger",
  bruiser: "Bruiser",
  automaton: "Automaton",
  wraith: "Wraith",
  beast: "Beast",
};
