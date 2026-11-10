import { describe, expect, test, vi } from "vitest";
import { MlKitRecognizer } from "./mlkit-recognizer";

const blob = (text: string) => new Blob([text], { type: "image/webp" });

function recognizer(texts: Record<string, string>) {
  const readText = vi.fn(async (photo: Blob) => texts[await photo.text()] ?? "");
  return { ml: new MlKitRecognizer(readText, new Date("2026-06-01T00:00:00Z")), readText };
}

describe("MlKitRecognizer", () => {
  test("reads the back first and fills what it lacks from the front", async () => {
    const { ml, readText } = recognizer({ back: "No. 27\n© 2024 Topps", front: "Topps Chrome\n2020" });
    expect(await ml.recognize({ front: blob("front"), back: blob("back") })).toEqual({
      year: 2024,
      manufacturer: "Topps",
      set: "Chrome",
      cardNumber: "27",
    });
    expect(await readText.mock.results[0].value).toContain("No. 27");
  });

  test("reads only the photos it is given", async () => {
    const { ml, readText } = recognizer({ front: "© 2022 Bowman" });
    expect(await ml.recognize({ front: blob("front") })).toEqual({ year: 2022, manufacturer: "Bowman" });
    expect(readText).toHaveBeenCalledTimes(1);
  });

  test("a photo with no readable text gives an empty suggestion", async () => {
    const { ml } = recognizer({});
    expect(await ml.recognize({ back: blob("back") })).toEqual({});
  });

  test("a failure in the reader rejects so the form shows its nothing-recognized note", async () => {
    const ml = new MlKitRecognizer(async () => {
      throw new Error("plugin missing");
    });
    await expect(ml.recognize({ back: blob("back") })).rejects.toThrow("plugin missing");
  });
});
