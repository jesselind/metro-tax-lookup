import type { ButtonHTMLAttributes } from "react";
import { HELP_PILL_CLASS } from "@/lib/toolFlowStyles";

type HelpPillButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Pill-shaped toggle for in-flow help. Use labels that name what opens or closes
 * (e.g. "Hide privacy and verify info", not only "Hide"). Uses {@link HELP_PILL_CLASS}.
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
