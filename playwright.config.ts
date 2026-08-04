// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { defineConfig, devices } from "@playwright/test";

/**
 * Browser e2e.
 *
 * Local CLI: reuses this app on :3000 (`localhost`) when already up (`npm run dev`);
 * otherwise starts `next dev`. Playwright IDE: start `npm run dev` yourself first — the
 * extension does not replace that.
 *
 * CI: :3100 + `next start` on 127.0.0.1 after `npm run build` (see workflow). Override with `E2E_PORT`.
 */
const isCI = !!process.env.CI;
const E2E_PORT = Number(process.env.E2E_PORT || (isCI ? 3100 : 3000));
const E2E_HOST = isCI ? "127.0.0.1" : "localhost";
const BASE_URL = `http://${E2E_HOST}:${E2E_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: isCI
      ? `npx next start -H 127.0.0.1 -p ${E2E_PORT}`
      : `npx next dev -H localhost -p ${E2E_PORT}`,
    url: BASE_URL,
    /* Local CLI: attach when this app is already on the port. */
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
