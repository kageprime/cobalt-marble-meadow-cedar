import type { ArchetypeId, ClipDef, ClipId, Fx, Phase, Pose } from "./types";

const d = (deg: number) => (deg * Math.PI) / 180;

const REST: Pose = {
  x: 0,
  lift: 0,
  torso: d(6),
  head: 0,
  thighF: d(8),
  shinF: d(4),
  thighB: d(-6),
  shinB: d(2),
  armF: d(42),
  forearmF: d(70),
  armB: d(-18),
  forearmB: d(6),
  weapon: d(112),
  squash: 1,
  sway: 0,
  fx: "none",
};

function pose(over: Partial<Pose>): Pose {
  return { ...REST, ...over };
}

function cycle(poses: Pose[], phases: Phase[], extra: Partial<ClipDef> = {}): Omit<ClipDef, "id" | "fps" | "loop"> {
  const n = poses.length;
  return {
    poses,
    phases,
    hitActive: extra.hitActive ?? Array(n).fill(false),
    invuln: extra.invuln ?? Array(n).fill(false),
    airborne: extra.airborne ?? Array(n).fill(false),
  };
}

function idle(): Omit<ClipDef, "id" | "fps" | "loop"> {
  const bob = [0, 1, 2, 1, 0, -1];
  const poses = bob.map((b, i) =>
    pose({
      lift: b > 0 ? 0 : 0,
      torso: d(5 + b),
      head: d(-b),
      squash: 1 + b * 0.012,
      sway: Math.sin((i / 6) * Math.PI * 2) * 0.6,
      thighF: d(8 - b),
      shinF: d(4 + b),
      thighB: d(-6 + b * 0.4),
      shinB: d(2 + b * 0.3),
      armF: d(40 + b),
      forearmF: d(68 + b),
      armB: d(-16 - b),
      weapon: d(110 + b),
    }),
  );
  return cycle(poses, Array(6).fill("loop"));
}

function walk(): Omit<ClipDef, "id" | "fps" | "loop"> {
  const keys: Partial<Pose>[] = [
    {
      torso: d(10),
      thighF: d(30),
      shinF: d(8),
      thighB: d(-34),
      shinB: d(-4),
      armF: d(22),
      forearmF: d(40),
      armB: d(-36),
      forearmB: d(-8),
      weapon: d(118),
      sway: 0.3,
      fx: "dust",
    },
    {
      torso: d(8),
      thighF: d(14),
      shinF: d(32),
      thighB: d(-10),
      shinB: d(14),
      armF: d(12),
      forearmF: d(30),
      armB: d(-16),
      forearmB: d(4),
      weapon: d(122),
      sway: 0.6,
      squash: 0.96,
    },
    {
      torso: d(11),
      thighF: d(-6),
      shinF: d(16),
      thighB: d(16),
      shinB: d(46),
      armF: d(4),
      forearmF: d(24),
      armB: d(8),
      forearmB: d(18),
      weapon: d(126),
      sway: 0.9,
      lift: 1,
    },
    {
      torso: d(9),
      thighF: d(-26),
      shinF: d(4),
      thighB: d(38),
      shinB: d(64),
      armF: d(-6),
      forearmF: d(18),
      armB: d(28),
      forearmB: d(36),
      weapon: d(132),
      sway: 1,
      lift: 2,
    },
    {
      torso: d(10),
      thighF: d(-34),
      shinF: d(-4),
      thighB: d(30),
      shinB: d(8),
      armF: d(8),
      forearmF: d(28),
      armB: d(-28),
      forearmB: d(-4),
      weapon: d(120),
      sway: 0.4,
      fx: "dust",
    },
    {
      torso: d(8),
      thighF: d(-12),
      shinF: d(18),
      thighB: d(12),
      shinB: d(30),
      armF: d(18),
      forearmF: d(36),
      armB: d(-8),
      forearmB: d(10),
      weapon: d(116),
      sway: -0.2,
      squash: 0.96,
    },
    {
      torso: d(11),
      thighF: d(14),
      shinF: d(42),
      thighB: d(-8),
      shinB: d(12),
      armF: d(26),
      forearmF: d(44),
      armB: d(6),
      forearmB: d(16),
      weapon: d(112),
      sway: -0.5,
      lift: 1,
    },
    {
      torso: d(9),
      thighF: d(36),
      shinF: d(60),
      thighB: d(-24),
      shinB: d(4),
      armF: d(30),
      forearmF: d(48),
      armB: d(-18),
      forearmB: d(0),
      weapon: d(114),
      sway: -0.2,
      lift: 2,
    },
  ];
  return cycle(
    keys.map((k) => pose(k)),
    Array(8).fill("loop"),
  );
}

