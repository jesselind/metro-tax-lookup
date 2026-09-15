#!/usr/bin/env python3
# Metro Tax Lookup
# Copyright (C) 2026 Jesse Lind
# SPDX-License-Identifier: AGPL-3.0-or-later

import json
import tempfile
import unittest
from pathlib import Path

from extract_douglas_valuation_history import (
  aggregate_values_by_tax_year,
  expected_account_count_from_manifest,
  parse_detail_file,
  validate_extract_count,
  write_shards,
)

# Invented Realware-shaped detail (split-rate taxDollars). Not a real parcel.
SYNTHETIC_SPLIT_RATE_DETAIL = (
  Path(__file__).resolve().parent
  / "fixtures"
  / "douglas_realware_detail_synthetic_split_rate.json"
)


class TestAggregateValuesByTaxYear(unittest.TestCase):
  def test_sums_abstract_codes_per_year(self) -> None:
    rows = [
      {
        "taxYear": 2025.0,
        "abstractCode": "1212",
        "actualValue": 100.0,
        "assessedValue": 7.0,
        "alternateAssessedValue": 8.0,
        "taxDollars": 1.4,
        "alternateTaxDollars": 1.6,
      },
      {
        "taxYear": 2025.0,
        "abstractCode": "1111",
        "actualValue": 50.0,
        "assessedValue": 3.0,
        "alternateAssessedValue": 4.0,
        "taxDollars": 0.6,
        "alternateTaxDollars": 0.4,
      },
      {
        "taxYear": 2024.0,
        "abstractCode": "1212",
        "actualValue": 90.0,
        "assessedValue": 6.0,
      },
    ]
    out = aggregate_values_by_tax_year(rows)
    self.assertEqual(
      out,
      [
        {
          "taxYear": 2024,
          "actualValue": 90,
          "assessedValue": 6,
          "alternateAssessedValue": 0,
          "taxDollars": 0,
          "alternateTaxDollars": 0,
        },
        {
          "taxYear": 2025,
          "actualValue": 150,
          "assessedValue": 10,
          "alternateAssessedValue": 12,
          "taxDollars": 2,
          "alternateTaxDollars": 2,
        },
      ],
    )

class TestParseDetailFile(unittest.TestCase):
  def test_reads_account_and_history(self) -> None:
    with tempfile.TemporaryDirectory() as tmp:
      path = Path(tmp) / "R0100001.json"
      path.write_text(
        json.dumps(
          {
            "accountNumber": "R0100001",
            "valuesByAbstractCode": [
              {
                "taxYear": 2026.0,
                "actualValue": 400000.0,
                "assessedValue": 28600.0,
              },
              {
                "taxYear": 2025.0,
                "actualValue": 380000.0,
                "assessedValue": 27170.0,
              },
            ],
          },
        ),
        encoding="utf-8",
      )
      parsed = parse_detail_file(path)
      self.assertIsNotNone(parsed)
      account, history = parsed
      self.assertEqual(account, "R0100001")
      self.assertEqual(len(history), 2)
      self.assertEqual(history[-1]["taxYear"], 2026)

  def test_synthetic_split_rate_detail_golden(self) -> None:
    """Committed Realware-shaped fixture: split-rate tax totals survive extract."""
    self.assertTrue(
      SYNTHETIC_SPLIT_RATE_DETAIL.is_file(),
      f"missing fixture: {SYNTHETIC_SPLIT_RATE_DETAIL}",
    )
    parsed = parse_detail_file(SYNTHETIC_SPLIT_RATE_DETAIL)
    self.assertIsNotNone(parsed)
    account, history = parsed
    self.assertEqual(account, "R0100001")
    by_year = {row["taxYear"]: row for row in history}
    self.assertEqual(by_year[2025]["assessedValue"], 25740)
    self.assertEqual(by_year[2025]["alternateAssessedValue"], 25380)
    self.assertEqual(
      by_year[2025]["taxDollars"] + by_year[2025]["alternateTaxDollars"],
      2300,
    )
    self.assertEqual(by_year[2026]["assessedValue"], 27170)
    self.assertEqual(by_year[2026]["alternateAssessedValue"], 26790)
    self.assertEqual(
      by_year[2026]["taxDollars"] + by_year[2026]["alternateTaxDollars"],
      2500,
    )
    # Honesty: Realware face total must not equal assessed × a typical mill product.
    mills_product_80 = round(by_year[2026]["assessedValue"] * (80 / 1000))
    self.assertNotEqual(
      by_year[2026]["taxDollars"] + by_year[2026]["alternateTaxDollars"],
      mills_product_80,
    )


class TestWriteShards(unittest.TestCase):
  def test_shard_prefix_and_by_account(self) -> None:
    with tempfile.TemporaryDirectory() as tmp:
      out = Path(tmp)
      write_shards(
        out,
        {
          "R0100001": [
            {"taxYear": 2025, "actualValue": 1, "assessedValue": 2},
          ],
        },
        bundled_as_of="2026-08-28",
        stamp_year="2026",
        process_run_date="9/4/2026",
        pin_digits=8,
      )
      shard = out / "douglas-valuation-history-by-account" / "R01000.json"
      self.assertTrue(shard.is_file())
      data = json.loads(shard.read_text(encoding="utf-8"))
      self.assertEqual(data["shardPrefix"], "R01000")
      self.assertIn("R0100001", data["byAccount"])


class TestMetaCountValidation(unittest.TestCase):
  def test_reads_total_accounts_from_manifest_or_meta_metrics(self) -> None:
    self.assertEqual(
      expected_account_count_from_manifest({"totalAccountsProcessed": 169000}),
      169000,
    )
    self.assertEqual(
      expected_account_count_from_manifest(
        {"metrics": {"totalAccountsProcessed": 42}},
      ),
      42,
    )
    self.assertIsNone(expected_account_count_from_manifest({}))

  def test_validate_extract_count_strict_exits_on_mismatch(self) -> None:
    with self.assertRaises(SystemExit):
      validate_extract_count(
        10,
        {"totalAccountsProcessed": 11},
        strict=True,
      )

  def test_validate_extract_count_warns_when_not_strict(self) -> None:
    validate_extract_count(
      10,
      {"totalAccountsProcessed": 11},
      strict=False,
    )


if __name__ == "__main__":
  unittest.main()
