// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import { streetAddressField } from "./helpers/addressLookup";

/**
 * Landing smoke: SSR controls are present. No client flow beyond visibility.
 */
test("home shows address lookup and Try demo", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Civic Lookup", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("form", { name: "Address lookup" })).toBeVisible();
  const street = streetAddressField(page);
  await expect(street).toBeVisible();
  // Typeahead uses role=combobox; keep this so CI catches a silent textbox regression.
  await expect(street).toHaveRole("combobox");
  await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Try demo property" }),
  ).toBeVisible();
  // Campaign disclosure (SITE_CONFIG.campaign*); forks that clear campaignSiteUrl must drop this assert.
  await expect(
    page.getByRole("link", {
      name: /Built by Jesse Lind for his Arapahoe County Assessor campaign/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Paid for by Jesse Lind for Assessor. Registered agent: Jesse Lind.",
    ),
  ).toBeVisible();
});
