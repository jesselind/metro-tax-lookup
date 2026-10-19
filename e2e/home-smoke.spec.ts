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
  await expect(
    page.getByRole("radiogroup", {
      name: "I own or I rent",
    }),
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: "I Own" })).toBeChecked();
  await expect(
    page.getByRole("radiogroup", { name: "Select your Colorado county" }),
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: "Arapahoe" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Douglas" })).toBeVisible();
  await expect(
    page.getByRole("radio", { name: "I don't know my county" }),
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: "I don't know my county" })).toHaveText(
    "?",
  );
  await expect(page.getByRole("form", { name: "Address lookup" })).toBeVisible();
  const street = streetAddressField(page);
  await expect(street).toBeVisible();
  // Typeahead uses role=combobox; keep this so CI catches a silent textbox regression.
  await expect(street).toHaveRole("combobox");
  await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Try demo property" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Two numbers raise your property taxes",
      level: 2,
    }),
  ).toBeVisible();
  await expect(page.getByText("Property value", { exact: true })).toBeVisible();
  await expect(page.getByText("Everyone on your tax bill, added up")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "From appraised value to a tax bill",
      level: 3,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Here's a sample property to show how this works.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Colorado sets two assessment rates",
      level: 4,
    }),
  ).toBeVisible();
  await expect(page.getByText("6.8%", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("7.05%", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: /Colorado Division of Property Taxation: Assessed Value/,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "The county appraises your property",
      level: 4,
    }),
  ).toBeVisible();
  await expect(page.getByText("$500,000", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Appraised value becomes two assessed values",
      level: 4,
    }),
  ).toBeVisible();
  await expect(page.getByText("$34,000", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("$35,250", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Mills and the mill levy",
      level: 4,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "School mills use school assessed value",
      level: 4,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Other districts use local assessed value",
      level: 4,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Add the pieces for the tax bill",
      level: 4,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: /School District \$1,410.*Fire \$510/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("$1,410 + $850 + $510 + $680 = $3,450", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Supported Colorado counties")).toHaveCount(0);

  // Campaign disclosure follows SITE_CONFIG; forks that clear values must not
  // assert hardcoded Jesse-Lind copy. Outline control lives in the site footer.
  const campaignUrl = SITE_CONFIG.campaignSiteUrl?.trim() || null;
  const homeDisclosureLabel =
    SITE_CONFIG.campaignHomeDisclosureLabel?.trim() || null;
  const paidForBy = SITE_CONFIG.campaignPaidForByDisclaimer?.trim() || null;

  if (campaignUrl && homeDisclosureLabel) {
    await expect(
      page.locator("footer").getByRole("link", { name: homeDisclosureLabel }),
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

