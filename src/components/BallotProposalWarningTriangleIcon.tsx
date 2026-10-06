// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/** Filled red warning triangle for On the ballot chrome (badge + proposal panel). */
export function BallotProposalWarningTriangleIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M12 2.25c-.41 0-.79.22-1 .58L1.6 19.07A1.15 1.15 0 0 0 2.6 20.75h18.8a1.15 1.15 0 0 0 1-1.68L13 2.83a1.15 1.15 0 0 0-1-.58Z"
      />
      <path
        fill="#fff"
        d="M12 8.25a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0v-5A.75.75 0 0 1 12 8.25Zm0 8.5a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Z"
      />
    </svg>
  );
}
