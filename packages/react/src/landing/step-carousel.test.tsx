// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { StepCarousel } from "./step-carousel";

afterEach(cleanup);

const STEPS = [
  { title: "ルームに集まる", description: "", icon: "link", tint: "cyan" },
  { title: "お題が公開される", description: "", icon: "image", tint: "pink" },
  { title: "プロンプトで生成", description: "", icon: "prompt", tint: "yellow" },
] as const;

describe("StepCarousel", () => {
  it("中央のカードだけを読み上げ、矢印とドットで切り替えられる", async () => {
    render(<StepCarousel steps={[...STEPS]} titleId="how" head={<h2 id="how">遊び方</h2>} />);
    expect(screen.getByRole("region", { name: "遊び方" })).toBeTruthy();
    const items = screen
      .getAllByRole("listitem", { hidden: true })
      .filter((el) => el.hasAttribute("aria-label"));
    expect(items[0]?.getAttribute("aria-hidden")).toBeNull();
    expect(items[1]?.getAttribute("aria-hidden")).toBe("true");

    await userEvent.click(screen.getByRole("button", { name: "次の手順" }));
    expect(items[1]?.getAttribute("aria-hidden")).toBeNull();
    expect(
      screen
        .getByRole("button", { name: "ステップ2: お題が公開される" })
        .getAttribute("aria-current"),
    ).toBe("true");

    await userEvent.click(screen.getByRole("button", { name: "ステップ3: プロンプトで生成" }));
    expect(items[2]?.getAttribute("aria-hidden")).toBeNull();
    // 最後から次へ進むと最初に戻る
    await userEvent.click(screen.getByRole("button", { name: "次の手順" }));
    expect(items[0]?.getAttribute("aria-hidden")).toBeNull();
  });
});
