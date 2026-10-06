// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import { homeBallotProposalNoticeJumpLabel } from "../src/content/ballotProposalNoticeCopy";
import {
  BALLOT_PROPOSAL_NOTICE_BADGE_LABEL,
  FIRST_BALLOT_PROPOSAL_LEVY_TILE_DOM_ID,
  HOME_BALLOT_PROPOSAL_NOTICE_SECTION_ID,
} from "../src/lib/ballotProposalNotice";
import { searchSyntheticAddress } from "./helpers/addressLookup";
import { installSyntheticCountyData } from "./helpers/installSyntheticCountyData";

const HOME_JUMP_LABEL = homeBallotProposalNoticeJumpLabel(4);
const LOCKED_ONE_MEASURE_JUMP_LABEL = homeBallotProposalNoticeJumpLabel(1);

test.describe("Arapahoe Nov 2026 ballot-proposal Notice", () => {
  test("unlocked home jump opens the county Notice list", async ({ page }) => {
    await page.goto("/");

    const jump = page.getByRole("button", { name: HOME_JUMP_LABEL });
    await expect(jump).toBeVisible();
    await jump.click();

    const section = page.locator(`#${HOME_BALLOT_PROPOSAL_NOTICE_SECTION_ID}`);
    await expect(section).toBeVisible();
    await expect(section).toBeFocused();
    await expect(
      page.getByRole("heading", { name: "Littleton Public Schools", level: 3 }),
    ).toBeVisible();
  });

  test("locked report jump lands on the first Notice levy tile", async ({
    page,
  }) => {
    await installSyntheticCountyData(page, {
      authorityChainLevyLineCode: "0601",
      authorityChainAuthorityName: "Littleton Public Schools",
    });
    await page.goto("/");
    await searchSyntheticAddress(page);

    await expect(
      page.getByRole("button", { name: LOCKED_ONE_MEASURE_JUMP_LABEL }),
    ).toBeVisible();
    await expect(
      page.getByText(BALLOT_PROPOSAL_NOTICE_BADGE_LABEL, { exact: true }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: LOCKED_ONE_MEASURE_JUMP_LABEL })
      .click();

    const firstTile = page.locator(`#${FIRST_BALLOT_PROPOSAL_LEVY_TILE_DOM_ID}`);
    await expect(firstTile).toBeVisible();
    await expect(firstTile).toBeFocused();
    await expect(firstTile).toContainText(BALLOT_PROPOSAL_NOTICE_BADGE_LABEL);
  });

  test("Douglas county scope hides the unlocked home Notice jump", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("radio", { name: "Douglas" }).click();
    await expect(
      page.getByRole("button", { name: HOME_JUMP_LABEL }),
    ).toHaveCount(0);
  });
});
