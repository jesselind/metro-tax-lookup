/**
 * When a modal portal mounts, the app root (#__next) is marked inert and aria-hidden
 * so background content is excluded from the accessibility tree and tab order.
 * Ref-counted for stacked modals (rare).
 */
let lockCount = 0;

export function lockModalRoot(): () => void {
  if (typeof document === "undefined") {
    return () => {};
  }
  const root = document.getElementById("__next");
  if (!root) {
    return () => {};
  }
  lockCount += 1;
  if (lockCount === 1) {
    root.setAttribute("inert", "");
    root.setAttribute("aria-hidden", "true");
  }
  return () => {
    lockCount -= 1;
    if (lockCount === 0) {
      root.removeAttribute("inert");
      root.removeAttribute("aria-hidden");
    }
  };
}
