# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Invented identifiers for Python unit tests.

Keep these in sync with ``src/lib/syntheticTestIds.ts``. Do not use real
PIN/AIN/situs/owner values in committed tests. See README —
"Tests, fixtures, and PII".
"""

SYNTHETIC_PIN = "010000001"
SYNTHETIC_PIN_SHARD_PREFIX = "010000"
SYNTHETIC_PIN_NO_LEADING_ZERO = "10000001"
SYNTHETIC_AIN = "1000-00-0-00-001"

# Invented 10-digit schedule-style account id. Not a real El Paso schedule number.
SYNTHETIC_SCHEDULE_10 = "0100000001"
