// Civic Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import {
  SITE_BRAND_NAME,
  SITE_BRAND_TAGLINE,
} from "@/content/trademarkNotice";
import {
  PAGE_HERO_BRAND_LINE_CLASS,
  PAGE_HERO_BRAND_STACK_CLASS,
  PAGE_HERO_BRAND_TAGLINE_CLASS,
  PAGE_HERO_BRAND_TM_CLASS,
} from "@/lib/toolFlowStyles";

export function SiteBrandHeroTitle() {
  return (
    <span className={PAGE_HERO_BRAND_STACK_CLASS}>
      <span className={PAGE_HERO_BRAND_LINE_CLASS}>
        {SITE_BRAND_NAME}
        <span className={PAGE_HERO_BRAND_TM_CLASS} aria-hidden="true">
          ™
        </span>
      </span>
      <span className={PAGE_HERO_BRAND_TAGLINE_CLASS}>{SITE_BRAND_TAGLINE}</span>
    </span>
  );
}
