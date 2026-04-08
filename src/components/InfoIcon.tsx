import { InfoCircleGlyph } from "@/components/InfoCircleGlyph";

export function InfoIcon() {
  return (
    <span
      className="flex size-4 shrink-0 items-center justify-center rounded-full bg-indigo-900 text-white"
      aria-hidden
    >
      <InfoCircleGlyph variant="badge" className="size-4" />
    </span>
  );
}
