import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { createFakePorts } from "../adapters/fakes";
import { makeCard } from "../domain/fixtures";
import type { CapturedPhoto } from "../ports";
import { CardForm } from "./CardForm";
import { PortsProvider } from "./ports-context";
import { openSheets } from "./Sheet";

const acquire = vi.hoisted(() => vi.fn());
vi.mock("../photos/acquire", () => ({ acquirePhoto: acquire }));

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
  acquire.mockResolvedValue(photo);
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
  acquire.mockResolvedValue({ full: new Blob(["f"]), thumb: new Blob(["t"]) } satisfies CapturedPhoto);
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
  acquire.mockResolvedValue(back);
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
  acquire.mockResolvedValue({ full: new Blob(["f"]), thumb: new Blob(["t"]) } satisfies CapturedPhoto);
  renderForm();
  fireEvent.click(screen.getByRole("button", { name: "Add front photo" }));
  fireEvent.click(screen.getByRole("button", { name: "Scan front" }));
  await screen.findByRole("button", { name: "Change front photo" });
  cancel();
  fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
  expect(screen.getByRole("button", { name: "Change front photo" })).toBeTruthy();
});

test("back with the duplicate prompt open shows no discard dialog", async () => {
  renderForm(undefined, [makeCard()]);
  type("Player", "Ronald Acuña Jr.");
  type("Year", "2024");
  type("Set", "Series 1");
  type("Card number", "27");
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByRole("dialog", { name: "Duplicate card" });
  act(() => openSheets.at(-1)?.());
  expect(screen.queryByRole("alertdialog")).toBeNull();
});
