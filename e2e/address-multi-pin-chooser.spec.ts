// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import {
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
 * Multi-PIN situs chooser (Real + business personal property).
 * Dedicated suite — not home smoke. Unit coverage lives in
 * `situsMultiPinChooser.test.ts` / `arapahoeSitusLookup.test.ts`.
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
    chooser.getByRole("button", { name: "Real property" }),
  ).toBeVisible();
  await expect(
    chooser.getByRole("button", { name: "Business personal property" }),
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
  await expect(personalRow).toContainText(SYNTHETIC_MULTI_PERSONAL_OWNER);
  await expect(personalRow).toContainText(SYNTHETIC_MULTI_PERSONAL_PIN);

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
    .getByRole("button", { name: "Use this property" })
    .click();

  await expect(page.locator("#home-levy-stack-subheading")).toBeVisible();
  await expect(
    page.getByLabel("Property search result summary").getByText(
      SYNTHETIC_MULTI_PERSONAL_OWNER,
    ),
  ).toBeVisible();
  await expect(page.locator("#home-parcel-comps-pdf")).toHaveCount(0);
  await expect(page.locator("#home-parcel-notice-of-valuation")).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: /Open county Notice of Valuation PDF for this account/i,
    }),
  ).toHaveAttribute(
    "href",
    "https://personalpropertysearch.arapahoegov.com/FileDownload.ashx?AIN=1000-00-0-00-202",
  );
  await expect(page.locator("#home-parcel-account-type")).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /Account type:.*Change account at this address/i,
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
      name: /Account type:.*Change account at this address/i,
    })
    .click();
  const switchChooser = page.getByRole("region", { name: "Matching properties" });
  await expect(switchChooser).toBeVisible();
  await switchChooser
    .getByRole("listitem")
    .filter({ hasText: SYNTHETIC_MULTI_REAL_OWNER })
    .getByRole("button", { name: "Use this property" })
    .click();
  await expect(
    page.getByLabel("Property search result summary").getByText(
      SYNTHETIC_MULTI_REAL_OWNER,
    ),
  ).toBeVisible();
  await expect(page.locator("#home-parcel-account-type")).toContainText(
    "Real property",
  );
  await expect(
    page.getByRole("link", { name: /Open county parcel record/i }),
  ).toBeVisible();
});
