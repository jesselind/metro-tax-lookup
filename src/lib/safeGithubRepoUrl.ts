/**
 * Returns a safe href for public GitHub repo links, or null if the value is
 * missing or not an allowed https GitHub URL.
 */
export function safeGithubRepoUrl(
  raw: string | undefined | null
): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (host !== "github.com" && host !== "www.github.com") return null;
    return url.href;
  } catch {
    return null;
  }
}