function dash(): Omit<ClipDef, "id" | "fps" | "loop"> {
  const keys: Partial<Pose>[] = [
    { torso: d(16), thighF: d(20), shinF: d(24), thighB: d(-16), shinB: d(10), weapon: d(110), squash: 0.94 },
    {
      torso: d(28),
      x: 2,
      thighF: d(34),
      shinF: d(18),
      thighB: d(-28),
      shinB: d(8),
      armF: d(40),
      forearmF: d(50),
      armB: d(-40),
      weapon: d(86),
      fx: "dust",
    },
    {
      torso: d(32),
      x: 3,
      lift: 2,
      thighF: d(18),
      shinF: d(40),
      thighB: d(10),
      shinB: d(50),
      armF: d(48),
      forearmF: d(60),
      armB: d(-50),
      weapon: d(78),
      fx: "dust",
    },
    {
      torso: d(18),
      x: 1,
      thighF: d(10),
      shinF: d(16),
      thighB: d(-8),
      shinB: d(12),
      weapon: d(110),
      squash: 0.96,
      fx: "dust",
    },
    { torso: d(8), weapon: d(124), squash: 0.98 },
  ];
  return cycle(
    keys.map((k) => pose(k)),
    ["startup", "active", "active", "recovery", "recovery"],
    { invuln: [false, true, true, false, false] },
  );
}

function jump(): Omit<ClipDef, "id" | "fps" | "loop"> {
  const keys: Partial<Pose>[] = [
    {
      torso: d(14),
      thighF: d(24),
      shinF: d(40),
      thighB: d(-10),
      shinB: d(28),
      armF: d(-20),
      forearmF: d(10),
      armB: d(-30),
      weapon: d(150),
      squash: 0.88,
      fx: "dust",
    },
    {
      lift: 10,
      torso: d(4),
      thighF: d(-8),
      shinF: d(8),
      thighB: d(6),
      shinB: d(14),
      armF: d(30),
      forearmF: d(20),
      armB: d(-20),
      weapon: d(100),
    },
    {
      lift: 20,
      torso: d(-2),
      thighF: d(18),
      shinF: d(46),
      thighB: d(-14),
      shinB: d(36),
      armF: d(70),
      forearmF: d(40),
      armB: d(-60),
      forearmB: d(-20),
      weapon: d(70),
      head: d(-6),
    },
    {
      lift: 22,
      torso: d(0),
      thighF: d(10),
      shinF: d(30),
      thighB: d(-6),
      shinB: d(24),
      armF: d(64),
      forearmF: d(30),
      armB: d(-50),
      weapon: d(80),
    },
    {
      lift: 12,
      torso: d(12),
      thighF: d(16),
      shinF: d(10),
      thighB: d(-20),
      shinB: d(6),
      armF: d(20),
      forearmF: d(36),
      weapon: d(110),
    },
    {
      lift: 0,
      torso: d(16),
      thighF: d(22),
      shinF: d(36),
      thighB: d(-8),
      shinB: d(26),
      squash: 0.86,
      weapon: d(130),
      fx: "dust",
    },
  ];
  return cycle(
    keys.map((k) => pose(k)),
    ["startup", "active", "active", "active", "recovery", "recovery"],
    { airborne: [false, true, true, true, true, false] },
  );
}

