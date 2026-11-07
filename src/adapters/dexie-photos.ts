import type { CardSide } from "../domain/card";
import type { CapturedPhoto, PendingUpload, PhotoStore } from "../ports";
import type { BinderDb } from "./db";

const key = (cardId: string, side: CardSide): [string, CardSide] => [cardId, side];

export const FULL_CACHE_BYTES = 200 * 1024 * 1024;

export class DexiePhotoStore implements PhotoStore {
  constructor(
    private db: BinderDb,
    private capBytes = FULL_CACHE_BYTES,
  ) {}

  saveCaptured(cardId: string, side: CardSide, { full, thumb }: CapturedPhoto) {
    return this.db.transaction("rw", this.db.thumbs, this.db.fullBlobs, this.db.fullMeta, async () => {
      await this.db.thumbs.put({ cardId, side, blob: thumb });
      await this.db.fullBlobs.put({ cardId, side, blob: full });
      await this.db.fullMeta.put({ cardId, side, size: full.size, lastAccess: Date.now(), pending: 1 });
    });
  }

  async getThumb(cardId: string, side: CardSide) {
    return (await this.db.thumbs.get(key(cardId, side)))?.blob;
  }

  async getFull(cardId: string, side: CardSide) {
    const row = await this.db.fullBlobs.get(key(cardId, side));
    if (row) await this.db.fullMeta.update(key(cardId, side), { lastAccess: Date.now() });
    return row?.blob;
  }

  async cacheThumb(cardId: string, side: CardSide, blob: Blob) {
    await this.db.thumbs.put({ cardId, side, blob });
  }

  async cacheFull(cardId: string, side: CardSide, blob: Blob) {
    await this.db.transaction("rw", this.db.fullBlobs, this.db.fullMeta, async () => {
      const existing = await this.db.fullMeta.get(key(cardId, side));
      await this.db.fullBlobs.put({ cardId, side, blob });
      await this.db.fullMeta.put({ cardId, side, size: blob.size, lastAccess: Date.now(), pending: existing?.pending ?? 0 });
    });
    await this.evict();
  }

  async pendingUploads(): Promise<PendingUpload[]> {
    const metas = await this.db.fullMeta.where("pending").equals(1).toArray();
    const uploads: PendingUpload[] = [];
    for (const { cardId, side } of metas) {
      const [full, thumb] = await Promise.all([
        this.db.fullBlobs.get(key(cardId, side)),
        this.db.thumbs.get(key(cardId, side)),
      ]);
      if (full && thumb) uploads.push({ cardId, side, full: full.blob, thumb: thumb.blob });
    }
    return uploads;
  }

  async markUploaded(cardId: string, side: CardSide) {
    await this.db.fullMeta.update(key(cardId, side), { pending: 0 });
  }

  async queueDelete(fileId: string) {
    await this.db.photoTrash.put({ fileId });
  }

  pendingDeletes() {
    return this.db.photoTrash.toCollection().primaryKeys();
  }

  async clearDeletes(fileIds: string[]) {
    await this.db.photoTrash.bulkDelete(fileIds);
  }

  async clear() {
    await Promise.all([
      this.db.thumbs.clear(),
      this.db.fullBlobs.clear(),
      this.db.fullMeta.clear(),
      this.db.photoTrash.clear(),
    ]);
  }

  private async evict() {
    const metas = (await this.db.fullMeta.toArray()).sort((a, b) => a.lastAccess - b.lastAccess);
    let total = metas.reduce((sum, m) => sum + m.size, 0);
    const evicted: [string, CardSide][] = [];
    for (const m of metas) {
      if (total <= this.capBytes) break;
      if (m.pending) continue;
      evicted.push(key(m.cardId, m.side));
      total -= m.size;
    }
    if (evicted.length === 0) return;
    await this.db.transaction("rw", this.db.fullBlobs, this.db.fullMeta, async () => {
      await this.db.fullBlobs.bulkDelete(evicted);
      await this.db.fullMeta.bulkDelete(evicted);
    });
  }
}
