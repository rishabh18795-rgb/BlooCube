"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { Button } from "@/Components/ui/Button";

type Pricing = {
  brand: { model: string; priceInr: number };
  creator: { model: string; priceInr: number; billingCycle: string; benefits: string[] };
};

const BRAND_FEATURES = ["Unlimited campaign posts", "Review unlimited applications", "Secure escrow payments", "Campaign analytics"];

const PRICING_FAQS = [
  {
    q: "Is BlooCube really free for brands?",
    a: "Yes. Posting campaigns and reviewing creator applications costs nothing for brands. You only fund a campaign's budget once you select creators to work with.",
  },
  {
    q: "Why do creators pay a membership fee?",
    a: "The membership unlocks unlimited applications to budgeted briefs and priority visibility in brand searches — it's a fee for access to the marketplace, not a cut of what you earn from campaigns.",
  },
  {
    q: "Can I cancel the creator membership anytime?",
    a: "Yes, the membership is billed monthly and you can cancel whenever you like from your account settings.",
  },
  {
    q: "How does escrow protect both sides?",
    a: "Once a brand selects a creator, the agreed budget is held in escrow and only released to the creator after the brand approves the delivered content.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="font-semibold text-sm text-[#111827]">{q}</span>
        <ChevronDown className={`w-4 h-4 text-[#667085] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-5 pb-4 text-sm text-[#667085]">{a}</p>}
    </div>
  );
}

export default function PricingPage() {
  const [pricing, setPricing] = useState<Pricing | null>(null);

  useEffect(() => {
    apiRequest<{ success: boolean; data: Pricing }>(`/api/config/pricing`)
      .then((res) => setPricing(res.data))
      .catch(() => setPricing(null));
  }, []);

  const creatorPrice = pricing?.creator.priceInr ?? 199;
  const creatorCycle = pricing?.creator.billingCycle ?? "monthly";
  const creatorBenefits = pricing?.creator.benefits || [
    "Unlimited applications to budgeted briefs",
    "Priority visibility in brand searches",
    "Access to verified budgeted campaigns",
  ];

  return (
    <div className="bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <span className="block text-center text-xs font-semibold tracking-wide text-brand-indigo uppercase mb-2">Pricing</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] text-center">Simple, transparent pricing</h1>
        <p className="text-[#667085] mt-3 text-center max-w-xl mx-auto">
          Brands post campaigns for free. Creators unlock unlimited applications with a low monthly membership.
        </p>

        <div className="mt-12 grid sm:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 p-8 bg-gradient-to-br from-blue-50 to-white">
            <div className="text-sm font-semibold text-brand-blue uppercase">Brands</div>
            <div className="mt-2 text-4xl font-extrabold text-[#111827]">Free</div>
            <p className="text-sm text-[#667085] mt-1">Post campaigns and receive applications at no cost.</p>
            <ul className="mt-6 space-y-2 text-sm text-[#667085]">
              {BRAND_FEATURES.map((f) => (
                <li key={f} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />{f}</li>
              ))}
            </ul>
            <Link href="/signup?role=brand">
              <Button className="mt-6 w-full bg-brand-blue hover:bg-brand-blue/90 rounded-xl text-white">Get Started as a Brand</Button>
            </Link>
          </div>

          <div className="rounded-2xl border-2 border-brand-indigo/30 p-8 bg-brand-lavender relative">
            <span className="absolute -top-3 right-6 text-xs font-semibold bg-brand-indigo text-white px-3 py-1 rounded-full">Recommended</span>
            <div className="text-sm font-semibold text-brand-indigo uppercase">Creators</div>
            <div className="mt-2 text-4xl font-extrabold text-[#111827]">
              ₹{creatorPrice}
              <span className="text-base font-medium text-[#667085]">/{creatorCycle}</span>
            </div>
            <p className="text-sm text-[#667085] mt-1">Membership for access — not reach. Apply to unlimited budgeted briefs.</p>
            <ul className="mt-6 space-y-2 text-sm text-[#667085]">
              {creatorBenefits.map((f) => (
                <li key={f} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-brand-indigo shrink-0 mt-0.5" />{f}</li>
              ))}
            </ul>
            <Link href="/signup?role=creator">
              <Button className="mt-6 w-full bg-brand-indigo hover:bg-brand-indigo/90 rounded-xl text-white">Get Started as a Creator</Button>
            </Link>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#667085]">
          <ShieldCheck className="w-4 h-4 text-brand-success" />
          Every campaign payment is held in escrow until the brand approves the work.
        </div>

        {/* Feature comparison */}
        <div className="mt-16 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 font-semibold text-[#111827]">Feature</th>
                <th className="text-center py-3 font-semibold text-brand-blue">Brands</th>
                <th className="text-center py-3 font-semibold text-brand-indigo">Creators</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Post / apply to campaigns", true, true],
                ["Unlimited applications", "n/a", true],
                ["Priority visibility", "n/a", true],
                ["Secure escrow payments", true, true],
                ["Campaign analytics", true, false],
                ["Monthly cost", "₹0", `₹${creatorPrice}`],
              ].map(([feature, brand, creator]) => (
                <tr key={feature as string} className="border-b border-slate-100">
                  <td className="py-3 text-[#111827]">{feature}</td>
                  <td className="py-3 text-center text-[#667085]">
                    {typeof brand === "boolean" ? (brand ? <CheckCircle2 className="w-4 h-4 text-brand-success inline" /> : "—") : brand}
                  </td>
                  <td className="py-3 text-center text-[#667085]">
                    {typeof creator === "boolean" ? (creator ? <CheckCircle2 className="w-4 h-4 text-brand-success inline" /> : "—") : creator}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-[#111827] mb-6">Pricing FAQ</h2>
          <div className="space-y-3">
            {PRICING_FAQS.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
