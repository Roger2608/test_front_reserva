import { defineConfig, devices } from "@playwright/test";

const e2ePort = process.env.E2E_PORT ?? "3100";
const e2eBaseUrl = `http://localhost:${e2ePort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  expect: { timeout: 15_000 },
  use: { baseURL: e2eBaseUrl, trace: "on-first-retry" },
  webServer: {
    command: `npm run dev -- --port ${e2ePort}`,
    url: e2eBaseUrl,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ]
});
