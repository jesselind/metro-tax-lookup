// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useEffect, useRef } from "react";
import { ModalPortal } from "@/components/ModalPortal";
import {
  SitusMultiAccountChooserList,
  SitusRealVsBusinessPersonalHelp,
  type SitusMultiAccountChooserItem,
} from "@/components/SitusMultiAccountChooserList";
import { btnOutlineSecondaryMd } from "@/lib/buttonClasses";
import { useDialogFocusTrap } from "@/lib/useDialogFocusTrap";

const TITLE_ID = "situs-multi-account-switcher-heading";

export type SitusMultiAccountSwitcherDialogProps = {
  items: SitusMultiAccountChooserItem[];
  /** PIN already loaded on the dashboard (marked Currently viewing). */
  currentPin: string | null;
  selectDisabled?: boolean;
  onSelectPin: (pin: string) => void;
  onClose: () => void;
};

/**
 * Dashboard account-type switcher: same shell as levy detail modals
 * (`ModalPortal`, bottom sheet on small screens, `max-w-xl`).
 * Does not replace the post-search matching-properties region.
 */
export function SitusMultiAccountSwitcherDialog({
  items,
  currentPin,
  selectDisabled = false,
  onSelectPin,
  onClose,
}: SitusMultiAccountSwitcherDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useDialogFocusTrap(dialogRef);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape" || e.repeat) return;
      e.preventDefault();
      onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex min-h-[100dvh] w-full items-end justify-center sm:items-center sm:p-4">
        <button
          type="button"
          tabIndex={-1}
          className="absolute inset-0 min-h-[100dvh] bg-black/45"
          aria-label="Close account list"
          onClick={onClose}
        />
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={TITLE_ID}
          className="relative z-10 flex max-h-[min(90dvh,44rem)] w-full max-w-xl flex-col overflow-hidden rounded-t-lg border border-slate-200 bg-white shadow-2xl sm:rounded-lg"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 sm:px-5 sm:pt-5">
            <h3
              ref={titleRef}
              id={TITLE_ID}
              tabIndex={0}
              className="pr-2 text-base font-semibold leading-snug text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-sky-600/50 focus-visible:ring-offset-2 sm:text-lg"
            >
              Other accounts at this address
            </h3>
            <div className="mt-2">
              <SitusRealVsBusinessPersonalHelp idPrefix="dashboard-account-switch" />
            </div>
            <div className="mt-4">
              <SitusMultiAccountChooserList
                items={items}
                currentPin={currentPin}
                selectDisabled={selectDisabled}
                onSelectPin={onSelectPin}
                selectMode="switch"
              />
            </div>
          </div>
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
            <button
              type="button"
              className={`${btnOutlineSecondaryMd} w-full cursor-pointer justify-center py-3`}
              onClick={onClose}
              aria-label="Close account list"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
