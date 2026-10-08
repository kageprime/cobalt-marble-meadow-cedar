import { darken, lighten, rgb, type RGB } from "./color";
import type { Box, Dna, FrameContacts, Pose } from "./types";
import { CELL_H, CELL_W, GROUND_Y, ORIGIN_X } from "./types";

type Ink = { base: RGB; hi: RGB; sh: RGB };
type Pt = { x: number; y: number };
type Mode = "body" | "shadow" | "fx" | "ink";

const OUTLINE: RGB = { r: 20, g: 13, b: 10 };

function inkOf(base: RGB, hi = 0.3, sh = 0.34): Ink {
  return { base, hi: lighten(base, hi), sh: darken(base, sh) };
}

class Raster {
  readonly w = CELL_W;
  readonly h = CELL_H;
  readonly px = new Uint8ClampedArray(CELL_W * CELL_H * 4);
  readonly mask = new Uint8Array(CELL_W * CELL_H);

  plot(x: number, y: number, c: RGB, a = 255, mode: Mode = "body") {
    const ix = x | 0;
    const iy = y | 0;
    if (ix < 0 || iy < 0 || ix >= this.w || iy >= this.h) return;
    const i = iy * this.w + ix;
    if (mode === "shadow" && this.mask[i] !== 0) return;
    const o = i * 4;
    const under = this.px[o + 3];
    if ((mode === "fx" || (mode === "shadow" && a < 255)) && under > 0) {
      const s = a / 255;
      const d = 1 - s;
      this.px[o] = this.px[o] * d + c.r * s;
      this.px[o + 1] = this.px[o + 1] * d + c.g * s;
      this.px[o + 2] = this.px[o + 2] * d + c.b * s;
      this.px[o + 3] = Math.min(255, under + a * 0.45);
    } else {
      this.px[o] = c.r;
      this.px[o + 1] = c.g;
      this.px[o + 2] = c.b;
      this.px[o + 3] = a;
    }
    if (mode === "body") this.mask[i] = 2;
    else if (mode === "shadow" && this.mask[i] === 0) this.mask[i] = 1;
  }

  disc(cx: number, cy: number, rad: number, tone: Ink, mode: Mode = "body", alpha = 255) {
    const r = Math.ceil(rad);
    const r2 = rad * rad + 0.35;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r2) continue;
        const light = -dx * 0.9 - dy;
        const c = light > rad * 0.45 ? tone.hi : light < -rad * 0.15 ? tone.sh : tone.base;
        this.plot(cx + dx, cy + dy, c, alpha, mode);
      }
    }
  }

  stroke(a: Pt, b: Pt, rad: number, tone: Ink, mode: Mode = "body", alpha = 255) {
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(dist / Math.max(0.45, rad * 0.42)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.disc(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, rad, tone, mode, alpha);
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB, alpha: number, mode: Mode) {
    const rxi = Math.ceil(rx);
    const ryi = Math.ceil(ry);
    for (let dy = -ryi; dy <= ryi; dy++) {
      for (let dx = -rxi; dx <= rxi; dx++) {
        if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) {
          this.plot(cx + dx, cy + dy, c, alpha, mode);
        }
      }
    }
  }

  poly(pts: Pt[], tone: Ink, mode: Mode = "body") {
    if (pts.length < 3) return;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const y0 = Math.max(0, Math.floor(minY));
    const y1 = Math.min(this.h - 1, Math.ceil(maxY));
    for (let y = y0; y <= y1; y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]!;
        const b = pts[(i + 1) % pts.length]!;
        const cross = (a.y <= y && b.y > y) || (b.y <= y && a.y > y);
        if (!cross || a.y === b.y) continue;
        const t = (y - a.y) / (b.y - a.y);
        xs.push(a.x + (b.x - a.x) * t);
      }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const left = xs[i]!;
        const right = xs[i + 1]!;
        const mid = (left + right) / 2;
        for (let x = Math.floor(left); x <= right; x++) {
          const c = x < mid - 1.5 ? tone.hi : x > mid + 2 ? tone.sh : tone.base;
          this.plot(x, y, c, 255, mode);
        }
      }
    }
  }

  outline() {
    const marks: number[] = [];
    const w = this.w;
    const h = this.h;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (this.mask[i] !== 0) continue;
        const n =
          (x > 0 && this.mask[i - 1] === 2) ||
          (x + 1 < w && this.mask[i + 1] === 2) ||
          (y > 0 && this.mask[i - w] === 2) ||
          (y + 1 < h && this.mask[i + w] === 2);
        if (n) marks.push(i);
      }
    }
    for (const i of marks) {
      const o = i * 4;
      this.px[o] = OUTLINE.r;
      this.px[o + 1] = OUTLINE.g;
      this.px[o + 2] = OUTLINE.b;
      this.px[o + 3] = 255;
      this.mask[i] = 3;
    }
  }

  image(): ImageData {
    return new ImageData(new Uint8ClampedArray(this.px), this.w, this.h);
  }
}

