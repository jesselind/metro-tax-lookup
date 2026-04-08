import { MailContactCard } from "@/components/MailContactCard";
import { StaticArticleShell } from "@/components/StaticArticleShell";
import { CONTACT_EMAIL, CONTACT_MAILTO_HREF } from "@/lib/contact";

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
        <MailContactCard
          href={CONTACT_MAILTO_HREF}
          kicker="Email"
          primaryLine={CONTACT_EMAIL}
          secondary="Opens your mail app to compose a message."
        />
      </section>
    </StaticArticleShell>
  );
}
