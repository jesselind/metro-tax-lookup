// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test, type Page } from "@playwright/test";
import { displayMartAuthorityName } from "../src/lib/countyParcelLevyData";
import { AUTHORITY_MILLS_HISTORY_CHART_HEADING } from "../src/content/levyYoYCopy";
import { MILL_LEVY_CHANGED_LABEL, MILL_LEVY_TILE_ID } from "../src/content/millLevySummaryCopy";
import { PARCEL_RECORD_SALE_HISTORY_ID } from "../src/components/ParcelRecordCountyTables";
import {
  COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD,
  COUNTY_PRIOR_YEAR_VALUES_SALE_HISTORY_JUMP_ARIA_LABEL,
  COUNTY_PRIOR_YEAR_VALUES_SOURCES_LINK_LABEL,
  COUNTY_PRIOR_YEAR_VALUES_TILE_STATUS,
} from "../src/content/countyPriorYearValuesGapNote";
import { COUNTY_SERVICE_GAP_CALLOUT_TITLE } from "../src/content/countyServiceGapGuidance";
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

function millLevyTile(page: Page) {
  return page.locator(`#${MILL_LEVY_TILE_ID}`);
}

test.describe("Metro year-over-year UI", () => {
  test("non-metro synthetic parcel has no Changed badge; mill levy tile is a white chip", async ({
    page,
  }) => {
    await installSyntheticCountyData(page);
    await page.goto("/");
    await searchSyntheticAddress(page);

    await expect(page.getByText(nonMetroAuthorityLabel)).toBeVisible();
    await expect(page.getByText("Changed", { exact: true })).toHaveCount(0);
    await expect(
      page.getByText("Your property tax bill changed from last year."),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /^Property tax change/ }),
    ).toHaveCount(0);
    const tile = millLevyTile(page);
    await expect(tile).toBeVisible();
    await expect(tile).not.toContainText(MILL_LEVY_CHANGED_LABEL);
    await expect(page.locator("#home-parcel-property-tax")).not.toContainText(
      MILL_LEVY_CHANGED_LABEL,
    );
    const priorYearTrigger = page.getByRole("button", {
      name: COUNTY_PRIOR_YEAR_VALUES_TILE_STATUS,
    });
    await expect(priorYearTrigger).toBeVisible();
    await expect(priorYearTrigger).not.toContainText(
      COUNTY_SERVICE_GAP_CALLOUT_TITLE,
    );
    await expect(page.locator(`#${PARCEL_RECORD_SALE_HISTORY_ID}`)).toBeVisible();

    await priorYearTrigger.click();
    const priorYearGap = page.getByRole("note").filter({
      hasText: COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD,
    });
    await expect(priorYearGap).toBeVisible();
    await expect(priorYearGap).toContainText(COUNTY_SERVICE_GAP_CALLOUT_TITLE);
    await expect(
      priorYearGap.getByRole("link", {
        name: COUNTY_PRIOR_YEAR_VALUES_SOURCES_LINK_LABEL,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: COUNTY_PRIOR_YEAR_VALUES_SALE_HISTORY_JUMP_ARIA_LABEL,
      })
      .click();
    await expect(priorYearGap).toHaveCount(0);
    await expect(page.locator(`#${PARCEL_RECORD_SALE_HISTORY_ID}`)).toBeFocused();
  });

  test("AUTH history change shows Changed on mill levy and levy tiles", async ({
    page,
  }) => {
    await installSyntheticCountyData(page, { includeAuthYoY: true });
    await page.goto("/");
    await searchSyntheticAddress(page);

    await expect(page.getByText(nonMetroAuthorityLabel)).toBeVisible();
    await expect(page.getByText("Changed", { exact: true }).first()).toBeVisible();
    const tile = millLevyTile(page);
    await expect(tile).toBeVisible();
    await expect(tile).toContainText(MILL_LEVY_CHANGED_LABEL);
    await expect(page.locator("#home-parcel-property-tax")).not.toContainText(
      MILL_LEVY_CHANGED_LABEL,
    );
    await expect(
      page.getByText("Your property tax bill changed from last year."),
    ).toHaveCount(0);

    // Rent keeps mill levy and levy Changed cues (not an owner-only control).
    await page.getByRole("radio", { name: "Rent" }).click();
    await expect(millLevyTile(page)).toBeVisible();
    await expect(page.getByText("Changed", { exact: true }).first()).toBeVisible();
    await page.getByRole("radio", { name: "Own" }).click();
    await expect(millLevyTile(page)).toBeVisible();
    await expect(millLevyTile(page)).toContainText(MILL_LEVY_CHANGED_LABEL);

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

    const chartGapBadge = millsChart.getByRole("button", {
      name: COUNTY_PRIOR_YEAR_VALUES_TILE_STATUS,
    });
    await expect(chartGapBadge).toBeVisible();
    // Arapahoe always has current assessed × mills on the newest chart year.
    // Gap badge is only honest when that current dollar line is present.
    await expect(millsChart.getByText("$347")).toBeVisible();
    await expect(millsChart.getByText("Tax Year 2025")).toBeVisible();
    await chartGapBadge.click();
    const chartGapPanel = page.getByRole("note").filter({
      hasText: COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_LEAD,
    });
    await expect(chartGapPanel).toBeVisible();
    await expect(chartGapPanel).toContainText(COUNTY_SERVICE_GAP_CALLOUT_TITLE);
    await expect(
      chartGapPanel.getByRole("link", {
        name: COUNTY_PRIOR_YEAR_VALUES_SOURCES_LINK_LABEL,
      }),
    ).toBeVisible();

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
    await expect(page.getByText("Changed", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText("Your property tax bill changed from last year."),
    ).toHaveCount(0);

    const tile = millLevyTile(page);
    await expect(tile).toBeVisible();
    await expect(tile).toContainText(MILL_LEVY_CHANGED_LABEL);
    await expect(page.locator("#home-parcel-property-tax")).not.toContainText(
      MILL_LEVY_CHANGED_LABEL,
    );
    const firstChangedTile = page.locator("#levy-tile-first-rate-change");
    await expect(firstChangedTile).toBeVisible();

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

  test("mill levy chip jumps to mill levy tiles and marks the tile grid", async ({
    page,
  }) => {
    await installSyntheticCountyData(page);
    await page.goto("/");
    await searchSyntheticAddress(page);

    const jump = page.getByRole("button", { name: /Jump to mill levy tiles/i });
    await expect(jump).toBeVisible();
    await jump.click();
    await expect(page.locator("#home-levy-stack-subheading")).toBeFocused();
    await expect(page.locator("#home-levy-stack-tiles")).toHaveAttribute(
      "data-arrive",
      "",
    );
  });
});
