import { renderToStaticMarkup } from "react-dom/server";
import { env } from "cloudflare:workers";

import { CharacterArt, artFromPrompt, decodeArt, encodeArt } from "@animic/react/character-art";

// 画像生成サービスをつなぐまでの仮の生成。プロンプトの言葉から決めた挿絵を、このアプリのURLで配信する
export function placeholderImageUrl(prompt: string, seed: string) {
  const { features } = artFromPrompt(prompt, seed);
  return new URL(`/art/${encodeArt(features)}.svg`, env.BETTER_AUTH_URL).href;
}

// 挿絵のSVG。specは encodeArt の文字列（例: pink.twin.blue.sailor.smile.white）
export function renderPlaceholderArt(spec: string) {
  const features = decodeArt(spec.replace(/\.svg$/, ""));
  return `<?xml version="1.0" encoding="UTF-8"?>${renderToStaticMarkup(
    <CharacterArt features={features} label="生成した画像" />,
  )}`;
}
