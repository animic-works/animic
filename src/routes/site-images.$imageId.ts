import { createFileRoute } from "@tanstack/react-router";

import { serveSiteImage } from "../features/home/site-images.server";

export const Route = createFileRoute("/site-images/$imageId")({
  server: { handlers: { GET: ({ params }) => serveSiteImage(params) } },
});
