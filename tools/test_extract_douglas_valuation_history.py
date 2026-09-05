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
  parse_detail_file,
  write_shards,
)


class TestAggregateValuesByTaxYear(unittest.TestCase):
  def test_sums_abstract_codes_per_year(self) -> None:
    rows = [
      {
        "taxYear": 2025.0,
        "abstractCode": "1212",
        "actualValue": 100.0,
        "assessedValue": 7.0,
      },
      {
        "taxYear": 2025.0,
        "abstractCode": "1111",
        "actualValue": 50.0,
        "assessedValue": 3.0,
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
        {"taxYear": 2024, "actualValue": 90, "assessedValue": 6},
        {"taxYear": 2025, "actualValue": 150, "assessedValue": 10},
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


if __name__ == "__main__":
  unittest.main()
