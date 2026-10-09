import { Countdown } from "./visuals/countdown";
import { leavePreviewRoom } from "./room-preview-store";
import { useState } from "react";
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
import { useAccountPreview } from "../account/account-preview";
import { ProviderIcon } from "../../../src/features/account/visuals/provider-icon";
import { usePageTransition } from "../../../src/features/navigation/page-transition-provider";
import { AppBrand } from "../../../src/features/shared/app-brand";
import { ExitIcon, InviteIcon } from "../../../src/features/shared/icons";
import { GridBackdrop } from "../../../src/features/shared/visuals/grid-backdrop";
import { levels, playerPalettes } from "../../../src/features/room/room-presentation";
import type { LobbyActions, LobbyModel } from "./room-presentation";

export function LobbyPage({ model, actions }: { model: LobbyModel; actions: LobbyActions }) {
  const [dialog, setDialog] = useState<"invite" | "leave" | "start" | null>(null);
  const account = useAccountPreview();
  const { navigate } = usePageTransition();
  const toast = useToast();
  const { code, players, rules, isHost, countdown } = model;
  const roomUrl =
    typeof window === "undefined" ? `/rooms/${code}` : `${window.location.origin}/rooms/${code}`;
  const readyCount = players.filter((p) => p.ready).length;
  const allReady = players.length >= 2 && readyCount === players.length;
  const waiting = players.filter((p) => !p.ready);
  const me = players.find((p) => p.isMe)!;
  const level = levels[rules.level];
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
                  {players.map((player, index) => (
                    <Tile
                      key={player.id}
                      selected={player.isMe}
                      badge={
                        player.id === model.hostId ? (
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
                          palette={playerPalettes[index % playerPalettes.length]}
                          src={player.isMe ? account?.image : undefined}
                          badge={
                            player.isMe && account ? (
                              <ProviderIcon provider={account.provider} />
                            ) : undefined
                          }
                        />
                      }
                      footer={
                        <StatusLabel tone={player.ready ? "success" : "neutral"}>
                          {player.ready ? "準備OK" : "準備中"}
                        </StatusLabel>
                      }
                    >
                      <Text variant="label.name">
                        {player.name}
                        {player.isMe && player.id === model.hostId && "（あなた）"}
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
                  labelVisibility="visible"
                  labelPlacement="inline"
                  appearance="pill"
                  tone="accent"
                  value={rules.level}
                  options={Object.entries(levels).map(([value, l]) => ({
                    value,
                    label: l.label,
                  }))}
                  onValueChange={(value) =>
                    (value === "easy" || value === "normal" || value === "hard") &&
                    actions.setRules({ ...rules, level: value })
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
                      {rules.level === "hard" && <Badge appearance="sticker">EXTRA</Badge>}
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
                  labelVisibility="visible"
                  labelPlacement="inline"
                  appearance="pill"
                  value={String(rules.duration)}
                  options={[60, 90, 120].map((value) => ({
                    value: String(value),
                    label: `${value}秒`,
                  }))}
                  onValueChange={(value) =>
                    actions.setRules({
                      ...rules,
                      duration: value === "60" ? 60 : value === "120" ? 120 : 90,
                    })
                  }
                />
              ) : (
                <Cluster justify="between">
                  <Text variant="label.supporting">制限時間</Text>
                  <Text variant="label">{rules.duration}秒</Text>
                </Cluster>
              )}
              {isHost ? (
                <SegmentedControl
                  label="生成可能回数"
                  labelVisibility="visible"
                  labelPlacement="inline"
                  appearance="pill"
                  value={String(rules.limit)}
                  options={[3, 5, 10, 0].map((value) => ({
                    value: String(value),
                    label: value ? `${value}回` : "無制限",
                  }))}
                  onValueChange={(value) =>
                    actions.setRules({
                      ...rules,
                      limit: value === "3" ? 3 : value === "5" ? 5 : value === "10" ? 10 : 0,
                    })
                  }
                />
              ) : (
                <Cluster justify="between">
                  <Text variant="label.supporting">生成可能回数</Text>
                  <Text variant="label">{rules.limit ? `${rules.limit}回` : "無制限"}</Text>
                </Cluster>
              )}
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
                    disabled={players.length < 2 || countdown !== null}
                    onClick={() => (waiting.length ? setDialog("start") : actions.start())}
                  >
                    対戦をはじめる
                  </Button>
                ) : (
                  <Button
                    shape="pill"
                    size="lg"
                    appearance={me.ready ? "secondary" : "primary"}
                    onClick={actions.toggleReady}
                  >
                    {me.ready ? "準備完了を取り消す" : "準備完了にする"}
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
        onOpenChange={(open) => !open && setDialog(null)}
        title="ルームを出ますか？"
        closeButton={false}
        description={
          model.isHost
            ? model.players.length > 1
              ? "次に参加した人にホストを引き継ぎます。"
              : "ルームから退出します。"
            : "ルームから退出します。"
        }
        presentation="centered"
        size="compact"
      >
        <ActionGroup layout="confirm">
          <Button appearance="secondary" shape="pill" size="lg" onClick={() => setDialog(null)}>
            やめる
          </Button>
          <Button
            shape="pill"
            size="lg"
            onClick={() => {
              setDialog(null);
              leavePreviewRoom(model.code);
              navigate("/");
            }}
          >
            退出する
          </Button>
        </ActionGroup>
      </Dialog>
      <Dialog
        open={dialog === "start"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="全員の準備がまだです"
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
                actions.start();
              }}
            >
              このままはじめる
            </Button>
          </ActionGroup>
        </Stack>
      </Dialog>
      <Dialog
        open={countdown !== null}
        onOpenChange={() => {}}
        title="対戦を開始します"
        titleVisibility="hidden"
        presentation="fullscreen"
        appearance="immersive"
        closeButton={false}
        dismissible={false}
      >
        <Stack align="center" justify="center" fill>
          <Badge appearance="translucent">
            {`${level.label}・${rules.duration}秒・${rules.limit ? `生成${rules.limit}回まで` : "生成回数は無制限"}`}
          </Badge>
          {countdown !== null && <Countdown value={countdown} />}
          <Text variant="label" tone="inverse">
            {countdown === "START!" ? "お題を公開します" : "まもなく対戦開始"}
          </Text>
        </Stack>
      </Dialog>
    </Page>
  );
}
