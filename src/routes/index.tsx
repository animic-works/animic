import { createFileRoute } from "@tanstack/react-router";

import { initialSection } from "../features/home/initial-section";

import { getHomeContent } from "../features/home/home-content.functions";
import { HomePage } from "../features/home/home-page";
import { shareMeta } from "../features/home/share-meta";

const description =
  "お題のイラストをAI画像生成で再現し、どれだけ似せられたかを友だちと競うプロンプト対戦ゲーム";
const title = "Animic | その一枚に、どこまで近づける？";
const origin = "https://animic.party";

export const Route = createFileRoute("/")({
  loader: () => getHomeContent(),
  head: ({ loaderData }) => {
    return {
      scripts: [
        { children: initialSection },
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
        ...(loaderData ? shareMeta({ image: loaderData.ogImage }) : []),
      ],
    };
  },
  component: Home,
});

function Home() {
  return <HomePage content={Route.useLoaderData()} />;
}
