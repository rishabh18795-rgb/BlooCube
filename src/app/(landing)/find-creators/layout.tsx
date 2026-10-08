import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Creators",
  description: "Browse verified Instagram, YouTube and TikTok creators by niche, location and follower count on BlooCube's influencer marketplace.",
  alternates: { canonical: "/find-creators" },
  openGraph: { title: "Find Creators | BlooCube", description: "Browse verified creators by niche, location and follower count.", url: "/find-creators", images: ["/opengraph-image"] },
};

export default function FindCreatorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
