import type { CardSide } from "../domain/card";
import type { PhotoSource } from "../ports";

/** The scanner cannot run here (no Google Play services, or its module cannot be fetched). */
export class ScannerUnavailableError extends Error {}

export interface DocumentScanner {
  /** Up to `pages` cropped card images in the order taken, empty when the user closed the scanner. `hint` is a short message shown over the scanner. Throws ScannerUnavailableError when it cannot run. */
  scan(hint: string, pages: number): Promise<Blob[]>;
}

/** Captures through the document scanner and falls back to another source only when the scanner cannot run. */
export class ScannerPhotoSource implements PhotoSource {
  constructor(
    private readonly scanner: DocumentScanner,
    private readonly fallback: PhotoSource,
  ) {}

  async capture(side: CardSide, pages = 1): Promise<Blob[]> {
    try {
      return await this.scanner.scan(pages === 2 ? "Scan the front of the card, then the back" : `Scan the ${side} of the card`, pages);
    } catch (error) {
      if (!(error instanceof ScannerUnavailableError)) throw error;
      // The system camera takes one photo per launch, so a two-page scan opens it again for the back.
      const first = await this.fallback.capture(side);
      return pages === 2 && first.length > 0 ? [...first, ...(await this.fallback.capture("back"))] : first;
    }
  }

  pick() {
    return this.fallback.pick();
  }
}
