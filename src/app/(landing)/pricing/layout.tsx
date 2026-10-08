import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for brands and creators collaborating on BlooCube.",
  alternates: { canonical: "/pricing" },
  openGraph: { title: "Pricing | BlooCube", description: "Simple, transparent pricing for brands and creators.", url: "/pricing", images: ["/opengraph-image"] },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
