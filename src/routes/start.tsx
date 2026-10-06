import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createClientOnlyFn } from "@tanstack/react-start";
import { useRef } from "react";

import { useWipe } from "../components/transition";
import { EntryFlow } from "../features/room/entry-flow";
import { createRoom } from "../features/room/room.functions";
import { ROOM_CODE_CHARS } from "../features/room/room-state";
import { ensureParticipant } from "../lib/auth.client";

// 匿名セッションの準備はブラウザ専用のため、サーバーのバンドルから外す。
const ensureParticipantOnClient = createClientOnlyFn(ensureParticipant);

export const Route = createFileRoute("/start")({
  head: () => ({ meta: [{ title: "ルームを作る | Animic" }] }),
  component: StartPage,
});

function StartPage() {
  const navigate = useNavigate();
  const wipe = useWipe();
  // 同じ表示名での再送には同じ要求IDを使い、ルームを二重に作らない。
  const request = useRef<{ name: string; id: string } | null>(null);

  async function create(name: string) {
    if (request.current?.name !== name) request.current = { name, id: crypto.randomUUID() };
    const requestId = request.current.id;
    await wipe.buildRoom({
      label: "ルームを作っています",
      done: "ルームができました！",
      sub: "このコードを相手に伝えよう",
      codeCharacters: ROOM_CODE_CHARS,
      codeLength: 8,
      task: async () => {
        await ensureParticipantOnClient();
        return createRoom({ data: { name, requestId } });
      },
      navigate: (code) => navigate({ to: "/rooms/$code", params: { code } }),
    });
  }

  return <EntryFlow mode="create" onSubmit={create} back={{ href: "/", label: "トップへ戻る" }} />;
}
