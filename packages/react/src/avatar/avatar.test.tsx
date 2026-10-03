// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { Avatar, playerColor } from "./avatar";

afterEach(cleanup);

describe("Avatar", () => {
  it("画像がなければ名前の最初の1文字（絵文字も1文字）を出す", () => {
    const { container } = render(<Avatar name="👩‍🎨みく" />);
    expect(container.textContent).toBe("👩‍🎨");
  });

  it("参加順から色を順番に選び、8人目で最初の色に戻る", () => {
    expect([0, 1, 6, 7].map(playerColor)).toEqual(["1", "2", "7", "1"]);
  });
});
