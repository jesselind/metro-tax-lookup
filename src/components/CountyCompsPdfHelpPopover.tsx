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

type CountyCompsPdfHelpPopoverProps = {
  ariaLabel: string;
  icon: ReactNode;
  children: ReactNode;
  triggerClassName?: string;
};

/**
 * Comps PDF help: icon opens an explanation when there is no direct county PDF
 * link (gap, demo, missing AIN). Kept separate from {@link InfoHintPopover},
 * which is text-trigger only.
 */
export function CountyCompsPdfHelpPopover({
  ariaLabel,
  icon,
  children,
  triggerClassName = COMPS_PDF_ICON_CONTROL_CLASS,
}: CountyCompsPdfHelpPopoverProps) {
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
    </Popover.Root>
  );
}
