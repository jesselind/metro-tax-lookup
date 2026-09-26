// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import raw from "../../public/data/levy-authority-chain-entries.json";
import {
  buildLevyAuthorityChainEntry,
  type LevyAuthorityChainEntryRecord,
} from "@/lib/levyAuthorityChainBuild";
import {
  formatHomeLastYearMillsPercentChange,
  selectMetroAuthorityMillsChangeBlocks,
} from "@/lib/authorityMillsChangeBlocks";
import { authorityMillsSeries } from "@/lib/authorityMillsHistory";
import {
  crossCountyAuthorityById,
  findCrossCountyAuthorityByCountyLevyCode,
  findCrossCountyAuthorityByLevyCode,
  levyLineCodeForCrossCountyAuthority,
  type CrossCountyAuthorityRegistryRow,
} from "@/lib/crossCountyAuthorityRegistry";
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
  /** Optional in-place glossary gloss on {@link value}. */
  valueTermId?: string;
  valueTermMatch?: string;
};

export type LevyAuthorityChainInlineTerm = {
  termId: string;
  match: string;
};

export type LevyAuthorityChainStep = {
  id: string;
  title: string;
  titleTermId?: string;
  titleTermMatch?: string;
  body: string;
  bodyTermId?: string;
  bodyTermMatch?: string;
  /** Additional body glosses after {@link bodyTermId} (non-overlapping matches). */
  bodyTerms?: LevyAuthorityChainInlineTerm[];
  /**
   * Optional nested disclosure under the step body (collapsed by default).
   * Used for AI English of a Spanish sample ballot.
   */
  bodyDisclosure?: {
    label: string;
    body: string;
  };
  /**
   * Optional in-body link (e.g. English-not-located sentence → file library hub).
   * `match` must appear in {@link body}.
   */
  bodyLink?: {
    match: string;
    url: string;
  };
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
  /**
   * Ballot Issue phrases in the always-visible summary. Derived from measures
   * (ballot text / next-best hub). Bold always; link when a URL is present.
   */
  summaryIssueMarks?: LevyAuthorityChainSummaryIssueMark[];
  steps: LevyAuthorityChainStep[];
  openGaps: LevyAuthorityChainOpenGap[];
};

