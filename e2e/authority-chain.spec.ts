// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { test } from "@playwright/test";
import {
  assertAuthorityChainPanel,
  authorityChainE2eCases,
  openAuthorityChainPanel,
} from "./helpers/authorityChain";

/**
 * Authority-agnostic coverage for the shared "Who authorized this?" panel.
 * Cases and expected hrefs come from levy-authority-chain-entries.json; the
 * synthetic levy stack only injects the matching AUTH / levy line code.
 *
 * Live curated-source URL probes live in
 * `authority-chain-live-sources.spec.ts` (@live-sources) — not this file —
 * so a flaky county host cannot fail PR e2e or look like a panel regression.
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
});