function down(a: Pt, ang: number, len: number): Pt {
  return { x: a.x + Math.sin(ang) * len, y: a.y + Math.cos(ang) * len };
}

function up(a: Pt, ang: number, len: number): Pt {
  return { x: a.x + Math.sin(ang) * len, y: a.y - Math.cos(ang) * len };
}

type Metrics = ReturnType<typeof metricsOf>;

function metricsOf(dna: Dna) {
  const a = dna.archetype;
  const heightK = { knight: 1.02, duelist: 1.1, mage: 1.06, ranger: 1, bruiser: 0.9, automaton: 1.01, wraith: 1.08, beast: 0.98 }[a];
  const bulkK = { knight: 1.02, duelist: 0.86, mage: 0.92, ranger: 0.9, bruiser: 1.28, automaton: 1.08, wraith: 0.8, beast: 1.05 }[a];
  const heightT = (0.86 + dna.height * 0.28) * heightK;
  const bulkT = (0.78 + dna.bulk * 0.2) * bulkK;
  return {
    thigh: 14.5 * heightT,
    shin: 13.6 * heightT,
    torso: 15.4 * heightT,
    headR: 7.6 * (0.96 + dna.bulk * 0.08) * (a === "bruiser" ? 0.9 : a === "beast" ? 1.02 : a === "duelist" ? 0.94 : 1),
    upper: 10.6 * heightT,
    fore: 9.8 * heightT,
    foot: a === "beast" ? 7.5 : 5.4,
    thighR: 2.15 * bulkT,
    shinR: 1.65 * bulkT,
    torsoR: 3.7 * bulkT,
    armR: 1.45 * bulkT,
    reach: 0.78 + dna.weaponScale * 0.35,
  };
}

type Skel = {
  hip: Pt;
  neck: Pt;
  head: Pt;
  shoulderF: Pt;
  shoulderB: Pt;
  elbowF: Pt;
  elbowB: Pt;
  handF: Pt;
  handB: Pt;
  kneeF: Pt;
  kneeB: Pt;
  ankleF: Pt;
  ankleB: Pt;
  toeF: Pt;
  toeB: Pt;
  tip: Pt;
  m: Metrics;
  weaponLen: number;
};

function weaponLength(dna: Dna, reach: number) {
  const base = {
    knight: 22,
    duelist: 26,
    mage: 28,
    ranger: 8,
    bruiser: 18,
    automaton: 16,
    wraith: 22,
    beast: 9,
  }[dna.archetype];
  return base * reach;
}

function solve(dna: Dna, pose: Pose): Skel {
  const m = metricsOf(dna);
  const hip0: Pt = { x: 0, y: 0 };
  const beast = dna.archetype === "beast";
  const footAng = beast ? 0.42 : 1.02;
  const offF = 1.4;
  const offB = -2.2;
  const kneeF = down({ x: offF, y: 0 }, pose.thighF, m.thigh);
  const ankleF = down(kneeF, pose.shinF, m.shin);
  const toeF = down(ankleF, footAng, m.foot);
  const kneeB = down({ x: offB, y: 0 }, pose.thighB, m.thigh * 0.98);
  const ankleB = down(kneeB, pose.shinB, m.shin * 0.98);
  const toeB = down(ankleB, footAng, m.foot * 0.92);
  const low = Math.max(toeF.y, ankleF.y, toeB.y, ankleB.y);
  const hover = dna.archetype === "wraith" ? 12 : dna.archetype === "mage" ? 2 : 0;
  const tx = ORIGIN_X + pose.x;
  const ty = GROUND_Y - pose.lift - hover - low;
  const s = (p: Pt): Pt => ({ x: p.x + tx, y: p.y + ty });
  const hip = s(hip0);
  const neck = up(hip, pose.torso, m.torso * pose.squash);
  const head = up(neck, pose.torso * 0.35 + pose.head, m.headR * 0.78);
  const shoulderF = { x: neck.x + 2.5, y: neck.y + 3.1 };
  const shoulderB = { x: neck.x - 3.3, y: neck.y + 2.3 };
  const elbowF = down(shoulderF, pose.armF, m.upper);
  const handF = down(elbowF, pose.forearmF, m.fore);
  const elbowB = down(shoulderB, pose.armB, m.upper * 0.96);
  const handB = down(elbowB, pose.forearmB, m.fore * 0.96);
  const weaponLen = weaponLength(dna, m.reach);
  const tip = down(handF, pose.weapon, weaponLen);
  return {
    hip,
    neck,
    head,
    shoulderF,
    shoulderB,
    elbowF,
    elbowB,
    handF,
    handB,
    kneeF: s(kneeF),
    kneeB: s(kneeB),
    ankleF: s(ankleF),
    ankleB: s(ankleB),
    toeF: s(toeF),
    toeB: s(toeB),
    tip,
    m,
    weaponLen,
  };
}

