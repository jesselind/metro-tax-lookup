// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { focusNearestDashboardSection } from "@/lib/focusNearestDashboardSection";
import {
  MILL_LEVY_STACK_HEADING_ID,
  MILL_LEVY_TILES_ID,
} from "@/content/millLevySummaryCopy";

/** Focus Where is your money going? (levy stack heading + tiles arrive ring). */
export function jumpToLevyStack(): void {
  if (typeof document === "undefined") return;
  focusNearestDashboardSection({
    focusId: MILL_LEVY_STACK_HEADING_ID,
    highlightId: MILL_LEVY_TILES_ID,
  });
}
