import { createFileRoute } from "@tanstack/react-router";
import { shareMeta } from "../features/home/share-meta";
import { getOgImage } from "../features/home/home-content.functions";
import { RoomEntry } from "../features/room/room-entry";
import { parseLoginSearch } from "../features/room/entry-login";
import { getCurrentParticipant } from "../lib/auth.functions";
export const Route = createFileRoute("/start")({
  validateSearch: parseLoginSearch,
  loader: async () => {
    const [participant, sharing] = await Promise.all([getCurrentParticipant(), getOgImage()]);
    return { participant, ...sharing };
  },
  headers: () => ({ "Cache-Control": "private, no-store" }),
  head: ({ loaderData }) => ({
    meta: [
      { title: "ルームを作る | Animic" },
      ...(loaderData
        ? shareMeta({ image: loaderData.ogImage, title: "ルームを作る | Animic", path: "/start" })
        : []),
    ],
  }),
  component: function StartPage() {
    const { participant } = Route.useLoaderData();
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
