"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Users, MapPin, Search, IndianRupee } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { Badge } from "@/Components/ui/Badge";
import MarketplaceIllustration from "@/Components/MarketplaceIllustration";
import type { Campaign } from "@/types/campaign";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "budget", label: "Budget: High to Low" },
  { value: "deadline", label: "Deadline: Soonest" },
] as const;

function deliverableSummary(deliverables?: Record<string, number>) {
  if (!deliverables) return null;
  const parts = Object.entries(deliverables)
    .filter(([, count]) => (count || 0) > 0)
    .map(([key, count]) => `${count}x ${key.replace(/([A-Z])/g, " $1").trim()}`);
  return parts.length ? parts.join(", ") : null;
}

export default function PublicCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("newest");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest<{ success: boolean; data: { campaigns: Campaign[] } }>(`/api/campaigns?status=active&limit=30`);
        if (!cancelled) setCampaigns(res.data.campaigns);
      } catch {
        if (!cancelled) setCampaigns([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    campaigns.forEach((c) => (c.tags || []).forEach((t) => set.add(t)));
    return ["All", ...Array.from(set)];
  }, [campaigns]);

  const visible = useMemo(() => {
    let list = campaigns.filter((c) => {
      const brandName = typeof c.brand_id === "object" ? c.brand_id?.name : "";
      const haystack = `${c.title} ${c.description} ${brandName}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search.toLowerCase());
      const matchesCategory = category === "All" || (c.tags || []).includes(category);
      return matchesSearch && matchesCategory;
    });
    list = [...list].sort((a, b) => {
      if (sort === "budget") return (b.payment?.amount || b.budget) - (a.payment?.amount || a.budget);
      if (sort === "deadline") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return list;
  }, [campaigns, search, category, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative">
      <MarketplaceIllustration className="hidden lg:block absolute top-0 right-0 w-56 h-56 opacity-[0.08] pointer-events-none" />
      <span className="inline-block text-xs font-semibold tracking-wide text-brand-indigo uppercase mb-2">
        Campaign Marketplace
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827]">Open Campaigns</h1>
      <p className="text-[#667085] mt-2">Browse live briefs from brands looking for creators right now.</p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by campaign, brand, or keyword..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm">
          {categories.map((c) => (
            <option key={c} value={c}>{c === "All" ? "All categories" : c}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-10 text-sm text-[#667085]">
          {campaigns.length === 0 ? "No campaigns are open right now — check back soon." : "No campaigns match your filters."}
        </p>
      ) : (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((c) => {
            const brandName = typeof c.brand_id === "object" ? c.brand_id?.name : "Brand";
            const daysLeft = Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000));
            const budgetMin = c.budgetBidding?.budgetMin;
            const budgetMax = c.budgetBidding?.budgetMax ?? c.payment?.amount ?? c.budget;
            const location = c.creatorRequirements?.locationScope === "specific_cities" && c.creatorRequirements.specificCities.length
              ? c.creatorRequirements.specificCities.join(", ")
              : c.creatorRequirements?.locationScope === "any" || !c.creatorRequirements
                ? "Anywhere in India"
                : "National";
            const deliverables = deliverableSummary(c.deliverables as Record<string, number> | undefined);

            return (
              <div
                key={c._id}
                className="rounded-xl border border-slate-100 shadow-sm bg-white p-5 flex flex-col transition-all hover:shadow-lg hover:shadow-slate-200/70 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-semibold text-brand-indigo uppercase">{brandName}</div>
                  <Badge variant="success" className="shrink-0">{c.status === "active" ? "Active" : c.status}</Badge>
                </div>
                <div className="font-semibold text-[#111827] mt-1">{c.title}</div>
                <div className="text-xs text-[#667085] mt-1 line-clamp-2">{c.description}</div>

                {(c.tags || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(c.tags || []).slice(0, 3).map((t) => (
                      <Badge key={t} variant="outline" className="capitalize">{t}</Badge>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1 text-sm font-medium text-[#111827]">
                  <IndianRupee className="w-3.5 h-3.5 text-brand-success" />
                  {budgetMin && budgetMin !== budgetMax
                    ? `${budgetMin.toLocaleString("en-IN")} – ${budgetMax.toLocaleString("en-IN")}`
                    : budgetMax.toLocaleString("en-IN")}
                  <span className="text-xs text-[#667085] font-normal">budget</span>
                </div>

                {deliverables && <div className="mt-1 text-xs text-[#667085]">{deliverables}</div>}

                <div className="mt-2 flex items-center gap-1 text-xs text-[#667085]">
                  <MapPin className="w-3.5 h-3.5" /> {location}
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-[#667085]">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {daysLeft}d left to apply</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.requirements.platforms.join(", ")}</span>
                </div>

                {typeof c.applicationsCount === "number" && (
                  <div className="mt-1 text-xs text-[#667085]">
                    {c.applicationsCount} {c.applicationsCount === 1 ? "creator has" : "creators have"} applied
                  </div>
                )}

                <Link
                  href={`/creator/marketplace?campaign=${c._id}`}
                  className="mt-4 inline-flex items-center justify-center h-9 rounded-lg text-sm font-semibold bg-[#111827] text-white hover:bg-brand-indigo transition-colors"
                >
                  Apply Now
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