function jab(): Omit<ClipDef, "id" | "fps" | "loop"> {
  const keys: Partial<Pose>[] = [
    {
      torso: d(-8),
      head: d(4),
      armF: d(-16),
      forearmF: d(10),
      weapon: d(168),
      sway: -0.4,
    },
    {
      torso: d(-14),
      armF: d(-28),
      forearmF: d(-6),
      armB: d(10),
      weapon: d(176),
      sway: -0.6,
    },
    {
      torso: d(18),
      x: 2,
      armF: d(78),
      forearmF: d(92),
      weapon: d(86),
      thighF: d(16),
      shinF: d(10),
      fx: "slash",
    },
    {
      torso: d(20),
      x: 3,
      armF: d(86),
      forearmF: d(98),
      weapon: d(78),
      thighF: d(20),
      shinF: d(8),
      fx: "slash",
    },
    {
      torso: d(10),
      x: 1,
      armF: d(40),
      forearmF: d(56),
      weapon: d(110),
    },
    { torso: d(6), weapon: d(128) },
  ];
  return cycle(
    keys.map((k) => pose(k)),
    ["startup", "startup", "active", "active", "recovery", "recovery"],
    { hitActive: [false, false, true, true, false, false] },
  );
}

function heavy(): Omit<ClipDef, "id" | "fps" | "loop"> {
  const keys: Partial<Pose>[] = [
    { torso: d(12), squash: 0.92, thighF: d(18), shinF: d(30), weapon: d(140), armF: d(10) },
    {
      torso: d(-18),
      head: d(-8),
      armF: d(120),
      forearmF: d(150),
      armB: d(80),
      weapon: d(200),
      squash: 0.96,
      sway: -0.8,
    },
    {
      torso: d(-24),
      armF: d(150),
      forearmF: d(168),
      weapon: d(230),
      thighF: d(10),
      shinF: d(20),
      sway: -1,
    },
    {
      torso: d(8),
      armF: d(90),
      forearmF: d(110),
      weapon: d(150),
      fx: "slash",
    },
    {
      torso: d(26),
      x: 2,
      squash: 0.9,
      armF: d(40),
      forearmF: d(70),
      weapon: d(70),
      thighF: d(24),
      shinF: d(20),
      fx: "spark",
    },
    {
      torso: d(30),
      x: 2,
      squash: 0.88,
      armF: d(24),
      forearmF: d(50),
      weapon: d(52),
      fx: "spark",
    },
    { torso: d(16), armF: d(16), forearmF: d(36), weapon: d(100), squash: 0.96 },
    { torso: d(8), weapon: d(124) },
  ];
  return cycle(
    keys.map((k) => pose(k)),
    ["startup", "startup", "startup", "startup", "active", "active", "recovery", "recovery"],
    { hitActive: [false, false, false, false, true, true, false, false] },
  );
}

function hurt(): Omit<ClipDef, "id" | "fps" | "loop"> {
  const keys: Partial<Pose>[] = [
    {
      torso: d(-20),
      head: d(-14),
      x: -2,
      armF: d(-30),
      forearmF: d(20),
      armB: d(40),
      weapon: d(160),
      thighF: d(6),
      shinF: d(16),
    },
    {
      torso: d(-16),
      head: d(-8),
      x: -1,
      lift: 2,
      armF: d(-10),
      weapon: d(150),
    },
    { torso: d(-8), head: d(-4), weapon: d(136) },
    { torso: d(4), weapon: d(128) },
  ];
  return cycle(
    keys.map((k) => pose(k)),
    ["startup", "active", "recovery", "recovery"],
  );
}

function block(): Omit<ClipDef, "id" | "fps" | "loop"> {
  const keys: Partial<Pose>[] = [
    {
      torso: d(-8),
      armF: d(48),
      forearmF: d(20),
      weapon: d(150),
      thighF: d(12),
      shinF: d(16),
      fx: "block",
      sway: 0.2,
    },
    {
      torso: d(-10),
      armF: d(52),
      forearmF: d(16),
      weapon: d(156),
      squash: 0.98,
      fx: "block",
      sway: 0.35,
    },
    {
      torso: d(-7),
      armF: d(46),
      forearmF: d(22),
      weapon: d(148),
      fx: "block",
      sway: 0.15,
    },
  ];
  return cycle(
    keys.map((k) => pose(k)),
    Array(3).fill("loop"),
  );
}

