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
