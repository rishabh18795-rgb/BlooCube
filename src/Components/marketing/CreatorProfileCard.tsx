import Link from "next/link";
import { ArrowUpRight, BadgeCheck, MapPin } from "lucide-react";
import CreatorAvatar from "@/Components/CreatorAvatar";
import type { CharacterSpec } from "@/Components/illustrations/Character";
import { formatCompact, formatINR } from "./demoData";

export interface CreatorProfileCardProps {
  name: string;
  niche?: string | null;
  location?: string | null;
  followers?: number | null;
  engagementRate?: number | null;
  startingPrice?: number | null;
  photoUrl?: string | null;
  character?: CharacterSpec;
  /** Only pass true for creators BlooCube has actually verified. */
  verified?: boolean;
  href: string;
  ctaLabel?: string;
}

/** Avatar-led creator card with niche badge and metrics; equal height in any grid. */
export default function CreatorProfileCard({
  name,
  niche,
  location,
  followers,
  engagementRate,
  startingPrice,
  photoUrl,
  character,
  verified,
  href,
  ctaLabel = "View profile",
}: CreatorProfileCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-indigo/30 hover:shadow-[0_20px_40px_-20px_rgba(91,75,255,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-indigo/25"
    >
      <div className="relative">
        <CreatorAvatar
          name={name}
          photoUrl={photoUrl}
          niche={niche}
          character={character}
          className="aspect-[4/3.4] w-full"
          rounded="rounded-none"
          sizes="(min-width:1024px) 280px, 50vw"
        />
        {niche && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-navy shadow-sm backdrop-blur">
            {niche}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-bold text-brand-navy">{name}</span>
          {verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand-indigo" aria-label="Verified creator" />}
        </div>
        {location && (
          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3 w-3" aria-hidden="true" /> {location}
          </div>
        )}
        <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-center">
          <div>
            <dt className="text-[10px] font-medium text-slate-500">Followers</dt>
            <dd className="text-sm font-bold text-brand-navy">{followers ? formatCompact(followers) : "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-medium text-slate-500">Engagement</dt>
            <dd className="text-sm font-bold text-emerald-600">{engagementRate ? `${engagementRate}%` : "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-medium text-slate-500">From</dt>
            <dd className="text-sm font-bold text-brand-navy">{startingPrice ? formatINR(startingPrice) : "—"}</dd>
          </div>
        </dl>
        <span className="mt-auto inline-flex items-center justify-center gap-1 pt-4 text-sm font-semibold text-brand-indigo">
          {ctaLabel}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
