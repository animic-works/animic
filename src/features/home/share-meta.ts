import { ogImageSize } from "./home-content";

/** SNS共有用。検索向けのdescriptionやタブのタイトルとは別に指定する。 */
export function shareMeta({
  title = "Animic",
  description = "お題のイラストを、プロンプトだけでAIに再現させよう。より近い1枚を作ったほうが勝ち！",
  path = "/",
  image,
}: {
  title?: string;
  description?: string;
  path?: string;
  image: string | null;
}) {
  const origin = "https://animic.party";
  const ogImage = `${origin}${image ?? "/og-image.png"}`;
  return [
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:site_name", content: "Animic" },
    { property: "og:locale", content: "ja_JP" },
    { property: "og:url", content: `${origin}${path}` },
    { property: "og:image", content: ogImage },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:width", content: String(ogImageSize.width) },
    { property: "og:image:height", content: String(ogImageSize.height) },
    { property: "og:image:alt", content: "Animic" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
    { name: "twitter:image:alt", content: "Animic" },
  ];
}
