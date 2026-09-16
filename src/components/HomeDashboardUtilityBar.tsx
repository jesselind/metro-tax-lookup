// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import {
  useLayoutEffect,
  useRef,
} from "react";
import { DisclosureChevron } from "@/components/DisclosureChevron";
import { focusNearestDashboardSection } from "@/lib/focusNearestDashboardSection";
import {
  HOME_DASHBOARD_JUMP_START_OVER_LABEL,
  HOME_DASHBOARD_JUMP_START_OVER_VALUE,
  HOME_DASHBOARD_JUMP_SUMMARY_LABEL,
  HOME_DASHBOARD_UTILITY_BAR_HEIGHT_VAR,
  HOME_DASHBOARD_UTILITY_BAR_ID,
  type HomeDashboardJump,
} from "@/lib/homeDashboardJumps";
import {
  HOME_DASHBOARD_JUMP_CHEVRON_CLASS,
  HOME_DASHBOARD_JUMP_DETAILS_CLASS,
  HOME_DASHBOARD_JUMP_ITEM_CLASS,
  HOME_DASHBOARD_JUMP_MENU_CLASS,
  HOME_DASHBOARD_JUMP_START_OVER_ITEM_CLASS,
  HOME_DASHBOARD_JUMP_START_OVER_LI_CLASS,
  HOME_DASHBOARD_JUMP_SUMMARY_CLASS,
  HOME_DASHBOARD_UTILITY_BAR_CLASS,
  HOME_DASHBOARD_UTILITY_BAR_INNER_CLASS,
} from "@/lib/toolFlowStyles";

export type HomeDashboardUtilityBarProps = {
  jumps: HomeDashboardJump[];
  onStartOver: () => void;
};

/**
 * Sticky locked-report Jump to… navigation bar (gated sections + Start over).
 * Native {@code <details>} so the chevron can use {@code group-open:rotate-180}.
 * Sub-header under PageHero; sticks at the viewport top after the hero scrolls away.
 */
export function HomeDashboardUtilityBar({
  jumps,
  onStartOver,
}: HomeDashboardUtilityBarProps) {
  const barRef = useRef<HTMLElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  /**
   * Publish the stuck summary-row height only. An open Jump to… menu must not
   * inflate scroll-mt (that overscrolled, then closing before jump undershot).
   */
  const syncUtilityBarHeight = () => {
    const bar = barRef.current;
    if (!bar) return;
    const summary = detailsRef.current?.querySelector(":scope > summary");
    const heightEl = summary instanceof HTMLElement ? summary : bar;
    document.documentElement.style.setProperty(
      HOME_DASHBOARD_UTILITY_BAR_HEIGHT_VAR,
      `${heightEl.offsetHeight}px`,
    );
  };

  useLayoutEffect(() => {
    const bar = barRef.current;
    const details = detailsRef.current;
    if (!bar) return;

    syncUtilityBarHeight();
    const observer = new ResizeObserver(syncUtilityBarHeight);
    observer.observe(bar);
    const summary = details?.querySelector(":scope > summary");
    if (summary instanceof HTMLElement) observer.observe(summary);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty(
        HOME_DASHBOARD_UTILITY_BAR_HEIGHT_VAR,
      );
    };
  }, []);

  const closeMenu = () => {
    if (detailsRef.current) detailsRef.current.open = false;
  };

  const onJump = (jumpId: string) => {
    closeMenu();
    syncUtilityBarHeight();
    if (jumpId === HOME_DASHBOARD_JUMP_START_OVER_VALUE) {
      onStartOver();
      return;
    }
    const jump = jumps.find((item) => item.id === jumpId);
    if (jump == null) return;
    // Summary (page top): same behavior as Back to top (main is full height; nearest
    // scroll on #page-top would not reliably return to the viewport top).
    if (jump.id === "top") {
      let movedFocus = false;
      const focusPageTop = () => {
        if (movedFocus) return;
        movedFocus = true;
        window.removeEventListener("scrollend", focusPageTop);
        document.getElementById(jump.focusId)?.focus({ preventScroll: true });
      };
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.addEventListener("scrollend", focusPageTop);
      window.setTimeout(focusPageTop, 600);
      return;
    }
    focusNearestDashboardSection({
      focusId: jump.focusId,
      highlightId: jump.highlightId,
    });
  };

  return (
    <nav
      ref={barRef}
      id={HOME_DASHBOARD_UTILITY_BAR_ID}
      aria-label="On this page"
      className={HOME_DASHBOARD_UTILITY_BAR_CLASS}
    >
      <div className={HOME_DASHBOARD_UTILITY_BAR_INNER_CLASS}>
        <details ref={detailsRef} className={HOME_DASHBOARD_JUMP_DETAILS_CLASS}>
          <summary
            className={HOME_DASHBOARD_JUMP_SUMMARY_CLASS}
          >
            <span>{HOME_DASHBOARD_JUMP_SUMMARY_LABEL}</span>
            <DisclosureChevron className={HOME_DASHBOARD_JUMP_CHEVRON_CLASS} />
          </summary>
          <ul className={HOME_DASHBOARD_JUMP_MENU_CLASS}>
            {jumps.map((jump) => (
              <li key={jump.id}>
                <button
                  type="button"
                  className={HOME_DASHBOARD_JUMP_ITEM_CLASS}
                  onClick={() => onJump(jump.id)}
                >
                  {jump.label}
                </button>
              </li>
            ))}
            <li className={HOME_DASHBOARD_JUMP_START_OVER_LI_CLASS}>
              <button
                type="button"
                className={HOME_DASHBOARD_JUMP_START_OVER_ITEM_CLASS}
                onClick={() => onJump(HOME_DASHBOARD_JUMP_START_OVER_VALUE)}
              >
                {HOME_DASHBOARD_JUMP_START_OVER_LABEL}
              </button>
            </li>
          </ul>
        </details>
      </div>
    </nav>
  );
}
