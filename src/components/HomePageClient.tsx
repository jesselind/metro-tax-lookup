// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DouglasPropertyDataAccuracyKnownIssueBanner } from "@/content/douglasPropertyDataAccuracyKnownIssueBanner";
import { HomeDashboardUtilityBar } from "@/components/HomeDashboardUtilityBar";
import { HomeParcelAddressLookup } from "@/components/HomeParcelAddressLookup";
import { PageHero } from "@/components/PageHero";
import { SiteBrandHeroTitle } from "@/components/SiteBrandHeroTitle";
import {
  DEFAULT_AUDIENCE_MODE,
  type AudienceMode,
} from "@/lib/audienceMode";
import type { HomeLockedUtilityNav } from "@/lib/homeDashboardJumps";
import {
  HOME_LANDING_INTRO_CLASS,
  HOME_LANDING_INTRO_LINE_CLASS,
  HOME_PAGE_HERO_INTRO_GROUP_CLASS,
  PAGE_HERO_ACTION_BUTTON_CLASS,
  TOOL_PAGE_INNER_CLASS_HUB,
} from "@/lib/toolFlowStyles";

const START_OVER_ARIA_LABEL =
  "Reset address lookup, parcel PIN, search results, and levy and metro sections on this page";

export function HomePageClient() {
  const [viewingParcel, setViewingParcel] = useState(false);
  const [lockedUtilityNav, setLockedUtilityNav] =
    useState<HomeLockedUtilityNav | null>(null);
  const [audienceMode, setAudienceMode] = useState<AudienceMode>(
    DEFAULT_AUDIENCE_MODE,
  );
  const startOverHeroRef = useRef<HTMLButtonElement>(null);
  const resetRef = useRef<() => void>(() => {});

  const handleViewingParcelChange = useCallback(
    (active: boolean, reset: () => void) => {
      setViewingParcel(active);
      resetRef.current = reset;
    },
    [],
  );

  const handleLockedUtilityNavChange = useCallback(
    (nav: HomeLockedUtilityNav | null) => {
      setLockedUtilityNav(nav);
    },
    [],
  );

  const handleAudienceModeChange = useCallback((mode: AudienceMode) => {
    setAudienceMode(mode);
  }, []);

  const showLockedUtilityBar = lockedUtilityNav != null;
  const showHeroStartOver = viewingParcel;

  /**
   * When the locked report appears without the Jump to… bar yet, move focus to
   * hero Start over. Do not autofocus Jump to… — HomeParcelAddressLookup already
   * focuses #page-top on lock; focusing the summary looks like a selected TOC.
   */
  const prevViewingParcelRef = useRef(false);
  useEffect(() => {
    const unlockedViewingJustAppeared =
      viewingParcel &&
      !prevViewingParcelRef.current &&
      !showLockedUtilityBar;

    if (unlockedViewingJustAppeared) {
      startOverHeroRef.current?.focus();
    }

    prevViewingParcelRef.current = viewingParcel;
  }, [viewingParcel, showLockedUtilityBar]);

  const landingLine =
    audienceMode === "rent"
      ? "You're still paying property tax if you rent. Where's it going?"
      : "See where your property tax is actually going.";

  const onStartOver = useCallback(() => {
    resetRef.current();
  }, []);

  return (
    <main
      id="page-top"
      tabIndex={-1}
      className="flex flex-col bg-white text-slate-900"
    >
      <div className={TOOL_PAGE_INNER_CLASS_HUB}>
        {/*
          Sticky utility bar must share this tall column with the report body.
          Do not wrap hero+bar alone: sticky only lasts through its parent height.
        */}
        <div
          className={
            showLockedUtilityBar
              ? undefined
              : HOME_PAGE_HERO_INTRO_GROUP_CLASS
          }
        >
          <PageHero
            title={<SiteBrandHeroTitle />}
            actions={
              showHeroStartOver ? (
                <button
                  ref={startOverHeroRef}
                  type="button"
                  className={PAGE_HERO_ACTION_BUTTON_CLASS}
                  onClick={onStartOver}
                  aria-label={START_OVER_ARIA_LABEL}
                >
                  Start over
                </button>
              ) : null
            }
          />
          {!viewingParcel ? (
            <p className={HOME_LANDING_INTRO_CLASS}>
              <span className={HOME_LANDING_INTRO_LINE_CLASS}>
                {landingLine}
              </span>
            </p>
          ) : null}
        </div>
        {showLockedUtilityBar && lockedUtilityNav ? (
          <HomeDashboardUtilityBar
            jumps={lockedUtilityNav.jumps}
            onStartOver={onStartOver}
          />
        ) : null}
        {showLockedUtilityBar &&
        lockedUtilityNav?.propertyDataAccuracyWarning ? (
          <DouglasPropertyDataAccuracyKnownIssueBanner
            countyId={lockedUtilityNav.countyId}
          />
        ) : null}
        {/*
          Horizontal pad matches arrive-ring clearance (ring-2 + ring-offset-4).
          overflow-x-clip stays for sticky; -mx keeps column width with TOOL_PAGE_INNER px.
        */}
        <div className="min-w-0 overflow-x-clip px-2 -mx-2">
          <HomeParcelAddressLookup
            onViewingParcelChange={handleViewingParcelChange}
            onAudienceModeChange={handleAudienceModeChange}
            onLockedUtilityNavChange={handleLockedUtilityNavChange}
          />
        </div>
      </div>
    </main>
  );
}
