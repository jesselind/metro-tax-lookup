import { StaticArticleShell } from "@/components/StaticArticleShell";

const CONTACT_EMAIL = "metro.tax.lookup@pm.me";
const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
      />
    </svg>
  );
}

export const metadata = {
  title: "Contact | Metro district tax share",
  description: "Contact the maintainer of the Metro district tax share tool.",
};

export default function ContactPage() {
  return (
    <StaticArticleShell
      title="Contact"
      intro="Questions or feedback about this site? Reach out by email."
    >
      <section className="mt-8">
        <a
          href={CONTACT_MAILTO}
          className="group flex max-w-lg flex-col gap-5 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/80 to-indigo-50/40 p-6 text-left no-underline shadow-sm ring-slate-200/60 transition duration-200 hover:border-indigo-200 hover:shadow-md hover:ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:gap-6 sm:p-8"
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 shadow-inner ring-1 ring-indigo-200/60 transition group-hover:bg-indigo-200/80 group-hover:text-indigo-900">
            <MailIcon className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Email
            </p>
            <p className="mt-1 break-all text-lg font-semibold text-indigo-950 transition group-hover:text-indigo-800 sm:text-xl">
              {CONTACT_EMAIL}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Opens your mail app to compose a message.
            </p>
          </div>
        </a>
      </section>
    </StaticArticleShell>
  );
}
