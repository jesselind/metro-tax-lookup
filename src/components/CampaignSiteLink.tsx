// Civic Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ReactNode } from "react";
import { btnOutlineSecondaryMd } from "@/lib/buttonClasses";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { COUNTY_EXTERNAL_LINK_CLASS } from "@/lib/toolFlowStyles";

/**
 * Outbound link to the configured campaign / candidate site.
 *
 * FORK REQUIRED: Do not hardcode another campaign URL here. Driven entirely by
 * {@link SITE_CONFIG.campaignSiteUrl} and related `campaign*` fields in
 * `src/lib/siteConfig.ts`. Change or clear those when you fork; returns null
 * when the URL is unset.
 */
export function CampaignSiteLink({
  className,
  children,
  variant = "link",
}: {
  className?: string;
  /** Defaults to {@link SITE_CONFIG.campaignSiteLabel}. */
  children?: ReactNode;
  /** `outline` = secondary border button (home disclosure). */
  variant?: "link" | "outline";
}) {
  const href = SITE_CONFIG.campaignSiteUrl?.trim() || null;
  if (!href) return null;

  const base =
    variant === "outline"
      ? `${btnOutlineSecondaryMd} box-border w-full max-w-full cursor-pointer whitespace-normal px-3 py-2.5 text-center text-base leading-snug tracking-tight sm:w-auto`
      : COUNTY_EXTERNAL_LINK_CLASS;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ? `${base} ${className}` : base}
    >
      {children ?? SITE_CONFIG.campaignSiteLabel}<span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** True when a campaign URL is configured (home / footer disclosure chrome). */
export function hasCampaignSiteLink(): boolean {
  return Boolean(SITE_CONFIG.campaignSiteUrl?.trim());
}
