import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "packages/react/src/**/*.test.tsx"],
    // 部品のテストはDOMが要るため、ファイルの先頭の @vitest-environment happy-dom で環境を切り替える
  },
});
