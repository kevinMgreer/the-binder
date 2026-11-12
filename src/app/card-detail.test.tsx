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
