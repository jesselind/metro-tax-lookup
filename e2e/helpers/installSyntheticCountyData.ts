// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { Page } from "@playwright/test";
import {
  ARAPAHOE_COUNTY_CONFIG,
  DOUGLAS_COUNTY_CONFIG,
} from "../../src/lib/countyConfig";
import {
  countyAccountMapUrl,
  countyLevyStacksUrl,
  countyParcelRecordShardDirUrl,
  countySitusToPinsUrl,
} from "../../src/lib/countyDataPaths";
import {
  SYNTHETIC_DOUGLAS_PARCEL_RECORD_SHARD,
  SYNTHETIC_DOUGLAS_PIN_SHARD_PREFIX,
  SYNTHETIC_DOUGLAS_PIN_TO_TAG,
  SYNTHETIC_DOUGLAS_SITUS_TO_PINS,
  SYNTHETIC_E2E_TAG_ID,
  SYNTHETIC_LEVY_STACKS,
  SYNTHETIC_LEVY_STACKS_WITH_AUTH_YOY,
  SYNTHETIC_LEVY_STACKS_WITH_METRO,
  SYNTHETIC_PARCEL_RECORD_SHARD,
  SYNTHETIC_PIN_SHARD_PREFIX,
  SYNTHETIC_PIN_TO_TAG,
  SYNTHETIC_SITUS_TO_PINS,
  syntheticLevyStacksForAuthorityChain,
} from "../fixtures/syntheticCountyData";

export type InstallSyntheticCountyDataOptions = {
  /** Wired county whose `/data/{countyId}-*` routes are fulfilled (default Arapahoe). */
  countyId?: "arapahoe" | "douglas";
  /** When true, include a levy line whose LG ID matches bundled metro YoY test data. */
  includeMetro?: boolean;
  /**
   * When true (and not includeMetro / authorityChainLevyLineCode), use an AUTH
   * code that changed in bundled Levy % history so all-tile YoY chrome can be
   * asserted without a metro match.
   */
  includeAuthYoY?: boolean;
  /**
   * County AUTH / levy line code that matches a curated
   * `levy-authority-chain-entries.json` entry (for example `0501`, `0601`).
   * Wins over includeAuthYoY; ignored when includeMetro is true.
   */
  authorityChainLevyLineCode?: string;
  /** Override stack authority label (for example cross-county SMFR on Douglas). */
  authorityChainAuthorityName?: string;
};

/** Playwright glob: match committed URL plus optional ?v= cache-bust query. */
function dataUrlPattern(urlPath: string): string {
  return `**${urlPath}*`;
}

/**
 * Replace committed county JSON with tiny synthetic payloads for Playwright.
 * URL patterns come from countyDataPaths + CountyConfig.id (Phase 10).
 */
export async function installSyntheticCountyData(
  page: Page,
  options: InstallSyntheticCountyDataOptions = {},
): Promise<void> {
  const countyId =
    options.countyId === "douglas"
      ? DOUGLAS_COUNTY_CONFIG.id
      : ARAPAHOE_COUNTY_CONFIG.id;
  const authorityCode = options.authorityChainLevyLineCode?.trim();
  const authorityName = options.authorityChainAuthorityName?.trim();
  const levyStacks = options.includeMetro
    ? SYNTHETIC_LEVY_STACKS_WITH_METRO
    : authorityCode
      ? syntheticLevyStacksForAuthorityChain(authorityCode, {
          authorityName,
          levyAspxUrl:
            countyId === DOUGLAS_COUNTY_CONFIG.id
              ? `https://www.douglasco.gov/assessor/taxing-authorities/${SYNTHETIC_E2E_TAG_ID}`
              : undefined,
        })
      : options.includeAuthYoY
        ? SYNTHETIC_LEVY_STACKS_WITH_AUTH_YOY
        : SYNTHETIC_LEVY_STACKS;

  const situs =
    countyId === DOUGLAS_COUNTY_CONFIG.id
      ? SYNTHETIC_DOUGLAS_SITUS_TO_PINS
      : SYNTHETIC_SITUS_TO_PINS;
  const pinToTag =
    countyId === DOUGLAS_COUNTY_CONFIG.id
      ? SYNTHETIC_DOUGLAS_PIN_TO_TAG
      : SYNTHETIC_PIN_TO_TAG;
  const shardPrefix =
    countyId === DOUGLAS_COUNTY_CONFIG.id
      ? SYNTHETIC_DOUGLAS_PIN_SHARD_PREFIX
      : SYNTHETIC_PIN_SHARD_PREFIX;
  const parcelShard =
    countyId === DOUGLAS_COUNTY_CONFIG.id
      ? SYNTHETIC_DOUGLAS_PARCEL_RECORD_SHARD
      : SYNTHETIC_PARCEL_RECORD_SHARD;

  await fulfillJson(
    page,
    dataUrlPattern(countySitusToPinsUrl(undefined, countyId)),
    situs,
  );
  await fulfillJson(
    page,
    dataUrlPattern(countyAccountMapUrl(undefined, countyId)),
    pinToTag,
  );
  await fulfillJson(
    page,
    dataUrlPattern(countyLevyStacksUrl(undefined, countyId)),
    levyStacks,
  );
  await fulfillJson(
    page,
    dataUrlPattern(
      `${countyParcelRecordShardDirUrl(undefined, countyId)}/${shardPrefix}.json`,
    ),
    parcelShard,
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
