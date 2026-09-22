import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";

import "../styles/global.css";

export const Route = createRootRoute({
  head: () => ({
    links: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Animic" },
      { name: "description", content: "お題のイラストをAIで再現する対戦ゲーム。" },
    ],
  }),
  component: Root,
  notFoundComponent: () => (
    <main>
      <h1>ページが見つかりません</h1>
      <a href="/">トップへ戻る</a>
    </main>
  ),
});

function Root() {
  return (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
