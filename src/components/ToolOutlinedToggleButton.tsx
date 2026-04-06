import type { ButtonHTMLAttributes } from "react";
import { TOOL_OUTLINED_TOGGLE_BUTTON_CLASS } from "@/lib/toolFlowStyles";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

/** Shared outlined toggle for tool flows (levy table, metro details, etc.). */
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
