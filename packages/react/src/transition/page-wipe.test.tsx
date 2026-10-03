// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { Button } from "../button/button";
import { WipeProvider, useWipe } from "./page-wipe";

afterEach(cleanup);

function setReducedMotion(matches: boolean) {
  vi.stubGlobal("matchMedia", () => ({ matches }));
}

function Example({ onNavigate }: { onNavigate: () => void }) {
  const wipe = useWipe();
  return <Button onClick={() => void wipe.wipeTo(onNavigate)}>スタート</Button>;
}

describe("WipeProvider", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("視差効果を減らす設定では、演出を出さずにすぐ移動する", async () => {
    setReducedMotion(true);
    const onNavigate = vi.fn();
    render(
      <WipeProvider logoSrc="/favicon.svg">
        <Example onNavigate={onNavigate} />
      </WipeProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "スタート" }));
    expect(onNavigate).toHaveBeenCalledOnce();
    expect(document.querySelector("[data-wipe]")).toBeNull();
  });

  it("帯で塗りつぶしてから移動し、キーを押すと飛ばせる", async () => {
    setReducedMotion(false);
    const onNavigate = vi.fn();
    render(
      <WipeProvider logoSrc="/favicon.svg">
        <Example onNavigate={onNavigate} />
      </WipeProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "スタート" }));
    await waitFor(() => expect(document.querySelector("[data-wipe]")).not.toBeNull());
    expect(onNavigate).not.toHaveBeenCalled();
    // 開始直後のキーは受け付けないため、少し待ってから押す
    await new Promise((resolve) => setTimeout(resolve, 450));
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(onNavigate).toHaveBeenCalledOnce());
    await waitFor(() => expect(document.querySelector("[data-wipe]")).toBeNull());
  });
});
