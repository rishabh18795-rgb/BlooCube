import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3090";

const PUBLIC_ROUTES = [
  "",
  "/find-creators",
  "/campaigns",
  "/how-it-works",
  "/pricing",
  "/about",
  "/resources",
  "/contact",
  "/login",
  "/signup",
  "/terms",
  "/privacy",
  "/cookie-policy",
  "/cancellation-refund",
  "/shipping-delivery",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
}
