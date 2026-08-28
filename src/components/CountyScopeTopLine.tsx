// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import {
  countyConfigById,
  wiredCountyConfigs,
  type CountyConfig,
} from "@/lib/countyConfig";

/** Show county label on search rows when more than one county is wired. */
export function showCountyScopeTopLine(): boolean {
  return wiredCountyConfigs().length > 1;
}

export type CountyScopeTopLineProps = {
  countyId?: string | null;
  config?: CountyConfig | null;
  className?: string;
};

/**
 * County display name as a top line on typeahead / matched-address rows and
 * dashboard summary when multiple counties are wired.
 */
export function CountyScopeTopLine({
  countyId,
  config: configProp,
  className,
}: CountyScopeTopLineProps) {
  if (!showCountyScopeTopLine()) return null;
  const config =
    configProp ?? (countyId ? countyConfigById(countyId) : null) ?? null;
  if (!config) return null;
  return (
    <p
      className={
        className ??
        "text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm"
      }
    >
      {config.displayName}
    </p>
  );
}
