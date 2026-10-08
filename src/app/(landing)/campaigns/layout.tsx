import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campaigns",
  description: "Explore active influencer marketing campaigns on BlooCube and apply with your own bid.",
  alternates: { canonical: "/campaigns" },
  openGraph: { title: "Campaigns | BlooCube", description: "Explore active influencer marketing campaigns and apply with your own bid.", url: "/campaigns", images: ["/opengraph-image"] },
};

export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
