"use client";

import type { ReactNode } from "react";
import { useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { lockModalRoot } from "@/lib/modalRootLock";

type ModalPortalProps = {
  children: ReactNode;
};

/**
 * Renders on document.body so fixed overlays cover the full viewport and are not
 * clipped by ancestor overflow (e.g. card shells) or tied to transformed ancestors.
 * Content inside should follow progressive disclosure (see docs/levy-explainer-authoring.md for levy
 * modals; base-rule.mdc for general hierarchy): essentials first, depth in accordions/links.
 */
export function ModalPortal({ children }: ModalPortalProps) {
  useLayoutEffect(() => {
    return lockModalRoot();
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
