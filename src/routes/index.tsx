import { createFileRoute } from "@tanstack/react-router";

import { initialSection } from "../features/home/initial-section";

import { HomePage } from "../features/home/home-page";

const description =
  "お題のイラストをプロンプトで再現する対戦ゲーム。画像を生成して1枚を提出し、再現度を競おう。";

export const Route = createFileRoute("/")({
  head: () => ({
    scripts: [{ children: initialSection }],
    links: [{ rel: "canonical", href: "https://animic.party/" }],
    meta: [
      { name: "description", content: description },
      { property: "og:description", content: description },
      { name: "twitter:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Animic" },
      { property: "og:site_name", content: "Animic" },
      { property: "og:locale", content: "ja_JP" },
      { property: "og:url", content: "https://animic.party/" },
      { property: "og:image", content: "https://animic.party/og-image.png" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Animic" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Animic" },
      { name: "twitter:image", content: "https://animic.party/og-image.png" },
      { name: "twitter:image:alt", content: "Animic" },
    ],
  }),
  component: HomePage,
});
