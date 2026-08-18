// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import * as Popover from "@radix-ui/react-popover";
import type { ReactNode } from "react";

/** Shared hit target for the comps PDF icon (link or help popover). */
export const COMPS_PDF_ICON_CONTROL_CLASS =
  "inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-slate-600 outline-offset-2 transition-colors hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2";

const PANEL_CLASS =
  "z-50 max-w-[min(22rem,calc(100vw-2rem))] max-h-[min(18rem,60vh)] overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white p-3 text-left text-sm leading-relaxed text-slate-800 shadow-lg";

/** Full-tile hit target behind visible county-gap tile content (glossary label stays above in z-order). */
const COMPS_PDF_TILE_OVERLAY_TRIGGER_CLASS =
  "absolute inset-0 z-0 cursor-pointer rounded-[inherit] border-0 bg-transparent p-0 transition-colors hover:bg-red-100/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-600/50";

type CountyCompsPdfTileTrigger = {
  label: ReactNode;
  labelClassName: string;
  status: ReactNode;
  /** County-gap tiles: pass `COUNTY_SERVICE_GAP_SUMMARY_TILE_STATUS_ROW_CLASS` from toolFlowStyles. */
  statusRowClassName?: string;
};

type CountyCompsPdfHelpPopoverProps = {
  ariaLabel: string;
  icon: ReactNode;
  children: ReactNode;
  triggerClassName?: string;
  /**
   * Full-tile trigger: parent tile body must be `relative` with column flex + gap
   * (same as other summary tiles). Glossary label stays above the overlay.
   */
  tileTrigger?: CountyCompsPdfTileTrigger;
};

function CountyCompsPdfHelpPopoverPanel({ children }: { children: ReactNode }) {
  return (
    <Popover.Portal>
      <Popover.Content
        side="bottom"
        align="center"
        sideOffset={6}
        className={PANEL_CLASS}
      >
        {children}
      </Popover.Content>
    </Popover.Portal>
  );
}

/**
 * One-off comps-tile help: opens an explanation when no direct county PDF link is
 * available. Icon-only by default; pass {@link tileTrigger} for a full-tile
 * trigger (parent tile body: relative + column gap like other summary tiles).
 * Kept separate from {@link InfoHintPopover}, which is text-trigger only.
 */
export function CountyCompsPdfHelpPopover({
  ariaLabel,
  icon,
  children,
  triggerClassName = COMPS_PDF_ICON_CONTROL_CLASS,
  tileTrigger,
}: CountyCompsPdfHelpPopoverProps) {
  if (tileTrigger) {
    return (
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={COMPS_PDF_TILE_OVERLAY_TRIGGER_CLASS}
            aria-label={ariaLabel}
          />
        </Popover.Trigger>
        <div
          className={`${tileTrigger.labelClassName} relative z-[2] pointer-events-auto`}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
        >
          {tileTrigger.label}
        </div>
        <div
          className={
            tileTrigger.statusRowClassName ??
            "pointer-events-none relative z-[1] flex min-w-0 items-center gap-2.5"
          }
        >
          {tileTrigger.status}
          <span className="inline-flex shrink-0 text-red-700" aria-hidden>
            {icon}
          </span>
        </div>
        <CountyCompsPdfHelpPopoverPanel>{children}</CountyCompsPdfHelpPopoverPanel>
      </Popover.Root>
    );
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={triggerClassName}
          aria-label={ariaLabel}
        >
          {icon}
        </button>
      </Popover.Trigger>
      <CountyCompsPdfHelpPopoverPanel>{children}</CountyCompsPdfHelpPopoverPanel>
    </Popover.Root>
  );
}
