import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    // LPの表示位置はハッシュで管理し、保存した座標と競合させない。
    scrollRestoration: ({ location }) => location.pathname !== "/",
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
