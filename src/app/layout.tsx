import type { Metadata } from "next";
import "./globals.css";
import { PerformanceDebugger } from "@/Components/PerformanceDebugger";
import RouteProgress from "@/Components/ui/RouteProgress";
import GoogleAnalytics from "@/Components/GoogleAnalytics";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3090";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BlooCube — Brands Post. Creators Apply. Deals Happen.",
    template: "%s | BlooCube",
  },
  description:
    "BlooCube is a creator-brand collaboration marketplace: brands post campaigns, creators apply with their own bid, and payment is held in escrow until the work is approved.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "BlooCube — Brands Post. Creators Apply. Deals Happen.",
    description:
      "Discover creators, receive bids, manage collaborations and secure payments — all in one place.",
    url: siteUrl,
    siteName: "BlooCube",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlooCube — Brands Post. Creators Apply. Deals Happen.",
    description:
      "Discover creators, receive bids, manage collaborations and secure payments — all in one place.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Google Analytics - Always load in production */}
        <GoogleAnalytics />
        <RouteProgress />
        {/* Preload most-hit routes to improve perceived navigation speed */}
        <div className="hidden">
          <Link href="/login" prefetch />
          <Link href="/signup" prefetch />
          <Link href="/creator" prefetch />
          <Link href="/brand" prefetch />
        </div>
        {children}
        {process.env.NODE_ENV === "development" && <PerformanceDebugger />}
      </body>
    </html>
  );
}
