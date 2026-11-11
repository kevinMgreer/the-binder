import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { createFakePorts } from "../adapters/fakes";
import type { Card } from "../domain/card";
import { makeCard } from "../domain/fixtures";
import { CardForm } from "./CardForm";
import { PortsProvider } from "./ports-context";

afterEach(cleanup);

function renderForm(card?: Card) {
  const onSave = vi.fn(async (_card: Card) => {});
  render(
    <PortsProvider ports={createFakePorts()}>
      <CardForm card={card} cards={[]} onSave={onSave} onCancel={() => {}} />
    </PortsProvider>,
  );
  return onSave;
}

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const save = () => fireEvent.click(screen.getByRole("button", { name: "Save" }));

test("saving with a subset and an insert puts both on the card", async () => {
  const onSave = renderForm();
  type("Player", "Hank Aaron");
  type("Year", "2025");
  type("Set", "Topps");
  type("Card number", "46");
  type("Subset", "Future Stars");
  type("Insert", "Stars of MLB");
  save();
  await vi.waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][0]).toMatchObject({ subset: "Future Stars", insert: "Stars of MLB" });
});

test("editing a card keeps a field the form does not know", async () => {
  const card = { ...makeCard({ player: "Hank Aaron" }), futureField: "keep me" } as Card;
  const onSave = renderForm(card);
  type("Notes", "changed");
  save();
  await vi.waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][0]).toMatchObject({ futureField: "keep me", notes: "changed" });
});

test("Sort name follows Player, is optional and carries its hint", () => {
  renderForm();
  const fields = [...document.querySelectorAll("input")].map((i) => i.id);
  expect(fields.indexOf("f-sort-name")).toBe(fields.indexOf("f-player") + 1);
  const input = screen.getByLabelText("Sort name");
  expect(input.getAttribute("aria-required")).toBeNull();
  expect(screen.getByText("Optional: how this card sorts, e.g. Acuña")).toBeTruthy();
});

test("saving with a Sort name stores it, trimmed; editing shows it and keeps it", async () => {
  const onSave = renderForm();
  fillMinimum();
  type("Sort name", "  De La Cruz ");
  save();
  await vi.waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][0].sortName).toBe("De La Cruz");
  cleanup();
  const again = renderForm(makeCard({ sortName: "De La Cruz" }));
  expect((screen.getByLabelText("Sort name") as HTMLInputElement).value).toBe("De La Cruz");
  type("Notes", "changed");
  save();
  await vi.waitFor(() => expect(again).toHaveBeenCalledTimes(1));
  expect(again.mock.calls[0][0]).toMatchObject({ sortName: "De La Cruz", notes: "changed" });
});

test("the condition is a pick list with a Not set choice", () => {
  renderForm();
  const select = screen.getByLabelText("Condition") as HTMLSelectElement;
  expect(select.tagName).toBe("SELECT");
  expect([...select.options].map((o) => o.text)).toEqual([
    "Not set", "Mint", "Near Mint", "Excellent", "Very Good", "Good", "Fair", "Poor",
  ]);
});

const fillMinimum = () => {
  type("Player", "Hank Aaron");
  type("Year", "2025");
  type("Set", "Topps");
};

test("Serial and Serial unreadable show only once Serial-numbered is checked; Print run is always there", () => {
  renderForm();
  expect(screen.queryByLabelText("Serial")).toBeNull();
  expect(screen.queryByLabelText("Serial unreadable")).toBeNull();
  expect(screen.getByLabelText("Print run")).toBeTruthy();
  fireEvent.click(screen.getByLabelText("Serial-numbered"));
  expect(screen.getByLabelText("Serial")).toBeTruthy();
  expect(screen.getByLabelText("Serial unreadable")).toBeTruthy();
});

test("print run 99 unchecked saves serialNumbered false and no serial, even after a serial was typed", async () => {
  const onSave = renderForm();
  fillMinimum();
  fireEvent.click(screen.getByLabelText("Serial-numbered"));
  type("Serial", "5");
  fireEvent.click(screen.getByLabelText("Serial-numbered"));
  type("Print run", "99");
  save();
  await vi.waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][0].parallel).toMatchObject({ serialNumbered: false, serial: null, serialLegible: true, printRun: 99 });
});

test("checked with an unreadable serial and print run 99 stores serialNumbered true", async () => {
  const onSave = renderForm();
  fillMinimum();
  fireEvent.click(screen.getByLabelText("Serial-numbered"));
  fireEvent.click(screen.getByLabelText("Serial unreadable"));
  type("Print run", "99");
  save();
  await vi.waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][0].parallel).toMatchObject({ serialNumbered: true, serial: null, serialLegible: false, printRun: 99 });
});

test("editing an old print-run-only card opens with Serial-numbered checked", () => {
  renderForm(makeCard({ parallel: { name: "", serial: null, serialLegible: true, printRun: 99 } }));
  expect((screen.getByLabelText("Serial-numbered") as HTMLInputElement).checked).toBe(true);
  expect(screen.getByLabelText("Serial")).toBeTruthy();
});

test("editing an old card saved with only Serial unreadable opens with Serial-numbered checked", () => {
  renderForm(makeCard({ parallel: { name: "", serial: null, serialLegible: false, printRun: null } }));
  expect((screen.getByLabelText("Serial-numbered") as HTMLInputElement).checked).toBe(true);
});

test("a card without a number saves", async () => {
  const onSave = renderForm();
  fillMinimum();
  save();
  await vi.waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][0].cardNumber).toBe("");
});

test("a condition saved in other case opens as the list entry", () => {
  renderForm(makeCard({ grading: { kind: "raw", condition: "near mint" } }));
  expect((screen.getByLabelText("Condition") as HTMLSelectElement).value).toBe("Near Mint");
});

test("a condition not on the list is offered, selected and kept on save", async () => {
  const onSave = renderForm(makeCard({ grading: { kind: "raw", condition: "Sharp corners, off-center" } }));
  const select = screen.getByLabelText("Condition") as HTMLSelectElement;
  expect(select.value).toBe("Sharp corners, off-center");
  expect([...select.options].map((o) => o.text)).toContain("Sharp corners, off-center");
  type("Notes", "changed");
  save();
  await vi.waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(onSave.mock.calls[0][0].grading).toEqual({ kind: "raw", condition: "Sharp corners, off-center" });
});

test("a graded card has free-text company and grade and no condition select", () => {
  renderForm(makeCard({ grading: { kind: "graded", company: "PSA", grade: "9" } }));
  expect(screen.queryByLabelText("Condition")).toBeNull();
  expect((screen.getByLabelText("Grading company") as HTMLInputElement).tagName).toBe("INPUT");
  expect((screen.getByLabelText("Grade") as HTMLInputElement).value).toBe("9");
});
