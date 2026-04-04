import { InfoDetails } from "@/components/InfoDetails";
import { INFO_DETAILS_WIDE_CLASS } from "@/lib/toolFlowStyles";

/** In-page anchor for &quot;what are mills&quot; (linked from levy template mills UI). */
export const MILLS_DEFINITION_ELEMENT_ID = "what-are-mills";

type Props = {
  /** Defaults to the wide callout style used in tool step cards. */
  className?: string;
};

/** Single source of truth: mills definition (same text as metro tax tool). */
export function MillsDefinitionInfoDetails({
  className = INFO_DETAILS_WIDE_CLASS,
}: Props) {
  return (
    <InfoDetails
      id={MILLS_DEFINITION_ELEMENT_ID}
      title="What are &quot;mills&quot;?"
      className={className}
    >
      <p>
        <strong>Mills</strong> are the units used to express property tax rates. One
        mill means{" "}
        <strong>$1 of tax for every $1,000 of taxable (assessed) value</strong>. So if
        your assessed value is $400,000 and the rate is 100 mills, your tax from that
        rate would be about $400.
      </p>
    </InfoDetails>
  );
}

/** Single source of truth: levy definition (same text as metro tax tool). */
export function LevyDefinitionInfoDetails({
  className = INFO_DETAILS_WIDE_CLASS,
}: Props) {
  return (
    <InfoDetails title="What is a &quot;levy&quot;?" className={className}>
      <p>
        A <strong>levy</strong> is a taxing district&apos;s{" "}
        <strong>certified property tax rate</strong> for a given year, usually expressed
        in <strong>mills</strong>. Your <strong>mill levy</strong> on the assessor page
        is the <strong>combined</strong> rate from every district that taxes your parcel
        (schools, county, metro district, and others).
      </p>
    </InfoDetails>
  );
}
