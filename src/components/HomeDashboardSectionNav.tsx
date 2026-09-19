// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { DisclosureChevron } from "@/components/DisclosureChevron";
import { HomeDashboardJumpIcon } from "@/components/HomeDashboardJumpIcon";
import { splitSitusLabelEnvelopeLines } from "@/lib/addressLabelDifference";
import { focusNearestDashboardSection } from "@/lib/focusNearestDashboardSection";
import {
  HOME_DASHBOARD_JUMP_START_OVER_LABEL,
  HOME_DASHBOARD_JUMP_START_OVER_VALUE,
  HOME_DASHBOARD_JUMP_SUMMARY_LABEL,
  HOME_DASHBOARD_LG_MIN_MQ,
  HOME_DASHBOARD_UTILITY_BAR_HEIGHT_VAR,
  HOME_DASHBOARD_UTILITY_BAR_ID,
  type HomeDashboardJump,
  type HomeDashboardJumpId,
} from "@/lib/homeDashboardJumps";
import {
  HOME_DASHBOARD_JUMP_CHEVRON_CLASS,
  HOME_DASHBOARD_JUMP_DETAILS_CLASS,
  HOME_DASHBOARD_JUMP_ITEM_CLASS,
  HOME_DASHBOARD_JUMP_MENU_CLASS,
  HOME_DASHBOARD_JUMP_START_OVER_ITEM_CLASS,
  HOME_DASHBOARD_JUMP_START_OVER_LI_CLASS,
  HOME_DASHBOARD_JUMP_SUMMARY_CLASS,
  HOME_DASHBOARD_JUMP_SUMMARY_ADDRESS_CLASS,
  HOME_DASHBOARD_JUMP_SUMMARY_ADDRESS_COUNTY_ENVELOPE_CLASS,
  HOME_DASHBOARD_JUMP_SUMMARY_ADDRESS_ENVELOPE_CLASS,
  HOME_DASHBOARD_JUMP_SUMMARY_LABEL_ROW_CLASS,
  HOME_DASHBOARD_SECTION_NAV_ADDRESS_CLASS,
  HOME_DASHBOARD_SECTION_NAV_ADDRESS_COUNTY_CLASS,
  HOME_DASHBOARD_SECTION_NAV_ADDRESS_COUNTY_ENVELOPE_CLASS,
  HOME_DASHBOARD_SECTION_NAV_ADDRESS_ENVELOPE_CLASS,
  HOME_DASHBOARD_SECTION_NAV_ADDRESS_ENVELOPE_LINE_CLASS,
  HOME_DASHBOARD_SECTION_NAV_ADDRESS_SEP_CLASS,
  HOME_DASHBOARD_SECTION_NAV_ASIDE_CLASS,
  HOME_DASHBOARD_SECTION_NAV_DESKTOP_ADDRESS_CLASS,
  HOME_DASHBOARD_SECTION_NAV_STICKY_INNER_CLASS,
  HOME_DASHBOARD_SECTION_NAV_SWITCH_CLASS,
} from "@/lib/toolFlowStyles";
export type HomeDashboardSectionNavProps = {
  jumps: HomeDashboardJump[];
  onStartOver: () => void;
  /** County situs line for the locked parcel (permanent id chrome). */
  addressLine: string | null;
  /** Multi-county scope label after the address, when needed. */
  countyScopeLabel?: string | null;
  /**
   * Optional Switch account type control. Shown in the sidenav on `lg+` only
   * (mobile placement stays under Own | Rent in the parent).
   */
  accountSwitch?: ReactNode;
  /** Extra classes on the aside (e.g. grid column span). */
  className?: string;
};

