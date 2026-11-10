import type { Card, CardSide, CollectionFile } from "../domain/card";
import { AuthExpiredError, type CollectionStore, type PhotoStore, type RemoteStore } from "../ports";
import { merge, purgeTombstones } from "./merge";
import { photoFileName, thumbFileName } from "./names";

export type SyncState = "idle" | "syncing" | "error" | "paused" | "needs-decision";

export interface SyncStatus {
  state: SyncState;
  pending: number;
  error?: string;
}

interface Deps {
  collection: CollectionStore;
  remote: RemoteStore;
  photos: PhotoStore;
}

interface Options {
  debounceMs?: number;
  intervalMs?: number;
  now?: () => Date;
  random?: () => number;
}

const REMOTE_SEEN = "remoteSeen";
const MAX_WRITE_TRIES = 3;
const MAX_RETRY_MS = 5 * 60 * 1000;
const THUMB_DOWNLOADS_AT_ONCE = 6;
const SIDES: CardSide[] = ["front", "back"];

export class SyncEngine {
  private status: SyncStatus = { state: "idle", pending: 0 };
  private listeners = new Set<(status: SyncStatus) => void>();
  private running: Promise<void> | null = null;
  private rerun = false;
  private started = false;
  private failures = 0;
  private lastVersion: string | null = null;
  private thumbs: Promise<void> = Promise.resolve();
  private debounceTimer?: ReturnType<typeof setTimeout>;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private intervalTimer?: ReturnType<typeof setInterval>;

  private debounceMs: number;
  private intervalMs: number;
  private now: () => Date;
  private random: () => number;

  constructor(
    private deps: Deps,
    options: Options = {},
  ) {
    this.debounceMs = options.debounceMs ?? 5000;
    this.intervalMs = options.intervalMs ?? 5 * 60 * 1000;
    this.now = options.now ?? (() => new Date());
    this.random = options.random ?? Math.random;
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async refreshStatus() {
    const pending = await this.deps.collection.pendingChanges();
    this.setStatus({ ...this.status, pending });
  }

  /** Call after every local save: updates the pending count and schedules a push. */
  notifyChange() {
    void this.refreshStatus();
    if (!this.started) return;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => void this.syncNow(), this.debounceMs);
  }

  start() {
    this.started = true;
    void this.syncNow();
    clearInterval(this.intervalTimer);
    this.intervalTimer = setInterval(() => void this.syncNow(), this.intervalMs);
  }

  stop() {
    this.started = false;
    clearTimeout(this.debounceTimer);
    clearTimeout(this.retryTimer);
    clearInterval(this.intervalTimer);
  }

  /** Resolves when background thumbnail downloads from the last sync are done. */
  settled(): Promise<void> {
    return this.thumbs;
  }

  /** Resolves when no sync or thumbnail download is running; call after `stop()` before wiping local data. */
  async whenIdle(): Promise<void> {
    await this.running;
    await this.thumbs;
  }

