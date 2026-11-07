import type { CapturedPhoto } from "../ports";

const FULL_LONG_EDGE = 1600;
const THUMB_LONG_EDGE = 320;
// Spec limit is 500 KB; aim lower so the limit holds for noisy photos too.
const FULL_TARGET_BYTES = 400 * 1024;
const FULL_QUALITIES = [0.82, 0.72, 0.62, 0.52];
const THUMB_QUALITY = 0.7;

async function encode(bitmap: ImageBitmap, longEdge: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, longEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = new OffscreenCanvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.convertToBlob({ type: "image/webp", quality });
}

export async function compress(source: Blob): Promise<CapturedPhoto> {
  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  try {
    let full = await encode(bitmap, FULL_LONG_EDGE, FULL_QUALITIES[0]);
    for (const quality of FULL_QUALITIES.slice(1)) {
      if (full.size <= FULL_TARGET_BYTES) break;
      full = await encode(bitmap, FULL_LONG_EDGE, quality);
    }
    return { full, thumb: await encode(bitmap, THUMB_LONG_EDGE, THUMB_QUALITY) };
  } finally {
    bitmap.close();
  }
}
