import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createFakePorts } from "../adapters/fakes";
import { makeCard } from "../domain/fixtures";
import { CardDetail } from "./CardDetail";
import { PortsProvider } from "./ports-context";

const urls = new Map<Blob, string>();
beforeEach(() => {
  urls.clear();
  URL.createObjectURL = (blob) => urls.get(blob as Blob) ?? "blob:unknown";
  URL.revokeObjectURL = () => {};
});
afterEach(cleanup);

const card = makeCard({ photos: { front: { fileId: "f", thumbId: "t", name: "front.jpg" }, back: null } });
const thumb = new Blob(["thumb"]);
const full = new Blob(["full"]);

async function open(withFull: boolean) {
  const ports = createFakePorts();
  const download = vi.spyOn(ports.remote, "downloadPhoto");
  urls.set(thumb, "blob:thumb");
  urls.set(full, "blob:full");
  await ports.photos.cacheThumb(card.id, "front", thumb);
  if (withFull) await ports.photos.cacheFull(card.id, "front", full);
  render(
    <PortsProvider ports={ports}>
      <CardDetail card={card} onEdit={() => {}} onDelete={async () => {}} />
    </PortsProvider>,
  );
  return { download, img: () => screen.getByRole("button", { name: "View front photo" }).querySelector("img") };
}

test("with only a thumbnail stored the detail photo shows the thumbnail", async () => {
  const { download, img } = await open(false);
  await waitFor(() => expect(img()?.getAttribute("src")).toBe("blob:thumb"));
  expect(download).not.toHaveBeenCalled();
});

test("with the full photo stored the detail photo switches to it, with no download", async () => {
  const { download, img } = await open(true);
  await waitFor(() => expect(img()?.getAttribute("src")).toBe("blob:full"));
  expect(download).not.toHaveBeenCalled();
});

test("the Delete dialog puts Delete (danger outline) before Keep (primary, focused)", () => {
  render(
    <PortsProvider ports={createFakePorts()}>
      <CardDetail card={card} onEdit={() => {}} onDelete={async () => {}} />
    </PortsProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  const dialog = screen.getByRole("alertdialog", { name: "Delete card" });
  const row = within(dialog).getAllByRole("button");
  expect(row.map((b) => b.textContent)).toEqual(["Delete", "Keep"]);
  expect(row[0].className).toBe("danger outline");
  expect(row[1].className).toBe("primary");
  expect(row[0].parentElement?.className).toBe("actions detail-actions");
  expect(document.activeElement).toBe(row[1]);
});

// jsdom has no PointerEvent (clientX would be dropped) and no pointer capture.
class TestPointerEvent extends MouseEvent {
  pointerId: number;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
  }
}
Object.assign(globalThis, { PointerEvent: TestPointerEvent });
Element.prototype.setPointerCapture = () => {};

const both = makeCard({
  photos: {
    front: { fileId: "f", thumbId: "t", name: "front.jpg" },
    back: { fileId: "b", thumbId: "bt", name: "back.jpg" },
  },
});

async function openView(c: typeof card, sides: ("front" | "back")[]) {
  const ports = createFakePorts();
  urls.set(thumb, "blob:thumb");
  for (const s of sides) await ports.photos.cacheThumb(c.id, s, thumb);
  render(
    <PortsProvider ports={ports}>
      <CardDetail card={c} onEdit={() => {}} onDelete={async () => {}} />
    </PortsProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "View front photo" }));
  return screen.findByTestId("zoom-front");
}

const drag = (el: HTMLElement, dx: number) => {
  fireEvent.pointerDown(el, { pointerId: 1, clientX: 200, clientY: 100 });
  fireEvent.pointerMove(el, { pointerId: 1, clientX: 200 + dx, clientY: 105 });
  fireEvent.pointerUp(el, { pointerId: 1, clientX: 200 + dx, clientY: 105 });
};

test("Swipe to the other side: left on the front shows the back, right returns", async () => {
  drag(await openView(both, ["front", "back"]), -80);
  const back = await screen.findByTestId("zoom-back");
  expect(screen.getByRole("dialog", { name: "Back photo view" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Back" }).getAttribute("aria-pressed")).toBe("true");
  drag(back, 80);
  await screen.findByTestId("zoom-front");
  expect(screen.getByRole("dialog", { name: "Front photo view" })).toBeTruthy();
});

test("One photo only: no swipe, no control", async () => {
  drag(await openView(card, ["front"]), -80);
  expect(screen.getByTestId("zoom-front")).toBeTruthy();
  expect(screen.getByRole("dialog", { name: "Front photo view" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Front" })).toBeNull();
});

async function zoomedFront() {
  const el = await openView(both, ["front", "back"]);
  for (let i = 0; i < 2; i++) {
    fireEvent.pointerDown(el, { pointerId: 1, clientX: 200, clientY: 100 });
    fireEvent.pointerUp(el, { pointerId: 1, clientX: 200, clientY: 100 });
  }
  expect(Number(el.getAttribute("data-scale"))).toBeGreaterThan(1);
  return el;
}

test("Zoomed photo pans instead of swiping", async () => {
  drag(await zoomedFront(), -80);
  expect(screen.getByTestId("zoom-front")).toBeTruthy();
  expect(screen.queryByTestId("zoom-back")).toBeNull();
  expect(screen.getByRole("dialog", { name: "Front photo view" })).toBeTruthy();
});

test("Control switches side and resets zoom", async () => {
  await zoomedFront();
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  const back = await screen.findByTestId("zoom-back");
  expect(back.getAttribute("data-scale")).toBe("1");
  expect(screen.getByRole("dialog", { name: "Back photo view" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Back" }).getAttribute("aria-pressed")).toBe("true");
});
