import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import * as v from "valibot";

import { hasEnoughParticipants } from "../features/battle/battle-state";
import { BattleSetup } from "../features/battle/battle-setup";
import { BattleView } from "../features/battle/battle-view";
import { getRoomEntry } from "../features/room/room.functions";
import { RoomEntry } from "../features/room/room-entry";
import { RoomLobby } from "../features/room/room-lobby";
import { roomCodeSchema } from "../features/room/room-state";
import styles from "./-index.module.css";

export const Route = createFileRoute("/rooms/$code")({
  loader: async ({ params }) => {
    const code = v.safeParse(roomCodeSchema, params.code);
    if (!code.success) throw notFound();
    if (code.output !== params.code)
      throw redirect({ to: "/rooms/$code", params: { code: code.output }, replace: true });
    const entry = await getRoomEntry({ data: { code: code.output } });
    if (!entry.exists) throw notFound();
    return entry;
  },
  component: RoomPage,
});

function RoomPage() {
  const { code } = Route.useParams();
  const { room, inviteUrl } = Route.useLoaderData();
  const { participant } = Route.useRouteContext();
  return (
    <main className={styles.page}>
      <a href="/">Animic</a>
      <h1>ルーム {code}</h1>
      {room && participant ? (
        <RoomLobby
          key={`${code}:${participant.id}`}
          initial={room}
          participantId={participant.id}
          inviteUrl={inviteUrl}
          renderBattle={(current, connected) => (
            <>
              {current.battle && (
                <BattleView
                  key={`battle:${current.battle.id}`}
                  code={code}
                  battle={current.battle}
                  participantId={participant.id}
                  connected={connected}
                />
              )}
              {(!current.battle || current.battle.result) &&
                (current.hostId === participant.id ? (
                  <BattleSetup
                    key={`setup:${current.battle?.id ?? "initial"}`}
                    code={code}
                    previousBattleId={current.battle?.id ?? null}
                    canStart={connected && hasEnoughParticipants(current.members.length)}
                    initialSettings={current.settings}
                  />
                ) : (
                  <p>ホストが対戦の条件を設定しています。</p>
                ))}
            </>
          )}
        />
      ) : (
        <RoomEntry code={code} />
      )}
    </main>
  );
}
