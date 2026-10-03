import type { Meta, StoryObj } from "@storybook/react-vite";

import { Cluster } from "../layout/cluster";
import { Stack } from "../layout/stack";
import { Badge } from "./badge";

const meta = {
  title: "Data display/Badge",
  component: Badge,
  args: { children: "準備OK" },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tones: Story = {
  render: () => (
    <Stack gap="3">
      {(["subtle", "solid", "outline"] as const).map((variant) => (
        <Cluster key={variant}>
          {(["neutral", "accent", "info", "success", "warning", "danger"] as const).map((tone) => (
            <Badge key={tone} tone={tone} variant={variant}>
              {tone}
            </Badge>
          ))}
        </Cluster>
      ))}
    </Stack>
  ),
};
