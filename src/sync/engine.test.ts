import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { InMemoryCollectionStore, InMemoryPhotoStore, InMemoryRemoteStore } from "../adapters/fakes";
import type { Card } from "../domain/card";
import { makeCard } from "../domain/fixtures";
import { deleteCard, saveCard } from "../usecases/cards";
import { SyncEngine } from "./engine";

const at = (seconds: number) => new Date(Date.UTC(2026, 5, 1, 0, 0, seconds)).toISOString();
const card = (overrides: Partial<Card> = {}) => makeCard({ createdAt: at(0), updatedAt: at(1), ...overrides });
const photo = (text = "x") => ({ full: new Blob([text.repeat(100)]), thumb: new Blob([text]) });

function install(remote: InMemoryRemoteStore, now = () => new Date(Date.UTC(2026, 5, 2))) {
  const collection = new InMemoryCollectionStore();
  const photos = new InMemoryPhotoStore();
  const engine = new SyncEngine({ collection, remote, photos }, { debounceMs: 5000, intervalMs: 300_000, now });
  return { collection, photos, engine, deps: { collection, photos } };
}

const visibleIds = async (c: InMemoryCollectionStore) =>
  (await c.list()).filter((x) => !x.deletedAt).map((x) => x.id).sort();
const remoteVisibleIds = async (r: InMemoryRemoteStore) =>
  ((await r.readCollection())?.file.cards ?? []).filter((x) => !x.deletedAt).map((x) => x.id).sort();

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

test("a pending-count refresh that resolves late keeps the state a sync set meanwhile", async () => {
  const { collection, engine } = install(new InMemoryRemoteStore());
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const count = collection.pendingChanges.bind(collection);
  collection.pendingChanges = async () => (await gate, count());
  const refresh = engine.refreshStatus();
  (engine as unknown as { setStatus(s: object): void }).setStatus({ state: "paused", pending: 0 });
  release();
  await refresh;
  expect(engine.getStatus().state).toBe("paused");
});

describe("collection folder in Drive", () => {
  test("first sign-in creates an empty data file", async () => {
    const remote = new InMemoryRemoteStore();
    await install(remote).engine.syncNow();
    expect((await remote.readCollection())?.file).toMatchObject({ schemaVersion: 2, cards: [] });
  });

  test("reinstall or second device uses the existing collection without duplicating it", async () => {
    const remote = new InMemoryRemoteStore();
    const a = install(remote);
    const c = card();
    await a.collection.put(c);
    await a.engine.syncNow();

    const b = install(remote);
    await b.engine.syncNow();
    expect(await visibleIds(b.collection)).toEqual([c.id]);
    expect(await b.collection.pendingChanges()).toBe(0);
    expect(await remoteVisibleIds(remote)).toEqual([c.id]);
  });

  test("a reinstall fetches thumbnails so the list is not blank", async () => {
    const remote = new InMemoryRemoteStore();
    const a = install(remote);
    const c = card();
    await saveCard(a.deps, c, { front: photo("t") });
    await a.engine.syncNow();

    const b = install(remote);
    await b.engine.syncNow();
    await b.engine.settled();
    expect(await b.photos.getThumb(c.id, "front")).toBeDefined();
    expect(await b.photos.getFull(c.id, "front")).toBeUndefined();
  });
});

describe("human-readable data file", () => {
  test("the data file has a schema version, readable card fields and photos referenced by name", async () => {
    const remote = new InMemoryRemoteStore();
    const a = install(remote);
    await saveCard(a.deps, card({ player: "Ronald Acuña Jr.", cardNumber: "27" }), { front: photo() });
    await a.engine.syncNow();
    const { file } = (await remote.readCollection())!;
    expect(file.schemaVersion).toBe(2);
    expect(file.cards[0].player).toBe("Ronald Acuña Jr.");
    expect(file.cards[0].photos.front?.name).toMatch(/^2024-.*-27-.*front.*\.webp$/);
  });
});

describe("version 1 file from an earlier install", () => {
  test("is rewritten once as version 2 with the same cards, then left alone", async () => {
    const remote = new InMemoryRemoteStore();
    const old = card();
    remote.writeAsOtherInstall({ schemaVersion: 1, updatedAt: at(0), cards: [old] });
    const a = install(remote);
    await a.collection.putSynced([old]);
    const write = vi.spyOn(remote, "writeCollection");

    await a.engine.syncNow();
    expect(write).toHaveBeenCalledTimes(1);
    const { file } = (await remote.readCollection())!;
    expect(file.schemaVersion).toBe(2);
    expect(file.cards).toEqual([old]);

    // A restarted app has no remembered version, so it takes the full pull-merge path instead of the early exit.
    const restarted = install(remote);
    await restarted.collection.putSynced([old]);
    await restarted.engine.syncNow();
    expect(write).toHaveBeenCalledTimes(1);
  });
});

