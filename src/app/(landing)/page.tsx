import React from "react";
import Hero from "./components/Hero";
import CapabilityStrip from "./components/CapabilityStrip";
import HowItWorks from "./components/HowItWorks";
import BiddingSection from "./components/BiddingSection";
import ExploreCreators from "./components/ExploreCreators";
import AnalyticsPreview from "./components/AnalyticsPreview";
import PortalPreviews from "./components/PortalPreviews";
import TrustWorkflow from "./components/TrustWorkflow";
import CampaignCategories from "./components/CampaignCategories";
import FAQ from "./components/FAQ";
import { FAQS } from "./components/faqData";
import FinalCTA from "./components/FinalCTA";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3090";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BlooCube",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description: "BlooCube is an influencer marketing marketplace connecting brands and creators for campaigns, bidding and secure collaboration.",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "BlooCube",
  url: siteUrl,
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Hero />
      <HowItWorks />
      <BiddingSection />
      <ExploreCreators />
      <CapabilityStrip />
      <AnalyticsPreview />
      <PortalPreviews />
      <TrustWorkflow />
      <CampaignCategories />
      <FAQ />
      <FinalCTA />
    </>
  );
}
