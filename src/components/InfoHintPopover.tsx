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

/** Button reset only — callers supply typography + underline affordance via textTriggerClassName. */
const TEXT_TRIGGER_BUTTON_RESET =
  "cursor-pointer border-0 bg-transparent p-0 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40";

type InfoHintPopoverProps = {
  children: ReactNode;
  disabled?: boolean;
  /** Merged into the floating panel (e.g. wider max-width or scroll). */
  panelClassName?: string;
  /**
   * Supplemental description for assistive tech (tooltip `title`).
   * The control's accessible name defaults to visible `textTrigger` text unless
   * {@link textTriggerAriaLabel} is set.
   */
  ariaLabel?: string;
  textTrigger: string;
  textTriggerId: string;
  /** Typography + underline affordance for the text trigger. */
  textTriggerClassName: string;
  /**
   * When several triggers share the same visible text (e.g. "No data found"),
   * set this so each control has a distinct accessible name.
   */
  textTriggerAriaLabel?: string;
};

/** Portaled panels must clear modal shells (`z-[100]`). */
const PANEL_BASE =
  "w-max max-w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left text-xs leading-snug normal-case tracking-normal text-slate-700 shadow-lg z-[110]";

/**
 * Text-trigger floating note for in-flow definitions and hints.
 * Click outside or Escape closes. Panels portal to `document.body` so they are
 * not clipped by ancestor `overflow-x-auto` scrollports (e.g. county tables).
 */
export function InfoHintPopover({
  children,
  disabled = false,
  panelClassName,
  ariaLabel,
  textTrigger,
  textTriggerId,
  textTriggerClassName,
  textTriggerAriaLabel,
}: InfoHintPopoverProps) {
  const [open, setOpen] = useState(false);
  const [panelCoords, setPanelCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentId = useId();

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
      const panelWidth = panel.getBoundingClientRect().width;
      const vw = window.innerWidth;
      let left = triggerRect.left;
      if (left + panelWidth > vw - margin) {
        left = vw - margin - panelWidth;
      }
      if (left < margin) {
        left = margin;
      }

      setPanelCoords({
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
      setPanelCoords(null);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      const wrap = wrapRef.current;
      const panel = panelRef.current;
      if (wrap?.contains(target) || panel?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, [open]);

  const panelClassNameMerged = `${PANEL_BASE}${panelClassName ? ` ${panelClassName}` : ""} fixed`;

  const panel = open ? (
    <div
      ref={panelRef}
      id={contentId}
      role="region"
      aria-live="polite"
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
    <div
      className={`relative inline-block min-w-0 max-w-full shrink leading-none ${open ? "z-40" : ""}`}
      ref={wrapRef}
    >
      <button
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
        {textTrigger}
      </button>
      {panel && typeof document !== "undefined"
        ? createPortal(panel, document.body)
        : null}
    </div>
  );
}