describe("local working copy", () => {
  test("the collection stays readable and editable when Drive is unreachable", async () => {
    const remote = new InMemoryRemoteStore();
    const a = install(remote);
    await a.collection.put(card());
    remote.failures.push(new Error("offline"));
    await a.engine.syncNow();
    expect(a.engine.getStatus().state).toBe("error");
    expect(await a.collection.list()).toHaveLength(1);
  });
});

describe("sync to Drive", () => {
  test("a saved change reaches Drive within 10 seconds", async () => {
    const remote = new InMemoryRemoteStore();
    const a = install(remote);
    a.engine.start();
    await vi.advanceTimersByTimeAsync(0);
    const c = card();
    await a.collection.put(c);
    a.engine.notifyChange();
    await vi.advanceTimersByTimeAsync(5000);
    expect(await remoteVisibleIds(remote)).toEqual([c.id]);
    a.engine.stop();
  });

  test("changes and photos made offline are saved when the connection returns", async () => {
    const remote = new InMemoryRemoteStore();
    const a = install(remote);
    const c = card();
    await saveCard(a.deps, c, { front: photo() });
    remote.failures.push(new Error("offline"));
    await a.engine.syncNow();
    expect(a.engine.getStatus()).toMatchObject({ state: "error", pending: 1 });

    await a.engine.syncNow();
    expect(a.engine.getStatus()).toMatchObject({ state: "idle", pending: 0 });
    const stored = (await a.collection.get(c.id))!;
    expect(remote.hasPhoto(stored.photos.front!.fileId)).toBe(true);
    expect(remote.hasPhoto(stored.photos.front!.thumbId)).toBe(true);
    expect(await remoteVisibleIds(remote)).toEqual([c.id]);
    expect(await a.photos.pendingUploads()).toEqual([]);
  });

  test("the unsynced count shows pending changes and clears once saved", async () => {
    const remote = new InMemoryRemoteStore();
    const a = install(remote);
    await a.collection.put(card());
    await a.collection.put(card());
    await a.engine.refreshStatus();
    expect(a.engine.getStatus().pending).toBe(2);
    await a.engine.syncNow();
    expect(a.engine.getStatus().pending).toBe(0);
  });

  test("an edit made while a sync is running stays pending and is pushed next time", async () => {
    const remote = new InMemoryRemoteStore();
    const a = install(remote);
    const c = card();
    await a.collection.put(c);
    remote.onAfterWrite = () => a.collection.put({ ...c, notes: "edited mid-sync", updatedAt: at(50) });
    await a.engine.syncNow();
    expect(a.engine.getStatus().pending).toBe(1);

    await a.engine.syncNow();
    expect(a.engine.getStatus().pending).toBe(0);
    expect((await remote.readCollection())?.file.cards[0].notes).toBe("edited mid-sync");
  });
});

describe("merge changes from other devices", () => {
  async function shared() {
    const remote = new InMemoryRemoteStore();
    const a = install(remote);
    const b = install(remote);
    const c = card({ notes: "original" });
    await a.collection.put(c);
    await a.engine.syncNow();
    await b.engine.syncNow();
    return { remote, a, b, c };
  }

  test("different cards edited on two devices end up on both", async () => {
    const { remote, a, b } = await shared();
    const cardA = card({ player: "A", cardNumber: "1" });
    const cardB = card({ player: "B", cardNumber: "2" });
    await a.collection.put(cardA);
    await b.collection.put(cardB);
    await a.engine.syncNow();
    await b.engine.syncNow();
    await a.engine.syncNow();
    const expected = (await remoteVisibleIds(remote)).length;
    expect(expected).toBe(3);
    expect(await visibleIds(a.collection)).toEqual(await visibleIds(b.collection));
    expect(await visibleIds(a.collection)).toHaveLength(3);
  });

  test("the same card edited on both devices keeps the later edit everywhere", async () => {
    const { remote, a, b, c } = await shared();
    await a.collection.put({ ...c, notes: "from A", updatedAt: at(10) });
    await b.collection.put({ ...c, notes: "from B", updatedAt: at(20) });
    await a.engine.syncNow();
    await b.engine.syncNow();
    await a.engine.syncNow();
    expect((await a.collection.get(c.id))?.notes).toBe("from B");
    expect((await b.collection.get(c.id))?.notes).toBe("from B");
    expect((await remote.readCollection())?.file.cards[0].notes).toBe("from B");
  });

  test("a card deleted on one device and untouched on the other is gone from both and from Drive", async () => {
    const { remote, a, b, c } = await shared();
    await deleteCard(a.deps, c);
    await a.engine.syncNow();
    await b.engine.syncNow();
    expect(await visibleIds(a.collection)).toEqual([]);
    expect(await visibleIds(b.collection)).toEqual([]);
    expect(await remoteVisibleIds(remote)).toEqual([]);
  });

  test("another install writing during our upload is merged, not overwritten", async () => {
    const remote = new InMemoryRemoteStore();
    const a = install(remote);
    const mine = card({ player: "Mine", cardNumber: "1" });
    const theirs = card({ player: "Theirs", cardNumber: "2" });
    await a.collection.put(mine);
    remote.onAfterWrite = () =>
      remote.writeAsOtherInstall({ schemaVersion: 1, updatedAt: at(5), cards: [mine, theirs] });
    await a.engine.syncNow();
    expect(await remoteVisibleIds(remote)).toEqual([mine.id, theirs.id].sort());
    expect(await visibleIds(a.collection)).toEqual([mine.id, theirs.id].sort());
  });

  test("tombstones older than 90 days are purged when writing", async () => {
    const remote = new InMemoryRemoteStore();
    const old = card({ deletedAt: new Date(Date.UTC(2026, 0, 1)).toISOString() });
    remote.writeAsOtherInstall({ schemaVersion: 1, updatedAt: at(0), cards: [old] });
    const a = install(remote);
    await a.collection.put(card());
    await a.engine.syncNow();
    expect((await remote.readCollection())?.file.cards.map((x) => x.id)).not.toContain(old.id);
  });
});

