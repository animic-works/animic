import { useEffect, useRef, useState } from "react";

import { playerColor } from "../../components/avatar";
import { Badge } from "../../components/badge";
import { Button } from "../../components/button";
import { CodeDisplay } from "../../components/code";
import { Dialog, DialogClose } from "../../components/dialog";
import { Stack, VisuallyHidden } from "../../components/layout";
import { SegmentedControl } from "../../components/segmented-control";
import { Surface } from "../../components/surface";
import { Text } from "../../components/text";
import { toast } from "../../components/toast";
import { TopBar, TopBarSide } from "../../components/top-bar";
import { Entrance } from "../../components/transition";
import { DIFFICULTIES, getDifficulty } from "../battle/battle-labels";
import { startBattle } from "../battle/battle.functions";
import type { BattleSettings } from "../battle/battle-state";
import {
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
  WaitingList,
} from "./lobby-parts";
import { choicesWith, defaultBattleSettings } from "./battle-options";
import type { BattleOptions } from "./battle-options";
import { leaveRoom, setReady, setRoomSettings } from "./room.functions";
import type { RoomSnapshot } from "./room-state";

const MAX_PLAYERS = 8;

// 難易度ごとのお題のサンプル画像（public/ に置く）。
const DIFFICULTY_SAMPLES: Record<BattleSettings["difficulty"], string> = {
  easy: "/images/topic-sample-easy.webp",
  normal: "/images/topic-sample-normal.webp",
  hard: "/images/topic-sample-hard.webp",
};

const errorMessage = (error: unknown) =>
  error instanceof Error && error.message
    ? error.message
    : "うまくいきませんでした。もう一度お試しください。";

const sameSettings = (a: BattleSettings | null, b: BattleSettings | null) =>
  JSON.stringify(a) === JSON.stringify(b);

