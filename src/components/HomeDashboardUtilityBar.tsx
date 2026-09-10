// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import {
  useLayoutEffect,
  useRef,
  type Ref,
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
  /** Focus target when the locked report first appears. */
  jumpSummaryRef?: Ref<HTMLElement>;
};

/**
 * Sticky locked-report TOC chrome: Jump to… (gated sections + Start over).
 * Native {@code <details>} so the chevron can use {@code group-open:rotate-180}.
 * Sub-header under PageHero; sticks at the viewport top after the hero scrolls away.
 */
export function HomeDashboardUtilityBar({
  jumps,
  onStartOver,
  jumpSummaryRef,
}: HomeDashboardUtilityBarProps) {
  const barRef = useRef<HTMLElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;

    const syncHeight = () => {
      document.documentElement.style.setProperty(
        HOME_DASHBOARD_UTILITY_BAR_HEIGHT_VAR,
        `${el.offsetHeight}px`,
      );
    };
    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(el);
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
    if (jumpId === HOME_DASHBOARD_JUMP_START_OVER_VALUE) {
      onStartOver();
      return;
    }
    const jump = jumps.find((item) => item.id === jumpId);
    if (jump == null) return;
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
            ref={jumpSummaryRef}
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
