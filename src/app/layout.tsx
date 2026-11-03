import type { Metadata } from "next";
import { Pixelify_Sans, Nunito, Geist_Mono } from "next/font/google";
import "./globals.css";

const display = Pixelify_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Trade Acres — tend your plots, keep your accounts alive",
    template: "%s · Trade Acres",
  },
  description:
    "A trading journal where every funded account and eval is a plot on your farm. Journal your trades to keep your crops watered.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
