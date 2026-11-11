import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Frame } from "./Frame";

afterEach(cleanup);

test("A remounted frame keeps the orientation it learned, under the same key and a fresh object url", () => {
  const first = render(<Frame url="blob:one" cacheKey="card-1:front:v1" />);
  const img = first.container.querySelector("img")!;
  Object.defineProperty(img, "naturalWidth", { value: 448 });
  Object.defineProperty(img, "naturalHeight", { value: 320 });
  fireEvent.load(img);
  expect(first.container.querySelector(".frame")!.getAttribute("data-orientation")).toBe("landscape");
  first.unmount();
  const again = render(<Frame url="blob:two" cacheKey="card-1:front:v1" />);
  expect(again.container.querySelector(".frame")!.getAttribute("data-orientation")).toBe("landscape");
});
