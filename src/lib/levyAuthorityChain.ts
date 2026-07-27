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
  /**
   * Optional in-place definition for one word in {@link title}: opens a brief
   * popover (not a jump to the modal footer). `titleTermMatch` is the exact
   * word to make the trigger; `titleTermId` must be listed in the JSON
   * `allowedInlineTermIds` field.
   */
  titleTermId?: string;
  titleTermMatch?: string;
  body: string;
  /**
   * Same as {@link titleTermId}/{@link titleTermMatch}, but for one word in
   * {@link body}.
   */
  bodyTermId?: string;
  bodyTermMatch?: string;
  facts: LevyAuthorityChainFact[];
};

export type LevyAuthorityChainOpenGap = {
  id: string;
  body: string;
};

export type LevyAuthorityChainMatch = LevyEntryMatchKeys;

export type LevyAuthorityChainEntry = {
  id: string;
  match: LevyAuthorityChainMatch;
  heading: string;
  summary: string;
  /** Optional linked attribution whose text must appear verbatim in `summary`. */
  summarySource?: LevyAuthorityChainLink;
  steps: LevyAuthorityChainStep[];
  openGaps: LevyAuthorityChainOpenGap[];
};

type LevyAuthorityChainFile = {
  version: number;
  prototypeNote?: string;
  /**
   * Glossary brief ids allowed on step title/body. Single source of truth for
   * the UI allowlist and `validate:levy-authority-chain`.
   */
  allowedInlineTermIds: string[];
  entries: LevyAuthorityChainEntry[];
};

const file = raw as LevyAuthorityChainFile;

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

export const LEVY_AUTHORITY_CHAIN_ENTRIES: LevyAuthorityChainEntry[] =
  file.entries;

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
