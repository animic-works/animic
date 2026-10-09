import { useEffect, useRef, useState } from "react";
import { ActionBar } from "@animic/react/action-bar";
import { ActionGroup } from "@animic/react/action-group";
import { AppFrame, AppFrameWideContent } from "@animic/react/app-frame";
import { Avatar } from "@animic/react/avatar";
import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { Center } from "@animic/react/center";
import { Cluster } from "@animic/react/cluster";
import { CodeDisplay } from "@animic/react/code-display";
import { Dialog } from "@animic/react/dialog";
import { Heading } from "@animic/react/heading";
import { IconButton } from "@animic/react/icon-button";
import { Input } from "@animic/react/input";
import { Media } from "@animic/react/media";
import { Page } from "@animic/react/page";
import { QrCode } from "@animic/react/qr-code";
import { SegmentedControl } from "@animic/react/segmented-control";
import { Separator } from "@animic/react/separator";
import { Split } from "@animic/react/split";
import { StatusLabel } from "@animic/react/status-label";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { Tile, TileCollection } from "@animic/react/tile-collection";
import { useToast } from "@animic/react/toast";
import { AppBrand } from "../shared/app-brand";
import { ExitIcon, InviteIcon } from "../shared/icons";
import { GridBackdrop } from "../shared/visuals/grid-backdrop";
import { levels, playerPalettes } from "./room-presentation";
import type { RoomSnapshot } from "./room-state";
import type { BattleSettings } from "../battle/battle-state";
import { choicesWith, defaultBattleSettings, type BattleOptions } from "./battle-options";
import { useRoomSettings } from "./use-room-settings";
import { startBattle } from "../battle/battle.functions";
import { leaveRoom, setReady, setRoomSettings } from "./room.functions";

