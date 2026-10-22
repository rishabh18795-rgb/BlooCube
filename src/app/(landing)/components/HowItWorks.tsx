"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Sparkles } from "lucide-react";
import Character from "@/Components/illustrations/Character";
import { CAST } from "@/Components/illustrations/cast";
import {
  BrandIllustration,
  CampaignIllustration,
  CastAvatar,
  CollaborationIllustration,
} from "@/Components/illustrations/Scenes";
import { Reveal, SectionHeading } from "@/Components/marketing/primitives";

type Audience = "brands" | "creators";

function BidsScene() {
  return (
    <div className="relative h-36" aria-hidden="true">
      <div className="absolute inset-x-0 bottom-1 flex justify-center gap-3">
        {(["beauty", "tech", "fitness"] as const).map((k, i) => (
          <div key={k} className="flex flex-col items-center">
            <span className={`mb-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold shadow ${i === 1 ? "bg-brand-indigo text-white" : "bg-white text-brand-navy"}`}>
              {["₹7.5K", "₹9K", "₹12K"][i]}
            </span>
            <CastAvatar cast={k} className="h-14 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileScene() {
  return (
    <div className="relative h-36" aria-hidden="true">
      <div className="absolute left-1/2 top-1 w-44 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="h-10 w-10 overflow-hidden rounded-lg">
            <Character spec={CAST.travel} className="h-full w-full" />
          </span>
          <div className="space-y-1">
            <span className="block h-1.5 w-16 rounded bg-slate-300" />
            <span className="block h-1.5 w-10 rounded bg-slate-200" />
          </div>
        </div>
        <div className="mt-3 flex gap-1">
          {["Travel", "Food", "Reels"].map((t) => (
            <span key={t} className="rounded bg-brand-lavender px-1.5 py-0.5 text-[9px] font-semibold text-brand-indigo">
              {t}
            </span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[9px] text-slate-500">
          <span><b className="block text-[11px] text-brand-navy">96K</b>followers</span>
          <span><b className="block text-[11px] text-emerald-600">5.4%</b>eng.</span>
          <span><b className="block text-[11px] text-brand-navy">₹9K</b>from</span>
        </div>
      </div>
    </div>
  );
}

function FeedScene() {
  return (
    <div className="relative h-36" aria-hidden="true">
      <div className="absolute inset-x-4 top-1 space-y-2">
        {[
          { b: "GL", c: "from-pink-400 to-rose-500", t: "Skincare launch", p: "₹50K" },
          { b: "SC", c: "from-emerald-400 to-teal-500", t: "Run club series", p: "₹80K" },
        ].map((r) => (
          <div key={r.b} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${r.c} text-[9px] font-bold text-white`}>{r.b}</span>
            <span className="text-[11px] font-semibold text-brand-navy">{r.t}</span>
            <span className="ml-auto rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">{r.p}</span>
          </div>
        ))}
      </div>
      <CastAvatar cast="gaming" className="absolute bottom-0 right-2 h-14 w-14" />
    </div>
  );
}

function SubmitScene() {
  return (
    <div className="relative h-36" aria-hidden="true">
      <div className="absolute left-0 top-2 w-[60%] rounded-xl border border-slate-200 bg-white p-3 shadow-md">
        <div className="text-[10px] font-semibold text-slate-500">Your bid</div>
        <div className="mt-1 text-lg font-extrabold text-brand-navy">₹8,500</div>
        <div className="mt-1 h-1.5 w-4/5 rounded bg-slate-200" />
        <div className="mt-2 h-5 w-20 rounded-md bg-brand-indigo" />
      </div>
      <CastAvatar cast="lifestyle" className="absolute bottom-0 right-0 h-20 w-20" />
    </div>
  );
}

const JOURNEYS: Record<Audience, { title: string; desc: string; scene: React.ReactNode }[]> = {
  brands: [
    { title: "Create a campaign", desc: "Set your goal, budget, niche and deliverables in a guided brief.", scene: <CampaignIllustration /> },
    { title: "Discover creators & receive bids", desc: "Relevant creators find your brief and propose their price.", scene: <BidsScene /> },
    { title: "Compare proposals & select", desc: "Weigh bids against reach, engagement and fit — then choose.", scene: <BrandIllustration /> },
    { title: "Track collaborations", desc: "Follow every deliverable from draft to approval in one place.", scene: <CollaborationIllustration /> },
  ],
  creators: [
    { title: "Build a professional profile", desc: "Show your niches, audience, rates and best work.", scene: <ProfileScene /> },
    { title: "Discover relevant campaigns", desc: "Browse budgeted briefs that match your niche.", scene: <FeedScene /> },
    { title: "Submit competitive bids", desc: "Propose your price and deliverables — no cold pitching.", scene: <SubmitScene /> },
    { title: "Deliver & manage collaborations", desc: "Submit deliverables and track approvals and payouts.", scene: <CollaborationIllustration brand="brandManager" creator="travel" /> },
  ],
};

export default function HowItWorks() {
  const [audience, setAudience] = useState<Audience>("brands");
  const steps = JOURNEYS[audience];

  return (
    <section id="how-it-works" className="scroll-mt-20 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="How BlooCube works"
          title="From campaign brief to creator collaboration"
          description="Two connected journeys on one marketplace. Pick a side to follow the story."
          aside={
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label="Choose a journey">
              {([
                { key: "brands", label: "For Brands", icon: Building2 },
                { key: "creators", label: "For Creators", icon: Sparkles },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`journey-tab-${key}`}
                  aria-selected={audience === key}
                  aria-controls="journey-panel"
                  onClick={() => setAudience(key)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-indigo/20 ${
                    audience === key ? "bg-white text-brand-navy shadow" : "text-slate-500 hover:text-brand-navy"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          }
        />

        <div id="journey-panel" role="tabpanel" aria-labelledby={`journey-tab-${audience}`} className="relative mt-12">
          <div
            className="pointer-events-none absolute left-[12%] right-[12%] top-[4.5rem] hidden h-px bg-gradient-to-r from-transparent via-brand-indigo/40 to-transparent lg:block"
            aria-hidden="true"
          />
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal
                as="li"
                key={`${audience}-${s.title}`}
                delay={i * 0.08}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-brand-lavender/50 to-white p-5 transition hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(91,75,255,0.5)]"
              >
                  <span className="absolute bottom-3 right-4 text-5xl font-extrabold text-brand-indigo/10" aria-hidden="true">0{i + 1}</span>
                  <div className="rounded-xl bg-white/60 p-2 ring-1 ring-slate-100">{s.scene}</div>
                  <div className="mt-5 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-indigo text-[11px] font-bold text-white">{i + 1}</span>
                    <h3 className="font-bold text-brand-navy">{s.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
              </Reveal>
            ))}
          </ol>
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href={audience === "brands" ? "/signup?role=brand" : "/signup?role=creator"}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-indigo hover:text-brand-blue"
          >
            {audience === "brands" ? "Start as a brand" : "Start as a creator"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
