import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/server";
import Link from "next/link";
import { PasswordForm, ProfileForm, SignOutCard, SeasonForm } from "./SettingsForms";
import { DangerCard, DataCard, EmailForm } from "./AccountTools";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username, farm_season")
    .eq("id", user.id)
    .maybeSingle();

  const metaName = typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-3xl [text-shadow:3px_3px_0_#140c06] sm:text-4xl">Settings</h1>
        <p className="mt-1 text-muted">Your profile, sign-in details, data and the season on your farm.</p>
      </header>

      <ProfileForm
        email={user.email ?? ""}
        displayName={profile?.display_name ?? metaName}
        username={profile?.username ?? ""}
      />
      <SeasonForm current={profile?.farm_season ?? "spring"} />
      <EmailForm email={user.email ?? ""} />
      <PasswordForm />
      <DataCard />
      <SignOutCard />
      <DangerCard />

      <p className="pb-2 text-center text-xs text-muted">
        <Link href="/privacy" className="underline hover:text-cream">
          Privacy Policy
        </Link>
        {" · "}
        <Link href="/terms" className="underline hover:text-cream">
          Terms of Service
        </Link>
      </p>
    </div>
  );
}
