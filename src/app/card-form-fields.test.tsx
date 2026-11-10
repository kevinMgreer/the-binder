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

test("the condition is a pick list with a Not set choice", () => {
  renderForm();
  const select = screen.getByLabelText("Condition") as HTMLSelectElement;
  expect(select.tagName).toBe("SELECT");
  expect([...select.options].map((o) => o.text)).toEqual([
    "Not set", "Mint", "Near Mint", "Excellent", "Very Good", "Good", "Fair", "Poor",
  ]);
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
