import type { CardSide } from "../domain/card";
import type { PhotoSource } from "../ports";

/** The scanner cannot run here (no Google Play services, or its module cannot be fetched). */
export class ScannerUnavailableError extends Error {}

export interface DocumentScanner {
  /** The cropped card image, or null when the user closed the scanner. Throws ScannerUnavailableError when it cannot run. */
  scan(): Promise<Blob | null>;
}

/** Captures through the document scanner and falls back to another source only when the scanner cannot run. */
export class ScannerPhotoSource implements PhotoSource {
  constructor(
    private readonly scanner: DocumentScanner,
    private readonly fallback: PhotoSource,
  ) {}

  async capture(side: CardSide): Promise<Blob | null> {
    try {
      return await this.scanner.scan();
    } catch (error) {
      if (error instanceof ScannerUnavailableError) return this.fallback.capture(side);
      throw error;
    }
  }

  pick() {
    return this.fallback.pick();
  }
}
