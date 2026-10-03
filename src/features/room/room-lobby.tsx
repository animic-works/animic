import { playerColor } from "@animic/react/avatar";
import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { CodeDisplay } from "@animic/react/code";
import { Dialog, DialogClose } from "@animic/react/dialog";
import { TextField } from "@animic/react/field";
import { Stack } from "@animic/react/layout/stack";
import { VisuallyHidden } from "@animic/react/layout/visually-hidden";
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
  WaitingList,
} from "@animic/react/lobby";
import { SegmentedControl } from "@animic/react/lobby/segmented-control";
import { TopBar, TopBarSide } from "@animic/react/lobby/top-bar";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { toast } from "@animic/react/toast";
import { Entrance } from "@animic/react/transition";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import * as v from "valibot";

import { startBattle } from "../battle/battle.functions";
import {
  DEFAULT_SETTINGS,
  DIFFICULTY_LABELS,
  DIFFICULTY_RULE_PARTS,
  DIFFICULTY_SAMPLES,
  DIFFICULTY_WORDS,
  DURATION_OPTIONS,
  SELECTION_OPTIONS,
} from "../battle/battle-labels";
import type { BattleSettings } from "../battle/battle-state";
import { leaveRoom, setParticipantName, setReady, setRoomSettings } from "./room.functions";
import { participantNameSchema } from "./room-state";
import type { RoomSnapshot } from "./room-state";

const MAX_PLAYERS = 8;
const DIFFICULTIES = ["easy", "normal", "hard"] as const;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const errorMessage = (error: unknown) =>
  error instanceof Error && error.message ? error.message : "うまくいきませんでした。";

