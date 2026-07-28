// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import { SYNTHETIC_E2E_ADDRESS } from "./fixtures/syntheticCountyData";
import { streetAddressField } from "./helpers/addressLookup";
import { installSyntheticCountyData } from "./helpers/installSyntheticCountyData";

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

  await list.evaluate((el) => {
    el.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect(list).toBeVisible();

  await page.getByRole("heading", { name: "Civic Lookup", level: 1 }).click();
  await expect(list).toBeHidden();
});
