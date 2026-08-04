// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import { CHANGELOG_ENTRIES } from "../src/content/changelog";
import packageJson from "../package.json";

const APP_VERSION = packageJson.version;
const newest = CHANGELOG_ENTRIES[0]!;

test("changelog page shows current version and release content", async ({
  page,
}) => {
  await page.goto("/changelog");

  await expect(
    page.getByRole("heading", { name: "Changelog", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: new RegExp(`^${APP_VERSION}\\b`),
      level: 2,
    }),
  ).toBeVisible();
  await expect(page.getByText(newest.title, { exact: true })).toBeVisible();
  await expect(
    page.getByText(newest.highlights[0]!, { exact: true }),
  ).toBeVisible();
});

test("footer version link navigates to changelog", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: APP_VERSION, exact: true })
    .click();

  await expect(page).toHaveURL(/\/changelog\/?$/);
  await expect(
    page.getByRole("heading", { name: "Changelog", level: 1 }),
  ).toBeVisible();
});

test("footer Changelog link navigates to changelog", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("contentinfo")
    .getByRole("navigation", { name: "Footer" })
    .getByRole("link", { name: "Changelog", exact: true })
    .click();

  await expect(page).toHaveURL(/\/changelog\/?$/);
  await expect(
    page.getByRole("heading", { name: "Changelog", level: 1 }),
  ).toBeVisible();
});
