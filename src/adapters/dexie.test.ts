import "fake-indexeddb/auto";
import { Blob as NodeBlob } from "node:buffer";
import { expect, test } from "vitest";
import { makeCard } from "../domain/fixtures";
import { BinderDb } from "./db";
import { DexieCollectionStore } from "./dexie";
import { DexiePhotoStore } from "./dexie-photos";

let n = 0;
const newDb = () => new BinderDb(`test-${n++}`);
const newStore = () => new DexieCollectionStore(newDb());
// jsdom's Blob does not survive fake-indexeddb's structured clone; Node's does.
const blob = (bytes: number) => new NodeBlob([new Uint8Array(bytes)]) as unknown as Blob;

test("added card can be read back and is queued for sync", async () => {
  const store = newStore();
  const card = makeCard();
  await store.put(card);
  expect(await store.get(card.id)).toEqual(card);
  expect(await store.pendingChanges()).toBe(1);
});

test("editing a card replaces it and keeps one pending change", async () => {
  const store = newStore();
  const card = makeCard();
  await store.put(card);
  await store.put({ ...card, notes: "new", updatedAt: "2026-02-02T00:00:00.000Z" });
  expect((await store.list()).map((c) => c.notes)).toEqual(["new"]);
  expect(await store.pendingChanges()).toBe(1);
});

test("deleting stores a tombstone instead of removing the card", async () => {
  const store = newStore();
  const card = makeCard();
  await store.put(card);
  await store.put({ ...card, deletedAt: "2026-02-02T00:00:00.000Z" });
  const [stored] = await store.list();
  expect(stored.deletedAt).toBe("2026-02-02T00:00:00.000Z");
});

test("cards from the remote are not queued for sync", async () => {
  const store = newStore();
  await store.putSynced([makeCard()]);
  expect(await store.pendingChanges()).toBe(0);
});

test("clearing a pending change keeps it when the card was edited again meanwhile", async () => {
  const store = newStore();
  const card = makeCard();
  await store.put(card);
  const [change] = await store.pending();
  await store.put({ ...card, notes: "edited during sync", updatedAt: "2026-03-03T00:00:00.000Z" });
  await store.clearPending([change]);
  expect(await store.pendingChanges()).toBe(1);
});

test("clear removes cards and the outbox", async () => {
  const store = newStore();
  await store.put(makeCard());
  await store.clear();
  expect(await store.list()).toEqual([]);
  expect(await store.pendingChanges()).toBe(0);
});

test("captured photos are queued for upload until marked uploaded", async () => {
  const photos = new DexiePhotoStore(newDb());
  await photos.saveCaptured("c1", "front", { full: blob(100), thumb: blob(10) });
  expect(await photos.pendingUploads()).toHaveLength(1);
  expect((await photos.getFull("c1", "front"))?.size).toBe(100);
  await photos.markUploaded("c1", "front");
  expect(await photos.pendingUploads()).toEqual([]);
});

test("full photo cache evicts the least recently used photos but never pending ones", async () => {
  const photos = new DexiePhotoStore(newDb(), 250);
  await photos.saveCaptured("pending", "front", { full: blob(100), thumb: blob(1) });
  await photos.cacheFull("old", "front", blob(100));
  await new Promise((r) => setTimeout(r, 5));
  await photos.cacheFull("new", "front", blob(100));
  expect(await photos.getFull("old", "front")).toBeUndefined();
  expect(await photos.getFull("new", "front")).toBeDefined();
  expect(await photos.getFull("pending", "front")).toBeDefined();
});

test("deleted Drive file ids are queued until cleared", async () => {
  const photos = new DexiePhotoStore(newDb());
  await photos.queueDelete("a");
  await photos.queueDelete("b");
  await photos.clearDeletes(["a"]);
  expect(await photos.pendingDeletes()).toEqual(["b"]);
});
