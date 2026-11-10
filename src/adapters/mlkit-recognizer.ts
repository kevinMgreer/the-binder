import { registerPlugin } from "@capacitor/core";
import type { Suggestion } from "../domain/card";
import type { Recognizer } from "../ports";
import { parseCardText } from "./card-text";

/** Reads the text on a photo; the Android plugin runs ML Kit's bundled Latin model, so it needs no network. */
export type TextReader = (photo: Blob) => Promise<string>;

export class MlKitRecognizer implements Recognizer {
  constructor(
    private readText: TextReader,
    private now = new Date(),
  ) {}

  /** The back usually prints the year, number and set, so it is read first and the front only fills gaps. */
  async recognize(photos: { front?: Blob; back?: Blob }): Promise<Suggestion> {
    const merged: Suggestion = {};
    for (const photo of [photos.back, photos.front]) {
      if (!photo) continue;
      const found = parseCardText(await this.readText(photo), this.now);
      for (const [key, value] of Object.entries(found)) if (!(key in merged)) Object.assign(merged, { [key]: value });
    }
    return merged;
  }
}

interface BinderTextPlugin {
  recognize(options: { image: string }): Promise<{ text: string }>;
}

async function toBase64(photo: Blob): Promise<string> {
  const bytes = new Uint8Array(await photo.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export const capacitorTextReader = (plugin = registerPlugin<BinderTextPlugin>("BinderText")): TextReader =>
  async (photo) => (await plugin.recognize({ image: await toBase64(photo) })).text;
