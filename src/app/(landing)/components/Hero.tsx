import Link from "next/link";
import { ArrowRight, BarChart3, Scale, Search } from "lucide-react";
import MarketplaceHeroGraphic from "@/Components/marketing/MarketplaceHeroGraphic";
import { ctaPrimary, ctaSecondary, Eyebrow } from "@/Components/marketing/primitives";

const PROOF_POINTS = [
  { icon: Search, label: "Discover relevant creators" },
  { icon: Scale, label: "Compare creator bids" },
  { icon: BarChart3, label: "Track campaign performance" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-lavender via-white to-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:linear-gradient(to_right,rgba(91,75,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(91,75,255,0.07)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand-indigo/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-32 top-64 h-[360px] w-[360px] rounded-full bg-sky-300/30 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-12 sm:px-6 sm:pt-16 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10 lg:pb-28">
        <div className="max-w-xl">
          <Eyebrow>Influencer marketing marketplace</Eyebrow>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-brand-navy sm:text-5xl lg:text-[3.6rem]">
            Where Brands Meet Their{" "}
            <span className="bg-gradient-to-r from-brand-indigo via-violet-500 to-brand-blue bg-clip-text text-transparent">
              Next Great Creators
            </span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Discover creators, launch campaigns, compare competitive bids, and manage collaborations through one
            intelligent marketplace.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup?role=brand" className={ctaPrimary}>
              Launch a Campaign <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/find-creators" className={ctaSecondary}>
              Explore Creators
            </Link>
          </div>

          <ul className="mt-10 grid gap-3 sm:grid-cols-3">
            {PROOF_POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2.5 text-sm font-semibold text-slate-700 backdrop-blur">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-lavender text-brand-indigo">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <MarketplaceHeroGraphic />
      </div>
    </section>
  );
}
