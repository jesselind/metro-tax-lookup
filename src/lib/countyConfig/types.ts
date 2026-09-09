// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Shared TypeScript shapes for wired-county product config.
 *
 * County *data* (Arapahoe, Douglas, …) lives in sibling files such as
 * `arapahoe.ts` / `douglas.ts`. This module is types only — no URLs, no flags.
 *
 * Maintainer overview: `src/lib/countyConfig/README.md` and `docs/county-config.md`.
 */

/** Hosted query deep link: `https://{host}{path}?{queryParam}={id}`. */
export type CountyHostedQueryTemplate = {
  host: string;
  path: string;
  queryParam: string;
};

/**
 * County official property page deep link.
 * - `query` (default): `https://{host}{path}?{queryParam}={id}` (Arapahoe PPINum).
 * - `hashPath`: `https://{host}{path}#{hashPathTemplate}` with `{id}` / optional `{year}`
 *   (Douglas `#/details/{year}/{id}`).
 */
export type CountyParcelRecordUrlTemplate =
  | (CountyHostedQueryTemplate & { style?: "query" })
  | {
      style: "hashPath";
      host: string;
      /** Path before the hash (e.g. `/assessor/web/`). */
      path: string;
      /**
       * Hash path after `#`. Must include `{id}`. Include `{year}` when the county
       * SPA needs a year segment; fill from `year` (or a call-site override).
       */
      hashPathTemplate: string;
      /**
       * Year for `{year}` in `hashPathTemplate` when the SPA path needs one.
       * Maintainer stamp for this county data drop / SPA path — update when the
       * county details URL year changes. Not a Colorado statute invent.
       */
      year?: string;
    };

export type CountyLevyAspxAllowlist = {
  host: string;
  /** Pathname must end with this (case-insensitive), e.g. `/levy.aspx`. */
  pathSuffix: string;
};

export type CountyClerkRecorderSearchTemplate = {
  host: string;
  path: string;
  extraQuery: Record<string, string>;
  searchValueParam: string;
};

/** Public parcel id used in county URLs (Arapahoe AIN). Null = id-only accounts. */
export type CountyPublicParcelId = {
  digits: number;
  dashedPattern: RegExp;
};

/**
 * Layer-1 product sources and Layer-2 gap / in-progress opt-ins.
 * See `docs/county-config.md` (three layers). False on a product flag omits the control.
 */
export type CountyFeatures = {
  situs: boolean;
  /**
   * Lazy `{countyId}-parcel-record-by-pin` shards for Property details.
   * False: omit shard fetch (summary tiles / gap note only).
   */
  parcelRecordShards: boolean;
  /**
   * Lazy `{countyId}-valuation-history-by-account` shards (Douglas Realware
   * detail extract). False: omit valuation-history fetch.
   */
  valuationHistoryShards: boolean;
  compsPdf: boolean;
  bpp: boolean;
  millsHistory: boolean;
  /**
   * Metro purpose-row product (ops/debt/other). When on, also set
   * `residentLinks.millLevyPublicInfoForm`, `millLevyPublicInfoFormLabel`,
   * `millLeviesHub`, and `millLeviesHubLabel` (validated). Load purpose JSON
   * via `metroPurposesFileForCounty` for the resolved county only.
   */
  metroPurposes: boolean;
  /**
   * COUNTY DATA GAP opt-in: Prior years missing badge + /sources prior-year note.
   * False: omit (do not reuse another county's story). Copy is county-keyed in
   * `countyPriorYearValuesGapNote.tsx` (Arapahoe vs Douglas differ).
   * Mutually exclusive with {@link CountyFeatures.priorYearValuesInProgress}.
   */
  priorYearValuesGap: boolean;
  /**
   * IN PROGRESS opt-in: sky **Coming soon** badge + /sources soft note while we
   * are still tracking down bulk prior-year assessed values (not a confirmed
   * COUNTY DATA GAP). Mutually exclusive with priorYearValuesGap.
   */
  priorYearValuesInProgress: boolean;
  /**
   * COUNTY DATA GAP opt-in: Assessor Data Mart incomplete-refresh callout.
   * Arapahoe-only today; false for counties that do not use that mart export.
   */
  dataMartRefreshGap: boolean;
  /**
   * COUNTY DATA GAP opt-in: mill PDF missing some tax-district numbers.
   */
  millPdfTaxDistrictGap: boolean;
};

