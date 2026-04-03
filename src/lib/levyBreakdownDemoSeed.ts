/**
 * Sample levy stack for the "Show me how this works with sample data" toggle
 * (matches the example in levy-stack-no-highlight.png).
 */

/** Same shape as committed lines in LevyStackManualEntry. */
export type LevyBreakdownDemoLine = {
  id: string;
  authority: string;
  mills: number;
};

/** Raw rows: 2025 Tax Levies for Taxing Authority 0747 (example stack). */
const DEMO_ROWS: { authority: string; mills: number }[] = [
  { authority: "Littleton School Dist # 6", mills: 65.193 },
  { authority: "Arapahoe County", mills: 15.959 },
  { authority: "Developmental Disability", mills: 1.0 },
  { authority: "City Of Littleton", mills: 2.0 },
  // County levy pages often abbreviate this as SMFR; full name matches DOLA/GIS.
  {
    authority: "South Metro Fire Rescue Fire Protection District",
    mills: 12.25,
  },
  { authority: "Regional Transportation", mills: 0 },
  { authority: "S Suburban Park & Rec", mills: 8.8 },
  { authority: "Urban Drainage & Flood", mills: 0.9 },
  { authority: "Urbn Drnge&Fld (S Platte)", mills: 0.1 },
  { authority: "W. Arap. Conservation Dis", mills: 0 },
];

/** Example stack total mills: 106.202 */

export function getLevyBreakdownDemoLines(): LevyBreakdownDemoLine[] {
  return DEMO_ROWS.map((row, i) => ({
    id: `levy-demo-${i}`,
    authority: row.authority,
    mills: Math.round(row.mills * 1000) / 1000,
  }));
}
