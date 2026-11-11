import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const tokensPath = join(__dirname, "tokens.css");
const read = () => readFileSync(tokensPath, "utf8");

function parseBlock(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

function themes() {
  const css = read();
  const at = css.indexOf("@media (prefers-color-scheme: dark)");
  expect(at).toBeGreaterThan(-1);
  return { light: parseBlock(css.slice(0, at)), dark: { ...parseBlock(css.slice(0, at)), ...parseBlock(css.slice(at)) }, darkOwn: parseBlock(css.slice(at)) };
}

const COLOURS = [
  "--color-ground", "--color-panel", "--color-ink", "--color-ink-muted", "--color-rule",
  "--color-danger", "--color-frame", "--color-scrim", "--color-placeholder",
];
const HEX = {
  light: { "--color-ground": "#f3ecdc", "--color-panel": "#f3ecdc", "--color-ink": "#1c2b4a", "--color-ink-muted": "#4a5670", "--color-danger": "#a82a22", "--color-frame": "#f3ecdc" },
  dark: { "--color-ground": "#101a30", "--color-panel": "#17233f", "--color-ink": "#f3ecdc", "--color-ink-muted": "#c2bcae", "--color-danger": "#ff8a80", "--color-frame": "#f3ecdc" },
};

type Rgba = [number, number, number, number];
function rgba(hex: string): Rgba {
  const h = hex.replace("#", "");
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
}
function luminance([r, g, b]: Rgba) {
  const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a: Rgba, b: Rgba) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("tokens.css", () => {
  it("defines every colour role in both themes, with its own dark value", () => {
    const { light, darkOwn } = themes();
    for (const role of COLOURS) {
      expect(light[role], `light ${role}`).toBeTruthy();
      expect(darkOwn[role], `dark ${role}`).toBeTruthy();
    }
  });

  for (const theme of ["light", "dark"] as const) {
    it(`uses the ${theme} palette from the spec`, () => {
      const t = themes()[theme];
      for (const [role, hex] of Object.entries(HEX[theme])) expect((t[role] ?? "").toLowerCase(), `${theme} ${role}`).toBe(hex);
    });
  }

  it("declares color-scheme light dark, fonts, the type scale, the frame and the spacing rhythm", () => {
    const css = read();
    expect(css).toMatch(/color-scheme:\s*light dark/);
    const names = ["--space-1", "--space-8", "--radius-print", "--radius-frame", "--radius-pill", "--target-min", "--font-slab", "--font-sans", "--frame-ratio", "--gutter", "--gap-section", "--gap-field", "--gap-label", "--pad-cell", "--pad-row", "--gap-frame", "--gap-caption", "--size-tile-min", "--size-team-min", "--size-nav-add-w", "--size-nav-add-h", "--size-nav-icon"];
    for (const size of ["label", "body", "button", "table", "stat", "title"]) names.push(`--type-${size}`);
    for (const name of names) expect(css, name).toContain(name + ":");
  });

  it("keeps no pocket, accent, mono, stitch, gold or flag token", () => {
    expect(read()).not.toMatch(/--color-pocket|--color-accent|--type-mono|--color-page|--color-surface|stitch|gold|flag/);
  });

  for (const theme of ["light", "dark"] as const) {
    it(`meets contrast in the ${theme} theme`, () => {
      const t = themes()[theme];
      const c = (role: string) => rgba(t[role]);
      for (const bg of ["--color-ground", "--color-panel"]) {
        for (const fg of ["--color-ink", "--color-ink-muted", "--color-danger"]) {
          expect(ratio(c(fg), c(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
        }
        expect(ratio(c("--color-ink"), c(bg)), `keyline on ${bg}`).toBeGreaterThanOrEqual(3);
      }
      expect(ratio(c("--color-ground"), c("--color-ink")), "ground text on the ink fill of a primary button or chip").toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("colour literals", () => {
  const root = join(__dirname, "..", "..");
  const files: string[] = [join(root, "index.html")];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(css|tsx?)$/.test(name) && !/\.test\.tsx?$/.test(name) && p !== tokensPath && name !== "fonts.css") files.push(p);
    }
  };
  walk(join(root, "src"));

  it("name no font face outside the token file", () => {
    const hits = files.flatMap((f) =>
      [...readFileSync(f, "utf8").matchAll(/font(?:-family)?\s*:[^;{}]*\b(?:Roboto|Inter|Georgia|serif|sans-serif|system-ui|monospace|Arial|Helvetica)\b/gi)].map(
        (m) => `${relative(root, f)}: ${m[0]}`,
      ),
    );
    expect(hits).toEqual([]);
  });

  it("appear only in the token file", () => {
    const hits = files.flatMap((f) =>
      [...readFileSync(f, "utf8").matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/g)].map((m) => `${relative(root, f)}: ${m[0]}`),
    );
    expect(hits).toEqual([]);
  });
});
