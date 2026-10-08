import type { Metadata } from "next";
import { FileText, Users, MessageSquare, CreditCard, TrendingUp, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works",
  description: "See how BlooCube connects brands and creators — from campaign brief, to bids, to secure escrow payment.",
  alternates: { canonical: "/how-it-works" },
  openGraph: { title: "How It Works | BlooCube", description: "From campaign brief to secure escrow payment — how BlooCube works.", url: "/how-it-works" },
};

const STEPS = [
  { icon: FileText, title: "Create a Campaign", desc: "Brands define their goals, budget, deliverables and target creator profile in a guided 5-step brief." },
  { icon: Users, title: "Receive Bids", desc: "Relevant creators discover the campaign and submit proposals with their own price and timeline." },
  { icon: MessageSquare, title: "Select & Collaborate", desc: "Brands compare applications, chat directly with creators and shortlist the best fit." },
  { icon: CreditCard, title: "Secure Payment", desc: "Once a creator is selected, the agreed amount is held in escrow until the work is approved." },
  { icon: TrendingUp, title: "Track & Grow", desc: "Creators submit content, brands approve it, payment is released, and both sides can review the collaboration." },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900 text-center">How BlooCube Works</h1>
      <p className="text-slate-600 mt-3 text-center max-w-2xl mx-auto">
        A transparent, end-to-end workflow connecting brands and creators — from campaign brief to final payment.
      </p>

      <div className="mt-12 space-y-6">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="flex gap-5 items-start rounded-xl border border-slate-100 shadow-sm bg-white p-6">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                {i + 1}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-semibold text-slate-900">{s.title}</h3>
                </div>
                <p className="text-sm text-slate-600 mt-1">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-14 grid sm:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-100 p-6 bg-indigo-50/50">
          <h4 className="font-semibold text-slate-900">For Creators</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {["Build a profile with your real platform stats", "Apply to budgeted briefs — no cold DMs", "Get paid through escrow once content is approved"].map((t) => (
              <li key={t} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-100 p-6 bg-blue-50/50">
          <h4 className="font-semibold text-slate-900">For Brands</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {["Post campaigns for free", "Compare creators side-by-side before selecting", "Only release payment once you approve the content"].map((t) => (
              <li key={t} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
