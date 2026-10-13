// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DouglasPropertyDataAccuracyKnownIssueBanner } from "@/content/douglasPropertyDataAccuracyKnownIssueBanner";
import { HomeLandingNav } from "@/components/HomeLandingNav";
import { HomeParcelAddressLookup } from "@/components/HomeParcelAddressLookup";
import { PageHero } from "@/components/PageHero";
import { SiteBrandHeroTitle } from "@/components/SiteBrandHeroTitle";
import {
  DEFAULT_AUDIENCE_MODE,
  type AudienceMode,
} from "@/lib/audienceMode";
import type { HomeLockedUtilityNav } from "@/lib/homeDashboardJumps";
import {
  HOME_LANDING_JUMP_SCROLL_MT_CLASS,
  HOME_LANDING_LOOKUP_ID,
  HOME_LANDING_NAVBAR_ID,
  type HomeLandingJump,
} from "@/lib/homeLandingJumps";
import {
  HOME_LANDING_INTRO_CLASS,
  HOME_LANDING_INTRO_LINE_CLASS,
  PAGE_HERO_ACTION_BUTTON_CLASS,
  TOOL_PAGE_INNER_CLASS_HUB,
  TOOL_PAGE_INNER_CLASS_HUB_LOCKED_REPORT,
} from "@/lib/toolFlowStyles";

const START_OVER_ARIA_LABEL =
  "Reset address lookup, parcel PIN, search results, and levy and metro sections on this page";

export function HomePageClient() {
  const [viewingParcel, setViewingParcel] = useState(false);
  const [lockedUtilityNav, setLockedUtilityNav] =
    useState<HomeLockedUtilityNav | null>(null);
  const [landingJumps, setLandingJumps] = useState<HomeLandingJump[] | null>(
    null,
  );
  const [audienceMode, setAudienceMode] = useState<AudienceMode>(
    DEFAULT_AUDIENCE_MODE,
  );
  const startOverHeroRef = useRef<HTMLButtonElement>(null);
  const landingNavbarRef = useRef<HTMLElement>(null);
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

  const handleLandingJumpsChange = useCallback(
    (jumps: HomeLandingJump[] | null) => {
      setLandingJumps(jumps);
    },
    [],
  );

  const handleAudienceModeChange = useCallback((mode: AudienceMode) => {
    setAudienceMode(mode);
  }, []);

  const showHeroStartOver = viewingParcel;
  /**
   * Sticky title-bar section menu: unlocked landing only. Never with Start over
   * or a locked report (Jump TOC owns that path).
   */
  const showLandingNav =
    !viewingParcel && lockedUtilityNav == null && landingJumps != null;
  const showKnownIssueBanner =
    lockedUtilityNav?.propertyDataAccuracyWarning === true;

  /**
   * When the locked report appears, move focus to hero Start over if needed.
   * Section nav lives inside the report (not under the hero); lock focus stays
   * on #page-top from HomeParcelAddressLookup.
   */
  const prevViewingParcelRef = useRef(false);
  useEffect(() => {
    const unlockedViewingJustAppeared =
      viewingParcel && !prevViewingParcelRef.current && lockedUtilityNav == null;

    if (unlockedViewingJustAppeared) {
      startOverHeroRef.current?.focus();
    }

    prevViewingParcelRef.current = viewingParcel;
  }, [viewingParcel, lockedUtilityNav]);

  const landingLine =
    audienceMode === "rent"
      ? "You're still paying property tax if you rent. Where's it going?"
      : "See where your property tax is actually going. And why.";

  const onStartOver = useCallback(() => {
    resetRef.current();
  }, []);

  return (
    <main
      id="page-top"
      tabIndex={-1}
      className="flex flex-col bg-white text-slate-900"
    >
      {/*
        Sticky title bar must be a direct child of this tall column (not nested
        in the short hero+intro group). Otherwise sticky only lasts for that
        group's height (~a few dozen px) before the bar scrolls away.
      */}
      <div
        className={
          lockedUtilityNav
            ? TOOL_PAGE_INNER_CLASS_HUB_LOCKED_REPORT
            : TOOL_PAGE_INNER_CLASS_HUB
        }
      >
        <PageHero
          title={<SiteBrandHeroTitle />}
          sticky={showLandingNav}
          stickyId={showLandingNav ? HOME_LANDING_NAVBAR_ID : undefined}
          stickyRef={showLandingNav ? landingNavbarRef : undefined}
          sectionNav={
            showLandingNav && landingJumps != null ? (
              <HomeLandingNav
                jumps={landingJumps}
                navbarRef={landingNavbarRef}
              />
            ) : null
          }
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
          <p
            id={HOME_LANDING_LOOKUP_ID}
            tabIndex={-1}
            className={`${HOME_LANDING_INTRO_CLASS} outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${HOME_LANDING_JUMP_SCROLL_MT_CLASS}`}
          >
            <span className={HOME_LANDING_INTRO_LINE_CLASS}>
              {landingLine}
            </span>
          </p>
        ) : null}
        {showKnownIssueBanner && lockedUtilityNav ? (
          <DouglasPropertyDataAccuracyKnownIssueBanner
            countyId={lockedUtilityNav.countyId}
          />
        ) : null}
        {/*
          Do not put overflow-x-clip here: it becomes a sticky containing block and
          clips the mobile full-bleed section nav. Arrive-ring clearance lives on the
          locked-report main column (HOME_DASHBOARD_MAIN_COLUMN_ARRIVE_CLIP_CLASS).
        */}
        <div className="min-w-0">
          <HomeParcelAddressLookup
            onViewingParcelChange={handleViewingParcelChange}
            onAudienceModeChange={handleAudienceModeChange}
            onLockedUtilityNavChange={handleLockedUtilityNavChange}
            onLandingJumpsChange={handleLandingJumpsChange}
          />
        </div>
      </div>
    </main>
  );
}
