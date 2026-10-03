import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { playerColor } from "../avatar/avatar";
import { Button } from "../button/button";
import { CodeDisplay } from "../code/code-input";
import { Dialog, DialogClose } from "../dialog/dialog";
import { TextField } from "../field/text-field";
import { Stack } from "../layout/stack";
import { Surface } from "../surface/surface";
import {
  CountdownOverlay,
  EmptySlot,
  GoPanel,
  InviteQr,
  InviteRow,
  LeaveButton,
  LevelArt,
  LobbyColumn,
  LobbyLayout,
  PlayerBoardHead,
  PlayerGrid,
  PlayerSlot,
  PlayerTile,
  PlayerTitleRow,
  ReadyStatus,
  RoomChip,
  Rule,
  RuleSummary,
  RulesDivider,
  RulesHead,
  RulesList,
} from "./lobby";
import { SegmentedControl } from "./segmented-control";
import { TopBar, TopBarSide } from "./top-bar";

const meta = { title: "Screens/Lobby", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const PLAYERS = [
  { name: "ねこぜ", ready: true, host: true, me: true },
  { name: "ぴよ丸", ready: true },
  { name: "ぴくせる侍", ready: false },
];

const SAMPLES = [
  { key: "easy", src: "/topic-sample-easy.webp", alt: "かんたんのお題のイメージ" },
  { key: "normal", src: "/topic-sample-normal.webp", alt: "ふつうのお題のイメージ" },
  { key: "hard", src: "/topic-sample-hard.webp", alt: "むずかしいのお題のイメージ" },
];
const WORDS = { easy: "EASY", normal: "NORMAL", hard: "HARD" } as const;
const PARTS = {
  easy: ["背景なし", "1キャラクター"],
  normal: ["背景あり", "1キャラクター"],
  hard: ["背景あり", "2キャラクター"],
} as const;

function Rules({ host }: { host: boolean }) {
  const [level, setLevel] = useState<keyof typeof WORDS>("easy");
  const [time, setTime] = useState("90");
  const mode = host ? "edit" : "view";
  return (
    <Stack gap="4">
      <RulesHead title="ルール" titleId="rules-title" />
      <RulesList mode={mode}>
        <Rule mode={mode} term="難易度">
          {host ? (
            <SegmentedControl
              label="難易度"
              tone="accent"
              options={[
                { value: "easy", label: "かんたん" },
                { value: "normal", label: "ふつう" },
                { value: "hard", label: "むずかしい" },
              ]}
              value={level}
              onValueChange={(value) => {
                if (value === "easy" || value === "normal" || value === "hard") setLevel(value);
              }}
            />
          ) : (
            <RuleSummary>かんたん</RuleSummary>
          )}
        </Rule>
        <Rule mode={mode} wide>
          <LevelArt
            word={WORDS[level]}
            extra={level === "hard" ? "EXTRA" : undefined}
            parts={PARTS[level]}
            images={SAMPLES.map((image) => ({ ...image, hidden: image.key !== level }))}
          />
        </Rule>
        <Rule mode={mode} term="制限時間">
          {host ? (
            <SegmentedControl
              label="制限時間"
              options={[
                { value: "60", label: "60秒" },
                { value: "90", label: "90秒" },
                { value: "120", label: "120秒" },
              ]}
              value={time}
              onValueChange={setTime}
            />
          ) : (
            <RuleSummary>90秒</RuleSummary>
          )}
        </Rule>
      </RulesList>
      <RulesDivider />
      <GoPanel note={host ? undefined : "ホストが開始します"} status={{ ready: 2, total: 3 }}>
        {host ? (
          <Button size="lg" fullWidth>
            対戦をはじめる
          </Button>
        ) : (
          <Button variant="secondary" size="lg" fullWidth aria-pressed={false}>
            準備完了にする
          </Button>
        )}
      </GoPanel>
    </Stack>
  );
}

// ロビー全体（ホスト）
export const Host: Story = {
  render: () => (
    <>
      <TopBar logoSrc="/animic-logo.svg" logoHref="#top">
        <RoomChip code="K7QX2MPA" onCopy={() => {}} />
        <TopBarSide>
          <LeaveButton placement="bar" onClick={() => {}} />
        </TopBarSide>
      </TopBar>
      <LobbyLayout>
        <LobbyColumn>
          <Surface as="section" variant="soft" padding="fluid" aria-labelledby="players-title">
            <Stack gap="4">
              <PlayerBoardHead code="K7QX2MPA" onInvite={() => {}} onCopy={() => {}}>
                <CodeDisplay code="K7QX2MPA" label="ルームコード K7QX2MPA" />
              </PlayerBoardHead>
              <PlayerTitleRow count={PLAYERS.length} max={8} titleId="players-title">
                <ReadyStatus ready={2} total={3} />
              </PlayerTitleRow>
              <PlayerGrid>
                {PLAYERS.map((player, index) => (
                  <PlayerSlot key={player.name}>
                    <PlayerTile
                      name={player.name}
                      player={playerColor(index)}
                      isMe={player.me}
                      isHost={player.host}
                      ready={player.ready}
                      onEdit={player.me ? () => {} : undefined}
                    />
                  </PlayerSlot>
                ))}
                <PlayerSlot>
                  <EmptySlot onClick={() => {}} />
                </PlayerSlot>
              </PlayerGrid>
            </Stack>
          </Surface>
          <LeaveButton placement="column" onClick={() => {}} />
        </LobbyColumn>
        <Surface as="section" variant="soft" padding="fluid" aria-labelledby="rules-title">
          <Rules host />
        </Surface>
      </LobbyLayout>
    </>
  ),
};

// ゲストは決まった内容を見る
export const Guest: Story = {
  render: () => (
    <LobbyLayout>
      <Surface as="section" variant="soft" padding="fluid" aria-labelledby="rules-title">
        <Rules host={false} />
      </Surface>
    </LobbyLayout>
  ),
};

// 招待の窓の中身
export const Invite: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <Stack gap="4">
      <InviteRow url="https://animic.party/rooms/K7QX2MPA" copied={false} onCopy={() => {}} />
      <CodeDisplay code="K7QX2MPA" size="sm" />
      <InviteQr url="https://animic.party/rooms/K7QX2MPA" />
    </Stack>
  ),
};

// 表示名の変更の窓（自分の枠の鉛筆から開く）
export const Rename: Story = {
  render: () => (
    <Dialog
      open
      onOpenChange={() => {}}
      sheet
      title="表示名を変更"
      description="対戦相手に表示される名前です。"
      footer={
        <>
          <DialogClose>
            <Button variant="secondary" size="lg">
              やめる
            </Button>
          </DialogClose>
          <Button size="lg">変更する</Button>
        </>
      }
    >
      <TextField label="表示名" defaultValue="ねこぜ" maxLength={20} helperText="20文字まで" />
    </Dialog>
  ),
};

export const Countdown: Story = {
  render: () => (
    <CountdownOverlay label="かんたん・90秒・猶予30秒" count={3} sub="お題が公開されます" />
  ),
};

export const ReadyAll: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <Stack gap="3">
      <ReadyStatus ready={1} total={3} />
      <ReadyStatus ready={2} total={2} />
    </Stack>
  ),
};