function ko(): Omit<ClipDef, "id" | "fps" | "loop"> {
  const keys: Partial<Pose>[] = [
    { torso: d(-12), head: d(-10), weapon: d(150), armF: d(-10) },
    { torso: d(10), head: d(6), x: 1, weapon: d(120), thighF: d(16), shinF: d(24) },
    {
      torso: d(28),
      head: d(10),
      thighF: d(28),
      shinF: d(40),
      thighB: d(8),
      shinB: d(20),
      armF: d(20),
      weapon: d(90),
      squash: 0.94,
    },
    {
      torso: d(48),
      head: d(14),
      thighF: d(40),
      shinF: d(70),
      thighB: d(20),
      shinB: d(50),
      armF: d(10),
      forearmF: d(30),
      weapon: d(60),
      squash: 0.9,
    },
    {
      torso: d(68),
      head: d(16),
      thighF: d(52),
      shinF: d(90),
      thighB: d(30),
      shinB: d(70),
      armF: d(-6),
      forearmF: d(16),
      weapon: d(40),
      squash: 0.86,
      fx: "dust",
    },
    {
      torso: d(78),
      thighF: d(58),
      shinF: d(100),
      thighB: d(36),
      shinB: d(80),
      armF: d(-16),
      forearmF: d(8),
      weapon: d(24),
      squash: 0.84,
    },
    {
      torso: d(82),
      thighF: d(60),
      shinF: d(104),
      thighB: d(40),
      shinB: d(84),
      armF: d(-20),
      weapon: d(18),
      squash: 0.82,
    },
  ];
  return cycle(
    keys.map((k) => pose(k)),
    ["startup", "startup", "active", "active", "recovery", "recovery", "recovery"],
    { invuln: [false, false, false, false, false, true, true] },
  );
}