describe("photos", () => {
  test("replacing the front photo removes the old photo from Drive", async () => {
    const remote = new InMemoryRemoteStore();
    const a = install(remote);
    const c = card();
    await saveCard(a.deps, c, { front: photo("a") });
    await a.engine.syncNow();
    const first = (await a.collection.get(c.id))!.photos.front!;

    await saveCard(a.deps, (await a.collection.get(c.id))!, { front: photo("b") });
    await a.engine.syncNow();
    const second = (await a.collection.get(c.id))!.photos.front!;
    expect(second.fileId).not.toBe(first.fileId);
    expect(remote.hasPhoto(first.fileId)).toBe(false);
    expect(remote.hasPhoto(first.thumbId)).toBe(false);
    expect(remote.hasPhoto(second.fileId)).toBe(true);
  });

  test("deleting a card removes its photos from Drive", async () => {
    const remote = new InMemoryRemoteStore();
    const a = install(remote);
    const c = card();
    await saveCard(a.deps, c, { front: photo() });
    await a.engine.syncNow();
    const ref = (await a.collection.get(c.id))!.photos.front!;
    await deleteCard(a.deps, c);
    await a.engine.syncNow();
    expect(remote.hasPhoto(ref.fileId)).toBe(false);
    expect(remote.photoNames()).toEqual([]);
  });

  test("photo files are named after the card so they are recognizable in Drive", async () => {
    const remote = new InMemoryRemoteStore();
    const a = install(remote);
    await saveCard(a.deps, card({ player: "Ronald Acuña Jr.", year: 2024, cardNumber: "27" }), {
      front: photo(),
      back: photo(),
    });
    await a.engine.syncNow();
    const names = remote.photoNames();
    expect(names).toHaveLength(2);
    for (const name of names) expect(name).toMatch(/2024.*27.*ronald-acuna-jr.*(front|back)/);
    expect(names.some((n) => n.includes("front"))).toBe(true);
    expect(names.some((n) => n.includes("back"))).toBe(true);
  });
});

describe("Drive failure handling", () => {
  test("rate limit or outage keeps changes queued, shows the problem and retries by itself", async () => {
    const remote = new InMemoryRemoteStore();
    const a = install(remote);
    const c = card();
    await a.collection.put(c);
    remote.failures.push(new Error("429 rate limit"), new Error("503 outage"));

    await a.engine.syncNow();
    expect(a.engine.getStatus()).toMatchObject({ state: "error", pending: 1 });
    expect(a.engine.getStatus().error).toMatch(/429/);

    await vi.advanceTimersByTimeAsync(60_000);
    expect(a.engine.getStatus()).toMatchObject({ state: "idle", pending: 0 });
    expect((await remote.readCollection())?.file.cards.map((x) => x.id)).toEqual([c.id]);
  });

  test("a deleted data file asks before doing anything, then restores from this device", async () => {
    const remote = new InMemoryRemoteStore();
    const a = install(remote);
    const c = card();
    await a.collection.put(c);
    await a.engine.syncNow();
    remote.deleteCollection();

    await a.engine.syncNow();
    expect(a.engine.getStatus().state).toBe("needs-decision");
    await a.engine.syncNow();
    expect(await remote.readCollection()).toBeNull();

    await a.engine.resolveMissingFile("restore");
    expect(await remoteVisibleIds(remote)).toEqual([c.id]);
    expect(a.engine.getStatus().state).toBe("idle");
  });

  test("a deleted data file can instead start an empty collection", async () => {
    const remote = new InMemoryRemoteStore();
    const a = install(remote);
    await a.collection.put(card());
    await a.engine.syncNow();
    remote.deleteCollection();
    await a.engine.syncNow();

    await a.engine.resolveMissingFile("empty");
    expect(await a.collection.list()).toEqual([]);
    expect((await remote.readCollection())?.file.cards).toEqual([]);
  });
});
