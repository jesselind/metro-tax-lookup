// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { HOME_SALE_HISTORY_ID } from "@/lib/homeDashboardJumps";
import { focusNearestDashboardSection } from "@/lib/focusNearestDashboardSection";

/** Focus the parcel sale-history table (opens a collapsed disclosure if needed). */
export function jumpToParcelSaleHistory(): void {
  if (typeof document === "undefined") return;
  const saleEl = document.getElementById(HOME_SALE_HISTORY_ID);
  if (!(saleEl instanceof HTMLElement)) return;

  const hiddenAncestor = saleEl.closest("[hidden]");
  if (hiddenAncestor instanceof HTMLElement && hiddenAncestor.id) {
    const toggle = document.querySelector(
      `[aria-controls="${CSS.escape(hiddenAncestor.id)}"]`,
    );
    if (toggle instanceof HTMLElement) toggle.click();
  }

  const run = () =>
    focusNearestDashboardSection({
      focusId: HOME_SALE_HISTORY_ID,
      highlightId: HOME_SALE_HISTORY_ID,
    });
  if (hiddenAncestor) {
    requestAnimationFrame(run);
  } else {
    run();
  }
}
