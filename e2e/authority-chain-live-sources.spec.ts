// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { test } from "@playwright/test";
import {
  assertAuthorityChainSourceUrlsReachable,
  authorityChainE2eCases,
  collectAuthorityChainSourceUrlsForEntries,
} from "./helpers/authorityChain";

/**
 * Live HEAD / ranged GET against curated authority-chain https sources.
 *
 * Tagged `@live-sources`: excluded from default `npm run test:e2e` / PR CI
 * (Playwright best practice: do not depend on third parties for merge green).
 * Run with `npm run test:e2e:live-sources` or the manual GitHub workflow.
 */
test.describe("Authority-chain curated source URL health", () => {
  const hrefs = collectAuthorityChainSourceUrlsForEntries(
    authorityChainE2eCases().map((c) => c.entry),
  );

  for (const href of hrefs) {
    test(
      `curated source URL responds (HEAD / ranged GET): ${href}`,
      { tag: "@live-sources" },
      async ({ request }) => {
        await assertAuthorityChainSourceUrlsReachable(request, [href]);
      },
    );
  }
});
