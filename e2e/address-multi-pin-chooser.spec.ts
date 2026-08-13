// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import {
  SYNTHETIC_CONDO_E2E_ADDRESS,
  SYNTHETIC_CONDO_OWNER_A,
  SYNTHETIC_MULTI_E2E_ADDRESS,
  SYNTHETIC_MULTI_PERSONAL_OWNER,
  SYNTHETIC_MULTI_PERSONAL_PIN,
  SYNTHETIC_MULTI_REAL_OWNER,
  SYNTHETIC_MULTI_REAL_PIN,
} from "./fixtures/syntheticCountyData";
import {
  fillStreetAndSubmitSearch,
  streetAddressField,
} from "./helpers/addressLookup";
import { installSyntheticCountyData } from "./helpers/installSyntheticCountyData";

/**
 * Multi-PIN situs chooser (Real + business personal property) and dashboard
 * Switch account type modal. Dedicated suite — not home smoke. Unit coverage
 * lives in `situsMultiPinChooser.test.ts` / `arapahoeSitusLookup.test.ts` /
 * `termAccountTypeBrief.test.ts`.
 */
test("multi-account situs: one typeahead place, then full PIN chooser", async ({
  page,
}) => {
  await installSyntheticCountyData(page);
  await page.goto("/");

  const street = streetAddressField(page);
  await street.fill(SYNTHETIC_MULTI_E2E_ADDRESS);

  const list = page.getByRole("listbox", { name: "Address suggestions" });
  await expect(list).toBeVisible();
  await expect(list.getByRole("option")).toHaveCount(1);
  await expect(list.getByText("80000-1111")).toHaveCount(0);
  await expect(list.getByText("80000-2222")).toHaveCount(0);
  await expect(list.getByText(/80000\b/)).toBeVisible();

  await street.press("Escape");
  await page.getByRole("button", { name: "Search" }).click();

  const chooser = page.getByRole("region", { name: "Matching properties" });
  await expect(chooser).toBeVisible();
  await expect(
    chooser.getByText("2 accounts matched at this address"),
  ).toBeVisible();
  await expect(
    chooser.getByRole("button", {
      name: "What is real property vs. business personal property?",
    }),
  ).toBeVisible();
  await expect(chooser.getByText("80000-1111")).toBeVisible();
  await expect(chooser.getByText("80000-2222")).toBeVisible();

  // Sort contract + reading order via listitem structure (not CSS class or geometry).
  const items = chooser.getByRole("listitem");
  await expect(items).toHaveCount(2);

  const realRow = items.nth(0);
  const personalRow = items.nth(1);
  await expect(realRow).toContainText(SYNTHETIC_MULTI_REAL_OWNER);
  await expect(realRow).toContainText(SYNTHETIC_MULTI_REAL_PIN);
  await expect(realRow.getByText("Real property", { exact: true })).toBeVisible();
  await expect(personalRow).toContainText(SYNTHETIC_MULTI_PERSONAL_OWNER);
  await expect(personalRow).toContainText(SYNTHETIC_MULTI_PERSONAL_PIN);
  await expect(
    personalRow.getByText("Business personal property", { exact: true }),
  ).toBeVisible();
  // Whole-row hit target (no separate Use this property control).
  await expect(
    realRow.getByRole("button", { name: /^Use this property\./ }),
  ).toBeVisible();
  await expect(
    realRow.getByRole("button", { name: "Use this property", exact: true }),
  ).toHaveCount(0);

  await expect(
    chooser.getByRole("link", { name: /county property search/i }),
  ).toBeVisible();
  await expect(
    chooser.getByRole("link", { name: /county business personal property search/i }),
  ).toBeVisible();

  const realRowText = await realRow.innerText();
  expect(realRowText.indexOf(SYNTHETIC_MULTI_REAL_OWNER)).toBeLessThan(
    realRowText.indexOf(SYNTHETIC_MULTI_REAL_PIN),
  );
});

