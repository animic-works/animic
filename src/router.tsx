import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    // DiscordのproxyはHTTP転送を内部で追うため、起動URLのままSSRとクライアントを一致させる。
    rewrite: {
      input: ({ url }) => {
        if (
          url.pathname === "/" &&
          url.searchParams.has("frame_id") &&
          url.searchParams.has("instance_id")
        )
          url.pathname = "/activity";
        return url;
      },
      output: ({ url }) => {
        if (
          url.pathname === "/activity" &&
          url.searchParams.has("frame_id") &&
          url.searchParams.has("instance_id")
        )
          url.pathname = "/";
        return url;
      },
    },
    // LPの表示位置はハッシュで管理し、保存した座標と競合させない。
    scrollRestoration: ({ location }) => location.pathname !== "/",
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
