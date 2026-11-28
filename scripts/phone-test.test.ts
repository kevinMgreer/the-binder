import { describe, expect, test } from "vitest";
// @ts-expect-error plain JavaScript dev script
import { parseArgs, pickDevice, phoneTest } from "./phone-test.mjs";

const ADB_NONE = "List of devices attached\n\n";
const ADB_ONE = "List of devices attached\nABC123\tdevice\n\n";
const ADB_TWO = "List of devices attached\nABC123\tdevice\nDEF456\tdevice\n\n";
const ADB_UNAUTH = "List of devices attached\nABC123\tunauthorized\n\n";

describe("parseArgs", () => {
  test("defaults to the current directory, no worker, no serial", () => {
    expect(parseArgs([])).toEqual({ dir: null, worker: false, serial: null });
  });
  test("reads a folder, --worker and --serial", () => {
    expect(parseArgs(["C:\\wt", "--worker", "--serial", "ABC"])).toEqual({ dir: "C:\\wt", worker: true, serial: "ABC" });
  });
  test("rejects unknown flags", () => {
    expect(() => parseArgs(["--deploy"])).toThrow();
  });
});

describe("pickDevice", () => {
  test("none: stop with the USB debugging message", () => {
    const d = pickDevice(ADB_NONE, null);
    expect(d.serial).toBeUndefined();
    expect(d.error).toContain("plug in the phone and allow USB debugging");
  });
  test("an unauthorized phone is not a device", () => {
    expect(pickDevice(ADB_UNAUTH, null).error).toContain("allow USB debugging");
  });
  test("one device: use it", () => {
    expect(pickDevice(ADB_ONE, null)).toEqual({ serial: "ABC123" });
  });
  test("several without --serial: refuse", () => {
    expect(pickDevice(ADB_TWO, null).error).toContain("--serial");
  });
  test("--serial picks one of several", () => {
    expect(pickDevice(ADB_TWO, "DEF456")).toEqual({ serial: "DEF456" });
  });
  test("--serial that is not attached: refuse", () => {
    expect(pickDevice(ADB_ONE, "NOPE").error).toContain("NOPE");
  });
});

function fake(over: Record<string, unknown> = {}) {
  const calls: string[] = [];
  const logs: string[] = [];
  const copies: string[][] = [];
  const deps = {
    cwd: "/wt",
    platform: "linux",
    env: { JAVA_HOME: "/jdk", ANDROID_HOME: "/sdk" } as Record<string, string>,
    exists: (p: string) => p !== "/wt/.env.local" || over.hasEnv === true,
    mainCheckout: () => "/main",
    copyFile: (from: string, to: string) => copies.push([from, to]),
    run: (cmd: string, args: string[]) => {
      const line = [cmd, ...args].join(" ");
      calls.push(line);
      const fail = over.failOn as string | undefined;
      return fail && line.includes(fail) ? 7 : 0;
    },
    capture: () => (over.adb as string) ?? ADB_ONE,
    log: (s: string) => logs.push(s),
    ...over,
  };
  return { deps, calls, logs, copies };
}

describe("phoneTest", () => {
  test("happy path runs every step in order, installs, and never deploys", async () => {
    const f = fake();
    const code = await phoneTest({ dir: null, worker: false, serial: null }, f.deps);
    expect(code).toBe(0);
    expect(f.calls.map((c) => c.split(" ").slice(0, 3).join(" "))).toEqual([
      "npm run build",
      "npx cap sync",
      "git checkout --",
      "./gradlew assembleDebug",
      "/sdk/platform-tools/adb -s ABC123",
    ]);
    expect(f.calls.some((c) => c.includes("wrangler"))).toBe(false);
    expect(f.logs.filter((l) => /^(ok|FAIL)/.test(l)).length).toBe(5);
  });

  test("--worker deploys the Worker after the install", async () => {
    const f = fake();
    await phoneTest({ dir: null, worker: true, serial: null }, f.deps);
    expect(f.calls.at(-1)).toContain("wrangler deploy");
  });

  test("stops at the first failing step with its exit code", async () => {
    const f = fake({ failOn: "cap sync" });
    const code = await phoneTest({ dir: null, worker: true, serial: null }, f.deps);
    expect(code).toBe(7);
    expect(f.calls).toHaveLength(2);
    expect(f.logs.at(-1)).toMatch(/^FAIL/);
  });

  test("no phone: stops before installing, exit non-zero", async () => {
    const f = fake({ adb: ADB_NONE });
    const code = await phoneTest({ dir: null, worker: true, serial: null }, f.deps);
    expect(code).not.toBe(0);
    expect(f.calls.some((c) => c.includes("install"))).toBe(false);
    expect(f.calls.some((c) => c.includes("wrangler"))).toBe(false);
    expect(f.logs.join("\n")).toContain("plug in the phone and allow USB debugging");
  });

  test("several phones without --serial: refuse", async () => {
    const f = fake({ adb: ADB_TWO });
    expect(await phoneTest({ dir: null, worker: false, serial: null }, f.deps)).not.toBe(0);
    expect(f.calls.some((c) => c.includes("install"))).toBe(false);
  });

  test("copies .env.local from the main checkout only when missing, without printing it", async () => {
    const missing = fake();
    await phoneTest({ dir: null, worker: false, serial: null }, missing.deps);
    expect(missing.copies).toEqual([["/main/.env.local", "/wt/.env.local"]]);
    const present = fake({ hasEnv: true });
    await phoneTest({ dir: null, worker: false, serial: null }, present.deps);
    expect(present.copies).toEqual([]);
  });

  test("fails clearly when the JDK or SDK folder is missing", async () => {
    const f = fake({ exists: (p: string) => p !== "/jdk" });
    const code = await phoneTest({ dir: null, worker: false, serial: null }, f.deps);
    expect(code).not.toBe(0);
    expect(f.calls).toHaveLength(0);
    expect(f.logs.join("\n")).toContain("JAVA_HOME");
  });
});
