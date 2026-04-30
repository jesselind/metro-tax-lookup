// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/** Info-in-circle; color via `currentColor`. ViewBox 16x16. */
export function InfoCircleGlyph({
  className,
  variant = "inline",
}: {
  className?: string;
  variant?: "inline" | "badge";
}) {
  if (variant === "badge") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className={className}
        aria-hidden
      >
        <circle cx="8" cy="4.85" r="1.45" />
        <rect x="6.75" y="7.35" width="2.5" height="5.1" rx="0.5" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M8 1a7 7 0 100 14A7 7 0 008 1zM8 3.75a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zM7.1 6.25h1.8v4.75H7.1z"
        clipRule="evenodd"
      />
    </svg>
  );
}
