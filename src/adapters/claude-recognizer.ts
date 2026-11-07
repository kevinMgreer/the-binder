import type { Suggestion } from "../domain/card";
import { DailyLimitError, type Recognizer } from "../ports";

interface Options {
  url: string;
  getIdToken: () => Promise<string>;
  fetch?: typeof fetch;
}

export class ClaudeRecognizer implements Recognizer {
  private fetch: typeof fetch;

  constructor(private options: Options) {
    this.fetch = options.fetch ?? ((...args) => fetch(...args));
  }

  async recognize(photos: { front?: Blob; back?: Blob }): Promise<Suggestion> {
    const token = await this.options.getIdToken();
    const form = new FormData();
    if (photos.front) form.set("front", photos.front, "front.webp");
    if (photos.back) form.set("back", photos.back, "back.webp");

    const response = await this.fetch(`${this.options.url}/identify`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: form,
    });
    if (response.status === 429) throw new DailyLimitError("Daily limit reached");
    if (!response.ok) throw new Error(`Identification failed (${response.status})`);

    const { suggestion, lowConfidence } = (await response.json()) as { suggestion: Suggestion; lowConfidence: string[] };
    return { ...suggestion, lowConfidence };
  }
}
