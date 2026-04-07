"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HomeParcelAddressLookup } from "@/components/HomeParcelAddressLookup";
import { PageHero } from "@/components/PageHero";
import {
  HOME_LANDING_INTRO_CLASS,
  HOME_LANDING_INTRO_LINE1_CLASS,
  HOME_LANDING_INTRO_LINE2_CLASS,
  HOME_PAGE_HERO_INTRO_GROUP_CLASS,
  PAGE_HERO_ACTION_BUTTON_CLASS,
  TOOL_PAGE_INNER_CLASS_HUB,
} from "@/lib/toolFlowStyles";

const START_OVER_ARIA_LABEL =
  "Reset address lookup, parcel PIN, search results, and levy and metro sections on this page";

export function HomePageClient() {
  const [viewingParcel, setViewingParcel] = useState(false);
  const startOverHeaderRef = useRef<HTMLButtonElement>(null);
  const resetRef = useRef<() => void>(() => {});

  const handleViewingParcelChange = useCallback(
    (active: boolean, reset: () => void) => {
      setViewingParcel(active);
      resetRef.current = reset;
    },
    [],
  );

  const prevViewingParcelRef = useRef(false);
  useEffect(() => {
    if (viewingParcel && !prevViewingParcelRef.current) {
      startOverHeaderRef.current?.focus();
    }
    prevViewingParcelRef.current = viewingParcel;
  }, [viewingParcel]);

  return (
    <main className="flex flex-col overflow-x-hidden bg-white text-slate-900">
      <div className={TOOL_PAGE_INNER_CLASS_HUB}>
        <div className={HOME_PAGE_HERO_INTRO_GROUP_CLASS}>
          <PageHero
            title="Property tax tools"
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
              <span className={HOME_LANDING_INTRO_LINE1_CLASS}>
                Get a clear picture of your property tax bill.
              </span>
              <span className={HOME_LANDING_INTRO_LINE2_CLASS}>
                See where your money is actually going.
              </span>
            </p>
          ) : null}
        </div>
        <HomeParcelAddressLookup
          onViewingParcelChange={handleViewingParcelChange}
        />
      </div>
    </main>
  );
}
