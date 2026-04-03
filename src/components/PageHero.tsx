import {
  PAGE_HERO_INNER_CLASS,
  PAGE_HERO_OUTER_CLASS,
  PAGE_HERO_SLATE_BAR_CLASS,
  PAGE_HERO_TITLE_CLASS,
} from "@/lib/toolFlowStyles";

type PageHeroProps = {
  title: string;
};

export function PageHero({ title }: PageHeroProps) {
  return (
    <header className={PAGE_HERO_OUTER_CLASS}>
      <div className={PAGE_HERO_SLATE_BAR_CLASS}>
        <div className={PAGE_HERO_INNER_CLASS}>
          <h1 className={PAGE_HERO_TITLE_CLASS}>{title}</h1>
        </div>
      </div>
    </header>
  );
}