function special(arch: ArchetypeId): Omit<ClipDef, "id" | "fps" | "loop"> {
  const bank: Record<ArchetypeId, { keys: Partial<Pose>[]; hit: number[]; fxHit?: Fx }> = {
    knight: {
      keys: [
        { torso: d(8), squash: 0.94, weapon: d(140), armF: d(8) },
        { torso: d(-16), armF: d(130), forearmF: d(160), weapon: d(210), sway: -1 },
        { torso: d(-22), armF: d(156), forearmF: d(176), weapon: d(236) },
        { torso: d(6), armF: d(80), forearmF: d(100), weapon: d(140), fx: "slash" },
        { torso: d(28), squash: 0.86, armF: d(30), forearmF: d(60), weapon: d(58), x: 2, fx: "spark" },
        { torso: d(32), squash: 0.84, armF: d(18), forearmF: d(40), weapon: d(46), fx: "spark" },
        { torso: d(14), weapon: d(110), squash: 0.96 },
        { torso: d(6), weapon: d(128) },
      ],
      hit: [4, 5],
    },
    duelist: {
      keys: [
        { torso: d(-10), x: -1, weapon: d(160), armF: d(-20), forearmF: d(0) },
        { torso: d(-16), x: -2, weapon: d(172), armF: d(-36), sway: -0.6 },
        { torso: d(8), x: 2, weapon: d(92), armF: d(70), forearmF: d(88), fx: "slash" },
        { torso: d(14), x: 4, weapon: d(84), armF: d(86), forearmF: d(96), thighF: d(28), shinF: d(12), fx: "slash" },
        { torso: d(16), x: 5, weapon: d(80), armF: d(92), forearmF: d(100), fx: "slash" },
        { torso: d(8), x: 2, weapon: d(110), armF: d(40) },
        { torso: d(4), weapon: d(126) },
        { weapon: d(128) },
      ],
      hit: [3, 4],
    },
    mage: {
      keys: [
        { torso: d(-4), armF: d(40), forearmF: d(70), weapon: d(160), sway: 0.2 },
        { torso: d(-8), armF: d(100), forearmF: d(130), weapon: d(200), head: d(-6) },
        { torso: d(-10), armF: d(140), forearmF: d(160), weapon: d(230), fx: "shock" },
        { torso: d(-6), armF: d(150), forearmF: d(170), weapon: d(240), fx: "shock" },
        { torso: d(2), armF: d(120), forearmF: d(140), weapon: d(200), fx: "shock" },
        { torso: d(6), armF: d(70), weapon: d(160), fx: "spark" },
        { torso: d(6), weapon: d(140) },
        { weapon: d(128) },
      ],
      hit: [3, 4, 5],
    },
    ranger: {
      keys: [
        { torso: d(4), armF: d(70), forearmF: d(80), weapon: d(86), armB: d(-20) },
        { torso: d(-6), x: -1, armF: d(78), forearmF: d(40), weapon: d(84), armB: d(20), forearmB: d(30) },
        { torso: d(-12), x: -2, armF: d(82), forearmF: d(20), weapon: d(80), sway: -0.5 },
        { torso: d(6), x: 1, armF: d(74), forearmF: d(88), weapon: d(82), fx: "spark" },
        { torso: d(8), x: 1, armF: d(70), forearmF: d(90), weapon: d(80), fx: "spark" },
        { torso: d(6), weapon: d(100), armF: d(40) },
        { weapon: d(120) },
        { weapon: d(128) },
      ],
      hit: [3, 4],
    },
    bruiser: {
      keys: [
        { torso: d(16), squash: 0.9, thighF: d(20), shinF: d(34), weapon: d(70), armF: d(8) },
        { torso: d(20), squash: 0.88, weapon: d(48), armF: d(-10), forearmF: d(10), sway: 0.4 },
        { torso: d(8), weapon: d(90), armF: d(30), forearmF: d(50) },
        { torso: d(-8), lift: 2, weapon: d(140), armF: d(80), forearmF: d(100), fx: "slash" },
        { torso: d(-18), lift: 4, weapon: d(190), armF: d(130), forearmF: d(150), fx: "spark" },
        { torso: d(-12), lift: 2, weapon: d(170), armF: d(110), fx: "spark" },
        { torso: d(6), weapon: d(120), squash: 0.96 },
        { weapon: d(128) },
      ],
      hit: [4, 5],
    },
    automaton: {
      keys: [
        { torso: d(4), armF: d(20), forearmF: d(30), weapon: d(100) },
        { torso: d(-6), armF: d(-10), forearmF: d(8), weapon: d(150), x: -1 },
        { torso: d(8), armF: d(70), forearmF: d(84), weapon: d(86), fx: "spark" },
        { torso: d(12), x: 3, armF: d(88), forearmF: d(96), weapon: d(82), fx: "spark" },
        { torso: d(14), x: 3, armF: d(92), forearmF: d(100), weapon: d(80), fx: "shock" },
        { torso: d(6), x: 1, armF: d(40), weapon: d(110) },
        { weapon: d(124) },
        { weapon: d(128) },
      ],
      hit: [2, 3, 4],
    },
    wraith: {
      keys: [
        { lift: 2, torso: d(-8), weapon: d(40), armF: d(10), sway: -0.6 },
        { lift: 4, torso: d(-14), weapon: d(20), armF: d(-10), fx: "slash" },
        { lift: 8, torso: d(-4), weapon: d(80), armF: d(40), fx: "slash" },
        { lift: 12, torso: d(8), weapon: d(140), armF: d(90), fx: "slash" },
        { lift: 14, torso: d(16), weapon: d(190), armF: d(130), fx: "shock" },
        { lift: 10, torso: d(10), weapon: d(160), armF: d(80), fx: "shock" },
        { lift: 4, weapon: d(130) },
        { lift: 1, weapon: d(128) },
      ],
      hit: [3, 4],
    },
    beast: {
      keys: [
        { torso: d(12), weapon: d(70), armF: d(16), forearmF: d(30), sway: 0.4 },
        { torso: d(18), x: 2, weapon: d(48), armF: d(50), forearmF: d(70), fx: "slash" },
        { torso: d(8), x: 1, weapon: d(150), armF: d(-20), forearmF: d(10) },
        { torso: d(20), x: 3, weapon: d(40), armF: d(64), forearmF: d(80), fx: "slash" },
        { torso: d(22), x: 3, weapon: d(36), armF: d(70), forearmF: d(88), fx: "spark" },
        { torso: d(10), weapon: d(110), armF: d(24) },
        { torso: d(8), weapon: d(122) },
        { weapon: d(128) },
      ],
      hit: [1, 3, 4],
    },
  };

  const spec = bank[arch];
  const hit = new Set(spec.hit);
  return cycle(
    spec.keys.map((k) => pose(k)),
    spec.keys.map((_, i) => (hit.has(i) ? "active" : i < Math.min(...spec.hit) ? "startup" : "recovery")),
    { hitActive: spec.keys.map((_, i) => hit.has(i)) },
  );
}

