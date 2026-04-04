import { InfoDetails } from "@/components/InfoDetails";
import { INFO_DETAILS_WIDE_CLASS } from "@/lib/toolFlowStyles";

type Props = {
  className?: string;
};

/**
 * Plain-language metro district explainer for the home metro card.
 */
export function MetroDistrictInfoDetails({
  className = INFO_DETAILS_WIDE_CLASS,
}: Props) {
  return (
    <InfoDetails title="What&apos;s a metro district?" className={className}>
      <div className="space-y-2">
        <p>
          A <strong>metro district</strong> (metropolitan district) is a local
          government that can charge property taxes in your neighborhood for things
          like roads, parks, and water. Often part of that tax goes to paying off
          long-term debt (bonds).
        </p>
        <p>
          A bond is like a long-term IOU: the district borrows money to build things,
          then repays it over many years using a portion of property taxes. The
          &quot;debt service&quot; number in this tool is the part of your tax rate
          that goes to those repayments.
        </p>
        <p>
          <strong>How it is supposed to work:</strong> Developers often form metro
          districts and the district may issue bonds that investors (sometimes the
          developer) buy. In a conservative or well-run district, the money borrowed
          roughly matches the cost of roads, parks, and other improvements, and
          property taxes simply pay that debt back over time.
        </p>
        <p>
          <strong>How it can be abused:</strong> In other districts, the bonds are
          used as a cash-flow strategy: the amount borrowed is intentionally larger
          than what was spent on improvements so investors can make a profit.
          Homeowners repay that debt through property taxes over many years, and can
          end up paying for infrastructure twice: once in the home price and again
          through their tax bill.
        </p>
        <p>
          On top of that, many metro district debt service mill levies are approved
          by voters as TABOR-exempt. Colorado&apos;s Taxpayer&apos;s Bill of Rights
          (TABOR) normally limits how fast local government tax revenue can grow.
          But metro district voters can approve mill levies that are TABOR-exempt,
          especially for debt payments. Those levies are allowed to increase as
          needed to cover bonds and other obligations, even when other parts of a tax
          bill are held down by TABOR limits.
        </p>
        <p>
          Early on, the only &quot;voters&quot; in a new metro district are often the
          developer and people closely tied to them. It is not unusual for a
          developer to sell tiny parcels to employees or other insiders for the sole
          purpose of making them property owners with voting power. They then
          unanimously approve high mill levies, generous debt authority, and
          TABOR-exempt status for that debt. That structure can leave homeowners
          locked into years of high tax collections with little oversight, weak
          accountability, and almost no practical way for them to push back. In
          Colorado, metropolitan districts are a type of special district, and special
          districts are explicitly exempt from the jurisdiction of the Colorado
          Independent Ethics Commission.
        </p>
      </div>
    </InfoDetails>
  );
}