export function LobbyPage({
  room,
  participantId,
  inviteUrl,
  battleOptions,
  previousBattleId,
  waitingForNext,
  onLeaving,
  onLeft,
}: {
  room: RoomSnapshot;
  participantId: string;
  inviteUrl: string;
  battleOptions: BattleOptions;
  previousBattleId: string | null;
  waitingForNext: boolean;
  onLeaving: (value: boolean) => void;
  onLeft: () => void;
}) {
  const [dialog, setDialog] = useState<"invite" | "leave" | "start" | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const defaultsSent = useRef(false);
  const toast = useToast();
  const { code } = room;
  const isHost = room.hostId === participantId;
  const {
    settings: rules,
    save,
    flush,
  } = useRoomSettings(room, defaultBattleSettings(battleOptions), previousBattleId);
  const players = room.members
    .toSorted((a, b) => Number(b.id === room.hostId) - Number(a.id === room.hostId))
    .map((p) => ({ ...p, isMe: p.id === participantId, ready: p.id === room.hostId || p.ready }));
  const readyCount = players.filter((p) => p.connected && p.ready).length;
  const connectedCount = players.filter((p) => p.connected).length;
  const allReady = connectedCount >= 2 && readyCount === connectedCount;
  const waiting = players.filter((p) => p.connected && !p.ready);
  const me = players.find((p) => p.isMe);
  const level = levels[rules.difficulty];
  const roomUrl = inviteUrl;
  useEffect(() => {
    if (!isHost || room.settings || defaultsSent.current || waitingForNext) return;
    defaultsSent.current = true;
    void save(defaultBattleSettings(battleOptions)).catch(() =>
      setError("ルールを保存できませんでした。選び直してください。"),
    );
  }, [isHost, room.settings, waitingForNext, battleOptions, save]);
  async function act(action: () => Promise<void>) {
    if (pending) return;
    setPending(true);
    setError(undefined);
    try {
      await action();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "操作できませんでした。もう一度お試しください。",
      );
    } finally {
      setPending(false);
    }
  }
  function changeRules(settings: BattleSettings) {
    setError(undefined);
    void save(settings).catch(() => setError("ルールを保存できませんでした。選び直してください。"));
  }
  function start() {
    void act(async () => {
      await flush();
      await setRoomSettings({ data: { code, settings: rules, previousBattleId } });
      const result = await startBattle({ data: { code, settings: rules, previousBattleId } });
      if (result.error) throw new Error(result.error);
    });
  }
  function leave() {
    void act(async () => {
      onLeaving(true);
      try {
        await leaveRoom({ data: { code } });
        onLeft();
      } catch (cause) {
        onLeaving(false);
        throw cause;
      }
    });
  }
  const readiness = (
    <StatusLabel appearance="badge" tone={allReady ? "success" : "neutral"} aria-live="polite">
      準備OK{" "}
      <Text variant="numeric.inline" tone={allReady ? "success" : "default"}>
        {readyCount} / {players.length}
      </Text>{" "}
      人
    </StatusLabel>
  );
  async function copy(value: string, title: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.show({ title });
    } catch {
      toast.show({ title: "コピーできませんでした" });
    }
  }
  return (
    <Page decoration={<GridBackdrop />}>
      <AppFrame
        brand={<AppBrand />}
        compactContext={
          <Button
            appearance="soft"
            shape="pill"
            size="xs"
            onClick={() => void copy(code, "ルームコードをコピーしました")}
          >
            <Text variant="caption" tone="supporting">
              ルーム
            </Text>
            <CodeDisplay value={code} presentation="inline" size="sm" />
          </Button>
        }
        compactActions={
          <IconButton appearance="quiet" label="退出" onClick={() => setDialog("leave")}>
            <ExitIcon />
          </IconButton>
        }
        bottomAction
      >
        <Split layout="balanced-aside">
          <Stack>
            <Surface appearance="card" padding="content">
              <Stack>
                <Stack space="compact">
                  <Heading level={1} size="title">
                    ルームコード
                  </Heading>
                  <Cluster>
                    <CodeDisplay
                      value={code}
                      onCopy={() => void copy(code, "ルームコードをコピーしました")}
                    />
                    <Button
                      size="md"
                      shape="pill"
                      prominence="lifted"
                      onClick={() => setDialog("invite")}
                    >
                      <InviteIcon /> 招待する
                    </Button>
                  </Cluster>
                </Stack>
                <Separator appearance="dashed" />
                <Cluster justify="between">
                  <Heading level={2} size="title">
                    プレイヤー {players.length}
                    <Text variant="numeric.remainder" tone="subtle">
                      {" "}
                      / 8
                    </Text>
                  </Heading>
                  <AppFrameWideContent>{readiness}</AppFrameWideContent>
                </Cluster>
                <TileCollection label="プレイヤー" capacity={8}>
                  {players.map((player) => (
                    <Tile
                      key={player.id}
                      selected={player.isMe}
                      badge={
                        player.id === room.hostId ? (
                          <Badge tone="highlight" size="xs">
                            ホスト
                          </Badge>
                        ) : player.isMe ? (
                          <Badge tone="primary" size="xs">
                            あなた
                          </Badge>
                        ) : undefined
                      }
                      media={
                        <Avatar
                          name={player.name}
                          fallback={Array.from(player.name)[0]}
                          palette={
                            playerPalettes[
                              room.members.findIndex((member) => member.id === player.id) %
                                playerPalettes.length
                            ]
                          }
                        />
                      }
                      footer={
                        <StatusLabel
                          tone={player.connected && player.ready ? "success" : "neutral"}
                        >
                          {!player.connected ? "離席中" : player.ready ? "準備OK" : "準備中"}
                        </StatusLabel>
                      }
                    >
                      <Text variant="label.name">
                        {player.name}
                        {player.isMe && player.id === room.hostId && "（あなた）"}
                      </Text>
                    </Tile>
                  ))}
                  {players.length < 8 && (
                    <Tile
                      appearance="placeholder"
                      media={
                        <Text variant="numeric" tone="accent">
                          ＋
                        </Text>
                      }
                      onClick={() => setDialog("invite")}
                    >
                      <Text variant="label.supporting" tone="accent">
                        招待する
                      </Text>
                    </Tile>
                  )}
                </TileCollection>
              </Stack>
            </Surface>
            <AppFrameWideContent>
              <Cluster>
                <Button
                  appearance="secondary"
                  shape="pill"
                  size="sm"
                  onClick={() => setDialog("leave")}
                >
                  退出
                </Button>
              </Cluster>
            </AppFrameWideContent>
          </Stack>
          <Surface appearance="card" padding="content">
            <Stack space="compact">
              <Heading level={2} size="title">
                ルール
              </Heading>
              {isHost ? (
                <SegmentedControl
                  label="難易度"
                  disabled={pending || waitingForNext}
                  labelVisibility="visible"
                  labelPlacement="inline"
                  appearance="pill"
                  tone="accent"
                  value={rules.difficulty}
                  options={Object.entries(levels).map(([value, l]) => ({
                    value,
                    label: l.label,
                  }))}
                  onValueChange={(value) =>
                    (value === "easy" || value === "normal" || value === "hard") &&
                    changeRules({ ...rules, difficulty: value })
                  }
                />
              ) : (
                <Cluster justify="between">
                  <Text variant="label.supporting">難易度</Text>
                  <Text variant="label">{level.label}</Text>
                </Cluster>
              )}
              <Media
                presentation="captioned"
                src={level.image}
                alt={`${level.label}のお題のイメージ`}
                label={<Badge appearance="glass">TOPIC IMAGE</Badge>}
                caption={
                  <Stack space="tight">
                    <Cluster>
                      <Text variant="label.artwork" emphasis="outline" tone="inverse">
                        {level.word}
                      </Text>
                      {rules.difficulty === "hard" && <Badge appearance="sticker">EXTRA</Badge>}
                    </Cluster>
                    <Text variant="label.caption" emphasis="accent-shadow" tone="inverse">
                      {level.description}
                    </Text>
                  </Stack>
                }
              />
              {isHost ? (
                <SegmentedControl
                  label="制限時間"
                  disabled={pending || waitingForNext}
                  labelVisibility="visible"
                  labelPlacement="inline"
                  appearance="pill"
                  value={String(rules.durationSeconds)}
                  options={choicesWith(battleOptions.duration.choices, rules.durationSeconds).map(
                    (value) => ({
                      value: String(value),
                      label: `${value}秒`,
                    }),
                  )}
                  onValueChange={(value) =>
                    changeRules({
                      ...rules,
                      durationSeconds: Number(value),
                    })
                  }
                />
              ) : (
                <Cluster justify="between">
                  <Text variant="label.supporting">制限時間</Text>
                  <Text variant="label">{rules.durationSeconds}秒</Text>
                </Cluster>
              )}
              {isHost ? (
                <SegmentedControl
                  label="画像選択の猶予"
                  disabled={pending || waitingForNext}
                  labelVisibility="visible"
                  labelPlacement="inline"
                  appearance="pill"
                  value={String(rules.selectionSeconds)}
                  options={choicesWith(battleOptions.selection.choices, rules.selectionSeconds).map(
                    (value) => ({
                      value: String(value),
                      label: `${value}秒`,
                    }),
                  )}
                  onValueChange={(value) =>
                    changeRules({
                      ...rules,
                      selectionSeconds: Number(value),
                    })
                  }
                />
              ) : (
                <Cluster justify="between">
                  <Text variant="label.supporting">画像選択の猶予</Text>
                  <Text variant="label">{rules.selectionSeconds}秒</Text>
                </Cluster>
              )}
              {error && (
                <div role="alert">
                  <Text tone="danger">{error}</Text>
                </div>
              )}
              {waitingForNext ? (
                <div role="status">
                  <Text>対戦中です。次の対戦から参加できます。</Text>
                </div>
              ) : isHost && connectedCount !== 2 ? (
                <Text variant="caption" tone="muted">
                  接続中の参加者が2人のときに開始できます
                </Text>
              ) : null}
              <ActionBar
                tone={allReady ? "success" : "neutral"}
                summary={
                  <>
                    <Text variant="caption" tone="supporting">
                      準備OK
                    </Text>
                    <Text variant="numeric">
                      {readyCount}/{players.length}
                    </Text>
                  </>
                }
              >
                {isHost ? (
                  <Button
                    shape="pill"
                    size="lg"
                    prominence="raised"
                    disabled={connectedCount !== 2 || waitingForNext}
                    loading={pending}
                    onClick={() => (waiting.length ? setDialog("start") : start())}
                  >
                    対戦をはじめる
                  </Button>
                ) : (
                  <Button
                    shape="pill"
                    size="lg"
                    appearance={me?.ready ? "secondary" : "primary"}
                    disabled={!me || waitingForNext}
                    loading={pending}
                    onClick={() =>
                      void act(async () => {
                        await setReady({ data: { code, ready: !me?.ready } });
                      })
                    }
                  >
                    {me?.ready ? "準備完了を取り消す" : "準備完了にする"}
                  </Button>
                )}
                {!isHost && (
                  <Text variant="caption" tone="muted" align="center">
                    ホストが開始します
                  </Text>
                )}
              </ActionBar>
            </Stack>
          </Surface>
        </Split>
      </AppFrame>
      <Dialog
        open={dialog === "invite"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="友だちを招待"
        size="compact"
        presentation="centered"
        closeButton={false}
        description="リンクを送るか、コードを伝えるか、QRコードを読み取ってもらおう。"
      >
        <Stack>
          <Cluster layout="nowrap">
            <Input aria-label="ルームURL" value={roomUrl} readOnly />
            <Button shape="pill" onClick={() => void copy(roomUrl, "招待リンクをコピーしました")}>
              コピー
            </Button>
          </Cluster>
          <Center>
            <CodeDisplay value={code} presentation="cells" />
          </Center>
          <Center>
            <QrCode value={roomUrl} label="ルームURLのQRコード" />
          </Center>
          <Button appearance="secondary" shape="pill" onClick={() => setDialog(null)}>
            閉じる
          </Button>
        </Stack>
      </Dialog>
      <Dialog
        open={dialog === "leave"}
        onOpenChange={(open) => !open && !pending && setDialog(null)}
        dismissible={!pending}
        title="ルームを出ますか？"
        closeButton={false}
        description={
          isHost
            ? players.length > 1
              ? "次に参加した人にホストを引き継ぎます。"
              : "ルームから退出します。"
            : "ルームから退出します。"
        }
        presentation="centered"
        size="compact"
      >
        <Stack>
          {error && (
            <div role="alert">
              <Text tone="danger">{error}</Text>
            </div>
          )}
          <ActionGroup layout="confirm">
            <Button
              appearance="secondary"
              shape="pill"
              size="lg"
              loading={pending}
              onClick={() => setDialog(null)}
            >
              やめる
            </Button>
            <Button
              loading={pending}
              shape="pill"
              size="lg"
              onClick={() => {
                leave();
              }}
            >
              退出する
            </Button>
          </ActionGroup>
        </Stack>
      </Dialog>
      <Dialog
        open={dialog === "start"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="全員の準備がまだです"
        presentation="centered"
        closeButton={false}
        description={`準備中の人が${waiting.length}人います。このまま対戦をはじめますか？`}
        size="compact"
      >
        <Stack>
          {waiting.map((p) => (
            <Cluster key={p.id}>
              <Avatar name={p.name} size="compact" />
              <Text variant="label">{p.name}</Text>
              <Text variant="caption" tone="muted">
                準備中
              </Text>
            </Cluster>
          ))}
          <ActionGroup layout="confirm">
            <Button appearance="secondary" shape="pill" size="lg" onClick={() => setDialog(null)}>
              待つ
            </Button>
            <Button
              shape="pill"
              size="lg"
              onClick={() => {
                setDialog(null);
                start();
              }}
            >
              このままはじめる
            </Button>
          </ActionGroup>
        </Stack>
      </Dialog>
    </Page>
  );
}
