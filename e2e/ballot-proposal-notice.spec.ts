// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import {
  BALLOT_PROPOSAL_PARCEL_IMPACT_DISCLAIMER,
  ballotProposalParcelImpactClosedLine,
  homeBallotProposalNoticeJumpLabel,
} from "../src/content/ballotProposalNoticeCopy";
import {
  BALLOT_PROPOSAL_NOTICE_BADGE_LABEL,
  FIRST_BALLOT_PROPOSAL_LEVY_TILE_DOM_ID,
  HOME_BALLOT_PROPOSAL_NOTICE_SECTION_ID,
  ballotProposalParcelAnnualImpactDollars,
  findBallotProposalNoticeEntry,
} from "../src/lib/ballotProposalNotice";
import { displayMartAuthorityName } from "../src/lib/countyParcelLevyData";
import { SYNTHETIC_PIN } from "../src/lib/syntheticTestIds";
import {
  searchSyntheticAddress,
  viewDistrictDetailsButton,
} from "./helpers/addressLookup";
import { SYNTHETIC_PIN_TO_TAG } from "./fixtures/syntheticCountyData";
import { installSyntheticCountyData } from "./helpers/installSyntheticCountyData";

const HOME_JUMP_LABEL = homeBallotProposalNoticeJumpLabel(4);
const LOCKED_ONE_MEASURE_JUMP_LABEL = homeBallotProposalNoticeJumpLabel(1);
/** Stack fixture + Notice display name (title-cased on the tile). */
const HILLS_AUTHORITY_FIXTURE = "Hills at Cherry Creek Metropolitan District";
const HILLS_AUTHORITY_TILE = displayMartAuthorityName(HILLS_AUTHORITY_FIXTURE);
/** Synthetic fixture assessed (see SYNTHETIC_PIN_TO_TAG). */
const SYNTHETIC_ASSESSED =
  SYNTHETIC_PIN_TO_TAG.byPin[SYNTHETIC_PIN]!.totalAssessed;

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

  test("unlocked home Notice list omits parcel impact dollars", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: HOME_JUMP_LABEL }).click();
    const section = page.locator(`#${HOME_BALLOT_PROPOSAL_NOTICE_SECTION_ID}`);
    await expect(section).toBeVisible();
    await expect(
      section.getByRole("heading", {
        name: HILLS_AUTHORITY_FIXTURE,
        level: 3,
      }),
    ).toBeVisible();
    await expect(section.getByText(/You'll pay .+ more per year/i)).toHaveCount(
      0,
    );
  });

  test("Hills AUTH 4365 levy dialog shows parcel impact from Notice mills", async ({
    page,
  }) => {
    const entry = findBallotProposalNoticeEntry({
      countyId: "arapahoe",
      levyLineCode: "4365",
    });
    expect(entry).not.toBeNull();
    const impact = ballotProposalParcelAnnualImpactDollars({
      measures: entry!.measures,
      assessed: SYNTHETIC_ASSESSED,
    });
    expect(impact).not.toBeNull();

    await installSyntheticCountyData(page, {
      authorityChainLevyLineCode: "4365",
      authorityChainAuthorityName: HILLS_AUTHORITY_FIXTURE,
    });
    await page.goto("/");
    await searchSyntheticAddress(page);

    await expect(
      page.getByText(BALLOT_PROPOSAL_NOTICE_BADGE_LABEL, { exact: true }),
    ).toBeVisible();
    await viewDistrictDetailsButton(page, HILLS_AUTHORITY_TILE).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText(ballotProposalParcelImpactClosedLine(impact!), {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      dialog.getByText(BALLOT_PROPOSAL_PARCEL_IMPACT_DISCLAIMER, {
        exact: true,
      }),
    ).toBeVisible();
  });
});
