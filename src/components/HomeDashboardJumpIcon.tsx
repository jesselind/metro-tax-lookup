// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  HomeModernIcon,
  MapIcon,
  ScaleIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import {
  HOME_DASHBOARD_JUMP_START_OVER_VALUE,
  type HomeDashboardJumpId,
} from "@/lib/homeDashboardJumps";
import { DASHBOARD_SECTION_HEADING_CLASS } from "@/lib/toolFlowStyles";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

const JUMP_ICONS: Record<HomeDashboardJumpId, HeroIcon> = {
  summary: ChartBarIcon,
  "rent-pressure": BanknotesIcon,
  levies: ChartPieIcon,
  "property-details": HomeModernIcon,
  "appraised-assessed": ScaleIcon,
  "sale-history": ClipboardDocumentListIcon,
  buildings: BuildingOffice2Icon,
  area: ArrowsPointingOutIcon,
  "land-line": MapIcon,
  permits: ClipboardDocumentCheckIcon,
  "county-compare": BuildingLibraryIcon,
  comps: TableCellsIcon,
  feedback: ChatBubbleLeftRightIcon,
};

const START_OVER_ICON: HeroIcon = ArrowPathIcon;

/** Decorative TOC glyph; parent button owns the accessible name. */
export const HOME_DASHBOARD_JUMP_ICON_CLASS =
  "h-5 w-5 shrink-0 opacity-90";

/** Same glyph beside locked-report section titles (slightly larger than TOC). */
export const HOME_DASHBOARD_SECTION_JUMP_ICON_CLASS =
  "h-6 w-6 shrink-0 text-slate-700 sm:h-7 sm:w-7";

export function HomeDashboardJumpIcon({
  jumpId,
  className = HOME_DASHBOARD_JUMP_ICON_CLASS,
}: {
  jumpId: HomeDashboardJumpId | typeof HOME_DASHBOARD_JUMP_START_OVER_VALUE;
  className?: string;
}) {
  const Icon =
    jumpId === HOME_DASHBOARD_JUMP_START_OVER_VALUE
      ? START_OVER_ICON
      : JUMP_ICONS[jumpId];
  return <Icon className={className} aria-hidden />;
}

type HeadingTag = "h2" | "h3" | "h4";

/**
 * Locked-report section title with the same Heroicon as the Jump TOC entry.
 *
 * Icon and title use `items-center`. When {@link trailing} is set (e.g. a
 * "What is this?" control), title and trailing share `items-baseline` so mixed
 * font sizes still line up on the text baseline; the icon stays outside that
 * baseline group so it does not pull the help link down.
 */
export function DashboardSectionJumpHeading({
  jumpId,
  as = "h3",
  id,
  className = "",
  wrapperClassName,
  tabIndex,
  trailing,
  children,
}: {
  jumpId: HomeDashboardJumpId;
  as?: HeadingTag;
  id?: string;
  /** Extra classes on the heading tag (scroll-mt, outline-none). Type styles always apply. */
  className?: string;
  /**
   * Classes on the icon+title row (display). Use instead of putting `flex` /
   * `hidden` on {@link className} — the heading tag is text-only.
   */
  wrapperClassName?: string;
  tabIndex?: number;
  /** Optional control after the title (glossary "What is this?"); baseline-aligned with the title. */
  trailing?: ReactNode;
  children: ReactNode;
}) {
  const Tag = as;
  const heading = (
    <Tag
      id={id}
      tabIndex={tabIndex}
      className={`min-w-0 ${DASHBOARD_SECTION_HEADING_CLASS} ${className}`.trim()}
    >
      {children}
    </Tag>
  );

  return (
    <div
      className={`${
        wrapperClassName ?? "flex"
      } min-w-0 flex-wrap items-center gap-2 sm:gap-2.5`.trim()}
    >
      <HomeDashboardJumpIcon
        jumpId={jumpId}
        className={HOME_DASHBOARD_SECTION_JUMP_ICON_CLASS}
      />
      {trailing != null ? (
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          {heading}
          {trailing}
        </div>
      ) : (
        heading
      )}
    </div>
  );
}
