// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ComponentType, SVGProps } from "react";
import {
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
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

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

const JUMP_ICONS: Record<HomeDashboardJumpId, HeroIcon> = {
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
