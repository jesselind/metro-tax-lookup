// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { Ref } from "react";
import { PreserveSessionDocLink } from "@/components/PreserveSessionDocLink";
import { glossaryTermHref, hasGlossaryFullEntry } from "@/lib/glossary";
import { TERM_LINK_CLASS } from "@/lib/toolFlowStyles";

type GlossaryFullDefinitionLinkProps = {
  termId: string;
  /** Visible link text. */
  children?: string;
  className?: string;
  "aria-label"?: string;
  onClick?: () => void;
  /** Anchor ref for Radix `Popover.Close asChild` and similar wrappers. */
  ref?: Ref<HTMLAnchorElement>;
};

/**
 * Deep link to a full `/glossary` entry. Opens in a new tab so tool-flow state
 * (e.g. parcel details) stays in the origin tab. Renders nothing when that term
 * has no aside (popover-only briefs such as architectural style).
 */
export function GlossaryFullDefinitionLink({
  termId,
  children = "More in Glossary",
  className = TERM_LINK_CLASS,
  "aria-label": ariaLabel,
  onClick,
  ref,
}: GlossaryFullDefinitionLinkProps) {
  if (!hasGlossaryFullEntry(termId)) return null;
  return (
    <PreserveSessionDocLink
      ref={ref}
      href={glossaryTermHref(termId)}
      className={className}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </PreserveSessionDocLink>
  );
}
