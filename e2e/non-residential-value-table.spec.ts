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
 * Non-residential ParcelValueTable: proportional assessed split, no school row.
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

  const valuesTable = page.getByRole("table", {
    name: "Appraised and assessed values by total, building, and land",
  });
  await expect(valuesTable).toBeVisible();
  // Exempt 9xxx (synthetic hospital): no invented chart percent parenthetical.
  const assessedRow = valuesTable.getByRole("row", {
    name: /2026 Assessed Value/,
  });
  await expect(assessedRow).toBeVisible();
  await expect(assessedRow).not.toContainText(/\(\d+(\.\d+)?%\)/);
  await expect(
    valuesTable.getByRole("row", { name: /Assessed School Value/ }),
  ).toHaveCount(0);
  await expect(assessedRow.getByRole("cell", { name: "$12,500,000" })).toBeVisible();
  await expect(assessedRow.getByRole("cell", { name: "$10,000,000" })).toBeVisible();
  await expect(assessedRow.getByRole("cell", { name: "$2,500,000" })).toBeVisible();
});
