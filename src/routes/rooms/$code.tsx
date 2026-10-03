import { useWipe } from "@animic/react/transition";
import { createFileRoute, notFound, redirect, useRouter } from "@tanstack/react-router";
import * as v from "valibot";

import { EntryFlow } from "../../features/room/entry-flow";
import { RoomScreen } from "../../features/room/room-screen";
import { getRoomEntry, joinRoom } from "../../features/room/room.functions";
import { roomCodeSchema } from "../../features/room/room-state";
import { getCurrentParticipant } from "../../lib/auth.functions";
import { prepareParticipant } from "../../lib/participant";

export const Route = createFileRoute("/rooms/$code")({
  loader: async ({ params }) => {
    const parsed = v.safeParse(roomCodeSchema, params.code);
    if (!parsed.success) throw notFound();
    // 小文字のコードは大文字に正規化したURLへそろえる
    if (parsed.output !== params.code)
      throw redirect({ to: "/rooms/$code", params: { code: parsed.output } });
    const [entry, participant] = await Promise.all([
      getRoomEntry({ data: { code: parsed.output } }),
      getCurrentParticipant(),
    ]);
    // 存在しない・終了したルームは、ほかの不明なURLと同じ404にする
    if (!entry.exists) throw notFound();
    return { code: parsed.output, entry, meId: participant?.id ?? null };
  },
  head: () => ({ meta: [{ title: "ルーム | Animic" }] }),
  component: Room,
});

function Room() {
  const { code, entry, meId } = Route.useLoaderData();
  const router = useRouter();
  const wipe = useWipe();

  if (!entry.room) {
    async function join(name: string) {
      await wipe.buildRoom({
        label: "ルームに参加しています",
        done: "ルームに入りました！",
        sub: `${name} さんとして参加`,
        task: async () => {
          await prepareParticipant();
          await joinRoom({ data: { code, name } });
          return code;
        },
        // 参加したら loader を読み直し、同じURLでロビーを表示する
        navigate: () => router.invalidate(),
      });
    }
    return <EntryFlow mode="join" code={code} onSubmit={join} />;
  }

  return <RoomScreen initial={entry.room} inviteUrl={entry.inviteUrl} meId={meId} />;
}
