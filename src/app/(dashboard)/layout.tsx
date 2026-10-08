import type { Metadata } from "next";

// Authenticated dashboard routes (creator/brand/admin) carry private account
// data and must never be indexed, even though robots.txt already disallows
// them — a disallow is advisory and doesn't stop a URL that's already
// linked somewhere from being indexed, this header is the real signal.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
