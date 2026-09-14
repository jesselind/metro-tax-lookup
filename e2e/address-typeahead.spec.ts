// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import { SYNTHETIC_E2E_ADDRESS } from "./fixtures/syntheticCountyData";
import {
  fillStreetAndSubmitSearch,
  streetAddressField,
} from "./helpers/addressLookup";
import { installSyntheticCountyData } from "./helpers/installSyntheticCountyData";

/**
 * Shipped Arapahoe situs collision (public assessor data): one stripped key holds
 * 1201 WHEELING ST and 1201 S WHEELING WAY. Used for live-data typeahead/Search
 * contracts (no synthetic situs mock).
 */
const WHEELING_BARE_QUERY = "1201 Wheeling";
const WHEELING_SOUTH_WAY_QUERY = "1201 S Wheeling Way";

/**
 * Typeahead dismiss contract: blur (keyboard Done / scroll-blur) keeps the
 * list open; outside pointer closes it.
 */
test("typeahead stays open after blur; closes on outside pointer", async ({
  page,
}) => {
  await installSyntheticCountyData(page);
  await page.goto("/");

  const street = streetAddressField(page);
  await street.fill(SYNTHETIC_E2E_ADDRESS);

  const list = page.getByRole("listbox", { name: "Address suggestions" });
  await expect(list).toBeVisible();

  await street.evaluate((el) => (el as HTMLInputElement).blur());
  await expect(list).toBeVisible();

  // Refocus so the list onScroll active-element branch runs (blur while focused).
  await street.focus();
  await list.evaluate((el) => {
    el.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect(street).not.toBeFocused();
  await expect(list).toBeVisible();

  await page.getByRole("heading", { name: "Civic Lookup", level: 1 }).click();
  await expect(list).toBeHidden();
});

test.describe("shipped Arapahoe Wheeling place collision", () => {
  test.beforeEach(async ({ page }) => {
    // Real `public/data/arapahoe-situs-to-pins.json` (no synthetic route fulfill).
    await page.goto("/");
  });

  test("typeahead lists WHEELING ST and S WHEELING WAY as separate places", async ({
    page,
  }) => {
    const street = streetAddressField(page);
    await street.fill(WHEELING_BARE_QUERY);

    const list = page.getByRole("listbox", { name: "Address suggestions" });
    await expect(list).toBeVisible({ timeout: 30_000 });
    await expect(
      list.getByRole("option").filter({ hasText: "WHEELING ST" }),
    ).toHaveCount(1);
    await expect(
      list.getByRole("option").filter({ hasText: "S WHEELING WAY" }),
    ).toHaveCount(1);
  });

  test("Search with explicit S … Way locks that place (no ST in chooser)", async ({
    page,
  }) => {
    await fillStreetAndSubmitSearch(page, WHEELING_SOUTH_WAY_QUERY);

    await expect(
      page.getByRole("region", { name: "Matching properties" }),
    ).toHaveCount(0);
    await expect(page.getByText(/1201 S WHEELING WAY/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("Search with bare Wheeling still offers both places", async ({
    page,
  }) => {
    await fillStreetAndSubmitSearch(page, WHEELING_BARE_QUERY);

    const chooser = page.getByRole("region", { name: "Matching properties" });
    await expect(chooser).toBeVisible({ timeout: 30_000 });
    await expect(chooser).toContainText("WHEELING ST");
    await expect(chooser).toContainText("S WHEELING WAY");
  });
});
