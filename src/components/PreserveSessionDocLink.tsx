// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import Link from "next/link";
import type { ReactNode, Ref } from "react";
import { TERM_LINK_CLASS } from "@/lib/toolFlowStyles";

type PreserveSessionDocLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  onClick?: () => void;
  /** Anchor ref for Radix `Popover.Close asChild` and similar wrappers. */
  ref?: Ref<HTMLAnchorElement>;
};

/**
 * In-app doc link (/sources, /glossary, …) from mid-flow UI (lookup, modals, popovers).
 * Opens in a new tab so parcel/levy session state stays in the origin tab.
 * Site chrome (header/footer) should keep same-tab navigation.
 *
 * For `/sources` from a resolved county dashboard, prefer `sourcesPageHref({ countyId })`
 * so the methodology selector preselects that county.
 */
export function PreserveSessionDocLink({
  href,
  children,
  className = TERM_LINK_CLASS,
  "aria-label": ariaLabel,
  onClick,
  ref,
}: PreserveSessionDocLinkProps) {
  const accessibleName = ariaLabel
    ? `${ariaLabel} (opens in a new tab)`
    : undefined;
  return (
    <Link
      ref={ref}
      href={href}
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
}
