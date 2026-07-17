// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import Link from "next/link";
import { forwardRef } from "react";
import { glossaryTermHref, hasGlossaryFullEntry } from "@/lib/glossary";
import { TERM_LINK_CLASS } from "@/lib/toolFlowStyles";

type GlossaryFullDefinitionLinkProps = {
  termId: string;
  /** Visible link text. */
  children?: string;
  className?: string;
  "aria-label"?: string;
  onClick?: () => void;
};

/**
 * Deep link to a full `/glossary` entry. Opens in a new tab so tool-flow state
 * (e.g. parcel details) stays in the origin tab. Renders nothing when that term
 * has no aside (popover-only briefs such as architectural style).
 *
 * Forwards the anchor ref so callers can wrap with Radix `Popover.Close asChild`.
 */
export const GlossaryFullDefinitionLink = forwardRef<
  HTMLAnchorElement,
  GlossaryFullDefinitionLinkProps
>(function GlossaryFullDefinitionLink(
  {
    termId,
    children = "More in Glossary",
    className = TERM_LINK_CLASS,
    "aria-label": ariaLabel,
    onClick,
  },
  ref,
) {
  if (!hasGlossaryFullEntry(termId)) return null;
  const accessibleName = ariaLabel
    ? `${ariaLabel} (opens in a new tab)`
    : undefined;
  return (
    <Link
      ref={ref}
      href={glossaryTermHref(termId)}
      className={className}
      aria-label={accessibleName}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      {accessibleName ? null : (
        <span className="sr-only"> (opens in a new tab)</span>
      )}
    </Link>
  );
});
