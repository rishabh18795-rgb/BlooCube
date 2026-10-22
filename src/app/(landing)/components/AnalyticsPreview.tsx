"use client";

import { useId, useMemo, useState } from "react";
import { CheckCircle2, CircleDashed, Eye, IndianRupee, ListChecks, Wallet } from "lucide-react";
import { CastAvatar, TeamIllustration } from "@/Components/illustrations/Scenes";
import { DEMO_ANALYTICS, formatCompact, formatINR } from "@/Components/marketing/demoData";
import { ProductFrame, Reveal, SampleBadge, SectionHeading } from "@/Components/marketing/primitives";

const BUCKETS = [
  { label: "<₹6K", min: 0, max: 6000 },
  { label: "₹6–8K", min: 6000, max: 8000 },
  { label: "₹8–10K", min: 8000, max: 10000 },
  { label: "₹10–13K", min: 10000, max: 13000 },
  { label: "₹13K+", min: 13000, max: Infinity },
];

const STATE_STYLES = {
  Approved: { cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", bar: "bg-emerald-500", icon: CheckCircle2 },
  "In review": { cls: "bg-amber-50 text-amber-700 ring-amber-200", bar: "bg-amber-400", icon: Eye },
  "In progress": { cls: "bg-sky-50 text-sky-700 ring-sky-200", bar: "bg-sky-500", icon: CircleDashed },
} as const;

export default function AnalyticsPreview() {
  const [campaignId, setCampaignId] = useState(DEMO_ANALYTICS[0].id);
  const [hoverBucket, setHoverBucket] = useState<number | null>(null);
  const c = DEMO_ANALYTICS.find((x) => x.id === campaignId)!;
  const gid = "ap" + useId().replace(/[^a-zA-Z0-9]/g, "");

  const buckets = useMemo(() => BUCKETS.map((b) => c.bids.filter((v) => v >= b.min && v < b.max).length), [c]);
  const maxBucket = Math.max(1, ...buckets);
  const doneTotal = c.deliverables.reduce((s, d) => s + d.done, 0);
  const allTotal = c.deliverables.reduce((s, d) => s + d.total, 0);
  const utilization = c.committed / c.budget;

  // Donut geometry
  const R = 42;
  const C = 2 * Math.PI * R;

  // Trend chart geometry
  const W = 280;
  const H = 96;
  const tMax = Math.max(...c.engagementTrend) * 1.15;
  const tx = (i: number) => 8 + (i / (c.engagementTrend.length - 1)) * (W - 16);
  const ty = (v: number) => H - 14 - (v / tMax) * (H - 24);
  const tLine = "M" + c.engagementTrend.map((v, i) => `${tx(i)},${ty(v)}`).join(" L");

  return (
    <section id="analytics" className="scroll-mt-20 bg-gradient-to-b from-slate-50 to-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Campaign analytics"
          title="See budget, bids and deliverables in one view"
          description="A preview of the campaign analytics experience. Switch between sample campaigns to see how the dashboard responds."
          aside={<TeamIllustration className="hidden w-64 md:block" />}
        />

        <Reveal className="mt-10">
          <ProductFrame title="Brand analytics · Campaign performance" badge={<SampleBadge>Demonstration dashboard</SampleBadge>}>
            <div className="p-4 sm:p-6">
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label="Sample campaigns">
                {DEMO_ANALYTICS.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    role="tab"
                    aria-selected={x.id === campaignId}
                    onClick={() => setCampaignId(x.id)}
                    className={`shrink-0 rounded-xl border px-4 py-2 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-indigo/20 ${
                      x.id === campaignId ? "border-brand-indigo bg-brand-lavender" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-[11px] font-medium text-slate-500">{x.brand}</span>
                    <span className="block text-sm font-bold text-brand-navy">{x.name}</span>
                  </button>
                ))}
              </div>

              {/* Metric cards */}
              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { icon: Wallet, label: "Campaign budget", value: formatINR(c.budget), note: "set by brand" },
                  { icon: IndianRupee, label: "Committed to creators", value: formatINR(c.committed), note: `${Math.round(utilization * 100)}% of budget` },
                  { icon: ListChecks, label: "Deliverables approved", value: `${c.deliverables.reduce((s, d) => s + (d.state === "Approved" ? d.done : 0), 0)} / ${allTotal}`, note: `${doneTotal} submitted` },
                  { icon: Eye, label: "Est. reach", value: `~${formatCompact(c.estReach)}`, note: "estimate, not measured" },
                ].map(({ icon: Icon, label, value, note }) => (
                  <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-lavender text-brand-indigo">
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      {label}
                    </div>
                    <div className="mt-2 text-xl font-extrabold text-brand-navy sm:text-2xl">{value}</div>
                    <div className="text-[11px] text-slate-400">{note}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {/* Budget allocation donut */}
                <figure className="rounded-xl border border-slate-200 p-4">
                  <figcaption className="text-sm font-bold text-brand-navy">Budget allocation</figcaption>
                  <div className="mt-3 flex items-center gap-5">
                    <svg viewBox="0 0 110 110" className="h-32 w-32 shrink-0 -rotate-90" role="img" aria-label={`${Math.round(utilization * 100)}% of budget committed`}>
                      <circle cx="55" cy="55" r={R} fill="none" stroke="#EEF0FF" strokeWidth="14" />
                      <circle
                        cx="55"
                        cy="55"
                        r={R}
                        fill="none"
                        stroke="#5B4BFF"
                        strokeWidth="14"
                        strokeLinecap="round"
                        strokeDasharray={`${C * utilization} ${C}`}
                        style={{ transition: "stroke-dasharray 0.8s ease-out" }}
                      />
                    </svg>
                    <ul className="space-y-2 text-xs">
                      <li className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-brand-indigo" /> Committed
                        <b className="ml-auto pl-2 text-brand-navy">{formatINR(c.committed)}</b>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-brand-lavender-deep" /> Unallocated
                        <b className="ml-auto pl-2 text-brand-navy">{formatINR(c.budget - c.committed)}</b>
                      </li>
                      <li className="pt-1 text-2xl font-extrabold text-brand-navy">{Math.round(utilization * 100)}%</li>
                    </ul>
                  </div>
                </figure>

                {/* Bid distribution */}
                <figure className="rounded-xl border border-slate-200 p-4">
                  <figcaption className="flex items-center justify-between text-sm font-bold text-brand-navy">
                    Creator bid distribution
                    <span className="text-[11px] font-medium text-slate-400">{c.bids.length} bids</span>
                  </figcaption>
                  <div className="mt-4 flex h-32 items-end gap-2" role="list">
                    {buckets.map((n, i) => (
                      <div
                        key={BUCKETS[i].label}
                        role="listitem"
                        tabIndex={0}
                        aria-label={`${BUCKETS[i].label}: ${n} bids`}
                        onMouseEnter={() => setHoverBucket(i)}
                        onMouseLeave={() => setHoverBucket(null)}
                        onFocus={() => setHoverBucket(i)}
                        onBlur={() => setHoverBucket(null)}
                        className="relative flex h-full flex-1 flex-col justify-end rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo"
                      >
                        {hoverBucket === i && (
                          <span className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-brand-navy px-2 py-1 text-[10px] font-semibold text-white">
                            {n} bid{n === 1 ? "" : "s"}
                          </span>
                        )}
                        <span
                          className={`block w-full rounded-t-md transition-all duration-500 ${hoverBucket === i ? "bg-brand-indigo" : "bg-gradient-to-t from-brand-indigo/70 to-sky-400/70"}`}
                          style={{ height: `${Math.max(4, (n / maxBucket) * 100)}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-1.5 flex gap-2">
                    {BUCKETS.map((b) => (
                      <span key={b.label} className="flex-1 text-center text-[9px] font-medium text-slate-400">
                        {b.label}
                      </span>
                    ))}
                  </div>
                </figure>

                {/* Status pipeline */}
                <figure className="rounded-xl border border-slate-200 p-4">
                  <figcaption className="text-sm font-bold text-brand-navy">Campaign status</figcaption>
                  <ul className="mt-4 space-y-2.5">
                    {c.status.map((s) => (
                      <li key={s.label} className="flex items-center gap-3 text-xs">
                        <span className="w-20 shrink-0 font-medium text-slate-500">{s.label}</span>
                        <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <span
                            className="block h-full rounded-full bg-gradient-to-r from-brand-indigo to-brand-blue transition-all duration-700"
                            style={{ width: `${(s.count / c.status[0].count) * 100}%` }}
                          />
                        </span>
                        <b className="w-6 text-right text-brand-navy">{s.count}</b>
                      </li>
                    ))}
                  </ul>
                </figure>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-5">
                {/* Deliverables */}
                <figure className="rounded-xl border border-slate-200 p-4 lg:col-span-3">
                  <figcaption className="text-sm font-bold text-brand-navy">Deliverable completion</figcaption>
                  <ul className="mt-3 divide-y divide-slate-100">
                    {c.deliverables.map((d) => {
                      const st = STATE_STYLES[d.state];
                      const Icon = st.icon;
                      return (
                        <li key={d.creator} className="flex items-center gap-3 py-2.5">
                          <CastAvatar cast={d.cast} className="h-9 w-9" ring={false} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-brand-navy">{d.creator}</span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${st.cls}`}>
                                <Icon className="h-3 w-3" aria-hidden="true" /> {d.state}
                              </span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <span className={`block h-full rounded-full ${st.bar} transition-all duration-700`} style={{ width: `${(d.done / d.total) * 100}%` }} />
                              </span>
                              <span className="text-[11px] font-medium text-slate-500">
                                {d.done}/{d.total}
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </figure>

                {/* Engagement trend */}
                <figure className="rounded-xl border border-slate-200 p-4 lg:col-span-2">
                  <figcaption className="flex items-center justify-between text-sm font-bold text-brand-navy">
                    Engagement trend
                    <span className="text-[10px] font-medium text-slate-400">est., thousands / week</span>
                  </figcaption>
                  <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={`Estimated weekly engagements: ${c.engagementTrend.join(", ")} thousand`}>
                    <defs>
                      <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#5B4BFF" stopOpacity="0.25" />
                        <stop offset="1" stopColor="#5B4BFF" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={`${tLine} L${tx(c.engagementTrend.length - 1)},${H - 14} L${tx(0)},${H - 14} Z`} fill={`url(#${gid})`} />
                    <path d={tLine} fill="none" stroke="#5B4BFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {c.engagementTrend.map((v, i) => (
                      <g key={i}>
                        <circle cx={tx(i)} cy={ty(v)} r="3.5" fill="#fff" stroke="#5B4BFF" strokeWidth="2">
                          <title>{`Week ${i + 1}: ~${v}K engagements (estimate)`}</title>
                        </circle>
                        <text x={tx(i)} y={H - 2} textAnchor="middle" fontSize="8" fill="#94A3B8">
                          W{i + 1}
                        </text>
                      </g>
                    ))}
                  </svg>
                </figure>
              </div>
            </div>
          </ProductFrame>
        </Reveal>
        <p className="mt-4 text-xs text-slate-500">
          All figures above are illustrative sample values for a demonstration dashboard. They are not BlooCube customer results.
        </p>
      </div>
    </section>
  );
}
