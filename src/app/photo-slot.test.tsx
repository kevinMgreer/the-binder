import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { createFakePorts } from "../adapters/fakes";
import { makeCard } from "../domain/fixtures";
import type { CapturedPhoto } from "../ports";
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

test("an empty slot offers Scan and Pick", () => {
  renderSlot();
  expect(screen.getByRole("button", { name: "Scan front" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Pick front from photos" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Retake front" })).toBeNull();
});

test("a stored photo whose thumbnail has not loaded already reads Retake", () => {
  const photo = { fileId: "f", thumbId: "t", name: "front.jpg" };
  renderSlot({ card: makeCard({ photos: { front: photo, back: null } }) });
  expect(screen.getByRole("button", { name: "Retake front" })).toBeTruthy();
});

test("a captured photo reads Retake", () => {
  const captured: CapturedPhoto = { full: new Blob(["f"]), thumb: new Blob(["t"]) };
  renderSlot({ captured });
  expect(screen.getByRole("button", { name: "Retake front" })).toBeTruthy();
});

test("while a photo is being prepared a status line shows and the buttons are disabled", async () => {
  acquire.mockReturnValue(new Promise(() => {}));
  renderSlot();
  fireEvent.click(screen.getByRole("button", { name: "Scan front" }));
  expect((await screen.findByRole("status")).textContent).toBe("Processing photo…");
  expect((screen.getByRole("button", { name: "Scan front" }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("button", { name: "Pick front from photos" }) as HTMLButtonElement).disabled).toBe(true);
});

test("closing the scanner without a photo changes nothing and clears the status", async () => {
  acquire.mockResolvedValue(null);
  const onChange = vi.fn();
  renderSlot({ onChange });
  fireEvent.click(screen.getByRole("button", { name: "Scan front" }));
  await vi.waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  expect(onChange).not.toHaveBeenCalled();
});
