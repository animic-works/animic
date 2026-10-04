import { animicPreset } from "@animic/design-system/preset";
import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  presets: [animicPreset],
  strictTokens: true,
  strictPropertyValues: true,
  preflight: false,
  include: [
    "packages/react/src/**/*.{ts,tsx}",
    "stories/**/*.{ts,tsx}",
    "src/features/*/visuals/**/*.{ts,tsx}",
  ],
  staticCss: {
    recipes: "*",
    patterns: {
      stack: ["*"],
      cluster: ["*"],
      container: ["*"],
      center: ["*"],
      grid: ["*"],
      split: ["*"],
    },
  },
  outdir: "packages/styled-system/generated",
  importMap: "@animic/styled-system",
  prefix: "animic",
  outExtension: "js",
  forceImportExtension: true,
});
