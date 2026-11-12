import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { createFakePorts } from "../adapters/fakes";
import type { Card } from "../domain/card";
import { makeCard } from "../domain/fixtures";
import { PermissionDeniedError, type CapturedPhoto, type Photos } from "../ports";
import { CardForm } from "./CardForm";
import { PortsProvider } from "./ports-context";
import { openSheets } from "./Sheet";

const acquire = vi.hoisted(() => vi.fn());
vi.mock("../photos/acquire", () => ({ acquirePhotos: acquire }));

afterEach(() => {
  cleanup();
  acquire.mockReset();
});

function renderForm(card?: ReturnType<typeof makeCard>, cards: ReturnType<typeof makeCard>[] = []) {
  const onCancel = vi.fn();
  render(
    <PortsProvider ports={createFakePorts()}>
      <CardForm card={card} cards={cards} onSave={async () => {}} onCancel={onCancel} />
    </PortsProvider>,
  );
  return onCancel;
}

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const cancel = () => fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

test("Cancel comes first in the action row and Save, the primary button, last", () => {
  renderForm();
  const buttons = within(screen.getByRole("button", { name: "Save" }).parentElement as HTMLElement).getAllByRole("button");
  expect(buttons.map((b) => b.textContent)).toEqual(["Cancel", "Save"]);
  expect(buttons[1].classList.contains("primary")).toBe(true);
  expect(buttons[0].classList.contains("primary")).toBe(false);
});

test("an untouched add form closes at once", () => {
  const onCancel = renderForm();
  cancel();
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("alertdialog")).toBeNull();
});

test("Cancel on a typed add form asks first and focuses Keep editing", () => {
  const onCancel = renderForm();
  type("Player", "Hank Aaron");
  cancel();
  const dialog = screen.getByRole("alertdialog", { name: "Discard this card?" });
  expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "Keep editing" }));
  expect(onCancel).not.toHaveBeenCalled();
});

test("Keep editing closes the question and keeps the entries", () => {
  renderForm();
  type("Player", "Hank Aaron");
  cancel();
  fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect((screen.getByLabelText("Player") as HTMLInputElement).value).toBe("Hank Aaron");
});

test("Discard leaves the form", () => {
  const onCancel = renderForm();
  type("Player", "Hank Aaron");
  cancel();
  fireEvent.click(screen.getByRole("button", { name: "Discard" }));
  expect(onCancel).toHaveBeenCalledTimes(1);
});

test("a value typed and erased again is not an entry", () => {
  const onCancel = renderForm();
  type("Year", "1");
  type("Year", "");
  cancel();
  expect(onCancel).toHaveBeenCalledTimes(1);
});

test("the edit form asks only after a change, with its own wording", () => {
  const onCancel = renderForm(makeCard());
  cancel();
  expect(onCancel).toHaveBeenCalledTimes(1);
  type("Quantity", "5");
  cancel();
  expect(screen.getByRole("alertdialog", { name: "Discard changes?" })).toBeTruthy();
  expect(onCancel).toHaveBeenCalledTimes(1);
});

test("a captured photo alone makes Cancel ask", async () => {
  const photo: CapturedPhoto = { full: new Blob(["f"]), thumb: new Blob(["t"]) };
  acquire.mockResolvedValue([photo]);
  const onCancel = renderForm();
  fireEvent.click(screen.getByRole("button", { name: "Add front photo" }));
  fireEvent.click(screen.getByRole("button", { name: "Scan front" }));
  await screen.findByRole("button", { name: "Change front photo" });
  cancel();
  expect(screen.getByRole("alertdialog", { name: "Discard this card?" })).toBeTruthy();
  expect(onCancel).not.toHaveBeenCalled();
});

