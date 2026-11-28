import { describe, expect, test } from "vitest";
// @ts-expect-error plain JavaScript node script
import { parseArgs, pickDevice, run } from "./phone-test.mjs";

type Call = { cmd: string; args: string[]; cwd: string };

const ADB_NONE = "List of devices attached\n\n";
const adbOne = (s: string) => `List of devices attached\n${s}\tdevice\n\n`;

function fake(opts: { adb?: string; fail?: string; envLocal?: boolean; env?: Record<string, string> } = {}) {
  const calls: Call[] = [];
  const logs: string[] = [];
  const copies: string[][] = [];
  const deps = {
    cwd: "/wt",
    env: { JAVA_HOME: "/jdk", ANDROID_HOME: "/sdk", ...opts.env },
    platform: "linux",
    log: (l: string) => logs.push(l),
    exists: (p: string) => (p.endsWith(".env.local") && !/main/.test(p) ? opts.envLocal !== false : true),
    copyFile: (a: string, b: string) => copies.push([a, b]),
    exec(cmd: string, args: string[], o: { cwd: string }) {
      calls.push({ cmd, args, cwd: o.cwd });
      const line = `${cmd} ${args.join(" ")}`;
      if (opts.fail && line.includes(opts.fail)) return { status: 7, stdout: "" };
      if (cmd === "git" && args[0] === "worktree") return { status: 0, stdout: "worktree /main\nHEAD abc\n\nworktree /wt\n" };
      if (args.includes("devices")) return { status: 0, stdout: opts.adb ?? adbOne("ABC123") };
      return { status: 0, stdout: "Deployed version id: v-1\n" };
    },
  };
  return { deps, calls, logs, copies, lines: () => calls.map((c) => `${c.cmd} ${c.args.join(" ")}`) };
}

describe("parseArgs", () => {
  test("defaults", () => {
    expect(parseArgs([])).toEqual({ dir: undefined, worker: false, serial: undefined });
  });
  test("path, --worker and --serial", () => {
    expect(parseArgs(["C:/wt", "--worker", "--serial", "X1"])).toEqual({ dir: "C:/wt", worker: true, serial: "X1" });
  });
});

describe("pickDevice", () => {
  test("none: asks to plug in the phone", () => {
    expect(pickDevice(ADB_NONE).error).toMatch(/plug in the phone and allow USB debugging/);
  });
  test("one device is used", () => {
    expect(pickDevice(adbOne("ABC123"))).toEqual({ serial: "ABC123" });
  });
  test("unauthorized does not count", () => {
    expect(pickDevice("List of devices attached\nABC\tunauthorized\n").error).toMatch(/plug in the phone/);
  });
  test("several without --serial are refused", () => {
    const out = "List of devices attached\nA\tdevice\nB\tdevice\n";
    expect(pickDevice(out).error).toMatch(/--serial/);
  });
  test("--serial picks one of several", () => {
    const out = "List of devices attached\nA\tdevice\nB\tdevice\n";
    expect(pickDevice(out, "B")).toEqual({ serial: "B" });
    expect(pickDevice(out, "Z").error).toMatch(/Z/);
  });
});

describe("run", () => {
  test("builds, syncs, restores gradle files, assembles and installs", () => {
    const f = fake();
    expect(run([], f.deps)).toBe(0);
    const l = f.lines();
    expect(l).toContain("npm run build");
    expect(l).toContain("npx cap sync android");
    expect(l.some((x) => x.startsWith("git checkout -- android/app/capacitor.build.gradle android/capacitor.settings.gradle"))).toBe(true);
    expect(l.some((x) => x.includes("gradlew") && x.includes("assembleDebug"))).toBe(true);
    expect(l.some((x) => x.includes("install -r"))).toBe(true);
    expect(l.some((x) => x.includes("wrangler"))).toBe(false);
  });
  test("deploys the Worker only with --worker", () => {
    const f = fake();
    expect(run(["--worker"], f.deps)).toBe(0);
    const w = f.calls.find((c) => c.args.includes("wrangler"));
    expect(w?.args).toEqual(["wrangler", "deploy"]);
    expect(w?.cwd).toMatch(/worker$/);
    expect(f.logs.join("\n")).toMatch(/v-1/);
  });
  test("no phone: stops before install", () => {
    const f = fake({ adb: ADB_NONE });
    expect(run(["--worker"], f.deps)).not.toBe(0);
    expect(f.logs.join("\n")).toMatch(/plug in the phone and allow USB debugging/);
    expect(f.lines().some((x) => x.includes("install"))).toBe(false);
    expect(f.lines().some((x) => x.includes("wrangler"))).toBe(false);
  });
  test("--serial is passed to adb install", () => {
    const f = fake({ adb: "List of devices attached\nA\tdevice\nB\tdevice\n" });
    expect(run(["--serial", "B"], f.deps)).toBe(0);
    expect(f.lines().find((x) => x.includes("install"))).toMatch(/-s B install -r/);
  });
  test("stops at the first failing step with its exit code", () => {
    const f = fake({ fail: "cap sync" });
    expect(run([], f.deps)).toBe(7);
    expect(f.lines().some((x) => x.includes("assembleDebug"))).toBe(false);
  });
  test("one summary line per step", () => {
    const f = fake();
    run([], f.deps);
    const steps = f.logs.filter((l) => /^(ok|FAIL)\b/.test(l));
    expect(steps.length).toBeGreaterThanOrEqual(5);
  });
  test("fails clearly when JAVA_HOME folder is missing", () => {
    const f = fake();
    f.deps.exists = (p: string) => p !== "/jdk";
    expect(run([], f.deps)).not.toBe(0);
    expect(f.logs.join("\n")).toMatch(/JAVA_HOME/);
    expect(f.calls.length).toBeLessThanOrEqual(1);
  });
  test(".env.local is copied from the main checkout only when missing, never printed", () => {
    const missing = fake({ envLocal: false });
    run([], missing.deps);
    expect(missing.copies).toHaveLength(1);
    expect(missing.copies[0][0]).toMatch(/main[\\/]\.env\.local$/);
    expect(missing.copies[0][1]).toMatch(/wt[\\/]\.env\.local$/);
    const present = fake({ envLocal: true });
    run([], present.deps);
    expect(present.copies).toHaveLength(0);
  });
});
