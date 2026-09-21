// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import {
  MILL_LEVY_STACK_HEADING_ID,
  MILL_LEVY_TILES_ID,
} from "@/content/millLevySummaryCopy";

/**
 * Sticky locked-report section nav chrome (`HomeDashboardSectionNav`).
 * On `<lg` this is the one sticky strip (TOC + one-line address). On `lg+`
 * the same element is the left-rail sidenav (address + optional Switch + jumps);
 * it does not cover the main column, so scroll-mt inset is 0 on large screens.
 */
export const HOME_DASHBOARD_UTILITY_BAR_ID = "home-dashboard-utility-bar";

/** CSS variable set to the sticky section-nav strip height while mounted (`<lg` only). */
export const HOME_DASHBOARD_UTILITY_BAR_HEIGHT_VAR =
  "--home-dashboard-utility-bar-height";

/**
 * scroll-margin-top for jump focus/highlight targets so `scrollIntoView({ block: "start" })`
 * clears the sticky mobile TOC+address strip, plus 0.5rem so titles are not flush.
 * On `lg+` the left rail does not cover the main column — use a small fixed offset.
 * Fallback matches a one-row sticky strip (~3.5rem) before the CSS variable is set.
 */
export const HOME_DASHBOARD_JUMP_SCROLL_MT_CLASS =
  "scroll-mt-[calc(var(--home-dashboard-utility-bar-height,3.5rem)+0.5rem)] lg:scroll-mt-4";

export const HOME_PROPERTY_DETAILS_ID = "home-property-details";

/** Appraised and assessed values (own locked-report section after levies). */
export const HOME_APPRAISED_ASSESSED_ID = "home-parcel-appraised-assessed";

/** Sale history table (under Property details). */
export const HOME_SALE_HISTORY_ID = "home-parcel-sale-history";

/** Building(s) section title target inside Building/Area/Land Line table. */
export const HOME_BUILDINGS_ID = "home-parcel-buildings";

/** Area section title target inside Building/Area/Land Line table. */
export const HOME_AREA_ID = "home-parcel-area";

/** Land Line section title target inside Building/Area/Land Line table. */
export const HOME_LAND_LINE_ID = "home-parcel-land-line";

/** Permits table (Property details subsection). */
export const HOME_PERMITS_ID = "home-parcel-permits";

/** Rent tax pressure pierce heading (Rent lens only). */
export const HOME_RENT_PRESSURE_HEADING_ID =
  "home-parcel-rent-tax-pressure-heading";

/** Rent tax pressure tiles region (highlight / scroll-spy). */
export const HOME_RENT_PRESSURE_ID = "home-parcel-rent-tax-pressure";

/** Focus target for {@link LevyCountyCompareSection} (existing heading id). */
export const HOME_COUNTY_COMPARE_HEADING_ID = "levy-county-compare-heading";

/** Arrive ring target for the county compare box. */
export const HOME_COUNTY_COMPARE_SECTION_ID = "home-county-compare";

export const HOME_FEEDBACK_ASIDE_ID = "home-accuracy-feedback";

/** Section root for Comparable properties (`ComparablePropertiesSection` / in-app grid). */
export const HOME_NOV_COMPS_SECTION_ID = "home-nov-comps-grid";

/** Heading inside the comps section (aria / existing id). */
export const HOME_NOV_COMPS_HEADING_ID = "home-nov-comps-grid-heading";

/** Home `<main id="page-top">` — same focus target as Back to top. */
export const HOME_PAGE_TOP_ID = "page-top";

/**
 * Jump destinations for the locked-report section nav.
 * Order matches the main-column scroll order for the active lens.
 * No "Summary" / `#page-top` lead — levy (or Rent pressure) is first.
 */
export type HomeDashboardJumpId =
  | "rent-pressure"
  | "levies"
  | "property-details"
  | "appraised-assessed"
  | "sale-history"
  | "buildings"
  | "area"
  | "land-line"
  | "permits"
  | "county-compare"
  | "comps"
  | "feedback";

/** Jump to… option that runs Start over (not a section scroll). */
export const HOME_DASHBOARD_JUMP_START_OVER_VALUE = "start-over";

export const HOME_DASHBOARD_JUMP_START_OVER_LABEL = "START OVER";

/** Visible summary label for the locked-report TOC disclosure (`<lg`). */
export const HOME_DASHBOARD_JUMP_SUMMARY_LABEL = "Jump to a section";

export type HomeDashboardJump = {
  id: HomeDashboardJumpId;
  label: string;
  focusId: string;
  highlightId?: string;
};

/**
 * Locked-report chrome signal for the home shell (KNOWN ISSUE banner, etc.).
 * Section nav renders inside the locked report, not in the hero stack.
 */