type Pal = {
  skin: Ink;
  cloth: Ink;
  cloth2: Ink;
  metal: Ink;
  accent: Ink;
  eye: RGB;
  shadow: RGB;
};

function palette(dna: Dna): Pal {
  return {
    skin: inkOf(rgb(dna.skin), 0.28, 0.3),
    cloth: inkOf(rgb(dna.cloth), 0.2, 0.34),
    cloth2: inkOf(rgb(dna.cloth2), 0.18, 0.28),
    metal: inkOf(rgb(dna.metal), 0.38, 0.32),
    accent: inkOf(rgb(dna.accent), 0.28, 0.25),
    eye: rgb(dna.eye),
    shadow: { r: 10, g: 8, b: 7 },
  };
}

function limbStyle(dna: Dna): "boot" | "mech" | "wisp" | "paw" | "flesh" {
  switch (dna.archetype) {
    case "automaton":
      return "mech";
    case "wraith":
      return "wisp";
    case "beast":
      return "paw";
    case "bruiser":
    case "mage":
      return "flesh";
    default:
      return "boot";
  }
}

function drawLeg(r: Raster, hip: Pt, knee: Pt, ankle: Pt, toe: Pt, dna: Dna, pal: Pal, radT: number, radS: number) {
  const style = limbStyle(dna);
  if (style === "mech") {
    r.stroke(hip, knee, radT, pal.metal);
    r.stroke(knee, ankle, radS, pal.metal);
    r.disc(knee.x, knee.y, Math.max(1.4, radT * 0.45), pal.accent);
    r.disc(ankle.x, ankle.y, 2.1, pal.metal);
    return;
  }
  if (style === "wisp") {
    r.stroke(hip, ankle, 1.15, pal.cloth, "body", 210);
    r.stroke(
      { x: hip.x - 2, y: hip.y },
      { x: ankle.x - 3, y: ankle.y + 2 },
      0.8,
      pal.cloth2,
      "fx",
      140,
    );
    return;
  }
  const thighTone = style === "flesh" || style === "paw" ? pal.skin : pal.cloth;
  const shinTone = style === "boot" ? pal.cloth2 : style === "paw" ? pal.skin : pal.skin;
  r.stroke(hip, knee, radT, thighTone);
  r.stroke(knee, ankle, radS, shinTone);
  if (style === "boot") {
    r.stroke(ankle, toe, radS * 0.95, pal.cloth2);
    r.disc(toe.x, toe.y, radS * 0.7, pal.metal);
  } else if (style === "paw") {
    r.stroke(ankle, toe, 1.7, pal.skin);
    r.disc(toe.x, toe.y, 1.5, pal.metal);
  } else {
    r.stroke(ankle, toe, 1.35, pal.skin);
  }
}

function drawArm(
  r: Raster,
  shoulder: Pt,
  elbow: Pt,
  hand: Pt,
  dna: Dna,
  pal: Pal,
  rad: number,
) {
  if (dna.archetype === "automaton") {
    r.stroke(shoulder, elbow, rad * 1.15, pal.metal);
    r.stroke(elbow, hand, rad, pal.metal);
    r.disc(elbow.x, elbow.y, Math.max(1.3, rad * 0.5), pal.accent);
    return;
  }
  if (dna.archetype === "wraith") {
    r.stroke(shoulder, hand, 1.2, pal.cloth, "body", 230);
    return;
  }
  const bare = dna.archetype === "bruiser" || dna.archetype === "beast" || dna.archetype === "mage";
  const tone = bare ? pal.skin : pal.cloth;
  r.stroke(shoulder, elbow, rad, tone);
  r.stroke(elbow, hand, rad * 0.86, bare ? pal.skin : pal.cloth2);
}

