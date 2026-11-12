import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { createFakePorts } from "../adapters/fakes";
import { makeCard } from "../domain/fixtures";
import { PermissionDeniedError, type CapturedPhoto } from "../ports";
import { CardForm } from "./CardForm";
import { PhotoSlot } from "./PhotoSlot";
import { PortsProvider } from "./ports-context";

const acquire = vi.hoisted(() => vi.fn());
vi.mock("../photos/acquire", () => ({ acquirePhoto: acquire }));

afterEach(() => {
  cleanup();
  acquire.mockReset();
});

const renderSlot = (props: Partial<Parameters<typeof PhotoSlot>[0]> = {}) =>
  render(
    <PortsProvider ports={createFakePorts()}>
      <PhotoSlot side="front" onChange={() => {}} {...props} />
    </PortsProvider>,
  );

const tile = (name: string) => screen.getByRole("button", { name }) as HTMLButtonElement;
const choice = (name: string, sheet = "Front photo") =>
  within(screen.getByRole("dialog", { name: sheet })).getByRole("button", { name });
const stored = { fileId: "f", thumbId: "t", name: "front.jpg" };

test("an empty tile reads Front and its chooser offers Scan and Pick", () => {
  renderSlot();
  expect(tile("Add front photo").textContent).toContain("Front");
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(tile("Add front photo"));
  expect(choice("Scan front")).toBeTruthy();
  expect(choice("Pick front from photos")).toBeTruthy();
  expect(within(screen.getByRole("dialog")).queryByRole("button", { name: "Retake front" })).toBeNull();
});

test("a stored photo whose thumbnail has not loaded already reads Change, with Retake, Pick and Remove", () => {
  renderSlot({ card: makeCard({ photos: { front: stored, back: null } }) });
  fireEvent.click(tile("Change front photo"));
  expect(choice("Retake front")).toBeTruthy();
  expect(choice("Pick front from photos")).toBeTruthy();
  expect(choice("Remove front photo")).toBeTruthy();
});

test("a captured photo reads Change with Retake", () => {
  const captured: CapturedPhoto = { full: new Blob(["f"]), thumb: new Blob(["t"]) };
  renderSlot({ captured });
  fireEvent.click(tile("Change front photo"));
  expect(choice("Retake front")).toBeTruthy();
});

test("a side removed on the form shows an empty tile although a photo is stored", () => {
  renderSlot({ card: makeCard({ photos: { front: stored, back: null } }), captured: null });
  expect(tile("Add front photo")).toBeTruthy();
});

test("choosing Remove reports null and closes the chooser", () => {
  const onChange = vi.fn();
  renderSlot({ card: makeCard({ photos: { front: stored, back: null } }), onChange });
  fireEvent.click(tile("Change front photo"));
  fireEvent.click(choice("Remove front photo"));
  expect(onChange).toHaveBeenCalledWith(null);
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("choosing an action closes the chooser", async () => {
  acquire.mockResolvedValue(null);
  renderSlot();
  fireEvent.click(tile("Add front photo"));
  fireEvent.click(choice("Pick front from photos"));
  expect(screen.queryByRole("dialog")).toBeNull();
  await vi.waitFor(() => expect(screen.queryByRole("status")).toBeNull());
});

test("while a photo is being prepared a status line shows and the tile is disabled", async () => {
  acquire.mockReturnValue(new Promise(() => {}));
  renderSlot();
  fireEvent.click(tile("Add front photo"));
  fireEvent.click(choice("Scan front"));
  expect((await screen.findByRole("status")).textContent).toBe("Processing photo…");
  expect(tile("Add front photo").disabled).toBe(true);
});

test("a permission-denied error still shows as an alert", async () => {
  acquire.mockRejectedValue(new PermissionDeniedError());
  renderSlot();
  fireEvent.click(tile("Add front photo"));
  fireEvent.click(choice("Scan front"));
  expect((await screen.findByRole("alert")).textContent).toContain("Camera permission denied");
});

test("a load error still shows as an alert", async () => {
  acquire.mockRejectedValue(new Error("bad image"));
  renderSlot();
  fireEvent.click(tile("Add front photo"));
  fireEvent.click(choice("Pick front from photos"));
  expect((await screen.findByRole("alert")).textContent).toBe("Could not load that photo.");
});

test("Save is disabled while either tile is preparing a photo, and enabled again after", async () => {
  let finish: (photo: CapturedPhoto | null) => void = () => {};
  acquire.mockReturnValue(new Promise((resolve) => (finish = resolve)));
  render(
    <PortsProvider ports={createFakePorts()}>
      <CardForm cards={[]} onSave={async () => {}} onCancel={() => {}} />
    </PortsProvider>,
  );
  const save = () => screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
  expect(save().disabled).toBe(false);
  fireEvent.click(tile("Add back photo"));
  fireEvent.click(choice("Scan back", "Back photo"));
  await vi.waitFor(() => expect(save().disabled).toBe(true));
  expect(screen.getByRole("status").textContent).toBe("Processing photo…");
  finish(null);
  await vi.waitFor(() => expect(save().disabled).toBe(false));
});

test("closing the scanner without a photo changes nothing and clears the status", async () => {
  acquire.mockResolvedValue(null);
  const onChange = vi.fn();
  renderSlot({ onChange });
  fireEvent.click(tile("Add front photo"));
  fireEvent.click(choice("Scan front"));
  await vi.waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  expect(onChange).not.toHaveBeenCalled();
});
