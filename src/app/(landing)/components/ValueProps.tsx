"use client";

import { CheckCircle2, Megaphone, Users2, MessageSquareText, Wallet2, BarChart3, Search, FileEdit, Handshake } from "lucide-react";
import Link from "next/link";
import { Button } from "@/Components/ui/Button";

const BRAND_POINTS = [
  "Post campaigns for free and receive creator applications",
  "Compare verified creators by niche, reach and engagement",
  "Keep budgets transparent with open or fixed bidding",
  "Pay only after you approve the delivered content",
];

const CREATOR_POINTS = [
  "Get discovered by brands actively looking for creators like you",
  "Apply to budgeted briefs instead of cold-pitching brands",
  "Get paid securely through escrow once content is approved",
  "Track earnings, applications and profile performance in one place",
];

function IllustrationPanel({ icons, tint }: { icons: [typeof Megaphone, typeof Megaphone, typeof Megaphone, typeof Megaphone]; tint: string }) {
  const [A, B, C, D] = icons;
  return (
    <div className={`relative h-40 rounded-xl ${tint} overflow-hidden mb-6`}>
      <div className="absolute inset-0 grid grid-cols-4 gap-3 p-5 place-items-center">
        <A className="w-7 h-7 text-white/80" />
        <B className="w-9 h-9 text-white" />
        <C className="w-7 h-7 text-white/70" />
        <D className="w-8 h-8 text-white/90" />
      </div>
      <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
      <div className="absolute -top-8 -left-4 w-20 h-20 rounded-full bg-white/10" />
    </div>
  );
}

export default function ValueProps() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-10">
        <div id="for-brands" className="scroll-mt-24 rounded-2xl border border-slate-100 shadow-sm p-8 bg-gradient-to-br from-blue-50 to-white">
          <IllustrationPanel icons={[Search, Megaphone, BarChart3, Handshake]} tint="bg-gradient-to-br from-brand-blue to-sky-600" />
          <span className="text-xs font-semibold text-brand-blue uppercase">For Brands</span>
          <h3 className="text-xl font-bold text-[#111827] mt-2">Launch campaigns with confidence</h3>
          <ul className="mt-5 space-y-3">
            {BRAND_POINTS.map((p) => (
              <li key={p} className="flex gap-2 text-sm text-[#667085]">
                <CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
          <Link href="/signup?role=brand">
            <Button className="mt-6 bg-brand-blue hover:bg-brand-blue/90 rounded-xl text-white">Join as a Brand</Button>
          </Link>
        </div>

        <div id="for-creators" className="scroll-mt-24 rounded-2xl border border-slate-100 shadow-sm p-8 bg-gradient-to-br from-indigo-50 to-white">
          <IllustrationPanel icons={[Users2, FileEdit, MessageSquareText, Wallet2]} tint="bg-gradient-to-br from-brand-indigo to-purple-600" />
          <span className="text-xs font-semibold text-brand-indigo uppercase">For Creators</span>
          <h3 className="text-xl font-bold text-[#111827] mt-2">Turn your content into income</h3>
          <ul className="mt-5 space-y-3">
            {CREATOR_POINTS.map((p) => (
              <li key={p} className="flex gap-2 text-sm text-[#667085]">
                <CheckCircle2 className="w-4 h-4 text-brand-indigo shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
          <Link href="/signup?role=creator">
            <Button variant="outline" className="mt-6 rounded-xl border-slate-300 text-[#111827]">Join as a Creator</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
