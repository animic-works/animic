import { createFileRoute } from "@tanstack/react-router";

import { initialAccountHint } from "../features/home/account-hint";
import { initialSection } from "../features/home/initial-section";

import { getHomeContent } from "../features/home/home-content.functions";
import { HomePage } from "../features/home/home-page";
import { ogImageSize } from "../features/home/home-content";

const description =
  "お題のイラストをAI画像生成で再現し、どれだけ似せられたかを友だちと競うプロンプト対戦ゲーム";
const title = "Animic | その一枚に、どこまで近づける？";
const origin = "https://animic.party";

export const Route = createFileRoute("/")({
  loader: () => getHomeContent(),
  head: ({ loaderData }) => {
    // 管理画面で登録したOGP画像があればそれを、なければ`public/og-image.png`を出す。
    const ogImage = `${origin}${loaderData?.ogImage ?? "/og-image.png"}`;
    return {
      scripts: [
        { children: initialSection },
        { children: initialAccountHint },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Animic",
            url: `${origin}/`,
            description,
            inLanguage: "ja",
          }),
        },
      ],
      links: [
        { rel: "canonical", href: `${origin}/` },
        { rel: "preload", as: "image", href: "/images/hero-character.webp", fetchPriority: "high" },
      ],
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:description", content: description },
        { name: "twitter:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:site_name", content: "Animic" },
        { property: "og:locale", content: "ja_JP" },
        { property: "og:url", content: "https://animic.party/" },
        { property: "og:image", content: ogImage },
        { property: "og:image:type", content: "image/png" },
        { property: "og:image:width", content: String(ogImageSize.width) },
        { property: "og:image:height", content: String(ogImageSize.height) },
        { property: "og:image:alt", content: "Animic" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:image", content: ogImage },
        { name: "twitter:image:alt", content: "Animic" },
      ],
    };
  },
  component: Home,
});

function Home() {
  return <HomePage content={Route.useLoaderData()} />;
}
