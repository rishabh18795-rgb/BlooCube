import { CheckCircle2, FileText, Megaphone, Sparkles, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import Character from "./Character";
import { CAST, type CastKey } from "./cast";

/**
 * Composed illustration scenes: cast characters paired with small, real-looking
 * UI fragments. All decorative (aria-hidden) unless a caption is passed.
 */

export function CastAvatar({ cast, className = "", ring = true }: { cast: CastKey; className?: string; ring?: boolean }) {
  return (
    <span className={`inline-block overflow-hidden rounded-full ${ring ? "ring-4 ring-white shadow-lg shadow-slate-900/10" : ""} ${className}`}>
      <Character spec={CAST[cast]} className="h-full w-full" />
    </span>
  );
}

/** Brand manager launching a campaign: avatar + brief card + megaphone chip. */
export function CampaignIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-36 ${className}`} aria-hidden="true">
      <div className="absolute left-0 top-3 w-[64%] rounded-xl border border-slate-200 bg-white p-3 shadow-md">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
          <FileText className="h-3 w-3 text-brand-indigo" /> Campaign brief
        </div>
        <div className="mt-2 h-1.5 w-4/5 rounded bg-slate-200" />
        <div className="mt-1.5 h-1.5 w-3/5 rounded bg-slate-100" />
        <div className="mt-2.5 flex items-center justify-between">
          <span className="rounded-md bg-brand-lavender px-1.5 py-0.5 text-[9px] font-bold text-brand-indigo">Budget set</span>
          <span className="h-4 w-10 rounded-md bg-brand-indigo" />
        </div>
      </div>
      <CastAvatar cast="brandManager" className="absolute bottom-0 right-1 h-20 w-20" />
      <span className="absolute right-0 top-0 z-10 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-lg">
        <Megaphone className="h-4 w-4" />
      </span>
    </div>
  );
}

/** Brand manager reviewing proposals and budget on a dashboard card. */
export function BrandIllustration({ className = "", cast = "brandLead" }: { className?: string; cast?: CastKey }) {
  return (
    <div className={`relative h-36 ${className}`} aria-hidden="true">
      <div className="absolute right-0 top-1 w-[62%] rounded-xl border border-slate-200 bg-white p-3 shadow-md">
        <div className="text-[10px] font-semibold text-slate-500">Proposals</div>
        {[78, 56, 92].map((w, i) => (
          <div key={i} className="mt-1.5 flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-slate-200" />
            <span className="h-1.5 rounded-full bg-gradient-to-r from-brand-indigo to-sky-400" style={{ width: `${w}%`, opacity: i === 2 ? 1 : 0.45 }} />
          </div>
        ))}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <span className="block h-full w-3/5 rounded-full bg-emerald-400" />
        </div>
        <div className="mt-1 text-[9px] font-medium text-slate-400">Budget used</div>
      </div>
      <CastAvatar cast={cast} className="absolute bottom-0 left-0 h-20 w-20" />
    </div>
  );
}

/** Brand and creator connected by a dashed path through a deliverables card. */
export function CollaborationIllustration({
  brand = "brandLead",
  creator = "lifestyle",
  className = "",
}: {
  brand?: CastKey;
  creator?: CastKey;
  className?: string;
}) {
  return (
    <div className={`relative h-36 ${className}`} aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 144" preserveAspectRatio="none">
        <path d="M50 80 C 110 20, 190 20, 250 80" stroke="#5B4BFF" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="5 6" fill="none" />
      </svg>
      <CastAvatar cast={brand} className="absolute bottom-1 left-0 h-16 w-16" />
      <CastAvatar cast={creator} className="absolute bottom-1 right-0 h-16 w-16" />
      <div className="absolute left-1/2 top-1 w-32 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-md">
        {["Reel draft", "Stories", "Caption"].map((d, i) => (
          <div key={d} className="flex items-center gap-1.5 py-0.5 text-[10px] font-medium text-slate-600">
            <CheckCircle2 className={`h-3 w-3 ${i < 2 ? "text-emerald-500" : "text-slate-300"}`} />
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Small marketing team gathered around a chart card. */
export function TeamIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-36 ${className}`} aria-hidden="true">
      <div className="absolute inset-x-6 top-2 rounded-xl border border-slate-200 bg-white p-3 shadow-md">
        <div className="flex h-12 items-end gap-1.5">
          {[40, 65, 50, 85, 70, 95].map((h, i) => (
            <span key={i} className="flex-1 rounded-t bg-gradient-to-t from-brand-indigo to-sky-400" style={{ height: `${h}%`, opacity: 0.45 + i * 0.09 }} />
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex justify-center -space-x-3">
        <CastAvatar cast="marketer" className="h-14 w-14" />
        <CastAvatar cast="brandManager" className="h-16 w-16" />
        <CastAvatar cast="brandLead" className="h-14 w-14" />
      </div>
    </div>
  );
}

/** Friendly empty state: a cast member holding an empty tray. */
export function EmptyStateIllustration({
  title,
  description,
  cast = "marketer",
  action,
}: {
  title: string;
  description?: string;
  cast?: CastKey;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
      <div className="relative">
        <CastAvatar cast={cast} className="h-20 w-20" />
        <span className="absolute -bottom-1 -right-3 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow">
          <Inbox className="h-4 w-4" />
        </span>
        <Sparkles className="absolute -left-4 top-0 h-4 w-4 text-amber-400" aria-hidden="true" />
      </div>
      <p className="mt-5 font-semibold text-brand-navy">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
