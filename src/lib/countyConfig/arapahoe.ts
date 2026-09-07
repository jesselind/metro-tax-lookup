// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Arapahoe County product config (wired county id `arapahoe`).
 *
 * Data only. Types: `./types.ts`. Registry: `./registry.ts`.
 * Canonical Assessor page URLs: `@/lib/arapahoeCountyUrls`.
 *
 * Shipping JSON: `public/data/arapahoe-*`. Methodology: Arapahoe `/sources` module.
 */

import {
  ARAPAHOE_ASSESSOR_BUSINESS_PERSONAL_PROPERTY_SEARCH,
  ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB,
  ARAPAHOE_ASSESSOR_PROPERTY_SEARCH,
  ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF,
} from "@/lib/arapahoeCountyUrls";
import type { CountyConfig } from "@/lib/countyConfig/types";

/**
 * First shipping county. 9-digit PIN, AIN comps/BPP PDFs, metro purpose rows,
 * and known comps FileDownload hosting gap.
 */
export const ARAPAHOE_COUNTY_CONFIG: CountyConfig = {
  id: "arapahoe",
  displayName: "Arapahoe County",
  dolaCertifyingCounty: "Arapahoe",
  identifierDigits: 9,
  identifierPasteMinDigits: 7,
  publicParcelId: {
    digits: 12,
    dashedPattern: /^\d{4}-\d{2}-\d-\d{2}-\d{3}$/,
  },
  hostAllowlist: [
    "parcelsearch.arapahoegov.com",
    "personalpropertysearch.arapahoegov.com",
    "arapahoe.co.publicsearch.us",
  ],
  urls: {
    levyAspx: {
      host: "parcelsearch.arapahoegov.com",
      pathSuffix: "/levy.aspx",
    },
    parcelRecord: {
      host: "parcelsearch.arapahoegov.com",
      path: "/PPINum.aspx",
      queryParam: "PPINum",
    },
    compsPdf: {
      host: "parcelsearch.arapahoegov.com",
      path: "/FileDownload.ashx",
      queryParam: "AIN",
    },
    bppAccountDetails: {
      host: "personalpropertysearch.arapahoegov.com",
      path: "/Details.aspx",
      queryParam: "AIN",
    },
    bppNoticeOfValuationPdf: {
      host: "personalpropertysearch.arapahoegov.com",
      path: "/FileDownload.ashx",
      queryParam: "AIN",
    },
    clerkRecorderSearch: {
      host: "arapahoe.co.publicsearch.us",
      path: "/results",
      extraQuery: {
        department: "RP",
        searchType: "quickSearch",
      },
      searchValueParam: "searchValue",
    },
  },
  residentLinks: {
    propertySearch: ARAPAHOE_ASSESSOR_PROPERTY_SEARCH,
    bppSearch: ARAPAHOE_ASSESSOR_BUSINESS_PERSONAL_PROPERTY_SEARCH,
    millLeviesHub: ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB,
    millLevyPublicInfoForm: ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF,
  },
  hostedPropertyPageName: "parcel record",
  features: {
    situs: true,
    parcelRecordShards: true,
    valuationHistoryShards: false,
    compsPdf: true,
    bpp: true,
    millsHistory: true,
    metroPurposes: true,
    priorYearValuesGap: true,
    priorYearValuesInProgress: false,
    dataMartRefreshGap: true,
    millPdfTaxDistrictGap: false,
  },
  knownFailures: {
    compsPdfHostedFiles: true,
  },
  adjacentCountyIds: ["douglas"],
  countyScopeNote: "Arapahoe County only.",
  identifierPlaceholder: "9-digit PIN or AIN from county record",
  emptyIdentifierMessage:
    "Enter your parcel PIN or AIN (digits from the county record).",
  identifierNotFoundTemplate:
    "No parcel found for {tried}. Copy the 9-digit PIN or the assessor AIN from your Arapahoe property record (dashes and spaces are OK).",
  situsSearchOffMessage:
    "Address search is not available. Enter your PIN or AIN from the county record.",
};
