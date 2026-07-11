// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ReactNode } from "react";

/** Prefer line breaks at slashes in long county strings (e.g. roof types). */
export function parcelRecordCellText(value: string): ReactNode {
  if (!value.includes("/")) {
    return value;
  }
  const parts = value.split("/");
  return parts.map((part, index) => (
    <span key={`${index}-${part}`}>
      {index > 0 ? (
        <>
          /<wbr />
        </>
      ) : null}
      {part}
    </span>
  ));
}
