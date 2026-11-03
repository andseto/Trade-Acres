import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, List, Section } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`${SITE_NAME} is a trading journal. This page explains what we collect when you use it, why, who can see it, and how you stay in control. The short version: it's your journal, we don't sell it, and you can download or delete all of it yourself.`}
    >
      <Section title="What we collect">
        <List>
          <li>
            <strong>Account details:</strong> your email address, a password (stored only as a salted hash, never in plain text), your display name and an optional username. If you sign in with Google, we receive your name and email from Google.
          </li>
          <li>
            <strong>What you add to the app:</strong> your plots (trading accounts), trades, journal entries, notes, ratings, emotions and any screenshots you upload.
          </li>
          <li>
            <strong>Settings:</strong> things like your chosen season.
          </li>
          <li>
            <strong>Technical data:</strong> standard server logs (such as IP address and browser type) that our infrastructure records when you visit.
          </li>
        </List>
        <p>We don&apos;t ask for broker logins, API keys or banking details, and we never connect to your trading accounts.</p>
      </Section>

      <Section title="How we use it">
        <List>
          <li>To run the app: sign you in, show your farm, calendar and journal, and store your screenshots.</li>
          <li>To send emails you ask for: sign-in links, password resets and email-change confirmations.</li>
          <li>To keep the service secure and fix problems.</li>
        </List>
        <p>We don&apos;t use your trading data for advertising, and we don&apos;t sell or rent your personal information.</p>
      </Section>

      <Section title="Who can see your data">
        <p>
          Only you. Your journal is private to your account and isn&apos;t shown to other users. Behind the scenes, your data is stored and processed by Supabase (our database, sign-in and file-storage provider) and by the company that hosts this website. They handle it only to provide the service. We may also disclose information if the law requires it.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          We use only the essential cookies that keep you signed in. We don&apos;t use advertising or analytics trackers, so there&apos;s no cookie banner to dismiss.
        </p>
      </Section>

      <Section title="Your choices and rights">
        <p>
          You can do all of this yourself under{" "}
          <Link href="/settings" className="text-leaf underline">
            Settings
          </Link>
          :
        </p>
        <List>
          <li>Download a copy of your data (JSON and a trades CSV).</li>
          <li>Clear your trades, journal entries or plots, or reset your whole farm.</li>
          <li>Change your email or password.</li>
          <li>Permanently delete your account and everything attached to it.</li>
        </List>
        <p>Deleting your account removes your data from our database and your screenshots from storage. Routine backups kept by our providers may take a short while to expire.</p>
      </Section>

      <Section title="How long we keep it">
        <p>For as long as your account exists. When you delete something, or your whole account, it&apos;s removed as described above.</p>
      </Section>

      <Section title="Security">
        <p>
          Data travels over encrypted connections, your journal is protected by per-user access rules in the database, and passwords are hashed. No system is perfectly secure, so please use a strong, unique password.
        </p>
      </Section>

      <Section title="Children">
        <p>{SITE_NAME} is for adults. It isn&apos;t directed at anyone under 18, and we don&apos;t knowingly collect their information.</p>
      </Section>

      <Section title="Changes">
        <p>If we change this policy in a meaningful way we&apos;ll update the date at the top of this page.</p>
      </Section>

      <Section title="Contact">
        <p>
          {CONTACT_EMAIL ? (
            <>
              Questions or requests? Email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-leaf underline">
                {CONTACT_EMAIL}
              </a>
              .
            </>
          ) : (
            <>Most requests (export, deletion, changes) can be done directly in your account settings.</>
          )}
        </p>
      </Section>
    </LegalPage>
  );
}
