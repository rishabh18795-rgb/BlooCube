"use client";

import { useId, useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  FileText,
  Handshake,
  Megaphone,
  RotateCcw,
  Scale,
  Search,
  Send,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import Character from "@/Components/illustrations/Character";
import { CAST } from "@/Components/illustrations/cast";
import { CastAvatar } from "@/Components/illustrations/Scenes";
import {
  DEMO_BIDDERS,
  DEMO_BID_TIMELINE,
  DEMO_CAMPAIGN,
  costPerEngagement,
  estEngagements,
  formatCompact,
  formatINR,
  type DemoCreator,
} from "./demoData";
import { SampleBadge } from "./primitives";

const STEPS = [
  { icon: Megaphone, title: "Publish", caption: "GlowLab publishes the campaign brief with a defined budget and deliverables." },
  { icon: Search, title: "Discover", caption: "Relevant creators discover the opportunity in their campaign feed." },
  { icon: Send, title: "Bid", caption: "Creators submit bids with their price and proposed deliverables." },
  { icon: Scale, title: "Compare", caption: "The brand compares bids side by side — price, reach and engagement." },
  { icon: UserCheck, title: "Select", caption: "The brand picks the creator whose proposal fits the goal and budget." },
  { icon: Handshake, title: "Collaborate", caption: "A collaboration is created to track deliverables through approval." },
];

const CAMPAIGN_STATUS = ["Draft", "Published", "Accepting bids", "Reviewing bids", "Creator selected", "Collaboration active"];

type SortKey = "bid" | "engagement" | "value";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "bid", label: "Lowest bid" },
  { key: "engagement", label: "Engagement" },
  { key: "value", label: "Est. value" },
];

const BAR_COLORS: Record<string, string> = {
  a: "from-pink-400 to-rose-400",
  b: "from-sky-400 to-blue-500",
  c: "from-violet-400 to-brand-indigo",
  d: "from-emerald-400 to-teal-500",
};

