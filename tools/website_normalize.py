# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Shared URL normalization for district JSON tooling."""

from __future__ import annotations

import re


def normalize_website(raw: str) -> str | None:
    t = raw.strip()
    if not t or t.upper() == "NA":
        return None
    if re.match(r"^https?://", t, re.I):
        return t
    return f"https://{t.lstrip('/')}"
