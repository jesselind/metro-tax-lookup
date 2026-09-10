// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import {
  MILL_LEVY_STACK_HEADING_ID,
  MILL_LEVY_TILES_ID,
} from "@/content/millLevySummaryCopy";

/** Sticky locked-report utility bar (`HomeDashboardUtilityBar`). */
export const HOME_DASHBOARD_UTILITY_BAR_ID = "home-dashboard-utility-bar";

/** CSS variable set to the utility bar's height while the bar is mounted. */
export const HOME_DASHBOARD_UTILITY_BAR_HEIGHT_VAR =
  "--home-dashboard-utility-bar-height";

/**
 * scroll-margin-top for jump focus/highlight targets so `scrollIntoView({ block: "start" })`
 * clears the sticky utility bar. Fallback matches a one-row bar (~3.5rem).
 */
export const HOME_DASHBOARD_JUMP_SCROLL_MT_CLASS =
  "scroll-mt-[var(--home-dashboard-utility-bar-height,3.5rem)]";

export const HOME_PROPERTY_DETAILS_ID = "home-property-details";

/** Focus target for {@link LevyCountyCompareSection} (existing heading id). */
export const HOME_COUNTY_COMPARE_HEADING_ID = "levy-county-compare-heading";

/** Arrive ring target for the county compare box. */
export const HOME_COUNTY_COMPARE_SECTION_ID = "home-county-compare";

export const HOME_FEEDBACK_ASIDE_ID = "home-accuracy-feedback";

/** Section root for in-app comps grid (`NovCompsGridPanel`). */
export const HOME_NOV_COMPS_SECTION_ID = "home-nov-comps-grid";

/** Heading inside the comps section (aria / existing id). */
export const HOME_NOV_COMPS_HEADING_ID = "home-nov-comps-grid-heading";

export type HomeDashboardJumpId =
  | "levies"
  | "property-details"
  | "county-compare"
  | "comps"
  | "feedback";

/** Jump to… option that runs Start over (not a section scroll). */
export const HOME_DASHBOARD_JUMP_START_OVER_VALUE = "start-over";

export const HOME_DASHBOARD_JUMP_START_OVER_LABEL = "START OVER";

/** Visible summary label for the locked-report TOC disclosure. */
export const HOME_DASHBOARD_JUMP_SUMMARY_LABEL = "Jump to a section";

export type HomeDashboardJump = {
  id: HomeDashboardJumpId;
  label: string;
  focusId: string;
  highlightId?: string;
};

export type HomeDashboardJumpFlags = {
  showLevies: boolean;
  showPropertyDetails: boolean;
  showCountyCompare: boolean;
  showInAppComps: boolean;
  showFeedback: boolean;
  /** County display name for the compare jump label. */
  countyDisplayName: string;
};

/**
 * Build gated Jump to… options in page order. Omit any section that is not mounted.
 */
export function buildHomeDashboardJumps(
  flags: HomeDashboardJumpFlags,
): HomeDashboardJump[] {
  const jumps: HomeDashboardJump[] = [];
  if (flags.showLevies) {
    jumps.push({
      id: "levies",
      label: "Where is your money going?",
      focusId: MILL_LEVY_STACK_HEADING_ID,
      highlightId: MILL_LEVY_TILES_ID,
    });
  }
  if (flags.showPropertyDetails) {
    jumps.push({
      id: "property-details",
      label: "Property details",
      focusId: HOME_PROPERTY_DETAILS_ID,
      highlightId: HOME_PROPERTY_DETAILS_ID,
    });
  }
  if (flags.showCountyCompare) {
    jumps.push({
      id: "county-compare",
      label: `See how ${flags.countyDisplayName} displays your data`,
      focusId: HOME_COUNTY_COMPARE_HEADING_ID,
      highlightId: HOME_COUNTY_COMPARE_SECTION_ID,
    });
  }
  if (flags.showInAppComps) {
    jumps.push({
      id: "comps",
      label: "Comparable properties",
      focusId: HOME_NOV_COMPS_SECTION_ID,
      highlightId: HOME_NOV_COMPS_SECTION_ID,
    });
  }
  if (flags.showFeedback) {
    jumps.push({
      id: "feedback",
      label: "Feedback",
      focusId: HOME_FEEDBACK_ASIDE_ID,
      highlightId: HOME_FEEDBACK_ASIDE_ID,
    });
  }
  return jumps;
}

/** Height of the sticky utility bar when mounted; 0 when absent. */
export function dashboardUtilityBarStickyInsetPx(): number {
  if (typeof document === "undefined") return 0;
  const el = document.getElementById(HOME_DASHBOARD_UTILITY_BAR_ID);
  if (!(el instanceof HTMLElement)) return 0;
  return el.getBoundingClientRect().height;
}
