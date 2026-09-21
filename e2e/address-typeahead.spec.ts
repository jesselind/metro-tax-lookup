// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
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
 * Shipped Arapahoe situs + pin-to-tag collision: one stripped key holds
 * 1400 HAVANA ST (Real) and 1400 S HAVANA ST (Real + business personal).
 * Matching properties must keep places contiguous and prefer the no-direction
 * place when the typed street omits S.
 */
const HAVANA_BARE_QUERY = "1400 Havana";
const HAVANA_SOUTH_QUERY = "1400 S Havana St";

/**
 * Typeahead dismiss contract: scrolling the open suggestion list blurs the
 * field (mobile keyboard dismiss) but keeps the list open; outside pointer
 * closes it.
 */
test("typeahead stays open after list scroll blur; closes on outside pointer", async ({
  page,
}) => {
  await installSyntheticCountyData(page);
  await page.goto("/");

  const street = streetAddressField(page);
  // Many synthetic places at house 5000 so the list overflows max-h.
  await street.fill("5000 Synthetic");

  const list = page.getByRole("listbox", { name: "Address suggestions" });
  await expect(list).toBeVisible();
  await expect
    .poll(async () =>
      list.evaluate((el) => el.scrollHeight > el.clientHeight + 2),
    )
    .toBe(true);

  const box = await list.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.wheel(0, 240);
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

/**
 * Shipped Arapahoe situs + pin-to-tag: `1400|HAVANA|` holds HAVANA ST (Real)
 * and S HAVANA ST (Real + business personal). Matching properties must keep
 * places contiguous and prefer the no-direction place when typed omits S.
 */
test.describe("shipped Arapahoe 1400 Havana place + Matching properties order", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("typeahead lists HAVANA ST and S HAVANA ST as separate places", async ({
    page,
  }) => {
    const street = streetAddressField(page);
    await street.fill(HAVANA_BARE_QUERY);

    const list = page.getByRole("listbox", { name: "Address suggestions" });
    await expect(list).toBeVisible({ timeout: 30_000 });
    const options = list.getByRole("option");
    await expect(options).toHaveCount(2);
    const texts = await options.allTextContents();
    expect(
      texts.some((t) => /HAVANA ST/i.test(t) && !/S HAVANA/i.test(t)),
    ).toBe(true);
    expect(texts.some((t) => /S HAVANA ST/i.test(t))).toBe(true);
  });

  test("bare Havana Matching properties: north place then south Real then BPP", async ({
    page,
  }) => {
    await fillStreetAndSubmitSearch(page, HAVANA_BARE_QUERY);

    const chooser = page.getByRole("region", { name: "Matching properties" });
    await expect(chooser).toBeVisible({ timeout: 30_000 });
    // Wait for pin-to-tag enrichment (kind labels) before reading order.
    await expect(chooser.getByText("Real property").first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      chooser.getByText("Business personal property").first(),
    ).toBeVisible();

    const items = chooser.getByRole("listitem");
    await expect(items).toHaveCount(5);
    const texts = await items.allTextContents();

    expect(texts[0]).toMatch(/1400 HAVANA ST/i);
    expect(texts[0]).not.toMatch(/S HAVANA/i);
    expect(texts[0]).toMatch(/Real property/i);

    expect(texts[1]).toMatch(/1400 S HAVANA ST/i);
    expect(texts[1]).toMatch(/Real property/i);

    for (let i = 2; i < texts.length; i++) {
      expect(texts[i]).toMatch(/1400 S HAVANA ST/i);
      expect(texts[i]).toMatch(/Business personal property/i);
    }
  });

  test("Search with explicit S Havana St locks the south place", async ({
    page,
  }) => {
    await fillStreetAndSubmitSearch(page, HAVANA_SOUTH_QUERY);

    const chooser = page.getByRole("region", { name: "Matching properties" });
    await expect(chooser).toBeVisible({ timeout: 30_000 });
    await expect(chooser).toContainText(/1400 S HAVANA ST/i);
    await expect(chooser).not.toContainText(/1400 HAVANA ST,/i);
  });
});