function drawTorso(r: Raster, sk: Skel, dna: Dna, pal: Pal) {
  const { hip, neck, m } = sk;
  if (dna.archetype === "automaton") {
    const w = m.torsoR * 1.55;
    const h = m.torso * 0.92;
    r.poly(
      [
        { x: neck.x - w * 0.65, y: neck.y + 1 },
        { x: neck.x + w * 0.75, y: neck.y + 2 },
        { x: hip.x + w * 0.85, y: hip.y },
        { x: hip.x - w * 0.75, y: hip.y + 1 },
      ],
      pal.metal,
    );
    const seam = (y: number) => {
      r.stroke(
        { x: neck.x - w * 0.45, y },
        { x: hip.x + w * 0.55, y },
        0.6,
        inkOf(darken(pal.metal.base, 0.35), 0, 0),
        "ink",
      );
    };
    seam(neck.y + h * 0.35);
    seam(neck.y + h * 0.62);
    return;
  }
  const chest = {
    x: hip.x + (neck.x - hip.x) * 0.62,
    y: hip.y + (neck.y - hip.y) * 0.62,
  };
  r.stroke(hip, neck, m.torsoR * 0.72, pal.cloth);
  r.disc(chest.x, chest.y, m.torsoR, pal.cloth);
  r.stroke(neck, { x: neck.x + 0.4, y: neck.y - 1 }, Math.max(1.4, m.torsoR * 0.38), pal.skin);
  if (dna.archetype === "knight") {
    r.disc(sk.shoulderF.x + 1, sk.shoulderF.y, 2.3, pal.metal);
    r.disc(sk.shoulderB.x - 1, sk.shoulderB.y, 1.8, pal.metal);
  }
  if (dna.archetype === "bruiser") {
    r.disc(sk.shoulderF.x + 1, sk.shoulderF.y + 1, m.armR * 1.35, pal.skin);
  }
}

function drawRobe(r: Raster, sk: Skel, dna: Dna, pal: Pal, pose: Pose) {
  if (dna.archetype !== "mage" && dna.archetype !== "wraith") return;
  const sway = pose.sway * 4;
  const hem = sk.hip.y + sk.m.thigh * (dna.archetype === "wraith" ? 0.7 : 0.95);
  const tone = dna.archetype === "wraith" ? pal.cloth : pal.cloth;
  r.poly(
    [
      { x: sk.neck.x - 5, y: sk.neck.y + 2 },
      { x: sk.neck.x + 6, y: sk.neck.y + 3 },
      { x: sk.hip.x + 9 + sway, y: hem },
      { x: sk.hip.x + 2, y: hem + (dna.archetype === "wraith" ? 6 : 3) },
      { x: sk.hip.x - 12 - sway, y: hem + 1 },
    ],
    tone,
  );
  if (dna.archetype === "wraith") {
    r.poly(
      [
        { x: sk.hip.x - 4, y: hem - 2 },
        { x: sk.hip.x + 3, y: hem },
        { x: sk.hip.x - 2 - sway, y: hem + 10 },
      ],
      pal.cloth2,
    );
  }
}

function drawCape(r: Raster, sk: Skel, pose: Pose, pal: Pal) {
  const sway = pose.sway * 3;
  r.poly(
    [
      { x: sk.neck.x - 1, y: sk.neck.y + 2 },
      { x: sk.neck.x + 2, y: sk.neck.y + 3 },
      { x: sk.hip.x - 9 - sway, y: sk.hip.y - 2 },
    ],
    pal.cloth2,
  );
}

function drawTail(r: Raster, sk: Skel, pose: Pose, pal: Pal) {
  let p = { x: sk.hip.x - 3, y: sk.hip.y - 1 };
  for (let i = 0; i < 5; i++) {
    const n = {
      x: p.x - 4.2,
      y: p.y - 1.5 + Math.sin(pose.sway * 2 + i) * 2.4,
    };
    r.stroke(p, n, Math.max(1, 3.1 - i * 0.45), i < 2 ? pal.skin : pal.cloth2);
    p = n;
  }
}

