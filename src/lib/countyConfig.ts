// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Shipping county: identifier rules, URL templates, host allowlist, feature
 * flags, DOLA certifying-county filter, and known county-data failures.
 * Campaign site / paid-for-by stays in siteConfig.ts.
 *
 * One frontend. Point this file (and the matching app JSON) at another county
 * to boot with honest holes. Do not load two JSON trees at runtime.
 */

import {
  ARAPAHOE_ASSESSOR_BUSINESS_PERSONAL_PROPERTY_SEARCH,
  ARAPAHOE_ASSESSOR_PROPERTY_SEARCH,
} from "@/lib/arapahoeCountyUrls";

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

export type CountyFeatures = {
  situs: boolean;
  /**
   * Lazy `{countyId}-parcel-record-by-pin` shards for Property details.
   * False: omit shard fetch (summary tiles / gap note only).
   */
  parcelRecordShards: boolean;
  compsPdf: boolean;
  bpp: boolean;
  millsHistory: boolean;
  metroPurposes: boolean;
  /**
   * COUNTY DATA GAP opt-in: Prior years missing badge + /sources prior-year note.
   * False: omit (do not reuse another county's story).
   */
  priorYearValuesGap: boolean;
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
  /** Home search note, e.g. "Arapahoe County only." */
  countyScopeNote: string;
  identifierPlaceholder: string;
  emptyIdentifierMessage: string;
  /** Use `{tried}` for the candidate id list. */
  identifierNotFoundTemplate: string;
  /** Shown when the resident searches by address and `features.situs` is off. */
  situsSearchOffMessage: string;
};

/** First shipping county file. Matches today's Arapahoe URLs, 9-digit PIN, and comps PDF hosting gap. */
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
  },
  hostedPropertyPageName: "parcel record",
  features: {
    situs: true,
    parcelRecordShards: true,
    compsPdf: true,
    bpp: true,
    millsHistory: true,
    metroPurposes: true,
    priorYearValuesGap: true,
    dataMartRefreshGap: true,
    millPdfTaxDistrictGap: false,
  },
  knownFailures: {
    compsPdfHostedFiles: true,
  },
  countyScopeNote: "Arapahoe County only.",
  identifierPlaceholder: "9-digit PIN or AIN from county record",
  emptyIdentifierMessage:
    "Enter your parcel PIN or AIN (digits from the county record).",
  identifierNotFoundTemplate:
    "No parcel found for {tried}. Copy the 9-digit PIN or the assessor AIN from your Arapahoe property record (dashes and spaces are OK).",
  situsSearchOffMessage:
    "Address search is not available. Enter your PIN or AIN from the county record.",
};

/** Douglas County (county 2). Mills from published tax-district PDF; no Levy.aspx. */
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
    compsPdf: false,
    bpp: false,
    millsHistory: false,
    metroPurposes: false,
    priorYearValuesGap: false,
    dataMartRefreshGap: false,
    millPdfTaxDistrictGap: true,
  },
  knownFailures: {
    compsPdfHostedFiles: false,
  },
  countyScopeNote: "Douglas County only.",
  identifierPlaceholder: "8-character account number from county record",
  emptyIdentifierMessage:
    "Enter your account number from your Douglas County property record.",
  identifierNotFoundTemplate:
    "No parcel found for {tried}. Copy the 8-character account number from your Douglas property record (letters and digits, as shown on the county site).",
  situsSearchOffMessage:
    "Address search is not available. Enter your account number from the county record.",
};

/** Wired counties keyed by id. Lookup resolves config + `{countyId}-*` JSON at runtime. */
export const COUNTY_CONFIG_BY_ID: Readonly<Record<string, CountyConfig>> = {
  arapahoe: ARAPAHOE_COUNTY_CONFIG,
  douglas: DOUGLAS_COUNTY_CONFIG,
};

export function countyConfigById(countyId: string): CountyConfig | null {
  const id = countyId.trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(COUNTY_CONFIG_BY_ID, id)) {
    return null;
  }
  return COUNTY_CONFIG_BY_ID[id] ?? null;
}

