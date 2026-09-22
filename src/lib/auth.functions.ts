import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";

import { createAuth } from "./auth.server";

export const getCurrentParticipant = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeader("Cache-Control", "private, no-store");
  const result = await createAuth().api.getSession({ headers: getRequestHeaders() });
  return result ? { id: result.user.id, isAnonymous: result.user.isAnonymous ?? false } : null;
});
