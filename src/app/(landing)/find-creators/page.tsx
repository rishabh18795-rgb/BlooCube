"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import CreatorAvatar from "@/Components/CreatorAvatar";
import { Badge } from "@/Components/ui/Badge";

type CreatorCard = {
  _id: string;
  name: string;
  verified: boolean;
  niches: string[];
  location: string | null;
  followers: number;
  engagementRate: number;
  startingPrice: number;
  platforms: string[];
};

const NICHES = ["All", "Fashion", "Beauty", "Lifestyle", "Tech", "Fitness", "Food", "Travel"];

function FindCreatorsContent() {
  const searchParams = useSearchParams();
  const initialNiche = searchParams.get("niche") || "All";

  const [creators, setCreators] = useState<CreatorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [niche, setNiche] = useState(NICHES.includes(initialNiche) ? initialNiche : "All");
  const [minFollowers, setMinFollowers] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const qs = new URLSearchParams();
        if (niche !== "All") qs.set("niche", niche);
        if (minFollowers) qs.set("minFollowers", minFollowers);
        qs.set("limit", "50");
        const res = await apiRequest<{ success: boolean; data: { creators: CreatorCard[] } }>(`/api/profile/creators?${qs.toString()}`);
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
  }, [niche, minFollowers]);

  const filtered = creators.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.niches.some((n) => n.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <span className="inline-block text-xs font-semibold tracking-wide text-brand-indigo uppercase mb-2">
        Creator Marketplace
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827]">Find Creators</h1>
      <p className="text-[#667085] mt-2">Browse verified creators by niche, platform, followers and location.</p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or niche..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20"
          />
        </div>
        <select value={niche} onChange={(e) => setNiche(e.target.value)} className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm">
          {NICHES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <select value={minFollowers} onChange={(e) => setMinFollowers(e.target.value)} className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm">
          <option value="">Any followers</option>
          <option value="10000">10K+</option>
          <option value="50000">50K+</option>
          <option value="100000">100K+</option>
        </select>
      </div>

      {loading ? (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-56 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-sm text-[#667085]">No creators match your filters.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {filtered.map((c) => (
            <div
              key={c._id}
              className="rounded-xl border border-slate-100 shadow-sm bg-white overflow-hidden flex flex-col transition-all hover:shadow-lg hover:shadow-slate-200/70 hover:-translate-y-1"
            >
              <CreatorAvatar name={c.name} className="aspect-square text-2xl rounded-none" />
              <div className="p-3 flex-1 flex flex-col">
                <div className="flex items-center gap-1 text-sm font-semibold text-[#111827]">
                  {c.name}
                  {c.verified && <Badge className="px-1.5 py-0">✓</Badge>}
                </div>
                <div className="text-xs text-[#667085]">{c.niches[0] || "Creator"} · {c.location || "India"}</div>
                <div className="mt-2 text-xs text-slate-700 font-medium">{(c.followers / 1000).toFixed(0)}K followers</div>
                <div className="text-xs text-brand-success font-medium">{c.engagementRate}% engagement</div>
                <div className="text-xs text-[#667085] mt-1">From ₹{c.startingPrice.toLocaleString("en-IN")}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FindCreatorsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-sm text-[#667085]">Loading...</div>}>
      <FindCreatorsContent />
    </Suspense>
  );
}
