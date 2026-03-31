import type { Metadata } from "next";
import { LevyBreakdownToolPageContent } from "@/components/LevyBreakdownToolPageContent";

export const metadata: Metadata = {
  title: "Property tax levy breakdown | Arapahoe County",
  description:
    "Walkthrough: find your Arapahoe County parcel and open your tax district levies on the assessor site. More in-tool help is on the way.",
};

export default function LevyBreakdownPage() {
  return <LevyBreakdownToolPageContent />;
}
