// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { test } from "@playwright/test";
import {
  assertAuthorityChainPanel,
  assertAuthorityChainSourceUrlsReachable,
  authorityChainE2eCases,
  openAuthorityChainPanel,
} from "./helpers/authorityChain";

/**
 * Authority-agnostic coverage for the shared "Who authorized this?" panel.
 * Cases and expected hrefs come from levy-authority-chain-entries.json; the
 * synthetic levy stack only injects the matching AUTH / levy line code.
 */
test.describe("Levy authority chain (Who authorized this?)", () => {
  for (const { levyLineCode, entry } of authorityChainE2eCases()) {
    test(`AUTH ${levyLineCode} (${entry.id}): panel, steps, sources`, async ({
      page,
      request,
    }) => {
      const chain = await openAuthorityChainPanel(page, levyLineCode);
      await assertAuthorityChainPanel(chain, entry);
      await assertAuthorityChainSourceUrlsReachable(request, entry);
    });
  }
});
