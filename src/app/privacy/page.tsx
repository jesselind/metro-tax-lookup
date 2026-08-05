// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { StaticArticleShell } from "@/components/StaticArticleShell";
import {
  CampaignSiteLink,
  hasCampaignSiteLink,
} from "@/components/CampaignSiteLink";
import { CONTACT_EMAIL, CONTACT_MAILTO_HREF } from "@/lib/contact";
import {
  SITE_BRAND_NAME,
  TRADEMARK_NOTICE,
} from "@/content/trademarkNotice";
import { TERM_LINK_CLASS } from "@/lib/toolFlowStyles";

export const metadata = {
  title: "Privacy policy",
  description: `Privacy policy for ${SITE_BRAND_NAME}.`,
};

export default function PrivacyPage() {
  return (
    <StaticArticleShell
      title="Privacy policy"
      intro="This site does not track you for ads, sell your data, or collect personal information through forms. Limited exceptions are explained below: voluntary email you choose to send, and network addresses used only to blunt abusive downloads of county data files."
    >
      <section className="mt-6 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          What we collect
        </h2>
        <p>
          Lookups and calculator numbers stay in your browser. This site does
          not send that information to our servers.
        </p>
        <p>
          When your browser requests county data files from this site, the
          hosting platform may see a network address (IP) for that request. We
          use that only to limit abusive download volume. We do not use it for
          advertising, analytics profiles, or selling data.
        </p>
      </section>

      <section className="mt-8 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Voluntary email
        </h2>
        <p>
          If you email{" "}
          <a href={CONTACT_MAILTO_HREF} className={TERM_LINK_CLASS}>
            {CONTACT_EMAIL}
          </a>
          {" "}
          (for example through a &quot;report a problem&quot; link), that
          message goes through your own mail app. You choose whether to send
          it and what to leave in. Feedback prompts may ask you to describe
          what you searched (for example an address or parcel). Some
          &quot;missing data&quot; report links draft an email that already
          includes parcel identifiers from the page you were on (such as PIN
          or AIN); you can edit or delete those before sending. We use what
          you send only to respond and fix problems. We do not sell it or use
          it for advertising.
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
          property search
          {hasCampaignSiteLink() ? (
            <>
              , and the{" "}
              {/* FORK REQUIRED: SITE_CONFIG.campaignSiteUrl / campaignSiteLabel */}
              <CampaignSiteLink />
              {" "}
              campaign site
            </>
          ) : null}
          ). Those sites have their own privacy practices.
        </p>
      </section>

      <section
        id="trademark"
        className="mt-8 space-y-4 text-base leading-relaxed text-slate-800 sm:text-lg"
      >
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Trademark
        </h2>
        <p>{TRADEMARK_NOTICE}</p>
      </section>
    </StaticArticleShell>
  );
}
