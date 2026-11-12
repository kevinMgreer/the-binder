import type { CardSide } from "../domain/card";
import type { CapturedPhoto, PhotoSource } from "../ports";
import { processPhoto } from "./pipeline";

/** Each page processed like a single photo, in order; empty when the camera or picker was closed. */
export async function acquirePhotos(
  source: PhotoSource,
  side: CardSide,
  how: "camera" | "pick",
  pages = 1,
): Promise<CapturedPhoto[]> {
  if (how === "pick") {
    const blob = await source.pick();
    return blob ? [await processPhoto(blob)] : [];
  }
  return Promise.all((await source.capture(side, pages)).map((blob) => processPhoto(blob)));
}