  syncNow(): Promise<void> {
    if (this.running) {
      this.rerun = true;
      return this.running;
    }
    this.running = this.runLoop().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  async resolveMissingFile(choice: "restore" | "empty") {
    const { collection, photos, remote } = this.deps;
    if (choice === "empty") {
      await collection.clear();
      await photos.clear();
    }
    const changes = await collection.pending();
    await remote.writeCollection(this.file(choice === "restore" ? await collection.list() : []));
    await collection.clearPending(changes);
    this.lastVersion = null;
    await this.syncNow();
  }

  private async runLoop() {
    do {
      this.rerun = false;
      const ok = await this.attempt();
      if (!ok) return;
    } while (this.rerun);
  }

  private async attempt(): Promise<boolean> {
    clearTimeout(this.retryTimer);
    this.setStatus({ state: "syncing", pending: this.status.pending });
    try {
      const outcome = await this.syncOnce();
      this.failures = 0;
      const pending = await this.deps.collection.pendingChanges();
      this.setStatus({ state: outcome === "needs-decision" ? "needs-decision" : "idle", pending });
      return outcome === "done";
    } catch (error) {
      const pending = await this.deps.collection.pendingChanges();
      if (error instanceof AuthExpiredError) {
        this.setStatus({ state: "paused", pending, error: error.message });
      } else {
        this.setStatus({ state: "error", pending, error: error instanceof Error ? error.message : String(error) });
        this.scheduleRetry();
      }
      return false;
    }
  }

  private scheduleRetry() {
    const delay = Math.min(MAX_RETRY_MS, 2000 * 2 ** this.failures) * (0.5 + this.random() / 2);
    this.failures++;
    this.retryTimer = setTimeout(() => void this.syncNow(), delay);
  }

  private setStatus(status: SyncStatus) {
    this.status = status;
    for (const listener of this.listeners) listener(status);
  }

  private file(cards: Card[]): CollectionFile {
    return { schemaVersion: 2, updatedAt: this.now().toISOString(), cards };
  }

  private async syncOnce(): Promise<"done" | "needs-decision"> {
    const { collection, remote, photos } = this.deps;

    const version = await remote.version();
    if (version === null && (await this.remoteWasDeleted())) return "needs-decision";

    const [pending, uploads, deletes] = await Promise.all([
      collection.pending(),
      photos.pendingUploads(),
      photos.pendingDeletes(),
    ]);
    if (pending.length + uploads.length + deletes.length === 0 && version !== null && version === this.lastVersion) {
      return "done";
    }

    await this.uploadPhotos();
    const pulled = await this.pullMergePush();
    if (pulled === "needs-decision") return pulled;
    await this.deleteTrashedPhotos();
    this.thumbs = this.fetchThumbs(pulled);
    return "done";
  }

  private async uploadPhotos() {
    const { collection, remote, photos } = this.deps;
    for (const upload of await photos.pendingUploads()) {
      const card = await collection.get(upload.cardId);
      if (!card || card.deletedAt !== null) {
        await photos.markUploaded(upload.cardId, upload.side, upload.revision);
        continue;
      }
      const fileId = await remote.uploadPhoto(photoFileName(card, upload.side), upload.full, "full");
      const thumbId = await remote.uploadPhoto(thumbFileName(card, upload.side), upload.thumb, "thumb");

      const fresh = (await collection.get(upload.cardId)) ?? card;
      const old = fresh.photos[upload.side];
      for (const id of [old?.fileId, old?.thumbId]) if (id) await photos.queueDelete(id);
      await collection.put({
        ...fresh,
        photos: { ...fresh.photos, [upload.side]: { fileId, thumbId, name: photoFileName(card, upload.side) } },
        updatedAt: this.now().toISOString(),
      });
      await photos.markUploaded(upload.cardId, upload.side, upload.revision);
    }
  }

  private async pullMergePush(): Promise<Card[] | "needs-decision"> {
    const { collection, remote } = this.deps;
    for (let attempt = 0; attempt < MAX_WRITE_TRIES; attempt++) {
      const pendingBefore = await collection.pending();
      const remoteData = await remote.readCollection();
      const local = await collection.list();

      if (!remoteData) {
        if (local.length > 0 && (await this.remoteSeen())) return "needs-decision";
        const created = await remote.writeCollection(this.file(local));
        if ((await remote.version()) !== created) continue;
        await collection.setMeta(REMOTE_SEEN, "1");
        await collection.clearPending(pendingBefore);
        this.lastVersion = created;
        return [];
      }
      await collection.setMeta(REMOTE_SEEN, "1");

      const merged = purgeTombstones(merge(local, remoteData.file.cards), this.now());
      const localById = new Map(local.map((c) => [c.id, c]));
      const fromRemote = merged.filter((c) => localById.get(c.id) !== c);
      if (fromRemote.length > 0) {
        await collection.putSynced(fromRemote);
        const fromRemoteIds = new Set(fromRemote.map((c) => c.id));
        await collection.clearPending(pendingBefore.filter((p) => fromRemoteIds.has(p.cardId)));
      }

      const remoteById = new Map(remoteData.file.cards.map((c) => [c.id, c]));
      const sameAsRemote = (c: Card) => {
        const r = remoteById.get(c.id);
        return !!r && r.updatedAt === c.updatedAt && (r === c || JSON.stringify(r) === JSON.stringify(c));
      };
      // A version 1 file is rewritten once even when no card changed.
      if (remoteData.file.schemaVersion === 2 && merged.length === remoteById.size && merged.every(sameAsRemote)) {
        await collection.clearPending(pendingBefore);
        this.lastVersion = remoteData.version;
        return fromRemote;
      }

      const written = await remote.writeCollection(this.file(merged));
      if ((await remote.version()) === written) {
        await collection.clearPending(pendingBefore);
        this.lastVersion = written;
        return fromRemote;
      }
    }
    throw new Error("Drive changed while syncing; will try again");
  }

  private async remoteSeen() {
    return (await this.deps.collection.getMeta(REMOTE_SEEN)) === "1";
  }

  /** The data file is gone although this device synced with it before and still has cards. */
  private async remoteWasDeleted() {
    return (await this.remoteSeen()) && (await this.deps.collection.list()).length > 0;
  }

  private async deleteTrashedPhotos() {
    const { remote, photos } = this.deps;
    for (const id of await photos.pendingDeletes()) {
      await remote.deletePhoto(id);
      await photos.clearDeletes([id]);
    }
  }

  private async fetchThumbs(cards: Card[]) {
    const { remote, photos } = this.deps;
    const wanted = cards.flatMap((card) =>
      SIDES.map((side) => ({ cardId: card.id, side, thumbId: card.photos[side]?.thumbId })),
    );
    const queue = wanted.filter((w) => w.thumbId);
    const worker = async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        try {
          if (!(await photos.getThumb(job.cardId, job.side))) {
            await photos.cacheThumb(job.cardId, job.side, await remote.downloadPhoto(job.thumbId!));
          }
        } catch {
          // The list shows a placeholder until a later sync fetches it.
        }
      }
    };
    await Promise.all(Array.from({ length: THUMB_DOWNLOADS_AT_ONCE }, worker));
  }
}
