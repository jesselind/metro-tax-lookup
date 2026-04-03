import type { Metadata } from "next";
import { LevyBreakdownToolPageContent } from "@/components/LevyBreakdownToolPageContent";

export const metadata: Metadata = {
  title: "Property tax levy breakdown | Arapahoe County",
  description:
    "Walkthrough: find your Arapahoe County parcel and PIN, then load your district levy lines in the tool.",
};

export default function LevyBreakdownPage() {
  return <LevyBreakdownToolPageContent />;
}
