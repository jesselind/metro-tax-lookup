# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""County-drop ingest tools.

Classifier, reader, writer, compare, dola_match, situs, parcel_record.
Default write target is a comparison directory (supporting-data/_ingest-out/).
Ship-from-new lands public/data/ only via build.py --ship (staging + IDENTICAL
+ atomic land; see ship_land.py and out_dir_policy.py).
"""
