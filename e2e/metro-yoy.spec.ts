// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import { displayMartAuthorityName } from "../src/lib/arapahoeParcelLevyData";
import { AUTHORITY_MILLS_HISTORY_CHART_HEADING } from "../src/content/levyYoYCopy";
import {
  SYNTHETIC_E2E_AUTHORITY,
  SYNTHETIC_E2E_METRO_AUTHORITY,
} from "./fixtures/syntheticCountyData";
import {
  searchSyntheticAddress,
  viewDistrictDetailsButton,
} from "./helpers/addressLookup";
import { installSyntheticCountyData } from "./helpers/installSyntheticCountyData";

const nonMetroAuthorityLabel = displayMartAuthorityName(SYNTHETIC_E2E_AUTHORITY);
const metroAuthorityLabel = displayMartAuthorityName(SYNTHETIC_E2E_METRO_AUTHORITY);

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
      page.getByRole("status").filter({
        hasText: /Your property tax bill changed from last year/i,
      }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: /Your property tax bill changed from last year/i,
      }),
    ).toHaveCount(0);
  });

  test("AUTH history change shows Changed badge and bill-impact callout", async ({
    page,
  }) => {
    await installSyntheticCountyData(page, { includeAuthYoY: true });
    await page.goto("/");
    await searchSyntheticAddress(page);

    await expect(page.getByText(nonMetroAuthorityLabel)).toBeVisible();
    await expect(page.getByText("Changed", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("status").filter({
        hasText: /Your property tax bill changed from last year/i,
      }),
    ).toBeVisible();

    // Rent lens hides the owner-framed amber banner; levy tile Changed cues remain.
    await page.getByRole("radio", { name: "Rent" }).click();
    await expect(
      page.getByRole("button", {
        name: /Your property tax bill changed from last year/i,
      }),
    ).toHaveCount(0);
    await expect(page.getByText("Changed", { exact: true })).toBeVisible();
    await page.getByRole("radio", { name: "Own" }).click();
    await expect(
      page.getByRole("button", {
        name: /Your property tax bill changed from last year/i,
      }),
    ).toBeVisible();

    await viewDistrictDetailsButton(page, nonMetroAuthorityLabel).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("region", { name: /2\.0% higher than last year/i }),
    ).toBeVisible();
    await dialog
      .getByRole("button", { name: /2\.0% higher than last year\. Details\./i })
      .click();
    const yoySummary = dialog.getByRole("region", {
      name: /2\.0% higher than last year/i,
    });
    await expect(
      yoySummary.getByText("Tax Year 2024", { exact: true }),
    ).toBeVisible();
    await expect(
      yoySummary.getByText("Tax Year 2025", { exact: true }),
    ).toBeVisible();
    const millsChart = dialog.getByRole("region", {
      name: AUTHORITY_MILLS_HISTORY_CHART_HEADING,
    });
    await expect(millsChart).toBeVisible();
    await expect(millsChart.getByText("Tax Year 2018")).toBeVisible();

    const year2018Dot = millsChart.getByRole("button", {
      name: /Tax Year 2018,/i,
    });
    await year2018Dot.click();
    await expect(year2018Dot).toHaveAttribute("aria-expanded", "true");
    const year2018PanelId = await year2018Dot.getAttribute("aria-controls");
    expect(year2018PanelId).toMatch(/\S/);
    const year2018Panel = page.locator(`[id="${year2018PanelId}"]`);
    await expect(year2018Panel).toBeVisible();
    await expect(year2018Panel).toContainText("Tax Year 2018");
    // AUTH 0101 (Englewood School Dist #1) Tax Year 2018 in bundled Levy %.
    await expect(year2018Panel).toContainText("52.373 mills");

    await expect(dialog.getByText("Total", { exact: true })).toHaveCount(0);
    await expect(dialog.getByText("Each part that changed")).toHaveCount(0);
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
        hasText: /Your property tax bill changed from last year/i,
      }),
    ).toBeVisible();

    const scrollBtn = page.getByRole("button", {
      name: /Your property tax bill changed from last year/i,
    });
    await expect(scrollBtn).toBeVisible();
    await scrollBtn.click();
    const firstChangedTile = page.locator("#levy-tile-first-rate-change");
    await expect(firstChangedTile).toBeVisible();
    await expect(
      viewDistrictDetailsButton(firstChangedTile, metroAuthorityLabel),
    ).toBeFocused();

    await expect(page.locator("#home-parcel-tax-year")).toBeVisible();
    await expect(page.locator("#home-parcel-property-tax")).toBeVisible();
    // Synthetic metro mills × assessed: known fixture contract.
    await expect(page.locator("#home-parcel-property-tax")).toContainText("$413");
  });

  test("metro tile details show headline only until breakdown is expanded", async ({
    page,
  }) => {
    await installSyntheticCountyData(page, { includeMetro: true });
    await page.goto("/");
    await searchSyntheticAddress(page);

    await viewDistrictDetailsButton(page, metroAuthorityLabel).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("region", { name: /% higher than last year/i }),
    ).toBeVisible();
    await expect(dialog.getByText("General Operating")).toHaveCount(0);
    await expect(dialog.getByText(/^Difference:/)).toHaveCount(0);

    await dialog
      .getByRole("button", { name: /% higher than last year/i })
      .click();
    await expect(dialog.getByText("Total", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Each part that changed")).toBeVisible();
    await expect(dialog.getByText("General Operating")).toBeVisible();
    await expect(dialog.getByText(/^Difference:/)).toHaveCount(4);
    await expect(dialog.getByText(/\* Dollar amounts use/i)).toBeVisible();

    const purposeRow = dialog
      .getByRole("listitem")
      .filter({ hasText: "General Operating" });
    await expect(
      purposeRow.getByText("Tax Year 2024", { exact: true }),
    ).toBeVisible();
    await expect(
      purposeRow.getByText("Tax Year 2025", { exact: true }),
    ).toBeVisible();
    await expect(purposeRow.getByText(/^Difference:/)).toBeVisible();

    await dialog.getByRole("button", { name: "General Operating" }).click();
    await expect(
      dialog.getByRole("heading", { name: "General operating" }),
    ).toBeVisible();
    await expect(dialog.getByText(/day-to-day money for the district/i)).toBeVisible();

    await dialog
      .getByRole("button", { name: /% higher than last year\. Hide details\./i })
      .click();
    await expect(dialog.getByText("General Operating")).toHaveCount(0);
    await expect(
      dialog.getByRole("heading", { name: "General operating" }),
    ).toHaveCount(0);
  });
});