function drawHead(r: Raster, sk: Skel, dna: Dna, pal: Pal) {
  const { head, m } = sk;
  const hr = m.headR;
  if (dna.archetype === "beast") {
    r.disc(head.x - 2, head.y - 1, hr, pal.skin);
    r.disc(head.x + hr * 0.72, head.y + hr * 0.12, hr * 0.48, pal.skin);
    r.poly(
      [
        { x: head.x - 2, y: head.y - hr },
        { x: head.x - 6, y: head.y - hr - 7 },
        { x: head.x + 1, y: head.y - hr + 1 },
      ],
      pal.skin,
    );
    r.poly(
      [
        { x: head.x + 2, y: head.y - hr * 0.2 },
        { x: head.x + 7, y: head.y - hr - 5 },
        { x: head.x + 4, y: head.y - hr * 0.1 },
      ],
      pal.cloth2,
    );
    return;
  }
  if (dna.archetype === "automaton") {
    r.poly(
      [
        { x: head.x - hr, y: head.y - hr * 0.8 },
        { x: head.x + hr * 0.95, y: head.y - hr * 0.7 },
        { x: head.x + hr * 0.85, y: head.y + hr * 0.75 },
        { x: head.x - hr * 0.9, y: head.y + hr * 0.7 },
      ],
      pal.metal,
    );
    r.stroke(head, { x: head.x + 1, y: head.y - hr - 6 }, 1.1, pal.metal);
    r.disc(head.x + 1, head.y - hr - 7, 1.8, pal.accent);
    return;
  }
  if (dna.archetype === "wraith" || (dna.archetype === "ranger" && dna.helm)) {
    r.disc(head.x - 1, head.y - 2, hr + 2.4, pal.cloth);
  }
  if (dna.archetype === "duelist") {
    r.ellipse(head.x + 2, head.y + 1, hr + 6, 2.1, pal.cloth2.base, 255, "body");
    r.stroke(
      { x: head.x + hr, y: head.y - 2 },
      { x: head.x + hr + 7, y: head.y - 10 },
      1.2,
      pal.accent,
    );
  }
  if (dna.archetype === "mage") {
    r.poly(
      [
        { x: head.x - hr * 0.7, y: head.y - hr * 0.2 },
        { x: head.x + hr * 0.45, y: head.y - hr * 0.3 },
        { x: head.x + 1, y: head.y - hr - 16 },
      ],
      pal.cloth,
    );
    r.disc(head.x + 1, head.y - hr - 16, 1.7, pal.accent);
  }
  if (dna.archetype === "bruiser") {
    r.stroke(
      { x: head.x, y: head.y - hr + 1 },
      { x: head.x + 1, y: head.y - hr - 6 },
      1.4,
      pal.cloth2,
    );
  }
  r.disc(head.x, head.y, hr, pal.skin);
  if (dna.archetype === "knight" && dna.helm) {
    r.disc(head.x - 0.4, head.y - 1.5, hr + 1.1, pal.metal);
    r.disc(head.x + hr * 0.22, head.y + 1.4, hr * 0.72, pal.skin);
    r.stroke(
      { x: head.x - 1, y: head.y - hr },
      { x: head.x - 3, y: head.y - hr - 7 },
      1.15,
      pal.accent,
    );
  }
  if (dna.horns) {
    r.stroke(head, { x: head.x - 5, y: head.y - hr - 6 }, 1.3, pal.metal);
    r.stroke(
      { x: head.x + 2, y: head.y - hr + 1 },
      { x: head.x + 6, y: head.y - hr - 7 },
      1.2,
      pal.metal,
    );
  }
}

function drawFace(r: Raster, sk: Skel, dna: Dna, pal: Pal) {
  const { head, m } = sk;
  const ex = head.x + m.headR * 0.32;
  const ey = head.y - m.headR * 0.08;
  if (dna.archetype === "automaton") {
    r.stroke({ x: head.x - m.headR * 0.55, y: ey }, { x: head.x + m.headR * 0.7, y: ey }, 1.15, pal.accent, "ink");
    return;
  }
  if (dna.archetype === "wraith") {
    r.disc(ex, ey, 1.7, pal.accent, "ink");
    return;
  }
  if (dna.archetype === "knight" && dna.helm) {
    r.stroke({ x: ex - 3, y: ey }, { x: ex + 3, y: ey }, 1.05, inkOf(darken(pal.metal.base, 0.45)), "ink");
    r.plot(ex + 1, ey, pal.accent.base, 255, "ink");
    return;
  }
  r.plot(ex, ey, pal.eye, 255, "ink");
  r.plot(ex + 1, ey, pal.eye, 255, "ink");
  r.plot(ex + 1, ey - 1, lighten(pal.eye, 0.45), 255, "ink");
  if (dna.archetype === "beast") {
    r.plot(head.x + m.headR * 0.95, head.y + 2, pal.eye, 255, "ink");
  }
}

function perp(ang: number) {
  const dx = Math.sin(ang);
  const dy = Math.cos(ang);
  return { dx, dy, px: dy, py: -dx };
}

