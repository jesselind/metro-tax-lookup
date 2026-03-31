import type { Metadata } from "next";
import { MetroTaxLookupToolPageContent } from "@/components/MetroTaxLookupToolPageContent";

export const metadata: Metadata = {
  title: "Metro district tax share | Arapahoe County",
  description:
    "See what share of your Arapahoe County property tax pays for metro district debt. Enter two numbers from your tax bill or the county site.",
};

export default function MetroTaxLookupPage() {
  return <MetroTaxLookupToolPageContent />;
}
