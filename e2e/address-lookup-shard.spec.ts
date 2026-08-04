// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import { displayMartAuthorityName } from "../src/lib/arapahoeParcelLevyData";
import {
  SYNTHETIC_E2E_AUTHORITY,
  SYNTHETIC_E2E_OWNER,
  SYNTHETIC_E2E_SITUS_LINE,
  SYNTHETIC_PIN,
} from "./fixtures/syntheticCountyData";
import { searchSyntheticAddress } from "./helpers/addressLookup";
import { installSyntheticCountyData } from "./helpers/installSyntheticCountyData";

const authorityLabel = displayMartAuthorityName(SYNTHETIC_E2E_AUTHORITY);

/**
 * Address → levy → parcel-record shard, using route-fulfilled synthetic JSON only.
 */
test("synthetic address loads levy stack and property details", async ({
  page,
}) => {
  await installSyntheticCountyData(page);
  await page.goto("/");
  await searchSyntheticAddress(page);

  await expect(page.getByText(authorityLabel)).toBeVisible();
  await expect(page.locator("#parcel-record-heading")).toBeVisible();

  const details = page.locator("#home-property-details");
  await expect(details.getByText(SYNTHETIC_E2E_OWNER, { exact: true })).toBeVisible();
  await expect(
    details.getByText(SYNTHETIC_E2E_SITUS_LINE, { exact: true }),
  ).toBeVisible();
  // Matched PIN lives in the county-compare strip (below the details column), not
  // inside #home-property-details.
  await expect(
    page
      .getByRole("region", { name: "See how the county displays your data" })
      .getByText(SYNTHETIC_PIN, { exact: true }),
  ).toBeVisible();
  await expect(page.locator("#home-parcel-tax-year")).toBeVisible();
  // Synthetic mills × assessed: known fixture contract, not a live county snapshot.
  await expect(page.locator("#home-parcel-property-tax")).toContainText("$68");
});
