import { createFileRoute } from "@tanstack/react-router";

import { serveGeneratedImage } from "../features/image-generation/generated-images.server";

export const Route = createFileRoute("/generated-images/$battleId/$generationId")({
  server: { handlers: { GET: ({ params }) => serveGeneratedImage(params) } },
});