test("business personal property: thin fields, levy stack, notice of valuation", async ({
  page,
}) => {
  await installSyntheticCountyData(page);
  await page.goto("/");

  await fillStreetAndSubmitSearch(page, SYNTHETIC_MULTI_E2E_ADDRESS);

  const chooser = page.getByRole("region", { name: "Matching properties" });
  await expect(chooser).toBeVisible();
  await chooser
    .getByRole("listitem")
    .filter({ hasText: SYNTHETIC_MULTI_PERSONAL_OWNER })
    .getByRole("button", { name: /^Use this property\./ })
    .click();

  await expect(page.locator("#home-levy-stack-subheading")).toBeVisible();
  await expect(
    page.getByLabel("Property search result summary").getByText(
      SYNTHETIC_MULTI_PERSONAL_OWNER,
    ),
  ).toBeVisible();
  await expect(page.locator("#home-parcel-comps-pdf")).toHaveCount(0);
  await expect(page.locator("#home-parcel-notice-of-valuation")).toBeVisible();
  // BPP: Own|Rent and rent pressure do not apply (equipment, not a renter lens).
  await expect(page.getByRole("radio", { name: "Own" })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "Rent" })).toHaveCount(0);
  await expect(page.locator("#home-parcel-rent-tax-pressure")).toHaveCount(0);
  await expect(
    page.getByRole("link", {
      name: /Open county Notice of Valuation PDF for this account/i,
    }),
  ).toHaveAttribute(
    "href",
    "https://personalpropertysearch.arapahoegov.com/FileDownload.ashx?AIN=1000-00-0-00-202",
  );
  await expect(page.locator("#home-parcel-account-type")).toBeVisible();
  await expect(page.locator("#home-parcel-account-type")).toContainText(
    "Switch account type",
  );
  await expect(
    page.getByRole("button", {
      name: /Switch account type\. Currently Business personal property/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: /Open county business personal property record/i,
    }),
  ).toHaveAttribute(
    "href",
    "https://personalpropertysearch.arapahoegov.com/Details.aspx?AIN=1000-00-0-00-202",
  );
  await expect(page.getByText("Photo / Sketch")).toHaveCount(0);
  await expect(page.getByText("Ownership Type")).toHaveCount(0);
  await expect(page.getByText("Neighborhood", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Building" })).toHaveCount(
    0,
  );
  await expect(page.getByRole("columnheader", { name: "Land" })).toHaveCount(0);
  await expect(
    page.getByRole("table", { name: "Appraised and assessed values" }),
  ).toBeVisible();
  await expect(
    page.locator("#home-property-details").getByRole("table", {
      name: "Appraised and assessed values",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /More property details/i }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Jump to property details" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Jump to property details" }),
  ).toContainText("Property details");
  await expect(
    page.getByRole("heading", { name: "Property details cont." }),
  ).toHaveCount(0);
  await expect(page.getByText(/2026 Assessed Value \(26%\)/i)).toBeVisible();
  await expect(
    page
      .getByRole("table", { name: "Appraised and assessed values" })
      .getByRole("row", { name: /2026 Assessed Value \(26%\)/i })
      .getByText("$6,240"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: /County business personal property search/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Open county parcel record/i }),
  ).toHaveCount(0);

  await page
    .getByRole("button", {
      name: /Switch account type\. Currently Business personal property/i,
    })
    .click();
  const switchDialog = page.getByRole("dialog", {
    name: "Other accounts at this address",
  });
  await expect(switchDialog).toBeVisible();
  await expect(
    switchDialog.getByRole("button", {
      name: "What is real property vs. business personal property?",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Matching properties" }),
  ).toHaveCount(0);
  await expect(page.locator("#home-levy-stack-subheading")).toBeVisible();
  await switchDialog
    .getByRole("button", {
      name: /Switch to Real property/i,
    })
    .click();
  await expect(switchDialog).toHaveCount(0);
  await expect(
    page.getByLabel("Property search result summary").getByText(
      SYNTHETIC_MULTI_REAL_OWNER,
    ),
  ).toBeVisible();
  await expect(page.locator("#home-parcel-account-type")).toContainText(
    "Real property",
  );
  await expect(
    page.getByRole("button", {
      name: /Switch account type\. Currently Real property/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Open county parcel record/i }),
  ).toBeVisible();
  // Real again: Own|Rent returns; Rent stays suppressed only while on BPP.
  const ownRadio = page.getByRole("radio", { name: "Own" });
  const rentRadio = page.getByRole("radio", { name: "Rent" });
  await expect(ownRadio).toBeVisible();
  await rentRadio.click();
  await expect(page.locator("#home-parcel-rent-tax-pressure")).toBeVisible();
  await page
    .getByRole("button", {
      name: /Switch account type\. Currently Real property/i,
    })
    .click();
  await page
    .getByRole("dialog", { name: "Other accounts at this address" })
    .getByRole("button", {
      name: /Switch to Business personal property/i,
    })
    .click();
  await expect(page.getByRole("radio", { name: "Own" })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "Rent" })).toHaveCount(0);
  await expect(page.locator("#home-parcel-rent-tax-pressure")).toHaveCount(0);
});

