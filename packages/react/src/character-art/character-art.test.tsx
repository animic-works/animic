// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { ART_TOPIC, CharacterArt, artFromPrompt, decodeArt, encodeArt } from "./character-art";

afterEach(cleanup);

describe("CharacterArt", () => {
  it("プロンプトの言葉（文章・タグ）から特徴を読み取り、書かれていない特徴は同じ種で同じ結果になる", () => {
    const a = artFromPrompt("金髪でボブ、赤い目、パーカー", "seed");
    expect(a.features).toMatchObject({
      hair: "blonde",
      style: "bob",
      eyes: "red",
      outfit: "hoodie",
    });
    expect(a.matched).toEqual(["hair", "style", "eyes", "outfit"]);
    expect(artFromPrompt("金髪でボブ、赤い目、パーカー", "seed").features).toEqual(a.features);
    expect(artFromPrompt("1girl, silver hair, twintails", "x").features).toMatchObject({
      hair: "silver",
      style: "twin",
    });
  });

  it("特徴を文字列にして戻せ、知らない値はお題の特徴にする", () => {
    expect(decodeArt(encodeArt(ART_TOPIC))).toEqual(ART_TOPIC);
    expect(decodeArt("blonde.unknown")).toEqual({ ...ART_TOPIC, hair: "blonde" });
    expect(decodeArt(null)).toEqual(ART_TOPIC);
  });

  it("説明付きの画像として描く", () => {
    render(<CharacterArt features={ART_TOPIC} label="お題のイラスト" />);
    expect(screen.getByRole("img", { name: "お題のイラスト" }).tagName.toLowerCase()).toBe("svg");
  });
});
