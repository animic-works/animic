import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import * as v from "valibot";
import { roomCodeSchema } from "../features/room/room-state";
import { getRoomEntry } from "../features/room/room.functions";
import { getCurrentParticipant } from "../lib/auth.functions";
import { RoomPage } from "../features/room/room-page";
import { RoomEntry } from "../features/room/room-entry";
import { parseLoginSearch } from "../features/room/entry-login";
import { getBattleOptions } from "../features/room/battle-options.functions";
export const Route = createFileRoute("/rooms/$code")({
  validateSearch: parseLoginSearch,
  loader: async ({ params }) => {
    const code = v.safeParse(roomCodeSchema, params.code);
    if (!code.success) throw notFound();
    if (code.output !== params.code)
      throw redirect({ to: "/rooms/$code", params: { code: code.output }, replace: true });
    const [entry, participant, battleOptions] = await Promise.all([
      getRoomEntry({ data: { code: code.output } }),
      getCurrentParticipant(),
      getBattleOptions(),
    ]);
    if (!entry.exists) throw notFound();
    return { ...entry, participant, battleOptions };
  },
  headers: () => ({ "Cache-Control": "private, no-store" }),
  head: ({ params }) => ({ meta: [{ title: `ルーム ${params.code} | Animic` }] }),
  component: function RoomRoute() {
    const { code } = Route.useParams();
    const { room, participant, inviteUrl, battleOptions } = Route.useLoaderData();
    const { error } = Route.useSearch();
    return room && participant ? (
      <RoomPage
        key={`${code}:${participant.id}`}
        initial={room}
        participantId={participant.id}
        inviteUrl={inviteUrl}
        battleOptions={battleOptions}
      />
    ) : (
      <RoomEntry
        key={`${code}:${participant?.id ?? "guest"}`}
        code={code}
        account={participant?.account ?? null}
        loginError={error}
      />
    );
  },
});
