// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { InfoCircleGlyph } from "@/components/InfoCircleGlyph";

const ICON_TRIGGER_BTN_BASE =
  "inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 outline-none transition hover:bg-slate-100/90 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-40";

type InfoHintPopoverProps = {
  children: ReactNode;
  disabled?: boolean;
  /** Merged into the floating panel (e.g. wider max-width or scroll). */
  panelClassName?: string;
} & (
  | {
      /** Shown to screen readers; keep short. Icon mode only. */
      ariaLabel: string;
      textTrigger?: never;
      textTriggerId?: never;
      textTriggerClassName?: never;
      /**
       * Icon mode: replace the default (i) glyph (e.g. comps PDF icon). Pair with
       * {@link iconTriggerButtonClassName} for hit target and shape.
       */
      iconTriggerChildren?: ReactNode;
      /** Merged after {@link ICON_TRIGGER_BTN_BASE} when {@link iconTriggerChildren} is set. */
      iconTriggerButtonClassName?: string;
      /**
       * Icon mode: anchor the panel below the trigger and clamp to the viewport (same
       * behavior as text triggers). Use in tight tiles instead of opening to the right.
       */
      iconPanelBelow?: boolean;
    }
  | {
      /**
       * Supplemental description for assistive tech (e.g. popover content summary).
       * The control's accessible name comes from visible `textTrigger` text.
       */
      ariaLabel?: string;
      textTrigger: string;
      textTriggerId: string;
      textTriggerClassName?: string;
      iconTriggerChildren?: never;
      iconTriggerButtonClassName?: never;
      iconPanelBelow?: never;
    }
);

const PANEL_BASE =
  "absolute z-[999] w-max max-w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left text-xs leading-snug normal-case tracking-normal text-slate-700 shadow-lg";

/**
 * Toggles a small floating note; click outside or Escape closes.
 * - **Icon** (default): compact (i) beside labels.
 * - **Text**: underlined label text as trigger (avoids icon/label baseline fights).
 * - **Icon, panel below**: optional `iconPanelBelow` (and optional `iconTriggerChildren`) for tight tiles.
 */
export function InfoHintPopover(props: InfoHintPopoverProps) {
  const {
    children,
    disabled = false,
    panelClassName,
    ariaLabel,
    textTrigger,
    textTriggerId,
    textTriggerClassName,
    iconTriggerChildren,
    iconTriggerButtonClassName,
    iconPanelBelow = false,
  } = props;

  const [open, setOpen] = useState(false);
  const [belowPanelLeftPx, setBelowPanelLeftPx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentId = useId();

  const isText = textTrigger != null && textTriggerId != null;
  const useBelowClamp = isText || iconPanelBelow;

  useLayoutEffect(() => {
    if (!open || !useBelowClamp) return;
    const margin = 16;
    const clampPanelLeft = () => {
      const wrap = wrapRef.current;
      const panel = panelRef.current;
      if (!wrap || !panel) return;
      const wrapLeft = wrap.getBoundingClientRect().left;
      const panelWidth = panel.getBoundingClientRect().width;
      const vw = window.innerWidth;
      let left = 0;
      if (wrapLeft + panelWidth > vw - margin) {
        left = vw - margin - wrapLeft - panelWidth;
      }
      if (wrapLeft + left < margin) {
        left = margin - wrapLeft;
      }
      setBelowPanelLeftPx(left);
    };
    clampPanelLeft();
    const onResize = () => clampPanelLeft();
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(() => clampPanelLeft());
    const panelEl = panelRef.current;
    if (panelEl) ro.observe(panelEl);
    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [open, useBelowClamp]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, [open]);

  return (
    <div
      className={
        isText
          ? `relative inline-block min-w-0 max-w-full shrink leading-none ${open ? "z-[999]" : ""}`
          : iconPanelBelow
            ? `relative inline-flex min-w-0 max-w-full shrink-0 leading-none ${open ? "z-[999]" : ""}`
            : `relative inline-flex shrink-0 leading-none ${open ? "z-[999]" : ""}`
      }
      ref={wrapRef}
    >
      {isText ? (
        <button
          type="button"
          id={textTriggerId}
          disabled={disabled}
          className={
            textTriggerClassName
              ? `${textTriggerClassName} cursor-pointer border-0 bg-transparent p-0 text-left underline decoration-slate-400 decoration-1 underline-offset-2 outline-none transition hover:decoration-slate-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40`
              : "cursor-pointer border-0 bg-transparent p-0 text-left text-xs font-medium text-slate-700 underline decoration-slate-400 decoration-1 underline-offset-2 outline-none transition hover:decoration-slate-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1 sm:text-sm disabled:cursor-not-allowed disabled:opacity-40"
          }
          aria-expanded={open}
          aria-controls={open ? contentId : undefined}
          aria-haspopup="true"
          title={ariaLabel}
          onClick={() => setOpen((v) => !v)}
        >
          {textTrigger}
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled}
          className={
            iconTriggerChildren != null
              ? `${ICON_TRIGGER_BTN_BASE} ${iconTriggerButtonClassName ?? "rounded-md text-slate-600"}`
              : "inline-flex size-[1.125rem] cursor-pointer items-center justify-center border-0 bg-transparent rounded-full p-0 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1 sm:size-4 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-40"
          }
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={open ? contentId : undefined}
          aria-haspopup="true"
          onClick={() => setOpen((v) => !v)}
        >
          {iconTriggerChildren != null ? (
            iconTriggerChildren
          ) : (
            <InfoCircleGlyph className="size-3 sm:size-3.5" />
          )}
        </button>
      )}
      {open ? (
        <div
          ref={panelRef}
          id={contentId}
          role="region"
          aria-live="polite"
          className={
            useBelowClamp
              ? `${PANEL_BASE}${panelClassName ? ` ${panelClassName}` : ""} top-full mt-1`
              : `${PANEL_BASE}${panelClassName ? ` ${panelClassName}` : ""} left-full top-1/2 ml-1 -translate-y-1/2`
          }
          style={useBelowClamp ? { left: belowPanelLeftPx } : undefined}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
