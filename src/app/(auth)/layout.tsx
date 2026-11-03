import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FarmBackdrop } from "@/components/auth/FarmBackdrop";
import { Logo } from "@/components/landing/Logo";

function Nail({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={`absolute h-2 w-2 bg-[#b9a48a] shadow-[inset_-2px_-2px_0_0_#6b5a48,0_0_0_2px_#140c06] ${className}`}
    />
  );
}

// Shared farm shell for /login, /signup, /forgot-password, /reset-password: a wooden signboard over a sunny field.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden">
      <FarmBackdrop />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="panel px-3 py-2">
          <Logo size={24} className="whitespace-nowrap text-lg" />
        </div>
        <Link href="/" className="btn-ghost px-3 py-2 text-sm">
          <ArrowLeft size={14} /> <span className="sm:hidden">Back</span>
          <span className="hidden sm:inline">Back to the farmhouse</span>
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-48 pt-4 sm:pb-52">
        <div className="panel relative w-full max-w-md p-6 sm:p-8">
          <Nail className="left-2 top-2" />
          <Nail className="right-2 top-2" />
          <Nail className="bottom-2 left-2" />
          <Nail className="bottom-2 right-2" />
          {children}
        </div>
      </main>
    </div>
  );
}
