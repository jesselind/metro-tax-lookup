// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  COUNTY_SERVICE_GAP_SURFACE_TONE_CLASS,
  IN_PROGRESS_SURFACE_TONE_CLASS,
} from "@/lib/toolFlowStyles";

/** Button reset only — callers supply typography + underline via textTriggerClassName. */
const TEXT_TRIGGER_BUTTON_RESET =
  "cursor-pointer border-0 bg-transparent p-0 text-left leading-snug outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40";

const InfoHintPopoverDismissContext = createContext<(() => void) | null>(null);

/** Dismiss the open hint panel from a control inside it (e.g. a jump). */
export function useInfoHintPopoverDismiss(): (() => void) | null {
  return useContext(InfoHintPopoverDismissContext);
}

const PANEL_SURFACE_CLASS = {
  default: "border border-slate-200 bg-white text-slate-700",
  "county-data-gap": COUNTY_SERVICE_GAP_SURFACE_TONE_CLASS,
  "in-progress": IN_PROGRESS_SURFACE_TONE_CLASS,
} as const;

export type InfoHintPopoverVariant = keyof typeof PANEL_SURFACE_CLASS;

type InfoHintPopoverBase = {
  children: ReactNode;
  disabled?: boolean;
  /**
   * Panel chrome. `default` is the glossary/hint surface. `county-data-gap` uses
   * the COUNTY DATA GAP tone (thin red border + light red fill). `in-progress`
   * uses the IN PROGRESS tone (thin sky border + light sky fill). Positioning,
   * portal, and scroll behavior stay the same.
   */
  variant?: InfoHintPopoverVariant;
  /** Merged into the floating panel (e.g. wider max-width or scroll). */
  panelClassName?: string;
  /**
   * Supplemental description for assistive tech (tooltip `title`).
   * The control's accessible name defaults to visible `textTrigger` text unless
   * {@link textTriggerAriaLabel} is set.
   */
  ariaLabel?: string;
  textTriggerId: string;
  /** Typography + underline affordance for the text trigger (or layout for custom). */
  textTriggerClassName: string;
  /**
   * When several triggers share the same visible text (e.g. "No data found"),
   * set this so each control has a distinct accessible name.
   */
  textTriggerAriaLabel?: string;
};

export type InfoHintPopoverProps = InfoHintPopoverBase &
  (
    | {
        textTrigger: string;
        customTrigger?: undefined;
      }
    | {
        /** Non-text control (e.g. chart dot). Requires {@link textTriggerAriaLabel}. */
        customTrigger: ReactNode;
        textTrigger?: undefined;
        textTriggerAriaLabel: string;
      }
  );

/** Portaled panels must clear modal shells (`z-[100]`). Layout only; surface is {@link PANEL_SURFACE_CLASS}. */
const PANEL_LAYOUT =
  "w-max max-w-[min(18rem,calc(100vw-2rem))] rounded-lg px-2.5 py-2 text-left text-xs leading-snug normal-case tracking-normal shadow-lg outline-none z-[110]";

/**
 * Text-trigger floating note for in-flow definitions and hints.
 * Optional {@link InfoHintPopoverProps.customTrigger} for icon/dot controls.
 * Optional {@link InfoHintPopoverProps.variant} `"county-data-gap"` for COUNTY
 * DATA GAP chrome, or `"in-progress"` for IN PROGRESS chrome.
 * Root is a phrasing-content `<span>` (not `<div>`) so triggers stay valid inside
 * `<p>` and similar parents without hydration nesting warnings.
 * Click outside or Escape closes. Panels portal to `document.body` so they are
 * not clipped by ancestor `overflow-x-auto` scrollports (e.g. county tables).
 * On open, focus moves to the panel (`tabIndex={-1}`) so keyboard users can reach
 * links inside; the region is named via `aria-labelledby` on the trigger (no
 * `aria-live`, so focus and live region do not double-announce). Escape or
 * outside dismiss restores focus to the trigger when focus was in the panel
 * (avoids focus dumping to `document.body` on unmount).
 */
export function InfoHintPopover({
  children,
  disabled = false,
  variant = "default",
  panelClassName,
  ariaLabel,
  textTrigger,
  customTrigger,
  textTriggerId,
  textTriggerClassName,
  textTriggerAriaLabel,
}: InfoHintPopoverProps) {
  const [open, setOpen] = useState(false);
  const [panelCoords, setPanelCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentId = useId();

  const dismiss = useCallback(() => {
    const panel = panelRef.current;
    const trigger = triggerRef.current;
    const focusWasInPanel =
      panel != null &&
      document.activeElement instanceof Node &&
      panel.contains(document.activeElement);
    setOpen(false);
    if (focusWasInPanel) {
      trigger?.focus();
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    const margin = 16;
    const gap = 4;

    const clampPanelPosition = () => {
      const wrap = wrapRef.current;
      const panel = panelRef.current;
      if (!wrap || !panel) return;

      const triggerRect = wrap.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const panelWidth = panelRect.width;
      const panelHeight = panelRect.height;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let left = triggerRect.left;
      if (left + panelWidth > vw - margin) {
        left = vw - margin - panelWidth;
      }
      if (left < margin) {
        left = margin;
      }

      let top = triggerRect.bottom + gap;
      if (top + panelHeight > vh - margin) {
        const above = triggerRect.top - gap - panelHeight;
        top = above >= margin ? above : Math.max(margin, vh - margin - panelHeight);
      }

      setPanelCoords({
        top,
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
      setPanelCoords(null);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      dismiss();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      const wrap = wrapRef.current;
      const panel = panelRef.current;
      if (wrap?.contains(target) || panel?.contains(target)) return;
      dismiss();
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPointer, true);

    const focusTimer = window.setTimeout(() => {
      panelRef.current?.focus({ preventScroll: true });
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer, true);
      window.clearTimeout(focusTimer);
    };
  }, [open, dismiss]);

  const panelClassNameMerged = `${PANEL_LAYOUT} ${PANEL_SURFACE_CLASS[variant]}${panelClassName ? ` ${panelClassName}` : ""} fixed`;

  const panel = open ? (
    <div
      ref={panelRef}
      id={contentId}
      role="region"
      aria-labelledby={textTriggerId}
      tabIndex={-1}
      className={
        panelCoords
          ? panelClassNameMerged
          : `${panelClassNameMerged} pointer-events-none invisible`
      }
      style={
        panelCoords
          ? { top: panelCoords.top, left: panelCoords.left }
          : { top: 0, left: 0 }
      }
    >
      {children}
    </div>
  ) : null;

  return (
    <InfoHintPopoverDismissContext.Provider value={dismiss}>
      <span
        // Do not set leading-none: text triggers wrap; default leading is on the button reset.
        className={`relative inline-block min-w-0 max-w-full shrink ${open ? "z-40" : ""} ${customTrigger ? "leading-none" : ""}`}
        ref={wrapRef}
      >
        <button
          ref={triggerRef}
          type="button"
          id={textTriggerId}
          disabled={disabled}
          className={`${textTriggerClassName} ${TEXT_TRIGGER_BUTTON_RESET}`}
          aria-label={textTriggerAriaLabel}
          aria-expanded={open}
          aria-controls={open ? contentId : undefined}
          title={ariaLabel}
          onClick={() => setOpen((v) => !v)}
        >
          {customTrigger ?? textTrigger}
        </button>
        {panel && typeof document !== "undefined"
          ? createPortal(panel, document.body)
          : null}
      </span>
    </InfoHintPopoverDismissContext.Provider>
  );
}
