import { describe, expect, test } from "vitest";
import { isNewer } from "./version";

describe("isNewer", () => {
  test("compares each part as a number, not as text", () => {
    expect(isNewer("1.10.0", "1.9.0")).toBe(true);
    expect(isNewer("1.2.10", "1.2.9")).toBe(true);
    expect(isNewer("2.0.0", "1.99.99")).toBe(true);
  });

  test("equal and older versions are not newer", () => {
    expect(isNewer("1.2.3", "1.2.3")).toBe(false);
    expect(isNewer("1.2.2", "1.2.3")).toBe(false);
  });

  test("accepts a leading v and a missing patch number", () => {
    expect(isNewer("v1.3.0", "1.2.9")).toBe(true);
    expect(isNewer("1.3", "1.2.9")).toBe(true);
    expect(isNewer("v1.2.3", "1.2.3")).toBe(false);
  });

  test("something that is not a version is never newer", () => {
    expect(isNewer("latest", "1.2.3")).toBe(false);
    expect(isNewer("1.2.3", "dev")).toBe(false);
  });
});
