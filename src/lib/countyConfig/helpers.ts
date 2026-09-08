// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Runtime helpers that read a **resolved** {@link CountyConfig}.
 *
 * `config` is required on every helper below. There is no silent Arapahoe
 * default: after lookup, pass the active county; for intentional campaign-home
 * paths, pass {@link CAMPAIGN_DEFAULT_COUNTY_CONFIG} (or `ARAPAHOE_COUNTY_CONFIG`)
 * explicitly.
 */

import type {
  CountyConfig,
  CountyFeatureKey,
  CountyFeaturePresentation,
} from "@/lib/countyConfig/types";
import { isCountyHostAllowed as isCountyHostAllowedStrict } from "@/lib/countyConfig/validate";

/**
 * True when hostname is in the county host allowlist (case-insensitive).
 */
export function isCountyHostAllowed(
  hostname: string,
  config: CountyConfig,
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

/**
 * True when the county has a source for this feature.
 * Pass the resolved county after lookup — never omit `config`.
 */
export function countyFeatureAvailable(
  feature: CountyFeatureKey,
  config: CountyConfig,
): boolean {
  return config.features[feature];
}

/**
 * How the UI should treat a feature: omit (no source), gap (source failed),
 * or show. Pass the resolved county after lookup — never omit `config`.
 */
export function countyFeaturePresentation(
  feature: CountyFeatureKey,
  config: CountyConfig,
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
  config: CountyConfig,
): string {
  return config.identifierNotFoundTemplate.replaceAll("{tried}", tried);
}