function AddressChrome({
  addressLine,
  countyScopeLabel,
  layout,
  envelopeSurface = "rail",
}: {
  addressLine: string | null;
  countyScopeLabel?: string | null;
  /**
   * `envelope`: postage stack (street / city-state-ZIP / county).
   * `inline`: one truncated line (mobile Jump summary when closed).
   */
  layout: "envelope" | "inline";
  /** Envelope type color: slate-50 rail vs dark Jump strip. */
  envelopeSurface?: "rail" | "jumpStrip";
}) {
  const envelopeClass =
    envelopeSurface === "jumpStrip"
      ? HOME_DASHBOARD_JUMP_SUMMARY_ADDRESS_ENVELOPE_CLASS
      : HOME_DASHBOARD_SECTION_NAV_ADDRESS_ENVELOPE_CLASS;
  const countyEnvelopeClass =
    envelopeSurface === "jumpStrip"
      ? HOME_DASHBOARD_JUMP_SUMMARY_ADDRESS_COUNTY_ENVELOPE_CLASS
      : HOME_DASHBOARD_SECTION_NAV_ADDRESS_COUNTY_ENVELOPE_CLASS;

  if (!addressLine) {
    return (
      <p
        className={
          layout === "envelope"
            ? envelopeClass
            : HOME_DASHBOARD_SECTION_NAV_ADDRESS_CLASS
        }
      >
        Property report
      </p>
    );
  }

  if (layout === "envelope") {
    const { streetLine, localityLine } =
      splitSitusLabelEnvelopeLines(addressLine);
    return (
      <div className={envelopeClass}>
        <p className={HOME_DASHBOARD_SECTION_NAV_ADDRESS_ENVELOPE_LINE_CLASS}>
          {streetLine}
        </p>
        {localityLine ? (
          <p className={HOME_DASHBOARD_SECTION_NAV_ADDRESS_ENVELOPE_LINE_CLASS}>
            {localityLine}
          </p>
        ) : null}
        {countyScopeLabel ? (
          <p className={countyEnvelopeClass}>{countyScopeLabel}</p>
        ) : null}
      </div>
    );
  }

  return (
    <p className={HOME_DASHBOARD_SECTION_NAV_ADDRESS_CLASS}>
      <span className="inline">{addressLine}</span>
      {countyScopeLabel ? (
        <>
          <span
            className={HOME_DASHBOARD_SECTION_NAV_ADDRESS_SEP_CLASS}
            aria-hidden
          >
            ·
          </span>
          <span className={HOME_DASHBOARD_SECTION_NAV_ADDRESS_COUNTY_CLASS}>
            {" "}
            {countyScopeLabel}
          </span>
        </>
      ) : null}
    </p>
  );
}
/**
 * One locked-report section nav with **one** jump list in the document.
 * Placement changes by viewport via CSS (left rail vs top sticky strip), not by
 * cloning the TOC. Outside click/tap and Escape collapse the mobile disclosure;
 * on `lg+` the list stays open. Scroll-spy sets `aria-current="location"`.
 *
 * Address chrome is rendered twice (desktop atop / mobile inside the Jump
 * summary) from the same props — intentional placement, not a second TOC tree.
 * Desktop uses a postage-style stack (street / city-state-ZIP / county). Mobile
 * Jump summary: one truncated line when closed; same postage stack when open.
 * The whole summary (label + address) toggles the disclosure. Desktop rail
 * stretches the grid row (`bg-slate-50`); stickiness lives on an inner wrapper
 * so the column fill is not a short white card.
 *
 * Sticky (mobile aside / desktop inner) requires a tall locked-report flex/grid
 * ancestor (no short wrapper around the aside).
 */
