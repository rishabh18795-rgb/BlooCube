"use client";

import { useEffect, useState } from "react";
import { Clock3, IndianRupee, Users, TrendingDown, Zap } from "lucide-react";
import Character from "@/Components/illustrations/Character";
import { CAST } from "@/Components/illustrations/cast";
import { CastAvatar } from "@/Components/illustrations/Scenes";
import { DEMO_CAMPAIGN, HERO_CREATORS, formatINR } from "./demoData";
import { ProductFrame, SampleBadge } from "./primitives";

const TICKER = [
  { who: "Zoya", text: "submitted a bid", amount: 7500 },
  { who: "Kabir", text: "updated their bid", amount: 10500 },
  { who: "Riya", text: "submitted a bid", amount: 8000 },
];

/**
 * Hero product preview: one sample campaign, three sample creators and their
 * competing bids. Clicking a creator highlights their bid. All values are
 * illustrative and labelled as such.
 */
export default function MarketplaceHeroGraphic() {
  const [selected, setSelected] = useState("c");
  const [tick, setTick] = useState(0);
  const maxBid = Math.max(...HERO_CREATORS.map((c) => c.bid));
  const lowest = HERO_CREATORS.reduce((a, b) => (a.bid < b.bid ? a : b));

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setTick((v) => (v + 1) % TICKER.length), 3200);
    return () => window.clearInterval(t);
  }, []);

  const event = TICKER[tick];

  return (
    <div className="relative mx-auto w-full max-w-[600px]">
      {/* Floating cast around the dashboard (decorative, desktop only) */}
      <div className="pointer-events-none absolute -left-14 -top-12 z-20 hidden animate-float-slow lg:block" aria-hidden="true">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-1.5 pr-3 shadow-xl">
          <CastAvatar cast="brandManager" className="h-11 w-11" ring={false} />
          <div className="leading-tight">
            <div className="text-[11px] font-bold text-brand-navy">Brand manager</div>
            <div className="text-[10px] text-slate-500">reviewing bids</div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-8 top-24 z-20 hidden animate-float lg:block" aria-hidden="true">
        <div className="relative">
          <CastAvatar cast="gaming" className="h-16 w-16" />
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-navy px-2 py-0.5 text-[10px] font-bold text-white shadow">
            ₹9,200
          </span>
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-8 -right-4 z-20 hidden animate-float-slow lg:block" aria-hidden="true">
        <div className="relative">
          <CastAvatar cast="travel" className="h-14 w-14" />
          <span className="absolute -top-2 -right-6 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
            New bid
          </span>
        </div>
      </div>

      <div className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-brand-indigo/20 via-sky-300/20 to-fuchsia-300/20 blur-2xl" aria-hidden="true" />

      <ProductFrame title="Brand workspace · Campaign overview" badge={<SampleBadge />}>
        <div className="space-y-4 p-4 sm:p-5">
          {/* A. Campaign card */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-brand-lavender/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 text-sm font-extrabold text-white shadow">
                  GL
                </span>
                <div>
                  <div className="text-[11px] font-medium text-slate-500">{DEMO_CAMPAIGN.brand}</div>
                  <div className="font-bold text-brand-navy">{DEMO_CAMPAIGN.name}</div>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                {DEMO_CAMPAIGN.status}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: IndianRupee, label: "Budget", value: formatINR(DEMO_CAMPAIGN.budget) },
                { icon: Users, label: "Applications", value: String(DEMO_CAMPAIGN.applications) },
                { icon: Clock3, label: "Window", value: "4 days left" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-lg bg-white/80 px-2 py-2 ring-1 ring-slate-100">
                  <dt className="flex items-center justify-center gap-1 text-[10px] font-medium text-slate-500">
                    <Icon className="h-3 w-3" aria-hidden="true" />
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-bold text-brand-navy">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* B. Creator cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3" role="radiogroup" aria-label="Sample creators bidding on this campaign">
            {HERO_CREATORS.map((c) => {
              const active = c.id === selected;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelected(c.id)}
                  className={`group rounded-xl border p-2 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-indigo/25 sm:p-2.5 ${
                    active ? "border-brand-indigo bg-brand-lavender/60 shadow-md" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-md"
                  }`}
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg">
                    <Character spec={CAST[c.cast]} className="h-full w-full" title={`Illustrated sample creator ${c.name}`} />
                    <span className="absolute left-1 top-1 rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
                      {c.niche}
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-bold text-brand-navy sm:text-sm">{c.name}</div>
                  <div className="mt-0.5 flex flex-wrap justify-between gap-x-1 text-[10px] text-slate-500">
                    <span>{c.followers}</span>
                    <span className="font-semibold text-emerald-600">{c.engagement}</span>
                  </div>
                  <div className={`mt-1.5 rounded-md px-1.5 py-1 text-center text-[11px] font-bold ${active ? "bg-brand-indigo text-white" : "bg-slate-100 text-brand-navy"}`}>
                    {formatINR(c.bid)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* C. Bid activity */}
          <div className="rounded-xl border border-slate-200 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-navy">Bid comparison</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <TrendingDown className="h-3 w-3" aria-hidden="true" /> Lowest: {lowest.name}
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {HERO_CREATORS.map((c) => {
                const active = c.id === selected;
                return (
                  <li key={c.id} className="flex items-center gap-2 text-[11px]">
                    <span className={`w-12 shrink-0 font-semibold ${active ? "text-brand-indigo" : "text-slate-500"}`}>{c.name}</span>
                    <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
                          active ? "bg-gradient-to-r from-brand-indigo to-sky-400" : "bg-slate-300"
                        }`}
                        style={{ width: `${(c.bid / maxBid) * 100}%` }}
                      />
                    </span>
                    <span className={`w-14 shrink-0 text-right font-bold ${active ? "text-brand-navy" : "text-slate-500"}`}>{formatINR(c.bid)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600 overflow-hidden">
              <Zap className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
              <span key={tick} className="animate-tick-in truncate">
                <b className="text-brand-navy">{event.who}</b> {event.text} · {formatINR(event.amount)}
              </span>
            </div>
          </div>
        </div>
      </ProductFrame>
    </div>
  );
}
