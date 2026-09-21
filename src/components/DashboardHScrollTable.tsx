// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type UIEventHandler,
} from "react";
import {
  DASHBOARD_HSCROLL_TABLE_BLEED_CLASS,
  DASHBOARD_HSCROLL_TABLE_END_PAD_CLASS,
  DASHBOARD_HSCROLL_TABLE_FADE_RIGHT_CLASS,
  DASHBOARD_HSCROLL_TABLE_SCROLL_CLASS,
} from "@/lib/toolFlowStyles";

export type DashboardHScrollTableProps = {
  children: ReactNode;
  /** Extra classes on the outer bleed wrapper (e.g. comps already passes `relative`). */
  className?: string;
  /** Extra classes on the overflow scrollport (e.g. max-height, focus ring). */
  scrollClassName?: string;
  /** Forwarded to the scrollport (keyboard region, ref host, etc.). */
  scrollProps?: Omit<HTMLAttributes<HTMLDivElement>, "className"> & {
    ref?: Ref<HTMLDivElement>;
    className?: string;
  };
};

/** Focus ring when the scrollport is a keyboard region (`tabIndex={0}`). */
export const DASHBOARD_HSCROLL_TABLE_FOCUS_RING_CLASS =
  "outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2";

type DashboardHScrollTableKeyMode = "arrows-home-end" | "arrows-home-end-page";

function handleDashboardHScrollTableKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  mode: DashboardHScrollTableKeyMode,
): void {
  const el = event.currentTarget;
  const step = Math.round(el.clientWidth * 0.5) || 48;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    el.scrollBy({ left: -step, behavior: "smooth" });
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    el.scrollBy({ left: step, behavior: "smooth" });
  } else if (event.key === "Home") {
    event.preventDefault();
    el.scrollTo({ left: 0, behavior: "smooth" });
  } else if (event.key === "End") {
    event.preventDefault();
    el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  } else if (mode === "arrows-home-end-page" && event.key === "PageUp") {
    event.preventDefault();
    el.scrollBy({ left: -el.clientWidth, behavior: "smooth" });
  } else if (mode === "arrows-home-end-page" && event.key === "PageDown") {
    event.preventDefault();
    el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
  }
}

/**
 * Arrow / Page / Home / End horizontal scroll for a focusable scrollport.
 * Pair with `role="region"`, `tabIndex={0}`, and a clear `aria-label`.
 * Prefer {@link dashboardHScrollTableArrowsHomeEndKeyDown} when the scrollport
 * also scrolls vertically (PageUp/PageDown must stay native).
 */
export function dashboardHScrollTableKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
): void {
  handleDashboardHScrollTableKeyDown(event, "arrows-home-end-page");
}

/**
 * ArrowLeft/Right, Home, and End horizontal scroll only. Leaves PageUp/PageDown
 * unhandled so a max-height overflow-y scrollport (comps) keeps native vertical
 * paging.
 */
export function dashboardHScrollTableArrowsHomeEndKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
): void {
  handleDashboardHScrollTableKeyDown(event, "arrows-home-end");
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (ref == null) return;
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  ref.current = value;
}

/**
 * Locked-report horizontal table scroll: right-bleed below `lg` so more columns
 * fit; trailing pad inside the scrollport so far-right scroll still clears the
 * phone edge (same gutter as the left page pad). Soft slate fade on the right
 * edge only when more columns sit past that edge (no left fade: it washed out
 * sticky / first-column labels when scrolled).
 */
export function DashboardHScrollTable({
  children,
  className,
  scrollClassName,
  scrollProps,
}: DashboardHScrollTableProps) {
  const {
    className: scrollPropsClassName,
    ref: scrollPropsRef,
    onScroll: scrollPropsOnScroll,
    ...restScrollProps
  } = scrollProps ?? {};
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [fadeRight, setFadeRight] = useState(false);

  const updateEdgeFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const epsilon = 2;
    const canScrollX = scrollWidth > clientWidth + epsilon;
    setFadeRight(
      canScrollX && scrollLeft + clientWidth < scrollWidth - epsilon,
    );
  }, []);

  const setScrollNode = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node;
      assignRef(scrollPropsRef, node);
      if (node) {
        updateEdgeFades();
      }
    },
    [scrollPropsRef, updateEdgeFades],
  );

  const handleScroll = useCallback<UIEventHandler<HTMLDivElement>>(
    (event) => {
      updateEdgeFades();
      scrollPropsOnScroll?.(event);
    },
    [scrollPropsOnScroll, updateEdgeFades],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      updateEdgeFades();
    });
    ro.observe(el);
    const inner = el.firstElementChild;
    if (inner instanceof HTMLElement) {
      ro.observe(inner);
    }
    return () => {
      ro.disconnect();
    };
  }, [children, updateEdgeFades]);

  const outerClass = [
    DASHBOARD_HSCROLL_TABLE_BLEED_CLASS,
    "relative",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const scrollClass = [
    DASHBOARD_HSCROLL_TABLE_SCROLL_CLASS,
    scrollClassName,
    scrollPropsClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={outerClass}>
      <div
        ref={setScrollNode}
        className={scrollClass}
        onScroll={handleScroll}
        {...restScrollProps}
      >
        <div className={DASHBOARD_HSCROLL_TABLE_END_PAD_CLASS}>{children}</div>
      </div>
      {fadeRight ? (
        <div aria-hidden className={DASHBOARD_HSCROLL_TABLE_FADE_RIGHT_CLASS} />
      ) : null}
    </div>
  );
}
