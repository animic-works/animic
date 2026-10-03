import type { Meta, StoryObj } from "@storybook/react-vite";

import { Grid } from "../layout/grid";
import { ART_TOPIC, CharacterArt, artFromPrompt } from "./character-art";

const meta = {
  title: "Data display/CharacterArt",
  component: CharacterArt,
  args: { features: ART_TOPIC, label: "お題のイラスト" },
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ width: "16rem" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CharacterArt>;
export default meta;
type Story = StoryObj<typeof meta>;

// お題（かんたん: 白背景・1キャラクター）
export const Topic: Story = {};

// プロンプトの言葉から特徴を決める
export const FromPrompt: Story = {
  render: () => (
    <Grid columns={3} gap="4">
      {[
        "金髪でボブの女の子、赤い目、パーカー、ウインク、青空",
        "黒髪ロング、緑の目、ワンピース、無表情、教室",
        "1girl, silver hair, twintails, blue eyes, sailor uniform, smile",
      ].map((prompt) => (
        <CharacterArt
          key={prompt}
          features={artFromPrompt(prompt, prompt).features}
          label={prompt}
        />
      ))}
    </Grid>
  ),
};
