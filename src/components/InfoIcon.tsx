// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { InfoCircleGlyph } from "@/components/InfoCircleGlyph";

export function InfoIcon() {
  return (
    <span
      className="flex size-4 shrink-0 items-center justify-center rounded-full bg-indigo-900 text-white"
      aria-hidden
    >
      <InfoCircleGlyph variant="badge" className="size-4" />
    </span>
  );
}