export default function BiddingVisualization() {
  const [stage, setStage] = useState(3);
  const [focusId, setFocusId] = useState("c");
  const [shortlist, setShortlist] = useState<string[]>(["a", "c"]);
  const [budget, setBudget] = useState(DEMO_CAMPAIGN.budget);
  const [sort, setSort] = useState<SortKey>("bid");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const budgetId = useId();

  const focused = DEMO_BIDDERS.find((c) => c.id === focusId)!;
  const bidsVisible = stage >= 2;
  const maxBid = Math.max(...DEMO_BIDDERS.map((c) => c.bid));
  const avgBid = DEMO_BIDDERS.reduce((s, c) => s + c.bid, 0) / DEMO_BIDDERS.length;

  const sorted = useMemo(() => {
    const list = [...DEMO_BIDDERS];
    if (sort === "bid") list.sort((a, b) => a.bid - b.bid);
    if (sort === "engagement") list.sort((a, b) => b.engagement - a.engagement);
    if (sort === "value") list.sort((a, b) => costPerEngagement(a) - costPerEngagement(b));
    return list;
  }, [sort]);

  const bestValueId = useMemo(() => [...DEMO_BIDDERS].sort((a, b) => costPerEngagement(a) - costPerEngagement(b))[0].id, []);
  const shortlisted = DEMO_BIDDERS.filter((c) => shortlist.includes(c.id));
  const committed = shortlisted.reduce((s, c) => s + c.bid, 0);
  const utilization = committed / budget;
  const overBudget = committed > budget;

  function toggleShortlist(id: string) {
    setShortlist((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function selectCreator() {
    if (!shortlist.includes(focusId)) setShortlist((s) => [...s, focusId]);
    setStage(5);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Workflow stepper */}
      <div className="lg:col-span-12">
        <ol className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 lg:grid-cols-6" aria-label="Campaign workflow">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === stage;
            const done = i < stage;
            return (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => setStage(i)}
                  aria-current={active ? "step" : undefined}
                  className={`group flex w-full min-w-0 items-center gap-1.5 rounded-xl border px-2 py-2 text-left transition sm:gap-2 sm:px-3 sm:py-2.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/40 ${
                    active
                      ? "border-indigo-400/60 bg-indigo-500/20 text-white"
                      : done
                        ? "border-white/10 bg-white/[0.06] text-indigo-100 hover:bg-white/10"
                        : "border-white/10 bg-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold sm:h-7 sm:w-7 ${
                      active ? "bg-brand-indigo text-white" : done ? "bg-emerald-400/20 text-emerald-300" : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
                  </span>
                  <span className="truncate text-[11px] font-semibold sm:text-sm">
                    <span className="sr-only">Step {i + 1}: </span>
                    {s.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 min-h-[1.5rem] text-sm text-indigo-100/80" aria-live="polite">
          <span className="font-semibold text-white">Step {stage + 1}.</span> {STEPS[stage].caption}
        </p>
      </div>

      {/* Left: illustrated composition — brand manager, brief, creators, floating bids, budget */}
      <div className="lg:col-span-5">
        <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#161D45] to-[#0E1433] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-indigo-200/80">Campaign room</span>
            <SampleBadge>Illustrative</SampleBadge>
          </div>

          <div className="relative mt-4 h-[300px]">
            {/* Connecting lines from brief to creators */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true">
              {[60, 150, 240, 330].map((x, i) => {
                const c = DEMO_BIDDERS[i];
                const lit = stage >= 1 && (c.id === focusId || shortlist.includes(c.id));
                return (
                  <path
                    key={x}
                    d={`M200 110 C 200 160, ${x} 150, ${x} 196`}
                    stroke={lit ? "#818CF8" : "#ffffff"}
                    strokeOpacity={stage >= 1 ? (lit ? 0.8 : 0.18) : 0.06}
                    strokeWidth={lit ? 2 : 1.5}
                    strokeDasharray="4 6"
                    fill="none"
                    className="transition-all duration-500"
                  />
                );
              })}
            </svg>

            {/* Brand manager + brief */}
            <div className={`absolute left-1/2 top-0 flex -translate-x-1/2 items-center gap-3 rounded-2xl border bg-white p-2.5 pr-4 shadow-xl transition ${stage === 0 ? "border-indigo-400 ring-4 ring-indigo-400/30" : "border-transparent"}`}>
              <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                <Character spec={CAST.brandManager} className="h-full w-full" title="Illustrated brand manager" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                  <FileText className="h-3 w-3 text-brand-indigo" aria-hidden="true" /> {DEMO_CAMPAIGN.brand} brief
                </div>
                <div className="truncate text-sm font-bold text-brand-navy">{DEMO_CAMPAIGN.name}</div>
                <div className="text-[11px] font-semibold text-brand-indigo">Budget {formatINR(budget)}</div>
              </div>
            </div>

            {/* Creators with floating bid cards */}
            <div className="absolute inset-x-0 bottom-0 grid grid-cols-4" role="radiogroup" aria-label="Choose a sample creator">
              {DEMO_BIDDERS.map((c) => {
                const active = c.id === focusId;
                const selectedFinal = stage === 5 && active;
                return (
                  <div key={c.id} className="flex flex-col items-center">
                    <span
                      className={`mb-2 rounded-lg px-2 py-1 text-[11px] font-bold shadow-lg transition-all duration-500 ${
                        bidsVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                      } ${active ? "bg-brand-indigo text-white" : "bg-white text-brand-navy"}`}
                      aria-hidden={!bidsVisible}
                    >
                      {formatINR(c.bid)}
                    </span>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={`${c.label} (${c.name}), bid ${formatINR(c.bid)}`}
                      onClick={() => setFocusId(c.id)}
                      className={`relative rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/60 ${
                        stage === 1 ? "animate-pulse" : ""
                      } ${active ? "scale-110" : "opacity-80 hover:opacity-100"}`}
                    >
                      <CastAvatar cast={c.cast} className={`h-14 w-14 sm:h-16 sm:w-16 ${active ? "!ring-indigo-400" : "!ring-white/20"}`} />
                      {selectedFinal && (
                        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-white shadow">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      )}
                    </button>
                    <span className={`mt-1.5 text-[11px] font-semibold ${active ? "text-white" : "text-slate-400"}`}>{c.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Budget indicator */}
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between">
              <label htmlFor={budgetId} className="text-xs font-semibold text-indigo-100">
                Campaign budget
              </label>
              <span className="text-sm font-bold text-white">{formatINR(budget)}</span>
            </div>
            <input
              id={budgetId}
              type="range"
              min={15000}
              max={80000}
              step={2500}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="mt-3 w-full accent-indigo-400"
              aria-valuetext={formatINR(budget)}
            />
            <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              {shortlisted.map((c) => (
                <span
                  key={c.id}
                  className={`h-full bg-gradient-to-r ${BAR_COLORS[c.id]} border-r border-[#0E1433] transition-all duration-500`}
                  style={{ width: `${Math.min(100, (c.bid / budget) * 100)}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-300">
                Shortlisted bids <b className="text-white">{formatINR(committed)}</b> · {Math.round(utilization * 100)}% of budget
              </span>
              {overBudget ? (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Over by {formatINR(committed - budget)}
                </span>
              ) : (
                <span className="font-semibold text-emerald-300">{formatINR(budget - committed)} remaining</span>
              )}
            </div>
          </div>

          {/* Campaign status indicator */}
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-100">Campaign status</span>
              <span className="rounded-full bg-indigo-400/20 px-2 py-0.5 font-semibold text-indigo-100">{CAMPAIGN_STATUS[stage]}</span>
            </div>
            <ol className="mt-3 flex items-center gap-1" aria-label="Campaign status progress">
              {CAMPAIGN_STATUS.map((label, i) => (
                <li key={label} className="flex-1" title={label}>
                  <span className={`block h-1.5 rounded-full transition-colors duration-500 ${i <= stage ? "bg-gradient-to-r from-indigo-400 to-sky-400" : "bg-white/10"}`} />
                  <span className="sr-only">
                    {label}
                    {i <= stage ? " (reached)" : ""}
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-300">
              <span className="flex -space-x-2">
                {shortlisted.map((c) => (
                  <CastAvatar key={c.id} cast={c.cast} className="h-6 w-6 !ring-2 !ring-[#0E1433]" />
                ))}
              </span>
              {shortlisted.length ? `${shortlisted.length} shortlisted` : "No creators shortlisted yet"}
            </div>
          </div>
        </div>
      </div>

      {/* Right: dashboard */}
      <div className="space-y-6 lg:col-span-7">
        <div className={`rounded-2xl border bg-[#121838] p-5 transition ${stage === 3 ? "border-indigo-400/60 ring-4 ring-indigo-400/20" : "border-white/10"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white">Creator bid comparison</h3>
              <p className="text-xs text-slate-400">
                {DEMO_CAMPAIGN.applications} applications · status{" "}
                <span className="font-semibold text-indigo-200">{CAMPAIGN_STATUS[stage]}</span>
              </p>
            </div>
            <div className="flex rounded-lg bg-white/[0.06] p-1" role="group" aria-label="Sort bids">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSort(s.key)}
                  aria-pressed={sort === s.key}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                    sort === s.key ? "bg-white text-brand-navy" : "text-slate-300 hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <ul className="relative mt-5 space-y-3">
            {/* average-bid marker */}
            {bidsVisible && (
              <span
                className="pointer-events-none absolute -bottom-2 -top-2 z-0 hidden border-l border-dashed border-amber-300/50 sm:block"
                style={{ left: `calc(7.75rem + (100% - 13.5rem) * ${avgBid / maxBid})` }}
                aria-hidden="true"
              >
                <span className="absolute -top-4 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold text-amber-300">avg {formatINR(avgBid)}</span>
              </span>
            )}
            {sorted.map((c, i) => (
              <BidRow
                key={c.id}
                c={c}
                rank={i}
                visible={bidsVisible}
                maxBid={maxBid}
                active={c.id === focusId}
                hovered={hoverId === c.id}
                bestValue={c.id === bestValueId}
                onFocus={() => setFocusId(c.id)}
                onHover={setHoverId}
              />
            ))}
          </ul>
          {!bidsVisible && <p className="mt-4 text-center text-xs text-slate-400">Bids appear once creators start submitting (step 3).</p>}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <BidTimeline shortlist={shortlist} focusId={focusId} visible={bidsVisible} />
          <SelectedSummary
            c={focused}
            stage={stage}
            shortlisted={shortlist.includes(focused.id)}
            onToggleShortlist={() => toggleShortlist(focused.id)}
            onSelect={selectCreator}
            onReset={() => setStage(3)}
          />
        </div>
      </div>
    </div>
  );
}

function BidRow({
  c,
  rank,
  visible,
  maxBid,
  active,
  hovered,
  bestValue,
  onFocus,
  onHover,
}: {
  c: DemoCreator;
  rank: number;
  visible: boolean;
  maxBid: number;
  active: boolean;
  hovered: boolean;
  bestValue: boolean;
  onFocus: () => void;
  onHover: (id: string | null) => void;
}) {
  const pct = visible ? (c.bid / maxBid) * 100 : 0;
  return (
    <li className="relative z-10">
      <button
        type="button"
        onClick={onFocus}
        onMouseEnter={() => onHover(c.id)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(c.id)}
        onBlur={() => onHover(null)}
        aria-pressed={active}
        aria-label={`${c.label} ${c.name}: bid ${formatINR(c.bid)}, ${formatCompact(c.followers)} followers, ${c.engagement}% engagement`}
        className={`flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
          active ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
        }`}
      >
        <span className="flex w-[6.5rem] shrink-0 items-center gap-2">
          <CastAvatar cast={c.cast} className="h-8 w-8" ring={false} />
          <span className="leading-tight">
            <span className={`block text-xs font-semibold ${active ? "text-white" : "text-slate-300"}`}>{c.label}</span>
            <span className="block text-[10px] text-slate-500">{c.niche}</span>
          </span>
        </span>
        <span className="relative h-7 flex-1 overflow-hidden rounded-lg bg-white/[0.05]">
          <span
            className={`absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r ${BAR_COLORS[c.id]} transition-[width] duration-700 ease-out ${active ? "" : "opacity-60"}`}
            style={{ width: `${pct}%`, transitionDelay: `${rank * 80}ms` }}
          />
          {bestValue && visible && (
            <span className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 rounded bg-emerald-400/90 sm:inline px-1.5 py-0.5 text-[9px] font-bold text-emerald-950">
              Best est. value
            </span>
          )}
        </span>
        <span className={`w-[4.5rem] shrink-0 text-right text-sm font-bold ${active ? "text-white" : "text-slate-300"}`}>
          {visible ? formatINR(c.bid) : "—"}
        </span>
      </button>

      {hovered && visible && (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-[7.5rem] top-full z-30 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-2xl"
        >
          <div className="font-bold text-brand-navy">
            {c.label} · {c.name}
          </div>
          <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
            <dt>Bid</dt>
            <dd className="text-right font-semibold text-brand-navy">{formatINR(c.bid)}</dd>
            <dt>Followers</dt>
            <dd className="text-right font-semibold text-brand-navy">{formatCompact(c.followers)}</dd>
            <dt>Engagement</dt>
            <dd className="text-right font-semibold text-emerald-600">{c.engagement}%</dd>
            <dt>Est. cost / engagement</dt>
            <dd className="text-right font-semibold text-brand-navy">₹{costPerEngagement(c).toFixed(2)}</dd>
          </dl>
        </div>
      )}
    </li>
  );
}

function BidTimeline({ shortlist, focusId, visible }: { shortlist: string[]; focusId: string; visible: boolean }) {
  const W = 300;
  const H = 130;
  const pad = { l: 24, r: 10, t: 12, b: 22 };
  const max = DEMO_BID_TIMELINE[DEMO_BID_TIMELINE.length - 1];
  const x = (i: number) => pad.l + (i / (DEMO_BID_TIMELINE.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => H - pad.b - (v / max) * (H - pad.t - pad.b);
  const pts = DEMO_BID_TIMELINE.map((v, i) => `${x(i)},${y(v)}`);
  const line = `M${pts.join(" L")}`;
  const area = `${line} L${x(DEMO_BID_TIMELINE.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`;
  const gid = "bt" + useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <figure className="rounded-2xl border border-white/10 bg-[#121838] p-5">
      <figcaption className="flex items-center justify-between">
        <span className="text-sm font-bold text-white">Bid activity over time</span>
        <span className="text-[10px] text-slate-400">applications, cumulative</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={`Cumulative applications by day: ${DEMO_BID_TIMELINE.join(", ")}`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#818CF8" stopOpacity="0.45" />
            <stop offset="1" stopColor="#818CF8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 12, 24].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#fff" strokeOpacity="0.07" />
            <text x={pad.l - 6} y={y(v) + 3} textAnchor="end" fontSize="8" fill="#94A3B8">
              {v}
            </text>
          </g>
        ))}
        {DEMO_BID_TIMELINE.map((_, i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="#94A3B8">
            Day {i + 1}
          </text>
        ))}
        <path d={area} fill={`url(#${gid})`} className="transition-opacity duration-700" opacity={visible ? 1 : 0} />
        <path
          d={line}
          fill="none"
          stroke="#A5B4FC"
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={visible ? 0 : 1}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
        {visible &&
          DEMO_BIDDERS.map((c) => {
            const i = c.submittedDay - 1;
            const on = shortlist.includes(c.id) || c.id === focusId;
            return (
              <g key={c.id}>
                <circle cx={x(i)} cy={y(DEMO_BID_TIMELINE[i])} r={c.id === focusId ? 6 : 4.5} fill={on ? "#fff" : "#475569"} stroke="#5B4BFF" strokeWidth="2">
                  <title>{`${c.label} bid ${formatINR(c.bid)} on day ${c.submittedDay}`}</title>
                </circle>
              </g>
            );
          })}
      </svg>
      <p className="mt-2 text-[11px] text-slate-400">Dots mark when each compared creator submitted a bid.</p>
    </figure>
  );
}

function SelectedSummary({
  c,
  stage,
  shortlisted,
  onToggleShortlist,
  onSelect,
  onReset,
}: {
  c: DemoCreator;
  stage: number;
  shortlisted: boolean;
  onToggleShortlist: () => void;
  onSelect: () => void;
  onReset: () => void;
}) {
  if (stage === 5) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500/15 to-[#121838] p-5">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
          <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Collaboration created
        </div>
        <div className="mt-4 flex items-center justify-center gap-3">
          <CastAvatar cast="brandManager" className="h-14 w-14" />
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
            <Handshake className="h-4 w-4" aria-hidden="true" />
          </span>
          <CastAvatar cast={c.cast} className="h-14 w-14" />
        </div>
        <p className="mt-4 text-center text-sm text-slate-200">
          <b className="text-white">{DEMO_CAMPAIGN.brand}</b> × <b className="text-white">{c.label}</b> · {formatINR(c.bid)}
        </p>
        <ul className="mt-3 space-y-1 text-xs text-slate-300">
          {c.deliverables.map((d) => (
            <li key={d} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> {d}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onReset}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Compare again
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border bg-[#121838] p-5 transition ${stage === 4 ? "border-indigo-400/60 ring-4 ring-indigo-400/20" : "border-white/10"}`}>
      <div className="flex items-center gap-3">
        <CastAvatar cast={c.cast} className="h-12 w-12" ring={false} />
        <div>
          <div className="font-bold text-white">
            {c.label} <span className="font-medium text-slate-400">· {c.name}</span>
          </div>
          <div className="text-xs text-slate-400">
            {c.niche} · {c.city}
          </div>
        </div>
        <span className="ml-auto text-lg font-extrabold text-white">{formatINR(c.bid)}</span>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-white/[0.05] p-2">
          <dt className="text-[10px] text-slate-400">Followers</dt>
          <dd className="text-sm font-bold text-white">{formatCompact(c.followers)}</dd>
        </div>
        <div className="rounded-lg bg-white/[0.05] p-2">
          <dt className="text-[10px] text-slate-400">Engagement</dt>
          <dd className="text-sm font-bold text-emerald-300">{c.engagement}%</dd>
        </div>
        <div className="rounded-lg bg-white/[0.05] p-2">
          <dt className="text-[10px] text-slate-400">Est. engagements</dt>
          <dd className="text-sm font-bold text-white">~{formatCompact(estEngagements(c))}</dd>
        </div>
      </dl>
      <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Proposed deliverables</div>
      <ul className="mt-1.5 space-y-1 text-xs text-slate-200">
        {c.deliverables.map((d) => (
          <li key={d} className="flex items-center gap-2">
            <Check className="h-3 w-3 text-indigo-300" aria-hidden="true" /> {d}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onToggleShortlist}
          aria-pressed={shortlisted}
          className="flex-1 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          {shortlisted ? "Shortlisted ✓" : "Add to shortlist"}
        </button>
        <button
          type="button"
          onClick={onSelect}
          className="flex-1 rounded-lg bg-brand-indigo px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#4a3af0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
        >
          Select creator
        </button>
      </div>
      <p className="mt-2 text-[10px] text-slate-500">Estimates use follower count × engagement rate; sample values only.</p>
    </div>
  );
}
