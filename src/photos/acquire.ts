import type { CardSide } from "../domain/card";
import type { CapturedPhoto, PhotoSource } from "../ports";
import { processPhoto } from "./pipeline";

export async function acquirePhoto(
  source: PhotoSource,
  side: CardSide,
  how: "camera" | "pick",
): Promise<CapturedPhoto | null> {
  const blob = how === "camera" ? await source.capture(side) : await source.pick();
  return blob ? processPhoto(blob) : null;
}
