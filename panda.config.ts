import { defineConfig } from "@pandacss/dev";

import { animicPreset } from "./packages/design-system/src/preset";

// Animicのデザインシステム（packages/design-system）から、型付きのスタイルの道具（@animic/styled-system）を生成する。
// 生成物は packages/styled-system/dist に出し、手で編集しない
export default defineConfig({
  // preset-baseはユーティリティ・条件・基本のパターンだけを持ち、色や大きさのトークンは持たない。値はAnimicのプリセットだけにする
  presets: ["@pandacss/preset-base", animicPreset],
  include: ["./packages/react/src/**/*.{ts,tsx}"],
  exclude: ["**/*.test.{ts,tsx}", "**/*.stories.{ts,tsx}"],
  outdir: "packages/styled-system/dist",
  importMap: "@animic/styled-system",
  outExtension: "js",
  preflight: true,
  // デザインシステムにない値（13px・#ff00ffなど）を型で拒否する
  strictTokens: true,
  strictPropertyValues: true,
  validation: "error",
  // 部品は変種を実行時に選ぶため、すべての変種のCSSを出しておく
  // レイアウトの部品も間隔などを実行時に受け取るため、パターンの値をすべて出しておく
  staticCss: {
    recipes: "*",
    patterns: {
      stack: ["*"],
      cluster: ["*"],
      container: ["*"],
      center: ["*"],
      grid: ["*", { properties: { columns: [1, 2, 3, 4, 6] } }],
    },
  },
});
