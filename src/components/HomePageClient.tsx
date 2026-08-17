// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HomeParcelAddressLookup } from "@/components/HomeParcelAddressLookup";
import { PageHero } from "@/components/PageHero";
import {
  DEFAULT_AUDIENCE_MODE,
  type AudienceMode,
} from "@/lib/audienceMode";
import {
  HOME_LANDING_INTRO_CLASS,
  HOME_LANDING_INTRO_LINE_CLASS,
  HOME_PAGE_HERO_INTRO_GROUP_CLASS,
  PAGE_HERO_ACTION_BUTTON_CLASS,
  TOOL_PAGE_INNER_CLASS_HUB,
} from "@/lib/toolFlowStyles";
import { SITE_BRAND_NAME } from "@/content/trademarkNotice";

const START_OVER_ARIA_LABEL =
  "Reset address lookup, parcel PIN, search results, and levy and metro sections on this page";

export function HomePageClient() {
  const [viewingParcel, setViewingParcel] = useState(false);
  const [audienceMode, setAudienceMode] = useState<AudienceMode>(
    DEFAULT_AUDIENCE_MODE,
  );
  const startOverHeaderRef = useRef<HTMLButtonElement>(null);
  const resetRef = useRef<() => void>(() => {});

  const handleViewingParcelChange = useCallback(
    (active: boolean, reset: () => void) => {
      setViewingParcel(active);
      resetRef.current = reset;
    },
    [],
  );

  const handleAudienceModeChange = useCallback((mode: AudienceMode) => {
    setAudienceMode(mode);
  }, []);

  const prevViewingParcelRef = useRef(false);
  useEffect(() => {
    if (viewingParcel && !prevViewingParcelRef.current) {
      startOverHeaderRef.current?.focus();
    }
    prevViewingParcelRef.current = viewingParcel;
  }, [viewingParcel]);

  const landingLine =
    audienceMode === "rent"
      ? "You're still paying property tax if you rent. Where's it going?"
      : "See where your property tax is actually going.";

  return (
    <main
      id="page-top"
      tabIndex={-1}
      className="flex flex-col overflow-x-hidden bg-white text-slate-900"
    >
      <div className={TOOL_PAGE_INNER_CLASS_HUB}>
        <div className={HOME_PAGE_HERO_INTRO_GROUP_CLASS}>
          <PageHero
            title={
              <>
                {SITE_BRAND_NAME}
                <span
                  className="ms-0.5 align-super text-[0.55em] font-semibold tracking-normal"
                  aria-hidden="true"
                >
                  ™
                </span>
              </>
            }
            actions={
              viewingParcel ? (
                <button
                  ref={startOverHeaderRef}
                  type="button"
                  className={PAGE_HERO_ACTION_BUTTON_CLASS}
                  onClick={() => {
                    resetRef.current();
                  }}
                  aria-label={START_OVER_ARIA_LABEL}
                >
                  Start over
                </button>
              ) : null
            }
          />
          {!viewingParcel ? (
            <p className={HOME_LANDING_INTRO_CLASS}>
              <span className={HOME_LANDING_INTRO_LINE_CLASS}>{landingLine}</span>
            </p>
          ) : null}
        </div>
        <HomeParcelAddressLookup
          onViewingParcelChange={handleViewingParcelChange}
          onAudienceModeChange={handleAudienceModeChange}
        />
      </div>
    </main>
  );
}
