import type { StorybookConfig } from "@storybook/react-vite";

// 部品の状態の一覧（UI State Catalog）。@animic/react の部品をデザインシステムのCSSで表示する
const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-vite",
    // アプリのVite設定（CloudflareやTanStack Startのプラグイン）は読み込まず、部品の表示に要る設定だけを使う
    options: { builder: { viteConfigPath: ".storybook/vite.config.ts" } },
  },
  stories: ["../packages/react/src/**/*.stories.tsx"],
  addons: ["@storybook/addon-a11y"],
  // 利用状況の送信はしない
  core: { disableTelemetry: true },
};

export default config;
