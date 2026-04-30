// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ReactNode } from "react";
import { MailIcon } from "@/components/MailIcon";
import {
  MAIL_CONTACT_CARD_BODY_CLASS,
  MAIL_CONTACT_CARD_ICON_SHELL_CLASS,
  MAIL_CONTACT_CARD_KICKER_CLASS,
  MAIL_CONTACT_CARD_LINK_CLASS,
  MAIL_CONTACT_CARD_MAIL_ICON_CLASS,
  MAIL_CONTACT_CARD_PRIMARY_LINE_CLASS,
  MAIL_CONTACT_CARD_SECONDARY_CLASS,
} from "@/lib/mailContactCardStyles";

export type MailContactCardProps = {
  href: string;
  kicker: string;
  primaryLine: ReactNode;
  secondary: ReactNode;
};

/** Mail CTA card: shared layout for /contact and in-flow feedback (e.g. home dashboard). */
export function MailContactCard({
  href,
  kicker,
  primaryLine,
  secondary,
}: MailContactCardProps) {
  return (
    <a href={href} className={MAIL_CONTACT_CARD_LINK_CLASS}>
      <div className={MAIL_CONTACT_CARD_ICON_SHELL_CLASS}>
        <MailIcon className={MAIL_CONTACT_CARD_MAIL_ICON_CLASS} />
      </div>
      <div className={MAIL_CONTACT_CARD_BODY_CLASS}>
        <p className={MAIL_CONTACT_CARD_KICKER_CLASS}>{kicker}</p>
        <p className={MAIL_CONTACT_CARD_PRIMARY_LINE_CLASS}>{primaryLine}</p>
        <p className={MAIL_CONTACT_CARD_SECONDARY_CLASS}>{secondary}</p>
      </div>
    </a>
  );
}
