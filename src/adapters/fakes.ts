import type { Card, CardSide, CollectionFile, Suggestion } from "../domain/card";
import type {
  AppInfo,
  AuthProvider,
  CapturedPhoto,
  CollectionStore,
  PendingChange,
  PendingUpload,
  PhotoSource,
  PhotoStore,
  Ports,
  Recognizer,
  ReleaseFeed,
  RemoteStore,
} from "../ports";

export class InMemoryCollectionStore implements CollectionStore {
  private cards = new Map<string, Card>();
  private queued = new Map<string, string>();
  async list() {
    return [...this.cards.values()];
  }
  async get(id: string) {
    return this.cards.get(id);
  }
  async put(card: Card) {
    await this.putMany([card]);
  }
  async putMany(cards: Card[]) {
    for (const card of cards) {
      this.cards.set(card.id, card);
      this.queued.set(card.id, card.updatedAt);
    }
  }
  async putSynced(cards: Card[]) {
    for (const card of cards) this.cards.set(card.id, card);
  }
  async pending(): Promise<PendingChange[]> {
    return [...this.queued].map(([cardId, updatedAt]) => ({ cardId, updatedAt }));
  }
  async pendingChanges() {
    return this.queued.size;
  }
  async clearPending(changes: PendingChange[]) {
    for (const { cardId, updatedAt } of changes) {
      if (this.queued.get(cardId) === updatedAt) this.queued.delete(cardId);
    }
  }
  private meta = new Map<string, string>();
  async getMeta(key: string) {
    return this.meta.get(key);
  }
  async setMeta(key: string, value: string) {
    this.meta.set(key, value);
  }
  async clear() {
    this.cards.clear();
    this.queued.clear();
    this.meta.clear();
  }
}

export class InMemoryRemoteStore implements RemoteStore {
  private file: CollectionFile | null = null;
  private counter = 0;
  private nextId = 0;
  private photos = new Map<string, { name: string; kind: "full" | "thumb"; blob: Blob }>();
  /** Errors thrown by the next remote calls, one per call. */
  failures: Error[] = [];
  /** Runs once right after the next collection write, to simulate another install writing. */
  onAfterWrite: (() => void | Promise<void>) | null = null;

  private check() {
    const error = this.failures.shift();
    if (error) throw error;
  }
  async readCollection() {
    this.check();
    return this.file ? { file: structuredClone(this.file), version: String(this.counter) } : null;
  }
  async version() {
    this.check();
    return this.file ? String(this.counter) : null;
  }
  async writeCollection(file: CollectionFile) {
    this.check();
    this.file = structuredClone(file);
    const version = String(++this.counter);
    const hook = this.onAfterWrite;
    this.onAfterWrite = null;
    await hook?.();
    return version;
  }
  async uploadPhoto(name: string, blob: Blob, kind: "full" | "thumb") {
    this.check();
    const id = `file-${++this.nextId}`;
    this.photos.set(id, { name, kind, blob });
    return id;
  }
  async downloadPhoto(fileId: string) {
    this.check();
    const photo = this.photos.get(fileId);
    if (!photo) throw new Error(`No photo ${fileId}`);
    return photo.blob;
  }
  async deletePhoto(fileId: string) {
    this.check();
    this.photos.delete(fileId);
  }

  /** Test helpers: what another install or the user in Drive would do or see. */
  writeAsOtherInstall(file: CollectionFile) {
    this.file = structuredClone(file);
    this.counter++;
  }
  deleteCollection() {
    this.file = null;
  }
  hasPhoto(fileId: string | null) {
    return fileId !== null && this.photos.has(fileId);
  }
  photoNames() {
    return [...this.photos.values()].filter((p) => p.kind === "full").map((p) => p.name);
  }
  photoBytes() {
    return [...this.photos.values()].reduce((sum, p) => sum + p.blob.size, 0);
  }
}