// 待機中のルーム: ルームコードと招待、参加者と準備状態、対戦の条件と開始
export function RoomLobby({
  room,
  inviteUrl,
  meId,
  connection,
  onLeft,
}: {
  room: RoomSnapshot;
  inviteUrl: string;
  meId: string | null;
  connection: string;
  onLeft: () => void;
}) {
  const isHost = room.hostId !== null && room.hostId === meId;
  const me = room.members.find((member) => member.id === meId);
  // ホストを先頭に、あとは参加順
  const members = room.members.toSorted((a, b) =>
    a.id === room.hostId ? -1 : b.id === room.hostId ? 1 : 0,
  );
  const connectedCount = room.members.filter((member) => member.connected).length;
  // ホストは開始の操作をするので、準備完了の操作はせず準備OKとして数える
  const isReady = (member: RoomSnapshot["members"][number]) =>
    member.id === room.hostId || member.ready;
  const readyCount = room.members.filter(isReady).length;

  // ルール: ホストは選択肢で決め、ゲストは決まった内容を見る
  const [local, setLocal] = useState<BattleSettings | null>(null);
  const settings = room.settings ?? local ?? DEFAULT_SETTINGS;
  const shown = settings;
  const previousBattleId = room.battle?.id ?? null;
  const pushedDefaults = useRef(false);
  useEffect(() => {
    if (!isHost || room.settings || pushedDefaults.current) return;
    pushedDefaults.current = true;
    setRoomSettings({
      data: { code: room.code, settings: DEFAULT_SETTINGS, previousBattleId },
    }).catch((error: unknown) => toast(errorMessage(error)));
  }, [isHost, room.settings, room.code, previousBattleId]);
  function changeSettings(next: BattleSettings) {
    setLocal(next);
    setRoomSettings({ data: { code: room.code, settings: next, previousBattleId } }).catch(
      (error: unknown) => toast(errorMessage(error)),
    );
  }

  // 入ってきた人を弾ませ、知らせる
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
      if (member.id !== meId) toast(`${member.name} さんが参加しました`);
    }
    setJoined(new Set(fresh.map((member) => member.id)));
  }, [room.members, meId]);

  const [invite, setInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // 準備中の人がいるときの、開始の確認
  const [confirmingStart, setConfirmingStart] = useState(false);
  const [busy, setBusy] = useState(false);
  const [countdown, setCountdown] = useState<number | "START!" | null>(null);
  // 表示名の変更: 自分の枠の鉛筆から窓を開き、今の名前を初期値にする
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const draftValid = v.safeParse(participantNameSchema, draft);
  const draftChanged = draftValid.success && draftValid.output !== me?.name;
  function openRename() {
    setDraft(me?.name ?? "");
    setRenameError(null);
    setRenaming(true);
  }
  async function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draftValid.success || !draftChanged) return;
    setBusy(true);
    try {
      await setParticipantName({ data: { code: room.code, name: draftValid.output } });
      setRenaming(false);
      toast("表示名を変更しました");
    } catch (error) {
      setRenameError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

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
    try {
      await leaveRoom({ data: { code: room.code } });
      onLeft();
    } catch (error) {
      toast(errorMessage(error));
      setBusy(false);
    }
  }

  async function toggleReady() {
    if (!me) return;
    setBusy(true);
    try {
      await setReady({ data: { code: room.code, ready: !me.ready } });
    } catch (error) {
      toast(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  // ホストが開始: カウントダウンのあとに開始を要求し、対戦の配信で画面が切り替わる
  async function start() {
    for (const n of [3, 2, 1]) {
      setCountdown(n);
      await wait(900);
    }
    setCountdown("START!");
    await wait(700);
    const result = await startBattle({
      data: { code: room.code, settings, previousBattleId },
    }).catch((error: unknown) => ({ error: errorMessage(error) }));
    if (result.error) {
      toast(result.error);
      setCountdown(null);
    }
  }

  const level = shown.difficulty;
  const mode = isHost ? "edit" : "view";
  // 準備中の参加者（ホストは数えない）
  const waiting = members.filter((member) => member.id !== room.hostId && !member.ready);
  const rulesLabel = `${DIFFICULTY_LABELS[settings.difficulty]}・${settings.durationSeconds}秒・猶予${settings.selectionSeconds}秒`;
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
          <LeaveButton placement="bar" disabled={busy} onClick={() => setLeaving(true)} />
        </TopBarSide>
      </TopBar>

      <LobbyLayout>
        <LobbyColumn>
          <Entrance as="section" order="0" aria-labelledby="players-title">
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
                  <ReadyStatus ready={readyCount} total={room.members.length} />
                </PlayerTitleRow>
                <PlayerGrid>
                  {members.map((member, index) => (
                    <PlayerSlot key={member.id}>
                      <PlayerTile
                        name={member.name}
                        player={playerColor(index)}
                        isMe={member.id === meId}
                        isHost={member.id === room.hostId}
                        ready={isReady(member)}
                        disconnected={!member.connected}
                        joined={joined.has(member.id)}
                        onEdit={member.id === meId ? openRename : undefined}
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
          <LeaveButton placement="column" disabled={busy} onClick={() => setLeaving(true)} />
        </LobbyColumn>

        <Entrance as="section" order="1" motion="fade" aria-labelledby="rules-title">
          <Surface variant="soft" padding="fluid">
            <Stack gap="4">
              <RulesHead title="ルール" titleId="rules-title" />
              <RulesList mode={mode}>
                <Rule mode={mode} term="難易度">
                  {isHost ? (
                    <SegmentedControl
                      label="難易度"
                      tone="accent"
                      options={DIFFICULTIES.map((value) => ({
                        value,
                        label: DIFFICULTY_LABELS[value],
                      }))}
                      value={settings.difficulty}
                      onValueChange={(value) => {
                        const difficulty = DIFFICULTIES.find((item) => item === value);
                        if (difficulty) changeSettings({ ...settings, difficulty });
                      }}
                    />
                  ) : (
                    <RuleSummary>{DIFFICULTY_LABELS[level]}</RuleSummary>
                  )}
                </Rule>
                <Rule mode={mode} wide>
                  <LevelArt
                    word={DIFFICULTY_WORDS[level]}
                    extra={level === "hard" ? "EXTRA" : undefined}
                    parts={DIFFICULTY_RULE_PARTS[level]}
                    images={DIFFICULTIES.map((difficulty) => ({
                      key: difficulty,
                      src: DIFFICULTY_SAMPLES[difficulty],
                      alt: `${DIFFICULTY_LABELS[difficulty]}のお題のイメージ`,
                      hidden: difficulty !== level,
                    }))}
                  />
                </Rule>
                <Rule mode={mode} term="制限時間">
                  {isHost ? (
                    <SegmentedControl
                      label="制限時間"
                      options={DURATION_OPTIONS.map((value) => ({
                        value: String(value),
                        label: `${value}秒`,
                      }))}
                      value={String(settings.durationSeconds)}
                      onValueChange={(value) =>
                        changeSettings({ ...settings, durationSeconds: Number(value) })
                      }
                    />
                  ) : (
                    <RuleSummary>{shown.durationSeconds}秒</RuleSummary>
                  )}
                </Rule>
                <Rule mode={mode} term="画像選択の猶予">
                  {isHost ? (
                    <SegmentedControl
                      label="画像選択の猶予"
                      options={SELECTION_OPTIONS.map((value) => ({
                        value: String(value),
                        label: `${value}秒`,
                      }))}
                      value={String(settings.selectionSeconds)}
                      onValueChange={(value) =>
                        changeSettings({ ...settings, selectionSeconds: Number(value) })
                      }
                    />
                  ) : (
                    <RuleSummary>{shown.selectionSeconds}秒</RuleSummary>
                  )}
                </Rule>
              </RulesList>
              <RulesDivider />
              <GoPanel
                note={isHost ? undefined : "ホストが開始します"}
                status={{ ready: readyCount, total: room.members.length }}
              >
                {isHost ? (
                  <Button
                    size="lg"
                    fullWidth
                    disabled={connectedCount < 2 || countdown !== null}
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
                    disabled={busy || !me}
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
        open={renaming}
        onOpenChange={setRenaming}
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
            <Button
              type="submit"
              form="rename-form"
              size="lg"
              loading={busy}
              loadingText="変更しています…"
              disabled={!draftChanged}
            >
              変更する
            </Button>
          </>
        }
      >
        <form id="rename-form" onSubmit={(event) => void rename(event)} noValidate>
          <TextField
            label="表示名"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={20}
            autoComplete="nickname"
            required
            helperText="20文字まで"
            errorText={renameError ?? undefined}
          />
        </form>
      </Dialog>

      <Dialog
        open={leaving}
        onOpenChange={setLeaving}
        role="alertdialog"
        title="ルームを出ますか？"
        description="ホストの場合は、次に参加した人にホストを引き継ぎます。"
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
            player: playerColor(members.indexOf(member)),
          }))}
        />
      </Dialog>

      {countdown !== null ? (
        <CountdownOverlay
          label={rulesLabel}
          count={countdown}
          sub={countdown === "START!" ? "お題を公開します" : "お題が公開されます"}
        />
      ) : null}
      {connection !== "接続済み" && connection !== "接続中…" && connection !== "再接続中…" ? (
        <Text variant="caption" tone="danger" align="center">
          {connection}
        </Text>
      ) : null}
    </>
  );
}
