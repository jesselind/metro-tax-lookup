# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""County-drop ingest tools.

Phase 3: classifier (classify.py) — inspect drop folders, report coverage.
Phase 4+: reader, writer, compare, dola_match — mapping-file-driven CSV reader
  → intermediate records → app JSON written to a comparison directory
  (never public/data/). Mill join lives in dola_match.py (new engine only).
Phase 5: situs.py + parcel_record.py — situs index and parcel-record shards
  (sibling mart joins + GIS neighborhood) into the same comparison dir.
"""
