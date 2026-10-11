import { useBlocker } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppFrame, AppFrameWideContent } from "@animic/react/app-frame";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { CodeDisplay } from "@animic/react/code-display";
import { IconButton } from "@animic/react/icon-button";
import { Page } from "@animic/react/page";
import { Split } from "@animic/react/split";
import { Stack } from "@animic/react/stack";
import { Heading } from "@animic/react/heading";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
import { AppBrand } from "../shared/app-brand";
import { ExitIcon } from "../shared/icons";
import { GridBackdrop } from "../shared/visuals/grid-backdrop";
import type { BattleOptions } from "./battle-options";
import { InviteDialog, LeaveDialog, StartAnywayDialog } from "./lobby-dialogs";
import { getLobbyPlayers } from "./lobby-players";
import { LobbyPlayersPanel } from "./lobby-players-panel";
import { LobbyRulesPanel } from "./lobby-rules-panel";
import type { RoomSnapshot } from "./room-state";
import { useLobbyActions } from "./use-lobby-actions";

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
  // 退出した後の移動は止めない。
  const left = useRef(false);
  // 戻る操作などでルームの外へ移ろうとしたら、退出と同じ確認を出す。タブを閉じるときはブラウザの確認を出す。
  const blocker = useBlocker({
    shouldBlockFn: ({ current, next }) => !left.current && current.pathname !== next.pathname,
    enableBeforeUnload: () => !left.current,
    withResolver: true,
  });
  const toast = useToast();
  const { code } = room;
  const isHost = room.hostId === participantId;
  const lobby = getLobbyPlayers(room, participantId);
  const actions = useLobbyActions({
    room,
    isHost,
    battleOptions,
    previousBattleId,
    waitingForNext,
    onLeaving,
    onLeft: () => {
      left.current = true;
      // 戻る操作で確認した場合は、その移動先へ進む。
      if (blocker.status === "blocked") blocker.proceed();
      else onLeft();
    },
  });
  async function copy(value: string, title: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.show({ title });
    } catch {
      toast.show({ title: "コピーできませんでした" });
    }
  }
  const copyCode = () => void copy(code, "ルームコードをコピーしました");
  const close = () => setDialog(null);

  return (
    <Page decoration={<GridBackdrop />}>
      <AppFrame
        brand={<AppBrand />}
        // 見出しを置き、ロゴの横ではなくヘッダーの下からカードを並べる。
        context={
          <Stack space="tight">
            <Text variant="eyebrow.strong" tone="accent">
              LOBBY
            </Text>
            <Heading level={1} size="title">
              ロビー
            </Heading>
          </Stack>
        }
        compactContext={
          <Button appearance="soft" shape="pill" size="xs" onClick={copyCode}>
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
        <Split layout="balanced-aside" align="stretch">
          <Stack fill>
            <LobbyPlayersPanel
              code={code}
              lobby={lobby}
              onCopyCode={copyCode}
              onInvite={() => setDialog("invite")}
            />
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
          <LobbyRulesPanel
            isHost={isHost}
            rules={actions.rules}
            battleOptions={battleOptions}
            lobby={lobby}
            pending={actions.pending}
            error={actions.error}
            waitingForNext={waitingForNext}
            onRulesChange={actions.changeRules}
            onStart={() => (lobby.waiting.length ? setDialog("start") : actions.start())}
            onReadyChange={actions.setReady}
          />
        </Split>
      </AppFrame>
      <InviteDialog
        open={dialog === "invite"}
        code={code}
        inviteUrl={inviteUrl}
        onClose={close}
        onCopyUrl={() => void copy(inviteUrl, "招待リンクをコピーしました")}
      />
      <LeaveDialog
        open={dialog === "leave" || blocker.status === "blocked"}
        pending={actions.pending}
        error={actions.error}
        handsOverHost={isHost && lobby.players.length > 1}
        // 戻る操作で出した確認は、その移動だけを取り消す。開いていたほかのダイアログは閉じない。
        onClose={() => (blocker.status === "blocked" ? blocker.reset() : close())}
        onLeave={actions.leave}
      />
      <StartAnywayDialog
        open={dialog === "start"}
        waiting={lobby.waiting}
        onClose={close}
        onStart={() => {
          close();
          actions.start();
        }}
      />
    </Page>
  );
}
