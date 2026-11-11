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
  fireEvent.click(screen.getByRole("button", { name: "Scan front" }));
  await screen.findByRole("button", { name: "Retake front" });
  cancel();
  expect(screen.getByRole("alertdialog", { name: "Discard this card?" })).toBeTruthy();
  expect(onCancel).not.toHaveBeenCalled();
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
  fireEvent.click(screen.getByRole("button", { name: "Scan front" }));
  await screen.findByRole("button", { name: "Retake front" });
  cancel();
  fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
  expect(screen.getByRole("button", { name: "Retake front" })).toBeTruthy();
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
