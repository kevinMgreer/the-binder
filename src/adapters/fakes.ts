import type { Card, CardSide, CollectionFile, Suggestion } from "../domain/card";
import type {
  AppInfo,
  AuthProvider,
  CollectionStore,
  PhotoSource,
  PhotoStore,
  Ports,
  Recognizer,
  ReleaseFeed,
  RemoteStore,
} from "../ports";

export class InMemoryCollectionStore implements CollectionStore {
  private cards = new Map<string, Card>();
  async list() {
    return [...this.cards.values()];
  }
  async get(id: string) {
    return this.cards.get(id);
  }
  async put(card: Card) {
    this.cards.set(card.id, card);
  }
  async putMany(cards: Card[]) {
    for (const card of cards) this.cards.set(card.id, card);
  }
  async pendingChanges() {
    return 0;
  }
  async clear() {
    this.cards.clear();
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
  private key = (id: string, side: CardSide) => `${id}:${side}`;
  async putThumb(id: string, side: CardSide, blob: Blob) {
    this.thumbs.set(this.key(id, side), blob);
  }
  async getThumb(id: string, side: CardSide) {
    return this.thumbs.get(this.key(id, side));
  }
  async putFull(id: string, side: CardSide, blob: Blob) {
    this.full.set(this.key(id, side), blob);
  }
  async getFull(id: string, side: CardSide) {
    return this.full.get(this.key(id, side));
  }
  async clear() {
    this.thumbs.clear();
    this.full.clear();
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
