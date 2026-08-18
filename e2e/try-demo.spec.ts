// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import { buildMissingParcelDataMailtoHref } from "../src/lib/contact";
import {
  DEMO_AIN,
  DEMO_DISPLAY_PIN,
  DEMO_OWNER_LIST,
} from "../src/lib/demoProperty";
import { PARCEL_RECORD_NO_DATA } from "../src/lib/parcelRecordNoData";
import { MILL_LEVY_TILE_ID } from "../src/content/millLevySummaryCopy";
import { COUNTY_PRIOR_YEAR_VALUES_TILE_STATUS } from "../src/content/countyPriorYearValuesGapNote";

/**
 * Try demo: PIN-less fixture → levy stack + property details + missing-data mailto.
 * Linear user flow; Playwright auto-waits on expect(...).toBeVisible().
 */
test.describe("Try demo property", () => {
  test("shows levy stack and property details", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Try demo property" }).click();

    await expect(page.locator("#home-levy-stack-subheading")).toBeVisible();
    await expect(page.locator(`#${MILL_LEVY_TILE_ID}`)).toBeVisible();
    await expect(
      page.getByRole("button", { name: COUNTY_PRIOR_YEAR_VALUES_TILE_STATUS }),
    ).toBeVisible();
    await page.locator("#summary-mill-levy-term-first").click();
    await expect(
      page.getByText(/For example, your total mill levy of/),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /Jump to mill levy tiles/i }).click();
    await expect(page.locator("#home-levy-stack-subheading")).toBeFocused();
    await expect(page.locator("#home-levy-stack-tiles")).toHaveAttribute(
      "data-arrive",
      "",
    );
    await expect(
      page.getByRole("region", { name: "Property tax breakdown" }),
    ).toBeVisible();
    await expect(page.locator("#parcel-record-heading")).toBeVisible();
    const details = page.locator("#home-property-details");
    await expect(
      details.getByText(DEMO_OWNER_LIST, {
        exact: true,
      }),
    ).toBeVisible();
    // Fictional neighborhood from src/data/demo-property.json (not a GIS join).
    await expect(
      details.getByText("EXAMPLE NEIGHBORHOOD", { exact: true }),
    ).toBeVisible();
    await expect(details.getByText("9999", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Open county parcel record" }),
    ).toBeDisabled();
  });

  test("missing-data mailto includes field, demo PIN, and AIN", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Try demo property" }).click();
    await expect(page.locator("#parcel-record-heading")).toBeVisible();

    // Subdivision Code stays empty in the demo fixture; Neighborhood is filled.
    await page
      .locator("#home-property-details")
      .getByRole("button", {
        name: `${PARCEL_RECORD_NO_DATA} for Subdivision Code. Open for details and how to report it.`,
      })
      .click();

    await expect(
      page.getByRole("link", { name: "Email us about this missing field" }),
    ).toHaveAttribute(
      "href",
      buildMissingParcelDataMailtoHref({
        fieldLabel: "Subdivision Code",
        pin: DEMO_DISPLAY_PIN,
        ain: DEMO_AIN,
      }),
    );
  });
});
