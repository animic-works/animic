import { Button } from "@animic/react/button";
import { EntryCard, EntryPage } from "@animic/react/entry";
import { Toaster } from "@animic/react/toast";
import { WipeProvider } from "@animic/react/transition";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";

import "../styles/global.css";

export const Route = createRootRoute({
  head: () => ({
    links: [
      // 書体はモックと同じ Google Fonts から読み込む（docs/design.md）
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Zen+Maru+Gothic:wght@500;700;900&family=Zen+Kaku+Gothic+New:wght@500;700&family=Montserrat:ital,wght@1,500&family=JetBrains+Mono:wght@700&display=swap",
      },
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
