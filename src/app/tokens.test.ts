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
  "--color-page", "--color-surface", "--color-pocket", "--color-pocket-top", "--color-pocket-edge", "--color-text",
  "--color-text-muted", "--color-accent", "--color-on-accent", "--color-accent-text", "--color-ok", "--color-danger",
];

type Rgba = [number, number, number, number];
function rgba(hex: string): Rgba {
  const h = hex.replace("#", "");
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
}
const over = (top: Rgba, base: Rgba): Rgba => [0, 1, 2].map((i) => top[i] * top[3] + base[i] * (1 - top[3])).concat(1) as Rgba;
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

  it("declares color-scheme light dark and the scales", () => {
    const css = read();
    expect(css).toMatch(/color-scheme:\s*light dark/);
    for (const name of ["--space-1", "--space-8", "--radius-s", "--radius-m", "--radius-l", "--type-title", "--type-body", "--type-label", "--type-mono", "--target-min"]) {
      expect(css, name).toContain(name + ":");
    }
  });

  for (const theme of ["light", "dark"] as const) {
    it(`meets contrast in the ${theme} theme, with the pocket blended over the page`, () => {
      const t = themes()[theme];
      const c = (role: string) => rgba(t[role]);
      const page = c("--color-page");
      const backgrounds = {
        page,
        surface: c("--color-surface"),
        "pocket on page": over(c("--color-pocket"), page),
        "pocket-top on page": over(c("--color-pocket-top"), page),
        "pocket on surface": over(c("--color-pocket"), c("--color-surface")),
        "pocket-top on surface": over(c("--color-pocket-top"), c("--color-surface")),
      };
      for (const [name, bg] of Object.entries(backgrounds)) {
        for (const fg of ["--color-text", "--color-text-muted", "--color-accent-text", "--color-ok", "--color-danger"]) {
          expect(ratio(c(fg), bg), `${fg} on ${name}`).toBeGreaterThanOrEqual(4.5);
        }
      }
      expect(ratio(c("--color-on-accent"), c("--color-accent")), "on-accent on accent").toBeGreaterThanOrEqual(4.5);
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
      else if (/\.(css|tsx?)$/.test(name) && !/\.test\.tsx?$/.test(name) && p !== tokensPath) files.push(p);
    }
  };
  walk(join(root, "src"));

  it("appear only in the token file", () => {
    const hits = files.flatMap((f) =>
      [...readFileSync(f, "utf8").matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/g)].map((m) => `${relative(root, f)}: ${m[0]}`),
    );
    expect(hits).toEqual([]);
  });
});
