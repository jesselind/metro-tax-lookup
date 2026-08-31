// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Multi-PIN situs chooser helpers: one street address can map to several county
 * accounts (condo units, Real land/buildings, and business personal property at
 * the same situs). Used after place-level typeahead / Search returns N>1 hits.
 */

import type { ParcelGlossaryTermId } from "@/content/termDefinitionBodies";
import {
  splitSitusLabelEnvelopeLines,
  stripTrailingUnitFragmentFromAddressLine,
} from "@/lib/addressLabelDifference";
import type { CountyPinToTagFile } from "@/lib/countyParcelLevyData";
import type { CountySitusPinHit } from "@/lib/situsIndexLookup";

/** Resident-facing account kind for the multi-match list. */
export type SitusPinAccountKind =
  | "real_property"
  | "business_personal"
  | "other";

/**
 * Map Main Parcel `PropertyClassDescr` (on pin-to-tag) to chooser kind.
 * Personal → business personal property; Real/Improvement → real property.
 * Tax roll is not on pin-to-tag today; class is the available trigger.
 */
export function classifySitusPinAccountKind(
  propertyClassDescr: string | null | undefined,
): SitusPinAccountKind {
  const raw = (propertyClassDescr ?? "").trim().toUpperCase();
  if (raw === "PERSONAL" || raw === "PERSPROP") {
    return "business_personal";
  }
  if (raw === "REAL" || raw === "IMPROVEMENT") {
    return "real_property";
  }
  return "other";
}

/**
 * True for business personal property accounts.
 * Prefer `taxRollDescr` when the parcel-record shard is loaded; otherwise fall
 * back to `propertyClassDescr` (pin-to-tag / summary) so summary tiles can hide
 * Real-only chrome before the shard arrives.
 */
export function isBusinessPersonalPropertyAccount(fields: {
  taxRollDescr?: string | null;
  propertyClassDescr?: string | null;
}): boolean {
  const taxRoll = (fields.taxRollDescr ?? "").trim().toUpperCase();
  if (taxRoll === "PERSONAL") return true;
  if (taxRoll.length > 0) return false;
  return (
    classifySitusPinAccountKind(fields.propertyClassDescr) ===
    "business_personal"
  );
}

/** Short label for the chooser row (county BPP wording for Personal). */
export function formatSitusPinAccountKindLabel(
  kind: SitusPinAccountKind,
  propertyClassDescr?: string | null,
): string {
  if (kind === "business_personal") {
    return "Business personal property";
  }
  if (kind === "real_property") {
    return "Real property";
  }
  const t = (propertyClassDescr ?? "").trim();
  return t || "Other account";
}

/** Parcel glossary popover id when the account kind has a brief definition. */
export function situsAccountKindGlossaryTermId(
  kind: SitusPinAccountKind,
): ParcelGlossaryTermId | null {
  if (kind === "real_property") return "term-real-property";
  if (kind === "business_personal") return "term-business-personal-property";
  return null;
}

/**
 * Dashboard **Switch account type**: true only when the situs has both real
 * property and business personal property. All-Real multi (condo units, etc.)
 * and other+BPP mixes must not get the control.
 */
export function situsShouldOfferAccountTypeSwitch(
  enrichedHits:
    | ReadonlyArray<{ accountKind: SitusPinAccountKind }>
    | null
    | undefined,
): boolean {
  if (enrichedHits == null || enrichedHits.length < 2) return false;
  let hasRealProperty = false;
  let hasBusinessPersonal = false;
  for (const h of enrichedHits) {
    if (h.accountKind === "real_property") {
      hasRealProperty = true;
    } else if (h.accountKind === "business_personal") {
      hasBusinessPersonal = true;
    }
    if (hasRealProperty && hasBusinessPersonal) return true;
  }
  return false;
}

export type EnrichedSitusPinHit = CountySitusPinHit & {
  accountKind: SitusPinAccountKind;
  accountKindLabel: string;
  ownerList: string | null;
  totalActual: number | null;
  totalAssessed: number | null;
  propertyClassDescr: string | null;
};

/**
 * Join situs hits to pin-to-tag for the multi-match list.
 *
 * Sort: account kind (Real, other, BPP). Then:
 * - Real+BPP places: actual value descending (primary building above equipment),
 *   then PIN — same product rule as before.
 * - Otherwise (e.g. all-Real condo units): label ascending, then PIN, so units
 *   read in address order instead of by market value.
 */
