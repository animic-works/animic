import { AppFrameWideContent } from "@animic/react/app-frame";
import { Avatar } from "@animic/react/avatar";
import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { CodeDisplay } from "@animic/react/code-display";
import { Heading } from "@animic/react/heading";
import { Separator } from "@animic/react/separator";
import { Stack } from "@animic/react/stack";
import { StatusLabel } from "@animic/react/status-label";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { Tile, TileCollection } from "@animic/react/tile-collection";
import { accountIconAvatar } from "../account/account-icon";
import { InviteIcon } from "../shared/icons";
import type { getLobbyPlayers, LobbyPlayer } from "./lobby-players";
import { playerPalettes } from "./room-presentation";
import { roomCapacity } from "./room-state";

type LobbyPlayers = ReturnType<typeof getLobbyPlayers>;

/** 準備OKの人数。全員そろうと成功の色にする。 */
function LobbyReadiness({ lobby }: { lobby: LobbyPlayers }) {
  return (
    <StatusLabel
      appearance="badge"
      tone={lobby.allReady ? "success" : "neutral"}
      aria-live="polite"
    >
      準備OK{" "}
      <Text variant="numeric.inline" tone={lobby.allReady ? "success" : "default"}>
        {lobby.readyCount} / {lobby.players.length}
      </Text>{" "}
      人
    </StatusLabel>
  );
}

function PlayerTile({ player }: { player: LobbyPlayer }) {
  return (
    <Tile
      selected={player.isMe}
      badge={
        player.isHost ? (
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
          {...accountIconAvatar(player.icon, playerPalettes[player.seat % playerPalettes.length])}
        />
      }
      footer={
        <StatusLabel tone={player.connected && player.ready ? "success" : "neutral"}>
          {!player.connected ? "離席中" : player.ready ? "準備OK" : "準備中"}
        </StatusLabel>
      }
    >
      <Text variant="label.name">
        {player.name}
        {player.isMe && player.isHost && "（あなた）"}
      </Text>
    </Tile>
  );
}

/** ルームコードと招待、参加者の一覧。 */
export function LobbyPlayersPanel({
  code,
  lobby,
  onCopyCode,
  onInvite,
}: {
  code: string;
  lobby: LobbyPlayers;
  onCopyCode: () => void;
  onInvite: () => void;
}) {
  return (
    <Surface appearance="card" padding="content">
      <Stack>
        <Stack space="compact">
          <Heading level={1} size="title">
            ルームコード
          </Heading>
          <Cluster>
            <CodeDisplay value={code} onCopy={onCopyCode} />
            <Button size="md" shape="pill" prominence="lifted" onClick={onInvite}>
              <InviteIcon /> 招待する
            </Button>
          </Cluster>
        </Stack>
        <Separator appearance="dashed" />
        <Cluster justify="between">
          <Heading level={2} size="title">
            プレイヤー {lobby.players.length}
            <Text variant="numeric.remainder" tone="subtle">
              {" "}
              / {roomCapacity}
            </Text>
          </Heading>
          <AppFrameWideContent>
            <LobbyReadiness lobby={lobby} />
          </AppFrameWideContent>
        </Cluster>
        <TileCollection label="プレイヤー" capacity={roomCapacity}>
          {lobby.players.map((player) => (
            <PlayerTile key={player.id} player={player} />
          ))}
          {lobby.players.length < roomCapacity && (
            <Tile
              appearance="placeholder"
              media={
                <Text variant="numeric" tone="accent">
                  ＋
                </Text>
              }
              onClick={onInvite}
            >
              <Text variant="label.supporting" tone="accent">
                招待する
              </Text>
            </Tile>
          )}
        </TileCollection>
      </Stack>
    </Surface>
  );
}
