# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""County-drop ingest tools.

Phase 3: classifier (classify.py) — inspect drop folders, report coverage.
Phase 4: reader (reader.py), writer (writer.py), compare (compare.py) —
  mapping-file-driven CSV reader → intermediate records → app JSON written to
  a comparison directory (never public/data/).
"""