function drawBlade(r: Raster, hand: Pt, tip: Pt, half: number, tone: Ink) {
  const dx = tip.x - hand.x;
  const dy = tip.y - hand.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = (-dy / len) * half;
  const py = (dx / len) * half;
  const tipW = 0.15;
  r.poly(
    [
      { x: hand.x + px, y: hand.y + py },
      { x: hand.x - px, y: hand.y - py },
      { x: tip.x - px * tipW, y: tip.y - py * tipW },
      { x: tip.x + px * tipW, y: tip.y + py * tipW },
    ],
    tone,
  );
}

function drawWeapon(r: Raster, sk: Skel, dna: Dna, pal: Pal, pose: Pose, hitActive: boolean) {
  const hand = sk.handF;
  const tip = sk.tip;
  const ang = pose.weapon;
  const { px, py } = perp(ang);
  if (dna.archetype === "beast") {
    for (const o of [-0.28, 0, 0.28]) {
      const t = down(hand, ang + o, sk.weaponLen);
      r.stroke(hand, t, 0.85, pal.metal);
    }
    return;
  }
  if (dna.archetype === "ranger") {
    const reach = 15 * (0.85 + dna.weaponScale * 0.35);
    const a = { x: hand.x + px * reach, y: hand.y + py * reach };
    const b = { x: hand.x - px * reach, y: hand.y - py * reach };
    let prev = a;
    for (let i = 1; i <= 8; i++) {
      const t = i / 8;
      const bow = Math.sin(Math.PI * t) * 6;
      const p = {
        x: a.x + (b.x - a.x) * t - Math.sin(ang) * bow,
        y: a.y + (b.y - a.y) * t - Math.cos(ang) * bow,
      };
      r.stroke(prev, p, 1.15, pal.cloth2);
      prev = p;
    }
    r.stroke(a, b, 0.55, pal.metal);
    if (hitActive) {
      const arrow = down(hand, ang, 26 * (0.8 + dna.weaponScale * 0.4));
      drawBlade(r, hand, arrow, 0.7, pal.metal);
      r.disc(arrow.x, arrow.y, 1.3, pal.accent);
    }
    return;
  }
  if (dna.archetype === "mage") {
    r.stroke(hand, tip, 1.35, pal.cloth2);
    r.disc(tip.x, tip.y, 3.1 * (0.85 + dna.weaponScale * 0.3), pal.accent);
    return;
  }
  if (dna.archetype === "wraith") {
    r.stroke(hand, tip, 1.15, pal.metal);
    for (let i = 0; i < 7; i++) {
      const a = ang - 1.3 + i * 0.16;
      const p = down(tip, a, 3 + i * 0.85);
      r.disc(p.x, p.y, 1.25, pal.metal);
    }
    return;
  }
  if (dna.archetype === "automaton") {
    r.stroke(hand, tip, 2.3, pal.metal);
    r.disc(tip.x, tip.y, 2.4, hitActive ? pal.accent : pal.metal);
    return;
  }
  const half = dna.archetype === "duelist" ? 0.7 : dna.archetype === "bruiser" ? 1.5 : 1.35;
  const grip = down(hand, ang, dna.archetype === "duelist" ? 2 : 4);
  drawBlade(r, grip, tip, half, pal.metal);
  if (dna.archetype === "bruiser") {
    const head = down(tip, ang, -2);
    r.poly(
      [
        head,
        { x: head.x + px * 7, y: head.y + py * 7 },
        { x: tip.x + px * 2, y: tip.y + py * 2 },
        { x: tip.x - px * 1.2, y: tip.y - py * 1.2 },
      ],
      pal.metal,
    );
  } else {
    const g = dna.archetype === "duelist" ? 2.4 : 4.2;
    r.stroke(
      { x: hand.x + px * g, y: hand.y + py * g },
      { x: hand.x - px * g, y: hand.y - py * g },
      dna.archetype === "duelist" ? 0.8 : 1.25,
      pal.accent,
    );
  }
}

function drawHand(r: Raster, sk: Skel, dna: Dna, pal: Pal) {
  if (dna.archetype === "beast" || dna.archetype === "wraith") return;
  const tone =
    dna.archetype === "knight" || dna.archetype === "automaton"
      ? pal.metal
      : dna.archetype === "ranger"
        ? pal.cloth2
        : pal.skin;
  r.disc(sk.handF.x, sk.handF.y, Math.max(1.6, sk.m.armR * 0.85), tone);
  if (dna.archetype !== "automaton") {
    r.disc(sk.handB.x, sk.handB.y, Math.max(1.4, sk.m.armR * 0.7), dna.archetype === "knight" ? pal.metal : pal.skin);
  }
}

