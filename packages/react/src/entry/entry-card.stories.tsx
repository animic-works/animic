import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../button/button";
import { TextField } from "../field/text-field";
import { Icon } from "../icon/icon";
import { Stack } from "../layout/stack";
import {
  EntryCard,
  EntryContext,
  EntryDivider,
  EntryPage,
  EntryProviders,
  EntryTerms,
  ProviderButton,
} from "./entry-card";

const meta = {
  title: "Screens/EntryCard",
  component: EntryCard,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof EntryCard>;
export default meta;
type Story = StoryObj<typeof meta>;

const base = { logoSrc: "/animic-logo.svg", titleId: "title", title: "", children: null };

// ステップ1: ログイン方法を選ぶ
export const Method: Story = {
  args: base,
  render: () => (
    <EntryPage>
      <EntryCard
        logoSrc="/animic-logo.svg"
        title="ログインしてはじめよう"
        titleId="login-title"
        sub="ログインすると戦績や生成履歴が残ります。"
      >
        <EntryContext>
          ルーム <code>K7QX2MPA</code> に参加します
        </EntryContext>
        <EntryProviders>
          <ProviderButton provider="google">Googleでログイン</ProviderButton>
          <ProviderButton provider="discord">Discordでログイン</ProviderButton>
        </EntryProviders>
        <EntryDivider>または</EntryDivider>
        <Button size="lg" fullWidth trailingIcon={<Icon name="chevronRight" size="xs" />}>
          ログインせずに進む
        </Button>
        <EntryTerms>
          続行すると、<a href="#terms">利用規約</a>と<a href="#privacy">プライバシーポリシー</a>
          に同意したものとみなします。
        </EntryTerms>
      </EntryCard>
    </EntryPage>
  ),
};

// ステップ2: 表示名を決める
export const Name: Story = {
  args: base,
  render: () => (
    <EntryPage>
      <EntryCard
        logoSrc="/animic-logo.svg"
        title="表示名を決めよう"
        titleId="name-title"
        sub="対戦相手に表示される名前です。"
      >
        <Stack gap="5">
          <TextField
            label="表示名"
            defaultValue="ねこぜ"
            helperText="20文字まで。あとから変更できます。"
          />
          <Button size="lg" fullWidth>
            ルームを作る
          </Button>
        </Stack>
        <Button variant="link">ログイン方法を選び直す</Button>
      </EntryCard>
    </EntryPage>
  ),
};

export const Loading: Story = {
  args: base,
  render: () => (
    <EntryPage>
      <EntryCard logoSrc="/animic-logo.svg" title="ログインしてはじめよう" titleId="loading-title">
        <EntryProviders>
          <ProviderButton provider="google" loading loadingText="Googleに接続中…">
            Googleでログイン
          </ProviderButton>
        </EntryProviders>
      </EntryCard>
    </EntryPage>
  ),
};
