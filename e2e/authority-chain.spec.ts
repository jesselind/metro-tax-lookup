// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { test } from "@playwright/test";
import {
  assertAuthorityChainPanel,
  assertAuthorityChainSourceUrlsReachable,
  authorityChainE2eCases,
  collectAuthorityChainSourceUrlsForEntries,
  openAuthorityChainPanel,
} from "./helpers/authorityChain";

/**
 * Authority-agnostic coverage for the shared "Who authorized this?" panel.
 * Cases and expected hrefs come from levy-authority-chain-entries.json; the
 * synthetic levy stack only injects the matching AUTH / levy line code.
 *
 * Panel UI and source-URL reachability are separate tests so a flaky county
 * host does not look like a panel regression.
 */
test.describe("Levy authority chain (Who authorized this?)", () => {
  const cases = authorityChainE2eCases();

  for (const { levyLineCode, entry } of cases) {
    test(`AUTH ${levyLineCode} (${entry.id}): panel, steps, sources`, async ({
      page,
    }) => {
      const chain = await openAuthorityChainPanel(page, levyLineCode);
      await assertAuthorityChainPanel(chain, entry);
    });
  }

  test("curated source URLs respond (HEAD / ranged GET)", async ({
    request,
  }) => {
    const hrefs = collectAuthorityChainSourceUrlsForEntries(
      cases.map((c) => c.entry),
    );
    await assertAuthorityChainSourceUrlsReachable(request, hrefs);
  });
});
