// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Runtime helpers that read a resolved {@link CountyConfig}.
 *
 * Prefer passing the **resolved** county after lookup. Defaults to
 * {@link COUNTY_CONFIG} (Arapahoe campaign default) only for pre-resolve paths.
 */

import { COUNTY_CONFIG } from "@/lib/countyConfig/registry";
import type {
  CountyConfig,
  CountyFeatureKey,
  CountyFeaturePresentation,
} from "@/lib/countyConfig/types";
import { isCountyHostAllowed as isCountyHostAllowedStrict } from "@/lib/countyConfig/validate";

/**
 * True when hostname is in the county host allowlist (case-insensitive).
 * Defaults to the campaign default county when `config` is omitted.
 */
export function isCountyHostAllowed(
  hostname: string,
  config: CountyConfig = COUNTY_CONFIG,
): boolean {
  return isCountyHostAllowedStrict(hostname, config);
}

/**
 * Value for the county's hosted property-page deep link.
 * Counties with `publicParcelId` (Arapahoe AIN) use that; others use account id
 * (Douglas hash path `{id}`).
 */
export function countyParcelRecordLookupValue(
  config: CountyConfig,
  opts: {
    accountId?: string | null;
    publicParcelId?: string | null;
  },
): string | null {
  if (config.publicParcelId) {
    const publicId = String(opts.publicParcelId ?? "").trim();
    return publicId || null;
  }
  const accountId = String(opts.accountId ?? "").trim();
  return accountId || null;
}

/** Button label: "Open county parcel record" / "Open county property details". */
export function countyHostedPropertyPageOpenLabel(
  config: CountyConfig,
): string {
  return `Open county ${config.hostedPropertyPageName}`;
}

/** True when the county has a source for this feature. */
export function countyFeatureAvailable(
  feature: CountyFeatureKey,
  config: CountyConfig = COUNTY_CONFIG,
): boolean {
  return config.features[feature];
}

/**
 * How the UI should treat a feature: omit (no source), gap (source failed),
 * or show.
 */
export function countyFeaturePresentation(
  feature: CountyFeatureKey,
  config: CountyConfig = COUNTY_CONFIG,
): CountyFeaturePresentation {
  if (!config.features[feature]) return "omit";
  if (feature === "compsPdf" && config.knownFailures.compsPdfHostedFiles) {
    return "gap";
  }
  return "show";
}

/** Resident error when account-id lookup candidates did not match. */
export function formatIdentifierNotFoundMessage(
  tried: string,
  config: CountyConfig = COUNTY_CONFIG,
): string {
  return config.identifierNotFoundTemplate.replaceAll("{tried}", tried);
}
