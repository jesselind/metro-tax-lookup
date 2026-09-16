// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Colorado residential dual-rate assessed base for one levy line.
 *
 * School authorities use school assessed when it differs from local assessed;
 * all other lines use local assessed. When school assessed is missing or equal
 * to local, every line uses local (same dollars as single-base).
 *
 * County-agnostic: callers supply the two assessed figures from whatever the
 * county ships (Realware alternateAssessed, mart schoolAssessedTotal, …).
 */

import {
  annualTaxDollarsFromAssessedMills,
  parcelAssessedForDollarEstimate,
} from "@/lib/annualTaxFromAssessedMills";
import {
  LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS,
} from "@/lib/levyAuthorityChain";
import { findFirstMatchingLevyEntry } from "@/lib/levyEntryMatch";

/** Name match for school district levy lines when no authority-chain family. */
const SCHOOL_AUTHORITY_NAME_RE =
  /\bSCHOOL\s+DIST(?:RICT)?\b|\bSCHOOL\s+DISTRICT\b|\bSCHOOLS?\b/i;

export type AssessedBaseForLevyLineOpts = {
  localAssessed: number;
  schoolAssessed: number | null | undefined;
  lineIsSchoolAuthority: boolean;
};

/**
 * Assessed value to multiply by this line's mills.
 * Requires a positive finite local assessed (caller must gate).
 */
export function assessedBaseForLevyLine(
  opts: AssessedBaseForLevyLineOpts,
): number {
  const school = parcelAssessedForDollarEstimate(opts.schoolAssessed);
  if (school == null) return opts.localAssessed;
  if (Math.round(school) === Math.round(opts.localAssessed)) {
    return opts.localAssessed;
  }
  return opts.lineIsSchoolAuthority ? school : opts.localAssessed;
}

export type SchoolAuthorityLevyLineOpts = {
  authorityName: string;
  levyLineCode?: string | null;
  countyId?: string | null;
  dolaMatchedLegalName?: string | null;
};

/**
 * True when this levy line is a school authority for dual-rate base selection.
 *
 * Order: curated authority-chain record `family === "school"` (via label / line
 * code lookup), else a name match on the stack authority label or DOLA matched
 * legal name (`SCHOOL DIST`, `School District`, or `School`/`Schools` so debt
 * and reserve lines like "… Schools - Debt Service" count as school).
 */
export function isSchoolAuthorityLevyLine(
  opts: SchoolAuthorityLevyLineOpts,
): boolean {
  const label = opts.authorityName?.trim() ?? "";
  const record = findFirstMatchingLevyEntry(
    LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS,
    label,
    {
      countyId: opts.countyId ?? undefined,
      levyLineCode: opts.levyLineCode ?? undefined,
      skipKeyedEntriesOnLabelOnly: true,
    },
  );
  if (record?.family === "school") return true;

  if (label && SCHOOL_AUTHORITY_NAME_RE.test(label)) return true;
  const dolaName = opts.dolaMatchedLegalName?.trim() ?? "";
  if (dolaName && SCHOOL_AUTHORITY_NAME_RE.test(dolaName)) return true;
  return false;
}

export type LevyLineForDualBaseDollars = {
  authority: string;
  mills: number;
  levyLineCode?: string | null;
  dolaMatchedLegalName?: string | null;
};

/**
 * Whole-dollar annual tax for one levy line under dual-base (or single-base
 * when school assessed is absent / equal).
 */
export function annualTaxDollarsForLevyLine(
  line: LevyLineForDualBaseDollars,
  localAssessed: number,
  schoolAssessed: number | null | undefined,
  countyId?: string | null,
): number {
  const base = assessedBaseForLevyLine({
    localAssessed,
    schoolAssessed,
    lineIsSchoolAuthority: isSchoolAuthorityLevyLine({
      authorityName: line.authority,
      levyLineCode: line.levyLineCode,
      countyId,
      dolaMatchedLegalName: line.dolaMatchedLegalName,
    }),
  });
  return annualTaxDollarsFromAssessedMills(base, line.mills);
}

/**
 * Stack total under dual-base: round each assessed side once
 * (Σ school mills × school assessed + Σ local mills × local assessed).
 * Matches Realware `taxDollars` + `alternateTaxDollars` buckets better than
 * summing per-line rounds (which can drift a dollar or two).
 * When school assessed is missing or equal to local, same as single-base
 * (one round of total mills × local assessed).
 */
export function annualTaxDollarsForLevyStack(
  lines: readonly LevyLineForDualBaseDollars[],
  localAssessed: number,
  schoolAssessed: number | null | undefined,
  countyId?: string | null,
): number {
  const school = parcelAssessedForDollarEstimate(schoolAssessed);
  const dualActive =
    school != null && Math.round(school) !== Math.round(localAssessed);

  if (!dualActive) {
    const sumMills = lines.reduce((acc, line) => acc + line.mills, 0);
    return annualTaxDollarsFromAssessedMills(localAssessed, sumMills);
  }

  let schoolMills = 0;
  let localMills = 0;
  for (const line of lines) {
    const isSchool = isSchoolAuthorityLevyLine({
      authorityName: line.authority,
      levyLineCode: line.levyLineCode,
      countyId,
      dolaMatchedLegalName: line.dolaMatchedLegalName,
    });
    if (isSchool) schoolMills += line.mills;
    else localMills += line.mills;
  }
  return (
    annualTaxDollarsFromAssessedMills(school, schoolMills) +
    annualTaxDollarsFromAssessedMills(localAssessed, localMills)
  );
}
