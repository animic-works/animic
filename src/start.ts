import { env } from "cloudflare:workers";
import { discordActivityOrigin } from "./lib/discord-activity";
import { createCsrfMiddleware, createStart, createServerOnlyFn } from "@tanstack/react-start";

const trustedOrigin = createServerOnlyFn((origin: string) =>
  [new URL(env.BETTER_AUTH_URL).origin, discordActivityOrigin(env.DISCORD_CLIENT_ID)].includes(
    origin,
  ),
);

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCsrfMiddleware({
      origin: trustedOrigin,
      filter: (ctx) =>
        ctx.handlerType === "serverFn" || !["GET", "HEAD", "OPTIONS"].includes(ctx.request.method),
    }),
  ],
}));
