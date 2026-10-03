import type { Meta, StoryObj } from "@storybook/react-vite";

import { Cluster } from "../layout/cluster";
import { Avatar, playerColor } from "./avatar";

const meta = {
  title: "Data display/Avatar",
  component: Avatar,
  args: { name: "ねこぜ" },
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Players: Story = {
  render: () => (
    <Cluster gap="3">
      {["ねこぜ", "ぴよ丸", "ぴくせる侍", "プロンプト職人", "みく", "そら", "あお"].map(
        (name, index) => (
          <Avatar key={name} name={name} player={playerColor(index)} />
        ),
      )}
    </Cluster>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Cluster gap="3">
      <Avatar name="ねこぜ" size="sm" />
      <Avatar name="ねこぜ" size="md" />
      <Avatar name="ねこぜ" size="lg" />
    </Cluster>
  ),
};
