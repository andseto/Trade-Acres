import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, List, Section } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={`These terms cover your use of ${SITE_NAME}. By creating an account or using the site you agree to them. If you don't agree, please don't use it.`}
    >
      <Section title="What the service is">
        <p>
          {SITE_NAME} is a journaling tool. You record your trades and notes, and the app turns your consistency into a farm. It is a record-keeping and motivation tool only.
        </p>
      </Section>

      <Section title="Not financial advice">
        <p>
          Nothing in {SITE_NAME} is investment, trading, tax or legal advice. We don&apos;t recommend any trade, strategy or firm. Trading carries a real risk of loss. Any figures, statistics or charts shown are based only on what you enter, and may be incomplete or wrong. {SITE_NAME} isn&apos;t a broker, a prop firm or an exchange, and isn&apos;t affiliated with any of them.
        </p>
      </Section>

      <Section title="Your account">
        <List>
          <li>You must be at least 18 and able to enter a binding agreement.</li>
          <li>Give us accurate details and keep your password secure. You&apos;re responsible for activity on your account.</li>
          <li>One person per account. Don&apos;t share your login.</li>
        </List>
      </Section>

      <Section title="Your content">
        <p>
          What you put in (trades, notes, screenshots) stays yours. You give us permission to store and display it back to you so the service works, and nothing more. Only upload things you have the right to upload, and please don&apos;t include other people&apos;s private information in screenshots.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>Please don&apos;t:</p>
        <List>
          <li>break the law or use the service to harm others;</li>
          <li>try to access other people&apos;s data or break, overload or probe the service;</li>
          <li>upload malware or anything unlawful;</li>
          <li>use automated tools to scrape or abuse the site.</li>
        </List>
      </Section>

      <Section title="Availability and changes">
        <p>
          We work to keep {SITE_NAME} running but can&apos;t promise it will always be available or error-free, and features may change. Download a copy of your data under{" "}
          <Link href="/settings" className="text-leaf underline">
            Settings
          </Link>{" "}
          whenever you like.
        </p>
      </Section>

      <Section title="Ending your account">
        <p>
          You can delete your account at any time from Settings, which permanently removes your data. We may suspend or close accounts that break these terms.
        </p>
      </Section>

      <Section title="Disclaimer and liability">
        <p>
          The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any kind. To the fullest extent the law allows, we aren&apos;t liable for any losses arising from your use of {SITE_NAME}, including trading losses or lost data. Nothing here limits rights you have under law that can&apos;t be limited.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>We may update these terms from time to time. If we make a meaningful change we&apos;ll update the date at the top. Continuing to use the site means you accept the update.</p>
      </Section>

      <Section title="Contact">
        <p>
          {CONTACT_EMAIL ? (
            <>
              Questions about these terms? Email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-leaf underline">
                {CONTACT_EMAIL}
              </a>
              .
            </>
          ) : (
            <>
              See also our{" "}
              <Link href="/privacy" className="text-leaf underline">
                Privacy Policy
              </Link>
              .
            </>
          )}
        </p>
      </Section>
    </LegalPage>
  );
}
