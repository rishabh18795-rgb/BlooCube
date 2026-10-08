import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your BlooCube creator or brand account to manage campaigns, applications and payments.",
  alternates: { canonical: "/login" },
  openGraph: { title: "Login | BlooCube", description: "Sign in to your BlooCube account.", url: "/login", images: ["/opengraph-image"] },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
