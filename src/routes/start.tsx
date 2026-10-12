import { createFileRoute } from "@tanstack/react-router";
import { RoomEntry } from "../features/room/room-entry";
import { parseLoginSearch } from "../features/room/entry-login";
import { getCurrentParticipant } from "../lib/auth.functions";
export const Route = createFileRoute("/start")({
  validateSearch: parseLoginSearch,
  loader: () => getCurrentParticipant(),
  headers: () => ({ "Cache-Control": "private, no-store" }),
  head: () => ({ meta: [{ title: "ルームを作る | Animic" }] }),
  component: function StartPage() {
    const participant = Route.useLoaderData();
    const { error } = Route.useSearch();
    return (
      <RoomEntry
        key={participant?.id ?? "guest"}
        account={participant?.account ?? null}
        loginError={error}
      />
    );
  },
});
