import { StaticArticleShell } from "@/components/StaticArticleShell";

export const metadata = {
  title: "Privacy policy | Metro district tax share",
  description: "Privacy policy for the Metro district tax share tool.",
};

export default function PrivacyPage() {
  return (
    <StaticArticleShell
      title="Privacy policy"
      intro="This site does not collect, store, or sell your personal information."
    >
      <section className="mt-6 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          What we collect
        </h2>
        <p>
          We do not collect any personal information. The numbers you enter
          into the calculator are processed in your browser and are not sent to
          a server by this site.
        </p>
      </section>

      <section className="mt-8 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Tracking and analytics
        </h2>
        <p>
          We do not use analytics or advertising trackers.
        </p>
      </section>

      <section className="mt-8 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Cookies
        </h2>
        <p>This site does not use cookies.</p>
      </section>

      <section className="mt-8 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Saving information in your browser
        </h2>
        <p>
          This site does not save your inputs on your device in your browser
          (for example, using local storage or session storage).
        </p>
      </section>

      <section className="mt-8 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          External links
        </h2>
        <p>
          This site links to external websites (for example, the county
          property search). Those sites have their own privacy practices.
        </p>
      </section>
    </StaticArticleShell>
  );
}