function drawShield(r: Raster, sk: Skel, pal: Pal) {
  const mid = {
    x: (sk.elbowF.x + sk.handF.x) / 2,
    y: (sk.elbowF.y + sk.handF.y) / 2,
  };
  r.poly(
    [
      { x: mid.x + 2, y: mid.y - 8 },
      { x: mid.x + 9, y: mid.y - 2 },
      { x: mid.x + 7, y: mid.y + 8 },
      { x: mid.x - 1, y: mid.y + 4 },
    ],
    pal.metal,
  );
  r.plot(mid.x + 4, mid.y, pal.accent.base, 255, "ink");
}

function drawFx(r: Raster, sk: Skel, pose: Pose, pal: Pal) {
  if (pose.fx === "dust") {
    const spots = [
      [sk.toeF.x - 6, GROUND_Y - 2],
      [sk.toeF.x + 2, GROUND_Y - 1],
      [sk.toeB.x - 3, GROUND_Y - 2],
      [sk.hip.x + 8, GROUND_Y - 3],
    ];
    for (const [x, y] of spots) {
      r.disc(x!, y!, 1.3, pal.cloth2, "fx", 150);
    }
  } else if (pose.fx === "slash") {
    for (let i = 0; i < 8; i++) {
      const a = pose.weapon - 0.7 + i * 0.18;
      const p = down(sk.handF, a, sk.weaponLen * (0.55 + i * 0.06));
      r.disc(p.x, p.y, i === 4 ? 2 : 1.3, pal.accent, "fx", 210);
    }
  } else if (pose.fx === "spark") {
    r.disc(sk.tip.x, sk.tip.y, 2.4, pal.accent, "fx", 230);
    for (const [dx, dy] of [
      [4, 0],
      [-4, 0],
      [0, 4],
      [0, -4],
      [3, 3],
      [-3, -2],
    ]) {
      r.plot(sk.tip.x + dx!, sk.tip.y + dy!, pal.accent.hi, 220, "fx");
    }
  } else if (pose.fx === "shock") {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + pose.sway;
      const rad = 7 + (i % 3);
      r.plot(sk.tip.x + Math.cos(a) * rad, sk.tip.y + Math.sin(a) * rad, pal.accent.hi, 230, "fx");
      r.plot(sk.tip.x + Math.cos(a) * (rad + 2), sk.tip.y + Math.sin(a) * (rad + 1), pal.accent.base, 180, "fx");
    }
  }
}

function contactsOf(sk: Skel, dna: Dna, hitActive: boolean): FrameContacts {
  const pts = [sk.head, sk.neck, sk.hip, sk.handF, sk.handB, sk.ankleF, sk.ankleB, sk.shoulderF];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const hurt = clampBox({
    x: Math.round(minX - sk.m.headR * 0.3),
    y: Math.round(minY - sk.m.headR * 0.4),
    w: Math.round(maxX - minX + sk.m.headR * 0.8),
    h: Math.round(maxY - minY + 4),
  });
  if (!hitActive) return { hurt, hit: null };
  const size = {
    knight: [20, 16],
    duelist: [28, 8],
    mage: [16, 16],
    ranger: [30, 8],
    bruiser: [18, 18],
    automaton: [14, 14],
    wraith: [22, 18],
    beast: [16, 12],
  }[dna.archetype];
  const aim =
    dna.archetype === "ranger"
      ? down(sk.handF, Math.atan2(sk.tip.x - sk.handF.x, sk.tip.y - sk.handF.y), 24)
      : {
          x: sk.handF.x + (sk.tip.x - sk.handF.x) * 0.82,
          y: sk.handF.y + (sk.tip.y - sk.handF.y) * 0.82,
        };
  return {
    hurt,
    hit: clampBox({
      x: Math.round(aim.x - size[0] / 2),
      y: Math.round(aim.y - size[1] / 2),
      w: size[0],
      h: size[1],
    }),
  };
}

function clampBox(b: Box): Box {
  const x = Math.max(0, Math.min(CELL_W - 4, b.x));
  const y = Math.max(0, Math.min(CELL_H - 4, b.y));
  const w = Math.max(4, Math.min(CELL_W - x, b.w));
  const h = Math.max(4, Math.min(CELL_H - y, b.h));
  return { x, y, w, h };
}