/** Wired counties in stable display order (footer, multi-county help). */
export function wiredCountyConfigs(): readonly CountyConfig[] {
  return Object.values(COUNTY_CONFIG_BY_ID);
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

/** Default county config until lookup resolves a county (Arapahoe-first UI paths). */
export const COUNTY_CONFIG: CountyConfig = ARAPAHOE_COUNTY_CONFIG;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function hostInAllowlist(host: string, allowlist: readonly string[]): boolean {
  const needle = host.trim().toLowerCase();
  if (!needle) return false;
  return allowlist.some((item) => item.toLowerCase() === needle);
}

function collectTemplateHosts(config: CountyConfig): string[] {
  const hosts: string[] = [config.urls.levyAspx.host, config.urls.parcelRecord.host];
  const queryTemplates = [
    config.urls.compsPdf,
    config.urls.bppAccountDetails,
    config.urls.bppNoticeOfValuationPdf,
  ];
  for (const template of queryTemplates) {
    if (template) hosts.push(template.host);
  }
  if (config.urls.clerkRecorderSearch) {
    hosts.push(config.urls.clerkRecorderSearch.host);
  }
  return hosts;
}

function validateParcelRecordUrlTemplate(
  template: CountyConfig["urls"]["parcelRecord"],
): string | null {
  if (!isNonEmptyString(template.host)) {
    return "county config: urls.parcelRecord.host required";
  }
  if (!isNonEmptyString(template.path)) {
    return "county config: urls.parcelRecord.path required";
  }
  if (template.style === "hashPath") {
    if (!isNonEmptyString(template.hashPathTemplate)) {
      return "county config: hashPath parcelRecord requires hashPathTemplate";
    }
    if (!template.hashPathTemplate.includes("{id}")) {
      return "county config: hashPathTemplate must include {id}";
    }
    if (
      template.hashPathTemplate.includes("{year}") &&
      !isNonEmptyString(template.year)
    ) {
      return "county config: hashPathTemplate {year} requires year on the template";
    }
    return null;
  }
  if (!isNonEmptyString(template.queryParam)) {
    return "county config: query parcelRecord requires queryParam";
  }
  return null;
}

/**
 * True when hostname is in the county host allowlist (case-insensitive).
 */
export function isCountyHostAllowed(
  hostname: string,
  config: CountyConfig = COUNTY_CONFIG,
): boolean {
  return hostInAllowlist(hostname, config.hostAllowlist);
}

/**
 * Config consistency. Does not fetch JSON and does not replace the app JSON
 * validators in appJsonValidate.ts. Returns a message or null when ok.
 */
export function validateCountyConfig(config: CountyConfig): string | null {
  if (!isNonEmptyString(config.id)) return "county config: id required";
  if (!isNonEmptyString(config.displayName)) {
    return "county config: displayName required";
  }
  if (!isNonEmptyString(config.dolaCertifyingCounty)) {
    return "county config: dolaCertifyingCounty required";
  }
  if (
    !Number.isInteger(config.identifierDigits) ||
    config.identifierDigits < 1
  ) {
    return "county config: identifierDigits must be a positive integer";
  }
  if (
    !Number.isInteger(config.identifierPasteMinDigits) ||
    config.identifierPasteMinDigits < 1
  ) {
    return "county config: identifierPasteMinDigits must be a positive integer";
  }
  if (config.identifierPasteMinDigits > config.identifierDigits) {
    return "county config: identifierPasteMinDigits cannot exceed identifierDigits";
  }
  if (config.publicParcelId) {
    if (
      !Number.isInteger(config.publicParcelId.digits) ||
      config.publicParcelId.digits < 1
    ) {
      return "county config: publicParcelId.digits must be a positive integer";
    }
  }
  if (config.hostAllowlist.length === 0) {
    return "county config: hostAllowlist must not be empty";
  }
  for (const host of collectTemplateHosts(config)) {
    if (!hostInAllowlist(host, config.hostAllowlist)) {
      return `county config: host ${host} is not in hostAllowlist`;
    }
  }
  const parcelRecordTemplateError = validateParcelRecordUrlTemplate(
    config.urls.parcelRecord,
  );
  if (parcelRecordTemplateError) return parcelRecordTemplateError;
  if (!isNonEmptyString(config.hostedPropertyPageName)) {
    return "county config: hostedPropertyPageName required";
  }
  if (config.features.compsPdf && !config.urls.compsPdf) {
    return "county config: features.compsPdf requires urls.compsPdf";
  }
  if (config.features.bpp) {
    if (!config.urls.bppAccountDetails || !config.urls.bppNoticeOfValuationPdf) {
      return "county config: features.bpp requires BPP URL templates";
    }
    if (!config.residentLinks.bppSearch) {
      return "county config: features.bpp requires residentLinks.bppSearch";
    }
  }
  if (config.knownFailures.compsPdfHostedFiles && !config.features.compsPdf) {
    return "county config: compsPdfHostedFiles failure requires features.compsPdf";
  }
  if (!isNonEmptyString(config.countyScopeNote)) {
    return "county config: countyScopeNote required";
  }
  if (!isNonEmptyString(config.identifierPlaceholder)) {
    return "county config: identifierPlaceholder required";
  }
  if (!isNonEmptyString(config.residentLinks.propertySearch)) {
    return "county config: residentLinks.propertySearch required";
  }
  if (!isNonEmptyString(config.emptyIdentifierMessage)) {
    return "county config: emptyIdentifierMessage required";
  }
  if (!isNonEmptyString(config.situsSearchOffMessage)) {
    return "county config: situsSearchOffMessage required";
  }
  if (!config.identifierNotFoundTemplate.includes("{tried}")) {
    return "county config: identifierNotFoundTemplate must include {tried}";
  }
  return null;
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

const shippingCountyConfigError = validateCountyConfig(ARAPAHOE_COUNTY_CONFIG);
if (shippingCountyConfigError) {
  throw new Error(shippingCountyConfigError);
}

const douglasCountyConfigError = validateCountyConfig(DOUGLAS_COUNTY_CONFIG);
if (douglasCountyConfigError) {
  throw new Error(douglasCountyConfigError);
}
