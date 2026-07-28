// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { Fragment } from "react";
import type { SitusEnvelopeDisplayRow } from "@/lib/addressLabelDifference";

export type SitusEnvelopeAddressProps = {
  row: SitusEnvelopeDisplayRow;
  className?: string;
};

/**
 * Two-line postage-style situs address (street, then city / state / ZIP), with
 * optional bold tokens for what differs across a match set.
 */
export function SitusEnvelopeAddress({
  row,
  className = "",
}: SitusEnvelopeAddressProps) {
  const { streetLine, localityLine, streetSegments } = row;
  return (
    <span className={`block min-w-0 ${className}`.trim()}>
      <span className="block font-medium leading-snug text-slate-900">
        {streetSegments != null
          ? streetSegments.map((seg, segIndex) => (
              <Fragment key={segIndex}>
                {segIndex > 0 ? " " : null}
                {seg.emphasize ? (
                  <strong className="font-semibold">{seg.text}</strong>
                ) : (
                  seg.text
                )}
              </Fragment>
            ))
          : streetLine}
      </span>
      {localityLine != null ? (
        <span className="mt-0.5 block text-sm font-normal leading-snug text-slate-600">
          {localityLine}
        </span>
      ) : null}
    </span>
  );
}
