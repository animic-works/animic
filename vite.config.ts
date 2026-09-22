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
  ],
  server: { port: 3000, strictPort: true },
  lint: {
    plugins: ["typescript", "unicorn", "oxc", "react", "promise", "import"],
    categories: { correctness: "error", suspicious: "error" },
    options: { typeAware: true, typeCheck: true },
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
    ignorePatterns: ["**/routeTree.gen.ts", "worker-configuration.d.ts"],
  },
  fmt: {
    singleQuote: false,
    semi: true,
    sortPackageJson: true,
    ignorePatterns: ["src/routeTree.gen.ts", "worker-configuration.d.ts"],
  },
  staged: {
    "*.{js,ts,jsx,tsx,json,jsonc,css,md,yml,yaml}": "vp check --fix",
  },
});
