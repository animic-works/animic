import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button } from "../button/button";
import { Text } from "../text/text";
import { Dialog, DialogClose } from "./dialog";

const meta = { title: "Overlays/Dialog", component: Dialog } satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;

function Confirm({ defaultOpen }: { defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        退出
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        role="alertdialog"
        title="ルームから退出しますか？"
        description="ほかの参加者には、退出したことが伝わります。"
        footer={
          <>
            <DialogClose>
              <Button variant="secondary">やめる</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => setOpen(false)}>
              退出する
            </Button>
          </>
        }
      >
        <Text variant="body-sm" tone="muted" align="center">
          対戦中の場合、この対戦は未提出になります。
        </Text>
      </Dialog>
    </>
  );
}

export const Closed: Story = {
  args: { open: false, onOpenChange: () => {}, title: "" },
  render: () => <Confirm defaultOpen={false} />,
};
export const Open: Story = {
  args: { open: true, onOpenChange: () => {}, title: "" },
  render: () => <Confirm defaultOpen />,
};
