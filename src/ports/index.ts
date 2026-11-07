import type { Card, CardSide, CollectionFile, Suggestion } from "../domain/card";

export interface PendingChange {
  cardId: string;
  updatedAt: string;
}

export interface CollectionStore {
  list(): Promise<Card[]>;
  get(id: string): Promise<Card | undefined>;
  /** Saves a local edit and queues it for sync. */
  put(card: Card): Promise<void>;
  putMany(cards: Card[]): Promise<void>;
  /** Saves cards that came from the remote; they are not queued for sync. */
  putSynced(cards: Card[]): Promise<void>;
  pending(): Promise<PendingChange[]>;
  pendingChanges(): Promise<number>;
  /** Clears a queued change only if the card has not been edited again since. */
  clearPending(changes: PendingChange[]): Promise<void>;
  getMeta(key: string): Promise<string | undefined>;
  setMeta(key: string, value: string): Promise<void>;
  /** Removes all cards, queued changes and metadata. */
  clear(): Promise<void>;
}

export class AuthExpiredError extends Error {}

export interface RemoteStore {
  readCollection(): Promise<{ file: CollectionFile; version: string } | null>;
  /** Cheap check of the data file's version; null when the file does not exist. */
  version(): Promise<string | null>;
  writeCollection(file: CollectionFile): Promise<string>;
  uploadPhoto(name: string, blob: Blob, kind: "full" | "thumb"): Promise<string>;
  downloadPhoto(fileId: string): Promise<Blob>;
  deletePhoto(fileId: string): Promise<void>;
}

export interface CapturedPhoto {
  full: Blob;
  thumb: Blob;
}

export type Photos = Partial<Record<CardSide, CapturedPhoto>>;

export interface PendingUpload extends CapturedPhoto {
  cardId: string;
  side: CardSide;
  /** Changes whenever the photo is retaken, so a finished upload cannot clear a newer one. */
  revision: string;
}

export interface PhotoStore {
  /** Stores a newly captured photo and queues it for upload. */
  saveCaptured(cardId: string, side: CardSide, photo: CapturedPhoto): Promise<void>;
  getThumb(cardId: string, side: CardSide): Promise<Blob | undefined>;
  getFull(cardId: string, side: CardSide): Promise<Blob | undefined>;
  cacheThumb(cardId: string, side: CardSide, blob: Blob): Promise<void>;
  cacheFull(cardId: string, side: CardSide, blob: Blob): Promise<void>;
  pendingUploads(): Promise<PendingUpload[]>;
  markUploaded(cardId: string, side: CardSide, revision: string): Promise<void>;
  queueDelete(fileId: string): Promise<void>;
  pendingDeletes(): Promise<string[]>;
  clearDeletes(fileIds: string[]): Promise<void>;
  clear(): Promise<void>;
}

export class PermissionDeniedError extends Error {}

export interface PhotoSource {
  capture(side: CardSide): Promise<Blob | null>;
  pick(): Promise<Blob | null>;
}

export interface Recognizer {
  recognize(photos: { front?: Blob; back?: Blob }): Promise<Suggestion>;
}

export interface AuthProvider {
  signIn(): Promise<{ email: string } | null>;
  signOut(): Promise<void>;
  currentUser(): Promise<{ email: string } | null>;
  getAccessToken(): Promise<string>;
  getIdToken(): Promise<string>;
}

export interface AppInfo {
  getVersion(): Promise<{ versionName: string; versionCode: number }>;
}

export interface ReleaseFeed {
  latest(): Promise<{ version: string; apkUrl: string }>;
}

export interface Ports {
  collection: CollectionStore;
  remote: RemoteStore;
  photos: PhotoStore;
  photoSource: PhotoSource;
  recognizer: Recognizer;
  auth: AuthProvider;
  appInfo: AppInfo;
  releaseFeed: ReleaseFeed;
}
