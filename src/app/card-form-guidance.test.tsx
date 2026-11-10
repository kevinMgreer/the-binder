import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { createFakePorts } from "../adapters/fakes";
import { makeCard } from "../domain/fixtures";
import { REQUIRED_FIELDS, validateCard } from "../domain/schema";
import { CardForm } from "./CardForm";
import { PortsProvider } from "./ports-context";

afterEach(cleanup);

function renderForm() {
  const onSave = vi.fn(async () => {});
  render(
    <PortsProvider ports={createFakePorts()}>
      <CardForm cards={[]} onSave={onSave} onCancel={() => {}} />
    </PortsProvider>,
  );
  return onSave;
}

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

test("an empty add form marks exactly player, year, set and card number as required", () => {
  renderForm();
  const marked = screen
    .getAllByRole("textbox")
    .concat(screen.getAllByRole("spinbutton"))
    .filter((el) => el.getAttribute("aria-required") === "true")
    .map((el) => el.id)
    .sort();
  expect(marked).toEqual(["f-card-number", "f-player", "f-set", "f-year"]);
  expect(screen.getAllByText("required")).toHaveLength(4);
});

test("the required list matches the fields the schema actually rejects", () => {
  const rejected = validateCard(makeCard({ player: "", year: Number.NaN, set: "", cardNumber: "" }));
  expect(Object.keys(rejected).sort()).toEqual([...REQUIRED_FIELDS].sort());
});

test("a refused save names the missing fields next to Save and focuses the first", () => {
  const onSave = renderForm();
  type("Year", "2025");
  type("Card number", "46");
  fireEvent.click(screen.getByRole("button", { name: "Save" }));

  expect(onSave).not.toHaveBeenCalled();
  const message = screen.getByTestId("save-blocked");
  expect(message.textContent).toContain("Player");
  expect(message.textContent).toContain("Set");
  expect(message.textContent).not.toContain("Year");
  expect(message.nextElementSibling).toBe(screen.getByRole("button", { name: "Save" }).parentElement);
  expect(document.activeElement).toBe(screen.getByLabelText("Player"));
});

test("the message is gone once every named field is fixed and the card saves", async () => {
  const onSave = renderForm();
  type("Year", "2025");
  type("Card number", "46");
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.getByTestId("save-blocked")).toBeTruthy();

  type("Player", "Hank Aaron");
  type("Set", "Topps");
  fireEvent.click(screen.getByRole("button", { name: "Save" }));

  await vi.waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  expect(screen.queryByTestId("save-blocked")).toBeNull();
});
