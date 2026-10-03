import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "../layout/stack";
import { Heading, Text } from "./text";

const meta = {
  title: "Typography/Text",
  component: Text,
  args: { children: "お題のイラストを、プロンプトだけでAIに再現させよう。" },
} satisfies Meta<typeof Text>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Body: Story = {};
export const Muted: Story = { args: { tone: "muted" } };

// トップと結果の大きな文字
export const Display: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <Stack gap="8">
      <Text variant="hero-title">
        <span>その一枚に、</span>
        <span>
          どこまで<em>近づける</em>？
        </span>
      </Text>
      <Text variant="lead">
        <span>お題のイラストを、</span>
        <span>プロンプトだけで</span>
        <span>AIに再現させよう。</span>
      </Text>
      <Text variant="section-title">遊び方</Text>
      <Text variant="verdict" shadow="pink">
        YOU WIN!
      </Text>
      <Text variant="verdict" shadow="cyan">
        YOU LOSE…
      </Text>
      <Text variant="display-sm">プレイヤー 1 / 8</Text>
    </Stack>
  ),
};

export const Scale: Story = {
  render: () => (
    <Stack gap="3">
      <Text variant="eyebrow">Final result</Text>
      <Text variant="display">1st!</Text>
      <Heading level={1}>ルームを作ろう</Heading>
      <Heading level={2}>プレイヤー 4</Heading>
      <Heading level={3}>スコアの内訳</Heading>
      <Text>本文。お題のイラストを、プロンプトだけでAIに再現させよう。</Text>
      <Text variant="body-sm" tone="muted">
        小さな本文。ログインは不要です。
      </Text>
      <Text variant="label">表示名</Text>
      <Text variant="caption" tone="muted">
        20文字まで。あとから変更できます。
      </Text>
      <Text variant="code">K7QX2MPA</Text>
      <Text variant="body-sm" tone="danger">
        エラーの文言
      </Text>
      <Text variant="body-sm" tone="success">
        準備OK
      </Text>
    </Stack>
  ),
};
