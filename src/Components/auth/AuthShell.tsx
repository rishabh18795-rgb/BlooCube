import type { ReactNode } from "react";
import { BarChart3, Gavel, Handshake } from "lucide-react";
import { CastAvatar } from "@/Components/illustrations/Scenes";
import Character from "@/Components/illustrations/Character";
import { CAST } from "@/Components/illustrations/cast";

/**
 * Presentation-only split layout shared by /login, /signup and
 * /forgot-password. Each page keeps its own form logic and API calls.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  aside = "default",
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  aside?: "default" | "signup";
}) {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-br from-brand-lavender via-white to-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <AuthVisual variant={aside} />
        <div className="flex items-center justify-center px-4 py-10 sm:px-8 lg:py-16">
          <div className="w-full max-w-md">
            <div className="mb-6 flex -space-x-3 lg:hidden" aria-hidden="true">
              <CastAvatar cast="brandManager" className="h-11 w-11" />
              <CastAvatar cast="beauty" className="h-11 w-11" />
              <CastAvatar cast="tech" className="h-11 w-11" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">{title}</h1>
            <p className="mt-2 text-slate-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthVisual({ variant }: { variant: "default" | "signup" }) {
  return (
    <div className="relative hidden overflow-hidden bg-brand-navy p-10 lg:my-6 lg:ml-6 lg:flex lg:flex-col lg:justify-between lg:rounded-[2rem]" aria-hidden="true">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-indigo/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-sky-500/25 blur-3xl" />

      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200 ring-1 ring-white/15">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" /> Influencer marketing marketplace
        </span>
        <p className="mt-6 max-w-sm text-3xl font-extrabold leading-tight text-white">
          {variant === "signup" ? "Brands and creators, one shared marketplace." : "Your next campaign or collaboration starts here."}
        </p>
      </div>

      {/* Illustrated composition: brand manager + campaign card + creators with bids */}
      <div className="relative mx-auto my-10 w-full max-w-md">
        <div className="relative rounded-2xl border border-white/10 bg-white p-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
              <Character spec={CAST.brandManager} className="h-full w-full" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-500">Sample campaign</div>
              <div className="truncate font-bold text-brand-navy">Summer Skincare Launch</div>
            </div>
            <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              Accepting bids
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {([
              ["beauty", "Creator A", 75],
              ["lifestyle", "Creator C", 85],
              ["tech", "Creator B", 100],
            ] as const).map(([cast, label, w], i) => (
              <li key={label} className="flex items-center gap-2 text-[11px]">
                <CastAvatar cast={cast} className="h-7 w-7" ring={false} />
                <span className="w-16 font-semibold text-slate-600">{label}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <span className={`block h-full rounded-full ${i === 1 ? "bg-gradient-to-r from-brand-indigo to-sky-400" : "bg-slate-300"}`} style={{ width: `${w}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </div>
        <span className="absolute -right-6 -top-8 animate-float">
          <CastAvatar cast={variant === "signup" ? "travel" : "gaming"} className="h-16 w-16 !ring-white/20" />
        </span>
        <span className="absolute -bottom-8 -left-6 animate-float-slow">
          <CastAvatar cast="fitness" className="h-14 w-14 !ring-white/20" />
        </span>
      </div>

      <ul className="relative grid grid-cols-3 gap-3 text-xs text-slate-300">
        {[
          { icon: Gavel, label: "Competitive bids" },
          { icon: Handshake, label: "Collaborations" },
          { icon: BarChart3, label: "Campaign insight" },
        ].map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
            <Icon className="h-4 w-4 text-indigo-300" /> {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const authInput =
  "h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-brand-indigo/50 focus:outline-none focus:ring-4 focus:ring-brand-indigo/10 aria-[invalid=true]:border-red-300";
export const authLabel = "mb-1.5 block text-sm font-semibold text-slate-700";
export const authSubmit =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-indigo text-sm font-semibold text-white shadow-lg shadow-brand-indigo/30 transition hover:bg-[#4a3af0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-indigo/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none";