test("dashboard Switch account type: modal stays on report; dismiss and switch", async ({
  page,
}) => {
  await installSyntheticCountyData(page);
  await page.goto("/");

  await fillStreetAndSubmitSearch(page, SYNTHETIC_MULTI_E2E_ADDRESS);
  const chooser = page.getByRole("region", { name: "Matching properties" });
  await expect(chooser).toBeVisible();
  await chooser
    .getByRole("listitem")
    .filter({ hasText: SYNTHETIC_MULTI_REAL_OWNER })
    .getByRole("button", { name: /^Use this property\./ })
    .click();

  await expect(page.locator("#home-levy-stack-subheading")).toBeVisible();
  // Locked report: no Parcel PIN or AIN panel (chooser-only chrome).
  await expect(page.locator("#home-parcel-pin-heading")).toHaveCount(0);

  const switchBtn = page.getByRole("button", {
    name: /Switch account type\. Currently Real property/i,
  });
  await expect(switchBtn).toBeVisible();
  await expect(switchBtn).toHaveAttribute("aria-haspopup", "dialog");
  await expect(switchBtn).toHaveAttribute("aria-expanded", "false");
  // Action button (not a tile shell); no decorative SVG.
  await expect(page.locator("#home-parcel-account-type svg")).toHaveCount(0);
  await expect(page.locator("#home-parcel-account-type")).toHaveRole("button");

  await switchBtn.click();
  const switchDialog = page.getByRole("dialog", {
    name: "Other accounts at this address",
  });
  await expect(switchDialog).toBeVisible();
  await expect(switchBtn).toHaveAttribute("aria-expanded", "true");
  await expect(
    switchDialog.getByRole("button", { name: "Use this property", exact: true }),
  ).toHaveCount(0);
  await expect(
    switchDialog.getByRole("button", { name: /^Use this property\./ }),
  ).toHaveCount(0);
  // Kind labels on rows are plain text; glossary lives in the shared help line.
  await expect(
    switchDialog.getByRole("button", { name: "Real property", exact: true }),
  ).toHaveCount(0);
  await expect(
    switchDialog.getByRole("button", {
      name: "What is real property vs. business personal property?",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Matching properties" }),
  ).toHaveCount(0);
  await expect(page.locator("#home-levy-stack-subheading")).toBeVisible();

  const viewingRow = switchDialog
    .getByRole("listitem")
    .filter({ hasText: SYNTHETIC_MULTI_REAL_OWNER });
  await expect(viewingRow.getByText("Currently viewing")).toBeVisible();
  await expect(
    viewingRow.getByRole("button", { name: /Switch to/i }),
  ).toHaveCount(0);

  const otherRow = switchDialog
    .getByRole("listitem")
    .filter({ hasText: SYNTHETIC_MULTI_PERSONAL_OWNER });
  await expect(
    otherRow.getByRole("button", {
      name: /Switch to Business personal property/i,
    }),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(switchDialog).toHaveCount(0);
  await expect(page.locator("#home-levy-stack-subheading")).toBeVisible();
  await expect(
    page.getByLabel("Property search result summary").getByText(
      SYNTHETIC_MULTI_REAL_OWNER,
    ),
  ).toBeVisible();
  await expect(switchBtn).toHaveAttribute("aria-expanded", "false");

  await switchBtn.click();
  await expect(switchDialog).toBeVisible();
  await switchDialog.getByRole("button", { name: "Close" }).click();
  await expect(switchDialog).toHaveCount(0);
  await expect(page.locator("#home-levy-stack-subheading")).toBeVisible();

  await switchBtn.click();
  await switchDialog
    .getByRole("button", {
      name: /Switch to Business personal property/i,
    })
    .click();
  await expect(switchDialog).toHaveCount(0);
  await expect(
    page.getByLabel("Property search result summary").getByText(
      SYNTHETIC_MULTI_PERSONAL_OWNER,
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /Switch account type\. Currently Business personal property/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Matching properties" }),
  ).toHaveCount(0);
});

test("all-Real multi-unit situs: chooser works; no Switch account type", async ({
  page,
}) => {
  await installSyntheticCountyData(page);
  await page.goto("/");

  await fillStreetAndSubmitSearch(page, SYNTHETIC_CONDO_E2E_ADDRESS);
  const chooser = page.getByRole("region", { name: "Matching properties" });
  await expect(chooser).toBeVisible();
  await expect(chooser.getByRole("listitem")).toHaveCount(2);

  await chooser
    .getByRole("listitem")
    .filter({ hasText: SYNTHETIC_CONDO_OWNER_A })
    .getByRole("button", { name: /^Use this property\./ })
    .click();

  await expect(page.locator("#home-levy-stack-subheading")).toBeVisible();
  await expect(
    page.getByLabel("Property search result summary").getByText(
      SYNTHETIC_CONDO_OWNER_A,
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Switch account type/i }),
  ).toHaveCount(0);
  await expect(page.locator("#home-parcel-account-type")).toHaveCount(0);
});
