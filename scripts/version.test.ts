import { describe, expect, test } from "vitest";
// @ts-expect-error plain JavaScript shared with the Gradle build and the release workflow
import { versionFromTag } from "./version.mjs";

describe("versionFromTag", () => {
  test("derives the version name and code from a release tag", () => {
    expect(versionFromTag("v1.2.3")).toEqual({ versionName: "1.2.3", versionCode: 10203 });
    expect(versionFromTag("0.1.0")).toEqual({ versionName: "0.1.0", versionCode: 100 });
  });

  test("each later release has a higher version code", () => {
    const tags = ["v0.1.0", "v0.1.1", "v0.2.0", "v1.0.0", "v1.0.1", "v1.1.0", "v2.0.0"];
    const codes = tags.map((t) => versionFromTag(t).versionCode);
    expect(codes).toEqual([...codes].sort((a, b) => a - b));
    expect(new Set(codes).size).toBe(codes.length);
  });

  test("rejects tags that are not plain major.minor.patch", () => {
    for (const bad of ["v1.2", "latest", "v1.2.3-beta", "v1.2.3.4", ""]) {
      expect(() => versionFromTag(bad), bad).toThrow();
    }
  });

  test("rejects numbers that would collide or overflow the version code", () => {
    expect(() => versionFromTag("v1.100.0")).toThrow();
    expect(() => versionFromTag("v1.0.100")).toThrow();
    expect(() => versionFromTag("v210001.0.0")).toThrow();
  });
});
