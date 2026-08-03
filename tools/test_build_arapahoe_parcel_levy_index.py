#!/usr/bin/env python3
# Metro Tax Lookup - Arapahoe County
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later
# See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"""Unit tests for pure helpers in build_arapahoe_parcel_levy_index.py.

Uses synthetic Main Parcel-shaped rows only (no real resident PIN/AIN). Forkers:
run these after changing assessed-rate or ownership heuristics.
"""

from __future__ import annotations

import unittest

from build_arapahoe_parcel_levy_index import (
    attach_computed_assessed_values,
    format_situs_label,
    format_situs_locality,
    is_residential_state_use_code,
    local_assessed_split_fields,
    non_residential_assessed_split_fields,
    normalize_integerish_code,
    ownership_type_label_from_owner_lp_types,
    parcel_row_qualifies_for_dual_assessed_splits,
    parcel_row_qualifies_for_school_assessed_splits,
    school_assessed_fields_from_actuals,
)


def _real_improvement_row(assessment_year: str = "2026") -> dict[str, str]:
    return {
        "AssessmentYear": assessment_year,
        "TaxRollDescr": "Real",
        "PropertyClassDescr": "Improvement",
        "StateUseCd": "1177",
    }


class OwnershipTypeLabelTests(unittest.TestCase):
    def test_single_owner_keeps_lp_type(self) -> None:
        self.assertEqual(
            ownership_type_label_from_owner_lp_types(["Individual"]),
            "Individual",
        )
        self.assertEqual(
            ownership_type_label_from_owner_lp_types(["Organization"]),
            "Organization",
        )

    def test_all_individual_co_owners_joint_tenancy(self) -> None:
        self.assertEqual(
            ownership_type_label_from_owner_lp_types(
                ["Individual", "Individual"]
            ),
            "Joint Tenancy",
        )

    def test_mixed_owner_types_comma_join_unique(self) -> None:
        self.assertEqual(
            ownership_type_label_from_owner_lp_types(
                ["Individual", "Organization", "Individual"]
            ),
            "Individual, Organization",
        )

    def test_empty_owners_none(self) -> None:
        self.assertIsNone(ownership_type_label_from_owner_lp_types([]))
        self.assertIsNone(ownership_type_label_from_owner_lp_types(["", "  "]))


class AssessedSplitQualificationTests(unittest.TestCase):
    def test_dual_requires_real_and_2025_plus(self) -> None:
        self.assertTrue(
            parcel_row_qualifies_for_dual_assessed_splits(
                _real_improvement_row("2025")
            )
        )
        self.assertFalse(
            parcel_row_qualifies_for_dual_assessed_splits(
                _real_improvement_row("2024")
            )
        )
        self.assertFalse(
            parcel_row_qualifies_for_dual_assessed_splits(
                {
                    "AssessmentYear": "2026",
                    "TaxRollDescr": "Personal",
                    "PropertyClassDescr": "Improvement",
                }
            )
        )

    def test_school_requires_improvement_class(self) -> None:
        self.assertTrue(
            parcel_row_qualifies_for_school_assessed_splits(
                _real_improvement_row()
            )
        )
        self.assertFalse(
            parcel_row_qualifies_for_school_assessed_splits(
                {
                    "AssessmentYear": "2026",
                    "TaxRollDescr": "Real",
                    "PropertyClassDescr": "Real",
                    "StateUseCd": "1177",
                }
            )
        )

    def test_school_requires_residential_state_use(self) -> None:
        self.assertFalse(
            parcel_row_qualifies_for_school_assessed_splits(
                {
                    "AssessmentYear": "2026",
                    "TaxRollDescr": "Real",
                    "PropertyClassDescr": "Improvement",
                    "StateUseCd": "9179",
                }
            )
        )
        self.assertTrue(is_residential_state_use_code("1177"))
        self.assertFalse(is_residential_state_use_code("9179"))


class AssessedSplitMathTests(unittest.TestCase):
    """Numbers match the committed Try-demo fixture (PIN-less; public sample math)."""

    IMPROVEMENT = 454100.0
    LAND = 130000.0
    TOTAL = 584100.0
    TOTAL_ASSESSED = 35747.0

    def test_local_split_improved_with_land(self) -> None:
        fields = local_assessed_split_fields(
            self.IMPROVEMENT, self.LAND, self.TOTAL_ASSESSED
        )
        self.assertEqual(fields["assessedLand"], 8840)
        self.assertEqual(fields["assessedBuilding"], 26907)

    def test_school_split_improved_with_land(self) -> None:
        fields = school_assessed_fields_from_actuals(
            self.IMPROVEMENT, self.LAND, self.TOTAL
        )
        self.assertEqual(fields["schoolAssessedBuilding"], 32014)
        self.assertEqual(fields["schoolAssessedLand"], 9165)
        self.assertEqual(fields["schoolAssessedTotal"], 41179)

    def test_local_vacant_land_all_to_land(self) -> None:
        fields = local_assessed_split_fields(0.0, 200000.0, 13600.0)
        self.assertEqual(fields, {"assessedBuilding": 0, "assessedLand": 13600})

    def test_local_improvement_only_all_to_building(self) -> None:
        fields = local_assessed_split_fields(300000.0, 0.0, 20400.0)
        self.assertEqual(
            fields, {"assessedBuilding": 20400, "assessedLand": 0}
        )

    def test_attach_writes_both_when_qualified(self) -> None:
        rec: dict = {
            "improvementActual": self.IMPROVEMENT,
            "landActual": self.LAND,
            "totalActual": self.TOTAL,
            "totalAssessed": self.TOTAL_ASSESSED,
        }
        attach_computed_assessed_values(rec, _real_improvement_row("2026"))
        self.assertEqual(rec["assessedLand"], 8840)
        self.assertEqual(rec["assessedBuilding"], 26907)
        self.assertEqual(rec["schoolAssessedTotal"], 41179)

    def test_attach_skips_school_when_not_improvement_class(self) -> None:
        rec: dict = {
            "improvementActual": self.IMPROVEMENT,
            "landActual": self.LAND,
            "totalActual": self.TOTAL,
            "totalAssessed": self.TOTAL_ASSESSED,
        }
        attach_computed_assessed_values(
            rec,
            {
                "AssessmentYear": "2026",
                "TaxRollDescr": "Real",
                "PropertyClassDescr": "Real",
                "StateUseCd": "1177",
            },
        )
        self.assertIn("assessedLand", rec)
        self.assertNotIn("schoolAssessedTotal", rec)

    def test_non_residential_proportional_split(self) -> None:
        """Hospital-style non-residential: proportional split, no school assessed."""
        improvement = 110047224.0
        land = 25008510.0
        total = 135055734.0
        total_assessed = 36465048.0
        fields = non_residential_assessed_split_fields(
            improvement, land, total, total_assessed
        )
        self.assertEqual(fields["assessedBuilding"], 29712750)
        self.assertEqual(fields["assessedLand"], 6752298)
        rec: dict = {
            "improvementActual": improvement,
            "landActual": land,
            "totalActual": total,
            "totalAssessed": total_assessed,
        }
        attach_computed_assessed_values(
            rec,
            {
                "AssessmentYear": "2026",
                "TaxRollDescr": "Real",
                "PropertyClassDescr": "Improvement",
                "StateUseCd": "9179",
            },
        )
        self.assertEqual(rec["assessedBuilding"], 29712750)
        self.assertEqual(rec["assessedLand"], 6752298)
        self.assertNotIn("schoolAssessedTotal", rec)

    def test_attach_skips_all_before_2025(self) -> None:
        rec: dict = {
            "improvementActual": self.IMPROVEMENT,
            "landActual": self.LAND,
            "totalActual": self.TOTAL,
            "totalAssessed": self.TOTAL_ASSESSED,
        }
        attach_computed_assessed_values(rec, _real_improvement_row("2024"))
        self.assertNotIn("assessedLand", rec)
        self.assertNotIn("schoolAssessedTotal", rec)


class NormalizeIntegerishCodeTests(unittest.TestCase):
    def test_strips_excel_whole_number_suffix(self) -> None:
        self.assertEqual(normalize_integerish_code("54850.0"), "54850")
        self.assertEqual(normalize_integerish_code("54850.000"), "54850")

    def test_preserves_leading_zeros(self) -> None:
        self.assertEqual(normalize_integerish_code("0400.0"), "0400")
        self.assertEqual(normalize_integerish_code("0400"), "0400")

    def test_leaves_non_matching_inputs_intact(self) -> None:
        self.assertEqual(normalize_integerish_code("ABC.0"), "ABC.0")
        self.assertEqual(normalize_integerish_code("1.5"), "1.5")
        self.assertEqual(normalize_integerish_code(""), "")
        self.assertEqual(normalize_integerish_code(None), "")


class FormatSitusLabelTests(unittest.TestCase):
    def test_locality_includes_state_and_zip(self) -> None:
        self.assertEqual(
            format_situs_locality("ENGLEWOOD", "CO", "80111-5541"),
            "ENGLEWOOD, CO 80111-5541",
        )

    def test_locality_defaults_state_to_co(self) -> None:
        self.assertEqual(
            format_situs_locality("AURORA", "", "80012"),
            "AURORA, CO 80012",
        )

    def test_locality_zip_only_unchanged(self) -> None:
        self.assertEqual(format_situs_locality("", "", "80111"), "80111")

    def test_label_includes_unit_city_state_zip(self) -> None:
        label = format_situs_label(
            {
                "SAAddrNumber": "6420",
                "SAPredirectional": "S",
                "SAStreetName": "DAYTON",
                "SAStreetType": "ST",
                "SAUnitNumber": "J01",
                "SACity": "ENGLEWOOD",
                "SAState": "CO",
                "SAPostalCd": "80111-5541",
                "Pin": "031835674",
            }
        )
        self.assertEqual(
            label,
            "6420 S DAYTON ST Unit J01, ENGLEWOOD, CO 80111-5541",
        )


if __name__ == "__main__":
    unittest.main()
