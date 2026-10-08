import { createFileRoute } from "@tanstack/react-router";

import { serveTopicImage } from "../features/battle/topic-images.server";

export const Route = createFileRoute("/topic-images/$topicId/$imageId")({
  server: { handlers: { GET: ({ params }) => serveTopicImage(params) } },
});