const SHARED: Record<Exclude<ClipId, "special">, () => Omit<ClipDef, "id" | "fps" | "loop">> = {
  idle,
  walk,
  dash,
  jump,
  jab,
  heavy,
  hurt,
  block,
  ko,
};

const FPS: Record<ClipId, number> = {
  idle: 8,
  walk: 10,
  dash: 14,
  jump: 10,
  jab: 14,
  heavy: 11,
  special: 12,
  hurt: 9,
  block: 6,
  ko: 8,
};

const LOOP: Record<ClipId, boolean> = {
  idle: true,
  walk: true,
  dash: false,
  jump: false,
  jab: false,
  heavy: false,
  special: false,
  hurt: false,
  block: true,
  ko: false,
};

export function getClip(id: ClipId, archetype: ArchetypeId): ClipDef {
  const body = id === "special" ? special(archetype) : SHARED[id]();
  return { id, fps: FPS[id], loop: LOOP[id], ...body };
}

export function expandClip(
  clip: ClipDef,
  pad: { windup: number; recoverPad: number },
): ClipDef {
  const windup = clampInt(pad.windup, 0, 4);
  const recoverPad = clampInt(pad.recoverPad, 0, 4);
  if (!windup && !recoverPad) return clip;
  const first = clip.poses[0]!;
  const last = clip.poses[clip.poses.length - 1]!;
  const lead = Array.from({ length: windup }, () => ({ ...first, fx: "none" as Fx }));
  const tail = Array.from({ length: recoverPad }, () => ({ ...last, fx: "none" as Fx }));
  return {
    ...clip,
    poses: [...lead, ...clip.poses, ...tail],
    phases: [
      ...Array<Phase>(windup).fill("startup"),
      ...clip.phases,
      ...Array<Phase>(recoverPad).fill("recovery"),
    ],
    hitActive: [...Array(windup).fill(false), ...clip.hitActive, ...Array(recoverPad).fill(false)],
    invuln: [...Array(windup).fill(false), ...clip.invuln, ...Array(recoverPad).fill(false)],
    airborne: [...Array(windup).fill(false), ...clip.airborne, ...Array(recoverPad).fill(false)],
  };
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n) || 0));
}

export function phaseCounts(phases: Phase[]) {
  return {
    startup: phases.filter((p) => p === "startup").length,
    active: phases.filter((p) => p === "active").length,
    recovery: phases.filter((p) => p === "recovery").length,
    loop: phases.filter((p) => p === "loop").length,
  };
}

/** Frames of advantage if the hit on `frame` connects. Null when that cell has no hit. */
export function frameAdvantage(clip: ClipDef, frame: number, hitstun: number): number | null {
  if (!clip.hitActive[frame]) return null;
  let last = -1;
  clip.hitActive.forEach((on, i) => {
    if (on) last = i;
  });
  if (last < 0) return null;
  const recovery = clip.poses.length - 1 - last;
  return hitstun - recovery;
}
