import Link from "next/link";

export const metadata = {
  title: "Accessibility statement | Metro district tax share",
  description:
    "Accessibility statement for the Metro district tax share tool.",
};

export default function AccessibilityPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-widest text-indigo-900 sm:text-base">
            Metro district tax share
          </p>
          <h1 className="bg-slate-800 px-4 py-3 text-2xl font-bold leading-tight tracking-tight text-white sm:px-5 sm:py-4 sm:text-3xl">
            Accessibility statement
          </h1>
          <p className="max-w-prose text-base leading-relaxed text-slate-700 sm:text-lg">
            We want this tool to be accessible and usable for everyone. We
            strive to meet WCAG 2.1 AA.
          </p>
        </header>

        <section className="mt-6 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
            Feedback and support
          </h2>
          <p className="max-w-prose">
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
          <p className="max-w-prose">
            This site is designed to work with modern browsers and assistive
            technologies. If something does not work with your setup, please
            report it.
          </p>
        </section>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-indigo-400 bg-white px-4 py-2 text-base font-medium text-indigo-950 shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-2"
          >
            Back to the tool
          </Link>
        </div>
      </div>
    </main>
  );
}

