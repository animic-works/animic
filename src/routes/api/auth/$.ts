import { createFileRoute } from "@tanstack/react-router";

import { createAuth } from "../../../lib/auth.server";

async function handleAuth({ request }: { request: Request }) {
  const response = await createAuth().handler(request);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const Route = createFileRoute("/api/auth/$")({
  server: { handlers: { GET: handleAuth, POST: handleAuth } },
});
