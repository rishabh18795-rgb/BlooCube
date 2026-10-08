"use client";

import { BadgeCheck, Scale, ShieldCheck, ClipboardList, Workflow } from "lucide-react";

// Honest trust signals — no fabricated client logos or unverified customer
// claims (none of the brands in this build have a confirmed partnership).
const SIGNALS = [
  { label: "Verified Creators", icon: BadgeCheck },
  { label: "Transparent Bidding", icon: Scale },
  { label: "Secure Payments", icon: ShieldCheck },
  { label: "Campaign Management", icon: ClipboardList },
  { label: "End-to-End Collaboration", icon: Workflow },
];

export default function TrustedBrands() {
  return (
    <section className="py-10 border-y border-slate-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs font-medium text-[#667085] uppercase tracking-wide mb-6">
          Built for growing brands · Designed for modern creators
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {SIGNALS.map(({ label, icon: Icon }) => (
            <span key={label} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Icon className="w-4 h-4 text-brand-indigo" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