export function renderFrame(dna: Dna, pose: Pose, hitActive: boolean): { image: ImageData; contacts: FrameContacts } {
  const r = new Raster();
  const pal = palette(dna);
  const sk = solve(dna, pose);
  const air = pose.lift + (dna.archetype === "wraith" ? 12 : 0);
  r.ellipse(sk.hip.x, GROUND_Y - 1, Math.max(5, 13 - air * 0.28), Math.max(2, 3.4 - air * 0.05), pal.shadow, 90, "shadow");

  const capeOn = dna.archetype === "wraith" ? true : dna.archetype === "beast" || dna.archetype === "automaton" ? false : dna.cape;
  if (capeOn && dna.archetype !== "mage") drawCape(r, sk, pose, pal);
  if (dna.archetype === "beast") drawTail(r, sk, pose, pal);
  if (dna.archetype === "ranger") {
    r.poly(
      [
        { x: sk.shoulderB.x - 2, y: sk.shoulderB.y },
        { x: sk.shoulderB.x + 3, y: sk.shoulderB.y - 1 },
        { x: sk.shoulderB.x + 2, y: sk.shoulderB.y + 10 },
        { x: sk.shoulderB.x - 3, y: sk.shoulderB.y + 9 },
      ],
      pal.cloth2,
    );
  }

  drawLeg(r, sk.hip, sk.kneeB, sk.ankleB, sk.toeB, dna, pal, sk.m.thighR * 0.92, sk.m.shinR * 0.92);
  drawArm(r, sk.shoulderB, sk.elbowB, sk.handB, dna, pal, sk.m.armR * 0.92);
  drawTorso(r, sk, dna, pal);
  if (dna.archetype === "mage" || dna.archetype === "wraith") drawRobe(r, sk, dna, pal, pose);
  drawHead(r, sk, dna, pal);
  drawLeg(r, sk.hip, sk.kneeF, sk.ankleF, sk.toeF, dna, pal, sk.m.thighR, sk.m.shinR);
  drawArm(r, sk.shoulderF, sk.elbowF, sk.handF, dna, pal, sk.m.armR);
  drawWeapon(r, sk, dna, pal, pose, hitActive);
  drawHand(r, sk, dna, pal);

  if (dna.seed % 4 !== 0 && dna.archetype !== "wraith") {
    r.stroke(
      { x: sk.hip.x - sk.m.torsoR * 0.7, y: sk.hip.y - 2 },
      { x: sk.hip.x + sk.m.torsoR * 0.85, y: sk.hip.y - 1 },
      0.8,
      pal.accent,
      "ink",
    );
  }

  drawFace(r, sk, dna, pal);
  if (pose.fx === "block") drawShield(r, sk, pal);
  r.outline();
  if (pose.fx !== "block") drawFx(r, sk, pose, pal);
  return { image: r.image(), contacts: contactsOf(sk, dna, hitActive) };
}

let scratch: HTMLCanvasElement | null = null;

function scratchCanvas() {
  if (!scratch) {
    scratch = document.createElement("canvas");
    scratch.width = CELL_W;
    scratch.height = CELL_H;
  }
  return scratch;
}

function blit(ctx: CanvasRenderingContext2D, image: ImageData, alpha: number, facing: 1 | -1) {
  const c = scratchCanvas();
  const sctx = c.getContext("2d");
  if (!sctx) return;
  sctx.putImageData(image, 0, 0);
  ctx.save();
  ctx.globalAlpha = alpha;
  if (facing < 0) {
    ctx.translate(CELL_W, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(c, 0, 0);
  ctx.restore();
}

export function mirrorBox(box: Box, facing: 1 | -1): Box {
  if (facing > 0) return box;
  return { ...box, x: CELL_W - box.x - box.w };
}

export function paintCell(
  canvas: HTMLCanvasElement,
  dna: Dna,
  pose: Pose,
  opts: {
    hitActive: boolean;
    onion?: { pose: Pose; hitActive: boolean } | null;
    facing: 1 | -1;
  },
): FrameContacts {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { hurt: { x: 0, y: 0, w: 1, h: 1 }, hit: null };
  if (canvas.width !== CELL_W) canvas.width = CELL_W;
  if (canvas.height !== CELL_H) canvas.height = CELL_H;
  ctx.clearRect(0, 0, CELL_W, CELL_H);
  if (opts.onion) {
    const prev = renderFrame(dna, opts.onion.pose, opts.onion.hitActive);
    blit(ctx, prev.image, 0.32, opts.facing);
  }
  const current = renderFrame(dna, pose, opts.hitActive);
  blit(ctx, current.image, 1, opts.facing);
  return {
    hurt: mirrorBox(current.contacts.hurt, opts.facing),
    hit: current.contacts.hit ? mirrorBox(current.contacts.hit, opts.facing) : null,
  };
}
