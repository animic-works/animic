import { createFileRoute, notFound, redirect, useRouter } from "@tanstack/react-router";
import { createClientOnlyFn } from "@tanstack/react-start";
import * as v from "valibot";

import { useWipe } from "../components/transition";
import { EntryFlow } from "../features/room/entry-flow";
import { RoomScreen } from "../features/room/room-screen";
import { getRoomEntry, joinRoom } from "../features/room/room.functions";
import { ROOM_CODE_CHARS, roomCodeSchema } from "../features/room/room-state";
import { ensureParticipant } from "../lib/auth.client";
import { getCurrentParticipant } from "../lib/auth.functions";

// 匿名セッションの準備はブラウザ専用のため、サーバーのバンドルから外す。
const ensureParticipantOnClient = createClientOnlyFn(ensureParticipant);

export const Route = createFileRoute("/rooms/$code")({
  loader: async ({ params }) => {
    const code = v.safeParse(roomCodeSchema, params.code);
    if (!code.success) throw notFound();
    // 小文字のコードは大文字に正規化したURLへそろえる。
    if (code.output !== params.code)
      throw redirect({ to: "/rooms/$code", params: { code: code.output }, replace: true });
    const [entry, participant] = await Promise.all([
      getRoomEntry({ data: { code: code.output } }),
      getCurrentParticipant(),
    ]);
    // 存在しない・終了したルームは、ほかの不明なURLと同じ404にする。
    if (!entry.exists) throw notFound();
    return { ...entry, participant };
  },
  head: ({ params }) => ({ meta: [{ title: `ルーム ${params.code} | Animic` }] }),
  component: RoomPage,
});

function RoomPage() {
  const { code } = Route.useParams();
  const { room, inviteUrl, participant } = Route.useLoaderData();
  const router = useRouter();
  const wipe = useWipe();

  if (!room || !participant) {
    async function join(name: string) {
      await wipe.buildRoom({
        label: "ルームに参加しています",
        done: "ルームに入りました！",
        sub: `${name} さんとして参加`,
        codeCharacters: ROOM_CODE_CHARS,
        codeLength: 8,
        task: async () => {
          await ensureParticipantOnClient();
          await joinRoom({ data: { code, name } });
          return code;
        },
        // 参加したら loader を読み直し、同じURLでロビーを表示する。
        navigate: () => router.invalidate(),
      });
    }
    return (
      <EntryFlow
        mode="join"
        code={code}
        onSubmit={join}
        back={{ href: "/", label: "トップへ戻る" }}
      />
    );
  }

  return (
    <RoomScreen
      key={`${code}:${participant.id}`}
      initial={room}
      participantId={participant.id}
      inviteUrl={inviteUrl}
    />
  );
}
