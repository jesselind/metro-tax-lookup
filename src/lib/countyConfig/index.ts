// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * County product config — public barrel.
 *
 * Import from `@/lib/countyConfig` (this folder). Layout:
 *
 * | File | Role |
 * | --- | --- |
 * | `types.ts` | Shared TypeScript shapes |
 * | `arapahoe.ts` / `douglas.ts` | One county's data record each |
 * | `registry.ts` | `COUNTY_CONFIG_BY_ID`, lookup, boot validation |
 * | `validate.ts` | Consistency checks (no registry import) |
 * | `helpers.ts` | Feature gates and resident-facing helpers |
 * | `naming.ts` | County file ↔ export name convention |
 * | `README.md` | Human navigation + add-county checklist |
 *
 * Product model narrative: `docs/county-config.md`.
 * Campaign chrome (paid-for-by): `siteConfig.ts` — not here.
 */

export type {
  CountyClerkRecorderSearchTemplate,
  CountyConfig,
  CountyFeatureKey,
  CountyFeaturePresentation,
  CountyFeatures,
  CountyHostedQueryTemplate,
  CountyKnownFailures,
  CountyLevyAspxAllowlist,
  CountyParcelRecordUrlTemplate,
  CountyPublicParcelId,
} from "@/lib/countyConfig/types";

export { ARAPAHOE_COUNTY_CONFIG } from "@/lib/countyConfig/arapahoe";
export { DOUGLAS_COUNTY_CONFIG } from "@/lib/countyConfig/douglas";

export {
  COUNTY_CONFIG,
  COUNTY_CONFIG_BY_ID,
  countyConfigById,
  wiredCountyConfigs,
} from "@/lib/countyConfig/registry";

export {
  validateCountyConfig,
  validateWiredCountyAdjacency,
} from "@/lib/countyConfig/validate";

export {
  countyFeatureAvailable,
  countyFeaturePresentation,
  countyHostedPropertyPageOpenLabel,
  countyParcelRecordLookupValue,
  formatIdentifierNotFoundMessage,
  isCountyHostAllowed,
} from "@/lib/countyConfig/helpers";

export { countyConfigExportName } from "@/lib/countyConfig/naming";
