import type { LevyExplainerCitationBlock } from "@/lib/levyExplainer";
import { safeHttpOrHttpsUrl } from "@/lib/safeExternalHref";
import { COUNTY_EXTERNAL_LINK_CLASS } from "@/lib/toolFlowStyles";

export function LevyExplainerCitationBlocks({
  blocks,
  proseClass,
}: {
  blocks: LevyExplainerCitationBlock[];
  proseClass: string;
}) {
  return (
    <>
      {blocks.map((block, i) => (
        <p key={`${block.label}-${i}`} className={proseClass}>
          <strong className="font-semibold text-slate-900">{block.label}:</strong>
          {" "}
          {block.links.map((link, j) => {
            const safeHref = safeHttpOrHttpsUrl(link.url);
            return (
              <span key={`${block.label}-${i}-link-${j}`}>
                {j > 0 ? (
                  <>
                    {" "}
                    ·{" "}
                  </>
                ) : null}
                {safeHref ? (
                  <a
                    href={safeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={COUNTY_EXTERNAL_LINK_CLASS}
                  >
                    {link.text}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <span className="font-medium text-slate-800">{link.text}</span>
                )}
              </span>
            );
          })}
          {block.afterLinksNote ? (
            <>
              {" "}
              {block.afterLinksNote}
            </>
          ) : null}
        </p>
      ))}
    </>
  );
}
