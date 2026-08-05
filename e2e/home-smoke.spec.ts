// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import { SITE_CONFIG } from "../src/lib/siteConfig";
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

  // Campaign disclosure follows SITE_CONFIG; forks that clear values must not
  // assert hardcoded Jesse-Lind copy.
  const campaignUrl = SITE_CONFIG.campaignSiteUrl?.trim() || null;
  const homeDisclosureLabel =
    SITE_CONFIG.campaignHomeDisclosureLabel?.trim() || null;
  const paidForBy = SITE_CONFIG.campaignPaidForByDisclaimer?.trim() || null;

  if (campaignUrl && homeDisclosureLabel) {
    await expect(
      page.getByRole("link", { name: homeDisclosureLabel }),
    ).toBeVisible();
  } else if (homeDisclosureLabel) {
    await expect(
      page.getByRole("link", { name: homeDisclosureLabel }),
    ).toHaveCount(0);
  }

  if (paidForBy) {
    await expect(page.getByText(paidForBy)).toBeVisible();
  } else {
    await expect(page.locator("footer").getByText(/Paid for by/i)).toHaveCount(
      0,
    );
  }
});

