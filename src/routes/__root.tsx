import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";

import stylesheet from "@animic/styled-system/styles.css?url";
import { UIProvider, UIScript } from "@animic/react/ui-provider";
import { ToastProvider } from "@animic/react/toast";
import { Page } from "@animic/react/page";
import { Section } from "@animic/react/section";
import { Stack } from "@animic/react/stack";
import { Heading } from "@animic/react/heading";
import { Link } from "@animic/react/link";
import { PageTransitionProvider } from "../features/navigation/page-transition-provider";

export const Route = createRootRoute({
  head: () => ({
    links: [
      { rel: "stylesheet", href: stylesheet },
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
    <Page>
      <main>
        <Section>
          <Stack align="center">
            <Heading level={1} size="lg">
              ページが見つかりません
            </Heading>
            <Link href="/">トップへ戻る</Link>
          </Stack>
        </Section>
      </main>
    </Page>
  ),
});

function Root() {
  return (
    <html lang="ja" id="animic-document" suppressHydrationWarning>
      <head>
        <HeadContent />
        <UIScript />
      </head>
      <body>
        <UIProvider>
          <ToastProvider>
            <PageTransitionProvider>
              <Outlet />
            </PageTransitionProvider>
          </ToastProvider>
        </UIProvider>
        <Scripts />
      </body>
    </html>
  );
}
