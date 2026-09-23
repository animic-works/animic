import { randomBytes } from "node:crypto";

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  // Wranglerからも同じローカルSQLiteを操作するため、テスト間のDB操作を競合させない。
  workers: 1,
  use: {
    channel: "chromium",
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: [
      "node -e \"require('node:fs').rmSync('.wrangler/e2e', { recursive: true, force: true })\"",
      "vp run build",
      "vp run db:migrate:local --persist-to .wrangler/e2e",
      "vp preview --host 127.0.0.1 --port 4173 --strictPort",
    ].join(" && "),
    env: {
      ANIMIC_E2E: "true",
      // Hostを切り替え、本番と非本番の検索設定をローカルで検証する。
      __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS:
        "animic.party,animic.example.workers.dev,dev.animic.party",
      BETTER_AUTH_URL: "http://127.0.0.1:4173",
      BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
    },
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
