// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { LevyExplainerCitationBlock } from "@/lib/levyExplainer";
import { safeHttpOrHttpsUrl } from "@/lib/safeExternalHref";
import { COUNTY_EXTERNAL_LINK_CLASS } from "@/lib/toolFlowStyles";

export function LevyExplainerCitationBlocks({
  blocks,
  proseClass,
}: {
  blocks: LevyExplainerCitationBlock[];
  proseClass: string;
}) {
  return (
    <>
      {blocks.map((block, i) => (
        <p key={`${block.label}-${i}`} className={proseClass}>
          <strong className="font-semibold text-slate-900">{block.label}:</strong>
          {" "}
          {block.links.map((link, j) => {
            const safeHref = safeHttpOrHttpsUrl(link.url);
            return (
              <span key={`${block.label}-${i}-link-${j}`}>
                {j > 0 ? (
                  <>
                    {" "}
                    ·{" "}
                  </>
                ) : null}
                {safeHref ? (
                  <a
                    href={safeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={COUNTY_EXTERNAL_LINK_CLASS}
                  >
                    {link.text}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <span className="font-medium text-slate-800">{link.text}</span>
                )}
              </span>
            );
          })}
          {block.afterLinksNote ? (
            <>
              {" "}
              {block.afterLinksNote}
            </>
          ) : null}
        </p>
      ))}
    </>
  );
}
