import { randomBytes } from "node:crypto";

import { defineConfig, devices } from "@playwright/test";

import { e2eAdminPassword } from "./tests/e2e/admin-password";
import { fakeNovelAiUrl } from "./tests/e2e/fake-novelai";
import { e2eNovelAiToken } from "./tests/e2e/novelai-token";
import { e2eOAuthClients } from "./tests/e2e/oauth-clients";

export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  // Wranglerからも同じローカルSQLiteを操作するため、テスト間のDB操作を競合させない。
  workers: 1,
  // 画像の生成は偽のNovelAIへ送る。実際のNovelAIへは通信しない。
  globalSetup: "./tests/e2e/fake-novelai.ts",
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
      ADMIN_PASSWORD: e2eAdminPassword,
      NOVELAI_API_TOKEN: e2eNovelAiToken,
      NOVELAI_API_URL: fakeNovelAiUrl,
      GOOGLE_CLIENT_ID: e2eOAuthClients.google.id,
      GOOGLE_CLIENT_SECRET: e2eOAuthClients.google.secret,
      DISCORD_CLIENT_ID: e2eOAuthClients.discord.id,
      DISCORD_CLIENT_SECRET: e2eOAuthClients.discord.secret,
    },
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
