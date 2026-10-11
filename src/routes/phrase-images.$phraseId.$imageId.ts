import { createFileRoute } from "@tanstack/react-router";

import { servePhraseImage } from "../features/image-generation/phrase-images.server";

export const Route = createFileRoute("/phrase-images/$phraseId/$imageId")({
  server: { handlers: { GET: ({ params }) => servePhraseImage(params) } },
});
