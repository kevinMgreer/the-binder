// Builds the debug app from a worktree and installs it on the phone: `npm run phone-test -- [dir] [--worker] [--serial X]`.
// --worker also deploys the Worker, which changes the live Worker the release app uses.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function parseArgs(argv) {
  const out = { dir: undefined, worker: false, serial: undefined };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--worker") out.worker = true;
    else if (argv[i] === "--serial") out.serial = argv[++i];
    else out.dir = argv[i];
  }
  return out;
}

export function pickDevice(adbOutput, serial) {
  const ready = adbOutput
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.split(/\s+/))
    .filter(([, state]) => state === "device")
    .map(([id]) => id);
  if (serial) return ready.includes(serial) ? { serial } : { error: `Device ${serial} is not attached and authorized.` };
  if (ready.length === 0) return { error: "No phone found: plug in the phone and allow USB debugging." };
  if (ready.length > 1) return { error: `Several devices attached (${ready.join(", ")}): pick one with --serial <id>.` };
  return { serial: ready[0] };
}

const GRADLE_FILES = ["android/app/capacitor.build.gradle", "android/capacitor.settings.gradle"];

export function run(argv, deps) {
  const { env, platform, log, exists, exec } = deps;
  const win = platform === "win32";
  const args = parseArgs(argv);
  const dir = resolve(deps.cwd, args.dir ?? ".");
  const home = homedir();
  const java = env.JAVA_HOME ?? join(home, "AppData/Local/Programs/Temurin21/jdk-21.0.13+9");
  const sdk = env.ANDROID_HOME ?? join(home, "AppData/Local/Android/Sdk");
  for (const [name, path] of [["JAVA_HOME", java], ["ANDROID_HOME", sdk]]) {
    if (!exists(path)) return fail(log, `${name} folder not found: ${path}. Set ${name} (see docs/setup.md step 5).`);
  }
  const buildEnv = { ...env, JAVA_HOME: java, ANDROID_HOME: sdk };

  const envLocal = join(dir, ".env.local");
  if (!exists(envLocal)) {
    const list = exec("git", ["worktree", "list", "--porcelain"], { cwd: dir, capture: true });
    const main = list.stdout.split(/\r?\n/).find((l) => l.startsWith("worktree "))?.slice(9);
    const source = main && join(main, ".env.local");
    if (!source || !exists(source)) return fail(log, `.env.local is missing in ${dir} and in the main checkout.`);
    deps.copyFile(source, envLocal);
    log("ok   .env.local copied from the main checkout");
  }

  const step = (label, cmd, cmdArgs, opts = {}) => {
    const r = exec(cmd, cmdArgs, { cwd: dir, env: buildEnv, ...opts });
    log(r.status === 0 ? `ok   ${label}` : `FAIL ${label} (exit ${r.status})`);
    return r;
  };
  const gradle = win ? ".\\gradlew.bat" : "./gradlew";
  const steps = [
    ["build", "npm", ["run", "build"]],
    ["cap sync", "npx", ["cap", "sync", "android"]],
    ["restore gradle line endings", "git", ["checkout", "--", ...GRADLE_FILES]],
    ["assembleDebug", gradle, ["assembleDebug"], { cwd: join(dir, "android") }],
  ];
  for (const [label, cmd, cmdArgs, opts] of steps) {
    const r = step(label, cmd, cmdArgs, opts);
    if (r.status !== 0) return r.status || 1;
  }

  const adb = join(sdk, "platform-tools", win ? "adb.exe" : "adb");
  const devices = exec(adb, ["devices"], { cwd: dir, env: buildEnv, capture: true });
  const picked = pickDevice(devices.stdout, args.serial);
  if (picked.error) return fail(log, `FAIL adb devices: ${picked.error}`);
  const apk = join("app", "build", "outputs", "apk", "debug", "app-debug.apk");
  const install = step(`install on ${picked.serial}`, adb, ["-s", picked.serial, "install", "-r", apk], { cwd: join(dir, "android") });
  if (install.status !== 0) return install.status || 1;

  if (args.worker) {
    const deploy = step("worker deploy", "npx", ["wrangler", "deploy"], { cwd: join(dir, "worker"), capture: true });
    if (deploy.status !== 0) return deploy.status || 1;
    log(deploy.stdout.split(/\r?\n/).find((l) => /version id/i.test(l)) ?? "Worker deployed (no version id in the output).");
  }
  return 0;
}

function fail(log, message) {
  log(message);
  return 1;
}

function realExec(cmd, args, { cwd, env = process.env, capture = false }) {
  // npm, npx and gradlew.bat are .cmd files on Windows and need a shell; quote a path that holds spaces.
  const shell = process.platform === "win32";
  const r = spawnSync(shell && cmd.includes(" ") ? `"${cmd}"` : cmd, args, {
    cwd,
    env,
    shell,
    encoding: "utf8",
    stdio: capture ? ["inherit", "pipe", "inherit"] : "inherit",
  });
  if (capture && r.stdout) process.stdout.write(r.stdout);
  return { status: r.status ?? 1, stdout: r.stdout ?? "" };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = run(process.argv.slice(2), {
    cwd: process.cwd(),
    env: process.env,
    platform: process.platform,
    log: console.log,
    exists: existsSync,
    copyFile: copyFileSync,
    exec: realExec,
  });
}
