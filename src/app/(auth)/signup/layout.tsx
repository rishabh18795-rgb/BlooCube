import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your free BlooCube account as a creator or a brand and start collaborating on influencer campaigns.",
  alternates: { canonical: "/signup" },
  openGraph: { title: "Sign Up | BlooCube", description: "Create your free BlooCube account as a creator or a brand.", url: "/signup", images: ["/opengraph-image"] },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
