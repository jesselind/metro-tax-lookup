// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { dashboardUtilityBarStickyInsetPx } from "@/lib/homeDashboardJumps";

/** How long {@link DASHBOARD_SECTION_ARRIVE_ATTR} stays on the highlight target. */
export const DASHBOARD_SECTION_ARRIVE_MS = 1800;

/**
 * Presence attribute for {@link DASHBOARD_SECTION_ARRIVE_TARGET_CLASS}.
 * Toggle the attribute only; keep the ring utilities in the element's className
 * so Tailwind can see them.
 */
export const DASHBOARD_SECTION_ARRIVE_ATTR = "data-arrive";

/**
 * If the highlight target (mill levy tiles) starts below this fraction of the
 * viewport, scroll the heading to {@code block: "start"} so more tiles come on
 * screen. Desktop side-by-side usually fails this test (tiles already high).
 */
export const HIGHLIGHT_START_SCROLL_TOP_RATIO = 0.4;

let arriveTimer: number | undefined;
let arriveEl: HTMLElement | undefined;

export type FocusNearestDashboardSectionOptions = {
  /** Programmatic focus target (`tabIndex={-1}` heading or section). */
  focusId: string;
  /** Optional element for the short local ring (e.g. mill levy tile grid). */
  highlightId?: string;
  /** Override sticky chrome height; default measures the locked-report utility bar when present. */
  stickyInsetPx?: number;
};

/** True when the tiles' top is far enough down that nearest-scroll barely moves. */
export function highlightNeedsStartScroll(
  highlightTop: number,
  viewportHeight: number,
): boolean {
  if (viewportHeight <= 0) return false;
  return highlightTop > viewportHeight * HIGHLIGHT_START_SCROLL_TOP_RATIO;
}

/**
 * Choose scroll block for a dashboard jump.
 * - Focus under sticky chrome → {@code start} (clear the bar).
 * - Highlight mostly below the content fold → {@code start}.
 * - Otherwise {@code nearest} (no yank when already on screen; arrive ring still runs).
 */
export function resolveDashboardJumpScrollBlock(options: {
  focusTop: number;
  highlightTop: number | null;
  viewportHeight: number;
  stickyInsetPx: number;
}): ScrollLogicalPosition {
  const inset = Math.max(0, options.stickyInsetPx);
  if (options.focusTop < inset + 1) {
    return "start";
  }
  if (options.highlightTop == null) {
    return "nearest";
  }
  const contentTop = options.highlightTop - inset;
  const contentViewport = Math.max(1, options.viewportHeight - inset);
  return highlightNeedsStartScroll(contentTop, contentViewport)
    ? "start"
    : "nearest";
}

function measureStickyInsetPx(explicit?: number): number {
  if (explicit != null && Number.isFinite(explicit)) {
    return Math.max(0, explicit);
  }
  return dashboardUtilityBarStickyInsetPx();
}

/**
 * Move focus to a dashboard section heading and scroll.
 * Tiles already on screen: {@code nearest} (no yank). Tiles mostly below the
 * fold: {@code start} on the heading so more of the tile grid follows.
 * Sticky utility bar height is subtracted from the fold test; targets should use
 * {@link HOME_DASHBOARD_JUMP_SCROLL_MT_CLASS} so {@code block: "start"} clears the bar.
 * Sets {@link DASHBOARD_SECTION_ARRIVE_ATTR} on {@link highlightId} (or the
 * focus node) for a short local ring.
 */
export function focusNearestDashboardSection({
  focusId,
  highlightId,
  stickyInsetPx,
}: FocusNearestDashboardSectionOptions): void {
  if (typeof document === "undefined") return;
  const focusEl = document.getElementById(focusId);
  if (!(focusEl instanceof HTMLElement)) return;

  const highlightEl =
    highlightId != null ? document.getElementById(highlightId) : null;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const inset = measureStickyInsetPx(stickyInsetPx);
  const block = resolveDashboardJumpScrollBlock({
    focusTop: focusEl.getBoundingClientRect().top,
    highlightTop:
      highlightEl != null ? highlightEl.getBoundingClientRect().top : null,
    viewportHeight: window.innerHeight,
    stickyInsetPx: inset,
  });

  focusEl.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block,
    inline: "nearest",
  });
  focusEl.focus({ preventScroll: true });

  const ringEl = highlightEl ?? focusEl;
  if (arriveTimer != null) window.clearTimeout(arriveTimer);
  if (arriveEl != null && arriveEl !== ringEl) {
    arriveEl.removeAttribute(DASHBOARD_SECTION_ARRIVE_ATTR);
  }
  ringEl.setAttribute(DASHBOARD_SECTION_ARRIVE_ATTR, "");
  arriveEl = ringEl;
  arriveTimer = window.setTimeout(() => {
    ringEl.removeAttribute(DASHBOARD_SECTION_ARRIVE_ATTR);
    arriveTimer = undefined;
    arriveEl = undefined;
  }, DASHBOARD_SECTION_ARRIVE_MS);
}
