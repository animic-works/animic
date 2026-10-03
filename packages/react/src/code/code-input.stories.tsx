import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Stack } from "../layout/stack";
import { CodeDisplay, CodeInput } from "./code-input";

const meta = {
  title: "Forms/CodeInput",
  component: CodeInput,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ width: "22rem" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CodeInput>;
export default meta;
type Story = StoryObj<typeof meta>;

function Example({ initial }: { initial: string }) {
  const [code, setCode] = useState(initial);
  return <CodeInput value={code} onValueChange={setCode} />;
}

export const Empty: Story = {
  args: { value: "", onValueChange: () => {} },
  render: () => <Example initial="" />,
};
export const Partial: Story = {
  args: { value: "K7QX", onValueChange: () => {} },
  render: () => <Example initial="K7QX" />,
};
export const Complete: Story = {
  args: { value: "K7QX2MPA", onValueChange: () => {} },
  render: () => <Example initial="K7QX2MPA" />,
};

// 決まったコードの表示（ロビー・招待の窓）
export const Display: Story = {
  args: { value: "", onValueChange: () => {} },
  render: () => (
    <Stack gap="6">
      <CodeDisplay code="K7QX2MPA" label="ルームコード K7QX2MPA" />
      <CodeDisplay code="K7QX2MPA" size="sm" />
    </Stack>
  ),
};
