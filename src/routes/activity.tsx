import { createFileRoute } from "@tanstack/react-router";
import { getDiscordActivityConfig } from "../features/room/discord-room.functions";
import { DiscordRoomPage } from "../features/room/discord-room-page";

export const Route = createFileRoute("/activity")({
  loader: () => getDiscordActivityConfig(),
  headers: () => ({ "Cache-Control": "private, no-store" }),
  head: () => ({ meta: [{ title: "Animic | Discord" }, { name: "robots", content: "noindex" }] }),
  component: function ActivityRoute() {
    const config = Route.useLoaderData();
    return <DiscordRoomPage clientId={config?.clientId ?? null} />;
  },
});
