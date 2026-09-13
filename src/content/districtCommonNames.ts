// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Curated resident common names for DOLA legal Contact titles.
 * Key = LG ID digits (same id as directory / bill join). Add a row only when
 * the legal name and the everyday name differ enough to confuse residents.
 * Contact keeps the legal name; UI shows the gloss line only when lookup returns.
 */

export type DistrictCommonNameEntry = {
  /** Everyday name residents recognize (not a replacement for the legal title). */
  commonName: string;
  /**
   * Optional second sentence after "Also known as {commonName}."
   * Keep short; resident voice; no em dashes.
   */
  gloss?: string;
};

const BY_LG_ID: Record<string, DistrictCommonNameEntry> = {
  "64907": {
    commonName: "Aurora Public Schools",
    gloss:
      "In the legal name, J means joint: the district covers parts of both Adams and Arapahoe counties.",
  },
};

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Digits-only LG ID, zero-padded to 5 when short (matches Contact compare). */
export function normalizeDistrictCommonNameLgId(
  raw: string | null | undefined,
): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  const digits = t.replace(/\D/g, "");
  if (!digits) return null;
  return digits.length <= 5 ? digits.padStart(5, "0") : digits;
}

/**
 * Resident gloss under Contact when a curated common name differs from the
 * legal title shown. Null when unknown LG ID, missing legal name, or names match.
 */
export function districtCommonNameGloss(args: {
  lgId: string | null | undefined;
  legalName: string | null | undefined;
}): { commonName: string; line: string } | null {
  const lgKey = normalizeDistrictCommonNameLgId(args.lgId);
  if (!lgKey) return null;
  const entry = BY_LG_ID[lgKey];
  if (!entry) return null;

  const legal = (args.legalName ?? "").trim();
  if (!legal) return null;
  if (normalizeName(entry.commonName) === normalizeName(legal)) return null;

  const line = entry.gloss
    ? `Also known as ${entry.commonName}. ${entry.gloss}`
    : `Also known as ${entry.commonName}.`;
  return { commonName: entry.commonName, line };
}
