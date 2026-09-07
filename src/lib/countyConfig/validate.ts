// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Consistency checks for {@link CountyConfig} records.
 *
 * Does **not** fetch JSON and does **not** replace `appJsonValidate.ts`.
 * Call `validateCountyConfig` on each county file; call
 * `validateWiredCountyAdjacency` once the registry map is complete.
 *
 * This module must not import the registry (avoids circular boot).
 */

import type { CountyConfig } from "@/lib/countyConfig/types";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function hostInAllowlist(host: string, allowlist: readonly string[]): boolean {
  const needle = host.trim().toLowerCase();
  if (!needle) return false;
  return allowlist.some((item) => item.toLowerCase() === needle);
}

function collectTemplateHosts(config: CountyConfig): string[] {
  const hosts: string[] = [
    config.urls.levyAspx.host,
    config.urls.parcelRecord.host,
  ];
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
  config: CountyConfig,
): boolean {
  return hostInAllowlist(hostname, config.hostAllowlist);
}

/**
 * Config consistency for one county record.
 * Returns an error message, or `null` when ok.
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
  if (config.features.metroPurposes) {
    if (!isNonEmptyString(config.residentLinks.millLevyPublicInfoForm)) {
      return "county config: features.metroPurposes requires residentLinks.millLevyPublicInfoForm";
    }
    if (!isNonEmptyString(config.residentLinks.millLeviesHub)) {
      return "county config: features.metroPurposes requires residentLinks.millLeviesHub";
    }
  }
  if (config.knownFailures.compsPdfHostedFiles && !config.features.compsPdf) {
    return "county config: compsPdfHostedFiles failure requires features.compsPdf";
  }
  if (
    config.features.priorYearValuesGap &&
    config.features.priorYearValuesInProgress
  ) {
    return "county config: priorYearValuesGap and priorYearValuesInProgress are mutually exclusive";
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
  if (!Array.isArray(config.adjacentCountyIds)) {
    return "county config: adjacentCountyIds must be an array";
  }
  const seenAdjacent = new Set<string>();
  for (const rawId of config.adjacentCountyIds) {
    if (!isNonEmptyString(rawId)) {
      return "county config: adjacentCountyIds entries must be non-empty strings";
    }
    const neighborId = rawId.trim().toLowerCase();
    if (neighborId === config.id.trim().toLowerCase()) {
      return "county config: adjacentCountyIds must not include self";
    }
    if (seenAdjacent.has(neighborId)) {
      return `county config: adjacentCountyIds duplicate ${neighborId}`;
    }
    seenAdjacent.add(neighborId);
  }
  return null;
}

/**
 * Cross-registry check: every `adjacentCountyIds` entry must be a wired county.
 * Pass the completed `COUNTY_CONFIG_BY_ID` map (do not default-import the registry here).
 */
export function validateWiredCountyAdjacency(
  byId: Readonly<Record<string, CountyConfig>>,
): string | null {
  for (const config of Object.values(byId)) {
    for (const rawId of config.adjacentCountyIds) {
      const neighborId = rawId.trim().toLowerCase();
      if (!Object.prototype.hasOwnProperty.call(byId, neighborId)) {
        return `county config: ${config.id} adjacentCountyIds unknown id ${neighborId}`;
      }
    }
  }
  return null;
}
