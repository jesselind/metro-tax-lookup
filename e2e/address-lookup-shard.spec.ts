// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import { displayMartAuthorityName } from "../src/lib/countyParcelLevyData";
import {
  SYNTHETIC_E2E_AUTHORITY,
  SYNTHETIC_E2E_NEIGHBORHOOD,
  SYNTHETIC_E2E_NEIGHBORHOOD_CODE,
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
  await expect(
    details.getByText(SYNTHETIC_E2E_NEIGHBORHOOD, { exact: true }),
  ).toBeVisible();
  await expect(
    details.getByText(SYNTHETIC_E2E_NEIGHBORHOOD_CODE, { exact: true }),
  ).toBeVisible();
  // Matched PIN lives in the county-compare strip (above Feedback; after comps when present), not
  // inside #home-property-details.
  await expect(
    page
      .getByRole("region", { name: "See how Arapahoe County displays your data" })
      .getByText(SYNTHETIC_PIN, { exact: true }),
  ).toBeVisible();
  // Tax year note when years differ (no separate Tax year summary tile).
  await expect(page.getByText(/Tax year is 2025/)).toBeVisible();
  // Single-PIN situs: no account switcher on the dashboard.
  await expect(page.locator("#home-parcel-account-type")).toHaveCount(0);
  // Synthetic mills × assessed on stack Total (estimate copy lives in the
  // breakdown paragraph above the bar, not a glossary on Total).
  const levyTotal = page.getByRole("region", {
    name: "Total mill levy for your stack",
  });
  await expect(levyTotal).toContainText("$68");

  // Locked levy-ready report: one Back to top (below Feedback), not a second
  // under county compare.
  await expect(
    page.getByRole("button", { name: "Back to top of page" }),
  ).toHaveCount(1);
});
