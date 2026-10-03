import type { Meta, StoryObj } from "@storybook/react-vite";

import { TextField } from "./text-field";

const meta = {
  title: "Forms/TextField",
  component: TextField,
  args: {
    label: "表示名",
    placeholder: "例：ねこぜ",
    helperText: "対戦相手に表示される名前です。20文字まで。",
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof TextField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Filled: Story = { args: { defaultValue: "ねこぜ" } };
export const Invalid: Story = {
  args: { defaultValue: "ねこぜ", errorText: "この名前は使えません。" },
};
export const Disabled: Story = { args: { defaultValue: "ねこぜ", disabled: true } };
