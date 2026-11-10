import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as stats from "../domain/dashboard";
import { makeCard } from "../domain/fixtures";
import { Dashboard } from "./Dashboard";

vi.mock("./SyncIndicator", () => ({ SyncIndicator: () => null }));
afterEach(cleanup);

test("No recount without a change: a re-render with the same cards does not recompute the tiles", () => {
  const spy = vi.spyOn(stats, "collectionStats");
  const cards = [makeCard()];
  const props = { onAdd() {}, onNavigate() {}, onSettings() {}, onBrowse() {}, onTile() {} };
  const view = render(<Dashboard cards={cards} update={null} {...props} />);
  view.rerender(<Dashboard cards={cards} update={{ version: "1.1.0", apkUrl: "https://example.test/a.apk" }} {...props} />);
  expect(spy).toHaveBeenCalledTimes(1);
  view.rerender(<Dashboard cards={[...cards]} update={null} {...props} />);
  expect(spy).toHaveBeenCalledTimes(2);
});
