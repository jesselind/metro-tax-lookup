// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test, type Page } from "@playwright/test";
import { displayMartAuthorityName } from "../src/lib/arapahoeParcelLevyData";
import {
  SYNTHETIC_E2E_ADDRESS,
  SYNTHETIC_E2E_AUTHORITY,
  SYNTHETIC_E2E_METRO_AUTHORITY,
} from "./fixtures/syntheticCountyData";
import { installSyntheticCountyData } from "./helpers/installSyntheticCountyData";

const nonMetroAuthorityLabel = displayMartAuthorityName(SYNTHETIC_E2E_AUTHORITY);
const metroAuthorityLabel = displayMartAuthorityName(SYNTHETIC_E2E_METRO_AUTHORITY);

async function searchSyntheticAddress(page: Page) {
  await page.getByRole("textbox", { name: "Street address" }).fill(SYNTHETIC_E2E_ADDRESS);
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.locator("#home-levy-stack-subheading")).toBeVisible();
}

test.describe("Metro year-over-year UI", () => {
  test("non-metro synthetic parcel has no Changed badge or bill-impact callout", async ({
    page,
  }) => {
    await installSyntheticCountyData(page);
    await page.goto("/");
    await searchSyntheticAddress(page);

    await expect(page.getByText(nonMetroAuthorityLabel)).toBeVisible();
    await expect(page.getByText("Changed", { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("status").filter({ hasText: /paying \$.*more than last year/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("status").filter({ hasText: /paying \$.*less than last year/i }),
    ).toHaveCount(0);
  });

  test("metro-matched synthetic parcel shows YoY chrome and dashboard tiles", async ({
    page,
  }) => {
    await installSyntheticCountyData(page, { includeMetro: true });
    await page.goto("/");
    await searchSyntheticAddress(page);

    await expect(page.getByText(metroAuthorityLabel)).toBeVisible();
    await expect(page.getByText("Changed", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("status").filter({
        hasText: /paying \$4 more than last year for your metro district/i,
      }),
    ).toBeVisible();

    await expect(page.locator("#home-parcel-tax-year")).toBeVisible();
    await expect(page.locator("#home-parcel-property-tax")).toBeVisible();
    await expect(page.locator("#home-parcel-property-tax")).toContainText("$413");
  });

  test("metro tile details show year cards and Difference line", async ({ page }) => {
    await installSyntheticCountyData(page, { includeMetro: true });
    await page.goto("/");
    await searchSyntheticAddress(page);

    await page
      .getByRole("button", {
        name: new RegExp(
          `View district details for ${metroAuthorityLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        ),
      })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("region", { name: /paying \$4 more than last year/i }),
    ).toBeVisible();
    await expect(dialog.getByText("General Operating")).toBeVisible();
    await expect(dialog.getByText("2025").first()).toBeVisible();
    await expect(dialog.getByText("2026").first()).toBeVisible();
    await expect(dialog.getByText(/^Difference:/)).toHaveCount(3);
  });
});
