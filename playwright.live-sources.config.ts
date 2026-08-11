// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { defineConfig, devices } from "@playwright/test";

/**
 * External curated-source URL health (request-only).
 *
 * Not part of the default PR e2e suite: third-party hosts are flaky and must
 * not gate merges. Run via `npm run test:e2e:live-sources` or the scheduled
 * GitHub workflow. No app server — probes use Playwright's APIRequestContext.
 */
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: isCI,
  /* One retry in CI softens brief CDN blips; do not mask sustained 4xx/5xx. */
  retries: isCI ? 1 : 0,
  workers: 1,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 120_000,
  grep: /@live-sources/,
  use: {
    ...devices["Desktop Chrome"],
    trace: "on-first-retry",
  },
  projects: [{ name: "live-sources" }],
});
