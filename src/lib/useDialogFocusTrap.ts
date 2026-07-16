// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => {
      if (el.getAttribute("aria-hidden") === "true") return false;
      if (el.hasAttribute("hidden")) return false;
      return true;
    },
  );
}

/**
 * Focusables inside the dialog, plus any open portaled panel linked via
 * `aria-controls` (e.g. {@link InfoHintPopover} below-clamp panels on `document.body`).
 * Panel controls are inserted immediately after their trigger so Tab order stays sensible.
 */
function getDialogTrapFocusables(container: HTMLElement): HTMLElement[] {
  const result: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();

  function addFrom(root: HTMLElement) {
    for (const el of getFocusableElements(root)) {
      if (seen.has(el)) continue;
      seen.add(el);
      result.push(el);
      if (el.getAttribute("aria-expanded") !== "true") continue;
      const panelId = el.getAttribute("aria-controls");
      if (!panelId) continue;
      const panel = document.getElementById(panelId);
      if (!(panel instanceof HTMLElement) || container.contains(panel)) continue;
      addFrom(panel);
    }
  }

  addFrom(container);
  return result;
}

function isInsideDialogTrap(
  active: Element | null,
  container: HTMLElement,
): boolean {
  if (!(active instanceof Node)) return false;
  if (container.contains(active)) return true;
  for (const trigger of container.querySelectorAll(
    '[aria-expanded="true"][aria-controls]',
  )) {
    const panelId = trigger.getAttribute("aria-controls");
    if (!panelId) continue;
    const panel = document.getElementById(panelId);
    if (panel?.contains(active)) return true;
  }
  return false;
}

/**
 * Keeps Tab / Shift+Tab within `containerRef` while mounted and restores focus to the
 * element that had focus when the dialog mounted (typically the control that opened it).
 */
export function useDialogFocusTrap(containerRef: RefObject<HTMLElement | null>) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const prev = document.activeElement;
    previousFocusRef.current = prev instanceof HTMLElement ? prev : null;
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;

      const focusables = getDialogTrapFocusables(container);
      if (focusables.length === 0) {
        e.preventDefault();
        if (!container.hasAttribute("tabindex")) {
          container.setAttribute("tabindex", "-1");
        }
        container.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (!isInsideDialogTrap(active, container)) {
        e.preventDefault();
        first.focus();
        return;
      }

      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [containerRef]);

  useEffect(() => {
    return () => {
      const prev = previousFocusRef.current;
      if (prev && prev.isConnected) {
        prev.focus();
        return;
      }
      const root = document.getElementById("__next");
      if (root instanceof HTMLElement) {
        if (!root.hasAttribute("tabindex")) {
          root.setAttribute("tabindex", "-1");
        }
        root.focus({ preventScroll: true });
      }
    };
  }, []);
}
