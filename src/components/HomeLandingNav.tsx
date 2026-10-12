// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Unlocked-home section links in the sticky PageHero title bar.
 * Desktop: inline list. Smaller screens: hamburger disclosure.
 * Must not mount on a locked report (Jump TOC owns that path).
 */
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { focusNearestDashboardSection } from "@/lib/focusNearestDashboardSection";
import { HOME_DASHBOARD_LG_MIN_MQ } from "@/lib/homeDashboardJumps";
import {
  HOME_LANDING_MENU_BUTTON_CLOSE_ARIA_LABEL,
  HOME_LANDING_MENU_BUTTON_ARIA_LABEL,
  HOME_LANDING_MENU_BUTTON_LABEL,
  HOME_LANDING_NAV_ARIA_LABEL,
  HOME_LANDING_NAVBAR_HEIGHT_VAR,
  type HomeLandingJump,
} from "@/lib/homeLandingJumps";
import { RADIUS_CONTROL_CLASS } from "@/lib/toolFlowStyles";

/** Same readable size as locked-report Jump items; white on slate-700 for contrast. */
const JUMP_LINK_CLASS =
  "cursor-pointer rounded-md px-2.5 py-2 text-left text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700";

const MENU_BUTTON_CLASS = `inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 ${RADIUS_CONTROL_CLASS} border border-white/45 bg-transparent px-3 py-2.5 text-base font-semibold leading-snug text-white shadow-none transition-colors hover:border-white/70 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700`;

type Props = {
  jumps: HomeLandingJump[];
  /** Sticky title-bar element whose closed height drives scroll-mt. */
  navbarRef: RefObject<HTMLElement | null>;
};

export function HomeLandingNav({ jumps, navbarRef }: Props) {
  const menuId = useId();
  const menuRootRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closedBarHeightRef = useRef(72);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  const syncNavbarHeight = useCallback(() => {
    if (typeof document === "undefined") return;
    const bar = navbarRef.current;
    if (!bar) return;
    // Open hamburger panel must not inflate scroll-mt.
    if (menuOpen && !window.matchMedia(HOME_DASHBOARD_LG_MIN_MQ).matches) {
      document.documentElement.style.setProperty(
        HOME_LANDING_NAVBAR_HEIGHT_VAR,
        `${closedBarHeightRef.current}px`,
      );
      return;
    }
    const height = bar.offsetHeight;
    closedBarHeightRef.current = height;
    document.documentElement.style.setProperty(
      HOME_LANDING_NAVBAR_HEIGHT_VAR,
      `${height}px`,
    );
  }, [navbarRef, menuOpen]);

  useLayoutEffect(() => {
    const mq = window.matchMedia(HOME_DASHBOARD_LG_MIN_MQ);
    const syncMq = () => {
      setIsLargeScreen(mq.matches);
      if (mq.matches) setMenuOpen(false);
      syncNavbarHeight();
    };
    syncMq();
    mq.addEventListener("change", syncMq);
    return () => mq.removeEventListener("change", syncMq);
  }, [syncNavbarHeight]);

  useLayoutEffect(() => {
    const bar = navbarRef.current;
    if (!bar) return;
    syncNavbarHeight();
    const observer = new ResizeObserver(syncNavbarHeight);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty(
        HOME_LANDING_NAVBAR_HEIGHT_VAR,
      );
    };
  }, [navbarRef, syncNavbarHeight, jumps.length]);

  useEffect(() => {
    if (!menuOpen || isLargeScreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      const root = menuRootRef.current;
      if (!root) return;
      if (e.target instanceof Node && root.contains(e.target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen, isLargeScreen]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const onJump = (focusId: string) => {
    closeMenu();
    requestAnimationFrame(() => {
      focusNearestDashboardSection({
        focusId,
        stickyInsetPx: closedBarHeightRef.current,
        behavior: "auto",
        // Always pin the section under the sticky title bar — including when
        // it is already in the viewport (locked-report Jump uses nearest).
        block: "start",
      });
    });
  };

  if (jumps.length === 0) return null;

  const jumpButtons = (layout: "inline" | "stack") => (
    <ul
      className={
        layout === "inline"
          ? "flex flex-wrap items-center justify-end gap-1"
          : "flex flex-col gap-1 p-2"
      }
    >
      {jumps.map((jump) => (
        <li key={jump.id}>
          <button
            type="button"
            className={
              layout === "inline"
                ? JUMP_LINK_CLASS
                : `${JUMP_LINK_CLASS} w-full`
            }
            onClick={() => onJump(jump.focusId)}
          >
            {jump.label}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <nav aria-label={HOME_LANDING_NAV_ARIA_LABEL} className="shrink-0">
      <div className="hidden lg:block">{jumpButtons("inline")}</div>
      <div ref={menuRootRef} className="relative lg:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          className={MENU_BUTTON_CLASS}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={
            menuOpen
              ? HOME_LANDING_MENU_BUTTON_CLOSE_ARIA_LABEL
              : HOME_LANDING_MENU_BUTTON_ARIA_LABEL
          }
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <XMarkIcon className="h-5 w-5 shrink-0" aria-hidden />
          ) : (
            <Bars3Icon className="h-5 w-5 shrink-0" aria-hidden />
          )}
          <span aria-hidden>{HOME_LANDING_MENU_BUTTON_LABEL}</span>
        </button>
        {menuOpen ? (
          <div
            id={menuId}
            className="absolute right-0 z-50 mt-2 min-w-[14rem] rounded-md border border-white/25 bg-slate-700 shadow-lg"
          >
            {jumpButtons("stack")}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
