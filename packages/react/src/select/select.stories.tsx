import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Select } from "./select";

const LEVELS = [
  { value: "easy", label: "かんたん（背景なし・1キャラクター）" },
  { value: "normal", label: "ふつう（背景あり・1キャラクター）" },
  { value: "hard", label: "むずかしい（背景あり・2キャラクター）" },
];

const meta = {
  title: "Forms/Select",
  component: Select,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

function Example({ initial }: { initial: string | null }) {
  const [value, setValue] = useState(initial);
  return <Select label="難易度" options={LEVELS} value={value} onValueChange={setValue} />;
}

export const Empty: Story = {
  args: { label: "難易度", options: LEVELS, value: null, onValueChange: () => {} },
  render: () => <Example initial={null} />,
};
export const Selected: Story = {
  args: { label: "難易度", options: LEVELS, value: "normal", onValueChange: () => {} },
  render: () => <Example initial="normal" />,
};
export const Disabled: Story = {
  args: {
    label: "難易度",
    options: LEVELS,
    value: "easy",
    onValueChange: () => {},
    disabled: true,
  },
};