export function HomeDashboardSectionNav({
  jumps,
  onStartOver,
  addressLine,
  countyScopeLabel = null,
  accountSwitch,
  className = "",
}: HomeDashboardSectionNavProps) {
  const asideRef = useRef<HTMLElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [activeJumpId, setActiveJumpId] = useState<HomeDashboardJumpId | null>(
    null,
  );
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  /** Mobile Jump `<details>` open — drives one-line vs postage address in the summary. */
  const [jumpMenuOpen, setJumpMenuOpen] = useState(false);

  const syncStickyStripHeight = useCallback(() => {
    if (typeof document === "undefined") return;
    if (window.matchMedia(HOME_DASHBOARD_LG_MIN_MQ).matches) {
      document.documentElement.style.removeProperty(
        HOME_DASHBOARD_UTILITY_BAR_HEIGHT_VAR,
      );
      return;
    }
    const bar = asideRef.current;
    if (!bar) return;
    document.documentElement.style.setProperty(
      HOME_DASHBOARD_UTILITY_BAR_HEIGHT_VAR,
      `${bar.offsetHeight}px`,
    );
  }, []);

  useLayoutEffect(() => {
    const mq = window.matchMedia(HOME_DASHBOARD_LG_MIN_MQ);
    const syncMq = () => {
      setIsLargeScreen(mq.matches);
      const details = detailsRef.current;
      if (details && mq.matches) {
        details.open = true;
      }
      syncStickyStripHeight();
    };
    syncMq();
    mq.addEventListener("change", syncMq);
    return () => mq.removeEventListener("change", syncMq);
  }, [syncStickyStripHeight]);

  useLayoutEffect(() => {
    const bar = asideRef.current;
    if (!bar) return;

    syncStickyStripHeight();
    const observer = new ResizeObserver(syncStickyStripHeight);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty(
        HOME_DASHBOARD_UTILITY_BAR_HEIGHT_VAR,
      );
    };
  }, [syncStickyStripHeight]);

  const closeMenu = useCallback(() => {
    if (isLargeScreen) return;
    if (detailsRef.current) detailsRef.current.open = false;
    syncStickyStripHeight();
  }, [isLargeScreen, syncStickyStripHeight]);

  const onDetailsToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    const details = event.currentTarget;
    if (isLargeScreen && !details.open) {
      details.open = true;
    }
    setJumpMenuOpen(details.open);
    syncStickyStripHeight();
  };

  /** Outside pointer + Escape collapse the mobile TOC (desktop list stays open). */
  useEffect(() => {
    const details = detailsRef.current;
    if (!details || isLargeScreen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!details.open) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (asideRef.current?.contains(target)) return;
      closeMenu();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (!details.open) return;
      event.preventDefault();
      closeMenu();
      const summary = details.querySelector(":scope > summary");
      if (summary instanceof HTMLElement) summary.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu, isLargeScreen]);

  /**
   * Scroll-spy: last jump whose focus target has crossed the sticky inset.
   * Uses curated jump focusIds only (no user-controlled selectors).
   */
  useEffect(() => {
    if (jumps.length === 0) {
      return;
    }

    let frame = 0;
    const updateActive = () => {
      frame = 0;
      const inset = isLargeScreen
        ? 16
        : (asideRef.current?.getBoundingClientRect().height ?? 56) + 8;
      let current: HomeDashboardJumpId | null = jumps[0]?.id ?? null;
      for (const jump of jumps) {
        const el = document.getElementById(jump.focusId);
        if (!(el instanceof HTMLElement)) continue;
        if (el.getBoundingClientRect().top <= inset) {
          current = jump.id;
        }
      }
      setActiveJumpId((prev) => (prev === current ? prev : current));
    };

    const onScrollOrResize = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(updateActive);
    };

    frame = window.requestAnimationFrame(updateActive);
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isLargeScreen, jumps]);

  const onJump = (jumpId: string) => {
    closeMenu();
    if (jumpId === HOME_DASHBOARD_JUMP_START_OVER_VALUE) {
      onStartOver();
      return;
    }
    const jump = jumps.find((item) => item.id === jumpId);
    if (jump == null) return;
    focusNearestDashboardSection({
      focusId: jump.focusId,
      highlightId: jump.highlightId,
    });
  };

  return (
    <aside
      ref={asideRef}
      id={HOME_DASHBOARD_UTILITY_BAR_ID}
      className={`${HOME_DASHBOARD_SECTION_NAV_ASIDE_CLASS} ${className}`.trim()}
    >
      <div className={HOME_DASHBOARD_SECTION_NAV_STICKY_INNER_CLASS}>
        <div className={HOME_DASHBOARD_SECTION_NAV_DESKTOP_ADDRESS_CLASS}>
          <AddressChrome
            addressLine={addressLine}
            countyScopeLabel={countyScopeLabel}
            layout="envelope"
          />
        </div>
        {accountSwitch != null ? (
          <div className={HOME_DASHBOARD_SECTION_NAV_SWITCH_CLASS}>
            {accountSwitch}
          </div>
        ) : null}

        <nav aria-label="On this page">
          <details
            ref={detailsRef}
            className={HOME_DASHBOARD_JUMP_DETAILS_CLASS}
            open={isLargeScreen ? true : undefined}
            onToggle={onDetailsToggle}
          >
            <summary className={HOME_DASHBOARD_JUMP_SUMMARY_CLASS}>
              <span className={HOME_DASHBOARD_JUMP_SUMMARY_LABEL_ROW_CLASS}>
                <span>{HOME_DASHBOARD_JUMP_SUMMARY_LABEL}</span>
                <DisclosureChevron
                  className={HOME_DASHBOARD_JUMP_CHEVRON_CLASS}
                />
              </span>
              <span className={HOME_DASHBOARD_JUMP_SUMMARY_ADDRESS_CLASS}>
                <AddressChrome
                  addressLine={addressLine}
                  countyScopeLabel={countyScopeLabel}
                  layout={jumpMenuOpen ? "envelope" : "inline"}
                  envelopeSurface="jumpStrip"
                />
              </span>
            </summary>
            <ul className={HOME_DASHBOARD_JUMP_MENU_CLASS}>
              {jumps.map((jump) => {
                const isCurrent = activeJumpId === jump.id;
                return (
                  <li key={jump.id}>
                    <button
                      type="button"
                      className={HOME_DASHBOARD_JUMP_ITEM_CLASS}
                      aria-current={isCurrent ? "location" : undefined}
                      onClick={() => onJump(jump.id)}
                    >
                      <HomeDashboardJumpIcon jumpId={jump.id} />
                      <span className="min-w-0">{jump.label}</span>
                    </button>
                  </li>
                );
              })}
              <li className={HOME_DASHBOARD_JUMP_START_OVER_LI_CLASS}>
                <button
                  type="button"
                  className={HOME_DASHBOARD_JUMP_START_OVER_ITEM_CLASS}
                  onClick={() => onJump(HOME_DASHBOARD_JUMP_START_OVER_VALUE)}
                >
                  <HomeDashboardJumpIcon
                    jumpId={HOME_DASHBOARD_JUMP_START_OVER_VALUE}
                  />
                  <span className="min-w-0">
                    {HOME_DASHBOARD_JUMP_START_OVER_LABEL}
                  </span>
                </button>
              </li>
            </ul>
          </details>
        </nav>
      </div>
    </aside>
  );
}
