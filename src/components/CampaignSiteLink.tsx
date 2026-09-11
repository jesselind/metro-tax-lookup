// Civic Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ReactNode } from "react";
import { btnCampaignOutlineMd } from "@/lib/buttonClasses";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { COUNTY_EXTERNAL_LINK_CLASS } from "@/lib/toolFlowStyles";

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
      />
    </svg>
  );
}

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
  /**
   * `outline` = home disclosure control (campaign dark-green outline + Inter).
   * `link` = inline footer / privacy text link.
   */
  variant?: "link" | "outline";
}) {
  const href = SITE_CONFIG.campaignSiteUrl?.trim() || null;
  if (!href) return null;

  const base =
    variant === "outline"
      ? `${btnCampaignOutlineMd} box-border w-full max-w-full cursor-pointer whitespace-normal px-3 py-2.5 text-center text-[14pt] leading-snug tracking-tight sm:w-auto`
      : COUNTY_EXTERNAL_LINK_CLASS;

  const label = children ?? SITE_CONFIG.campaignSiteLabel;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ? `${base} ${className}` : base}
    >
      {variant === "outline" ? (
        <span>
          {label}
          <span
            className="ml-2.5 inline-flex h-[1em] w-[1.25em] shrink-0 -translate-y-0.5 items-center justify-center align-middle"
            aria-hidden
          >
            <ExternalLinkIcon className="block size-[1.25em]" />
          </span>
        </span>
      ) : (
        label
      )}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** True when a campaign URL is configured (home / footer disclosure chrome). */
export function hasCampaignSiteLink(): boolean {
  return Boolean(SITE_CONFIG.campaignSiteUrl?.trim());
}
