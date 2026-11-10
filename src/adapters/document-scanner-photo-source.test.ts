import { expect, test, vi } from "vitest";
import type { PhotoSource } from "../ports";
import { createCapacitorScanner } from "./capacitor-scanner";
import { ScannerPhotoSource, ScannerUnavailableError, type DocumentScanner } from "./document-scanner-photo-source";

const scanned = new Blob(["scanned"], { type: "image/jpeg" });
const fromCamera = new Blob(["camera"], { type: "image/jpeg" });
const picked = new Blob(["picked"], { type: "image/jpeg" });

function setup(scan: DocumentScanner["scan"]) {
  const scanner: DocumentScanner = { scan: vi.fn(scan) };
  const fallback: PhotoSource = { capture: vi.fn(async () => fromCamera), pick: vi.fn(async () => picked) };
  return { source: new ScannerPhotoSource(scanner, fallback), scanner, fallback };
}

test("a scan returns the scanned image and never touches the fallback", async () => {
  const { source, fallback } = setup(async () => scanned);
  expect(await source.capture("front")).toBe(scanned);
  expect(fallback.capture).not.toHaveBeenCalled();
});

test("cancelling the scanner returns null and does not open the system camera", async () => {
  const { source, fallback } = setup(async () => null);
  expect(await source.capture("front")).toBeNull();
  expect(fallback.capture).not.toHaveBeenCalled();
});

test("an unavailable scanner falls back to the system camera for the same side", async () => {
  const { source, fallback } = setup(async () => {
    throw new ScannerUnavailableError("no Play services");
  });
  expect(await source.capture("back")).toBe(fromCamera);
  expect(fallback.capture).toHaveBeenCalledWith("back");
});

test("any other scanner error is rethrown, not hidden by the fallback", async () => {
  const { source, fallback } = setup(async () => {
    throw new Error("boom");
  });
  await expect(source.capture("front")).rejects.toThrow("boom");
  expect(fallback.capture).not.toHaveBeenCalled();
});

test("pick goes straight to the existing source and never to the scanner", async () => {
  const { source, scanner } = setup(async () => scanned);
  expect(await source.pick()).toBe(picked);
  expect(scanner.scan).not.toHaveBeenCalled();
});

test("the Capacitor binding turns a file uri into a blob, a null uri into cancel, and UNAVAILABLE into the typed error", async () => {
  const fetchFn = vi.fn(async (url: string) => ({ blob: async () => new Blob([url]) })) as unknown as typeof fetch;
  const toUrl = (uri: string) => `https://localhost/_capacitor_file_${uri}`;

  const ok = createCapacitorScanner({ scan: async () => ({ uri: "/cache/a.jpg" }) }, toUrl, fetchFn);
  expect(await (await ok.scan())!.text()).toBe("https://localhost/_capacitor_file_/cache/a.jpg");

  const cancelled = createCapacitorScanner({ scan: async () => ({ uri: null }) }, toUrl, fetchFn);
  expect(await cancelled.scan()).toBeNull();

  const unavailable = createCapacitorScanner(
    { scan: async () => Promise.reject(Object.assign(new Error("not available"), { code: "UNAVAILABLE" })) },
    toUrl,
    fetchFn,
  );
  await expect(unavailable.scan()).rejects.toBeInstanceOf(ScannerUnavailableError);

  const other = createCapacitorScanner({ scan: async () => Promise.reject(Object.assign(new Error("x"), { code: "UNIMPLEMENTED" })) }, toUrl, fetchFn);
  await expect(other.scan()).rejects.not.toBeInstanceOf(ScannerUnavailableError);
});
