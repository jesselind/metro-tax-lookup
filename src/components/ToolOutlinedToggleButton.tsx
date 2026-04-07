import type { ButtonHTMLAttributes } from "react";
import { TOOL_OUTLINED_TOGGLE_BUTTON_CLASS } from "@/lib/toolFlowStyles";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Shared show/hide disclosure control: county help screenshots, levy data table,
 * metro "Check the math", etc. Styled via `TOOL_OUTLINED_TOGGLE_BUTTON_CLASS`.
 */
export function ToolOutlinedToggleButton({
  className = "",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={[TOOL_OUTLINED_TOGGLE_BUTTON_CLASS, className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
