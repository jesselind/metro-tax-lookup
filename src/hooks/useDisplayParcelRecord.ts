// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useMemo } from "react";
import type { ArapahoeParcelRecordRow } from "@/lib/arapahoeParcelLevyData";
import { obfuscateParcelRecordRow } from "@/lib/demoProperty";

/**
 * Apply demo PII masking when needed. Shared by property panel + extended tables
 * so both surfaces always see the same display row.
 */
export function useDisplayParcelRecord(
  record: ArapahoeParcelRecordRow | null,
  demoMode: boolean,
): ArapahoeParcelRecordRow | null {
  return useMemo(
    () =>
      record ? (demoMode ? obfuscateParcelRecordRow(record) : record) : null,
    [record, demoMode],
  );
}
