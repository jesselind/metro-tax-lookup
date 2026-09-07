// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Douglas County product config (wired county id `douglas`).
 *
 * Data only. Types: `./types.ts`. Registry: `./registry.ts`.
 *
 * Mills from published Tax Districts and Mill Levies PDFs (no Levy.aspx).
 * Account ids are 8-character alphanumeric. No comps PDF / BPP / metro purpose
 * product in this county today (`metroPurposes: false`).
 *
 * Shipping JSON: `public/data/douglas-*`. Methodology: Douglas `/sources` module.
 */

import type { CountyConfig } from "@/lib/countyConfig/types";

/**
 * County 2. Alphanumeric accounts, hash-path property details, mill PDF gap,
 * valuation-history shards; no Arapahoe-style purpose-row metro product.
 */
export const DOUGLAS_COUNTY_CONFIG: CountyConfig = {
  id: "douglas",
  displayName: "Douglas County",
  dolaCertifyingCounty: "Douglas",
  identifierDigits: 8,
  identifierPasteMinDigits: 8,
  identifierAllowsLetters: true,
  publicParcelId: null,
  hostAllowlist: ["apps.douglas.co.us", "www.douglasco.gov"],
  urls: {
    levyAspx: {
      host: "www.douglasco.gov",
      pathSuffix: "/assessor/taxing-authorities/",
    },
    parcelRecord: {
      style: "hashPath",
      host: "apps.douglas.co.us",
      path: "/assessor/web/",
      hashPathTemplate: "/details/{year}/{id}",
      /** SPA property-details year segment for the current Douglas drop. */
      year: "2026",
    },
  },
  residentLinks: {
    propertySearch: "https://apps.douglas.co.us/assessor/web/",
  },
  hostedPropertyPageName: "property details",
  features: {
    situs: true,
    parcelRecordShards: true,
    valuationHistoryShards: true,
    compsPdf: false,
    bpp: false,
    millsHistory: true,
    metroPurposes: false,
    priorYearValuesGap: false,
    priorYearValuesInProgress: false,
    dataMartRefreshGap: false,
    millPdfTaxDistrictGap: true,
  },
  knownFailures: {
    compsPdfHostedFiles: false,
  },
  adjacentCountyIds: ["arapahoe"],
  countyScopeNote: "Douglas County only.",
  identifierPlaceholder: "8-character account number from county record",
  emptyIdentifierMessage:
    "Enter your account number from your Douglas County property record.",
  identifierNotFoundTemplate:
    "No parcel found for {tried}. Copy the 8-character account number from your Douglas property record (letters and digits, as shown on the county site).",
  situsSearchOffMessage:
    "Address search is not available. Enter your account number from the county record.",
};
