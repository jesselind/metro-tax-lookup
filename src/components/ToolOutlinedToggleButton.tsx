// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ButtonHTMLAttributes } from "react";
import {
  TOOL_OUTLINED_TOGGLE_BUTTON_CLASS,
  TOOL_OUTLINED_TOGGLE_BUTTON_STRETCH_CLASS,
} from "@/lib/toolFlowStyles";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * Full width at every breakpoint (values-section peer disclosures). Default
   * shrinks to content from `sm` like other tool disclosures.
   */
  stretch?: boolean;
};

/**
 * Shared show/hide disclosure control: county help screenshots, levy data table,
 * metro "Check the math", etc. Styled via `TOOL_OUTLINED_TOGGLE_BUTTON_CLASS`.
 */
export function ToolOutlinedToggleButton({
  className = "",
  type = "button",
  stretch = false,
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={[
        stretch
          ? TOOL_OUTLINED_TOGGLE_BUTTON_STRETCH_CLASS
          : TOOL_OUTLINED_TOGGLE_BUTTON_CLASS,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
