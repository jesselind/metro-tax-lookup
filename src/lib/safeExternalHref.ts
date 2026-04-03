/**
 * Validate URLs from bundled JSON before using them in <a href>.
 * Blocks javascript:, data:, and other non-http(s) schemes.
 */
export function safeHttpOrHttpsUrl(
  raw: string | null | undefined
): string | null {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t) return null;
  try {
    const url = new URL(t);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.href;
  } catch {
    return null;
  }
}

const ARAPAHOE_PARCEL_LEVY_HOST = "parcelsearch.arapahoegov.com";

/**
 * County online levy table for a taxing authority (TAGId in query).
 * Build script emits https://parcelsearch.arapahoegov.com/Levy.aspx?id=…
 */
export function safeArapahoeLevyAspxUrl(
  raw: string | null | undefined
): string | null {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t) return null;
  try {
    const url = new URL(t);
    if (url.protocol !== "https:") return null;
    if (url.hostname.toLowerCase() !== ARAPAHOE_PARCEL_LEVY_HOST) return null;
    if (!url.pathname.toLowerCase().endsWith("/levy.aspx")) return null;
    return url.href;
  } catch {
    return null;
  }
}
