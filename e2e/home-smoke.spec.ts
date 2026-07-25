// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";

/**
 * Landing smoke: SSR controls are present. No client flow beyond visibility.
 */
test("home shows address lookup and Try demo", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Civic Lookup", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("form", { name: "Address lookup" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Street address" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Try demo property" }),
  ).toBeVisible();
});
