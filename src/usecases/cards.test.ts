import { expect, test, vi } from "vitest";
import { InMemoryCollectionStore, createFakePorts } from "../adapters/fakes";
import { makeCard } from "../domain/fixtures";
import { deleteCards, markOwned, saveCards } from "./cards";

async function setup(count = 5) {
  const ports = createFakePorts();
  const collection = ports.collection as InMemoryCollectionStore;
  const cards = Array.from({ length: count }, (_, i) =>
    makeCard({
      id: `c${i}`,
      player: `P${i}`,
      sortName: `s${i}`,
      cardNumber: `${i}`,
      notes: `n${i}`,
      quantity: i + 1,
      source: "ocr",
      photos: { front: { fileId: `f${i}`, thumbId: null, name: null }, back: null },
    }),
  );
  await collection.putMany(cards);
  await collection.clearPending(await collection.pending());
  return { collection, cards, deps: { collection, photos: ports.photos } };
}

test("markOwned clears wanted and resets createdAt and updatedAt, keeping the rest", () => {
  const card = makeCard({ wanted: true, notes: "n", quantity: 2, createdAt: "2026-01-01T00:00:00.000Z" });
  const next = markOwned(card, "2026-11-27T00:00:00.000Z");
  expect(next.wanted).toBeUndefined();
  expect(next).toMatchObject({ notes: "n", quantity: 2, createdAt: "2026-11-27T00:00:00.000Z", updatedAt: "2026-11-27T00:00:00.000Z" });
});

test("a patch changes only the chosen cards and only the patched field and updatedAt", async () => {
  const { collection, cards, deps } = await setup();
  const written = await saveCards(deps, ["c0", "c1", "c2"], { set: "Heritage" });
  expect(written).toBe(3);
  const after = await collection.list();
  const stamp = after.find((c) => c.id === "c0")!.updatedAt;
  expect(stamp).not.toBe(cards[0].updatedAt);
  for (const before of cards) {
    const now = after.find((c) => c.id === before.id)!;
    if (["c0", "c1", "c2"].includes(before.id)) expect(now).toEqual({ ...before, set: "Heritage", updatedAt: stamp });
    else expect(now).toEqual(before);
  }
  expect((await collection.pending()).map((p) => p.cardId).sort()).toEqual(["c0", "c1", "c2"]);
});

test("cards already equal to the patch are not written or queued", async () => {
  const { collection, deps } = await setup();
  const written = await saveCards(deps, ["c0", "c1"], { set: "Series 1" });
  expect(written).toBe(0);
  expect(await collection.pending()).toEqual([]);
});

test("unknown and deleted ids are skipped", async () => {
  const { collection, deps } = await setup(2);
  await collection.put({ ...(await collection.get("c1"))!, deletedAt: "2026-02-01T00:00:00.000Z" });
  expect(await saveCards(deps, ["c0", "c1", "nope"], { team: "Mets" })).toBe(1);
  expect((await collection.get("c1"))!.team).toBe("Atlanta Braves");
});

test("parallelName keeps serial and print run, creates a plain parallel on a base card, ignores a blank name on one", async () => {
  const { collection, deps } = await setup(3);
  const parallel = { name: "Gold", serialNumbered: true, serial: 5, serialLegible: true, printRun: 50 };
  await collection.put({ ...(await collection.get("c0"))!, parallel });
  await saveCards(deps, ["c0", "c1"], { parallelName: "Blue" });
  expect((await collection.get("c0"))!.parallel).toEqual({ ...parallel, name: "Blue" });
  expect((await collection.get("c1"))!.parallel).toEqual({
    name: "Blue",
    serialNumbered: false,
    serial: null,
    serialLegible: true,
    printRun: null,
  });
  expect(await saveCards(deps, ["c2"], { parallelName: "  " })).toBe(0);
  expect((await collection.get("c2"))!.parallel).toBeNull();
});

test("grading replaces the whole object; rookie leaves the other flags", async () => {
  const { collection, deps } = await setup(1);
  await collection.put({ ...(await collection.get("c0"))!, flags: { rookie: false, autograph: true, relic: true } });
  await saveCards(deps, ["c0"], { grading: { kind: "graded", company: "PSA", grade: "10" }, rookie: true });
  const card = (await collection.get("c0"))!;
  expect(card.grading).toEqual({ kind: "graded", company: "PSA", grade: "10" });
  expect(card.flags).toEqual({ rookie: true, autograph: true, relic: true });
});

test("all written cards go in one putMany call", async () => {
  const { collection, deps } = await setup();
  const spy = vi.spyOn(collection, "putMany");
  await saveCards(deps, ["c0", "c1", "c2"], { year: 2023, subset: " Base " });
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy.mock.calls[0][0]).toHaveLength(3);
  expect((await collection.get("c0"))!.subset).toBe("Base");
});

async function setupDelete() {
  const ports = createFakePorts();
  const collection = ports.collection as InMemoryCollectionStore;
  const ref = (id: string) => ({ fileId: `f${id}`, thumbId: `t${id}`, name: null });
  const cards = Array.from({ length: 10 }, (_, i) =>
    makeCard({ id: `c${i}`, photos: { front: ref(`${i}F`), back: ref(`${i}B`) } }),
  );
  await collection.putMany(cards);
  return { collection, cards, deps: { collection, photos: ports.photos } };
}

test("deleteCards soft-deletes the given cards, queues their photos and leaves the rest alone", async () => {
  const { collection, cards, deps } = await setupDelete();
  const queue = vi.spyOn(deps.photos, "queueDelete");
  const failed = await deleteCards(deps, cards.slice(0, 3));
  expect(failed).toEqual([]);
  expect(queue).toHaveBeenCalledTimes(12);
  const after = await collection.list();
  for (const id of ["c0", "c1", "c2"]) {
    const c = after.find((x) => x.id === id)!;
    expect(c.deletedAt).not.toBeNull();
    expect(c.updatedAt).toBe(c.deletedAt);
  }
  expect(after.filter((c) => c.deletedAt === null)).toEqual(cards.slice(3));
});

test("deleteCards keeps going when one card fails and returns its id", async () => {
  const { collection, cards, deps } = await setupDelete();
  const put = collection.put.bind(collection);
  vi.spyOn(collection, "put").mockImplementation((c) => (c.id === "c1" ? Promise.reject(new Error("x")) : put(c)));
  const queue = vi.spyOn(deps.photos, "queueDelete");
  const failed = await deleteCards(deps, cards.slice(0, 3));
  expect(failed).toEqual(["c1"]);
  expect(queue).toHaveBeenCalledTimes(8);
  expect(queue.mock.calls.map(([id]) => id).filter((id) => /^[ft]1[FB]$/.test(id))).toEqual([]);
  const after = await collection.list();
  expect(after.find((c) => c.id === "c1")?.deletedAt).toBeNull();
  expect(after.find((c) => c.id === "c2")?.deletedAt).not.toBeNull();
});
