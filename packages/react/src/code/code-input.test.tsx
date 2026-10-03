// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { CodeDisplay, CodeInput } from "./code-input";

afterEach(cleanup);

function Example() {
  const [code, setCode] = useState("");
  return (
    <>
      <CodeInput value={code} onValueChange={setCode} />
      <output>{code}</output>
    </>
  );
}

describe("CodeInput", () => {
  it("8つのマスにそれぞれ読み上げ用の名前が付く", () => {
    render(<Example />);
    expect(screen.getAllByRole("textbox")).toHaveLength(8);
    expect(screen.getByRole("textbox", { name: "ルームコードの1文字目（全8文字）" })).toBeTruthy();
  });

  it("小文字は大文字に直し、残りの文字数を伝える", async () => {
    render(<Example />);
    const first = screen.getByRole("textbox", { name: /1文字目/ });
    await userEvent.click(first);
    await userEvent.keyboard("k7");
    expect(screen.getByRole("status").textContent).toBe("K7");
    expect(screen.getByText("あと6文字")).toBeTruthy();
  });

  it("使われていない文字（0・O・1・I・L）は受け付けず、理由を伝える", async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole("textbox", { name: /1文字目/ }));
    await userEvent.keyboard("o");
    expect(screen.getByRole("status").textContent).toBe("");
    expect(screen.getByText("「O」はルームコードに使われていません")).toBeTruthy();
  });

  it("8文字そろったら参加できると伝える", async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole("textbox", { name: /1文字目/ }));
    await userEvent.keyboard("K7QX2MPA");
    expect(screen.getByRole("status").textContent).toBe("K7QX2MPA");
    expect(screen.getByText("このコードで参加します")).toBeTruthy();
  });
});

describe("CodeDisplay", () => {
  it("名前を付けると1つのまとまりとして読み上げ、文字は1つずつ見せる", () => {
    render(<CodeDisplay code="K7QX2MPA" label="ルームコード K7QX2MPA" />);
    const group = screen.getByRole("group", { name: "ルームコード K7QX2MPA" });
    expect(group.children).toHaveLength(8);
    expect(group.textContent).toBe("K7QX2MPA");
  });
});
