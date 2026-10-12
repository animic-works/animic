import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import * as v from "valibot";
import { shareMeta } from "../features/home/share-meta";
import { getOgImage } from "../features/home/home-content.functions";
import { roomCodeSchema } from "../features/room/room-state";
import { getRoomEntry } from "../features/room/room.functions";
import { getCurrentParticipant } from "../lib/auth.functions";
import { RoomPage } from "../features/room/room-page";
import { RoomEntry } from "../features/room/room-entry";
import { parseLoginSearch } from "../features/room/entry-login";
import { getBattleOptions } from "../features/room/battle-options.functions";
import { listPromptGroups } from "../features/image-generation/prompt-phrases.functions";
export const Route = createFileRoute("/rooms/$code")({
  validateSearch: parseLoginSearch,
  loader: async ({ params }) => {
    const code = v.safeParse(roomCodeSchema, params.code);
    if (!code.success) throw notFound();
    if (code.output !== params.code)
      throw redirect({ to: "/rooms/$code", params: { code: code.output }, replace: true });
    const [entry, participant, battleOptions, promptGroups, sharing] = await Promise.all([
      getRoomEntry({ data: { code: code.output } }),
      getCurrentParticipant(),
      getBattleOptions(),
      listPromptGroups(),
      getOgImage(),
    ]);
    if (!entry.exists) throw notFound();
    return { ...entry, participant, battleOptions, promptGroups, ...sharing };
  },
  headers: () => ({ "Cache-Control": "private, no-store" }),
  head: ({ params, loaderData }) => ({
    meta: [
      { title: `ルーム ${params.code} | Animic` },
      ...(loaderData
        ? shareMeta({
            title: `ルーム: ${params.code} | Animic`,
            description:
              "Animicでの対戦に招待されました。お題のイラストを、プロンプトだけでAIに再現させよう。より近い1枚を作ったほうが勝ち！",
            path: `/rooms/${params.code}`,
            image: loaderData.ogImage,
          })
        : []),
    ],
  }),
  component: function RoomRoute() {
    const { code } = Route.useParams();
    const { room, participant, inviteUrl, battleOptions, promptGroups } = Route.useLoaderData();
    const { error } = Route.useSearch();
    return room && participant ? (
      <RoomPage
        key={`${code}:${participant.id}`}
        initial={room}
        participantId={participant.id}
        inviteUrl={inviteUrl}
        battleOptions={battleOptions}
        promptGroups={promptGroups}
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
