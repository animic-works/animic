import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/design-system/browser",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: "list",
  outputDir: "test-results/design-system",
  snapshotPathTemplate: "{testDir}/snapshots/{arg}{ext}",
  use: {
    baseURL: "http://localhost:6006",
    trace: "retain-on-failure",
    locale: "ja-JP",
    colorScheme: "light",
    ...devices["Desktop Chrome"],
    viewport: { width: 1000, height: 900 },
  },
  projects: [{ name: "chromium" }],
  webServer: {
    command: "vp run storybook:build && vp run storybook:preview",
    url: "http://localhost:6006",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
