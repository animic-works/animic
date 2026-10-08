import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useRef } from "react";

import { useWipe } from "../components/transition";
import { EntryFlow } from "../features/room/entry-flow";
import { parseLoginSearch } from "../features/room/entry-login";
import { createRoom } from "../features/room/room.functions";
import { ROOM_CODE_CHARS } from "../features/room/room-state";
import { getCurrentParticipant } from "../lib/auth.functions";

export const Route = createFileRoute("/start")({
  validateSearch: parseLoginSearch,
  loader: () => getCurrentParticipant(),
  head: () => ({ meta: [{ title: "ルームを作る | Animic" }] }),
  component: StartPage,
});

function StartPage() {
  const participant = Route.useLoaderData();
  const { error } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
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
      // ルームを作れるのはログイン中だけで、作成の画面はログインしてから出す。
      task: () => createRoom({ data: { name, requestId } }),
      navigate: (code) => navigate({ to: "/rooms/$code", params: { code } }),
    });
  }

  return (
    <EntryFlow
      mode="create"
      account={participant?.account ?? null}
      loginError={error}
      returnTo="/start"
      onSubmit={create}
      onSignedOut={() => router.invalidate()}
      back={{ href: "/", label: "トップへ戻る" }}
    />
  );
}
