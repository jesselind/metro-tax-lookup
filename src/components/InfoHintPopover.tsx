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
import { createPortal } from "react-dom";
import { InfoCircleGlyph } from "@/components/InfoCircleGlyph";

const ICON_TRIGGER_BTN_BASE =
  "inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 outline-none transition hover:bg-slate-100/90 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-40";

/** Interaction + a11y only — wrapping/typography come from {@link textTriggerClassName} or the default path. */
const TEXT_TRIGGER_INTERACTIVE_CLASS =
  "cursor-pointer border-0 bg-transparent p-0 text-left underline decoration-slate-400 decoration-1 underline-offset-2 outline-none transition hover:decoration-slate-600 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40";

const TEXT_TRIGGER_DEFAULT_CLASS = `${TEXT_TRIGGER_INTERACTIVE_CLASS} max-w-full whitespace-normal break-words text-xs font-medium text-slate-700 sm:text-sm`;

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
      textTriggerAriaLabel?: never;
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
       * Supplemental description for assistive tech (tooltip `title`).
       * The control's accessible name defaults to visible `textTrigger` text unless
       * {@link textTriggerAriaLabel} is set.
       */
      ariaLabel?: string;
      textTrigger: string;
      textTriggerId: string;
      textTriggerClassName?: string;
      /**
       * When several triggers share the same visible text (e.g. "No data found"),
       * set this so each control has a distinct accessible name.
       */
      textTriggerAriaLabel?: string;
      iconTriggerChildren?: never;
      iconTriggerButtonClassName?: never;
      iconPanelBelow?: never;
    }
);

const PANEL_BASE =
  "z-40 w-max max-w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left text-xs leading-snug normal-case tracking-normal text-slate-700 shadow-lg";

/**
 * Toggles a small floating note; click outside or Escape closes.
 * - **Icon** (default): compact (i) beside labels.
 * - **Text**: underlined label text as trigger (avoids icon/label baseline fights).
 * - **Icon, panel below**: optional `iconPanelBelow` (and optional `iconTriggerChildren`) for tight tiles.
 *
 * Below-clamp panels portal to `document.body` with fixed coordinates so they are not clipped by
 * ancestor `overflow-x-auto` scrollports (e.g. county tables).
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
    textTriggerAriaLabel,
    iconTriggerChildren,
    iconTriggerButtonClassName,
    iconPanelBelow = false,
  } = props;

  const [open, setOpen] = useState(false);
  const [belowPanelCoords, setBelowPanelCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentId = useId();

  const isText = textTrigger != null && textTriggerId != null;
  const useBelowClamp = isText || iconPanelBelow;

  useLayoutEffect(() => {
    if (!open || !useBelowClamp) {
      setBelowPanelCoords(null);
      return;
    }
    const margin = 16;
    const gap = 4;

    const clampPanelPosition = () => {
      const wrap = wrapRef.current;
      const panel = panelRef.current;
      if (!wrap || !panel) return;

      const triggerRect = wrap.getBoundingClientRect();
      const panelWidth = panel.getBoundingClientRect().width;
      const vw = window.innerWidth;
      let left = triggerRect.left;
      if (left + panelWidth > vw - margin) {
        left = vw - margin - panelWidth;
      }
      if (left < margin) {
        left = margin;
      }

      setBelowPanelCoords({
        top: triggerRect.bottom + gap,
        left,
      });
    };

    clampPanelPosition();
    const onResize = () => clampPanelPosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    const ro = new ResizeObserver(() => clampPanelPosition());
    const panelEl = panelRef.current;
    if (panelEl) ro.observe(panelEl);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      ro.disconnect();
      setBelowPanelCoords(null);
    };
  }, [open, useBelowClamp]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      const wrap = wrapRef.current;
      const panel = panelRef.current;
      if (wrap?.contains(target) || panel?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, [open]);

  const belowPanelClassName = `${PANEL_BASE}${panelClassName ? ` ${panelClassName}` : ""} fixed`;

  const belowPanel =
    open && useBelowClamp ? (
      <div
        ref={panelRef}
        id={contentId}
        role="region"
        aria-live="polite"
        className={
          belowPanelCoords
            ? belowPanelClassName
            : `${belowPanelClassName} pointer-events-none invisible`
        }
        style={
          belowPanelCoords
            ? { top: belowPanelCoords.top, left: belowPanelCoords.left }
            : { top: 0, left: 0 }
        }
      >
        {children}
      </div>
    ) : null;

  return (
    <div
      className={
        isText
          ? `relative inline-block min-w-0 max-w-full shrink leading-none ${open ? "z-40" : ""}`
          : iconPanelBelow
            ? `relative inline-flex min-w-0 max-w-full shrink-0 leading-none ${open ? "z-40" : ""}`
            : `relative inline-flex shrink-0 leading-none ${open ? "z-40" : ""}`
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
              ? `${textTriggerClassName} ${TEXT_TRIGGER_INTERACTIVE_CLASS}`
              : TEXT_TRIGGER_DEFAULT_CLASS
          }
          aria-label={textTriggerAriaLabel}
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
      {open && !useBelowClamp ? (
        <div
          ref={panelRef}
          id={contentId}
          role="region"
          aria-live="polite"
          className={`${PANEL_BASE}${panelClassName ? ` ${panelClassName}` : ""} absolute left-full top-1/2 ml-1 -translate-y-1/2`}
        >
          {children}
        </div>
      ) : null}
      {belowPanel && typeof document !== "undefined"
        ? createPortal(belowPanel, document.body)
        : null}
    </div>
  );
}
