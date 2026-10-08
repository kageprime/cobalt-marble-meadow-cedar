export type RGB = { r: number; g: number; b: number };

export function rgb(hex: string): RGB {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.padEnd(6, "0").slice(0, 6);
  return {
    r: Number.parseInt(full.slice(0, 2), 16) || 0,
    g: Number.parseInt(full.slice(2, 4), 16) || 0,
    b: Number.parseInt(full.slice(4, 6), 16) || 0,
  };
}

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function lighten(c: RGB, t: number): RGB {
  return {
    r: clamp(c.r + (255 - c.r) * t),
    g: clamp(c.g + (255 - c.g) * t),
    b: clamp(c.b + (255 - c.b) * t),
  };
}

export function darken(c: RGB, t: number): RGB {
  return {
    r: clamp(c.r * (1 - t)),
    g: clamp(c.g * (1 - t)),
    b: clamp(c.b * (1 - t)),
  };
}

export function isHex(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
