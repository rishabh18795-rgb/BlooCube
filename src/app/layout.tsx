import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { PerformanceDebugger } from "@/Components/PerformanceDebugger";
import RouteProgress from "@/Components/ui/RouteProgress";
import GoogleAnalytics from "@/Components/GoogleAnalytics";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3090";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BlooCube — Influencer Marketing Marketplace for Brands & Creators",
    template: "%s | BlooCube",
  },
  description:
    "Discover verified creators, launch influencer campaigns, compare bids and manage collaborations with secure payments on BlooCube.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "BlooCube — Influencer Marketing Marketplace for Brands & Creators",
    description:
      "Discover verified creators, launch influencer campaigns, compare bids and manage collaborations with secure payments on BlooCube.",
    url: siteUrl,
    siteName: "BlooCube",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "BlooCube — Influencer Marketing Marketplace" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BlooCube — Influencer Marketing Marketplace for Brands & Creators",
    description:
      "Discover verified creators, launch influencer campaigns, compare bids and manage collaborations with secure payments on BlooCube.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={plusJakarta.variable}>
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
