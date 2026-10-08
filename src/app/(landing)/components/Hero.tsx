"use client";

import Link from "next/link";
import { Instagram, Youtube, Music2, Wallet2, FileCheck2, MapPin } from "lucide-react";
import { Button } from "@/Components/ui/Button";
import CreatorAvatar from "@/Components/CreatorAvatar";

const SHOWCASE = [
  { name: "Ananya Kapoor", niche: "Beauty", city: "Delhi", followers: "128K", engagement: "4.8%", icon: Instagram },
  { name: "Rohan Sharma", niche: "Tech", city: "Mumbai", followers: "82K", engagement: "6.2%", icon: Youtube },
  { name: "Mehak Patel", niche: "Lifestyle", city: "Bengaluru", followers: "210K", engagement: "5.1%", icon: Music2 },
];

const TRUST_ITEMS = [
  { label: "Verified Creators", sub: "Real profiles, real reach" },
  { label: "Transparent Bidding", sub: "Get the best rates" },
  { label: "Secure Escrow", sub: "Safe & reliable payments" },
  { label: "End-to-End", sub: "Brief to final report" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-lavender to-white">
      <div className="absolute -top-24 -right-24 w-[420px] h-[420px] bg-brand-indigo/10 rounded-full blur-3xl" />
      <div className="absolute top-40 -left-24 w-[380px] h-[380px] bg-sky-200/40 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block text-xs font-semibold tracking-wide text-brand-indigo uppercase mb-4">
            Influencer Marketing Marketplace
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#111827] leading-[1.1] tracking-tight">
            Where brands meet{" "}
            <span className="bg-gradient-to-r from-brand-indigo to-brand-blue bg-clip-text text-transparent">
              the right creators.
            </span>
          </h1>
          <p className="mt-5 text-lg text-[#667085] max-w-xl">
            Discover verified creators, launch campaigns, receive competitive bids, manage
            collaborations and pay securely — all in one marketplace.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/find-creators">
              <Button className="h-12 px-7 bg-[#111827] hover:bg-slate-800 rounded-xl text-white font-semibold">
                Find Creators →
              </Button>
            </Link>
            <Link href="/signup?role=brand">
              <Button variant="outline" className="h-12 px-7 rounded-xl font-semibold border-slate-300 text-[#111827]">
                Join as a Brand
              </Button>
            </Link>
            <Link
              href="/signup?role=creator"
              className="text-sm font-semibold text-brand-indigo hover:text-brand-blue underline-offset-4 hover:underline"
            >
              Join as a Creator →
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg">
            {TRUST_ITEMS.map((item) => (
              <div key={item.label} className="text-xs">
                <div className="font-semibold text-[#111827]">{item.label}</div>
                <div className="text-[#667085]">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SHOWCASE.map((c, i) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.name}
                  className={`bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 p-4 transition-transform hover:-translate-y-1 sm:translate-y-0 ${i === 0 ? "sm:-translate-y-4" : i === 2 ? "sm:translate-y-4" : ""}`}
                >
                  <CreatorAvatar name={c.name} verified className="aspect-square text-2xl mb-3" />
                  <div className="flex items-center gap-1 text-sm font-semibold text-[#111827]">
                    {c.name}
                    <Icon className="w-3.5 h-3.5 text-brand-indigo" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#667085]">
                    <MapPin className="w-3 h-3" />
                    {c.niche} · {c.city}
                  </div>
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-slate-700 font-medium">{c.followers} followers</span>
                    <span className="text-brand-success font-medium">{c.engagement}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute -bottom-6 -left-4 bg-white rounded-xl shadow-xl border border-slate-100 px-4 py-3 flex items-center gap-2 animate-float-slow">
            <FileCheck2 className="w-5 h-5 text-brand-success" />
            <div>
              <div className="text-sm font-bold text-[#111827]">3 new bids</div>
              <div className="text-[10px] text-[#667085]">on Summer Beauty Campaign</div>
            </div>
          </div>

          <div className="hidden sm:flex absolute -top-6 -right-2 bg-white rounded-xl shadow-xl border border-slate-100 px-4 py-3 items-center gap-2 animate-float">
            <Wallet2 className="w-5 h-5 text-brand-indigo" />
            <div>
              <div className="text-sm font-bold text-[#111827]">Payment secured</div>
              <div className="text-[10px] text-[#667085]">held in escrow</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
