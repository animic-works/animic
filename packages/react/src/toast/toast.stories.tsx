import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../button/button";
import { Toaster, toast } from "./toast";

const meta = { title: "Feedback/Toast", component: Toaster } satisfies Meta<typeof Toaster>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: () => (
    <>
      <Button variant="secondary" onClick={() => toast("招待リンクをコピーしました")}>
        通知を出す
      </Button>
      <Toaster />
    </>
  ),
};
