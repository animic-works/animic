// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { Button } from "../button/button";
import { Dialog, DialogClose } from "./dialog";

afterEach(cleanup);

function Example({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>退出</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        role="alertdialog"
        title="ルームから退出しますか？"
        description="対戦中の場合は未提出になります。"
        footer={
          <>
            <DialogClose>
              <Button variant="secondary">やめる</Button>
            </DialogClose>
            <Button variant="destructive" onClick={onConfirm}>
              退出する
            </Button>
          </>
        }
      />
    </>
  );
}

describe("Dialog", () => {
  it("見出しが名前になり、Escで閉じられる", async () => {
    render(<Example onConfirm={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "退出" }));
    const dialog = await screen.findByRole("alertdialog", { name: "ルームから退出しますか？" });
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("やめるで閉じ、主な操作は呼び出し側に渡る", async () => {
    const onConfirm = vi.fn();
    render(<Example onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole("button", { name: "退出" }));
    await userEvent.click(await screen.findByRole("button", { name: "退出する" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "やめる" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });
});