/** One summary highlight for a ballot issue name (e.g. "Ballot Issue 1A"). */
export type LevyAuthorityChainSummaryIssueMark = {
  match: string;
  /** Ballot text or next-best hub; omit to bold without a link. */
  url?: string;
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
  LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS.map((record) =>
    buildLevyAuthorityChainEntry(record),
  );

export type LevyAuthorityChainLookupContext = LevyEntryLookupContext;

function residentCountyIdForRegistryRow(
  registryRow: CrossCountyAuthorityRegistryRow,
  levyLineCode: string,
  countyId?: string,
): string | undefined {
  const explicit = countyId?.trim();
  if (explicit) return explicit;
  const code = levyLineCode.trim().toUpperCase();
  for (const [wiredCountyId, countyCode] of Object.entries(
    registryRow.levyLineCodeByCounty,
  )) {
    if (countyCode.trim().toUpperCase() === code) {
      return wiredCountyId;
    }
  }
  return undefined;
}

function buildAuthorityChainEntryForRecord(
  record: LevyAuthorityChainEntryRecord,
  residentCountyId?: string,
  stackAuthorityLabel?: string,
): LevyAuthorityChainEntry {
  return buildLevyAuthorityChainEntry(record, {
    residentCountyId,
    stackAuthorityLabel,
  });
}

function findAuthorityChainRecordByRegistryId(
  registryId: string,
): LevyAuthorityChainEntryRecord | null {
  for (const record of LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS) {
    if (record.match.registryId?.trim() === registryId) {
      return record;
    }
  }
  const registryRow = crossCountyAuthorityById(registryId);
  const chainEntryId = registryRow?.authorityChainEntryId?.trim();
  if (!chainEntryId) return null;
  return (
    LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS.find(
      (record) => record.id === chainEntryId,
    ) ?? null
  );
}

/**
 * Same order as levy explainer: line code, then LG ID + label (when JSON omits
 * `levyLineCode`), then source TAG id, then `labelContainsAll` only.
 * Label-only skips entries that already declare a keyed match (code / LG / TAG).
 */
export function findLevyAuthorityChainEntry(
  authorityLabel: string,
  options?: LevyAuthorityChainLookupContext,
): LevyAuthorityChainEntry | null {
  const code = options?.levyLineCode?.trim().toUpperCase() ?? "";
  if (code) {
    const registryRow = options?.countyId
      ? findCrossCountyAuthorityByCountyLevyCode(options.countyId, code)
      : findCrossCountyAuthorityByLevyCode(code);
    if (registryRow) {
      const record = findAuthorityChainRecordByRegistryId(registryRow.id);
      if (record) {
        const residentCountyId = residentCountyIdForRegistryRow(
          registryRow,
          code,
          options?.countyId,
        );
        return buildAuthorityChainEntryForRecord(
          record,
          residentCountyId,
          authorityLabel,
        );
      }
    }
  }

  const matchedRecord = findFirstMatchingLevyEntry(
    LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS,
    authorityLabel,
    { ...options, skipKeyedEntriesOnLabelOnly: true },
  );
  if (!matchedRecord) return null;
  return buildAuthorityChainEntryForRecord(
    matchedRecord,
    options?.countyId?.trim(),
    authorityLabel,
  );
}

/** How many latest Arapahoe-related authority chains to show on the home search form. */
export const HOME_LATEST_ARAPAHOE_AUTHORITY_CHAIN_COUNT = 3;

/**
 * True when the curated entry is for an Arapahoe County tax entity (or a
 * multi-county entity with an Arapahoe AUTH / overlay). Single-county
 * `match.levyLineCode` entries in this file are Arapahoe AUTH codes.
 */
export function authorityChainRecordServesArapahoe(
  record: LevyAuthorityChainEntryRecord,
): boolean {
  if (record.match.levyLineCode?.trim()) return true;
  const registryId = record.match.registryId?.trim();
  if (!registryId) return false;
  const registryRow = crossCountyAuthorityById(registryId);
  if (registryRow?.levyLineCodeByCounty.arapahoe?.trim()) return true;
  return Boolean(record.countyOverlays?.arapahoe);
}

export type HomeLatestArapahoeAuthorityChainCard = {
  /** Tax authority display name (home card title). */
  authorityDisplayName: string;
  /**
   * Last-year mill % line when available
   * (e.g. "Up 7.2% from last year"). Null when percent is undefined.
   */
  lastYearPercentLabel: string | null;
  /**
   * YoY direction for home percent chrome (same red-up / green-down as levy
   * tiles). Null when {@link lastYearPercentLabel} is null.
   */
  lastYearDirection: "more" | "less" | "neutral" | null;
  /** Built trail for Arapahoe residents (overlays + AUTH mills). */
  entry: LevyAuthorityChainEntry;
  /** Arapahoe stack AUTH / levy line code for rate-table deep-links. */
  levyLineCode?: string;
};

function homeDirectionFromLastYearChange(
  change: { delta: number } | null,
): "more" | "less" | "neutral" | null {
  if (!change) return null;
  if (change.delta > 0) return "more";
  if (change.delta < 0) return "less";
  return "neutral";
}

/**
 * Latest Arapahoe-related authority-chain entries for the home search form.
 * File order is append order; take the last N that serve Arapahoe, newest first.
 */
export function latestArapahoeAuthorityChainCardsForHome(
  limit: number = HOME_LATEST_ARAPAHOE_AUTHORITY_CHAIN_COUNT,
): HomeLatestArapahoeAuthorityChainCard[] {
  const arapahoeRecords = LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS.filter(
    authorityChainRecordServesArapahoe,
  );
  const latestOldestFirst = arapahoeRecords.slice(-Math.max(0, limit));
  const newestFirst = [...latestOldestFirst].reverse();
  return newestFirst.map((record) => {
    const registryId = record.match.registryId?.trim();
    const levyLineCode = registryId
      ? levyLineCodeForCrossCountyAuthority(registryId, "arapahoe")
      : record.match.levyLineCode?.trim();
    const code = levyLineCode?.trim();
    const { changeFromLastYear } = code
      ? selectMetroAuthorityMillsChangeBlocks(
          authorityMillsSeries(code, "arapahoe"),
        )
      : { changeFromLastYear: null };
    const lastYearPercentLabel =
      formatHomeLastYearMillsPercentChange(changeFromLastYear);
    const lastYearDirection = lastYearPercentLabel
      ? homeDirectionFromLastYearChange(changeFromLastYear)
      : null;
    return {
      authorityDisplayName: record.authority.displayName,
      lastYearPercentLabel,
      lastYearDirection,
      entry: buildLevyAuthorityChainEntry(record, {
        residentCountyId: "arapahoe",
      }),
      levyLineCode: code || undefined,
    };
  });
}
