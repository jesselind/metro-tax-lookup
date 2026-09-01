// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { displayMartAuthorityName } from "../../src/lib/countyParcelLevyData";
import {
  AUTHORITY_CHAIN_GAPS_DISCLOSURE,
  AUTHORITY_CHAIN_STEPS_DISCLOSURE,
} from "../../src/content/levyAuthorityChainCopy";
import { buildLevyAuthorityChainEntry } from "../../src/lib/levyAuthorityChainBuild";
import {
  LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS,
  type LevyAuthorityChainEntry,
} from "../../src/lib/levyAuthorityChain";
import { countyConfigById } from "../../src/lib/countyConfig";
import { levyLineCodeForCrossCountyAuthority } from "../../src/lib/crossCountyAuthorityRegistry";
import { deepLinkLevyPercentageUrlForParcel } from "../../src/lib/authorityMillsHistory";
import { safeHttpOrHttpsUrl } from "../../src/lib/safeExternalHref";
import {
  SYNTHETIC_E2E_AUTHORITY,
  SYNTHETIC_E2E_TAG_SHORT_DESCR,
} from "../fixtures/syntheticCountyData";
import {
  searchSyntheticAddress,
  viewDistrictDetailsButton,
} from "./addressLookup";
import { installSyntheticCountyData } from "./installSyntheticCountyData";

export type AuthorityChainE2eCase = {
  levyLineCode: string;
  entry: LevyAuthorityChainEntry;
  /** When set, open the panel under this wired county (default Arapahoe). */
  countyId?: "arapahoe" | "douglas";
  /** Stack authority label for the levy tile button (default synthetic fixture). */
  authorityLabel?: string;
};

/**
 * One e2e case per curated entry that matches by county AUTH / levy line code,
 * plus registry-linked entries (for example SMFR via `match.registryId`).
 * Expected copy and URLs come from the same JSON the UI loads.
 */
