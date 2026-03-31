import type { ReactNode } from "react";

/**
 * Shared shell: amber left accent, not error-level. Use for sample / example / demo data.
 * Compose with {@link ExampleModeCallout} or use {@link EXAMPLE_MODE_CALLOUT_SHELL} in custom layouts.
 */
export const EXAMPLE_MODE_CALLOUT_SHELL =
  "border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50 text-amber-950 ring-1 ring-amber-200/80";

const VARIANT_CLASS = {
  /** Standalone banner (e.g. under a toggle). */
  banner: `${EXAMPLE_MODE_CALLOUT_SHELL} rounded-lg px-3 py-3 text-sm shadow-sm sm:px-4 sm:py-3 sm:text-base`,
  /** Tighter block (e.g. inside a dialog). */
  compact: `${EXAMPLE_MODE_CALLOUT_SHELL} rounded-md px-3 py-2 text-sm`,
} as const;

export type ExampleModeCalloutVariant = keyof typeof VARIANT_CLASS;

type ExampleModeCalloutProps = {
  children: ReactNode;
  variant?: ExampleModeCalloutVariant;
  className?: string;
  /**
   * Default: `div` with `role="status"` for `banner`; `div` without role for `compact`.
   * Use `p` when nesting rules require a paragraph (e.g. inside some dialogs).
   */
  as?: "div" | "p";
};

export function ExampleModeCallout({
  children,
  variant = "banner",
  className = "",
  as,
}: ExampleModeCalloutProps) {
  const Component = as ?? "div";
  const base = VARIANT_CLASS[variant];
  const merged = [base, className].filter(Boolean).join(" ");
  const role =
    Component === "div" && variant === "banner" ? ("status" as const) : undefined;

  return (
    <Component className={merged} role={role}>
      {children}
    </Component>
  );
}
