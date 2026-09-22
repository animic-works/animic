import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";

import "../styles/global.css";

export const Route = createRootRoute({
  head: () => ({
    links: [
      { rel: "icon", type: "image/x-icon", sizes: "16x16 32x32 48x48", href: "/favicon.ico?v=1" },
      { rel: "icon", type: "image/svg+xml", sizes: "any", href: "/favicon.svg?v=1" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#ffffff" },
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
