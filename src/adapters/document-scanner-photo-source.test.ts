import { expect, test, vi } from "vitest";
import type { PhotoSource } from "../ports";
import { createCapacitorScanner } from "./capacitor-scanner";
import { ScannerPhotoSource, ScannerUnavailableError, type DocumentScanner } from "./document-scanner-photo-source";

const scanned = new Blob(["scanned"], { type: "image/jpeg" });
const fromCamera = new Blob(["camera"], { type: "image/jpeg" });
const picked = new Blob(["picked"], { type: "image/jpeg" });

const scannedBack = new Blob(["scanned back"], { type: "image/jpeg" });

function setup(scan: DocumentScanner["scan"], camera: PhotoSource["capture"] = async () => [fromCamera]) {
  const scanner: DocumentScanner = { scan: vi.fn(scan) };
  const fallback: PhotoSource = { capture: vi.fn(camera), pick: vi.fn(async () => picked) };
  return { source: new ScannerPhotoSource(scanner, fallback), scanner, fallback };
}

const unavailable = async (): Promise<Blob[]> => {
  throw new ScannerUnavailableError("no Play services");
};

test("a scan returns the scanned image and never touches the fallback", async () => {
  const { source, fallback } = setup(async () => [scanned]);
  expect(await source.capture("front")).toEqual([scanned]);
  expect(fallback.capture).not.toHaveBeenCalled();
});

test("cancelling the scanner returns no photo and does not open the system camera", async () => {
  const { source, fallback } = setup(async () => []);
  expect(await source.capture("front")).toEqual([]);
  expect(fallback.capture).not.toHaveBeenCalled();
});

test("an unavailable scanner falls back to the system camera for the same side", async () => {
  const { source, fallback } = setup(unavailable);
  expect(await source.capture("back")).toEqual([fromCamera]);
  expect(vi.mocked(fallback.capture).mock.calls).toEqual([["back"]]);
});

test("a two-page scan asks the scanner for two pages, naming the order, and returns both", async () => {
  const { source, scanner } = setup(async () => [scanned, scannedBack]);
  expect(await source.capture("front", 2)).toEqual([scanned, scannedBack]);
  expect(scanner.scan).toHaveBeenCalledWith("Scan the front of the card, then the back", 2);
});

test("without the scanner a two-page scan opens the system camera for the front, then for the back", async () => {
  const camera = vi.fn(async (side: string) => [side === "front" ? fromCamera : scannedBack]);
  const { source, fallback } = setup(unavailable, camera);
  expect(await source.capture("front", 2)).toEqual([fromCamera, scannedBack]);
  expect(vi.mocked(fallback.capture).mock.calls).toEqual([["front"], ["back"]]);
});

test("without the scanner a closed front camera does not open the camera for the back", async () => {
  const { source, fallback } = setup(unavailable, async () => []);
  expect(await source.capture("front", 2)).toEqual([]);
  expect(fallback.capture).toHaveBeenCalledTimes(1);
});

test("any other scanner error is rethrown, not hidden by the fallback", async () => {
  const { source, fallback } = setup(async () => {
    throw new Error("boom");
  });
  await expect(source.capture("front")).rejects.toThrow("boom");
  expect(fallback.capture).not.toHaveBeenCalled();
});

test("each one-page scan names its side in the hint it gives the scanner", async () => {
  const { source, scanner } = setup(async () => [scanned]);
  await source.capture("front");
  await source.capture("back");
  expect(vi.mocked(scanner.scan).mock.calls).toEqual([["Scan the front of the card", 1], ["Scan the back of the card", 1]]);
});

test("the Capacitor binding passes the hint and the page limit to the plugin", async () => {
  const plugin = { scan: vi.fn(async () => ({ uris: [] })) };
  await createCapacitorScanner(plugin, (u) => u, fetch).scan("Scan the back of the card", 1);
  expect(plugin.scan).toHaveBeenCalledWith({ hint: "Scan the back of the card", pages: 1 });
});

test("pick goes straight to the existing source and never to the scanner", async () => {
  const { source, scanner } = setup(async () => [scanned]);
  expect(await source.pick()).toBe(picked);
  expect(scanner.scan).not.toHaveBeenCalled();
});

test("the Capacitor binding turns file uris into blobs in order, no uris into cancel, and UNAVAILABLE into the typed error", async () => {
  const fetchFn = vi.fn(async (url: string) => ({ blob: async () => new Blob([url]) })) as unknown as typeof fetch;
  const toUrl = (uri: string) => `https://localhost/_capacitor_file_${uri}`;

  const ok = createCapacitorScanner({ scan: async () => ({ uris: ["/cache/a.jpg", "/cache/b.jpg"] }) }, toUrl, fetchFn);
  const pages = await ok.scan("hint", 2);
  expect(await Promise.all(pages.map((p) => p.text()))).toEqual([
    "https://localhost/_capacitor_file_/cache/a.jpg",
    "https://localhost/_capacitor_file_/cache/b.jpg",
  ]);

  const cancelled = createCapacitorScanner({ scan: async () => ({ uris: [] }) }, toUrl, fetchFn);
  expect(await cancelled.scan("hint", 1)).toEqual([]);

  const unavailable = createCapacitorScanner(
    { scan: async () => Promise.reject(Object.assign(new Error("not available"), { code: "UNAVAILABLE" })) },
    toUrl,
    fetchFn,
  );
  await expect(unavailable.scan("hint", 1)).rejects.toBeInstanceOf(ScannerUnavailableError);

  const other = createCapacitorScanner({ scan: async () => Promise.reject(Object.assign(new Error("x"), { code: "UNIMPLEMENTED" })) }, toUrl, fetchFn);
  await expect(other.scan("hint", 1)).rejects.not.toBeInstanceOf(ScannerUnavailableError);
});
