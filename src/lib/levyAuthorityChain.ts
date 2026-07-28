// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import raw from "../../public/data/levy-authority-chain-entries.json";
import {
  findFirstMatchingLevyEntry,
  type LevyEntryLookupContext,
  type LevyEntryMatchKeys,
} from "@/lib/levyEntryMatch";
import {
  buildLevyAuthorityChainEntry,
  type LevyAuthorityChainEntryRecord,
} from "@/lib/levyAuthorityChainBuild";

export type LevyAuthorityChainLink = {
  text: string;
  url: string;
};

export type LevyAuthorityChainFact = {
  label: string;
  value: string;
  sources: LevyAuthorityChainLink[];
};

export type LevyAuthorityChainStep = {
  id: string;
  title: string;
  titleTermId?: string;
  titleTermMatch?: string;
  body: string;
  bodyTermId?: string;
  bodyTermMatch?: string;
  facts: LevyAuthorityChainFact[];
};

export type LevyAuthorityChainOpenGap = {
  id: string;
  body: string;
};

export type LevyAuthorityChainMatch = LevyEntryMatchKeys;

/** Built view model for {@link LevyAuthorityChainSection}. */
export type LevyAuthorityChainEntry = {
  id: string;
  match: LevyAuthorityChainMatch;
  heading: string;
  summary: string;
  summarySource?: LevyAuthorityChainLink;
  summaryTermId?: string;
  summaryTermMatch?: string;
  steps: LevyAuthorityChainStep[];
  openGaps: LevyAuthorityChainOpenGap[];
};

type LevyAuthorityChainFileV2 = {
  version: number;
  prototypeNote?: string;
  allowedInlineTermIds: string[];
  entries: LevyAuthorityChainEntryRecord[];
};

const file = raw as LevyAuthorityChainFileV2;

function readAllowedInlineTermIds(ids: unknown): readonly string[] {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error(
      "levy-authority-chain-entries.json: allowedInlineTermIds must be a non-empty array",
    );
  }
  const out: string[] = [];
  for (const id of ids) {
    if (typeof id !== "string" || !id.trim()) {
      throw new Error(
        "levy-authority-chain-entries.json: allowedInlineTermIds must be non-empty strings",
      );
    }
    out.push(id);
  }
  return out;
}

/**
 * From `allowedInlineTermIds` in `levy-authority-chain-entries.json`.
 * Do not hard-code a second copy in the validator or UI.
 */
export const LEVY_AUTHORITY_CHAIN_INLINE_TERM_IDS = readAllowedInlineTermIds(
  file.allowedInlineTermIds,
);

export function isLevyAuthorityChainInlineTermId(id: string): boolean {
  return LEVY_AUTHORITY_CHAIN_INLINE_TERM_IDS.includes(id);
}

/** Structured records from JSON (facts only; prose is templated). */
export const LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS: LevyAuthorityChainEntryRecord[] =
  file.entries;

/**
 * Resident-facing entries built from structured JSON + shared templates.
 * Used by the UI and e2e (expected copy is deterministic from records + templates).
 */
export const LEVY_AUTHORITY_CHAIN_ENTRIES: LevyAuthorityChainEntry[] =
  LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS.map(buildLevyAuthorityChainEntry);

export type LevyAuthorityChainLookupContext = LevyEntryLookupContext;

/**
 * Same order as levy explainer: line code, then LG ID + label (when JSON omits
 * `levyLineCode`), then source TAG id, then `labelContainsAll` only.
 * Label-only skips entries that already declare a keyed match (code / LG / TAG).
 */
export function findLevyAuthorityChainEntry(
  authorityLabel: string,
  options?: LevyAuthorityChainLookupContext,
): LevyAuthorityChainEntry | null {
  return findFirstMatchingLevyEntry(
    LEVY_AUTHORITY_CHAIN_ENTRIES,
    authorityLabel,
    { ...options, skipKeyedEntriesOnLabelOnly: true },
  );
}