export function enrichSitusPinHitsForChooser(
  hits: CountySitusPinHit[],
  pinToTag: CountyPinToTagFile | null | undefined,
): EnrichedSitusPinHit[] {
  const byPin = pinToTag?.byPin;
  const enriched: EnrichedSitusPinHit[] = hits.map((h) => {
    const row = byPin?.[h.pin];
    const propertyClassDescr = row?.propertyClassDescr ?? null;
    const accountKind = classifySitusPinAccountKind(propertyClassDescr);
    return {
      ...h,
      accountKind,
      accountKindLabel: formatSitusPinAccountKindLabel(
        accountKind,
        propertyClassDescr,
      ),
      ownerList: row?.ownerList?.trim() || null,
      totalActual:
        typeof row?.totalActual === "number" && Number.isFinite(row.totalActual)
          ? row.totalActual
          : null,
      totalAssessed:
        typeof row?.totalAssessed === "number" &&
        Number.isFinite(row.totalAssessed)
          ? row.totalAssessed
          : null,
      propertyClassDescr,
    };
  });

  const kindRank = (k: SitusPinAccountKind): number => {
    if (k === "real_property") return 0;
    if (k === "other") return 1;
    return 2;
  };

  /** Same Real+BPP truth as `situsPlaceHasRealAndBusinessPersonal` / account switch. */
  const sortByValue = situsShouldOfferAccountTypeSwitch(enriched);

  enriched.sort((a, b) => {
    const kr = kindRank(a.accountKind) - kindRank(b.accountKind);
    if (kr !== 0) return kr;
    if (sortByValue) {
      const av = a.totalActual ?? -1;
      const bv = b.totalActual ?? -1;
      if (bv !== av) return bv - av;
    } else {
      const lr = a.label.localeCompare(b.label);
      if (lr !== 0) return lr;
    }
    return a.pin.localeCompare(b.pin);
  });

  return enriched;
}

/**
 * Shared Real+BPP gate for chooser chrome and typeahead place samples.
 * Same truth as `situsShouldOfferAccountTypeSwitch` after pin-to-tag enrich.
 * False when pin-to-tag is missing (cannot confirm) or hits are not Real+BPP.
 */
export function situsPlaceHasRealAndBusinessPersonal(
  hits: ReadonlyArray<CountySitusPinHit>,
  pinToTag: CountyPinToTagFile | null | undefined,
): boolean {
  if (hits.length < 2 || pinToTag == null) return false;
  return situsShouldOfferAccountTypeSwitch(
    enrichSitusPinHitsForChooser([...hits], pinToTag),
  );
}

/**
 * Pick one typeahead sample label for a place with many PINs.
 * Prefers the most common full label (so a shared ZIP+4 wins over a singleton),
 * then labels without a unit token, then shortest, then first.
 */
export function pickSitusPlaceSampleLabel(
  hits: CountySitusPinHit[],
): string {
  if (hits.length === 0) return "";
  if (hits.length === 1) return hits[0]!.label;

  const counts = new Map<string, number>();
  for (const h of hits) {
    counts.set(h.label, (counts.get(h.label) ?? 0) + 1);
  }

  let best = hits[0]!;
  let bestCount = counts.get(best.label) ?? 0;
  const hasUnit = (label: string) => /\bunit\b/i.test(label);

  for (const h of hits) {
    const c = counts.get(h.label) ?? 0;
    if (c > bestCount) {
      best = h;
      bestCount = c;
      continue;
    }
    if (c < bestCount) continue;
    const bestUnit = hasUnit(best.label);
    const hUnit = hasUnit(h.label);
    if (bestUnit && !hUnit) {
      best = h;
      continue;
    }
    if (bestUnit === hUnit && h.label.length < best.label.length) {
      best = h;
    }
  }
  return best.label;
}

/**
 * Typeahead / did-you-mean place caption.
 *
 * Primary: Real+BPP (shared with chooser) → never strip units; use
 * `pickSitusPlaceSampleLabel`.
 * Secondary: when street lines differ only by a trailing unit fragment, show the
 * agreed street-only line (plus locality from the baseline sample). Broadway
 * look-alikes keep identical street lines so this path no-ops without pin-to-tag.
 */
export function pickSitusPlaceSampleLabelForTypeahead(
  hits: CountySitusPinHit[],
  pinToTag?: CountyPinToTagFile | null,
): string {
  const baseline = pickSitusPlaceSampleLabel(hits);
  if (hits.length < 2) return baseline;

  if (situsPlaceHasRealAndBusinessPersonal(hits, pinToTag)) {
    return baseline;
  }

  const streetLines = hits.map(
    (h) => splitSitusLabelEnvelopeLines(h.label).streetLine,
  );
  const uniqueStreets = new Set(streetLines.filter(Boolean));
  if (uniqueStreets.size <= 1) {
    return baseline;
  }

  const strippedStreets = streetLines.map(
    (street) => stripTrailingUnitFragmentFromAddressLine(street).line,
  );
  const agreed = strippedStreets[0] ?? "";
  if (!agreed || !strippedStreets.every((s) => s === agreed)) {
    return baseline;
  }

  const { localityLine } = splitSitusLabelEnvelopeLines(baseline);
  if (localityLine) {
    return `${agreed}, ${localityLine}`;
  }
  return agreed;
}
