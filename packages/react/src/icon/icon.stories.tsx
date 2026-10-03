import type { Meta, StoryObj } from "@storybook/react-vite";

import { Cluster } from "../layout/cluster";
import { Stack } from "../layout/stack";
import { Text } from "../text/text";
import { Icon, IconButton } from "./icon";
import type { IconName } from "./icon";

const NAMES: IconName[] = [
  "play",
  "chevronRight",
  "chevronLeft",
  "chevronUp",
  "people",
  "link",
  "image",
  "prompt",
  "trophy",
  "target",
  "stopwatch",
  "refresh",
  "userPlus",
  "check",
  "sparkle",
  "crown",
  "google",
  "discord",
  "x",
];

const meta = { title: "Data display/Icon", component: Icon, args: { name: "play" } } satisfies Meta<
  typeof Icon
>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const All: Story = {
  render: () => (
    <Cluster gap="4">
      {NAMES.map((name) => (
        <Stack key={name} gap="1" align="center">
          <Icon name={name} size="md" />
          <Text variant="caption" tone="muted">
            {name}
          </Text>
        </Stack>
      ))}
    </Cluster>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Cluster gap="4" align="end">
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Icon key={size} name="sparkle" size={size} />
      ))}
    </Cluster>
  ),
};

// アイコンだけの丸いボタン（カルーセルの矢印・ページの先頭へ）
export const Buttons: Story = {
  render: () => (
    <Cluster gap="4">
      <IconButton label="前の手順" icon="chevronLeft" />
      <IconButton label="次の手順" icon="chevronRight" />
      <IconButton variant="float" label="ページの先頭へ" icon="chevronUp" />
      <IconButton label="押せない" icon="chevronRight" disabled />
    </Cluster>
  ),
};
