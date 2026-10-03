import type { Meta, StoryObj } from "@storybook/react-vite";

import { Icon } from "../icon/icon";
import { Cluster } from "../layout/cluster";
import { Stack } from "../layout/stack";
import { Button } from "./button";

const meta = {
  title: "Actions/Button",
  component: Button,
  args: { children: "ルームを作る" },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: "primary" } };
export const Secondary: Story = { args: { variant: "secondary", children: "退出" } };
export const Ghost: Story = { args: { variant: "ghost", children: "やめる" } };
export const Inverse: Story = { args: { variant: "inverse", children: "結果をシェア" } };
export const Destructive: Story = { args: { variant: "destructive", children: "退出する" } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true, loadingText: "ルームを作っています…" } };
export const FullWidth: Story = { args: { fullWidth: true }, parameters: { layout: "padded" } };
export const Link: Story = { args: { variant: "link", children: "ログイン方法を選び直す" } };
export const Discord: Story = { args: { variant: "discord", children: "Discordでログイン" } };

// トップの大きなボタン: 前後にアイコンを置き、文言の寄せを選ぶ
export const Hero: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <Cluster gap="6">
      <Button
        size="hero"
        leadingIcon={<Icon name="play" size="lg" />}
        trailingIcon={<Icon name="chevronRight" size="xs" />}
      >
        スタート
      </Button>
      <Button
        variant="secondary"
        size="hero"
        labelAlign="start"
        leadingIcon={<Icon name="people" size="xl" />}
        trailingIcon={<Icon name="chevronRight" size="xs" />}
      >
        ルームに参加する
      </Button>
    </Cluster>
  ),
};

// 種類と大きさの組み合わせを一度に見る
export const Matrix: Story = {
  render: () => (
    <Stack gap="4">
      {(["primary", "secondary", "ghost", "inverse", "destructive"] as const).map((variant) => (
        <Cluster key={variant} gap="3">
          {(["xs", "sm", "lg", "provider"] as const).map((size) => (
            <Button key={size} variant={variant} size={size}>
              {variant} {size}
            </Button>
          ))}
          <Button variant={variant} disabled>
            disabled
          </Button>
        </Cluster>
      ))}
    </Stack>
  ),
};