export class InMemoryPhotoStore implements PhotoStore {
  private thumbs = new Map<string, Blob>();
  private full = new Map<string, Blob>();
  private uploads = new Map<string, string>();
  private deletes = new Set<string>();
  private key = (id: string, side: CardSide) => `${id}:${side}`;
  async saveCaptured(id: string, side: CardSide, photo: CapturedPhoto) {
    this.thumbs.set(this.key(id, side), photo.thumb);
    this.full.set(this.key(id, side), photo.full);
    this.uploads.set(this.key(id, side), crypto.randomUUID());
  }
  async getThumb(id: string, side: CardSide) {
    return this.thumbs.get(this.key(id, side));
  }
  async getFull(id: string, side: CardSide) {
    return this.full.get(this.key(id, side));
  }
  async cacheThumb(id: string, side: CardSide, blob: Blob) {
    this.thumbs.set(this.key(id, side), blob);
  }
  async cacheFull(id: string, side: CardSide, blob: Blob) {
    this.full.set(this.key(id, side), blob);
  }
  async pendingUploads(): Promise<PendingUpload[]> {
    return [...this.uploads].map(([key, revision]) => {
      const [cardId, side] = key.split(":") as [string, CardSide];
      return { cardId, side, revision, full: this.full.get(key)!, thumb: this.thumbs.get(key)! };
    });
  }
  async markUploaded(id: string, side: CardSide, revision: string) {
    if (this.uploads.get(this.key(id, side)) === revision) this.uploads.delete(this.key(id, side));
  }
  async queueDelete(fileId: string) {
    this.deletes.add(fileId);
  }
  async pendingDeletes() {
    return [...this.deletes];
  }
  async clearDeletes(fileIds: string[]) {
    for (const id of fileIds) this.deletes.delete(id);
  }
  async clear() {
    this.thumbs.clear();
    this.full.clear();
    this.uploads.clear();
    this.deletes.clear();
  }
}

export class FakePhotoSource implements PhotoSource {
  next: Blob | null = new Blob(["fake"], { type: "image/jpeg" });
  /** When set, the back capture returns this instead of `next` (null: back scanner closed). */
  nextBack?: Blob | null;
  error: Error | null = null;
  private result() {
    if (this.error) throw this.error;
    return this.next;
  }
  async capture(side: CardSide) {
    if (side === "back" && this.nextBack !== undefined && !this.error) return this.nextBack;
    return this.result();
  }
  async pick() {
    return this.result();
  }
}

export class FakeRecognizer implements Recognizer {
  result: Suggestion = {};
  error: Error | null = null;
  calls = 0;
  async recognize() {
    this.calls++;
    if (this.error) throw this.error;
    return this.result;
  }
}

export class FakeAuthProvider implements AuthProvider {
  constructor(public user: { email: string } | null = null) {}
  consent = true;
  async signIn() {
    if (!this.consent) return null;
    this.user = { email: "owner@example.test" };
    return this.user;
  }
  async signOut() {
    this.user = null;
  }
  async currentUser() {
    return this.user;
  }
  async getAccessToken() {
    if (!this.user) throw new Error("Not signed in");
    return "fake-access-token";
  }
  async getIdToken() {
    if (!this.user) throw new Error("Not signed in");
    return "fake-id-token";
  }
}

export class FakeAppInfo implements AppInfo {
  version = { versionName: "0.0.0", versionCode: 0 };
  async getVersion() {
    return this.version;
  }
}

export class FakeReleaseFeed implements ReleaseFeed {
  release = { version: "0.0.0", apkUrl: "https://example.test/the-binder-0.0.0.apk" };
  error: Error | null = null;
  async latest() {
    if (this.error) throw this.error;
    return this.release;
  }
}

export function createFakePorts(): Ports {
  return {
    collection: new InMemoryCollectionStore(),
    remote: new InMemoryRemoteStore(),
    photos: new InMemoryPhotoStore(),
    photoSource: new FakePhotoSource(),
    ocr: new FakeRecognizer(),
    claude: new FakeRecognizer(),
    auth: new FakeAuthProvider(),
    appInfo: new FakeAppInfo(),
    releaseFeed: new FakeReleaseFeed(),
  };
}
