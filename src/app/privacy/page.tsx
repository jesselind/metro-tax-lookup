import Link from "next/link";

export const metadata = {
  title: "Privacy policy | Metro district tax share",
  description: "Privacy policy for the Metro district tax share tool.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-widest text-indigo-900 sm:text-base">
            Metro district tax share
          </p>
          <h1 className="bg-slate-800 px-4 py-3 text-2xl font-bold leading-tight tracking-tight text-white sm:px-5 sm:py-4 sm:text-3xl">
            Privacy policy
          </h1>
          <p className="max-w-prose text-base leading-relaxed text-slate-700 sm:text-lg">
            This site does not collect, store, or sell your personal information.
          </p>
        </header>

        <section className="mt-6 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
            What we collect
          </h2>
          <p className="max-w-prose">
            We do not collect any personal information. The numbers you enter
            into the calculator are processed in your browser and are not sent to
            a server by this site.
          </p>
        </section>

        <section className="mt-8 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
            Tracking and analytics
          </h2>
          <p className="max-w-prose">
            We do not use analytics or advertising trackers.
          </p>
        </section>

        <section className="mt-8 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
            Cookies
          </h2>
          <p className="max-w-prose">
            This site does not use cookies.
          </p>
        </section>

        <section className="mt-8 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
            Saving information in your browser
          </h2>
          <p className="max-w-prose">
            This site does not save your inputs on your device in your browser
            (for example, using local storage or session storage).
          </p>
        </section>

        <section className="mt-8 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
            External links
          </h2>
          <p className="max-w-prose">
            This site links to external websites (for example, the county
            property search). Those sites have their own privacy practices.
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

