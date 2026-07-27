// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { Page } from "@playwright/test";
import {
  SYNTHETIC_LEVY_STACKS,
  SYNTHETIC_LEVY_STACKS_WITH_AUTH_YOY,
  SYNTHETIC_LEVY_STACKS_WITH_AUTHORITY_CHAIN,
  SYNTHETIC_LEVY_STACKS_WITH_METRO,
  SYNTHETIC_PARCEL_RECORD_SHARD,
  SYNTHETIC_PIN_SHARD_PREFIX,
  SYNTHETIC_PIN_TO_TAG,
  SYNTHETIC_SITUS_TO_PINS,
} from "../fixtures/syntheticCountyData";

export type InstallSyntheticCountyDataOptions = {
  /** When true, include a levy line whose LG ID matches bundled metro YoY test data. */
  includeMetro?: boolean;
  /**
   * When true (and not includeMetro / includeAuthorityChain), use an AUTH code
   * that changed in bundled Levy % history so all-tile YoY chrome can be
   * asserted without a metro match.
   */
  includeAuthYoY?: boolean;
  /**
   * When true (and not includeMetro), use AUTH `0501` so the Cherry Creek
   * authority-chain prototype panel appears in tile details.
   */
  includeAuthorityChain?: boolean;
};

/**
 * Replace the large committed county JSON files with tiny synthetic payloads
 * so address → levy → shard can run without a real resident parcel.
 * Call before `page.goto`.
 */
export async function installSyntheticCountyData(
  page: Page,
  options: InstallSyntheticCountyDataOptions = {},
): Promise<void> {
  const levyStacks = options.includeMetro
    ? SYNTHETIC_LEVY_STACKS_WITH_METRO
    : options.includeAuthorityChain
      ? SYNTHETIC_LEVY_STACKS_WITH_AUTHORITY_CHAIN
      : options.includeAuthYoY
        ? SYNTHETIC_LEVY_STACKS_WITH_AUTH_YOY
        : SYNTHETIC_LEVY_STACKS;

  await fulfillJson(page, "**/data/arapahoe-situs-to-pins.json", SYNTHETIC_SITUS_TO_PINS);
  await fulfillJson(page, "**/data/arapahoe-pin-to-tag.json", SYNTHETIC_PIN_TO_TAG);
  await fulfillJson(
    page,
    "**/data/arapahoe-levy-stacks-by-tag-id.json",
    levyStacks,
  );
  await fulfillJson(
    page,
    `**/data/arapahoe-parcel-record-by-pin/${SYNTHETIC_PIN_SHARD_PREFIX}.json`,
    SYNTHETIC_PARCEL_RECORD_SHARD,
  );
}

async function fulfillJson(
  page: Page,
  urlPattern: string,
  body: unknown,
): Promise<void> {
  await page.route(urlPattern, async (route) => {
    await route.fulfill({
      status: 200,
      json: body,
    });
  });
}
