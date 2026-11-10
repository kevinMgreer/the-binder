import { expect, test } from "vitest";
import { makeCard } from "../domain/fixtures";
import { merge, purgeTombstones } from "./merge";

const at = (n: number) => new Date(Date.UTC(2026, 5, 1, 0, 0, n)).toISOString();

test("cards on only one side are all kept", () => {
  const a = makeCard();
  const b = makeCard();
  expect(merge([a], [b]).map((c) => c.id).sort()).toEqual([a.id, b.id].sort());
});

test("the later edit wins for the same card, whichever side it is on", () => {
  const older = makeCard({ notes: "old", updatedAt: at(1) });
  const newer = { ...older, notes: "new", updatedAt: at(2) };
  expect(merge([older], [newer])[0].notes).toBe("new");
  expect(merge([newer], [older])[0].notes).toBe("new");
});

test("a later tombstone beats an earlier edit, and a later edit beats an earlier tombstone", () => {
  const card = makeCard({ updatedAt: at(1) });
  const deleted = { ...card, deletedAt: at(2), updatedAt: at(2) };
  const edited = { ...card, notes: "edit", updatedAt: at(3) };
  expect(merge([card], [deleted])[0].deletedAt).toBe(at(2));
  expect(merge([deleted], [edited])[0].deletedAt).toBeNull();
});

test("a remote card from an older install without subset and insert does not drop a later local subset", () => {
  const remote = makeCard({ updatedAt: at(1) });
  const local = { ...remote, subset: "Future Stars", updatedAt: at(2) };
  expect(merge([local], [remote])[0].subset).toBe("Future Stars");
  expect(merge([remote], [local])[0].subset).toBe("Future Stars");
});

test("a tie is resolved the same way on both installs", () => {
  const base = makeCard({ updatedAt: at(1) });
  const x = { ...base, notes: "x" };
  const y = { ...base, notes: "y" };
  expect(merge([x], [y])[0].notes).toBe(merge([y], [x])[0].notes);
  const tombstone = { ...base, deletedAt: at(1) };
  expect(merge([base], [tombstone])[0].deletedAt).toBe(at(1));
  expect(merge([tombstone], [base])[0].deletedAt).toBe(at(1));
});

test("tombstones are purged after 90 days and not before", () => {
  const now = new Date(Date.UTC(2026, 5, 1));
  const day = 24 * 60 * 60 * 1000;
  const old = makeCard({ deletedAt: new Date(now.getTime() - 91 * day).toISOString() });
  const recent = makeCard({ deletedAt: new Date(now.getTime() - 89 * day).toISOString() });
  const live = makeCard();
  expect(purgeTombstones([old, recent, live], now)).toEqual([recent, live]);
});
