// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, type Locator, type Page } from "@playwright/test";
import { SYNTHETIC_E2E_ADDRESS } from "../fixtures/syntheticCountyData";

/**
 * Accessible name of the home simple-mode address field.
 * Must match the visible `<label>` in `HomeParcelAddressLookup` (simple mode).
 */
export const STREET_ADDRESS_FIELD_LABEL = "Street address";

/**
 * Locator for the home street address field.
 *
 * The control is an `<input>` with `role="combobox"` (street typeahead), so
 * `getByRole("textbox", …)` will not find it. Prefer `getByLabel` so fill/smoke
 * stay stable if the ARIA role is adjusted; assert `combobox` in smoke when you
 * want to lock the typeahead a11y contract.
 */
export function streetAddressField(page: Page): Locator {
  return page.getByLabel(STREET_ADDRESS_FIELD_LABEL, { exact: true });
}

/** Escape a string for use inside a RegExp source. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Levy tile control that opens district details for the given authority label
 * (after `displayMartAuthorityName` if the fixture uses mart casing).
 * Pass a tile/dialog locator to scope when more than one match may exist.
 */
export function viewDistrictDetailsButton(
  root: Page | Locator,
  authorityLabel: string,
): Locator {
  return root.getByRole("button", {
    name: new RegExp(
      `View district details for ${escapeRegExp(authorityLabel)}`,
    ),
  });
}

/**
 * Fill the street field, dismiss an open typeahead listbox, click Search.
 *
 * Escape still closes the list; blur alone does not. Call after
 * `installSyntheticCountyData(page)` (when needed) and `page.goto("/")`.
 */
export async function fillStreetAndSubmitSearch(
  page: Page,
  address: string,
): Promise<void> {
  const street = streetAddressField(page);
  await street.fill(address);
  await street.press("Escape");
  await page.getByRole("button", { name: "Search" }).click();
}

/**
 * Fill {@link SYNTHETIC_E2E_ADDRESS}, submit Search, wait for the levy stack.
 */
export async function searchSyntheticAddress(page: Page): Promise<void> {
  await fillStreetAndSubmitSearch(page, SYNTHETIC_E2E_ADDRESS);
  await expect(page.locator("#home-levy-stack-subheading")).toBeVisible();
}
