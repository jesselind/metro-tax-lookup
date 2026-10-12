// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ReactNode, Ref } from "react";
import {
  PAGE_HERO_INNER_CLASS,
  PAGE_HERO_OUTER_CLASS,
  PAGE_HERO_SLATE_BAR_CLASS,
  PAGE_HERO_STICKY_OUTER_CLASS,
  PAGE_HERO_TITLE_CLASS,
} from "@/lib/toolFlowStyles";

type PageHeroProps = {
  /** Page title (plain string or markup, e.g. brand name + trademark mark). */
  title: ReactNode;
  /** Optional control (e.g. Start over) on the right. Same row as the title at all widths. */
  actions?: ReactNode;
  /**
   * Unlocked-home section nav in the title bar (inline on large screens,
   * hamburger on smaller). Same row as the title; use instead of {@link actions}
   * on unlocked landing.
   */
  sectionNav?: ReactNode;
  /** Stick the full-bleed title bar to the top of the viewport (home landing). */
  sticky?: boolean;
  /** Element id when sticky home landing navbar is active. */
  stickyId?: string;
  /** Ref to the sticky outer shell (for publishing closed-bar height). */
  stickyRef?: Ref<HTMLElement>;
};

export function PageHero({
  title,
  actions,
  sectionNav,
  sticky = false,
  stickyId,
  stickyRef,
}: PageHeroProps) {
  return (
    <header
      ref={stickyRef}
      id={stickyId}
      className={sticky ? PAGE_HERO_STICKY_OUTER_CLASS : PAGE_HERO_OUTER_CLASS}
    >
      <div className={PAGE_HERO_SLATE_BAR_CLASS}>
        <div className={PAGE_HERO_INNER_CLASS}>
          <div className="flex min-h-0 w-full flex-nowrap items-center gap-3 sm:gap-4">
            <h1 className={`min-w-0 flex-1 ${PAGE_HERO_TITLE_CLASS}`}>
              {title}
            </h1>
            {sectionNav ? (
              <div className="min-w-0 shrink-0">{sectionNav}</div>
            ) : null}
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        </div>
      </div>
    </header>
  );
}
