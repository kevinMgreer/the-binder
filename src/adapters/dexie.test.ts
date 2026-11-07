import "fake-indexeddb/auto";
import { expect, test } from "vitest";
import { makeCard } from "../domain/fixtures";
import { DexieCollectionStore } from "./dexie";

let n = 0;
const newStore = () => new DexieCollectionStore(`test-${n++}`);

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

test("clear removes cards and the outbox", async () => {
  const store = newStore();
  await store.put(makeCard());
  await store.clear();
  expect(await store.list()).toEqual([]);
  expect(await store.pendingChanges()).toBe(0);
});
