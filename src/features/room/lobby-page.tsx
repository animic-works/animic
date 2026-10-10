import { useState } from "react";
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
    onLeft,
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
        open={dialog === "leave"}
        pending={actions.pending}
        error={actions.error}
        handsOverHost={isHost && lobby.players.length > 1}
        onClose={close}
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
