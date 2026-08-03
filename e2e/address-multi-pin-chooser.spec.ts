// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import {
  SYNTHETIC_MULTI_E2E_ADDRESS,
  SYNTHETIC_MULTI_PERSONAL_OWNER,
  SYNTHETIC_MULTI_PERSONAL_PIN,
  SYNTHETIC_MULTI_REAL_OWNER,
  SYNTHETIC_MULTI_REAL_PIN,
} from "./fixtures/syntheticCountyData";
import { streetAddressField } from "./helpers/addressLookup";
import { installSyntheticCountyData } from "./helpers/installSyntheticCountyData";

/**
 * Multi-PIN situs chooser (Real + business personal property).
 * Dedicated suite — not home smoke. Unit coverage lives in
 * `situsMultiPinChooser.test.ts` / `arapahoeSitusLookup.test.ts`.
 */
test("multi-account situs: one typeahead place, then full PIN chooser", async ({
  page,
}) => {
  await installSyntheticCountyData(page);
  await page.goto("/");

  const street = streetAddressField(page);
  await street.fill(SYNTHETIC_MULTI_E2E_ADDRESS);

  const list = page.getByRole("listbox", { name: "Address suggestions" });
  await expect(list).toBeVisible();
  await expect(list.getByRole("option")).toHaveCount(1);
  await expect(list.getByText("80000-1111")).toHaveCount(0);
  await expect(list.getByText("80000-2222")).toHaveCount(0);
  await expect(list.getByText(/80000\b/)).toBeVisible();

  await street.press("Escape");
  await page.getByRole("button", { name: "Search" }).click();

  const chooser = page.getByRole("region", { name: "Matching properties" });
  await expect(chooser).toBeVisible();
  await expect(
    chooser.getByText("2 accounts matched at this address"),
  ).toBeVisible();
  await expect(chooser.getByText(SYNTHETIC_MULTI_REAL_PIN)).toBeVisible();
  await expect(chooser.getByText(SYNTHETIC_MULTI_PERSONAL_PIN)).toBeVisible();
  await expect(chooser.getByText(SYNTHETIC_MULTI_REAL_OWNER)).toBeVisible();
  await expect(chooser.getByText(SYNTHETIC_MULTI_PERSONAL_OWNER)).toBeVisible();
  await expect(
    chooser.getByRole("button", { name: "Real property" }),
  ).toBeVisible();
  await expect(
    chooser.getByRole("button", { name: "Business personal property" }),
  ).toBeVisible();
  await expect(chooser.getByText("80000-1111")).toBeVisible();
  await expect(chooser.getByText("80000-2222")).toBeVisible();

  const realOwner = chooser.getByText(SYNTHETIC_MULTI_REAL_OWNER);
  const realPin = chooser.getByText(SYNTHETIC_MULTI_REAL_PIN, { exact: true });
  const ownerBox = await realOwner.boundingBox();
  const pinBox = await realPin.boundingBox();
  expect(ownerBox).not.toBeNull();
  expect(pinBox).not.toBeNull();
  expect(ownerBox!.y).toBeLessThan(pinBox!.y);

  const pins = chooser.locator(".font-mono");
  await expect(pins.nth(0)).toHaveText(SYNTHETIC_MULTI_REAL_PIN);
  await expect(pins.nth(1)).toHaveText(SYNTHETIC_MULTI_PERSONAL_PIN);
});
