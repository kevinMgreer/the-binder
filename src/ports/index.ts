import type { Card, CardSide, CollectionFile, Suggestion } from "../domain/card";

export interface CollectionStore {
  list(): Promise<Card[]>;
  get(id: string): Promise<Card | undefined>;
  put(card: Card): Promise<void>;
  putMany(cards: Card[]): Promise<void>;
  pendingChanges(): Promise<number>;
  clear(): Promise<void>;
}

export interface RemoteStore {
  readCollection(): Promise<{ file: CollectionFile; version: string } | null>;
  writeCollection(file: CollectionFile): Promise<string>;
  uploadPhoto(name: string, blob: Blob): Promise<string>;
  downloadPhoto(fileId: string): Promise<Blob>;
  deletePhoto(fileId: string): Promise<void>;
}

export interface PhotoStore {
  putThumb(cardId: string, side: CardSide, blob: Blob): Promise<void>;
  getThumb(cardId: string, side: CardSide): Promise<Blob | undefined>;
  putFull(cardId: string, side: CardSide, blob: Blob): Promise<void>;
  getFull(cardId: string, side: CardSide): Promise<Blob | undefined>;
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
