/** WCAG 2.1 contrast ratio utilities */

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg: string, bg: string): number | null {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  if (l1 === null || l2 === null) return null;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export type WcagLevel = "AAA" | "AA" | "AA Large" | "Fail";

export function wcagLevel(ratio: number | null): WcagLevel {
  if (ratio === null) return "Fail";
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}

export interface ContrastPair {
  label: string;
  fg: string;
  bg: string;
}

export function checkThemeContrast(colors: Record<string, unknown>): Array<ContrastPair & { ratio: number | null; level: WcagLevel }> {
  const c = colors as {
    primary?: string;
    surface?: { base?: string; card?: string; alt?: string };
    text?: { main?: string; muted?: string; onPrimary?: string };
  };

  const pairs: ContrastPair[] = [
    { label: "Tekst na tle", fg: c.text?.main ?? "", bg: c.surface?.base ?? "" },
    { label: "Tekst na karcie", fg: c.text?.main ?? "", bg: c.surface?.card ?? "" },
    { label: "Tekst muted na tle", fg: c.text?.muted ?? "", bg: c.surface?.base ?? "" },
    { label: "Tekst muted na karcie", fg: c.text?.muted ?? "", bg: c.surface?.card ?? "" },
    { label: "Tekst na primary", fg: c.text?.onPrimary ?? "", bg: c.primary ?? "" },
    { label: "Tekst na alt tle", fg: c.text?.main ?? "", bg: c.surface?.alt ?? "" },
  ];

  return pairs
    .filter((p) => p.fg && p.bg)
    .map((p) => {
      const ratio = contrastRatio(p.fg, p.bg);
      return { ...p, ratio, level: wcagLevel(ratio) };
    });
}
