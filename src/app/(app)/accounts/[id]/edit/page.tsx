import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EditPlotForm } from "@/components/accounts/EditPlotForm";
import { getOwnAccount } from "@/components/accounts/queries";

export const metadata = { title: "Edit plot · Trade Acres" };

export default async function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { account } = await getOwnAccount(id);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/accounts/${account.id}`} className="inline-flex items-center gap-1.5 font-display text-sm text-muted hover:text-cream">
          <ArrowLeft size={16} /> Back to {account.plot_name}
        </Link>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl">Edit {account.plot_name}</h1>
        <p className="mt-1 text-muted">Tweak the account details, switch crops, or repaint the sign.</p>
      </div>
      <EditPlotForm account={account} />
    </div>
  );
}
