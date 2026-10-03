import { useWipe } from "@animic/react/transition";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";

import { EntryFlow } from "../../features/room/entry-flow";
import { createRoom } from "../../features/room/room.functions";
import { prepareParticipant } from "../../lib/participant";

export const Route = createFileRoute("/rooms/new")({
  head: () => ({ meta: [{ title: "ルームを作る | Animic" }] }),
  component: NewRoom,
});

function NewRoom() {
  const navigate = useNavigate();
  const wipe = useWipe();
  // 同じ表示名での再送には同じ要求IDを使い、ルームを二重に作らない
  const request = useRef<{ name: string; id: string } | null>(null);

  async function create(name: string) {
    if (request.current?.name !== name) request.current = { name, id: crypto.randomUUID() };
    const requestId = request.current.id;
    await wipe.buildRoom({
      label: "ルームを作っています",
      done: "ルームができました！",
      sub: "このコードを相手に伝えよう",
      task: async () => {
        await prepareParticipant();
        return createRoom({ data: { name, requestId } });
      },
      navigate: (code) => navigate({ to: "/rooms/$code", params: { code } }),
    });
  }

  return <EntryFlow mode="create" onSubmit={create} />;
}
