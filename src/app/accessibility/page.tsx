import { StaticArticleShell } from "@/components/StaticArticleShell";

export const metadata = {
  title: "Accessibility statement | Metro district tax share",
  description:
    "Accessibility statement for the Metro district tax share tool.",
};

export default function AccessibilityPage() {
  return (
    <StaticArticleShell
      title="Accessibility statement"
      intro="We want this tool to be accessible and usable for everyone. We strive to meet WCAG 2.1 AA."
    >
      <section className="mt-6 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Feedback and support
        </h2>
        <p>
          If you encounter an accessibility barrier (keyboard navigation,
          screen reader output, color contrast, or clarity of instructions),
          please email{" "}
          <a
            href="mailto:metro.tax.lookup@pm.me"
            className="font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
          >
            metro.tax.lookup@pm.me
          </a>
          . If you can, include:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>The page you were on</li>
          <li>What you expected to happen</li>
          <li>What actually happened</li>
          <li>Your browser/device (optional)</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3 text-base leading-relaxed text-slate-800 sm:text-lg">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Compatibility
        </h2>
        <p>
          This site is designed to work with modern browsers and assistive
          technologies. If something does not work with your setup, please
          report it.
        </p>
      </section>
    </StaticArticleShell>
  );
}
