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
  async clear() {
    this.cards.clear();
    this.queued.clear();
  }
}

export class InMemoryRemoteStore implements RemoteStore {
  private file: CollectionFile | null = null;
  private version = 0;
  private photos = new Map<string, Blob>();
  failNext: Error | null = null;

  private check() {
    if (this.failNext) {
      const e = this.failNext;
      this.failNext = null;
      throw e;
    }
  }
  async readCollection() {
    this.check();
    return this.file ? { file: this.file, version: String(this.version) } : null;
  }
  async writeCollection(file: CollectionFile) {
    this.check();
    this.file = file;
    return String(++this.version);
  }
  async uploadPhoto(name: string, blob: Blob) {
    this.check();
    this.photos.set(name, blob);
    return name;
  }
  async downloadPhoto(fileId: string) {
    this.check();
    const blob = this.photos.get(fileId);
    if (!blob) throw new Error(`No photo ${fileId}`);
    return blob;
  }
  async deletePhoto(fileId: string) {
    this.check();
    this.photos.delete(fileId);
  }
}

export class InMemoryPhotoStore implements PhotoStore {
  private thumbs = new Map<string, Blob>();
  private full = new Map<string, Blob>();
  private uploads = new Set<string>();
  private deletes = new Set<string>();
  private key = (id: string, side: CardSide) => `${id}:${side}`;
  async saveCaptured(id: string, side: CardSide, photo: CapturedPhoto) {
    this.thumbs.set(this.key(id, side), photo.thumb);
    this.full.set(this.key(id, side), photo.full);
    this.uploads.add(this.key(id, side));
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
    return [...this.uploads].map((key) => {
      const [cardId, side] = key.split(":") as [string, CardSide];
      return { cardId, side, full: this.full.get(key)!, thumb: this.thumbs.get(key)! };
    });
  }
  async markUploaded(id: string, side: CardSide) {
    this.uploads.delete(this.key(id, side));
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
  error: Error | null = null;
  private result() {
    if (this.error) throw this.error;
    return this.next;
  }
  async capture(_side: CardSide) {
    return this.result();
  }
  async pick() {
    return this.result();
  }
}

export class FakeRecognizer implements Recognizer {
  result: Suggestion = {};
  async recognize() {
    return this.result;
  }
}

export class FakeAuthProvider implements AuthProvider {
  user: { email: string } | null = null;
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
    recognizer: new FakeRecognizer(),
    auth: new FakeAuthProvider(),
    appInfo: new FakeAppInfo(),
    releaseFeed: new FakeReleaseFeed(),
  };
}