// 待機中のルーム: ルームコードと招待、参加者と準備状態、対戦の条件と開始。
export function RoomLobby({
  room,
  participantId,
  inviteUrl,
  battleOptions,
  connection,
  previousBattleId,
  waitingForNext,
  onLeaving,
  onLeft,
}: {
  room: RoomSnapshot;
  participantId: string;
  inviteUrl: string;
  /** 運営者が管理画面で決めた制限時間・画像選択の猶予の候補と既定値 */
  battleOptions: BattleOptions;
  connection: string;
  /** 直前の対戦のID（次の対戦の開始に使う） */
  previousBattleId: string | null;
  /** 進行中の対戦に入れず、次の対戦を待っているか */
  waitingForNext: boolean;
  /** 退出の要求中かどうか。退出で閉じる接続を、切断として知らせないために使う */
  onLeaving: (leaving: boolean) => void;
  onLeft: () => void;
}) {
  const isHost = room.hostId !== null && room.hostId === participantId;
  const me = room.members.find((member) => member.id === participantId);
  // ホストを先頭に、あとは参加順。
  const members = room.members.toSorted((a, b) =>
    a.id === room.hostId ? -1 : b.id === room.hostId ? 1 : 0,
  );
  // 参加者を見分ける色は、ルームへの参加順で選ぶ。
  const colorOf = (id: string) => playerColor(room.members.findIndex((member) => member.id === id));
  const connectedCount = room.members.filter((member) => member.connected).length;
  // ホストは開始の操作をするので、準備完了の操作はせず準備OKとして数える。
  const isReady = (member: RoomSnapshot["members"][number]) =>
    member.id === room.hostId || member.ready;
  const readyCount = room.members.filter(isReady).length;
  const allReady = room.members.length >= 2 && readyCount === room.members.length;

  // ルール: ホストは選択肢で決め、ゲストは決まった内容を見る。
  // ホストの選択は保存を待たずに表示し、保存済みの値が選んだ時点から変わったらそちらに従う。
  const [override, setOverride] = useState<{
    value: BattleSettings;
    base: BattleSettings | null;
  }>();
  const settings =
    override && sameSettings(override.base, room.settings)
      ? override.value
      : (room.settings ?? defaultBattleSettings(battleOptions));
  const [error, setError] = useState<string | null>(null);

  // 最初に既定の条件を共有し、ゲストにも同じ内容を見せる。
  const pushedDefaults = useRef(false);
  useEffect(() => {
    if (!isHost || room.settings || pushedDefaults.current) return;
    pushedDefaults.current = true;
    void setRoomSettings({
      data: { code: room.code, settings: defaultBattleSettings(battleOptions), previousBattleId },
    }).catch(() => undefined);
  }, [isHost, room.settings, room.code, previousBattleId, battleOptions]);

  function changeSettings(next: BattleSettings) {
    setOverride({ value: next, base: room.settings });
    setError(null);
    setRoomSettings({ data: { code: room.code, settings: next, previousBattleId } }).catch(
      (caught: unknown) => {
        setOverride(undefined);
        setError(errorMessage(caught));
      },
    );
  }

  // 入ってきた人を弾ませ、知らせる。
  const seen = useRef<Set<string> | null>(null);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!seen.current) {
      seen.current = new Set(room.members.map((member) => member.id));
      return;
    }
    const fresh = room.members.filter((member) => !seen.current?.has(member.id));
    if (!fresh.length) return;
    for (const member of fresh) {
      seen.current.add(member.id);
      if (member.id !== participantId) toast(`${member.name} さんが参加しました`);
    }
    setJoined(new Set(fresh.map((member) => member.id)));
  }, [room.members, participantId]);

  const [invite, setInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [leavingOpen, setLeavingOpen] = useState(false);
  const [confirmingStart, setConfirmingStart] = useState(false);
  const [busy, setBusy] = useState(false);
  const [starting, setStarting] = useState(false);

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast("招待リンクをコピーしました");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("コピーできませんでした");
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(room.code);
      toast("ルームコードをコピーしました");
    } catch {
      toast("コピーできませんでした");
    }
  }

  async function leave() {
    setBusy(true);
    onLeaving(true);
    try {
      await leaveRoom({ data: { code: room.code } });
      onLeft();
    } catch (caught) {
      onLeaving(false);
      toast(errorMessage(caught));
      setBusy(false);
    }
  }

  async function toggleReady() {
    if (!me) return;
    setBusy(true);
    try {
      await setReady({ data: { code: room.code, ready: !me.ready } });
    } catch (caught) {
      toast(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  // ホストが開始: 条件を保存してから開始を要求し、成功したら対戦の配信で画面が切り替わる。
  async function start() {
    setStarting(true);
    setError(null);
    try {
      await setRoomSettings({ data: { code: room.code, settings, previousBattleId } });
      const result = await startBattle({ data: { code: room.code, settings, previousBattleId } });
      if (result.error) {
        setError(result.error);
        setStarting(false);
      }
    } catch (caught) {
      setError(errorMessage(caught));
      setStarting(false);
    }
  }

  const level = settings.difficulty;
  const difficulty = getDifficulty(level);
  const mode = isHost ? "edit" : "view";
  const difficultyOptions = DIFFICULTIES.map((item) => ({ value: item.value, label: item.label }));
  // 準備中の参加者（ホストは数えない）。
  const waiting = room.members.filter(
    (member) => member.connected && member.id !== room.hostId && !member.ready,
  );
  const canStart = connectedCount === 2 && !waitingForNext;
  const startReason = waitingForNext
    ? "対戦が終わるまでお待ちください"
    : connectedCount !== 2
      ? "接続中の参加者が2人のときに開始できます"
      : null;

  return (
    <>
      <TopBar logoSrc="/animic-logo.svg" logoHref="/">
        <RoomChip code={room.code} onCopy={() => void copyCode()} />
        <TopBarSide>
          <VisuallyHidden role="status">{connection}</VisuallyHidden>
          {connection !== "接続済み" ? (
            <Badge tone="warning" aria-hidden="true">
              {connection}
            </Badge>
          ) : null}
          <LeaveButton placement="bar" disabled={busy} onClick={() => setLeavingOpen(true)} />
        </TopBarSide>
      </TopBar>

      <LobbyLayout>
        <LobbyColumn>
          <Entrance as="section" order={0} aria-labelledby="players-title">
            <Surface variant="soft" padding="fluid">
              <Stack gap="4">
                <PlayerBoardHead
                  code={room.code}
                  onInvite={() => setInvite(true)}
                  onCopy={() => void copyCode()}
                >
                  <CodeDisplay code={room.code} label={`ルームコード ${room.code}`} />
                </PlayerBoardHead>
                <PlayerTitleRow
                  count={room.members.length}
                  max={MAX_PLAYERS}
                  titleId="players-title"
                >
                  <ReadyStatus ready={readyCount} total={room.members.length} allReady={allReady} />
                </PlayerTitleRow>
                <PlayerGrid>
                  {members.map((member) => (
                    <PlayerSlot key={member.id}>
                      <PlayerTile
                        name={member.name}
                        player={colorOf(member.id)}
                        isMe={member.id === participantId}
                        isHost={member.id === room.hostId}
                        ready={isReady(member)}
                        disconnected={!member.connected}
                        joined={joined.has(member.id)}
                      />
                    </PlayerSlot>
                  ))}
                  {members.length < MAX_PLAYERS ? (
                    <PlayerSlot>
                      <EmptySlot onClick={() => setInvite(true)} />
                    </PlayerSlot>
                  ) : null}
                </PlayerGrid>
              </Stack>
            </Surface>
          </Entrance>
          <LeaveButton placement="column" disabled={busy} onClick={() => setLeavingOpen(true)} />
        </LobbyColumn>

        <Entrance as="section" order={1} motion="fade" aria-labelledby="rules-title">
          <Surface variant="soft" padding="fluid">
            <Stack gap="4">
              <RulesHead title="ルール" titleId="rules-title" />
              {waitingForNext ? (
                <Text variant="body-sm" tone="muted" role="status">
                  対戦中です。次の対戦から参加できます。
                </Text>
              ) : null}
              <RulesList mode={mode}>
                <Rule mode={mode} term="難易度">
                  {isHost ? (
                    <SegmentedControl
                      label="難易度"
                      tone="accent"
                      options={difficultyOptions}
                      value={settings.difficulty}
                      onValueChange={(value) => {
                        const found = DIFFICULTIES.find((item) => item.value === value);
                        if (found) changeSettings({ ...settings, difficulty: found.value });
                      }}
                    />
                  ) : (
                    <RuleSummary>{difficulty.label}</RuleSummary>
                  )}
                </Rule>
                <Rule mode={mode} wide>
                  <LevelArt
                    word={level.toUpperCase()}
                    extra={difficulty.extra ? "EXTRA" : undefined}
                    parts={difficulty.description.split("・")}
                    images={DIFFICULTIES.map((item) => ({
                      key: item.value,
                      src: DIFFICULTY_SAMPLES[item.value],
                      alt: `${item.label}のお題のイメージ`,
                      hidden: item.value !== level,
                    }))}
                  />
                </Rule>
                <Rule mode={mode} term="制限時間">
                  {isHost ? (
                    <SegmentedControl
                      label="制限時間"
                      options={choicesWith(
                        battleOptions.duration.choices,
                        settings.durationSeconds,
                      ).map((value) => ({
                        value: String(value),
                        label: `${value}秒`,
                      }))}
                      value={String(settings.durationSeconds)}
                      onValueChange={(value) =>
                        changeSettings({ ...settings, durationSeconds: Number(value) })
                      }
                    />
                  ) : (
                    <RuleSummary>{settings.durationSeconds}秒</RuleSummary>
                  )}
                </Rule>
                <Rule mode={mode} term="画像選択の猶予">
                  {isHost ? (
                    <SegmentedControl
                      label="画像選択の猶予"
                      options={choicesWith(
                        battleOptions.selection.choices,
                        settings.selectionSeconds,
                      ).map((value) => ({
                        value: String(value),
                        label: `${value}秒`,
                      }))}
                      value={String(settings.selectionSeconds)}
                      onValueChange={(value) =>
                        changeSettings({ ...settings, selectionSeconds: Number(value) })
                      }
                    />
                  ) : (
                    <RuleSummary>{settings.selectionSeconds}秒</RuleSummary>
                  )}
                </Rule>
              </RulesList>
              {error ? (
                <Text variant="caption" tone="danger" role="alert">
                  {error}
                </Text>
              ) : null}
              <RulesDivider />
              <GoPanel
                note={isHost ? (startReason ?? undefined) : "ホストが開始します"}
                status={{ ready: readyCount, total: room.members.length, allReady }}
              >
                {isHost ? (
                  <Button
                    size="lg"
                    fullWidth
                    loading={starting}
                    disabled={!canStart}
                    onClick={() => (waiting.length ? setConfirmingStart(true) : void start())}
                  >
                    対戦をはじめる
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    aria-pressed={Boolean(me?.ready)}
                    disabled={busy || !me || waitingForNext}
                    onClick={() => void toggleReady()}
                  >
                    {me?.ready ? "準備完了を取り消す" : "準備完了にする"}
                  </Button>
                )}
              </GoPanel>
            </Stack>
          </Surface>
        </Entrance>
      </LobbyLayout>

      <Dialog
        open={invite}
        onOpenChange={setInvite}
        sheet
        title="友だちを招待"
        description="リンクを送るか、コードを伝えるか、QRコードを読み取ってもらおう。"
      >
        <InviteRow url={inviteUrl} copied={copied} onCopy={() => void copyInvite()} />
        <CodeDisplay code={room.code} size="sm" />
        <InviteQr url={inviteUrl} />
        <DialogClose>
          <Button variant="secondary" size="lg" fullWidth>
            閉じる
          </Button>
        </DialogClose>
      </Dialog>

      <Dialog
        open={leavingOpen}
        onOpenChange={setLeavingOpen}
        role="alertdialog"
        title="ルームを出ますか？"
        description="ホストの場合は、接続中の参加者のうち、最も早く参加した人に引き継ぎます。"
        footer={
          <>
            <DialogClose>
              <Button variant="secondary" size="lg">
                やめる
              </Button>
            </DialogClose>
            <Button
              size="lg"
              loading={busy}
              loadingText="退出しています…"
              onClick={() => void leave()}
            >
              退出する
            </Button>
          </>
        }
      />

      <Dialog
        open={confirmingStart}
        onOpenChange={setConfirmingStart}
        sheet
        title="全員の準備がまだです"
        description={`準備中の人が${waiting.length}人います。このまま対戦をはじめますか？`}
        footer={
          <>
            <DialogClose>
              <Button variant="secondary" size="lg">
                待つ
              </Button>
            </DialogClose>
            <Button
              size="lg"
              onClick={() => {
                setConfirmingStart(false);
                void start();
              }}
            >
              このままはじめる
            </Button>
          </>
        }
      >
        <WaitingList
          members={waiting.map((member) => ({
            id: member.id,
            name: member.name,
            player: colorOf(member.id),
          }))}
        />
      </Dialog>
    </>
  );
}