test("removing a stored front photo then Cancel and Discard leaves the card unchanged", () => {
  const stored = makeCard({ photos: { front: { fileId: "f", thumbId: "t", name: "front.jpg" }, back: null } });
  const before = structuredClone(stored);
  const onCancel = renderForm(stored);
  fireEvent.click(screen.getByRole("button", { name: "Change front photo" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove front photo" }));
  expect(screen.getByRole("button", { name: "Add front photo" })).toBeTruthy();
  cancel();
  expect(screen.getByRole("alertdialog", { name: "Discard changes?" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Discard" }));
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(stored).toEqual(before);
});

test("removing a capture on the add form leaves the form not dirty", async () => {
  acquire.mockResolvedValue([{ full: new Blob(["f"]), thumb: new Blob(["t"]) } satisfies CapturedPhoto]);
  const onCancel = renderForm();
  fireEvent.click(screen.getByRole("button", { name: "Add front photo" }));
  fireEvent.click(screen.getByRole("button", { name: "Scan front" }));
  fireEvent.click(await screen.findByRole("button", { name: "Change front photo" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove front photo" }));
  cancel();
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("alertdialog")).toBeNull();
});

test("saving after Remove hands null for that side to onSave", async () => {
  const stored = makeCard({ photos: { front: { fileId: "f", thumbId: "t", name: "front.jpg" }, back: null } });
  const onSave = vi.fn(async () => {});
  render(
    <PortsProvider ports={createFakePorts()}>
      <CardForm card={stored} cards={[]} onSave={onSave} onCancel={() => {}} />
    </PortsProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Change front photo" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove front photo" }));
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await vi.waitFor(() => expect(onSave).toHaveBeenCalled());
  expect((onSave.mock.calls[0] as unknown[])[1]).toEqual({ front: null });
});

test("Identify with Claude sends no front photo after the stored front was removed", async () => {
  const stored = makeCard({ photos: { front: { fileId: "f", thumbId: "t", name: "front.jpg" }, back: null } });
  const ports = createFakePorts();
  const recognize = vi.spyOn(ports.claude, "recognize");
  const back: CapturedPhoto = { full: new Blob(["b"]), thumb: new Blob(["bt"]) };
  acquire.mockResolvedValue([back]);
  render(
    <PortsProvider ports={ports}>
      <CardForm card={stored} cards={[]} onSave={async () => {}} onCancel={() => {}} />
    </PortsProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Change front photo" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove front photo" }));
  fireEvent.click(screen.getByRole("button", { name: "Add back photo" }));
  fireEvent.click(screen.getByRole("button", { name: "Scan back" }));
  await screen.findByRole("button", { name: "Change back photo" });
  fireEvent.click(screen.getByRole("button", { name: "Identify with Claude" }));
  await vi.waitFor(() => expect(recognize).toHaveBeenCalledTimes(1));
  expect(recognize).toHaveBeenCalledWith({ front: undefined, back: back.full });
});

test("Keep editing returns focus to Cancel, by tap and by back", () => {
  renderForm();
  type("Player", "Hank Aaron");
  cancel();
  fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" }));
  cancel();
  act(() => openSheets.at(-1)?.());
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" }));
});

test("Discard on the edit form leaves the stored card unchanged", () => {
  const stored = makeCard();
  const before = structuredClone(stored);
  const onCancel = renderForm(stored);
  type("Quantity", "5");
  cancel();
  fireEvent.click(screen.getByRole("button", { name: "Discard" }));
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(stored).toEqual(before);
});

test("the photo stays attached after Keep editing", async () => {
  acquire.mockResolvedValue([{ full: new Blob(["f"]), thumb: new Blob(["t"]) } satisfies CapturedPhoto]);
  renderForm();
  fireEvent.click(screen.getByRole("button", { name: "Add front photo" }));
  fireEvent.click(screen.getByRole("button", { name: "Scan front" }));
  await screen.findByRole("button", { name: "Change front photo" });
  cancel();
  fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
  expect(screen.getByRole("button", { name: "Change front photo" })).toBeTruthy();
});

const front: CapturedPhoto = { full: new Blob(["f"]), thumb: new Blob(["ft"]) };
const backPhoto: CapturedPhoto = { full: new Blob(["b"]), thumb: new Blob(["bt"]) };
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const scanFront = () => {
  click("Add front photo");
  click("Scan front");
};

const settled = () => vi.waitFor(() => expect(screen.queryByText("Processing photo…")).toBeNull());

test("Scan front on an empty back takes both sides in one scan and fills both tiles", async () => {
  acquire.mockResolvedValue([front, backPhoto]);
  renderForm();
  scanFront();
  await screen.findByRole("button", { name: "Change back photo" });
  expect(screen.getByRole("button", { name: "Change front photo" })).toBeTruthy();
  expect(acquire.mock.calls.map((c) => c.slice(1))).toEqual([["front", "camera", 2]]);
});

test("Scan front while a back take is still processing asks the scanner for one page", async () => {
  acquire.mockReturnValueOnce(new Promise(() => {}));
  acquire.mockResolvedValue([front]);
  renderForm();
  click("Add back photo");
  click("Scan back");
  await screen.findByText("Processing photo…");
  scanFront();
  await screen.findByRole("button", { name: "Change front photo" });
  expect(acquire.mock.calls.map((c) => c.slice(1))).toEqual([["back", "camera", 1], ["front", "camera", 1]]);
});

test("a two-page scan finished after the front keeps the front and shows nothing", async () => {
  acquire.mockResolvedValue([front]);
  renderForm();
  scanFront();
  await screen.findByRole("button", { name: "Change front photo" });
  await settled();
  expect(screen.getByRole("button", { name: "Add back photo" })).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("heading", { name: "Add card" })).toBeTruthy();
});

test("a closed or denied two-page scan attaches nothing", async () => {
  acquire.mockResolvedValue([]);
  renderForm();
  scanFront();
  await settled();
  expect(screen.getByRole("button", { name: "Add front photo" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Add back photo" })).toBeTruthy();
  cleanup();
  acquire.mockRejectedValue(new PermissionDeniedError());
  renderForm();
  scanFront();
  expect((await screen.findByRole("alert")).textContent).toContain("Camera permission denied");
  expect(screen.getByRole("button", { name: "Add front photo" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Add back photo" })).toBeTruthy();
});

test("Retake, a stored back and Scan back each take one page", async () => {
  acquire.mockResolvedValue([front]);
  renderForm();
  scanFront();
  await screen.findByRole("button", { name: "Change front photo" });
  click("Change front photo");
  click("Retake front");
  await vi.waitFor(() => expect(acquire).toHaveBeenCalledTimes(2));
  await settled();
  cleanup();
  const stored = { fileId: "f", thumbId: "t", name: "back.jpg" };
  renderForm(makeCard({ photos: { front: null, back: stored } }));
  scanFront();
  await screen.findByRole("button", { name: "Change front photo" });
  cleanup();
  acquire.mockResolvedValue([backPhoto]);
  renderForm();
  click("Add back photo");
  click("Scan back");
  await screen.findByRole("button", { name: "Change back photo" });
  expect(screen.getByRole("button", { name: "Add front photo" })).toBeTruthy();
  expect(acquire.mock.calls.map((c) => c.slice(1))).toEqual([
    ["front", "camera", 2],
    ["front", "camera", 1],
    ["front", "camera", 1],
    ["back", "camera", 1],
  ]);
});

test("after a two-page scan Cancel then Discard saves nothing, and recognition ran once over both photos", async () => {
  acquire.mockResolvedValue([front, backPhoto]);
  const ports = createFakePorts();
  const recognize = vi.spyOn(ports.ocr, "recognize");
  const onCancel = vi.fn();
  const onSave = vi.fn(async () => {});
  render(
    <PortsProvider ports={ports}>
      <CardForm cards={[]} onSave={onSave} onCancel={onCancel} />
    </PortsProvider>,
  );
  scanFront();
  await screen.findByRole("button", { name: "Change back photo" });
  await vi.waitFor(() => expect(recognize).toHaveBeenCalledTimes(1));
  expect(recognize.mock.calls).toEqual([[{ front: front.full, back: backPhoto.full }]]);
  cancel();
  click("Discard");
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onSave).not.toHaveBeenCalled();
});

const form = () => document.querySelector("form") as HTMLFormElement;
const player = () => (screen.getByLabelText("Player") as HTMLInputElement).value;
const saveButton = () => screen.getByRole("button", { name: "Save" });

async function openDuplicate() {
  const existing = makeCard();
  const onSave = vi.fn(async (_card: Card, _photos?: Photos) => {});
  render(
    <PortsProvider ports={createFakePorts()}>
      <CardForm cards={[existing]} onSave={onSave} onCancel={vi.fn()} />
    </PortsProvider>,
  );
  type("Player", "Ronald Acuña Jr.");
  type("Year", "2024");
  type("Set", "Series 1");
  type("Card number", "27");
  fireEvent.click(saveButton());
  await screen.findByRole("alertdialog", { name: "Duplicate card" });
  return { existing, onSave };
}

test("the discard prompt is a modal over a scrim outside the inert form, with a danger Discard", () => {
  renderForm();
  type("Player", "Hank Aaron");
  expect(form().hasAttribute("inert")).toBe(false);
  cancel();
  const dialog = screen.getByRole("alertdialog", { name: "Discard this card?" });
  expect(dialog.getAttribute("aria-modal")).toBe("true");
  expect(dialog.parentElement?.matches(".backdrop.center")).toBe(true);
  expect(form().contains(dialog)).toBe(false);
  expect(form().hasAttribute("inert")).toBe(true);
  const discard = within(dialog).getByRole("button", { name: "Discard" });
  expect(discard.classList.contains("danger")).toBe(true);
  expect(discard.classList.contains("primary")).toBe(false);
  fireEvent.click(within(dialog).getByRole("button", { name: "Keep editing" }));
  expect(form().hasAttribute("inert")).toBe(false);
});

test("a scrim click or Escape on the discard prompt means Keep editing", () => {
  const onCancel = renderForm();
  type("Player", "Hank Aaron");
  for (const close of [
    () => fireEvent.click(screen.getByRole("alertdialog").parentElement!),
    () => fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" }),
  ]) {
    cancel();
    close();
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(onCancel).not.toHaveBeenCalled();
    expect(player()).toBe("Hank Aaron");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cancel" }));
  }
});

test("a click inside the discard panel does not close it", () => {
  renderForm();
  type("Player", "Hank Aaron");
  cancel();
  fireEvent.click(screen.getByText("Discard this card?"));
  expect(screen.getByRole("alertdialog")).toBeTruthy();
});

test("the duplicate prompt is a described modal alertdialog with its buttons in order", async () => {
  await openDuplicate();
  const dialog = screen.getByRole("alertdialog", { name: "Duplicate card" });
  expect(dialog.getAttribute("aria-modal")).toBe("true");
  expect(dialog.parentElement?.matches(".backdrop.center")).toBe(true);
  expect(form().hasAttribute("inert")).toBe(true);
  expect(document.getElementById(dialog.getAttribute("aria-describedby")!)?.textContent).toBe(
    "This card is already in your collection (1 owned).",
  );
  const buttons = within(dialog).getAllByRole("button");
  expect(buttons.map((b) => b.textContent)).toEqual(["Increase quantity", "Add as separate card", "Back to form"]);
  expect(document.activeElement).toBe(buttons[0]);
});

test("Back to form, the scrim, Escape and Android back close the duplicate prompt without saving", async () => {
  const { onSave } = await openDuplicate();
  const closers = [
    () => fireEvent.click(screen.getByRole("button", { name: "Back to form" })),
    () => fireEvent.click(screen.getByRole("alertdialog").parentElement!),
    () => fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" }),
    () => act(() => openSheets.at(-1)?.()),
  ];
  for (const [i, close] of closers.entries()) {
    close();
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(form().hasAttribute("inert")).toBe(false);
    expect(player()).toBe("Ronald Acuña Jr.");
    expect(document.activeElement).toBe(saveButton());
    expect(onSave).not.toHaveBeenCalled();
    if (i < closers.length - 1) {
      fireEvent.click(saveButton());
      await screen.findByRole("alertdialog", { name: "Duplicate card" });
    }
  }
});

test("Increase quantity saves the existing card at 2 and Add as separate card saves the new one", async () => {
  const first = await openDuplicate();
  fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
  expect(first.onSave).toHaveBeenCalledWith(expect.objectContaining({ id: first.existing.id, quantity: 2 }));
  cleanup();
  const second = await openDuplicate();
  fireEvent.click(screen.getByRole("button", { name: "Add as separate card" }));
  expect(second.onSave).toHaveBeenCalledWith(expect.objectContaining({ player: "Ronald Acuña Jr.", quantity: 1 }), {});
  expect(second.onSave.mock.calls[0][0].id).not.toBe(second.existing.id);
});

test("back with the duplicate prompt open closes it, then back asks to discard", async () => {
  await openDuplicate();
  act(() => openSheets.at(-1)?.());
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(form()).toBeTruthy();
  act(() => openSheets.at(-1)?.());
  expect(screen.getByRole("alertdialog", { name: "Discard this card?" })).toBeTruthy();
});
