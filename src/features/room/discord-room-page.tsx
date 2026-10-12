import { useEffect, useState } from "react";
import { Page } from "@animic/react/page";
import { Section } from "@animic/react/section";
import { Container } from "@animic/react/container";
import { Notice } from "@animic/react/notice";
import { Spinner } from "@animic/react/spinner";
import { Button } from "@animic/react/button";
import {
  authenticateActivity,
  closeActivity,
  resetActivityAuthentication,
} from "../../lib/discord-sdk";
import { getCurrentParticipant } from "../../lib/auth.functions";
import { listPromptGroups } from "../image-generation/prompt-phrases.functions";
import { getBattleOptions } from "./battle-options.functions";
import { enterDiscordRoom } from "./discord-room.functions";
import { getRoomEntry } from "./room.functions";
import { RoomPage } from "./room-page";

async function loadRoom(code: string) {
  const [entry, participant, battleOptions, promptGroups] = await Promise.all([
    getRoomEntry({ data: { code } }),
    getCurrentParticipant(),
    getBattleOptions(),
    listPromptGroups(),
  ]);
  if (!entry.room || !participant)
    throw new Error("ルームに接続できませんでした。もう一度お試しください。");
  return {
    initial: entry.room,
    inviteUrl: entry.inviteUrl,
    participantId: participant.id,
    battleOptions,
    promptGroups,
  };
}

export function DiscordRoomPage({ clientId }: { clientId: string | null }) {
  const [attempt, setAttempt] = useState(0);
  return (
    <DiscordRoomSession
      key={attempt}
      clientId={clientId}
      onRetry={() => {
        resetActivityAuthentication();
        setAttempt((value) => value + 1);
      }}
    />
  );
}

function DiscordRoomSession({
  clientId,
  onRetry,
}: {
  clientId: string | null;
  onRetry: () => void;
}) {
  const [room, setRoom] = useState<Awaited<ReturnType<typeof loadRoom>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function start() {
      setError(null);
      if (!clientId) throw new Error("Discord Activitiesの準備ができていません。");
      const query = new URLSearchParams(window.location.search);
      if (!query.has("frame_id") || !query.has("instance_id"))
        throw new Error("DiscordのアクティビティからAnimicを起動してください。");
      const identity = await authenticateActivity(clientId);
      const code = await enterDiscordRoom({ data: identity });
      const loaded = await loadRoom(code);
      if (!cancelled) setRoom(loaded);
    }
    void start().catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : "接続できませんでした。");
    });
    return () => {
      cancelled = true;
    };
  }, [clientId]);
  if (room)
    return (
      <RoomPage
        key={room.initial.code}
        {...room}
        onExit={() => {
          closeActivity();
          setRoom(null);
          setEnded(true);
        }}
      />
    );
  return (
    <Page>
      <Section>
        <Container size="narrow">
          {ended ? (
            <Notice title="Activityを終了しました">DiscordからActivityを閉じてください。</Notice>
          ) : error ? (
            <div role="alert">
              <Notice
                tone="danger"
                title="Activityに接続できませんでした"
                actions={<Button onClick={onRetry}>もう一度試す</Button>}
              >
                {error}
              </Notice>
            </div>
          ) : (
            <Spinner label="Discordに接続しています…" />
          )}
        </Container>
      </Section>
    </Page>
  );
}
