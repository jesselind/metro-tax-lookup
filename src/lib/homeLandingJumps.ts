// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { HOME_BALLOT_PROPOSAL_NOTICE_SECTION_ID } from "@/lib/ballotProposalNotice";

/**
 * Unlocked home landing section jumps (sticky PageHero navbar).
 * Never used on the locked report — that path uses {@link HomeDashboardSectionNav}.
 */

/** Sticky home title-bar id while the landing navbar is mounted. */
export const HOME_LANDING_NAVBAR_ID = "home-landing-navbar";

/** CSS variable: closed sticky title-bar height while landing nav is mounted. */
export const HOME_LANDING_NAVBAR_HEIGHT_VAR = "--home-landing-navbar-height";

/**
 * scroll-margin-top so landing section jumps clear the sticky title bar.
 * Fallback ≈ one-line brand bar before the variable is set.
 */
export const HOME_LANDING_JUMP_SCROLL_MT_CLASS =
  "scroll-mt-[calc(var(--home-landing-navbar-height,4.5rem)+0.5rem)]";

/** Address lookup + landing lead (top of the unlocked home tool). */
export const HOME_LANDING_LOOKUP_ID = "home-landing-lookup";

/** Teaching block: two numbers that raise property tax. */
export const HOME_WHY_TAXES_GO_UP_SECTION_ID = "home-why-taxes-go-up";

/** Latest curated Who authorized this? cards on unlocked home. */
export const HOME_LATEST_AUTHORITY_CHAINS_SECTION_ID =
  "home-latest-authority-chains";

export type HomeLandingJumpId =
  | "lookup"
  | "why-taxes"
  | "ballot-notice"
  | "authority-chains";

export type HomeLandingJump = {
  id: HomeLandingJumpId;
  label: string;
  /** Element id to focus / scroll to. */
  focusId: string;
};

/** Distinct from locked-report Jump TOC (`aria-label="On this page"`). */
export const HOME_LANDING_NAV_ARIA_LABEL = "Home page sections";

export const HOME_LANDING_MENU_BUTTON_LABEL = "Menu";

export const HOME_LANDING_MENU_BUTTON_ARIA_LABEL =
  "Open home page section menu";

export const HOME_LANDING_MENU_BUTTON_CLOSE_ARIA_LABEL =
  "Close home page section menu";

export type HomeLandingJumpFlags = {
  showBallotNotice: boolean;
  showAuthorityChains: boolean;
};

/**
 * Curated unlocked-home jumps in document order. Omit sections that are not
 * mounted for the active county / data.
 */
export function buildHomeLandingJumps(
  flags: HomeLandingJumpFlags,
): HomeLandingJump[] {
  const jumps: HomeLandingJump[] = [
    {
      id: "lookup",
      label: "Look up your property",
      focusId: HOME_LANDING_LOOKUP_ID,
    },
    {
      id: "why-taxes",
      label: "Two numbers",
      focusId: HOME_WHY_TAXES_GO_UP_SECTION_ID,
    },
  ];
  if (flags.showBallotNotice) {
    jumps.push({
      id: "ballot-notice",
      label: "November 3 ballot",
      focusId: HOME_BALLOT_PROPOSAL_NOTICE_SECTION_ID,
    });
  }
  if (flags.showAuthorityChains) {
    jumps.push({
      id: "authority-chains",
      label: "Latest updates",
      focusId: HOME_LATEST_AUTHORITY_CHAINS_SECTION_ID,
    });
  }
  return jumps;
}
