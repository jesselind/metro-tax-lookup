// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test, type Page } from "@playwright/test";
import { displayMartAuthorityName } from "../src/lib/arapahoeParcelLevyData";
import { SYNTHETIC_E2E_ADDRESS, SYNTHETIC_E2E_AUTHORITY } from "./fixtures/syntheticCountyData";
import { installSyntheticCountyData } from "./helpers/installSyntheticCountyData";

const authorityLabel = displayMartAuthorityName(SYNTHETIC_E2E_AUTHORITY);

async function searchSyntheticAddress(page: Page) {
  await page.getByRole("textbox", { name: "Street address" }).fill(SYNTHETIC_E2E_ADDRESS);
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.locator("#home-levy-stack-subheading")).toBeVisible();
}

test.describe("Levy authority chain (prototype)", () => {
  test("AUTH 0501 tile details show Who authorized this? panel", async ({
    page,
  }) => {
    await installSyntheticCountyData(page, { includeAuthorityChain: true });
    await page.goto("/");
    await searchSyntheticAddress(page);

    await page
      .getByRole("button", {
        name: new RegExp(
          `View district details for ${authorityLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        ),
      })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const chain = dialog.getByRole("region", { name: "Who authorized this?" });
    await expect(chain).toBeVisible();
    await expect(
      chain.getByText(/According to Arapahoe County's certified election results/i),
    ).toBeVisible();

    await chain.getByText("See each step").click();
    await expect(chain.getByText("Who gets this money?")).toBeVisible();
    await expect(chain.getByText("Ballot Issue 4A: More operating money")).toBeVisible();

    await chain.getByText("What we still cannot say").click();
    await expect(
      chain.getByText(/have not yet linked a county or school table that splits/i),
    ).toBeVisible();
  });
});
