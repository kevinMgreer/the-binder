// @vitest-environment node
import { beforeEach, describe, expect, test } from "vitest";
import { AuthExpiredError } from "../ports";
import type { CollectionFile } from "../domain/card";
import { makeCard } from "../domain/fixtures";
import { DriveRemoteStore } from "./drive-remote-store";
import { FOLDER, FakeDrive } from "./testing/fake-drive";

let drive: FakeDrive;
let tokenCalls: number;

function store(root: "release" | "dev" = "release") {
  return new DriveRemoteStore({
    root,
    fetch: drive.fetch as unknown as typeof fetch,
    getAccessToken: async () => {
      tokenCalls++;
      return drive.token;
    },
  });
}

const collection = (...cards: ReturnType<typeof makeCard>[]): CollectionFile => ({
  schemaVersion: 2,
  updatedAt: "2026-06-01T00:00:00.000Z",
  cards,
});
const photo = (text: string) => new Blob([text], { type: "image/webp" });

beforeEach(() => {
  drive = new FakeDrive();
  tokenCalls = 0;
});

describe("collection folder in Drive", () => {
  test("first sign-in creates The Binder with a photos folder and a thumbs folder inside it", async () => {
    await store().writeCollection(collection());
    const [root] = drive.folders("The Binder");
    expect(root.appProperties).toEqual({ thebinder: "root" });
    const photos = drive.files.find((f) => f.name === "photos" && f.parents[0] === root.id)!;
    expect(photos.mimeType).toBe(FOLDER);
    expect(drive.files.find((f) => f.name === "thumbs" && f.parents[0] === photos.id)?.mimeType).toBe(FOLDER);
    expect(drive.files.find((f) => f.name === "collection.json")?.parents).toEqual([root.id]);
  });

  test("a reinstall or second device uses the existing folder instead of creating another", async () => {
    await store().writeCollection(collection(makeCard()));
    const second = store();
    const found = await second.readCollection();
    expect(found?.file.cards).toHaveLength(1);
    await second.uploadPhoto("a.webp", photo("x"), "full");
    expect(drive.folders("The Binder")).toHaveLength(1);
    expect(drive.files.filter((f) => f.name === "photos")).toHaveLength(1);
  });

  test("when two root folders exist the oldest one is used", async () => {
    await store().writeCollection(collection(makeCard({ player: "In the oldest" })));
    const older = drive.folders("The Binder")[0];
    drive.files.push({ ...older, id: "dup", createdTime: "2030-01-01T00:00:00.000Z", content: undefined });
    const found = await store().readCollection();
    expect(found?.file.cards[0].player).toBe("In the oldest");
  });

  test("the dev build uses its own folder and the release build never sees it", async () => {
    await store("dev").writeCollection(collection(makeCard({ player: "Dev card" })));
    expect(drive.folders("The Binder (dev)")).toHaveLength(1);
    expect(drive.folders("The Binder")).toHaveLength(0);

    expect(await store("release").readCollection()).toBeNull();
    await store("release").writeCollection(collection(makeCard({ player: "Release card" })));
    expect((await store("dev").readCollection())?.file.cards[0].player).toBe("Dev card");
    expect((await store("release").readCollection())?.file.cards[0].player).toBe("Release card");
  });
});

describe("data file", () => {
  test("is human-readable JSON with a schema version", async () => {
    await store().writeCollection(collection(makeCard({ player: "Ronald Acuña Jr." })));
    const text = drive.text(drive.named("collection.json")[0]);
    expect(text).toContain("\n");
    expect(JSON.parse(text).schemaVersion).toBe(2);
    expect(text).toContain("Ronald Acuña Jr.");
  });

  test("reads back what was written, and the version changes with every write", async () => {
    const s = store();
    expect(await s.version()).toBeNull();
    const first = await s.writeCollection(collection(makeCard({ notes: "one" })));
    expect(await s.version()).toBe(first);
    const second = await s.writeCollection(collection(makeCard({ notes: "two" })));
    expect(second).not.toBe(first);
    const read = await s.readCollection();
    expect(read?.version).toBe(second);
    expect(read?.file.cards[0].notes).toBe("two");
  });

  test("a data file the user deleted or trashed reads as missing and is recreated on the next write", async () => {
    const s = store();
    await s.writeCollection(collection(makeCard()));
    drive.named("collection.json")[0].trashed = true;
    expect(await s.version()).toBeNull();
    expect(await s.readCollection()).toBeNull();

    await s.writeCollection(collection(makeCard()));
    expect(await s.version()).not.toBeNull();
    expect(drive.named("collection.json").filter((f) => !f.trashed)).toHaveLength(1);
  });

  test("a deleted data file is noticed even when its id was cached", async () => {
    const s = store();
    await s.writeCollection(collection(makeCard()));
    drive.files.splice(drive.files.findIndex((f) => f.name === "collection.json"), 1);
    expect(await s.version()).toBeNull();
  });
});

describe("photos", () => {
  test("full photos go in photos and thumbnails in photos/thumbs, with the names given", async () => {
    const s = store();
    const fullId = await s.uploadPhoto("2024-topps-27-acuna-front-1234abcd.webp", photo("FULL"), "full");
    const thumbId = await s.uploadPhoto("card-front.webp", photo("THUMB"), "thumb");
    const photosFolder = drive.files.find((f) => f.name === "photos")!;
    const thumbsFolder = drive.files.find((f) => f.name === "thumbs")!;
    expect(drive.files.find((f) => f.id === fullId)).toMatchObject({ name: "2024-topps-27-acuna-front-1234abcd.webp", parents: [photosFolder.id] });
    expect(drive.files.find((f) => f.id === thumbId)).toMatchObject({ name: "card-front.webp", parents: [thumbsFolder.id] });
  });

  test("a photo downloads with exactly the bytes that were uploaded", async () => {
    const s = store();
    const original = new Uint8Array([0, 1, 2, 250, 251, 252, 255, 13, 10, 13, 10, 45, 45]);
    const id = await s.uploadPhoto("p.webp", new Blob([original], { type: "image/webp" }), "full");
    const downloaded = new Uint8Array(await (await s.downloadPhoto(id)).arrayBuffer());
    expect([...downloaded]).toEqual([...original]);
  });

  test("deleting removes the file, and deleting one that is already gone is fine", async () => {
    const s = store();
    const id = await s.uploadPhoto("p.webp", photo("x"), "full");
    await s.deletePhoto(id);
    expect(drive.files.find((f) => f.id === id)).toBeUndefined();
    await expect(s.deletePhoto(id)).resolves.toBeUndefined();
  });
});

describe("authorization and failures", () => {
  test("every request carries a fresh access token from the auth provider", async () => {
    const s = store();
    await s.writeCollection(collection());
    await s.version();
    expect(tokenCalls).toBeGreaterThan(1);
    expect(drive.requests.every((r) => r.authorization === `Bearer ${drive.token}`)).toBe(true);
  });

  test("a rejected token raises AuthExpiredError so sync pauses", async () => {
    drive.failNext = { status: 401 };
    await expect(store().readCollection()).rejects.toBeInstanceOf(AuthExpiredError);
  });

  test("rate limits and outages are ordinary errors that sync retries", async () => {
    drive.failNext = { status: 403, body: { error: { errors: [{ reason: "userRateLimitExceeded" }] } } };
    await expect(store().readCollection()).rejects.not.toBeInstanceOf(AuthExpiredError);
    drive.failNext = { status: 503 };
    await expect(store().readCollection()).rejects.toThrow();
    drive.failNext = { status: 429 };
    await expect(store().readCollection()).rejects.toThrow();
  });
});
