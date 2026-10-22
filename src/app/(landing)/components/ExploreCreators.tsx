"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Info } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import CreatorProfileCard from "@/Components/marketing/CreatorProfileCard";
import { EmptyStateIllustration } from "@/Components/illustrations/Scenes";
import { Reveal, SectionHeading, ctaSecondary } from "@/Components/marketing/primitives";

type CreatorCard = {
  _id: string;
  name: string;
  avatarUrl?: string | null;
  verified: boolean;
  niches: string[];
  location: string | null;
  followers: number;
  engagementRate: number;
  startingPrice: number;
  platforms: string[];
};

const NICHES = ["All", "Fashion", "Beauty", "Lifestyle", "Tech", "Fitness", "Food", "Travel"];

export default function ExploreCreators() {
  const [creators, setCreators] = useState<CreatorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [niche, setNiche] = useState("All");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest<{ success: boolean; data: { creators: CreatorCard[] } }>(`/api/profile/creators?limit=8`);
        if (!cancelled) setCreators(res.data.creators);
      } catch {
        if (!cancelled) setCreators([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return creators.filter((c) => {
      const matchesNiche = niche === "All" || c.niches.some((n) => n.toLowerCase() === niche.toLowerCase());
      const matchesQuery =
        !q || c.name.toLowerCase().includes(q) || (c.location || "").toLowerCase().includes(q) || c.niches.some((n) => n.toLowerCase().includes(q));
      return matchesNiche && matchesQuery;
    });
  }, [creators, search, niche]);

  return (
    <section id="find-creators" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Creator discovery"
          title="Find creators by niche, reach and price"
          description="Browse the BlooCube creator directory and compare audience size, engagement and starting rates at a glance."
          aside={
            <Link href="/find-creators" className={ctaSecondary}>
              Open full directory
            </Link>
          }
        />

        <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Filter by niche">
            {NICHES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNiche(n)}
                aria-pressed={niche === n}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-indigo/20 ${
                  niche === n ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-brand-lavender hover:text-brand-indigo"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <label className="relative w-full lg:w-80">
            <span className="sr-only">Search creators</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, niche or city"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:border-brand-indigo/40 focus:outline-none focus:ring-4 focus:ring-brand-indigo/10"
            />
          </label>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[340px] animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyStateIllustration
              cast="travel"
              title={creators.length === 0 ? "The creator directory is warming up" : "No creators match this filter yet"}
              description={
                creators.length === 0
                  ? "Creator profiles will appear here as creators join BlooCube."
                  : "Try another niche or clear your search."
              }
              action={
                <Link href="/signup?role=creator" className={ctaSecondary}>
                  Join as a Creator
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {visible.map((c, i) => (
                <Reveal key={c._id} delay={i * 0.04} className="h-full">
                  <CreatorProfileCard
                    name={c.name}
                    photoUrl={c.avatarUrl}
                    niche={c.niches[0]}
                    location={c.location}
                    followers={c.followers}
                    engagementRate={c.engagementRate}
                    startingPrice={c.startingPrice}
                    verified={c.verified}
                    href={`/find-creators?niche=${encodeURIComponent(c.niches[0] || "")}`}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>

        {!loading && creators.length > 0 && (
          <p className="mt-6 flex items-start gap-2 text-xs text-slate-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Live preview of the BlooCube directory. Some listings are demonstration accounts while the marketplace onboards
            creators. Creators without an uploaded photo are shown with an illustrated avatar.
          </p>
        )}
      </div>
    </section>
  );
}
