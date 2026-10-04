import { env } from "cloudflare:workers";
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import * as v from "valibot";

import { createAuth } from "./lib/auth.server";
import { roomCodeSchema } from "./features/room/room-state";
import {
  handleScoringWorkerRequest,
  isScoringWorkerRequest,
} from "./features/scoring/scoring-workers.server";
export { Room } from "./features/room/room.server";

const handleStart = createStartHandler(defaultStreamHandler);

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    const match = /^\/rooms\/([^/]+)\/connection$/.exec(url.pathname);
    if (!match) {
      // 採点ワーカーはCookieを使わずBearerで認証するため、ブラウザ向けのCSRF対策を通さない。
      const response = isScoringWorkerRequest(url)
        ? await handleScoringWorkerRequest(request)
        : await handleStart(request);
      if (url.hostname === "animic.party" && url.pathname === "/") return response;
      const headers = new Headers(response.headers);
      headers.set("X-Robots-Tag", "noindex");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    if (request.headers.get("Origin") !== new URL(env.BETTER_AUTH_URL).origin)
      return new Response(null, { status: 403 });
    const code = v.safeParse(roomCodeSchema, match[1]);
    if (!code.success) return new Response(null, { status: 404 });
    const current = await createAuth().api.getSession({
      headers: request.headers,
      query: { disableRefresh: true },
    });
    if (!current) return new Response(null, { status: 401 });
    const headers = new Headers(request.headers);
    headers.set("X-Animic-Participant", current.user.id);
    headers.set("X-Animic-Session", current.session.id);
    headers.set("X-Animic-Expires", String(current.session.expiresAt.getTime()));
    return env.ROOMS.getByName(code.output).fetch(new Request(request, { headers }));
  },
};
