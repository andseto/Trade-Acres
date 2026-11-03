import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/components/landing/Hero";
import { LandingNav } from "@/components/landing/LandingNav";
import {
  CalendarTeaser,
  Confessions,
  CropShowcase,
  FenceDivider,
  Features,
  FinalCta,
  Footer,
  HowItWorks,
  PlotConditions,
} from "@/components/landing/Sections";

async function isSignedIn(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    return Boolean(data?.claims?.sub);
  } catch {
    // Supabase unreachable / not configured yet — the landing page should still render.
    return false;
  }
}

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const signedIn = await isSignedIn();
  const goodbye = (await searchParams).goodbye === "1";

  return (
    <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
      {goodbye && (
        <div role="status" className="border-b-[3px] border-outline bg-[#2f4f17] px-4 py-2.5 text-center text-sm text-[#e2f7c4]">
          Your account and all its data have been deleted. Thanks for farming with us.
        </div>
      )}
      <LandingNav signedIn={signedIn} />
      <main className="flex-1">
        <Hero signedIn={signedIn} />
        <HowItWorks />
        <FenceDivider />
        <CropShowcase />
        <FenceDivider />
        <PlotConditions />
        <FenceDivider />
        <Features />
        <CalendarTeaser />
        <Confessions />
        <FinalCta signedIn={signedIn} />
      </main>
      <Footer />
    </div>
  );
}
