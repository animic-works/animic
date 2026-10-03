// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { Button } from "./button";

afterEach(cleanup);

describe("Button", () => {
  it("既定ではtype=buttonで、フォームを勝手に送信しない", () => {
    render(<Button>作る</Button>);
    expect(screen.getByRole("button", { name: "作る" }).getAttribute("type")).toBe("button");
  });

  it("処理中は押せず、読み上げにも処理中と伝え、文言を差し替える", async () => {
    const onClick = vi.fn();
    render(
      <Button loading loadingText="作っています…" onClick={onClick}>
        作る
      </Button>,
    );
    const button = screen.getByRole("button", { name: "作っています…" });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("variantとsizeはデザインシステムのクラスに対応する", () => {
    render(
      <Button variant="secondary" size="lg">
        退出
      </Button>,
    );
    const { className } = screen.getByRole("button", { name: "退出" });
    expect(className).toContain("button--variant_secondary");
    expect(className).toContain("button--size_lg");
  });

  it("前後のアイコンは飾りとして扱い、文言だけを名前にする", () => {
    render(
      <Button leadingIcon={<svg data-testid="icon" />} trailingIcon={<svg />}>
        スタート
      </Button>,
    );
    const button = screen.getByRole("button", { name: "スタート" });
    expect(button.querySelectorAll("[data-part='icon'][aria-hidden='true']")).toHaveLength(2);
  });

  it("asChildでリンクとして描ける", () => {
    render(
      <Button asChild>
        <a href="/rooms/new">はじめる</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "はじめる" });
    expect(link.getAttribute("href")).toBe("/rooms/new");
    expect(link.hasAttribute("type")).toBe(false);
  });
});
