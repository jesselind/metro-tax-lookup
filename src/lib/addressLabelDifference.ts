// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Split situs labels into tokens and mark tokens that are not shared by every
 * label in the set (unit ids, ST vs CT, etc.).
 */

export type AddressLabelSegment = {
  text: string;
  emphasize: boolean;
};

export type SitusEnvelopeLines = {
  /** Delivery line (number, street, unit). */
  streetLine: string;
  /** City / state / ZIP line after the street/city comma, when present. */
  localityLine: string | null;
};

/**
 * County situs labels are usually "STREET Unit X, CITY, ST ZIP". Split for a
 * two-line postage-style layout (street on top, city / state / ZIP below).
 */
export function splitSitusLabelEnvelopeLines(label: string): SitusEnvelopeLines {
  const trimmed = label.trim();
  if (!trimmed) {
    return { streetLine: "", localityLine: null };
  }
  const comma = trimmed.indexOf(", ");
  if (comma <= 0) {
    return { streetLine: trimmed, localityLine: null };
  }
  const streetLine = trimmed.slice(0, comma).trim();
  const localityRaw = trimmed.slice(comma + 2).trim();
  if (!streetLine || !localityRaw) {
    return { streetLine: trimmed, localityLine: null };
  }
  return {
    streetLine,
    localityLine: formatSitusLocalityEnvelopeLine(localityRaw),
  };
}

/**
 * City line as on mail: keep ", ST ZIP" when present; else append ", CO" for
 * city-only legacy labels. Requires a comma before the state (or a bare ST /
 * ST ZIP line) so names like "GREENWOOD VILLAGE" are not mistaken for a state.
 */
export function formatSitusLocalityEnvelopeLine(locality: string): string {
  const trimmed = locality.trim();
  if (!trimmed) return trimmed;
  if (
    /,\s*[A-Za-z]{2}(\s+\d{5}(-\d{4})?)?\s*$/.test(trimmed) ||
    /^[A-Za-z]{2}(\s+\d{5}(-\d{4})?)?\s*$/.test(trimmed)
  ) {
    return trimmed;
  }
  return `${trimmed}, CO`;
}

/**
 * Typeahead shows one row per place; ZIP+4 often differs by tax account at the
 * same situs. Strip the +4 extension for the suggestion only (chooser keeps full
 * labels).
 */
export function situsLabelForTypeaheadDisplay(label: string): string {
  return label.replace(/(\d{5})-\d{4}\b/g, "$1");
}

/**
 * Strip a trailing unit fragment (Apt 2, Unit 3B, #4, Ste 100) from one address
 * line. Same narrow tokens as simple-line parse — not a free-form suite regex.
 * Used for resident input parse and as the secondary typeahead place-sample
 * failsafe when street lines differ only by that suffix.
 */
export function stripTrailingUnitFragmentFromAddressLine(raw: string): {
  line: string;
  unit: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { line: "", unit: "" };
  // Named designators need a space before APT/UNIT/etc.; bare # may sit flush
  // against the street token (e.g. ST#4).
  const re =
    /^(.*?)(?:\s+(?:(?:APT|APARTMENT|UNIT|STE|SUITE)\s*[#.]?\s*)|\s*#)\s*([A-Za-z0-9/-]+)\s*$/i;
  const m = trimmed.match(re);
  if (!m || !m[1] || m[1].trim().length < 1) {
    return { line: trimmed, unit: "" };
  }
  return { line: m[1].trim(), unit: m[2].trim() };
}

function normalizeAddressLabelToken(token: string): string {
  return token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, "").toUpperCase();
}

function tokenizeAddressLabel(label: string): string[] {
  return label.trim().split(/\s+/).filter(Boolean);
}

/**
 * For each label, return whitespace-split segments with `emphasize` on tokens
 * that do not appear (normalized) in every label. Single-label or empty input
 * returns the full label with no emphasis.
 */
export function segmentAddressLabelsByDifference(
  labels: string[],
): AddressLabelSegment[][] {
  if (labels.length === 0) return [];
  if (labels.length === 1) {
    const only = labels[0]!;
    return [[{ text: only, emphasize: false }]];
  }

  const tokenLists = labels.map(tokenizeAddressLabel);
  const normalizedSets = tokenLists.map(
    (tokens) => new Set(tokens.map(normalizeAddressLabelToken)),
  );

  let common: Set<string> | null = null;
  for (const set of normalizedSets) {
    if (common == null) {
      common = new Set(set);
      continue;
    }
    for (const token of [...common]) {
      if (!set.has(token)) common.delete(token);
    }
  }
  const commonNorm = common ?? new Set<string>();

  return tokenLists.map((tokens) => {
    if (tokens.length === 0) {
      return [{ text: "", emphasize: false }];
    }
    return tokens.map((text) => ({
      text,
      emphasize: !commonNorm.has(normalizeAddressLabelToken(text)),
    }));
  });
}

export type SitusEnvelopeDisplayRow = SitusEnvelopeLines & {
  streetSegments: AddressLabelSegment[] | null;
};

/** Envelope lines for a label set, with difference marks on street tokens. */
export function buildSitusEnvelopeDisplayRows(
  labels: string[],
): SitusEnvelopeDisplayRow[] {
  const envelopes = labels.map(splitSitusLabelEnvelopeLines);
  const streetSegments =
    envelopes.length >= 2
      ? segmentAddressLabelsByDifference(envelopes.map((e) => e.streetLine))
      : null;
  return envelopes.map((envelope, index) => ({
    ...envelope,
    streetSegments: streetSegments?.[index] ?? null,
  }));
}
