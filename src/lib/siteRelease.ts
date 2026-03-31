import packageJson from "../../package.json";

/** From package.json; bump when you cut a release. */
export const APP_VERSION = packageJson.version;

/** Mountain Time (Colorado). Same calendar day whether build runs locally or on UTC CI. */
const FOOTER_DATE_TIMEZONE = "America/Denver";

/**
 * Calendar date in `timeZone` for the given instant (build time when pages are generated).
 * Format: 31MAR2026. Same for all visitors until the next build or deploy.
 * Uses Intl so UTC CI does not flip the calendar day vs Mountain evening.
 */
function formatDateLabel(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(date);
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = (
    parts.find((p) => p.type === "month")?.value ?? ""
  ).toUpperCase();
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  return `${day}${month}${year}`;
}

/** Baked at static generation; see `formatDateLabel` comment. */
export const SITE_LAST_UPDATED_LABEL = formatDateLabel(
  new Date(),
  FOOTER_DATE_TIMEZONE
);
