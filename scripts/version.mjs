// Derives the Android versionName and versionCode from a release tag. Shared by the release
// workflow, the Gradle build and the tests so the rule lives in one place.
import { pathToFileURL } from "node:url";

const TAG = /^v?(\d+)\.(\d+)\.(\d+)$/;
const MAX_VERSION_CODE = 2_100_000_000;

export function versionFromTag(tag) {
  const match = TAG.exec(tag);
  if (!match) throw new Error(`Release tag must look like v1.2.3, got "${tag}"`);
  const [major, minor, patch] = match.slice(1).map(Number);
  if (minor > 99 || patch > 99) throw new Error(`Minor and patch must be at most 99 so version codes never collide, got "${tag}"`);
  const versionCode = major * 10000 + minor * 100 + patch;
  if (versionCode > MAX_VERSION_CODE) throw new Error(`Version code ${versionCode} is above Android's maximum`);
  return { versionName: `${major}.${minor}.${patch}`, versionCode };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { versionName, versionCode } = versionFromTag(process.argv[2] ?? "");
  console.log(`VERSION_NAME=${versionName}`);
  console.log(`VERSION_CODE=${versionCode}`);
}