export type CountyFeatureKey = keyof CountyFeatures;

/**
 * show: render the feature.
 * omit: county never had a source; hide the control.
 * gap: we have a source and the county hosting failed; COUNTY DATA GAP.
 */
export type CountyFeaturePresentation = "show" | "omit" | "gap";

export type CountyKnownFailures = {
  compsPdfHostedFiles: boolean;
};

/**
 * One wired county's product config: identifiers, URL templates, feature flags,
 * gap opt-ins, and resident-facing search copy.
 *
 * Pair with `{countyId}-*` JSON under `public/data/` and a `/sources` methodology
 * module. Do not copy another county's gaps or purpose JSON.
 */
export type CountyConfig = {
  id: string;
  displayName: string;
  /** DOLA Property Tax Entities certifying-county filter. */
  dolaCertifyingCounty: string;
  /** Account-id length in the pin map (`pinDigits` on the account JSON). */
  identifierDigits: number;
  /** Short pastes still treated as an account id (Arapahoe PIN without leading zeros). */
  identifierPasteMinDigits: number;
  /**
   * When true, account ids may include letters (Douglas `C0123456` style).
   * Lookup normalizes to uppercase; digit-only padding rules do not apply.
   */
  identifierAllowsLetters?: boolean;
  publicParcelId: CountyPublicParcelId | null;
  /** Hosts allowed in constructed or validated county hrefs. */
  hostAllowlist: readonly string[];
  urls: {
    levyAspx: CountyLevyAspxAllowlist;
    parcelRecord: CountyParcelRecordUrlTemplate;
    compsPdf?: CountyHostedQueryTemplate;
    bppAccountDetails?: CountyHostedQueryTemplate;
    bppNoticeOfValuationPdf?: CountyHostedQueryTemplate;
    clerkRecorderSearch?: CountyClerkRecorderSearchTemplate;
  };
  residentLinks: {
    propertySearch: string;
    bppSearch?: string;
    /**
     * Assessor mill-levies hub (resident cite) when `features.metroPurposes` is on.
     * Required by `validateCountyConfig` for that flag.
     */
    millLeviesHub?: string;
    /** Visible hub link label when `millLeviesHub` is set (metro purposes cite). */
    millLeviesHubLabel?: string;
    /**
     * Primary mill-purpose source PDF (Public Info Form, Abstract, etc.) when
     * `features.metroPurposes` is on. Required by `validateCountyConfig` for that flag.
     */
    millLevyPublicInfoForm?: string;
    /** Visible PDF link label when `millLevyPublicInfoForm` is set. */
    millLevyPublicInfoFormLabel?: string;
  };
  /**
   * Resident phrase for the county's official property page (lowercase), used in
   * button labels such as "Open county {hostedPropertyPageName}".
   * Arapahoe: "parcel record". Douglas: "property details".
   */
  hostedPropertyPageName: string;
  /** Sources this county has. False omits the control (never had a source). */
  features: CountyFeatures;
  /**
   * Known county hosting/export failures for features that exist.
   * compsPdfHostedFiles: COUNTY DATA GAP on the comps tile (not omit).
   */
  knownFailures: CountyKnownFailures;
  /**
   * Wired neighbor county ids for address/account search fallback after a miss
   * in this county (county search gate tier 2). Curated shared-border / metro
   * adjacency only — never alphabetical fill. Empty until neighbors ship.
   */
  adjacentCountyIds: readonly string[];
  /** Home search note, e.g. "Arapahoe County only." */
  countyScopeNote: string;
  identifierPlaceholder: string;
  emptyIdentifierMessage: string;
  /** Use `{tried}` for the candidate id list. */
  identifierNotFoundTemplate: string;
  /** Shown when the resident searches by address and `features.situs` is off. */
  situsSearchOffMessage: string;
};
