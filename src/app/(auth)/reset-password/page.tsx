import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { CropSprite } from "@/components/farm/CropSprite";

export const metadata: Metadata = { title: "Reset password" };

// Reached via the email link: /auth/callback (or /auth/confirm) signs the user in, then redirects here.
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="text-center">
        <div className="mb-3 flex justify-center">
          <CropSprite crop="sunflower" stage="young" state="withering" size={64} />
        </div>
        <h1 className="font-display text-3xl [text-shadow:2px_2px_0_#140c06]">That link wilted</h1>
        <p className="mt-3 text-sm text-muted">
          Reset links expire quickly and only work once. Request a fresh one and open it in this browser.
        </p>
        <Link href="/forgot-password" className="btn-primary mt-6 w-full py-3">
          Send me a new link
        </Link>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-leaf hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm email={user.email ?? "your account"} />;
}
