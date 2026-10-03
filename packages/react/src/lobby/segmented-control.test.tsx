// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { SegmentedControl } from "./segmented-control";

const input = (element: HTMLElement) => {
  if (!(element instanceof HTMLInputElement)) throw new Error("input ではありません");
  return element;
};

afterEach(cleanup);

const OPTIONS = [
  { value: "easy", label: "かんたん" },
  { value: "normal", label: "ふつう" },
  { value: "hard", label: "むずかしい" },
];

function Example() {
  const [value, setValue] = useState("easy");
  return (
    <SegmentedControl label="難易度" options={OPTIONS} value={value} onValueChange={setValue} />
  );
}

describe("SegmentedControl", () => {
  it("ラジオボタンの集まりとして名前が付き、選んだものだけが選択状態になる", async () => {
    render(<Example />);
    expect(screen.getByRole("radiogroup", { name: "難易度" })).toBeTruthy();
    const easy = input(screen.getByRole("radio", { name: "かんたん" }));
    const normal = input(screen.getByRole("radio", { name: "ふつう" }));
    expect(easy.checked).toBe(true);
    await userEvent.click(normal);
    expect(normal.checked).toBe(true);
    expect(easy.checked).toBe(false);
  });

  it("押せない状態では選び直せない", async () => {
    render(
      <SegmentedControl
        label="難易度"
        options={OPTIONS}
        value="easy"
        onValueChange={() => {}}
        disabled
      />,
    );
    expect(input(screen.getByRole("radio", { name: "ふつう" })).disabled).toBe(true);
  });
});
