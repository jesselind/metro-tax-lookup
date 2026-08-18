// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

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
  /** Programmatic focus target (`tabIndex={-1}` heading). */
  focusId: string;
  /** Optional element for the short local ring (e.g. mill levy tile grid). */
  highlightId?: string;
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
 * Move focus to a dashboard section heading and scroll.
 * Tiles already on screen: {@code nearest} (no yank). Tiles mostly below the
 * fold: {@code start} on the heading so more of the tile grid follows.
 * Sets {@link DASHBOARD_SECTION_ARRIVE_ATTR} on {@link highlightId} (or the
 * focus node) for a short local ring.
 */
export function focusNearestDashboardSection({
  focusId,
  highlightId,
}: FocusNearestDashboardSectionOptions): void {
  if (typeof document === "undefined") return;
  const focusEl = document.getElementById(focusId);
  if (!(focusEl instanceof HTMLElement)) return;

  const highlightEl =
    highlightId != null ? document.getElementById(highlightId) : null;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const block: ScrollLogicalPosition =
    highlightEl != null &&
    highlightNeedsStartScroll(
      highlightEl.getBoundingClientRect().top,
      window.innerHeight,
    )
      ? "start"
      : "nearest";

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
