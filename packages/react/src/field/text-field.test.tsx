// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { TextField } from "./text-field";

afterEach(cleanup);

describe("TextField", () => {
  it("項目名と補足が入力欄に関連づく", () => {
    render(<TextField label="表示名" helperText="20文字まで" />);
    const input = screen.getByRole("textbox", { name: "表示名" });
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    expect(
      describedBy
        .split(" ")
        .some((id) => document.getElementById(id)?.textContent === "20文字まで"),
    ).toBe(true);
  });

  it("エラーがあるときは入力欄を不正として伝え、文言を出す", () => {
    render(<TextField label="表示名" errorText="名前を入れてください" />);
    const input = screen.getByRole("textbox", { name: "表示名" });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("名前を入れてください")).toBeTruthy();
  });

  it("必須の空欄だけでは不正にしない（最初から赤くしない）", () => {
    render(<TextField label="表示名" required />);
    expect(screen.getByRole("textbox", { name: "表示名" }).hasAttribute("aria-invalid")).toBe(
      false,
    );
  });
});
