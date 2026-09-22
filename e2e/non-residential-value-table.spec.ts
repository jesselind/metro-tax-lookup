// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import {
  SYNTHETIC_MULTI_E2E_ADDRESS,
  SYNTHETIC_MULTI_REAL_PIN,
} from "./fixtures/syntheticCountyData";
import { fillStreetAndSubmitSearch } from "./helpers/addressLookup";
import { installSyntheticCountyData } from "./helpers/installSyntheticCountyData";

/**
 * Non-residential values face: proportional assessed split in dive-deeper,
 * no school assessed board.
 */
test("non-residential parcel shows proportional assessed split without school row", async ({
  page,
}) => {
  await installSyntheticCountyData(page);
  await page.goto("/");
  await fillStreetAndSubmitSearch(page, SYNTHETIC_MULTI_E2E_ADDRESS);

  const chooser = page.getByRole("region", { name: "Matching properties" });
  await expect(chooser).toBeVisible();

  const realRow = chooser
    .getByRole("listitem")
    .filter({ hasText: SYNTHETIC_MULTI_REAL_PIN });
  await realRow.getByRole("button", { name: /^Use this property\./ }).click();

  await expect(page.locator("#parcel-record-heading")).toBeVisible();

  const valuesSection = page.locator("#home-parcel-appraised-assessed");
  await expect(valuesSection).toBeVisible();
  // Exempt 9xxx (synthetic hospital): no invented chart percent parenthetical.
  await expect(
    valuesSection.getByText(/2026 Assessed Value/, { exact: false }),
  ).toBeVisible();
  await expect(valuesSection.getByText(/\(\d+(\.\d+)?%\)/)).toHaveCount(0);
  await expect(
    valuesSection.getByText(/Assessed School Value/),
  ).toHaveCount(0);
  await expect(valuesSection.getByText("$12,500,000")).toBeVisible();

  await valuesSection
    .getByRole("button", { name: "Building and land breakdown" })
    .click();
  const breakdownTable = valuesSection.getByRole("table", {
    name: /Building and land breakdown/i,
  });
  await expect(breakdownTable).toBeVisible();
  const assessedRow = breakdownTable.getByRole("row", {
    name: /2026 Assessed Value/,
  });
  await expect(assessedRow).toBeVisible();
  await expect(assessedRow.getByRole("cell", { name: "$12,500,000" })).toBeVisible();
  await expect(assessedRow.getByRole("cell", { name: "$10,000,000" })).toBeVisible();
  await expect(assessedRow.getByRole("cell", { name: "$2,500,000" })).toBeVisible();
});
