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

      const focusables = getFocusableElements(container);
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

      if (!container.contains(active)) {
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
