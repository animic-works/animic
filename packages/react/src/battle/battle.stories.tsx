import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "../badge/badge";
import { Button } from "../button/button";
import { ART_TOPIC, CharacterArt } from "../character-art/character-art";
import { Icon } from "../icon/icon";
import { Stack } from "../layout/stack";
import { SegmentedControl } from "../lobby/segmented-control";
import { Surface } from "../surface/surface";
import { Text } from "../text/text";
import {
  ArtFrame,
  BattleColumn,
  BattleLayout,
  HudBar,
  HudLevelChip,
  HudPhase,
  HudPhaseStrong,
  HudTimer,
  HudTrack,
  PanelHead,
  PromptChips,
  PromptFoot,
  PromptTextarea,
  ScreenOverlay,
  ShotButton,
  ShotEmpty,
  ShotFailed,
  ShotGrid,
  ShotPending,
  SubmitRow,
  VersusList,
  VersusRow,
} from "./battle";

const meta = { title: "Screens/Battle", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Hud({ hurry = false }: { hurry?: boolean }) {
  return (
    <>
      <HudBar
        logoSrc="/animic-logo.svg"
        left={
          <>
            <Badge variant="outline">
              ルーム{" "}
              <Text as="code" variant="code">
                K7QX2MPA
              </Text>
            </Badge>
            <HudLevelChip>
              <Badge tone="info">かんたん・90秒</Badge>
            </HudLevelChip>
          </>
        }
        timer={
          <HudTimer
            label={hurry ? "SELECT" : "TIME LEFT"}
            value={hurry ? "0:12" : "1:30"}
            hurry={hurry}
          />
        }
        right={<Badge variant="outline">ぴよ丸：生成 2回</Badge>}
      />
      <HudTrack progress={hurry ? 0.4 : 1} />
    </>
  );
}

// 対戦画面全体
export const Playing: Story = {
  render: () => (
    <>
      <Hud />
      <BattleLayout>
        <BattleColumn side>
          <Surface as="section" variant="sticker" padding="fluid" aria-labelledby="topic-title">
            <Stack gap="4">
              <PanelHead title="お題" titleId="topic-title" note="白背景・1キャラクター" />
              <ArtFrame variant="topic" tag="THEME">
                <CharacterArt features={ART_TOPIC} label="お題のイラスト" />
              </ArtFrame>
              <Text variant="body-sm" tone="muted">
                このイラストにいちばん近い1枚を作ろう。
              </Text>
            </Stack>
          </Surface>
          <Surface as="section" variant="sticker" padding="fluid" aria-labelledby="versus-title">
            <Stack gap="4">
              <PanelHead title="対戦状況" titleId="versus-title" />
              <VersusList>
                <VersusRow
                  name="ねこぜ"
                  player="1"
                  note="あなた・成功した生成 1回"
                  state="working"
                  stateText="生成中"
                />
                <VersusRow
                  name="ぴよ丸"
                  player="2"
                  note="成功した生成 2回"
                  state="done"
                  stateText="提出済み"
                />
              </VersusList>
            </Stack>
          </Surface>
        </BattleColumn>
        <BattleColumn>
          <Surface as="section" variant="sticker" padding="fluid" aria-labelledby="prompt-title">
            <Stack gap="4">
              <PanelHead title="プロンプト" titleId="prompt-title">
                <SegmentedControl
                  label="入力方法"
                  variant="lift"
                  options={[
                    { value: "text", label: "文章" },
                    { value: "tag", label: "タグ" },
                  ]}
                  value="text"
                  onValueChange={() => {}}
                />
              </PanelHead>
              <PromptTextarea
                aria-label="プロンプト"
                placeholder="例：ピンクの髪でツインテールの女の子、青い目、セーラー服、笑顔、白背景"
              />
              <PromptChips
                rows={[
                  { label: "髪の色", words: ["ピンクの髪", "金髪", "黒髪"] },
                  { label: "表情", words: ["笑顔", "ウインク", "無表情"] },
                ]}
                onPick={() => {}}
              />
              <PromptFoot count={1}>
                <Button size="lg" leadingIcon={<Icon name="sparkle" size="sm" />}>
                  生成する
                </Button>
              </PromptFoot>
            </Stack>
          </Surface>
          <Surface as="section" variant="sticker" padding="fluid" aria-labelledby="shots-title">
            <Stack gap="4">
              <PanelHead title="生成した画像" titleId="shots-title" note="1枚選んで提出" />
              <ShotGrid>
                <ShotPending />
                <ShotButton number={2} selected onSelect={() => {}}>
                  <CharacterArt features={{ ...ART_TOPIC, bg: "sky" }} label="2回目の画像" />
                </ShotButton>
                <ShotButton number={1} selected={false} onSelect={() => {}}>
                  <CharacterArt features={{ ...ART_TOPIC, hair: "blonde" }} label="1回目の画像" />
                </ShotButton>
                <ShotFailed />
              </ShotGrid>
              <SubmitRow note="提出後は変更できません。">
                <Button size="lg">この1枚で提出</Button>
              </SubmitRow>
            </Stack>
          </Surface>
        </BattleColumn>
      </BattleLayout>
    </>
  ),
};

// 生成終了後の案内と、残りわずかの残り時間
export const Selecting: Story = {
  render: () => (
    <>
      <Hud hurry />
      <HudPhase>
        生成終了！<span>生成中の画像も完成すれば選べます。</span>
        <span>
          残り <HudPhaseStrong>12</HudPhaseStrong> 秒で1枚選んで提出
        </span>
      </HudPhase>
      <BattleLayout>
        <BattleColumn>
          <Surface as="section" variant="sticker" padding="fluid" aria-labelledby="shots-title2">
            <Stack gap="4">
              <PanelHead title="生成した画像" titleId="shots-title2" note="1枚選んで提出" />
              <ShotGrid>
                <ShotEmpty>
                  まだ画像がありません。プロンプトを入力して「生成する」を押そう。
                </ShotEmpty>
              </ShotGrid>
            </Stack>
          </Surface>
        </BattleColumn>
      </BattleLayout>
    </>
  ),
};

export const Waiting: Story = {
  render: () => <ScreenOverlay title="提出しました！" sub="ぴよ丸 さんの提出を待っています" />,
};

export const Scoring: Story = {
  render: () => <ScreenOverlay title="採点中…" sub="AIが再現度を評価しています" />,
};
