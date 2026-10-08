"use client";

import { FileText, Users, MessageSquare, CreditCard, TrendingUp } from "lucide-react";

const STEPS = [
  { icon: FileText, title: "Create a Campaign", desc: "Tell us your goals, budget and deliverables." },
  { icon: Users, title: "Receive Bids", desc: "Creators apply or bid with their proposals." },
  { icon: MessageSquare, title: "Select & Collaborate", desc: "Compare profiles, chat and finalize." },
  { icon: CreditCard, title: "Secure Payment", desc: "Funds are held in escrow until approval." },
  { icon: TrendingUp, title: "Track & Grow", desc: "Manage deliverables and measure results." },
];

export default function HowItWorks() {
  return (
    <section className="py-16 sm:py-20 bg-brand-lavender">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <span className="inline-block text-xs font-semibold tracking-wide text-brand-indigo uppercase mb-2">
          The Process
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#111827]">How BlooCube works</h2>
        <p className="text-[#667085] mt-2 max-w-xl">
          A simple and transparent process from campaign brief to final delivery.
        </p>

        <div className="mt-10 relative grid grid-cols-1 sm:grid-cols-5 gap-6">
          <div className="hidden sm:block absolute top-9 left-[10%] right-[10%] h-px bg-gradient-to-r from-brand-indigo/0 via-brand-indigo/30 to-brand-indigo/0" />
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="relative bg-white rounded-xl border border-slate-100 shadow-sm p-5 transition-shadow hover:shadow-md"
              >
                <div className="w-9 h-9 rounded-full bg-brand-lavender text-brand-indigo flex items-center justify-center text-sm font-bold mb-3 ring-4 ring-white">
                  {i + 1}
                </div>
                <Icon className="w-5 h-5 text-brand-indigo mb-2" />
                <div className="font-semibold text-[#111827] text-sm">{s.title}</div>
                <div className="text-xs text-[#667085] mt-1">{s.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