export type HomeLockedUtilityNav = {
  jumps: HomeDashboardJump[];
  /** Amber Douglas KNOWN ISSUE banner under hero (scrolls with report). */
  propertyDataAccuracyWarning: boolean;
  /** Wired county id when locked (Sources deep link). */
  countyId: string;
};

/**
 * Flags for which locked-report sections are mounted for the active lens
 * (Own | Rent | BPP) and account. Only list jumps whose targets exist.
 */
export type HomeDashboardJumpFlags = {
  showRentPressure: boolean;
  showLevies: boolean;
  showPropertyDetails: boolean;
  showAppraisedAssessed: boolean;
  showSaleHistory: boolean;
  showBuildings: boolean;
  showArea: boolean;
  showLandLine: boolean;
  showPermits: boolean;
  showCountyCompare: boolean;
  /** Own Real only; always-on section (empty / gap states still mount). */
  showInAppComps: boolean;
  showFeedback: boolean;
  /** County display name for the compare jump label. */
  countyDisplayName: string;
};

/**
 * Build gated Jump to… options in main-column order for the active lens.
 * Leads with levy (or Rent pressure when that panel mounts). Omits any section
 * that is not on the report. Appraised and assessed sits after levies (before
 * Property details). Property details parent stays when the panel mounts;
 * remaining subsections are flat siblings (no nested submenu).
 */
export function buildHomeDashboardJumps(
  flags: HomeDashboardJumpFlags,
): HomeDashboardJump[] {
  const jumps: HomeDashboardJump[] = [];
  if (flags.showRentPressure) {
    jumps.push({
      id: "rent-pressure",
      label: "Your estimated property tax",
      focusId: HOME_RENT_PRESSURE_HEADING_ID,
      highlightId: HOME_RENT_PRESSURE_ID,
    });
  }
  if (flags.showLevies) {
    jumps.push({
      id: "levies",
      label: "Where is your money going?",
      focusId: MILL_LEVY_STACK_HEADING_ID,
      highlightId: MILL_LEVY_TILES_ID,
    });
  }
  if (flags.showAppraisedAssessed) {
    jumps.push({
      id: "appraised-assessed",
      label: "Appraised and assessed values",
      focusId: HOME_APPRAISED_ASSESSED_ID,
      highlightId: HOME_APPRAISED_ASSESSED_ID,
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
  if (flags.showSaleHistory) {
    jumps.push({
      id: "sale-history",
      label: "Sale history",
      focusId: HOME_SALE_HISTORY_ID,
      highlightId: HOME_SALE_HISTORY_ID,
    });
  }
  if (flags.showBuildings) {
    jumps.push({
      id: "buildings",
      label: "Building(s)",
      focusId: HOME_BUILDINGS_ID,
      highlightId: HOME_BUILDINGS_ID,
    });
  }
  if (flags.showArea) {
    jumps.push({
      id: "area",
      label: "Area",
      focusId: HOME_AREA_ID,
      highlightId: HOME_AREA_ID,
    });
  }
  if (flags.showLandLine) {
    jumps.push({
      id: "land-line",
      label: "Land Line",
      focusId: HOME_LAND_LINE_ID,
      highlightId: HOME_LAND_LINE_ID,
    });
  }
  if (flags.showPermits) {
    jumps.push({
      id: "permits",
      label: "Permits",
      focusId: HOME_PERMITS_ID,
      highlightId: HOME_PERMITS_ID,
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
  if (flags.showCountyCompare) {
    jumps.push({
      id: "county-compare",
      label: `See how ${flags.countyDisplayName} displays your data`,
      focusId: HOME_COUNTY_COMPARE_HEADING_ID,
      highlightId: HOME_COUNTY_COMPARE_SECTION_ID,
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

/** Matches Tailwind `lg` — section nav sticky/layout breakpoint. */
export const HOME_DASHBOARD_LG_MIN_MQ = "(min-width: 1024px)";

/**
 * Height of sticky chrome that covers the main column when jumping.
 * On `lg+` the left rail sits beside the main column (inset 0). On smaller
 * viewports, prefer the closed-strip CSS variable (open Jump menu height must
 * not inflate scroll-mt). Fall back to measuring the utility bar element.
 */
export function dashboardUtilityBarStickyInsetPx(): number {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return 0;
  }
  if (window.matchMedia(HOME_DASHBOARD_LG_MIN_MQ).matches) {
    return 0;
  }
  const fromVar = Number.parseFloat(
    getComputedStyle(document.documentElement)
      .getPropertyValue(HOME_DASHBOARD_UTILITY_BAR_HEIGHT_VAR)
      .trim(),
  );
  if (Number.isFinite(fromVar) && fromVar >= 0) {
    return fromVar;
  }
  const el = document.getElementById(HOME_DASHBOARD_UTILITY_BAR_ID);
  if (!(el instanceof HTMLElement)) return 0;
  return el.getBoundingClientRect().height;
}
