import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createFakePorts, FakeGallery, InMemoryRemoteStore } from "../adapters/fakes";
import { makeCard } from "../domain/fixtures";
import { CardDetail } from "./CardDetail";
import { PortsProvider } from "./ports-context";

beforeEach(() => {
  URL.createObjectURL = () => "blob:x";
  URL.revokeObjectURL = () => {};
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const card = makeCard({
  id: "1a2b3c4d-0000-4000-8000-000000000000",
  player: "Shohei Ohtani",
  year: 2024,
  manufacturer: "Topps",
  cardNumber: "1",
  photos: {
    front: { fileId: "f", thumbId: "t", name: "front.webp" },
    back: { fileId: "b", thumbId: "bt", name: "back.webp" },
  },
});
const thumb = new Blob(["thumb"]);
const front = new Blob(["front-full"]);
const back = new Blob(["back-full"]);

async function open({ cached = true, onLine = true }: { cached?: boolean; onLine?: boolean } = {}) {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(onLine);
  const ports = createFakePorts();
  const gallery = ports.gallery as FakeGallery;
  for (const side of ["front", "back"] as const) await ports.photos.cacheThumb(card.id, side, thumb);
  if (cached) {
    await ports.photos.cacheFull(card.id, "front", front);
    await ports.photos.cacheFull(card.id, "back", back);
  }
  render(
    <PortsProvider ports={ports}>
      <CardDetail card={card} onEdit={() => {}} onDelete={async () => {}} onMarkOwned={async () => {}} />
    </PortsProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "View front photo" }));
  await screen.findByTestId("zoom-front");
  return { ports, gallery };
}

const save = () => fireEvent.click(screen.getByRole("button", { name: "Save to phone" }));

test("Save the front: full photo, card-derived name, Saved to Photos", async () => {
  const { gallery } = await open();
  await waitFor(() => expect(screen.getByTestId("zoom-front")).toBeTruthy());
  save();
  expect((await screen.findByRole("status")).textContent).toBe("Saved to Photos");
  expect(gallery.saved).toHaveLength(1);
  expect(gallery.saved[0].photo).toBe(front);
  expect(gallery.saved[0].name).toMatch(/^2024-topps-1-shohei-ohtani-front-1a2b3c4d$/);
});

test("Save the side shown: only the back is saved", async () => {
  const { gallery } = await open();
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  await screen.findByTestId("zoom-back");
  save();
  await screen.findByRole("status");
  expect(gallery.saved).toHaveLength(1);
  expect(gallery.saved[0].photo).toBe(back);
  expect(gallery.saved[0].name).toMatch(/back-1a2b3c4d$/);
});

test("Full photo fetched first: the remote full photo is saved and cached, not the thumbnail", async () => {
  const ports = createFakePorts();
  const gallery = ports.gallery as FakeGallery;
  const remoteFull = new Blob(["remote-full"]);
  const urls = new Map<Blob, string>([[thumb, "blob:thumb"], [remoteFull, "blob:remote-full"]]);
  URL.createObjectURL = (b) => urls.get(b as Blob) ?? "blob:other";
  const id = await ports.remote.uploadPhoto("front.webp", remoteFull, "full");
  const c = makeCard({ ...card, photos: { front: { fileId: id, thumbId: "t", name: "front.webp" }, back: null } });
  await ports.photos.cacheThumb(c.id, "front", thumb);
  // The open-time download fails, so Save has to fetch the full photo itself.
  (ports.remote as InMemoryRemoteStore).failures.push(new Error("x"));
  render(
    <PortsProvider ports={ports}>
      <CardDetail card={c} onEdit={() => {}} onDelete={async () => {}} onMarkOwned={async () => {}} />
    </PortsProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "View front photo" }));
  await screen.findByTestId("zoom-front");
  const shown = () => screen.getByAltText("Front photo").getAttribute("src");
  expect(shown()).toBe("blob:thumb");
  save();
  expect((await screen.findByRole("status")).textContent).toBe("Saved to Photos");
  await waitFor(() => expect(shown()).toBe("blob:remote-full"));
  expect(gallery.saved[0].photo).toBe(remoteFull);
  expect(await ports.photos.getFull(c.id, "front")).toBe(remoteFull);
});

test("Offline without the full photo: nothing saved, says a connection is needed", async () => {
  const { gallery } = await open({ cached: false, onLine: false });
  save();
  expect((await screen.findByRole("status")).textContent).toMatch(/connect/i);
  expect(gallery.saved).toEqual([]);
});

test("Save fails: message shown, button enabled again", async () => {
  const { gallery } = await open();
  gallery.error = new Error("nope");
  save();
  expect((await screen.findByRole("status")).textContent).toBe("Could not save the photo");
  expect((screen.getByRole("button", { name: "Save to phone" }) as HTMLButtonElement).disabled).toBe(false);
  expect(screen.getByTestId("zoom-front")).toBeTruthy();
});

test("Status goes away after 3 seconds", async () => {
  await open();
  vi.useFakeTimers();
  save();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10);
  });
  expect(screen.getByRole("status").textContent).toBe("Saved to Photos");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000);
  });
  expect(screen.queryByRole("status")).toBeNull();
});

test("Saving again restarts the 3 second status timer", async () => {
  await open();
  vi.useFakeTimers();
  save();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2500);
  });
  save();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(screen.getByRole("status").textContent).toBe("Saved to Photos");
});

test("Save button is disabled while the gallery save is pending", async () => {
  const { gallery } = await open();
  let release!: () => void;
  gallery.save = () => new Promise<void>((resolve) => (release = resolve));
  save();
  const button = () => screen.getByRole("button", { name: "Save to phone" }) as HTMLButtonElement;
  await waitFor(() => expect(button().disabled).toBe(true));
  release();
  await waitFor(() => expect(button().disabled).toBe(false));
});

test("Button shape: icon only", async () => {
  await open();
  const button = screen.getByRole("button", { name: "Save to phone" });
  expect(button.textContent).toBe("");
  expect(button.querySelector("svg")).toBeTruthy();
});
