"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { InfoCircleGlyph } from "@/components/InfoCircleGlyph";

type InfoHintPopoverProps = {
  children: ReactNode;
  disabled?: boolean;
} & (
  | {
      /** Shown to screen readers; keep short. Icon mode only. */
      ariaLabel: string;
      textTrigger?: never;
      textTriggerId?: never;
      textTriggerClassName?: never;
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
    }
);

const PANEL_BASE =
  "absolute z-50 w-max max-w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left text-xs leading-snug text-slate-700 shadow-lg";

/**
 * Toggles a small floating note; click outside or Escape closes.
 * - **Icon** (default): compact (i) beside labels.
 * - **Text**: underlined label text as trigger (avoids icon/label baseline fights).
 */
export function InfoHintPopover(props: InfoHintPopoverProps) {
  const {
    children,
    disabled = false,
    ariaLabel,
    textTrigger,
    textTriggerId,
    textTriggerClassName,
  } = props;

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const contentId = useId();

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

  const isText = textTrigger != null && textTriggerId != null;

  return (
    <div
      className={
        isText
          ? "relative inline-block min-w-0 max-w-full shrink leading-none"
          : "relative inline-flex shrink-0 leading-none"
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
          className="inline-flex size-[1.125rem] cursor-pointer items-center justify-center rounded-full p-0 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1 sm:size-4 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-40"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={open ? contentId : undefined}
          aria-haspopup="true"
          onClick={() => setOpen((v) => !v)}
        >
          <InfoCircleGlyph className="size-3 sm:size-3.5" />
        </button>
      )}
      {open ? (
        <div
          id={contentId}
          role="region"
          aria-live="polite"
          className={
            isText
              ? `${PANEL_BASE} left-0 top-full mt-1`
              : `${PANEL_BASE} left-full top-1/2 ml-1 -translate-y-1/2`
          }
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
