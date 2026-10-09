import { defineConfig } from "vite-plus";
import babel from "@rolldown/plugin-babel";
import { reactCompilerPreset } from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [babel({ presets: [reactCompilerPreset()] })],
  build: { reportCompressedSize: false },
});