export function authorityChainE2eCases(): AuthorityChainE2eCase[] {
  const cases: AuthorityChainE2eCase[] = [];
  const seen = new Set<string>();

  const pushCase = (caseRow: AuthorityChainE2eCase) => {
    const key = `${caseRow.countyId ?? "arapahoe"}:${caseRow.levyLineCode}:${caseRow.entry.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    cases.push(caseRow);
  };

  for (const record of LEVY_AUTHORITY_CHAIN_ENTRY_RECORDS) {
    const code = record.match.levyLineCode?.trim();
    if (code) {
      pushCase({
        levyLineCode: code,
        entry: buildLevyAuthorityChainEntry(record),
      });
      continue;
    }
    const registryId = record.match.registryId?.trim();
    if (!registryId) continue;
    const arapahoeCode = levyLineCodeForCrossCountyAuthority(registryId, "arapahoe");
    const douglasCode = levyLineCodeForCrossCountyAuthority(registryId, "douglas");
    if (arapahoeCode) {
      pushCase({
        levyLineCode: arapahoeCode,
        entry: buildLevyAuthorityChainEntry(record, {
          residentCountyId: "arapahoe",
        }),
      });
    }
    if (douglasCode) {
      const douglasLabel =
        record.id === "south-metro-fire-authority-chain"
          ? "South Metro Fire Rescue Fire Protection District"
          : undefined;
      pushCase({
        levyLineCode: douglasCode,
        entry: buildLevyAuthorityChainEntry(record, {
          residentCountyId: "douglas",
          stackAuthorityLabel: douglasLabel,
        }),
        countyId: "douglas",
        authorityLabel: douglasLabel,
      });
    }
  }
  if (cases.length === 0) {
    throw new Error(
      "authority-chain e2e: no entries with match.levyLineCode or registryId in levy-authority-chain-entries.json",
    );
  }
  return cases;
}

/** Unique https source URLs from summary + every fact (hash kept for DOM asserts). */
export function collectAuthorityChainSourceUrls(
  entry: LevyAuthorityChainEntry,
): string[] {
  const urls: string[] = [];
  const push = (raw: string | undefined) => {
    const safe = safeHttpOrHttpsUrl(raw);
    if (safe && !urls.includes(safe)) urls.push(safe);
  };
  push(entry.summarySource?.url);
  for (const mark of entry.summaryIssueMarks ?? []) {
    push(mark.url);
  }
  for (const step of entry.steps) {
    push(step.bodyLink?.url);
    for (const fact of step.facts) {
      for (const src of fact.sources) {
        push(src.url);
      }
    }
  }
  return urls;
}

/** Strip fragment for HTTP probes (`#page=N` is client-side only). */
export function urlForHttpProbe(href: string): string {
  const u = new URL(href);
  u.hash = "";
  return u.href;
}

/**
 * Open the synthetic parcel, open the levy tile dialog, return the
 * "Who authorized this?" region for the matched AUTH code.
 */
export async function openAuthorityChainPanel(
  page: Page,
  levyLineCode: string,
  options: {
    countyId?: "arapahoe" | "douglas";
    authorityLabel?: string;
  } = {},
): Promise<Locator> {
  await installSyntheticCountyData(page, {
    countyId: options.countyId,
    authorityChainLevyLineCode: levyLineCode,
    authorityChainAuthorityName: options.authorityLabel,
  });
  await page.goto("/");
  if (options.countyId === "douglas") {
    await page.getByRole("radio", { name: "Douglas" }).click();
  }
  await searchSyntheticAddress(page);

  const authorityLabel = displayMartAuthorityName(
    options.authorityLabel ?? SYNTHETIC_E2E_AUTHORITY,
  );
  await viewDistrictDetailsButton(page, authorityLabel).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const chain = dialog.getByRole("region", { name: "Who authorized this?" });
  await expect(chain).toBeVisible();
  return chain;
}

/**
 * Assert the shared panel chrome: heading, summary, each step, open gaps,
 * inline term triggers when curated, and every curated source href.
 */
export async function assertAuthorityChainPanel(
  chain: Locator,
  entry: LevyAuthorityChainEntry,
  levyLineCode: string,
  countyId?: "arapahoe" | "douglas",
): Promise<void> {
  await expect(
    chain.getByRole("heading", { name: entry.heading, exact: true }),
  ).toBeVisible();

  if (entry.summarySource) {
    const summaryHref = safeHttpOrHttpsUrl(entry.summarySource.url);
    expect(summaryHref, "summarySource.url must be http(s)").toBeTruthy();
    await expect(
      chain.getByRole("link", { name: entry.summarySource.text }),
    ).toHaveAttribute("href", summaryHref!);
  } else {
    await expect(
      chain.getByText(entry.summary.slice(0, 48), { exact: false }),
    ).toBeVisible();
  }

  if (!entry.summary.includes("\nNOTE:")) {
    await expect(chain.getByText(/^NOTE:/)).toHaveCount(0);
  }

  if (entry.summaryTermMatch) {
    await expect(
      chain.getByRole("button", { name: entry.summaryTermMatch, exact: true }),
    ).toBeVisible();
  }

  // Ballot Issue highlight must work before "See each step" (collapsed trail).
  // Only the first occurrence links; a closing source NOTE may mention the
  // issue again while referring to that link and must remain plain text.
  for (const mark of entry.summaryIssueMarks ?? []) {
    const expectedCount = entry.summary.includes(mark.match) ? 1 : 0;
    if (mark.url) {
      const href = safeHttpOrHttpsUrl(mark.url);
      expect(href, `summary issue link for ${mark.match}`).toBeTruthy();
      const links = chain.getByRole("link", { name: mark.match });
      await expect(
        links,
        `summary issue link count for ${mark.match}`,
      ).toHaveCount(expectedCount);
      for (let i = 0; i < expectedCount; i++) {
        await expect(
          links.nth(i),
          `summary issue link[${i}] for ${mark.match}`,
        ).toHaveAttribute("href", href!);
      }
    } else {
      await expect(
        chain.getByText(mark.match, { exact: true }),
      ).toHaveCount(expectedCount);
    }
  }

  await chain.locator("summary", { hasText: AUTHORITY_CHAIN_STEPS_DISCLOSURE }).click();
  const stepItems = chain.locator("ol > li");
  await expect(stepItems).toHaveCount(entry.steps.length);

  for (let i = 0; i < entry.steps.length; i++) {
    const step = entry.steps[i]!;
    const item = stepItems.nth(i);
    await expect(item.getByText(step.title, { exact: true })).toBeVisible();
    // Body is the second <p> in the step (title, then body). Avoid matching
    // fact <dd> text that shares a short body string (e.g. "Arapahoe County").
    const bodyProbe = step.body.slice(0, Math.min(40, step.body.length));
    await expect(item.locator("p").nth(1)).toContainText(bodyProbe);
    if (step.bodyDisclosure) {
      await expect(
        item.locator("summary", { hasText: step.bodyDisclosure.label }),
      ).toBeVisible();
      // Collapsed by default: translated substance is not forced open.
      await expect(
        item.getByText(step.bodyDisclosure.body.slice(0, 48), { exact: false }),
      ).toBeHidden();
    }
    if (step.titleTermMatch) {
      await expect(
        item.getByRole("button", { name: step.titleTermMatch, exact: true }),
      ).toBeVisible();
    }
    if (step.bodyTermMatch) {
      await expect(
        item.getByRole("button", { name: step.bodyTermMatch, exact: true }),
      ).toBeVisible();
    }
    for (const extra of step.bodyTerms ?? []) {
      await expect(
        item.getByRole("button", { name: extra.match, exact: true }),
      ).toBeVisible();
    }
  }

  const deepLinkRateTable =
    !countyId || countyConfigById(countyId)?.features.millsHistory === true;

  for (const href of collectAuthorityChainSourceUrls(entry)) {
    const expectedHref = deepLinkRateTable
      ? deepLinkLevyPercentageUrlForParcel(
          href,
          levyLineCode,
          SYNTHETIC_E2E_TAG_SHORT_DESCR,
        )
      : href;
    await expect(
      chain.locator(`a[href="${cssEscapeAttr(expectedHref)}"]`).first(),
    ).toBeVisible();
  }

  if (entry.openGaps.length > 0) {
    await chain.locator("summary", { hasText: AUTHORITY_CHAIN_GAPS_DISCLOSURE }).click();
    for (const gap of entry.openGaps) {
      await expect(
        chain.getByText(gap.body.slice(0, 48), { exact: false }),
      ).toBeVisible();
    }
  }
}

/**
 * Unique curated https sources across the given entries (hash kept for logging).
 * Dedupes by HTTP probe URL so shared PDFs are not hit once per entry.
 */
export function collectAuthorityChainSourceUrlsForEntries(
  entries: readonly LevyAuthorityChainEntry[],
): string[] {
  const byProbe = new Map<string, string>();
  for (const entry of entries) {
    for (const href of collectAuthorityChainSourceUrls(entry)) {
      const probe = urlForHttpProbe(href);
      if (!byProbe.has(probe)) byProbe.set(probe, href);
    }
  }
  return [...byProbe.values()];
}

/**
 * Probe curated https sources. Failures here mean a published county/district
 * link likely broke (prefer that signal over silent dead links).
 * Only requests URLs from our own JSON (not page-scraped).
 * Uses HEAD, then a tiny ranged GET, so multi-MB PDFs do not download in full.
 *
 * Used by `@live-sources` (`npm run test:e2e:live-sources` / manual workflow),
 * not default PR e2e — third-party hosts must not gate merges or look like a
 * panel regression.
 */
export async function assertAuthorityChainSourceUrlsReachable(
  request: APIRequestContext,
  hrefs: readonly string[],
): Promise<void> {
  for (const href of hrefs) {
    const probe = urlForHttpProbe(href);
    const status = await probeSourceUrlStatus(request, probe);
    expect(
      status,
      `source URL should respond OK: ${probe} (from ${href})`,
    ).toBeGreaterThanOrEqual(200);
    expect(
      status,
      `source URL should not be client/server error: ${probe} (from ${href})`,
    ).toBeLessThan(400);
  }
}

async function probeSourceUrlStatus(
  request: APIRequestContext,
  probe: string,
): Promise<number> {
  const common = {
    timeout: 30_000,
    maxRedirects: 5,
    headers: { "User-Agent": "metro-tax-lookup-e2e/1.0" },
    failOnStatusCode: false as const,
  };

  const head = await request.fetch(probe, { ...common, method: "HEAD" });
  const headStatus = head.status();
  // Some hosts disallow HEAD or return an empty error; fall back to a 1-byte GET.
  if (headStatus >= 200 && headStatus < 400) {
    return headStatus;
  }

  const ranged = await request.get(probe, {
    ...common,
    headers: {
      ...common.headers,
      Range: "bytes=0-0",
    },
  });
  return ranged.status();
}

/** Escape a value for use inside a double-quoted CSS attribute selector. */
function cssEscapeAttr(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
