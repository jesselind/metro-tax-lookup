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

/**
 * Try demo: PIN-less fixture → levy stack + property details + missing-data mailto.
 * Linear user flow; Playwright auto-waits on expect(...).toBeVisible().
 */
test.describe("Try demo property", () => {
  test("shows levy stack and property details", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Try demo property" }).click();

    await expect(page.locator("#home-levy-stack-subheading")).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Property tax breakdown" }),
    ).toBeVisible();
    await expect(page.locator("#parcel-record-heading")).toBeVisible();
    await expect(
      page.locator("#home-property-details").getByText(DEMO_OWNER_LIST, {
        exact: true,
      }),
    ).toBeVisible();
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

    await page
      .locator("#home-property-details")
      .getByRole("button", {
        name: `${PARCEL_RECORD_NO_DATA} for Neighborhood. Open for details and how to report it.`,
      })
      .click();

    await expect(
      page.getByRole("link", { name: "Email us about this missing field" }),
    ).toHaveAttribute(
      "href",
      buildMissingParcelDataMailtoHref({
        fieldLabel: "Neighborhood",
        pin: DEMO_DISPLAY_PIN,
        ain: DEMO_AIN,
      }),
    );
  });
});
