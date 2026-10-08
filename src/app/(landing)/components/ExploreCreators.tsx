"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Sparkles, Palette, Dumbbell, Utensils, Plane, Laptop2, Shirt } from "lucide-react";
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

const CATEGORIES = [
  { label: "Fashion", icon: Shirt },
  { label: "Beauty", icon: Sparkles },
  { label: "Lifestyle", icon: Palette },
  { label: "Tech", icon: Laptop2 },
  { label: "Fitness", icon: Dumbbell },
  { label: "Food", icon: Utensils },
  { label: "Travel", icon: Plane },
];

function formatFollowers(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

export default function ExploreCreators() {
  const [creators, setCreators] = useState<CreatorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest<{ success: boolean; data: { creators: CreatorCard[] } }>(`/api/profile/creators?limit=6`);
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

  return (
    <section id="find-creators" className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <span className="inline-block text-xs font-semibold tracking-wide text-brand-indigo uppercase mb-2">
              Creator Discovery
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111827]">Explore creators</h2>
          </div>
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search creators by niche, location, or keyword..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(({ label, icon: Icon }) => (
            <Link
              key={label}
              href={`/find-creators?niche=${encodeURIComponent(label)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600 hover:border-brand-indigo/40 hover:text-brand-indigo transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
          <Link href="/find-creators" className="px-3 py-1.5 rounded-full text-xs font-semibold text-brand-indigo hover:text-brand-blue">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : creators.length === 0 ? (
          <p className="text-sm text-[#667085]">No creators found yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {creators
              .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.niches.some((n) => n.toLowerCase().includes(search.toLowerCase())))
              .map((c) => (
                <Link
                  href="/find-creators"
                  key={c._id}
                  className="group rounded-xl border border-slate-100 shadow-sm bg-white overflow-hidden flex flex-col transition-all hover:shadow-lg hover:shadow-slate-200/70 hover:-translate-y-1"
                >
                  <CreatorAvatar name={c.name} className="aspect-square text-2xl rounded-none" />
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="flex items-center gap-1 text-sm font-semibold text-[#111827]">
                      {c.name}
                      {c.verified && <Badge variant="default" className="px-1.5 py-0">✓</Badge>}
                    </div>
                    <div className="text-xs text-[#667085]">{c.niches[0] || "Creator"} · {c.location || "India"}</div>
                    <div className="mt-2 text-xs text-slate-700 font-medium">{formatFollowers(c.followers)} followers</div>
                    <div className="text-xs text-brand-success font-medium">{c.engagementRate}% engagement</div>
                    <div className="text-xs text-[#667085] mt-1">From ₹{c.startingPrice.toLocaleString("en-IN")}</div>
                    <span className="mt-3 w-full inline-flex items-center justify-center h-8 rounded-lg text-xs font-semibold bg-[#111827] text-white group-hover:bg-brand-indigo transition-colors">
                      View Profile
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}
