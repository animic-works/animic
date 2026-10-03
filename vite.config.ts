import { fileURLToPath } from "node:url";

import babel from "@rolldown/plugin-babel";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";

import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
      persistState: process.env.ANIMIC_E2E === "true" ? { path: ".wrangler/e2e" } : true,
    }),
    tanstackStart(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    process.env.ANIMIC_E2E === "true" && {
      name: "animic-e2e-api-client",
      apply: "build",
      applyToEnvironment: (environment) => environment.name === "client",
      enforce: "pre",
      transform(code, id) {
        if (id !== fileURLToPath(new URL("./src/routes/__root.tsx", import.meta.url))) return null;
        // クライアントの単一エントリーを保ち、検証時だけAPI操作用モジュールを読み込む。
        const fixture = fileURLToPath(new URL("./tests/fixtures/api-client.ts", import.meta.url));
        return { code: `${code}\nvoid import(${JSON.stringify(fixture)});`, map: null };
      },
    },
  ],
  server: { port: 3000, strictPort: true },
  lint: {
    plugins: ["typescript", "unicorn", "oxc", "react", "promise", "import"],
    categories: { correctness: "error", suspicious: "error" },
    options: { typeAware: true, typeCheck: false },
    rules: {
      "typescript/no-unnecessary-type-assertion": "error",
      "typescript/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "typescript/no-unnecessary-boolean-literal-compare": "error",
      "typescript/no-unnecessary-template-expression": "error",
      "typescript/no-unnecessary-type-arguments": "error",
      "typescript/no-unsafe-enum-comparison": "error",
      "typescript/no-confusing-non-null-assertion": "error",
      "typescript/no-non-null-asserted-nullish-coalescing": "error",
      "typescript/no-import-type-side-effects": "error",
      "typescript/use-unknown-in-catch-callback-variable": "error",
      "typescript/no-floating-promises": "error",
      "typescript/await-thenable": "error",
      "eslint/no-shadow": "error",
      "eslint/no-unneeded-ternary": "error",
      "eslint/prefer-const": "error",
      "eslint/preserve-caught-error": "error",
      "eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "promise/no-multiple-resolved": "error",
      "react/button-has-type": "error",
      "react/jsx-no-script-url": "error",
      "react/react-in-jsx-scope": "off",
      "unicorn/prefer-node-protocol": "error",
      "oxc/no-barrel-file": ["error", { threshold: 1 }],
      "import/no-cycle": "error",
      "import/no-unassigned-import": "off",
    },
    overrides: [
      {
        // 画面側（src/）はデザインシステムを組み合わせるだけにし、見た目を定義しない（docs/design-system.md）
        files: ["src/**/*.{ts,tsx}"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                {
                  group: ["@ark-ui/*"],
                  message:
                    "Ark UIは@animic/reactの中でだけ使います。@animic/reactの部品を使ってください。",
                },
                {
                  group: ["@animic/styled-system", "@animic/styled-system/*", "@pandacss/*"],
                  message: "画面側でスタイルを書かず、@animic/reactの部品を組み合わせてください。",
                },
                {
                  group: ["*.module.css"],
                  message:
                    "画面ごとのCSSは作りません。足りない表現はデザインシステムへの追加を検討してください。",
                },
              ],
            },
          ],
          "react/forbid-dom-props": ["error", { forbid: ["style"] }],
          "react/forbid-component-props": ["error", { forbid: ["className", "style"] }],
        },
      },
    ],
    ignorePatterns: [
      "**/routeTree.gen.ts",
      "worker-configuration.d.ts",
      "packages/styled-system/dist/**",
      "mock/**",
    ],
  },
  fmt: {
    singleQuote: false,
    semi: true,
    sortPackageJson: true,
    ignorePatterns: ["src/routeTree.gen.ts", "worker-configuration.d.ts", "mock/**", ".claude/**"],
  },
  staged: {
    "*.{js,ts,jsx,tsx,json,jsonc,css,md,yml,yaml}": "vp check --fix",
  },
});
