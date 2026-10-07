// 部品のCSSより先に読み込み、@layerの順序を最初に宣言する。
import "../styles/global.css";

import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";

import { Button } from "../components/button";
import { EntryCard, EntryPage } from "../components/entry";
import { Toaster } from "../components/toast";
import { WipeProvider } from "../components/transition";

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
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#ffffff" },
      { title: "Animic" },
    ],
  }),
  component: Root,
  notFoundComponent: () => (
    <EntryPage>
      <EntryCard
        logoSrc="/animic-logo.svg"
        title="ページが見つかりません"
        titleId="not-found-title"
      >
        <Button asChild fullWidth size="lg">
          <a href="/">トップへ戻る</a>
        </Button>
      </EntryCard>
    </EntryPage>
  ),
});

function Root() {
  return (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body>
        {/* 画面遷移の帯はルートに1つだけ置き、画面をまたいで表示する */}
        <WipeProvider logoSrc="/favicon.svg">
          <Outlet />
        </WipeProvider>
        <Toaster />
        <Scripts />
      </body>
    </html>
  );
}
