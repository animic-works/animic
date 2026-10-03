import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

// Storybook用のVite設定。PandaのCSSはルートの postcss.config.cjs で生成する
export default defineConfig({ plugins: [react()] });
