import type { ButtonHTMLAttributes } from "react";
import { HELP_PILL_CLASS } from "@/lib/toolFlowStyles";

type HelpPillButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Pill-shaped toggle for in-flow help (Show example, Show table, etc.).
 * Uses {@link HELP_PILL_CLASS} from tool styles.
 */
export function HelpPillButton({
  className = "",
  type = "button",
  ...props
}: HelpPillButtonProps) {
  return (
    <button
      type={type}
      className={[HELP_PILL_CLASS, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
